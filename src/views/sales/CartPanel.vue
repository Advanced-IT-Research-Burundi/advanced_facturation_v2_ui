<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  ShoppingCart,
  User,
  Plus,
  Trash2,
  Minus,
  CreditCard,
  Loader2,
  Percent,
} from "lucide-vue-next";
import api from "@/services/api";
import { useToast } from '@/composables/useToast';

const toast = useToast();

const props = defineProps({
  cart: {
    type: Array,
    required: true,
  },
  customers: {
    type: Array,
    required: true,
  },
  isSubmitting: Boolean,
  warehouseId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits([
  "remove-from-cart",
  "update-quantity",
  "invoice-submitted",
]);

const selectedClient = ref(null);
const clientSearchText = ref("");
const selectedCurrency = ref("BIF");
const selectedPaymentType = ref("1");

const filteredCustomers = computed(() => {
  if (!clientSearchText.value) return [];
  return props.customers.filter(
    (c) =>
      c.customer_name
        .toLowerCase()
        .includes(clientSearchText.value.toLowerCase()) ||
      c.customer_TIN?.includes(clientSearchText.value)
  );
});

const selectCustomer = (customer) => {
  selectedClient.value = customer;
  clientSearchText.value = customer.customer_name;
};

const getItemPrice = (item) => {
  return Number(item.price || item.unit_price) || 0;
};

watch(
  () => props.cart,
  (cartItems) => {
    cartItems.forEach((item) => {
      const unitPrice = Number(item.unit_price) || 0;
      if ((!item.price || Number(item.price) <= 0) && unitPrice > 0) {
        item.price = unitPrice;
      }
    });
  },
  { deep: true, immediate: true }
);

// Calcul du total HT (Hors Taxes)
const cartTotalHT = computed(() => {
  return props.cart.reduce(
    (total, item) => total + getItemPrice(item) * item.quantity,
    0
  );
});

// Calcul du total TVA
const cartTotalTVA = computed(() => {
  return props.cart.reduce((total, item) => {
    const lineHT = getItemPrice(item) * item.quantity;
    const vatRate = item.vat_rate ?? 0;
    return total + (lineHT * vatRate) / 100;
  }, 0);
});

// Calcul du total TTC (Toutes Taxes Comprises)
const cartTotalTTC = computed(() => {
  return cartTotalHT.value + cartTotalTVA.value;
});

// Calculer TVA par ligne
const getItemVAT = (item) => {
  const lineHT = getItemPrice(item) * item.quantity;
  const vatRate = item.vat_rate ?? 0;
  return (lineHT * vatRate) / 100;
};

// Calculer TTC par ligne
const getItemTTC = (item) => {
  const lineHT = getItemPrice(item) * item.quantity;
  return lineHT + getItemVAT(item);
};

const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0";
};

const formatValidationMessage = (errors) => {
  const visibleErrors = errors.slice(0, 3).join(" • ");
  const remainingCount = errors.length - 3;
  return remainingCount > 0
    ? `${visibleErrors} • +${remainingCount} autre(s) erreur(s)`
    : visibleErrors;
};

// Valider les articles du panier avant soumission
const validateCartItems = () => {
  const errors = [];
  
  props.cart.forEach((item, index) => {
    // Vérifier la quantité
    if (!item.quantity || Number(item.quantity) <= 0) {
      errors.push(`Article ${index + 1} (${item.name}): Quantité invalide ou manquante`);
    }
    
    // Vérifier le prix
    if (getItemPrice(item) <= 0) {
      errors.push(`Article ${index + 1} (${item.name}): Prix manquant ou invalide`);
    }
    
    // Vérifier les propriétés essentielles
    if (!item.id) {
      errors.push(`Article ${index + 1}: ID produit manquant`);
    }
    if (!item.name) {
      errors.push(`Article ${index + 1}: Nom du produit manquant`);
    }
  });
  
  return errors;
};

const submitInvoice = async () => {
  if (props.cart.length === 0) {
    toast.warning("Le panier est vide.");
    return;
  }
  
  if (!selectedClient.value) {
    toast.warning("Veuillez sélectionner un client.");
    return;
  }

  // Valider les articles
  const validationErrors = validateCartItems();
  if (validationErrors.length > 0) {
    toast.error(formatValidationMessage(validationErrors), 7000);
    return;
  }

  try {
    const payload = {
      invoice_type: "FN",
      invoice_action: "POS",
      invoice_currency: selectedCurrency.value,
      payment_type: selectedPaymentType.value,
      customer_id: selectedClient.value.id,
      warehouse_id: props.warehouseId,
      items: props.cart.map((item) => ({
        product_id: item.id,
        warehouse_product_id: item.warehouse_product_id,
        item_designation: item.name,
        item_quantity: Number(item.quantity),
        item_price: getItemPrice(item),
        vat: item.vat_rate ?? 0,
        item_ct: item.item_ct ?? 0,
        item_tl: item.item_tl ?? 0,
      })),
    };

    emit("invoice-submitted", payload);
  } catch (error) {
    console.error("Erreur lors de la préparation de la facture:", error);
    toast.error("Erreur lors de la préparation de la facture");
  }
};

const clearClient = () => {
  selectedClient.value = null;
  clientSearchText.value = "";
};

defineExpose({ clearClient });
</script>

<template>
  <div class="col-12 col-lg-4 d-flex flex-column bg-white shadow-lg z-2 h-100">
    <div
      class="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white"
    >
      <div class="d-flex align-items-center gap-2">
        <ShoppingCart :size="20" />
        <h5 class="mb-0 fw-bold">Panier Actuel</h5>
      </div>
      <span class="badge bg-white text-primary fw-bold fs-6"
        >{{ cart.length }} Articles</span
      >
    </div>

    <div class="p-3 border-bottom bg-light position-relative">
      <div class="input-group">
        <span class="input-group-text bg-white border-end-0 text-muted">
          <User :size="18" :class="{ 'text-success': selectedClient }" />
        </span>
        <input
          v-model="clientSearchText"
          class="form-control border-start-0 ps-0"
          placeholder="Rechercher du client..."
        />
        <button class="btn btn-outline-primary" @click="$emit('add-client')">
          <Plus :size="18" />
        </button>
      </div>

      <div
        v-if="clientSearchText && !selectedClient && filteredCustomers.length"
        class="position-absolute bg-white border rounded shadow-sm w-100 mt-1 z-3 overflow-auto"
        style="max-height: 200px; left: 0"
      >
        <div
          v-for="customer in filteredCustomers"
          :key="customer.id"
          @click="selectCustomer(customer)"
          class="p-2 cursor-pointer hover-bg-light border-bottom"
        >
          <div class="fw-bold">{{ customer.customer_name }}</div>
          <small class="text-muted"
            >TIN: {{ customer.customer_TIN || "N/A" }}</small
          >
        </div>
      </div>

      <div
        v-if="selectedClient"
        class="mt-1 px-1 d-flex justify-content-between align-items-center"
      >
        <small class="text-success fw-bold"
          >Identifié: {{ selectedClient.customer_name }}</small
        >
        <button @click="clearClient" class="btn btn-sm text-danger p-0">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <div class="flex-grow-1 overflow-auto p-3">
      <div v-if="cart.length === 0" class="text-center text-muted mt-5">
        <ShoppingCart :size="48" class="mb-3 opacity-25" />
        <p>Le panier est vide</p>
      </div>

      <div v-else class="d-flex flex-column gap-2">
        <div
          v-for="item in cart"
          :key="item.id"
          class="cart-item px-2 py-1 border rounded-2 bg-white"
        >
          <div class="cart-item-row d-flex justify-content-between align-items-center gap-2">
            <div class="min-w-0 flex-grow-1">
              <div class="cart-item-name fw-semibold text-truncate" :title="item.name">
                {{ item.name }}
              </div>
            </div>
            <button
              @click="$emit('remove-from-cart', item.id)"
              class="btn btn-sm btn-link text-danger p-0 cart-delete-btn"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <div class="cart-item-row d-flex align-items-center justify-content-between gap-2">
            <div class="quantity-control d-flex align-items-center gap-1">
              <button
                @click="$emit('update-quantity', item.id, -1)"
                class="btn btn-sm btn-light border p-0"
              >
                <Minus :size="14" />
              </button>
              <input
                type="number"
                v-model.number="item.quantity"
                class="form-control form-control-sm text-center p-0 fw-bold quantity-input"
                :class="{ 'is-invalid': !item.quantity || item.quantity <= 0 }"
                min="1"
                step="1"
                required
              />
              <button
                @click="$emit('update-quantity', item.id, 1)"
                class="btn btn-sm btn-light border p-0"
              >
                <Plus :size="14" />
              </button>
            </div>
            <div class="input-group input-group-sm price-input-group">
              <input
                type="number"
                v-model.number="item.price"
                class="form-control text-end pe-1 fw-bold text-primary"
                :class="{ 'is-invalid': !item.price || item.price <= 0 }"
                placeholder="Prix"
                min="0.01"
                step="0.01"
                required
              />
              <span class="input-group-text px-1 small">{{ selectedCurrency }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-3 border-top bg-light mt-auto">
      <!-- Récapitulatif TVA -->
      <div class="mb-3 p-2 bg-white rounded border">
        <div class="d-flex justify-content-between mb-1 text-muted small">
          <span>Total Hors Taxes (HT)</span>
          <span>{{ formatPrice(cartTotalHT) }} {{ selectedCurrency }}</span>
        </div>
        <div class="d-flex justify-content-between mb-1 text-info small">
          <span>Total TVA</span>
          <span>{{ formatPrice(cartTotalTVA) }} {{ selectedCurrency }}</span>
        </div>
        <div class="d-flex justify-content-between pt-1 border-top">
          <span class="fs-6 fw-bold text-dark">Total TTC</span>
          <span class="fs-6 fw-bold text-primary"
            >{{ formatPrice(cartTotalTTC) }} {{ selectedCurrency }}</span
          >
        </div>
      </div>

      <div class="d-grid gap-2">
        <div class="row g-2 mb-2">
          <div class="col-6 d-flex align-items-center">
            <label class="form-label small text-muted pe-1 mb-0">Devise</label>
            <select v-model="selectedCurrency" class="form-select form-select-sm">
              <option value="BIF">BIF</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div class="col-6 d-flex align-items-center">
            <label class="form-label small text-muted pe-1 mb-0"
              >Paiement</label
            >
            <select v-model="selectedPaymentType" class="form-select form-select-sm">
              <option value="1">Espèces</option>
              <option value="2">Banque</option>
              <option value="3">À crédit</option>
              <option value="4">Autres</option>
            </select>
          </div>
        </div>

        <button
          @click="submitInvoice"
          class="btn btn-primary fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" :size="20" class="animate-spin" />
          <CreditCard v-else :size="24" />
          {{ isSubmitting ? "Traitement..." : "Valider la facture" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.z-3 {
  z-index: 1030;
}
.hover-bg-light:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.cart-item {
  border-color: #e9ecef !important;
}
.cart-item-row {
  min-height: 28px;
}
.min-w-0 {
  min-width: 0;
}
.cart-item-name {
  font-size: 0.86rem;
  line-height: 1.1;
}
.cart-delete-btn {
  width: 20px;
  height: 20px;
}
.quantity-control .btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.quantity-input {
  width: 70px;
  height: 26px;
}
.price-input-group {
  width: 152px;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
