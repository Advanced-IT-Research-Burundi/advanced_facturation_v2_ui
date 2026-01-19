<template>
  <div class="container-fluid p-0">
    <!-- Messages -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
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
        <router-link :to="`/warehouses/${warehouseId}/bulk-entry`" class="btn btn-outline-success me-2">
          <i class="bi bi-box-arrow-in-down"></i> Entrée Multiple
        </router-link>
        <router-link :to="`/warehouses/${warehouseId}/bulk-exit`" class="btn btn-outline-danger me-2">
          <i class="bi bi-box-arrow-right"></i> Sortie Multiple
        </router-link>
        <router-link :to="`/warehouses/${warehouseId}/history`" class="btn btn-outline-warning me-2">
          <i class="bi bi-clock-history"></i> Historique
        </router-link>
        <router-link v-if="pendingCount > 0" :to="`/warehouses/${warehouseId}/pending-transfers`" class="btn btn-outline-info me-2">
          <i class="bi bi-hourglass-split"></i> Transferts
          <span class="badge bg-danger ms-1">{{ pendingCount }}</span>
        </router-link>
        <router-link :to="`/warehouses/${warehouseId}/create-transfer`" class="btn btn-outline-success me-2">
          <i class="bi bi-arrow-left-right"></i> Créer Transfert
        </router-link>
         <RouterLink :to="`/stock/${route.params.id}/products`" class="btn btn-success shadow-sm">
          <i class="bi bi-box-seam me-2"></i>Gérer les produits
        </RouterLink>
      </div>
    </div>

    <!-- Stock actuel -->
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">
          <i class="bi bi-boxes me-2"></i>Stock Actuel
        </h5>
      </div>
      <div class="card-body">
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
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in stocks" :key="stock.id">
                <td><code>{{ stock.product?.item_code }}</code></td>
                <td>
                  <div class="fw-bold">{{ stock.product?.item_designation }}</div>
                </td>
                <td class="text-end">
                  <span class="badge bg-info fs-6">
                    {{ stock.quantity }} {{ stock.product?.item_measurement_unit }}
                  </span>
                </td>
                <td class="text-end">{{ stock.unit_price }} {{ stock.currency }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-success me-1" 
                          @click="openQuickEntry(stock)" title="Entrée">
                    <i class="bi bi-plus-lg"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" 
                          @click="openQuickExit(stock)" title="Sortie">
                    <i class="bi bi-dash-lg"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="stocks.length === 0">
                <td colspan="5" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  Aucun produit en stock
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Entrée Rapide -->
    <div v-if="showQuickEntryModal" class="modal show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle me-2"></i>Entrée Rapide
            </h5>
            <button class="btn-close btn-close-white" @click="closeQuickEntry"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>{{ selectedStock?.product?.item_designation }}</strong><br>
              <small>{{ selectedStock?.product?.item_code }}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Type d'entrée *</label>
              <select class="form-select" v-model="quickEntryForm.movement_type" required>
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
                <input type="number" step="0.01" class="form-control" 
                       v-model="quickEntryForm.quantity" required min="0.01">
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix Unitaire *</label>
                <input type="number" step="0.01" class="form-control" 
                       v-model="quickEntryForm.unit_price" required min="0">
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Devise *</label>
                <select class="form-select" v-model="quickEntryForm.currency" required>
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date d'expiration</label>
                <input type="date" class="form-control" v-model="quickEntryForm.date_expiration">
              </div>
            </div>
            <!-- <div class="mt-3">
              <label class="form-label">Référence facture</label>
              <input type="text" class="form-control" v-model="quickEntryForm.invoice_ref" 
                     placeholder="Ex: FAC-2024-001">
            </div> -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeQuickEntry">Annuler</button>
            <button @click="submitQuickEntry" class="btn btn-success" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Sortie Rapide -->
    <div v-if="showQuickExitModal" class="modal show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-dash-circle me-2"></i>Sortie Rapide
            </h5>
            <button class="btn-close btn-close-white" @click="closeQuickExit"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>{{ selectedStock?.product?.item_designation }}</strong><br>
              <small>Stock disponible: {{ selectedStock?.quantity }} {{ selectedStock?.product?.item_measurement_unit }}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Type de sortie *</label>
              <select class="form-select" v-model="quickExitForm.movement_type" required>
                <option value="SN">SN - Sortie Normale</option>
                <option value="SV">SV - Sortie par Vente</option>
                <option value="SP">SP - Sortie par Perte</option>
                <option value="SD">SD - Sortie par Détérioration</option>
                <option value="SC">SC - Sortie par Consommation</option>
                <option value="SAJ">SAJ - Sortie par Ajustement</option>
                <option value="SAU">SAU - Sortie Autre</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Quantité *</label>
              <input type="number" step="0.01" class="form-control" 
                     v-model="quickExitForm.quantity" required min="0.01" 
                     :max="selectedStock?.quantity">
            </div>
            <!-- <div class="mb-3">
              <label class="form-label">Référence facture</label>
              <input type="text" class="form-control" v-model="quickExitForm.invoice_ref"
                     placeholder="Ex: FAC-2024-001">
            </div> -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeQuickExit">Annuler</button>
            <button @click="submitQuickExit" class="btn btn-danger" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const warehouseId = route.params.id;

const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);

const warehouse = ref(null);
const stocks = ref([]);
const pendingCount = ref(0);

const showQuickEntryModal = ref(false);
const showQuickExitModal = ref(false);

const selectedStock = ref(null);

const quickEntryForm = ref({
  product_id: '',
  quantity: '',
  unit_price: '',
  currency: 'BIF',
  date_expiration: '',
  movement_type: 'EN',
  invoice_ref: ''
});

const quickExitForm = ref({
  product_id: '',
  quantity: '',
  movement_type: 'SN',
  invoice_ref: ''
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
    error.value = 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

// Entrée Rapide
const openQuickEntry = (stock) => {
  selectedStock.value = stock;
  quickEntryForm.value = {
    product_id: stock.product_id,
    quantity: '',
    unit_price: stock.unit_price,
    currency: stock.currency,
    date_expiration: '',
    movement_type: 'EN',
    invoice_ref: ''
  };
  showQuickEntryModal.value = true;
};

const closeQuickEntry = () => {
  showQuickEntryModal.value = false;
  quickEntryForm.value = {
    product_id: '',
    quantity: '',
    unit_price: '',
    currency: 'BIF',
    date_expiration: '',
    movement_type: 'EN',
    invoice_ref: ''
  };
};

const submitQuickEntry = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(`warehouses/${warehouseId}/quick-entry`, quickEntryForm.value);
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickEntry();
      fetchDashboard();
      setTimeout(() => successMessage.value = null, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
    setTimeout(() => error.value = null, 5000);
  } finally {
    submitting.value = false;
  }
};

// Sortie Rapide
const openQuickExit = (stock) => {
  selectedStock.value = stock;
  quickExitForm.value = {
    product_id: stock.product_id,
    quantity: '',
    movement_type: 'SN',
    invoice_ref: ''
  };
  showQuickExitModal.value = true;
};

const closeQuickExit = () => {
  showQuickExitModal.value = false;
  quickExitForm.value = {
    product_id: '',
    quantity: '',
    movement_type: 'SN',
    invoice_ref: ''
  };
};

const submitQuickExit = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(`warehouses/${warehouseId}/quick-exit`, quickExitForm.value);
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickExit();
      fetchDashboard();
      setTimeout(() => successMessage.value = null, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
    setTimeout(() => error.value = null, 5000);
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