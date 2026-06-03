<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import {
  Search,
  FileText,
  Loader2,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-vue-next";
import api from "@/services/api";
import { useToast } from '@/composables/useToast';

const props = defineProps({
  isSubmitting: Boolean,
  customers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["submit"]);

const toast = useToast();

// State
const isLoading = ref(false);
const searchQuery = ref("");
const invoices = ref([]);
const selectedInvoice = ref(null);
const avoirItems = ref([]);
const avoirReason = ref("");
const showInvoiceSearch = ref(true);

// Fetch invoices for search
const searchInvoices = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    invoices.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const response = await api.get("/invoices", {
      params: {
        search: searchQuery.value,
        invoice_type: "FN", // Only search normal invoices
      },
    });
    if (response.data.success) {
      invoices.value = response.data.data.data || response.data.data;
    }
  } catch (error) {
    console.error("Erreur lors de la recherche des factures:", error);
  } finally {
    isLoading.value = false;
  }
};

// Select an invoice for credit note
const selectInvoice = (invoice) => {
  selectedInvoice.value = invoice;
  showInvoiceSearch.value = false;

  // Initialize avoir items from invoice items
  avoirItems.value = (invoice.invoice_items || []).map((item) => ({
    id: item.id,
    item_designation: item.item_designation,
    original_quantity: parseFloat(item.item_quantity),
    original_price: parseFloat(item.item_price),
    avoir_quantity: parseFloat(item.item_quantity),
    avoir_price: parseFloat(item.item_price),
    vat: Number.isNaN(parseFloat(item.vat)) ? 0 : parseFloat(item.vat),
    selected: true,
  }));
};

// Clear selection
const clearSelection = () => {
  selectedInvoice.value = null;
  avoirItems.value = [];
  avoirReason.value = "";
  showInvoiceSearch.value = true;
  searchQuery.value = "";
};

// Toggle item selection
const toggleItem = (item) => {
  item.selected = !item.selected;
};

// Calculate totals
const avoirTotals = computed(() => {
  let totalHT = 0;
  let totalVAT = 0;

  avoirItems.value
    .filter((item) => item.selected)
    .forEach((item) => {
      const lineHT = item.avoir_quantity * item.avoir_price;
      const lineVAT = lineHT * (item.vat / 100);
      totalHT += lineHT;
      totalVAT += lineVAT;
    });

  return {
    totalHT: totalHT.toFixed(2),
    totalVAT: totalVAT.toFixed(2),
    totalTTC: (totalHT + totalVAT).toFixed(2),
  };
});

// Validate and submit
const validateAndSubmit = () => {
  const selectedItems = avoirItems.value.filter((item) => item.selected);

  if (selectedItems.length === 0) {
    toast.error("Veuillez sélectionner au moins un article.");
    return;
  }

  if (!avoirReason.value.trim()) {
    toast.error("Veuillez indiquer le motif de l'avoir.");
    return;
  }

  const payload = {
    invoice_type: "FA", // Facture Avoir
    invoice_action: "SERVICE",
    invoice_currency: selectedInvoice.value.invoice_currency || "BIF",
    customer_id: selectedInvoice.value.customer_id,
    reference_invoice_id: selectedInvoice.value.id,
    reference_invoice_number: selectedInvoice.value.invoice_number,
    avoir_reason: avoirReason.value,
    items: selectedItems.map((item) => ({
      item_designation: item.item_designation,
      item_quantity: -Math.abs(item.avoir_quantity), // Negative for credit
      item_price: item.avoir_price,
      vat: item.vat,
      item_ct: 0,
      item_tl: 0,
    })),
  };

  emit("submit", payload);
};

// Format price
const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString() : "0";
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("fr-FR");
};
</script>

<template>
  <div class="d-flex flex-column bg-white">
    <!-- Header -->
    <div class="p-3 bg-light border-bottom">
      <h4 class="mb-0 d-flex align-items-center gap-2">
        <FileText :size="24" class="text-danger" />
        Note de Crédit / Avoir
      </h4>
      <small class="text-muted">Créer un avoir sur une facture existante</small>
    </div>

    <!-- Search Section -->
    <div v-if="showInvoiceSearch" class="p-4">
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="mb-0">Rechercher la facture d'origine</h5>
        </div>
        <div class="card-body">
          <div class="input-group mb-3">
            <span class="input-group-text bg-light">
              <Search :size="18" />
            </span>
            <input
              v-model="searchQuery"
              @input="searchInvoices"
              type="text"
              class="form-control"
              placeholder="Rechercher par numéro de facture ou nom client..."
            />
            <span v-if="isLoading" class="input-group-text">
              <Loader2 :size="18" class="animate-spin" />
            </span>
          </div>

          <!-- Search Results -->
          <div v-if="invoices.length > 0" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="bg-light">
                <tr>
                  <th>N° Facture</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Montant TTC</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="invoice in invoices"
                  :key="invoice.id"
                  class="cursor-pointer"
                  @click="selectInvoice(invoice)"
                >
                  <td class="fw-bold">{{ invoice.invoice_number }}</td>
                  <td>{{ formatDate(invoice.invoice_date) }}</td>
                  <td>{{ invoice.customer_name }}</td>
                  <td>{{ formatPrice(invoice.invoice_total_amount) }} BIF</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary">
                      Sélectionner
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-else-if="searchQuery && !isLoading"
            class="text-center text-muted py-4"
          >
            <AlertCircle :size="48" class="mb-2 opacity-25" />
            <p>Aucune facture trouvée</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Invoice & Avoir Form -->
    <div v-else class="flex-grow-1 p-4 overflow-auto">
      <!-- Selected Invoice Info -->
      <div class="card mb-4">
        <div
          class="card-header bg-white d-flex justify-content-between align-items-center"
        >
          <div>
            <h6 class="mb-0">Facture sélectionnée</h6>
            <small class="text-muted">{{ selectedInvoice.invoice_number }}</small>
          </div>
          <button @click="clearSelection" class="btn btn-sm btn-outline-danger">
            <X :size="16" /> Changer
          </button>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <small class="text-muted">Client</small>
              <p class="mb-0 fw-bold">{{ selectedInvoice.customer_name }}</p>
            </div>
            <div class="col-md-4">
              <small class="text-muted">Date facture</small>
              <p class="mb-0">{{ formatDate(selectedInvoice.invoice_date) }}</p>
            </div>
            <div class="col-md-4">
              <small class="text-muted">Montant original</small>
              <p class="mb-0 fw-bold text-primary">
                {{ formatPrice(selectedInvoice.invoice_total_amount) }} BIF
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Avoir Items Table -->
      <div class="card mb-4">
        <div class="card-header bg-white">
          <h6 class="mb-0">Articles à créditer</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-bordered mb-0">
              <thead class="bg-light">
                <tr>
                  <th style="width: 50px">
                    <input
                      type="checkbox"
                      @change="avoirItems.forEach((i) => (i.selected = $event.target.checked))"
                      :checked="avoirItems.every((i) => i.selected)"
                    />
                  </th>
                  <th>Désignation</th>
                  <th style="width: 120px">Qté originale</th>
                  <th style="width: 120px">Qté à créditer</th>
                  <th style="width: 150px">Prix unitaire</th>
                  <th style="width: 100px">TVA %</th>
                  <th style="width: 150px">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in avoirItems"
                  :key="item.id"
                  :class="{ 'table-active': item.selected }"
                >
                  <td class="text-center">
                    <input
                      type="checkbox"
                      v-model="item.selected"
                    />
                  </td>
                  <td>{{ item.item_designation }}</td>
                  <td class="text-center text-muted">
                    {{ item.original_quantity }}
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.avoir_quantity"
                      :max="item.original_quantity"
                      min="0.01"
                      step="0.01"
                      class="form-control form-control-sm text-center"
                      :disabled="!item.selected"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.avoir_price"
                      min="0"
                      step="0.01"
                      class="form-control form-control-sm text-end"
                      :disabled="!item.selected"
                    />
                  </td>
                  <td class="text-center">{{ item.vat }}%</td>
                  <td class="text-end fw-bold">
                    {{
                      item.selected
                        ? formatPrice(item.avoir_quantity * item.avoir_price)
                        : "-"
                    }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-light">
                <tr>
                  <td colspan="6" class="text-end fw-bold">Total HT:</td>
                  <td class="text-end fw-bold">{{ avoirTotals.totalHT }} BIF</td>
                </tr>
                <tr>
                  <td colspan="6" class="text-end">TVA:</td>
                  <td class="text-end">{{ avoirTotals.totalVAT }} BIF</td>
                </tr>
                <tr class="table-danger">
                  <td colspan="6" class="text-end fw-bold">Total Avoir TTC:</td>
                  <td class="text-end fw-bold text-danger">
                    -{{ avoirTotals.totalTTC }} BIF
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Reason -->
      <div class="card mb-4">
        <div class="card-body">
          <label class="form-label fw-bold">Motif de l'avoir *</label>
          <textarea
            v-model="avoirReason"
            class="form-control"
            rows="2"
            placeholder="Ex: Retour de marchandise, erreur de facturation, remise commerciale..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div
      v-if="selectedInvoice"
      class="p-3 border-top bg-light d-flex justify-content-between align-items-center"
    >
      <div>
        <span class="text-muted">Montant de l'avoir:</span>
        <span class="fs-5 fw-bold text-danger ms-2"
          >-{{ avoirTotals.totalTTC }} BIF</span
        >
      </div>
      <div>
        <button @click="clearSelection" class="btn btn-outline-secondary me-2">
          Annuler
        </button>
        <button
          @click="validateAndSubmit"
          class="btn btn-danger px-4"
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" :size="18" class="animate-spin me-2" />
          <CreditCard v-else :size="18" class="me-2" />
          Créer la Note de Crédit
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
