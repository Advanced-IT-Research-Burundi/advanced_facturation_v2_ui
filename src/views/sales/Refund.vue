<script setup>
import { ref, reactive, computed, onMounted } from "vue";
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
} from "lucide-vue-next";
import api from "@/services/api";

const props = defineProps({
  isSubmitting: Boolean,
  customers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["submit"]);

// State
const isLoading = ref(false);
const refundMode = ref("new"); // 'new' or 'existing'
const deposits = ref([]);
const searchQuery = ref("");

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
  selectedDeposit.value = null;
};

// Load deposits for a customer
const loadCustomerDeposits = async (customerId) => {
  isLoading.value = true;
  try {
    const response = await api.get(`/customers/${customerId}/deposits`);
    if (response.data.success) {
      deposits.value = response.data.data || [];
    }
  } catch (error) {
    console.error("Erreur lors du chargement des cautions:", error);
    deposits.value = [];
  } finally {
    isLoading.value = false;
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
    alert("Veuillez sélectionner un client.");
    return;
  }
  if (depositForm.amount <= 0) {
    alert("Veuillez entrer un montant valide.");
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
    alert("Veuillez sélectionner une caution.");
    return;
  }
  if (refundAmount.value <= 0) {
    alert("Veuillez entrer un montant valide.");
    return;
  }
  if (
    refundAmount.value >
    (selectedDeposit.value.remaining_amount || selectedDeposit.value.amount)
  ) {
    alert("Le montant du remboursement ne peut pas dépasser le montant restant.");
    return;
  }
  if (!refundReason.value.trim()) {
    alert("Veuillez indiquer le motif du remboursement.");
    return;
  }

  const payload = {
    invoice_type: "RC", // Remboursement Caution
    invoice_action: "SERVICE",
    invoice_currency: selectedDeposit.value.currency || "BIF",
    customer_id: selectedClient.value.id,
    reference_deposit_id: selectedDeposit.value.id,
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
  return new Date(date).toLocaleDateString("fr-FR");
};
</script>

<template>
  <div class="d-flex flex-column h-100 bg-white overflow-auto">
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
