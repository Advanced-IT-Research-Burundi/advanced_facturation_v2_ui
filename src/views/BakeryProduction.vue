<template>
  <div class="container-fluid p-0">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3">
          <i class="bi bi-egg-fried me-2"></i>Production Boulangerie
        </h1>
        <small class="text-muted">{{ productionWarehouse?.name }}</small>
      </div>
      <div>
        <router-link to="/bakery/production/history" class="btn btn-outline-info me-2">
          <i class="bi bi-clock-history"></i> Historique
        </router-link>
        <router-link to="/bakery/production/record" class="btn btn-success me-2">
          <i class="bi bi-plus-circle"></i> Production
        </router-link>
        <router-link to="/bakery/production/transfer" class="btn btn-primary">
          <i class="bi bi-arrow-right-circle"></i> Transfert Multiple
        </router-link>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-danger alert-dismissible">
      {{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>
    <div v-if="successMessage" class="alert alert-success alert-dismissible">
      {{ successMessage }}
      <button class="btn-close" @click="successMessage = null"></button>
    </div>

    <!-- Statistiques -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="card shadow-sm border-success">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <i class="bi bi-basket fs-1 text-success me-3"></i>
              <div>
                <h6 class="text-muted mb-1">Production du Jour</h6>
                <h3 class="mb-0">{{ stats.todayProduction }} unités</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card shadow-sm border-primary">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <i class="bi bi-truck fs-1 text-primary me-3"></i>
              <div>
                <h6 class="text-muted mb-1">Transferts du Jour</h6>
                <h3 class="mb-0">{{ stats.todayTransfers }} unités</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stocks -->
    <div class="row g-3">
      <!-- Stock Matières Premières -->
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0">
              <i class="bi bi-box-seam me-2"></i>Matières Premières
            </h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover table-sm">
                <thead class="table-light">
                  <tr>
                    <th>Produit</th>
                    <th class="text-end">Stock</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stock in rawMaterials" :key="stock.id">
                    <td>
                      <div class="fw-bold">{{ stock.product?.item_designation }}</div>
                      <small class="text-muted">{{ stock.product?.item_code }}</small>
                    </td>
                    <td class="text-end">
                      <span class="badge bg-warning text-dark">
                        {{ stock.quantity }} {{ stock.product?.item_measurement_unit }}
                      </span>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-success" @click="openQuickEntry(stock)" title="Entrée">
                        <i class="bi bi-plus-circle"></i>
                      </button>
                      <button class="btn btn-sm btn-danger ms-1" @click="openQuickExit(stock)" title="Sortie">
                        <i class="bi bi-dash-circle"></i>
                      </button>
                      <button class="btn btn-sm btn-info ms-1" @click="markAsFinished(stock)" title="Marquer comme fini">
                        <i class="bi bi-check-circle"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="rawMaterials.length === 0">
                    <td colspan="3" class="text-center py-4 text-muted">
                      Aucune matière première
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Produits Finis -->
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">
              <i class="bi bi-basket me-2"></i>Produits Finis
            </h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-success"></div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover table-sm">
                <thead class="table-light">
                  <tr>
                    <th>Produit</th>
                    <th class="text-end">Stock</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stock in finishedProducts" :key="stock.id">
                    <td>
                      <div class="fw-bold">{{ stock.product?.item_designation }}</div>
                      <small class="text-muted">{{ stock.product?.item_code }}</small>
                    </td>
                    <td class="text-end">
                      <span class="badge bg-success">
                        {{ stock.quantity }} {{ stock.product?.item_measurement_unit }}
                      </span>
                    </td>
                    <td class="text-center">
                      <!-- <button class="btn btn-sm btn-success" @click="openQuickEntry(stock)" title="Entrée">
                        <i class="bi bi-plus-circle"></i>
                      </button>
                      <button class="btn btn-sm btn-danger ms-1" @click="openQuickExit(stock)" title="Sortie">
                        <i class="bi bi-dash-circle"></i>
                      </button> -->
                      <button class="btn btn-sm btn-primary ms-1" @click="openQuickTransfer(stock)" title="Transférer">
                        <i class="bi bi-arrow-right"></i>
                      </button>
                      <button class="btn btn-sm btn-warning ms-1" @click="markAsRaw(stock)" title="Retour matière">
                        <i class="bi bi-arrow-counterclockwise"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="finishedProducts.length === 0">
                    <td colspan="3" class="text-center py-4 text-muted">
                      Aucun produit fini
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Entrée Rapide -->
    <div v-if="showQuickEntryModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
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
            <div class="mt-3">
              <label class="form-label">Devise *</label>
              <select class="form-select" v-model="quickEntryForm.currency" required>
                <option value="BIF">BIF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
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
    <div v-if="showQuickExitModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
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
                <option value="SC">SC - Sortie par Consommation</option>
                <option value="SP">SP - Sortie par Perte</option>
                <option value="SD">SD - Sortie par Détérioration</option>
                <option value="SAJ">SAJ - Sortie par Ajustement</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Quantité *</label>
              <input type="number" step="0.01" class="form-control" 
                     v-model="quickExitForm.quantity" required min="0.01" 
                     :max="selectedStock?.quantity">
            </div>
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

    <!-- Modal Transfert Rapide -->
    <div v-if="showQuickTransferModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-arrow-right me-2"></i>Transfert Rapide
            </h5>
            <button class="btn-close btn-close-white" @click="closeQuickTransfer"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-success">
              <strong>{{ selectedStock?.product?.item_designation }}</strong><br>
              <small>Stock disponible: {{ selectedStock?.quantity }} {{ selectedStock?.product?.item_measurement_unit }}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Entrepôt de destination *</label>
              <select class="form-select" v-model="quickTransferForm.destination_warehouse_id" required>
                <option value="">Sélectionner...</option>
                <option v-for="wh in salesWarehouses" :key="wh.id" :value="wh.id">
                  {{ wh.name }} - {{ wh.location }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Quantité *</label>
              <input type="number" step="0.01" class="form-control" 
                     v-model="quickTransferForm.quantity" required min="0.01" 
                     :max="selectedStock?.quantity">
            </div>
            <div class="mb-3">
              <label class="form-label">Notes</label>
              <textarea class="form-control" v-model="quickTransferForm.notes" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeQuickTransfer">Annuler</button>
            <button @click="submitQuickTransfer" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Transférer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/services/api';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);

const productionWarehouse = ref(null);
const productionStock = ref([]);
const salesWarehouses = ref([]);
const stats = ref({ todayProduction: 0, todayTransfers: 0 });

const showQuickEntryModal = ref(false);
const showQuickExitModal = ref(false);
const showQuickTransferModal = ref(false);
const selectedStock = ref(null);

const quickEntryForm = ref({
  movement_type: 'EN',
  quantity: '',
  unit_price: '',
  currency: 'BIF'
});

const quickExitForm = ref({
  movement_type: 'SC',
  quantity: ''
});

const quickTransferForm = ref({
  destination_warehouse_id: '',
  quantity: '',
  notes: ''
});

const rawMaterials = computed(() => 
  productionStock.value.filter(s => s.production_status === 'RAW')
);

const finishedProducts = computed(() => 
  productionStock.value.filter(s => s.production_status === 'FINISHED')
);

onMounted(() => {
  fetchDashboard();
  
  if (route.query.success) {
    successMessage.value = route.query.success;
    router.replace({ query: {} });
    setTimeout(() => { successMessage.value = null; }, 3000);
  }
});

const fetchDashboard = async () => {
  loading.value = true;
  error.value = null;
  try {
    const resp = await api.get('bakery/production/dashboard');
    
    if (resp.data.success) {
      productionWarehouse.value = resp.data.data.production_warehouse;
      productionStock.value = resp.data.data.production_stock || [];
      salesWarehouses.value = resp.data.data.sales_warehouses || [];
      stats.value = {
        todayProduction: resp.data.data.today_production || 0,
        todayTransfers: resp.data.data.today_transfers || 0
      };
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const openQuickEntry = (stock) => {
  selectedStock.value = stock;
  quickEntryForm.value = {
    movement_type: 'EN',
    quantity: '',
    unit_price: stock.unit_price || '',
    currency: stock.currency || 'BIF'
  };
  showQuickEntryModal.value = true;
};

const closeQuickEntry = () => {
  showQuickEntryModal.value = false;
  selectedStock.value = null;
};

const submitQuickEntry = async () => {
  submitting.value = true;
  error.value = null;
  try {
    const resp = await api.post('bakery/production/quick-entry', {
      product_id: selectedStock.value.product_id,
      ...quickEntryForm.value
    });
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickEntry();
      await fetchDashboard();
      setTimeout(() => { successMessage.value = null; }, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
  } finally {
    submitting.value = false;
  }
};

const openQuickExit = (stock) => {
  selectedStock.value = stock;
  quickExitForm.value = {
    movement_type: 'SC',
    quantity: ''
  };
  showQuickExitModal.value = true;
};

const closeQuickExit = () => {
  showQuickExitModal.value = false;
  selectedStock.value = null;
};

const submitQuickExit = async () => {
  submitting.value = true;
  error.value = null;
  try {
    const resp = await api.post('bakery/production/quick-exit', {
      product_id: selectedStock.value.product_id,
      ...quickExitForm.value
    });
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickExit();
      await fetchDashboard();
      setTimeout(() => { successMessage.value = null; }, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
  } finally {
    submitting.value = false;
  }
};

const openQuickTransfer = (stock) => {
  selectedStock.value = stock;
  quickTransferForm.value = {
    destination_warehouse_id: '',
    quantity: stock.quantity,
    notes: ''
  };
  showQuickTransferModal.value = true;
};

const closeQuickTransfer = () => {
  showQuickTransferModal.value = false;
  selectedStock.value = null;
};

const submitQuickTransfer = async () => {
  submitting.value = true;
  error.value = null;
  try {
    const resp = await api.post('bakery/production/quick-transfer', {
      product_id: selectedStock.value.product_id,
      ...quickTransferForm.value
    });
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickTransfer();
      await fetchDashboard();
      setTimeout(() => { successMessage.value = null; }, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
  } finally {
    submitting.value = false;
  }
};

const markAsFinished = async (stock) => {
  if (!confirm(`Marquer "${stock.product?.item_designation}" comme produit fini ?`)) return;
  
  try {
    const resp = await api.post('bakery/production/change-status', {
      warehouse_product_id: stock.id,
      status: 'FINISHED'
    });
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      await fetchDashboard();
      setTimeout(() => { successMessage.value = null; }, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
  }
};

const markAsRaw = async (stock) => {
  if (!confirm(`Retourner "${stock.product?.item_designation}" en matière première ?`)) return;
  
  try {
    const resp = await api.post('bakery/production/change-status', {
      warehouse_product_id: stock.id,
      status: 'RAW'
    });
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      await fetchDashboard();
      setTimeout(() => { successMessage.value = null; }, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur';
  }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}

.card:hover {
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
</style>