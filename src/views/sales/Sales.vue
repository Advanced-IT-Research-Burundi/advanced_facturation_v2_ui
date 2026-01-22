<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
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
import ProformaDetailsModal from "./ProformaDetailsModal.vue";
import InvoicePrintModal from "./InvoicePrintModal.vue";
import InvoicesList from "./InvoicesList.vue";
import Reports from "./Reports.vue";
import PaymentModal from "./PaymentModal.vue";
import ClientFormModal from "./ClientFormModal.vue";

const store = useStore();

// --- GLOBAL STATE ---
const activeTab = ref("POS");
const isSubmitting = ref(false);
const customers = ref([]);
const cart = ref(JSON.parse(localStorage.getItem("pos_cart") || "[]"));
const selectedWarehouseId = ref(null);

// --- PRINT MODAL STATE ---
const showPrintModal = ref(false);
const invoiceToPrint = ref(null);
const currentCompany = ref(null);

// --- PAYMENT MODAL STATE ---
const showPaymentModal = ref(false);
const invoiceToPay = ref(null);

// --- CLIENT FORM MODAL STATE ---
const showClientForm = ref(false);

// Handle warehouse change from POS
const handleStockChanged = (warehouseId) => {
  selectedWarehouseId.value = warehouseId;
};

// ... (other functions)

// Handle view invoice from list
const handleViewInvoice = (invoice) => {
  invoiceToPrint.value = invoice;
  showPrintModal.value = true;
};

// Handle print invoice from list
const handlePrintInvoice = (invoice) => {
  invoiceToPrint.value = invoice;
  showPrintModal.value = true;
};

// Close print modal
const closePrintModal = () => {
    showPrintModal.value = false;
    invoiceToPrint.value = null;
};

// Handle pay invoice
const handlePayInvoice = (invoice) => {
    invoiceToPay.value = invoice;
    showPaymentModal.value = true;
};

const closePaymentModal = () => {
    showPaymentModal.value = false;
    invoiceToPay.value = null;
};

const handlePaymentAdded = () => {
    // Optionally trigger invoice list refresh via a global event bus or similar if desired.
    // For now we assume the user will manually refresh the list if needed.
};

// Handle cancel invoice
const handleCancelInvoice = async (invoice) => {
  const motif = prompt(
    `Annuler la facture ${invoice.invoice_number}?\n\nVeuillez saisir le motif d'annulation (minimum 10 caractères):`
  );
  
  if (!motif) return;
  
  if (motif.length < 10) {
    alert("Le motif doit contenir au moins 10 caractères.");
    return;
  }

  const restoreStock = confirm("Voulez-vous restaurer le stock après annulation?");

  try {
    const response = await api.post(`/invoices/${invoice.id}/cancel`, {
      motif: motif,
      restore_stock: restoreStock
    });

    if (response.data.success) {
      alert(`Facture annulée avec succès!\n${restoreStock ? 'Stock restauré.' : ''}`);
      // Refresh la liste (optionnel: émettre un événement ou recharger)
      window.location.reload();
    } else {
      alert("Erreur: " + (response.data.message || "Annulation échouée"));
    }
  } catch (error) {
    console.error("Erreur annulation:", error);
    alert("Erreur lors de l'annulation: " + (error.response?.data?.message || error.message));
  }
};

// Handle client created from modal
const handleClientCreated = (newClient) => {
  customers.value.push(newClient);
  showClientForm.value = false;
};

// Open client form modal
const openClientForm = () => {
  showClientForm.value = true;
};

const fetchCompany = async () => {
  try {
    const response = await api.get("/companies");
    if (response.data.success && response.data.data.data?.length > 0) {
      currentCompany.value = response.data.data.data[0];
    }
  } catch (e) {
    console.error("Error fetching company", e);
  }
};

// --- PROFORMA STATE ---
// Map state from Vuex
const proformas = computed(() => store.getters["proformats/allProformats"]);
const isLoadingProformas = computed(() => store.getters["proformats/isLoading"]);
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

const fetchProformas = () => {
  store.dispatch("proformats/fetchProformas");
};

onMounted(() => {
  fetchCustomers();
  fetchProformas();
  fetchCompany();
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
      const createdInvoice = response.data.data?.invoice || response.data.data;

      // Show print modal with created invoice
      invoiceToPrint.value = createdInvoice;
      showPrintModal.value = true;

      if (payload.invoice_action === "POS") {
        cart.value = [];
      }
    } else {
      alert("Erreur: " + response.data.message);
    }
  } catch (e) {
    console.error("Erreur lors de la soumission:", e);
    alert("Erreur lors de la soumission.");
  } finally {
    isSubmitting.value = false;
  }
};



const handleProformaSave = async (payload) => {
  isSubmitting.value = true;
  let result;
  
  if (payload.id) {
      // Update
      result = await store.dispatch("proformats/updateProforma", {
          id: payload.id, 
          data: payload.data || payload // payload might be {id, data} or just data depending on emitter
      });
  } else {
      // Create
      result = await store.dispatch("proformats/createProforma", payload);
  }

  isSubmitting.value = false;
  
  if (result.success) {
      showProformaForm.value = false;
      // Alert is optional, maybe just close modal
  } else {
      alert(result.message || "Erreur lors de l'enregistrement");
  }
};

const handleProformaDelete = async (proforma) => {
    const result = await store.dispatch("proformats/deleteProforma", proforma.id || proforma.invoice_number); // Check what ID we use
    if (!result.success) {
        alert("Erreur lors de la suppression");
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

// --- VIEW PROFORMA LOGIC ---
const showProformaDetails = ref(false);
const selectedProforma = ref(null);

const handleViewProforma = (proforma) => {
  selectedProforma.value = proforma;
  showProformaDetails.value = true;
};

const closeProformaDetails = () => {
    showProformaDetails.value = false;
    selectedProforma.value = null;
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
        <POS v-if="activeTab === 'POS'" @add-to-cart="addToCart" @stock-changed="handleStockChanged" />
        <InvoiceService
          v-else-if="activeTab === 'Service'"
          :is-submitting="isSubmitting"
          :customers="customers"
          @submit="handleInvoiceSubmit"
        />
        <ProformaService
          v-else-if="activeTab === 'Proforma'"
          :proformas="proformas"
          :is-loading="isLoadingProformas"
          v-model:search-text="searchProforma"
          @create="openNewProforma"
          @edit="handleEditProforma"
          @delete="handleProformaDelete"
          @view="handleViewProforma"
        />
        <Refund
          v-else-if="activeTab === 'Caution'"
          :is-submitting="isSubmitting"
          :customers="customers"
          @submit="handleInvoiceSubmit"
        />
        <FactureAvoir
          v-else-if="activeTab === 'Avoir'"
          :is-submitting="isSubmitting"
          :customers="customers"
          @submit="handleInvoiceSubmit"
        />
        <InvoicesList
          v-else-if="activeTab === 'Factures'"
          @view="handleViewInvoice"
          @print="handlePrintInvoice"
          @pay="handlePayInvoice"
          @cancel="handleCancelInvoice"
        />
        <Reports v-else-if="activeTab === 'Rapports'" />
      </div>

      <!-- Right Panel (Cart - only for POS) -->
      <CartPanel
        v-if="activeTab === 'POS'"
        :cart="cart"
        :customers="customers"
        :is-submitting="isSubmitting"
        :warehouse-id="selectedWarehouseId"
        @remove-from-cart="removeFromCart"
        @update-quantity="updateQuantity"
        @invoice-submitted="handleInvoiceSubmit"
        @add-client="openClientForm"
      />
    </div>

    <!-- Modals -->
    <ProformaFormModal
      v-if="showProformaForm"
      :show="showProformaForm"
      :is-editing="isEditingProforma"
      :is-submitting="isSubmitting"
      :initial-data="editingProformaData"
      :customers="customers"
      @close="showProformaForm = false"
      @save="handleProformaSave"
    />

    <!-- MODAL DÉTAILS/APERÇU PROFORMA -->
    <ProformaDetailsModal
      :show="showProformaDetails"
      :proforma="selectedProforma"
      @close="closeProformaDetails"
    />

    <!-- MODAL IMPRESSION FACTURE -->
    <InvoicePrintModal
      :show="showPrintModal"
      :invoice="invoiceToPrint"
      :company="currentCompany"
      @close="closePrintModal"
    />

    <!-- MODAL PAIEMENT -->
    <PaymentModal
      :show="showPaymentModal"
      :invoice="invoiceToPay"
      @close="closePaymentModal"
      @payment-added="handlePaymentAdded"
    />

    <!-- MODAL AJOUT CLIENT -->
    <ClientFormModal
      :show="showClientForm"
      @close="showClientForm = false"
      @client-created="handleClientCreated"
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
