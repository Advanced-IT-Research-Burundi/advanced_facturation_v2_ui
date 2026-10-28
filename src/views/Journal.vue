<script setup>
import { ref, computed, onMounted } from "vue";
import { Printer, ArrowLeft } from "lucide-vue-next";
import { useStore } from "vuex";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import InvoicePrintModal from "@/views/sales/InvoicePrintModal.vue";

const toast = useToast();
const store = useStore();

// State
const invoices = ref(store.state.data.journalInvoices || []);
const loading = ref(false);
const error = ref(null);
const currentCompany = ref(null);
const showPrintModal = ref(false);
const invoiceToPrint = ref(null);

// Dates - par défaut vide pour afficher tout
const startDate = ref("");
const endDate = ref("");

// Summary statistics
const summary = computed(() => {
  const list = invoices.value || [];
  return {
    total_invoices: list.length,
    total_amount_tvac: list.reduce(
      (sum, inv) => sum + (parseFloat(inv.invoice_total_amount) || 0),
      0,
    ),
    total_tva: list.reduce(
      (sum, inv) => sum + (parseFloat(inv.invoice_vat_amount) || 0),
      0,
    ),
    total_htva: list.reduce(
      (sum, inv) => sum + (parseFloat(inv.invoice_amount_nvat) || 0),
      0,
    ),
  };
});

// Payment types mapping (comme dans la démo)
const TYPE_PAYMENT = {
  1: "Espèces",
  2: "Banque",
  3: "Crédit",
  4: "Mobile Money",
  cash: "Espèces",
  bank: "Banque",
  credit: "Crédit",
  mobile: "Mobile Money",
};

// Invoice type labels
const INVOICE_TYPES = {
  FN: "Facture Normale",
  FA: "Facture Avoir",
  FC: "Facture à Crédit",
  FP: "Proforma",
  RC: "Reçu de Caisse",
};

// Fetch invoices - EXACTEMENT comme InvoicesList
const fetchInvoices = async () => {
  loading.value = true;
  error.value = null;
  console.log("Journal: Fetching invoices...");
  try {
    const params = {};

    // Filtres de date optionnels
    if (startDate.value) {
      params.start_date = startDate.value;
    }
    if (endDate.value) {
      params.end_date = endDate.value;
    }

    const response = await api.get("/invoices", { params });
    console.log("Journal: API Response:", response.data);

    if (response.data.success) {
      // Exactement comme InvoicesList
      invoices.value = response.data.data.data || response.data.data;
      store.state.data.journalInvoices = invoices.value;
      console.log(
        "Journal: Invoices loaded:",
        invoices.value.length,
        "factures",
      );
    } else {
      console.log("Journal: API returned success=false");
    }
  } catch (err) {
    console.error("Journal: Error fetching invoices:", err);
    error.value = "Erreur lors du chargement du journal des factures";
  } finally {
    loading.value = false;
  }
};

// Helpers
const formatPrice = (amount) => {
  if (!amount && amount !== 0) return "0";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPaymentTypeLabel = (type) => {
  return TYPE_PAYMENT[type] || type || "Espèces";
};

const getInvoiceTypeLabel = (type) => {
  return INVOICE_TYPES[type] || type || "";
};

// Print page
const printPage = () => {
  window.print();
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

// Même aperçu/impression que l'historique des ventes (Sales)
const printInvoice = async (invoice) => {
  try {
    const response = await api.get(`/invoices/${invoice.id}`);
    invoiceToPrint.value = response.data?.data ?? invoice;
    showPrintModal.value = true;
  } catch (err) {
    console.error("Error fetching invoice for print:", err);
    toast.error("Erreur lors de la récupération de la facture");
  }
};

const closePrintModal = () => {
  showPrintModal.value = false;
  invoiceToPrint.value = null;
};

// Init
onMounted(() => {
  fetchInvoices();
  fetchCompany();
});
</script>

<template>
  <div class="container-fluid py-3">
    <!-- Header Navigation -->
    <div class="d-flex justify-content-end align-items-center mb-2 noprint">
      <RouterLink to="/obr-invoices" class="btn btn-secondary btn-sm me-2">
        <ArrowLeft :size="14" class="me-1" />
        OBR Invoices
      </RouterLink>

      <RouterLink to="/obr-mouvements" class="btn btn-secondary btn-sm me-2">
        <ArrowLeft :size="14" class="me-1" />
        OBR Mouvements Stock
      </RouterLink>

      <button class="btn btn-info btn-sm" @click="printPage">
        <Printer :size="14" class="me-1" />
        Imprimer
      </button>
    </div>

    <h5 class="text-center mb-4">Historique des ventes</h5>

    <!-- Filters and Stats Row - comme dans la démo -->
    <div class="row mb-4">
      <!-- Date Filters -->
      <div class="col-md-4">
        <form @submit.prevent="fetchInvoices">
          <div class="row">
            <div class="col-6">
              <label class="small">DU</label>
              <input
                type="date"
                class="form-control form-control-sm"
                v-model="startDate"
              />
            </div>
            <div class="col-6">
              <label class="small">AU</label>
              <input
                type="date"
                class="form-control form-control-sm"
                v-model="endDate"
              />
            </div>
            <div class="col-6 mt-2 noprint">
              <button type="submit" class="btn btn-info btn-sm">Ok</button>
            </div>
          </div>
        </form>
      </div>

      <!-- Stats Table 1 -->
      <div class="col-md-4">
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr>
              <th>DATE</th>
              <td>{{ startDate || "Tout" }} - {{ endDate || "Tout" }}</td>
            </tr>
            <tr>
              <th>NOMBRE TOTAL DE FACTURE</th>
              <td class="fw-bold">{{ formatPrice(summary.total_invoices) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stats Table 2 -->
      <div class="col-md-4">
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr>
              <th>MONTANT TOTAL DES FACTURE TVAC</th>
              <td class="text-nowrap fw-bold">
                {{ formatPrice(summary.total_amount_tvac) }}
              </td>
            </tr>
            <tr>
              <th>NOMBRE TOTAL POUR TVA</th>
              <td class="text-nowrap">{{ formatPrice(summary.total_tva) }}</td>
            </tr>
            <tr>
              <th>NOMBRE TOTAL POUR HTVA</th>
              <td class="text-nowrap">{{ formatPrice(summary.total_htva) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger alert-dismissible mb-3">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>

    <!-- Main Table - exactement comme la démo -->
    <table class="table table-sm">
      <thead class="table-dark">
        <tr>
          <th scope="col">#</th>
          <th scope="col">PRODUITS</th>
          <th scope="col">MONTANT</th>
          <th scope="col" class="noprint">MODE DE PAIEMENT</th>
          <th scope="col" class="noprint">TYPE DE FACTURE</th>
          <th scope="col">TVA</th>
          <th scope="col" class="noprint">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="invoices.length === 0">
          <td colspan="7" class="text-center py-4 text-muted">
            Aucune facture trouvée
          </td>
        </tr>
        <tr v-for="invoice in invoices" :key="invoice.id">
          <th scope="row">{{ invoice.id }}</th>

          <!-- PRODUITS - comme dans la démo -->
          <td>
            <ul class="list-unstyled mb-0">
              <li
                v-for="(item, idx) in invoice.invoice_items ||
                invoice.invoiceItems ||
                []"
                :key="idx"
              >
                {{ item.item_designation || item.product?.name }} | Qte :
                {{ item.item_quantity }} | PRIX :
                {{ formatPrice(item.item_price) }}
              </li>
              <li
                v-if="
                  !(invoice.invoice_items || invoice.invoiceItems || []).length
                "
                class="text-muted"
              >
                (Voir détails)
              </li>
              <li class="text-center border-top mt-2 pt-2">
                {{ formatDate(invoice.invoice_date || invoice.created_at) }}
              </li>
              <li>
                Client :
                <b>{{
                  invoice.customer?.customer_name ||
                  invoice.customer_name ||
                  "Client Anonyme"
                }}</b>
                &nbsp;&nbsp;&nbsp; Vendu par :
                <b>{{ invoice.user?.name || "Inconnu" }}</b>
              </li>
            </ul>
          </td>

          <!-- MONTANT -->
          <td class="text-nowrap">
            {{ formatPrice(invoice.invoice_total_amount) }}
          </td>

          <!-- MODE DE PAIEMENT -->
          <td class="noprint">
            {{ getPaymentTypeLabel(invoice.payment_type) }}
          </td>

          <!-- TYPE DE FACTURE -->
          <td class="noprint">
            {{ getInvoiceTypeLabel(invoice.invoice_type) }}
          </td>

          <!-- TVA -->
          <td class="text-nowrap">
            {{ formatPrice(invoice.invoice_vat_amount) }}
          </td>

          <!-- Action -->
          <td class="noprint">
            <button
              class="btn btn-sm btn-success"
              @click="printInvoice(invoice)"
              title="Imprimer"
            >
              <Printer :size="14" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <InvoicePrintModal
      :show="showPrintModal"
      :invoice="invoiceToPrint"
      :company="currentCompany"
      @close="closePrintModal"
    />
  </div>
</template>

<style scoped>
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

/* Style d'impression - cacher les éléments noprint */
@media print {
  .noprint {
    display: none !important;
  }

  .container-fluid {
    padding: 0 !important;
  }

  .table {
    font-size: 11px;
  }
}

/* Style pour les liens comme dans la démo */
a {
  color: #333;
}

a:hover {
  color: #007bff;
}

.table th {
  white-space: nowrap;
}
</style>
