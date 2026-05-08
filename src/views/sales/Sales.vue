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
const invoiceListKey = ref(0);

// --- PRINT MODAL STATE ---
const showPrintModal = ref(false);
const invoiceToPrint = ref(null);
const currentCompany = ref(null);

// --- PAYMENT MODAL STATE ---
const showPaymentModal = ref(false);
const invoiceToPay = ref(null);

// --- CLIENT FORM MODAL STATE ---
const showClientForm = ref(false);

// --- CANCEL MODAL STATE ---
const showCancelModal = ref(false);
const cancelTarget = ref(null);
const cancelMotif = ref('');
const cancelRestoreStock = ref(true);
const cancelError = ref('');

// --- TOAST NOTIFICATION STATE ---
const toastMessage = ref('');
const toastType = ref('success');
const showToast = ref(false);

const showNotification = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 4000);
};

const fetchInvoices = () => {
  invoiceListKey.value++;
};

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
  fetchInvoices();
};

// Handle cancel invoice
const openCancelModal = (invoice) => {
  cancelTarget.value = invoice;
  cancelMotif.value = '';
  cancelRestoreStock.value = true;
  cancelError.value = '';
  showCancelModal.value = true;
};

const confirmCancelInvoice = async () => {
  if (!cancelMotif.value || cancelMotif.value.length < 10) {
    cancelError.value = 'Le motif doit contenir au moins 10 caractères.';
    return;
  }
  cancelError.value = '';
  try {
    await api.post(`/invoices/${cancelTarget.value.id}/cancel`, {
      motif: cancelMotif.value,
      restore_stock: cancelRestoreStock.value,
    });
    showCancelModal.value = false;
    cancelTarget.value = null;
    showNotification('Facture annulée avec succès.');
    fetchInvoices();
  } catch (err) {
    cancelError.value = err.response?.data?.message || "Erreur lors de l'annulation.";
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
const barCategoryKeywords = ['boisson', 'brarudi', 'alcool', 'bière', 'biere', 'vin', 'cocktail', 'jus', 'soda', 'eau', 'drink', 'bar'];
const restaurantCategoryKeywords = ['cuisine', 'plat', 'repas', 'menu', 'entrée', 'entree', 'dessert', 'restaurant', 'nourriture', 'food'];

const getCaisseSection = (categoryName) => {
  if (!categoryName) {
    return 'restaurant';
  }
  const lower = categoryName.toLowerCase();
  if (barCategoryKeywords.some((kw) => lower.includes(kw))) {
    return 'bar';
  }
  if (restaurantCategoryKeywords.some((kw) => lower.includes(kw))) {
    return 'restaurant';
  }
  return 'restaurant';
};

const registerSaleInCaisse = async (items, invoiceNumber) => {
  const grouped = {};
  items.forEach((item) => {
    const section = getCaisseSection(item.category);
    if (!grouped[section]) {
      grouped[section] = { total: 0, names: [] };
    }
    const lineTotal = (item.item_price || item.price || 0) * (item.item_quantity || item.quantity || 1);
    grouped[section].total += lineTotal;
    grouped[section].names.push(item.item_designation || item.name || '');
  });

  const sectionLabels = { restaurant: 'Restaurant', bar: 'Bar' };

  for (const [section, data] of Object.entries(grouped)) {
    if (data.total <= 0) {
      continue;
    }
    try {
      const res = await api.get('/hotel/caisse/current', { params: { hotel_section: section } });
      const register = res.data?.data?.register;
      if (register?.id) {
        const desc = `Vente ${sectionLabels[section] || section} — ${data.names.slice(0, 3).join(', ')}${data.names.length > 3 ? '...' : ''}`;
        await api.post(`/hotel/caisse/${register.id}/movements`, {
          type: 'income',
          amount: data.total,
          description: desc,
          reference: invoiceNumber || 'POS',
        });
      }
    } catch {
      // No open caisse for this section
    }
  }
};

const handleInvoiceSubmit = async (payload) => {
  isSubmitting.value = true;
  try {
    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      const createdInvoice = response.data.data?.invoice || response.data.data;

      invoiceToPrint.value = createdInvoice;
      showPrintModal.value = true;

      const cartCopy = [...cart.value];
      const cartItems = payload.items.map((item) => {
        const cartMatch = cartCopy.find((c) => c.id === item.product_id);
        return { ...item, category: cartMatch?.category || null };
      });
      registerSaleInCaisse(cartItems, createdInvoice?.invoice_number);

      if (payload.invoice_action === "POS") {
        cart.value = [];
      }
    } else {
      showNotification("Erreur: " + response.data.message, 'error');
    }
  } catch (e) {
    console.error("Erreur lors de la soumission:", e);
    showNotification("Erreur lors de la soumission.", 'error');
  } finally {
    isSubmitting.value = false;
  }
};



const handleProformaSave = async (payload) => {
  isSubmitting.value = true;
  try {
    let result;

    if (payload.id && payload.data) {
      result = await store.dispatch("proformats/updateProforma", {
        id: payload.id,
        data: payload.data,
      });
    } else {
      result = await store.dispatch("proformats/createProforma", payload);
    }

    if (result.success) {
      showProformaForm.value = false;
      isEditingProforma.value = false;
      editingProformaData.value = null;
    } else {
      showNotification(result.message || "Erreur lors de l'enregistrement de la proforma", 'error');
    }
  } catch (e) {
    console.error("Proforma save error:", e);
    showNotification("Erreur lors de l'enregistrement: " + (e.message || "Erreur inconnue"), 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleProformaDelete = async (proforma) => {
    const result = await store.dispatch("proformats/deleteProforma", proforma.id || proforma.invoice_number); // Check what ID we use
    if (!result.success) {
        showNotification("Erreur lors de la suppression", 'error');
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
  <!-- overflow-hidden only for POS (fixed split layout); other tabs scroll via page-content -->
  <div class="d-flex flex-column h-100" :class="{ 'overflow-hidden': activeTab === 'POS' }">
    <SalesHeader v-model="activeTab" />

    <div
      class="row g-0"
      :class="activeTab === 'POS' ? 'flex-grow-1 overflow-hidden' : ''"
    >
      <!-- Main Content Area -->
      <div
        class="d-flex flex-column bg-light border-end"
        :class="[
          activeTab === 'POS' ? 'col-12 col-lg-8 overflow-hidden' : 'col-12',
        ]"
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
          :key="invoiceListKey"
          @view="handleViewInvoice"
          @print="handlePrintInvoice"
          @pay="handlePayInvoice"
          @cancel="openCancelModal"
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

    <!-- Cancel Invoice Modal -->
    <div v-if="showCancelModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Annuler la facture {{ cancelTarget?.invoice_number }}</h5>
            <button type="button" class="btn-close" @click="showCancelModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="cancelError" class="alert alert-danger">{{ cancelError }}</div>
            <div class="mb-3">
              <label class="form-label">Motif d'annulation (min. 10 caractères)</label>
              <textarea v-model="cancelMotif" class="form-control" rows="3" placeholder="Saisissez le motif d'annulation..."></textarea>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="cancelRestoreStock" id="restoreStock">
              <label class="form-check-label" for="restoreStock">Restaurer le stock après annulation</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCancelModal = false">Fermer</button>
            <button type="button" class="btn btn-danger" @click="confirmCancelInvoice">Confirmer l'annulation</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080;">
      <div class="toast show" :class="toastType === 'success' ? 'border-success' : 'border-danger'">
        <div class="toast-body d-flex align-items-center gap-2">
          <span :class="toastType === 'success' ? 'text-success' : 'text-danger'">
            {{ toastType === 'success' ? '✓' : '✗' }}
          </span>
          {{ toastMessage }}
          <button type="button" class="btn-close ms-auto" @click="showToast = false"></button>
        </div>
      </div>
    </div>
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
