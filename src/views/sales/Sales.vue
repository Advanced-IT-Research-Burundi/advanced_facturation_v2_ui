<script setup>
import { ref, watch, onMounted } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";

// Layout & Navigation
import SalesHeader from "./SalesHeader.vue";

// Tab Components
import PosTab from "./PosTab.vue";
import InvoiceService from "./InvoiceService.vue";
import ProformaTab from "./ProformaTab.vue";
import Refund from "./Refund.vue";
import FactureAvoir from "./FactureAvoir.vue";
import InvoicesTab from "./InvoicesTab.vue";
import Reports from "./Reports.vue";

// Global Shared Modals
import InvoicePrintModal from "./InvoicePrintModal.vue";
import ClientFormModal from "./ClientFormModal.vue";

const toast = useToast();

// --- GLOBAL STATE ---
const activeTab = ref("POS");
const posTabRef = ref(null);
const isSubmitting = ref(false);
const customers = ref([]);
const currentCompany = ref(null);

// --- PRINT MODAL STATE ---
const showPrintModal = ref(false);
const invoiceToPrint = ref(null);

// --- CLIENT FORM MODAL STATE ---
const showClientForm = ref(false);

const showNotification = (message, type = "success") => {
  const normalizedType = type === "danger" ? "error" : type;
  if (typeof toast[normalizedType] === "function") {
    toast[normalizedType](message);
  } else {
    toast.info(message);
  }
};

// --- DATA FETCHING ---
const fetchCustomers = async () => {
  try {
    const response = await api.get("/customers");
    if (response.data?.success) {
      customers.value = response.data.data?.data || response.data.data || [];
    }
  } catch (e) {
    console.error("Error fetching customers", e);
  }
};

const fetchCompany = async () => {
  try {
    const response = await api.get("/companies");
    if (response.data?.success && response.data.data?.data?.length > 0) {
      currentCompany.value = response.data.data.data[0];
    }
  } catch (e) {
    console.error("Error fetching company", e);
  }
};

onMounted(() => {
  fetchCustomers();
  fetchCompany();
});

// Focus search input when switching back to POS
watch(activeTab, (tab) => {
  if (tab === "POS") {
    setTimeout(() => posTabRef.value?.focusSearchInput?.(), 0);
  }
});

// --- CLIENT CREATION HANDLERS ---
const openClientForm = () => {
  showClientForm.value = true;
};

const handleClientCreated = (newClient) => {
  customers.value.push(newClient);
  showClientForm.value = false;
  showNotification("Client créé avec succès");
};

// --- PRINT MODAL HANDLERS ---
const handlePrintInvoice = (invoice) => {
  invoiceToPrint.value = invoice;
  showPrintModal.value = true;
};

const closePrintModal = () => {
  showPrintModal.value = false;
  invoiceToPrint.value = null;
};

// --- GENERIC SUBMIT HANDLER (Service, Caution, Avoir) ---
const handleGenericInvoiceSubmit = async (payload) => {
  isSubmitting.value = true;
  try {
    const response = await api.post("/invoices", payload);
    if (response.data?.success) {
      const createdInvoice = response.data.data?.invoice || response.data.data;
      handlePrintInvoice(createdInvoice);
    } else {
      showNotification("Erreur: " + response.data?.message, "error");
    }
  } catch (e) {
    console.error("Erreur lors de la soumission de la facture:", e);
    const msg =
      e.response?.data?.message ||
      e.message ||
      "Erreur lors de la soumission de la facture.";
    showNotification(msg, "error");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div
    class="sales-page d-flex flex-column h-100"
    :class="{ 'overflow-hidden': activeTab === 'POS' }"
  >
    <!-- Header Navigation Tabs -->
    <SalesHeader v-model="activeTab" />

    <!-- POS Tab (Includes Products Split & Cart Panel) -->
    <PosTab
      v-if="activeTab === 'POS'"
      ref="posTabRef"
      :customers="customers"
      @sale-completed="handlePrintInvoice"
      @add-client="openClientForm"
    />

    <!-- Service Invoices Tab -->
    <div v-else-if="activeTab === 'Service'" class="tab-content-wrapper flex-grow-1 bg-light">
      <InvoiceService
        :is-submitting="isSubmitting"
        :customers="customers"
        @submit="handleGenericInvoiceSubmit"
      />
    </div>

    <!-- Proforma Tab -->
    <div v-else-if="activeTab === 'Proforma'" class="tab-content-wrapper flex-grow-1 bg-light">
      <ProformaTab :customers="customers" />
    </div>

    <!-- Caution (Refund) Tab -->
    <div v-else-if="activeTab === 'Caution'" class="tab-content-wrapper flex-grow-1 bg-light">
      <Refund
        :is-submitting="isSubmitting"
        :customers="customers"
        @submit="handleGenericInvoiceSubmit"
      />
    </div>

    <!-- Facture Avoir Tab -->
    <div v-else-if="activeTab === 'Avoir'" class="tab-content-wrapper flex-grow-1 bg-light">
      <FactureAvoir
        :is-submitting="isSubmitting"
        :customers="customers"
        @submit="handleGenericInvoiceSubmit"
      />
    </div>

    <!-- Factures List Tab -->
    <div v-else-if="activeTab === 'Factures'" class="tab-content-wrapper flex-grow-1 bg-light">
      <InvoicesTab :customers="customers" @print="handlePrintInvoice" />
    </div>

    <!-- Reports Tab -->
    <div v-else-if="activeTab === 'Rapports'" class="tab-content-wrapper flex-grow-1 bg-light">
      <Reports />
    </div>

    <!-- MODAL IMPRESSION FACTURE (SHARED) -->
    <InvoicePrintModal
      :show="showPrintModal"
      :invoice="invoiceToPrint"
      :company="currentCompany"
      @close="closePrintModal"
    />

    <!-- MODAL AJOUT CLIENT (SHARED) -->
    <ClientFormModal
      :show="showClientForm"
      @close="showClientForm = false"
      @client-created="handleClientCreated"
    />
  </div>
</template>

<style scoped>
.sales-page {
  height: 100%;
  min-height: 0;
}
.tab-content-wrapper {
  overflow-y: auto;
}
</style>
