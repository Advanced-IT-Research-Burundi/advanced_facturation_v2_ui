<script setup>
import { ref, onMounted, watch } from "vue";
import api from "@/services/api";

// Child Components
import SalesHeader from "./SalesHeader.vue";
import POS from "./POS.vue";
import CartPanel from "./CartPanel.vue";
import InvoiceService from "./InvoiceService.vue";
import ProformaService from "./ProformaService.vue";
import ProformaFormModal from "./ProformaFormModal.vue";
import FactureAvoir from "./FactureAvoir.vue";
import Refund from "./Refund.vue";

// --- GLOBAL STATE ---
const activeTab = ref("POS");
const isSubmitting = ref(false);
const customers = ref([]);
const cart = ref(JSON.parse(localStorage.getItem("pos_cart") || "[]"));

// --- PROFORMA STATE ---
const proformas = ref([]);
const isLoadingProformas = ref(false);
const searchProforma = ref("");
const showProformaForm = ref(false);
const isEditingProforma = ref(false);
const editingProformaData = ref(null);

// --- INITIALIZATION ---
const fetchCustomers = async () => {
  try {
    const response = await api.get("/customers");
    if (response.data.success) customers.value = response.data.data.data;
  } catch (e) {
    console.error("Error fetching customers", e);
  }
};

const fetchProformas = async () => {
  isLoadingProformas.value = true;
  try {
    const response = await api.get("/invoices");
    if (response.data.success) {
      proformas.value = response.data.data.data
        .filter((i) => i.invoice_type === "FP")
        .map((i) => ({
          id: i.invoice_number,
          date: i.invoice_date,
          client_number: i.customer?.customer_TIN || "N/A",
          client_name: i.customer_name,
          currency: i.invoice_currency,
          totals: {
            total_ht: i.invoice_amount_nvat,
            total_tva: i.invoice_vat_amount,
            total_ttc: i.invoice_total_amount,
          },
          status: "En attente",
          items: i.invoice_items.map((item) => ({
            description: item.item_designation,
            quantity: item.item_quantity,
            unit_price_ht: item.item_price,
            tva_rate: item.vat,
            total_ttc: item.item_total_amount,
          })),
        }));
    }
  } catch (e) {
    console.error("Error fetching proformas", e);
  } finally {
    isLoadingProformas.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
  fetchProformas();
});

// --- CART LOGIC ---
const addToCart = (product) => {
  const existing = cart.value.find((i) => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.value.push({ ...product, quantity: 1 });
};

const updateQuantity = (id, delta) => {
  const item = cart.value.find((i) => i.id === id);
  if (item && item.quantity + delta > 0) item.quantity += delta;
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter((i) => i.id !== id);
};

watch(
  cart,
  (newCart) => {
    localStorage.setItem("pos_cart", JSON.stringify(newCart));
  },
  { deep: true }
);

// --- SUBMISSION LOGIC ---
const handleInvoiceSubmit = async (payload) => {
  isSubmitting.value = true;
  try {
    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      alert("Succès !");
      if (payload.invoice_action === "POS") {
        cart.value = [];
        // Optional: refresh POS products if we had a ref
      }
      fetchProformas();
    } else {
      alert("Erreur: " + response.data.message);
    }
  } catch (e) {
    alert("Erreur lors de la soumission.");
  } finally {
    isSubmitting.value = false;
  }
};

const openNewProforma = () => {
  isEditingProforma.value = false;
  editingProformaData.value = null;
  showProformaForm.value = true;
};

const handleEditProforma = (data) => {
  isEditingProforma.value = true;
  editingProformaData.value = data;
  showProformaForm.value = true;
};
</script>

<template>
  <div class="d-flex flex-column overflow-hidden h-100" style="margin: -1.5rem">
    <SalesHeader v-model="activeTab" />

    <div class="row flex-grow-1 g-0 overflow-hidden">
      <!-- Main Content Area -->
      <div
        class="d-flex flex-column bg-light border-end overflow-hidden"
        :class="activeTab === 'POS' ? 'col-12 col-lg-8' : 'col-12'"
      >
        <POS v-if="activeTab === 'POS'" @add-to-cart="addToCart" />
        <InvoiceService
          v-else-if="activeTab === 'Service'"
          :is-submitting="isSubmitting"
          @submit="handleInvoiceSubmit"
        />
        <ProformaService
          v-else-if="activeTab === 'Proforma'"
          :proformas="proformas"
          :is-loading="isLoadingProformas"
          v-model:search-text="searchProforma"
          @create="openNewProforma"
          @edit="handleEditProforma"
        />
        <Refund v-else-if="activeTab === 'Caution'" />
        <FactureAvoir v-else-if="activeTab === 'Avoir'" />
      </div>

      <!-- Right Panel (Cart - only for POS) -->
      <CartPanel
        v-if="activeTab === 'POS'"
        :cart="cart"
        :customers="customers"
        :is-submitting="isSubmitting"
        @remove-from-cart="removeFromCart"
        @update-quantity="updateQuantity"
        @invoice-submitted="handleInvoiceSubmit"
      />
    </div>

    <!-- Modals -->
    <ProformaFormModal
      v-if="showProformaForm"
      :show="showProformaForm"
      :is-editing="isEditingProforma"
      :is-submitting="isSubmitting"
      :initial-data="editingProformaData"
      @close="showProformaForm = false"
      @save="handleInvoiceSubmit"
    />
  </div>
</template>

<style>
.cursor-pointer {
  cursor: pointer;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
