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
const selectedPaymentType = ref("cash");

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

// Calcul du total HT (Hors Taxes)
const cartTotalHT = computed(() => {
  return props.cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
});

// Calcul du total TVA
const cartTotalTVA = computed(() => {
  return props.cart.reduce((total, item) => {
    const lineHT = item.price * item.quantity;
    const vatRate = item.vat_rate ?? 18;
    return total + (lineHT * vatRate) / 100;
  }, 0);
});

// Calcul du total TTC (Toutes Taxes Comprises)
const cartTotalTTC = computed(() => {
  return cartTotalHT.value + cartTotalTVA.value;
});

// Calculer TVA par ligne
const getItemVAT = (item) => {
  const lineHT = item.price * item.quantity;
  const vatRate = item.vat_rate ?? 18;
  return (lineHT * vatRate) / 100;
};

// Calculer TTC par ligne
const getItemTTC = (item) => {
  const lineHT = item.price * item.quantity;
  return lineHT + getItemVAT(item);
};

const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0";
};

const submitInvoice = async () => {
  if (props.cart.length === 0) return;
  if (!selectedClient.value) {
    toast.warning("Veuillez sélectionner un client.");
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
        item_designation: item.name,
        item_quantity: item.quantity,
        item_price: item.price,
        vat: item.vat_rate ?? 18,
        item_ct: 0,
        item_tl: 0,
      })),
    };

    emit("invoice-submitted", payload);
  } catch (error) {
    console.error("Erreur lors de la préparation de la facture:", error);
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
          class="cart-item p-2 border rounded-3 bg-white"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="fw-bold text-truncate pe-2" :title="item.name">
                {{ item.name }}
              </div>
              <span class="badge bg-info text-white small">
                TVA {{ item.vat_rate ?? 18 }}%
              </span>
            </div>
            <button
              @click="$emit('remove-from-cart', item.id)"
              class="btn btn-sm btn-link text-danger p-0 align-self-start"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <div class="d-flex flex-column gap-2 mt-1">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-1">
                <button
                  @click="$emit('update-quantity', item.id, -1)"
                  class="btn btn-sm btn-light border p-1"
                >
                  <Minus :size="14" />
                </button>
                <input
                  type="number"
                  v-model.number="item.quantity"
                  class="form-control form-control-sm text-center p-0 fw-bold"
                  style="width: 45px; height: 32px"
                  min="1"
                />
                <button
                  @click="$emit('update-quantity', item.id, 1)"
                  class="btn btn-sm btn-light border p-1"
                >
                  <Plus :size="14" />
                </button>
              </div>
              <div class="input-group input-group-sm" style="width: 130px">
                <input
                  type="number"
                  v-model.number="item.price"
                  class="form-control text-end pe-1 fw-bold text-primary"
                  placeholder="Prix"
                />
                <span class="input-group-text px-1 small">{{ selectedCurrency }}</span>
              </div>
            </div>
            <!-- Détails TVA par ligne -->
            <div class="border-top pt-1 mt-1 small">
              <div class="d-flex justify-content-between text-muted">
                <span>HT:</span>
                <span>{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
              <div class="d-flex justify-content-between text-info">
                <span>TVA ({{ item.vat_rate ?? 18 }}%):</span>
                <span>{{ formatPrice(getItemVAT(item)) }}</span>
              </div>
              <div class="d-flex justify-content-between fw-bold text-dark">
                <span>TTC:</span>
                <span>{{ formatPrice(getItemTTC(item)) }} {{ selectedCurrency }}</span>
              </div>
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
            </select>
          </div>
          <div class="col-6 d-flex align-items-center">
            <label class="form-label small text-muted pe-1 mb-0"
              >Paiement</label
            >
            <select v-model="selectedPaymentType" class="form-select form-select-sm">
              <option value="cash">Espèces</option>
              <option value="mobile">Mobile</option>
              <option value="banque">Banque</option>
            </select>
          </div>
        </div>

        <button
          @click="submitInvoice"
          class="btn btn-primary fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
          :disabled="cart.length === 0 || isSubmitting || !selectedClient"
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
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
