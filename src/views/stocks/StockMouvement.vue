<template>
  <div class="container-fluid p-0">
    <!-- Messages -->
    <div
      v-if="successMessage"
      class="alert alert-success alert-dismissible fade show"
    >
      <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
      <button class="btn-close" @click="successMessage = null"></button>
    </div>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3">
          <i class="bi bi-box-seam me-2"></i>
          {{ warehouse?.name }}
        </h1>
        <small class="text-muted">{{ warehouse?.location }}</small>
      </div>
      <div>
        <router-link :to="`/stock`" class="btn btn-outline-secondary me-2">
          <i class="bi bi-arrow-left"></i> Retour aux Stocks
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/bulk-entry`"
          class="btn btn-outline-success me-2"
        >
          <i class="bi bi-box-arrow-in-down"></i> Entrée Multiple
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/bulk-exit`"
          class="btn btn-outline-danger me-2"
        >
          <i class="bi bi-box-arrow-right"></i> Sortie Multiple
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/history`"
          class="btn btn-outline-warning me-2"
        >
          <i class="bi bi-clock-history"></i> Historique
        </router-link>
        <router-link
          v-if="pendingCount > 0"
          :to="`/warehouses/${warehouseId}/pending-transfers`"
          class="btn btn-outline-info me-2"
        >
          <i class="bi bi-hourglass-split"></i> Transferts
          <span class="badge bg-danger ms-1">{{ pendingCount }}</span>
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/create-transfer`"
          class="btn btn-outline-success me-2"
        >
          <i class="bi bi-arrow-left-right"></i> Créer Transfert
        </router-link>
        <RouterLink
          :to="`/stock/${route.params.id}/products`"
          class="btn btn-success shadow-sm"
        >
          <i class="bi bi-box-seam me-2"></i>Gérer les produits
        </RouterLink>
      </div>
    </div>

    <!-- Stock actuel -->
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0"><i class="bi bi-boxes me-2"></i>Stock Actuel</h5>
      </div>
      <div class="card-body">
        <!-- Barre de recherche -->
        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text bg-light">
              <i class="bi bi-search"></i>
            </span>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Rechercher par code ou désignation..."
            />
            <button
              v-if="searchQuery"
              class="btn btn-outline-secondary"
              @click="searchQuery = ''"
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="summary-card border rounded-3 p-3 bg-light h-100">
              <div class="text-muted small">Produits affichés</div>
              <div class="fs-4 fw-bold">{{ filteredStocks.length }}</div>
              <div class="small text-muted">sur {{ stocks.length }} produit(s)</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="summary-card border rounded-3 p-3 bg-light h-100">
              <div class="text-muted small">Quantité totale affichée</div>
              <div class="fs-4 fw-bold">{{ formatNumber(filteredStockQuantity) }}</div>
              <div class="small text-muted">toutes unités confondues</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="summary-card border rounded-3 p-3 bg-primary-subtle h-100">
              <div class="text-muted small">Chiffre d'affaires potentiel affiché</div>
              <div class="fs-5 fw-bold text-primary">
                {{ formatCurrencyTotals(filteredStockRevenueByCurrency) }}
              </div>
              <div v-if="searchQuery" class="small text-muted">
                Total stock: {{ formatCurrencyTotals(stockRevenueByCurrency) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Code</th>
                <th>Produit</th>
                <th class="text-end">Quantité</th>
                <th class="text-end">Prix Unitaire</th>
                <th class="text-end">Total Produit</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in filteredStocks" :key="stock.id">
                <td>
                  <code>{{ stock.product?.item_code }}</code>
                </td>
                <td>
                  <div class="fw-bold">
                    {{ stock.product?.item_designation }}
                  </div>
                </td>
                <td class="text-end">
                  <span class="badge bg-info fs-6">
                    {{ stock.quantity }}
                    {{ stock.product?.item_measurement_unit }}
                  </span>
                </td>
                <td class="text-end">
                  {{ formatCurrency(stock.unit_price, stock.currency) }}
                </td>
                <td class="text-end fw-bold text-success">
                  {{ formatCurrency(getStockLineTotal(stock), stock.currency) }}
                </td>
                <td class="text-center">
                  <button
                    class="btn btn-sm btn-outline-success me-1"
                    @click="openQuickEntry(stock)"
                    title="Entrée"
                  >
                    <i class="bi bi-plus-lg"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    @click="openQuickExit(stock)"
                    title="Sortie"
                  >
                    <i class="bi bi-dash-lg"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredStocks.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  {{
                    searchQuery
                      ? "Aucun produit trouvé"
                      : "Aucun produit en stock"
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Entrée Rapide -->
    <div
      v-if="showQuickEntryModal"
      class="modal show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle me-2"></i>Entrée Rapide
            </h5>
            <button
              class="btn-close btn-close-white"
              @click="closeQuickEntry"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>{{ selectedStock?.product?.item_designation }}</strong
              ><br />
              <small>{{ selectedStock?.product?.item_code }}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Type d'entrée *</label>
              <select
                class="form-select"
                v-model="quickEntryForm.movement_type"
                required
              >
                <option value="EN">EN - Entrée Normale</option>
                <option value="ER">ER - Entrée par Retour</option>
                <option value="EI">EI - Entrée par Inventaire</option>
                <option value="EAJ">EAJ - Entrée par Ajustement</option>
                <option value="EAU">EAU - Entrée Autre</option>
              </select>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Quantité *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickEntryForm.quantity"
                  required
                  min="0.01"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix Unitaire *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickEntryForm.unit_price"
                  required
                  min="0"
                />
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Devise *</label>
                <select
                  class="form-select"
                  v-model="quickEntryForm.currency"
                  required
                >
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date d'expiration</label>
                <input
                  type="date"
                  class="form-control"
                  v-model="quickEntryForm.date_expiration"
                />
              </div>
            </div>
            <div v-if="quickEntryForm.quantity && quickEntryForm.unit_price" class="alert alert-success mt-3 mb-0">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-semibold">Montant Total :</span>
                <span class="fw-bold fs-5">
                  {{ new Intl.NumberFormat('fr-FR').format(quickEntryForm.quantity * quickEntryForm.unit_price) }}
                  {{ quickEntryForm.currency }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeQuickEntry"
            >
              Annuler
            </button>
            <button
              @click="submitQuickEntry"
              class="btn btn-success"
              :disabled="submitting"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Sortie Rapide -->
    <div
      v-if="showQuickExitModal"
      class="modal show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-dash-circle me-2"></i>Sortie Rapide
            </h5>
            <button
              class="btn-close btn-close-white"
              @click="closeQuickExit"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>{{ selectedStock?.product?.item_designation }}</strong
              ><br />
              <small
                >Stock disponible: {{ selectedStock?.quantity }}
                {{ selectedStock?.product?.item_measurement_unit }}</small
              >
            </div>
            <div class="mb-3">
              <label class="form-label">Type de sortie *</label>
              <select
                class="form-select"
                v-model="quickExitForm.movement_type"
                required
              >
                <option value="SN">SN - Sortie Normale</option>
                <option value="SV">SV - Sortie par Vente</option>
                <option value="SP">SP - Sortie par Perte</option>
                <option value="SD">SD - Sortie par Détérioration</option>
                <option value="SC">SC - Sortie par Consommation</option>
                <option value="SAJ">SAJ - Sortie par Ajustement</option>
                <option value="SAU">SAU - Sortie Autre</option>
              </select>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Quantité *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickExitForm.quantity"
                  required
                  min="0.01"
                  :max="selectedStock?.quantity"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix Unitaire</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickExitForm.unit_price"
                  min="0"
                />
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Devise</label>
                <select class="form-select" v-model="quickExitForm.currency">
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div v-if="['SP', 'SD'].includes(quickExitForm.movement_type)" class="alert alert-warning mt-3 mb-0">
              <i class="bi bi-exclamation-triangle me-1"></i>
              <strong>Perte de stock</strong> — Le montant sera automatiquement enregistré comme perte en caisse.
            </div>
            <div v-if="quickExitForm.quantity && quickExitForm.unit_price" class="alert mt-3 mb-0"
                 :class="['SP', 'SD'].includes(quickExitForm.movement_type) ? 'alert-warning' : 'alert-danger'">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-semibold">Montant Total {{ ['SP', 'SD'].includes(quickExitForm.movement_type) ? '(Perte)' : '' }} :</span>
                <span class="fw-bold fs-5">
                  {{ new Intl.NumberFormat('fr-FR').format(quickExitForm.quantity * quickExitForm.unit_price) }}
                  {{ quickExitForm.currency }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeQuickExit"
            >
              Annuler
            </button>
            <button
              @click="submitQuickExit"
              class="btn btn-danger"
              :disabled="submitting"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const warehouseId = route.params.id;

const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);
const searchQuery = ref("");

const warehouse = ref(null);
const stocks = ref([]);
const pendingCount = ref(0);

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getStockLineTotal = (stock) => {
  return toNumber(stock.quantity) * toNumber(stock.unit_price);
};

const groupRevenueByCurrency = (stockList) => {
  return stockList.reduce((totals, stock) => {
    const currency = stock.currency || "BIF";
    totals[currency] = (totals[currency] || 0) + getStockLineTotal(stock);
    return totals;
  }, {});
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
};

const formatCurrency = (amount, currency = "BIF") => {
  return `${formatNumber(amount)} ${currency || "BIF"}`;
};

const formatCurrencyTotals = (totals) => {
  const entries = Object.entries(totals);
  if (entries.length === 0) return formatCurrency(0, "BIF");
  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" / ");
};

// Computed property pour filtrer les stocks
const filteredStocks = computed(() => {
  if (!searchQuery.value) return stocks.value;

  const query = searchQuery.value.toLowerCase().trim();
  return stocks.value.filter((stock) => {
    const code = stock.product?.item_code?.toLowerCase() || "";
    const designation = stock.product?.item_designation?.toLowerCase() || "";
    return code.includes(query) || designation.includes(query);
  });
});

const filteredStockQuantity = computed(() => {
  return filteredStocks.value.reduce((total, stock) => total + toNumber(stock.quantity), 0);
});

const stockRevenueByCurrency = computed(() => groupRevenueByCurrency(stocks.value));

const filteredStockRevenueByCurrency = computed(() => groupRevenueByCurrency(filteredStocks.value));

const showQuickEntryModal = ref(false);
const showQuickExitModal = ref(false);

const selectedStock = ref(null);

const quickEntryForm = ref({
  product_id: "",
  quantity: "",
  unit_price: "",
  currency: "BIF",
  date_expiration: "",
  movement_type: "EN",
  invoice_ref: "",
});

const quickExitForm = ref({
  product_id: "",
  quantity: "",
  unit_price: "",
  currency: "BIF",
  movement_type: "SN",
  invoice_ref: "",
});

onMounted(() => {
  fetchDashboard();
});

const fetchDashboard = async () => {
  loading.value = true;
  try {
    const resp = await api.get(`warehouses/${warehouseId}/dashboard`);
    if (resp.data.success) {
      warehouse.value = resp.data.data.warehouse;
      stocks.value = resp.data.data.stocks;
      pendingCount.value = resp.data.data.pending_count;
    }
  } catch (err) {
    error.value = "Erreur lors du chargement";
  } finally {
    loading.value = false;
  }
};

// Entrée Rapide
const openQuickEntry = (stock) => {
  selectedStock.value = stock;
  quickEntryForm.value = {
    product_id: stock.product_id,
    quantity: "",
    unit_price: stock.unit_price,
    currency: stock.currency,
    date_expiration: "",
    movement_type: "EN",
    invoice_ref: "",
  };
  showQuickEntryModal.value = true;
};

const closeQuickEntry = () => {
  showQuickEntryModal.value = false;
  quickEntryForm.value = {
    product_id: "",
    quantity: "",
    unit_price: "",
    currency: "BIF",
    date_expiration: "",
    movement_type: "EN",
    invoice_ref: "",
  };
};

const submitQuickEntry = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(
      `warehouses/${warehouseId}/quick-entry`,
      quickEntryForm.value,
    );
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickEntry();
      fetchDashboard();
      setTimeout(() => (successMessage.value = null), 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || "Erreur";
    setTimeout(() => (error.value = null), 5000);
  } finally {
    submitting.value = false;
  }
};

// Sortie Rapide
const openQuickExit = (stock) => {
  selectedStock.value = stock;
  quickExitForm.value = {
    product_id: stock.product_id,
    quantity: "",
    unit_price: stock.unit_price,
    currency: stock.currency || "BIF",
    movement_type: "SN",
    invoice_ref: "",
  };
  showQuickExitModal.value = true;
};

const closeQuickExit = () => {
  showQuickExitModal.value = false;
  quickExitForm.value = {
    product_id: "",
    quantity: "",
    unit_price: "",
    currency: "BIF",
    movement_type: "SN",
    invoice_ref: "",
  };
};

const submitQuickExit = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(
      `warehouses/${warehouseId}/quick-exit`,
      quickExitForm.value,
    );
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickExit();
      fetchDashboard();
      setTimeout(() => (successMessage.value = null), 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || "Erreur";
    setTimeout(() => (error.value = null), 5000);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}
</style>
