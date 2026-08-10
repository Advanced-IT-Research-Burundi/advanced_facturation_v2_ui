<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import {
  Search,
  Wallet,
  Loader2,
  CreditCard,
  AlertCircle,
  User,
  Trash2,
  X,
  Calendar,
  FileText,
  DollarSign,
  RefreshCw,
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
const refundMode = ref("new"); // 'new' or 'existing'
const deposits = ref([]);
const depositsError = ref("");
const searchQuery = ref("");
const refunds = ref([]);
const isLoadingRefunds = ref(false);

// For new deposit
const selectedClient = ref(null);
const clientSearchText = ref("");
const depositForm = reactive({
  amount: 0,
  currency: "BIF",
  reference: "",
  description: "",
  paymentMethod: "cash",
});

// For existing deposit refund
const selectedDeposit = ref(null);
const refundAmount = ref(0);
const refundReason = ref("");

// Client search
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
  // Load customer deposits
  loadCustomerDeposits(customer.id);
};

const clearClient = () => {
  selectedClient.value = null;
  clientSearchText.value = "";
  deposits.value = [];
  depositsError.value = "";
  selectedDeposit.value = null;
};

// Load deposits for a customer
const loadCustomerDeposits = async (customerId) => {
  isLoading.value = true;
  depositsError.value = "";
  try {
    const response = await api.get(`/customers/${customerId}/deposits`);
    if (response.data.success) {
      // L'API peut retourner directement un tableau ou une réponse paginée.
      deposits.value = response.data.data?.data || response.data.data || [];
    }
  } catch (error) {
    console.error("Erreur lors du chargement des cautions:", error);
    deposits.value = [];
    depositsError.value = error.response?.data?.message || "Impossible de charger les cautions de ce client.";
  } finally {
    isLoading.value = false;
  }
};

// Historique global des cautions et de leurs remboursements.
const loadRefunds = async () => {
  isLoadingRefunds.value = true;
  try {
    const response = await api.get("/invoices", { params: { per_page: 100 } });
    if (response.data.success) {
      const invoices = response.data.data?.data || response.data.data || [];
      refunds.value = invoices.filter((invoice) =>
        ["FC", "RC"].includes(invoice.invoice_type)
      );
    }
  } catch (error) {
    console.error("Erreur lors du chargement des remboursements:", error);
    refunds.value = [];
  } finally {
    isLoadingRefunds.value = false;
  }
};

// Select deposit for refund
const selectDeposit = (deposit) => {
  selectedDeposit.value = deposit;
  refundAmount.value = parseFloat(deposit.remaining_amount || deposit.amount);
  refundMode.value = "existing";
};

const clearDeposit = () => {
  selectedDeposit.value = null;
  refundAmount.value = 0;
  refundReason.value = "";
  refundMode.value = "new";
};

// Create new deposit (caution)
const createDeposit = () => {
  if (!selectedClient.value) {
    toast.error("Veuillez sélectionner un client.");
    return;
  }
  if (depositForm.amount <= 0) {
    toast.error("Veuillez entrer un montant valide.");
    return;
  }

  const payload = {
    invoice_type: "FC", // Facture Caution (deposit)
    invoice_action: "SERVICE",
    invoice_currency: depositForm.currency,
    customer_id: selectedClient.value.id,
    payment_type: depositForm.paymentMethod,
    deposit_reference: depositForm.reference,
    items: [
      {
        item_designation: depositForm.description || "Caution client",
        item_quantity: 1,
        item_price: depositForm.amount,
        vat: 0, // Deposits usually don't have VAT
        item_ct: 0,
        item_tl: 0,
      },
    ],
  };

  emit("submit", payload);
};

// Refund existing deposit
const submitRefund = () => {
  if (!selectedDeposit.value) {
    toast.error("Veuillez sélectionner une caution.");
    return;
  }
  if (refundAmount.value <= 0) {
    toast.error("Veuillez entrer un montant valide.");
    return;
  }
  if (
    refundAmount.value >
    (selectedDeposit.value.remaining_amount || selectedDeposit.value.amount)
  ) {
    toast.error("Le montant du remboursement ne peut pas dépasser le montant restant.");
    return;
  }
  if (!refundReason.value.trim()) {
    toast.error("Veuillez indiquer le motif du remboursement.");
    return;
  }

  const payload = {
    invoice_type: "RC", // Remboursement Caution
    invoice_action: "SERVICE",
    invoice_currency: selectedDeposit.value.currency || "BIF",
    customer_id: selectedClient.value.id,
    // L'API relie le remboursement à la facture de caution d'origine.
    reference_invoice_id: selectedDeposit.value.id,
    refund_reason: refundReason.value,
    items: [
      {
        item_designation: `Remboursement caution - ${selectedDeposit.value.reference || selectedDeposit.value.id}`,
        item_quantity: 1,
        item_price: -Math.abs(refundAmount.value), // Negative for refund
        vat: 0,
        item_ct: 0,
        item_tl: 0,
      },
    ],
  };

  emit("submit", payload);
};

// Reset form
const resetForm = () => {
  depositForm.amount = 0;
  depositForm.reference = "";
  depositForm.description = "";
  clearDeposit();
};

// Format price
const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString() : "0";
};

// Format date
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const getRefundCustomer = (refund) =>
  refund.customer?.customer_name || refund.customer_name || "Client inconnu";

const getRefundReason = (refund) =>
  refund.refund_reason ||
  refund.invoice_items?.[0]?.item_designation ||
  refund.invoiceItems?.[0]?.item_designation ||
  "-";

const getRefundAmount = (refund) =>
  Math.abs(Number(refund.invoice_total_amount ?? refund.total_amount ?? 0));

const getRefundType = (refund) =>
  refund.invoice_type === "RC" ? "Remboursement" : "Caution";

onMounted(loadRefunds);

watch(
  () => props.isSubmitting,
  (isSubmitting, wasSubmitting) => {
    if (wasSubmitting && !isSubmitting) loadRefunds();
  }
);
</script>

<template>
  <div class="d-flex flex-column bg-white">
    <!-- Header -->
    <div class="p-3 bg-light border-bottom">
      <h4 class="mb-0 d-flex align-items-center gap-2">
        <Wallet :size="24" class="text-success" />
        Gestion des Cautions
      </h4>
      <small class="text-muted"
        >Enregistrer une caution ou effectuer un remboursement</small
      >
    </div>

    <div class="flex-grow-1 p-4 overflow-auto">
      <!-- Liste des remboursements déjà effectués -->
      <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">Liste des cautions et remboursements</h6>
            <small class="text-muted">Historique des cautions enregistrées et des remboursements effectués</small>
          </div>
          <button class="btn btn-sm btn-outline-primary" @click="loadRefunds" :disabled="isLoadingRefunds">
            <Loader2 v-if="isLoadingRefunds" :size="15" class="animate-spin" />
            <RefreshCw v-else :size="15" />
          </button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 refund-history-table">
            <thead>
              <tr>
                <th>N° remboursement</th>
                <th>Date</th>
                <th>Client</th>
                <th>Type</th>
                <th>Motif / référence</th>
                <th class="text-end">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoadingRefunds">
                <td colspan="6" class="text-center py-3 text-muted">Chargement des cautions...</td>
              </tr>
              <tr v-else-if="!refunds.length">
                <td colspan="6" class="text-center py-3 text-muted">Aucune caution ou aucun remboursement enregistré.</td>
              </tr>
              <tr v-for="refund in refunds" :key="refund.id">
                <td class="fw-bold">{{ refund.invoice_number || `#${refund.id}` }}</td>
                <td>{{ formatDate(refund.invoice_date || refund.created_at) }}</td>
                <td>{{ getRefundCustomer(refund) }}</td>
                <td><span class="badge" :class="refund.invoice_type === 'RC' ? 'bg-success' : 'bg-warning text-dark'">{{ getRefundType(refund) }}</span></td>
                <td class="text-muted">{{ getRefundReason(refund) }}</td>
                <td class="text-end fw-bold text-success">{{ formatPrice(getRefundAmount(refund)) }} {{ refund.invoice_currency || refund.currency || "BIF" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Client Search -->
      <div class="card mb-4">
        <div class="card-header bg-white">
          <h6 class="mb-0">Client</h6>
        </div>
        <div class="card-body">
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <User :size="18" :class="{ 'text-success': selectedClient }" />
              </span>
              <input
                v-model="clientSearchText"
                type="text"
                class="form-control border-start-0 ps-0"
                placeholder="Rechercher un client..."
                :disabled="!!selectedClient"
              />
              <button
                v-if="selectedClient"
                @click="clearClient"
                class="btn btn-outline-danger"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Dropdown results -->
            <div
              v-if="clientSearchText && !selectedClient && filteredCustomers.length"
              class="position-absolute bg-white border rounded shadow-sm w-100 mt-1 z-3 overflow-auto"
              style="max-height: 200px"
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
          </div>

          <div v-if="selectedClient" class="mt-3 p-3 bg-light rounded">
            <div class="row">
              <div class="col-md-6">
                <small class="text-muted">Nom</small>
                <p class="mb-0 fw-bold">{{ selectedClient.customer_name }}</p>
              </div>
              <div class="col-md-6">
                <small class="text-muted">NIF</small>
                <p class="mb-0">{{ selectedClient.customer_TIN || "N/A" }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode Selection Tabs -->
      <div v-if="selectedClient" class="card mb-4">
        <div class="card-header bg-white p-0">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <button
                class="nav-link"
                :class="{ active: refundMode === 'new' && !selectedDeposit }"
                @click="clearDeposit"
              >
                <DollarSign :size="16" class="me-1" />
                Nouvelle Caution
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link"
                :class="{ active: refundMode === 'existing' || selectedDeposit }"
                @click="refundMode = 'existing'"
              >
                <Wallet :size="16" class="me-1" />
                Remboursement
              </button>
            </li>
          </ul>
        </div>

        <div class="card-body">
          <!-- New Deposit Form -->
          <div v-if="refundMode === 'new' && !selectedDeposit">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Montant *</label>
                <div class="input-group">
                  <input
                    v-model.number="depositForm.amount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control"
                    placeholder="0.00"
                  />
                  <select v-model="depositForm.currency" class="form-select" style="max-width: 100px">
                    <option value="BIF">BIF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Mode de paiement</label>
                <select v-model="depositForm.paymentMethod" class="form-select">
                  <option value="cash">Espèces</option>
                  <option value="banque">Virement bancaire</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Référence</label>
                <input
                  v-model="depositForm.reference"
                  type="text"
                  class="form-control"
                  placeholder="N° de référence..."
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Description</label>
                <input
                  v-model="depositForm.description"
                  type="text"
                  class="form-control"
                  placeholder="Description de la caution..."
                />
              </div>
            </div>

            <div class="mt-4 text-end">
              <button
                @click="createDeposit"
                class="btn btn-success px-4"
                :disabled="isSubmitting || depositForm.amount <= 0"
              >
                <Loader2 v-if="isSubmitting" :size="18" class="animate-spin me-2" />
                <DollarSign v-else :size="18" class="me-2" />
                Enregistrer la Caution
              </button>
            </div>
          </div>

          <!-- Existing Deposits List / Refund Form -->
          <div v-else>
            <!-- Loading -->
            <div v-if="isLoading" class="text-center py-4">
              <Loader2 :size="32" class="animate-spin text-primary" />
              <p class="text-muted mt-2">Chargement des cautions...</p>
            </div>

            <!-- Selected Deposit Refund Form -->
            <div v-else-if="selectedDeposit">
              <div class="alert alert-info d-flex align-items-center mb-4">
                <FileText :size="20" class="me-2" />
                <div>
                  <strong>Caution sélectionnée:</strong>
                  {{ selectedDeposit.reference || `#${selectedDeposit.id}` }}
                  <button
                    @click="clearDeposit"
                    class="btn btn-sm btn-link text-danger p-0 ms-2"
                  >
                    Changer
                  </button>
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <small class="text-muted">Montant original</small>
                  <p class="mb-0 fs-5 fw-bold">
                    {{ formatPrice(selectedDeposit.amount) }}
                    {{ selectedDeposit.currency || "BIF" }}
                  </p>
                </div>
                <div class="col-md-4">
                  <small class="text-muted">Déjà remboursé</small>
                  <p class="mb-0 fs-5 text-warning">
                    {{
                      formatPrice(
                        selectedDeposit.amount -
                          (selectedDeposit.remaining_amount || selectedDeposit.amount)
                      )
                    }}
                    {{ selectedDeposit.currency || "BIF" }}
                  </p>
                </div>
                <div class="col-md-4">
                  <small class="text-muted">Restant</small>
                  <p class="mb-0 fs-5 fw-bold text-success">
                    {{
                      formatPrice(
                        selectedDeposit.remaining_amount || selectedDeposit.amount
                      )
                    }}
                    {{ selectedDeposit.currency || "BIF" }}
                  </p>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Montant à rembourser *</label>
                  <div class="input-group">
                    <input
                      v-model.number="refundAmount"
                      type="number"
                      min="0"
                      :max="selectedDeposit.remaining_amount || selectedDeposit.amount"
                      step="0.01"
                      class="form-control fs-5"
                    />
                    <span class="input-group-text">{{
                      selectedDeposit.currency || "BIF"
                    }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Motif du remboursement *</label>
                  <textarea
                    v-model="refundReason"
                    class="form-control"
                    rows="2"
                    placeholder="Ex: Fin de contrat, restitution matériel..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Deposits List -->
            <div v-else-if="deposits.length > 0">
              <p class="text-muted mb-3">
                Sélectionnez une caution à rembourser:
              </p>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="bg-light">
                    <tr>
                      <th>Référence</th>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Restant</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="deposit in deposits"
                      :key="deposit.id"
                      class="cursor-pointer"
                    >
                      <td class="fw-bold">
                        {{ deposit.reference || `#${deposit.id}` }}
                      </td>
                      <td>{{ formatDate(deposit.created_at) }}</td>
                      <td>
                        {{ formatPrice(deposit.amount) }}
                        {{ deposit.currency || "BIF" }}
                      </td>
                      <td class="fw-bold text-success">
                        {{
                          formatPrice(deposit.remaining_amount || deposit.amount)
                        }}
                        {{ deposit.currency || "BIF" }}
                      </td>
                      <td>
                        <button
                          @click="selectDeposit(deposit)"
                          class="btn btn-sm btn-outline-primary"
                          :disabled="
                            (deposit.remaining_amount || deposit.amount) <= 0
                          "
                        >
                          Rembourser
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- API error -->
            <div v-else-if="depositsError" class="alert alert-danger mb-0">
              {{ depositsError }}
            </div>

            <!-- No Deposits -->
            <div v-else class="text-center py-4 text-muted">
              <AlertCircle :size="48" class="mb-2 opacity-25" />
              <p>Aucune caution enregistrée pour ce client.</p>
              <button @click="refundMode = 'new'" class="btn btn-outline-primary">
                Créer une nouvelle caution
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when no client selected -->
      <div
        v-if="!selectedClient"
        class="text-center py-5 text-muted"
      >
        <User :size="64" class="mb-3 opacity-25" />
        <p class="fs-5">Sélectionnez un client pour commencer</p>
      </div>
    </div>

    <!-- Footer Actions -->
    <div
      v-if="selectedDeposit"
      class="p-3 border-top bg-light d-flex justify-content-between align-items-center"
    >
      <div>
        <span class="text-muted">Montant du remboursement:</span>
        <span class="fs-5 fw-bold text-success ms-2"
          >{{ formatPrice(refundAmount) }}
          {{ selectedDeposit.currency || "BIF" }}</span
        >
      </div>
      <div>
        <button @click="clearDeposit" class="btn btn-outline-secondary me-2">
          Annuler
        </button>
        <button
          @click="submitRefund"
          class="btn btn-success px-4"
          :disabled="isSubmitting || refundAmount <= 0"
        >
          <Loader2 v-if="isSubmitting" :size="18" class="animate-spin me-2" />
          <Wallet v-else :size="18" class="me-2" />
          Effectuer le Remboursement
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
.cursor-pointer {
  cursor: pointer;
}
.refund-history-table thead th {
  /* background: #007bff; */
  color: #000000;
  font-size: 0.82rem;
  white-space: nowrap;
}
.refund-history-table td {
  font-size: 0.86rem;
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
