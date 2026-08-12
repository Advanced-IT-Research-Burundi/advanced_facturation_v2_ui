<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  ShoppingCart,
  User,
  Plus,
  Trash2,
  Minus,
  CreditCard,
  Save,
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
  savedCarts: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "add-client",
  "remove-from-cart",
  "update-quantity",
  "invoice-submitted",
  "save-cart",
  "restore-saved-cart",
  "delete-saved-cart",
]);

const selectedClient = ref(null);
const clientSearchText = ref("");
const selectedCurrency = ref("BIF");
const selectedPaymentType = ref("1");
const selectedSavedCartId = ref("");

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

const savedCartOptions = computed(() => {
  return [...props.savedCarts].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
});

const formatSavedCartLabel = (savedCart) => {
  const customerName = savedCart.customer?.customer_name || "Client non identifié";
  const total = formatPrice(Number(savedCart.total_ttc) || 0);
  return `${savedCart.identifier} - ${customerName} - ${total} ${savedCart.currency || "BIF"}`;
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

const saveCart = () => {
  if (props.cart.length === 0) {
    toast.warning("Le panier est vide.");
    return;
  }

  const validationErrors = validateCartItems();
  if (validationErrors.length > 0) {
    toast.error(formatValidationMessage(validationErrors), 7000);
    return;
  }

  emit("save-cart", {
    customer: selectedClient.value
      ? {
          id: selectedClient.value.id,
          customer_name: selectedClient.value.customer_name,
          customer_TIN: selectedClient.value.customer_TIN,
        }
      : null,
    currency: selectedCurrency.value,
    payment_type: selectedPaymentType.value,
    warehouse_id: props.warehouseId,
    total_ht: cartTotalHT.value,
    total_tva: cartTotalTVA.value,
    total_ttc: cartTotalTTC.value,
    items: props.cart.map((item) => ({ ...item })),
  });
};

const restoreSavedCart = () => {
  const savedCart = props.savedCarts.find((cart) => cart.id === selectedSavedCartId.value);
  if (!savedCart) return;

  const selectedCustomer = savedCart.customer?.id
    ? props.customers.find((customer) => customer.id === savedCart.customer.id)
    : null;

  selectedClient.value = selectedCustomer || savedCart.customer || null;
  clientSearchText.value = savedCart.customer?.customer_name || "";
  selectedCurrency.value = savedCart.currency || "BIF";
  selectedPaymentType.value = savedCart.payment_type || "1";
  emit("restore-saved-cart", savedCart);
  selectedSavedCartId.value = "";
};

const deleteSelectedSavedCart = () => {
  if (!selectedSavedCartId.value) return;
  emit("delete-saved-cart", selectedSavedCartId.value);
  selectedSavedCartId.value = "";
};

const clearClient = () => {
  selectedClient.value = null;
  clientSearchText.value = "";
};

defineExpose({ clearClient });
</script>

<template>
  <div class="col-12 col-lg-5 d-flex flex-column bg-white shadow-lg z-2 h-100 cart-panel">
    <div
      class="cart-header px-3 py-2 border-bottom d-flex justify-content-between align-items-center bg-primary text-white"
    >
      <div class="d-flex align-items-center gap-2">
        <ShoppingCart :size="20" />
        <h5 class="mb-0 fw-bold">Panier Actuel</h5>
      </div>
      <span class="badge bg-white text-primary fw-bold"
        >{{ cart.length }} Articles</span
      >
    </div>

    <div class="cart-client p-2 border-bottom bg-light position-relative">
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
        class="client-results position-absolute bg-white border rounded shadow-sm w-100 mt-1 overflow-auto"
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

    <div class="flex-grow-1 overflow-auto p-2 cart-items-area">
      <div v-if="cart.length === 0" class="text-center text-muted mt-5">
        <ShoppingCart :size="48" class="mb-3 opacity-25" />
        <p>Le panier est vide</p>
      </div>

      <table v-else class="table table-sm align-middle mb-0 cart-table">
        <thead class="sticky-top">
          <tr>
            <th>Produit</th>
            <th class="text-center">Quantité</th>
            <th class="text-end">Prix</th>
            <th class="text-end">Total</th>
            <th aria-label="Supprimer"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cart" :key="item.id">
            <td class="product-cell">
              <div class="cart-item-name text-truncate" :title="item.name">{{ item.name }}</div>
              <small v-if="item.stock !== undefined" class="stock-label">Stock: {{ item.stock }}</small>
            </td>
            <td>
              <input
                v-model.number="item.quantity"
                type="number"
                class="form-control form-control-sm text-center compact-input"
                :class="{ 'is-invalid': !item.quantity || item.quantity <= 0 }"
                min="1"
                step="1"
                required
              />
            </td>
            <td>
              <input
                v-model.number="item.price"
                type="number"
                class="form-control form-control-sm text-end compact-input"
                :class="{ 'is-invalid': !item.price || item.price <= 0 }"
                min="0.01"
                step="0.01"
                required
              />
            </td>
            <td class="text-end line-total">{{ formatPrice(getItemTTC(item)) }}</td>
            <td class="text-end">
              <button @click="$emit('remove-from-cart', item.id)" class="btn btn-sm btn-outline-danger p-1 cart-delete-btn" title="Retirer du panier">
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="cart-footer p-2 border-top bg-light mt-auto">
      <!-- Récapitulatif TVA -->
      <div class="cart-summary mb-2 px-2 py-1 bg-white rounded border">
        <div class="d-flex justify-content-between text-muted small">
          <span>Total Hors Taxes (HT)</span>
          <span>{{ formatPrice(cartTotalHT) }} {{ selectedCurrency }}</span>
        </div>
        <div class="d-flex justify-content-between text-info small">
          <span>Total TVA</span>
          <span>{{ formatPrice(cartTotalTVA) }} {{ selectedCurrency }}</span>
        </div>
        <div class="d-flex justify-content-between pt-1 border-top">
          <span class="fw-bold text-dark">Total TTC</span>
          <span class="fw-bold text-primary"
            >{{ formatPrice(cartTotalTTC) }} {{ selectedCurrency }}</span
          >
        </div>
      </div>

      <div class="d-grid gap-1">
        <div class="row g-1 mb-1">
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

        <div v-if="savedCartOptions.length" class="saved-cart-row d-flex gap-1">
          <select v-model="selectedSavedCartId" class="form-select form-select-sm">
            <option value="">Factures enregistrées</option>
            <option v-for="savedCart in savedCartOptions" :key="savedCart.id" :value="savedCart.id">
              {{ formatSavedCartLabel(savedCart) }}
            </option>
          </select>
          <button
            class="btn btn-outline-secondary btn-sm"
            :disabled="!selectedSavedCartId"
            @click="restoreSavedCart"
            title="Reprendre cette facture"
          >
            Reprendre
          </button>
          <button
            class="btn btn-outline-danger btn-sm px-2"
            :disabled="!selectedSavedCartId"
            @click="deleteSelectedSavedCart"
            title="Supprimer cette facture enregistrée"
          >
            <Trash2 :size="14" />
          </button>
        </div>

        <div class="cart-actions-grid">
          <button
            @click="saveCart"
            class="btn btn-outline-primary fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm cart-submit-btn"
            :disabled="isSubmitting || cart.length === 0"
          >
            <Save :size="20" />
            Enregistrer la facture
          </button>

          <button
            @click="submitInvoice"
            class="btn btn-primary fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm cart-submit-btn"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" :size="20" class="animate-spin" />
            <CreditCard v-else :size="24" />
            {{ isSubmitting ? "Traitement..." : "Valider la facture" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hover-bg-light:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.min-w-0 {
  min-width: 0;
}
.cart-items-area {
  min-height: 0;
}
.cart-header {
  min-height: 46px;
}
.cart-client .input-group {
  min-height: 34px;
}
.cart-client {
  z-index: 1050;
}
.client-results {
  top: 100%;
  z-index: 1050;
}
.cart-items-area {
  position: relative;
  z-index: 1;
}
.cart-table thead.sticky-top {
  z-index: 2;
}
.cart-footer {
  flex-shrink: 0;
}
.cart-summary {
  line-height: 1.45;
}
.cart-table {
  table-layout: fixed;
  font-size: 0.78rem;
}
.cart-table thead {
  background: #f1f5f9;
  box-shadow: inset 0 -1px 0 #dbe2ea;
}
.cart-table th {
  padding: 0.4rem 0.3rem;
  color: #334155;
  font-size: 0.72rem;
  white-space: nowrap;
}
.cart-table td {
  padding: 0.3rem;
  border-color: #edf0f3;
}
.cart-table th:nth-child(1) { width: 36%; }
.cart-table th:nth-child(2) { width: 19%; }
.cart-table th:nth-child(3) { width: 19%; }
.cart-table th:nth-child(4) { width: 20%; }
.cart-table th:nth-child(5) { width: 6%; }
.product-cell { min-width: 0; }
.cart-item-name {
  font-size: 0.82rem;
  line-height: 1.1;
  font-weight: 700;
}
.cart-delete-btn {
  line-height: 1;
}
.compact-input {
  height: 27px;
  min-width: 0;
  padding: 0.15rem 0.3rem;
  font-size: 0.78rem;
}
.stock-label {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 5px;
  border-radius: 3px;
  background: #e6f7ee;
  color: #16794a;
  font-weight: 700;
}
.line-total {
  color: #168154;
  font-weight: 700;
  white-space: nowrap;
}
.cart-submit-btn {
  min-height: 36px;
}
.cart-actions-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.4rem;
}
.cart-actions-grid .btn {
  min-width: 0;
  white-space: normal;
  line-height: 1.15;
}
.saved-cart-row {
  min-width: 0;
}
.saved-cart-row .form-select {
  min-width: 0;
}
@media (max-width: 575.98px) {
  .cart-actions-grid {
    grid-template-columns: 1fr;
  }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
