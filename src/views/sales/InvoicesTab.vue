<script setup>
import { ref } from "vue";
import api from "@/services/api";
import InvoicesList from "./InvoicesList.vue";
import PaymentModal from "./PaymentModal.vue";
import InvoiceCancelModal from "./InvoiceCancelModal.vue";

const emit = defineEmits(["print"]);

const invoiceListKey = ref(0);

// --- PAYMENT MODAL STATE ---
const showPaymentModal = ref(false);
const invoiceToPay = ref(null);

// --- CANCEL MODAL STATE ---
const showCancelModal = ref(false);
const invoiceToCancel = ref(null);

const refreshInvoices = () => {
  invoiceListKey.value++;
};

// Charge le détail complet (avec lignes et désignations) avant d'émettre l'impression/aperçu
const openInvoiceDetails = async (invoice) => {
  let fullInvoice = invoice;
  try {
    const response = await api.get(`/invoices/${invoice.id}`);
    fullInvoice = response.data?.data ?? invoice;
  } catch (error) {
    console.error("Erreur lors du chargement du détail de la facture:", error);
  }
  emit("print", fullInvoice);
};

// Handlers from InvoicesList
const handleViewInvoice = (invoice) => openInvoiceDetails(invoice);
const handlePrintInvoice = (invoice) => openInvoiceDetails(invoice);

const handlePayInvoice = (invoice) => {
  invoiceToPay.value = invoice;
  showPaymentModal.value = true;
};

const closePaymentModal = () => {
  showPaymentModal.value = false;
  invoiceToPay.value = null;
};

const handlePaymentAdded = () => {
  refreshInvoices();
};

const handleCancelInvoice = (invoice) => {
  invoiceToCancel.value = invoice;
  showCancelModal.value = true;
};

const closeCancelModal = () => {
  showCancelModal.value = false;
  invoiceToCancel.value = null;
};

const handleInvoiceCancelled = () => {
  refreshInvoices();
};
</script>

<template>
  <div class="invoices-tab-wrapper h-100">
    <InvoicesList
      :key="invoiceListKey"
      @view="handleViewInvoice"
      @print="handlePrintInvoice"
      @pay="handlePayInvoice"
      @cancel="handleCancelInvoice"
    />

    <!-- MODAL PAIEMENT -->
    <PaymentModal
      :show="showPaymentModal"
      :invoice="invoiceToPay"
      @close="closePaymentModal"
      @payment-added="handlePaymentAdded"
    />

    <!-- MODAL ANNULATION -->
    <InvoiceCancelModal
      :show="showCancelModal"
      :invoice="invoiceToCancel"
      @close="closeCancelModal"
      @cancelled="handleInvoiceCancelled"
    />
  </div>
</template>
