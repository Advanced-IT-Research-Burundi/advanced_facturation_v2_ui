<template>
  <div class="container-fluid py-4">
    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3">
          <i class="bi bi-clock-history me-2 text-warning"></i>
          Historique des Mouvements
        </h2>
        <small class="text-muted">{{ warehouse?.name }} - {{ warehouse?.location }}</small>
      </div>
      <router-link :to="`/stock/${warehouseId}/movements`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </router-link>
    </div>

    <!-- Messages -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <!-- Filtres -->
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-dark text-white">
        <h5 class="mb-0">
          <i class="bi bi-funnel me-2"></i>Filtres
        </h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label fw-bold">Type de mouvement</label>
            <select class="form-select" v-model="filters.movement_type" @change="fetchMovements">
              <option value="">Tous les types</option>
              <optgroup label="Entrées">
                <option value="EN">EN - Entrée Normale</option>
                <option value="ER">ER - Entrée par Retour</option>
                <option value="EI">EI - Entrée par Inventaire</option>
                <option value="EAJ">EAJ - Entrée par Ajustement</option>
                <option value="ET">ET - Entrée par Transfert</option>
                <option value="EAU">EAU - Entrée Autre</option>
              </optgroup>
              <optgroup label="Sorties">
                <option value="SN">SN - Sortie Normale</option>
                <option value="SV">SV - Sortie par Vente</option>
                <option value="SP">SP - Sortie par Perte</option>
                <option value="SD">SD - Sortie par Détérioration</option>
                <option value="SC">SC - Sortie par Consommation</option>
                <option value="SAJ">SAJ - Sortie par Ajustement</option>
                <option value="ST">ST - Sortie par Transfert</option>
                <option value="SAU">SAU - Sortie Autre</option>
              </optgroup>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold">Date début</label>
            <input type="date" class="form-control" v-model="filters.date_from" @change="fetchMovements">
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold">Date fin</label>
            <input type="date" class="form-control" v-model="filters.date_to" @change="fetchMovements">
          </div>
          <div class="col-md-2">
            <label class="form-label fw-bold">&nbsp;</label>
            <button class="btn btn-outline-secondary w-100" @click="resetFilters">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des mouvements -->
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">
              <i class="bi bi-list-ul me-2"></i>Liste des Mouvements
            </h5>
            <h5 v-if="isFiltered && movements.length > 0" class="mb-0 text-warning"> 
              Montant total: <strong>{{ totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }} BIF</strong> 
            </h5>
          </div>
          <span class="badge bg-light text-dark">{{ movements.length }} mouvements</span>
        </div>
      </div>
      <div class="card-body p-0">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="mt-3 text-muted">Chargement de l'historique...</p>
        </div>

        <!-- Tableau -->
        <div v-else class="table-responsive">
          <table class="table table-hover table-striped align-middle mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 140px">Date d'Entrée</th>
                <th style="width: 100px">Type</th>
                <th style="width: 120px">Code</th>
                <th>Produit</th>
                <th class="text-end" style="width: 120px">Quantité</th>
                <th class="text-end" style="width: 140px">Prix</th>
                <th class="text-end" style="width: 140px">Total</th>
                <th style="width: 150px">Référence</th>
                <th class="text-center" style="width: 100px">OBR</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mvt in movements" :key="mvt.id">
                <td>
                  <small class="text-nowrap">{{ formatDate(mvt.item_movement_date) }}</small>
                </td>
                <td>
                  <span class="badge" :class="getMovementBadgeClass(mvt.item_movement_type)">
                    {{ mvt.item_movement_type }}
                  </span>
                </td>
                <td>
                  <code class="small">{{ mvt.item_code }}</code>
                </td>
                <td>
                  <div class="fw-bold">{{ mvt.item_designation }}</div>
                  <small class="text-muted">{{ mvt.item_code }}</small>
                </td>
                <td class="text-end">
                  <span class="badge bg-info">
                    {{ mvt.item_quantity }}
                  </span>
                </td>
                <td class="text-end">
                  <span class="text-nowrap">
                    {{ mvt.item_purchase_or_sale_price }} {{ mvt.item_purchase_or_sale_currency }}
                  </span>
                </td>
                <td class="text-end">
                  <span class="badge bg-primary">
                    {{ (mvt.item_quantity * mvt.item_purchase_or_sale_price).toFixed(2) }} {{ mvt.item_purchase_or_sale_currency }}
                  </span>
                </td>
                <td>
                  <small>{{ mvt.item_movement_invoice_ref || '-' }}</small>
                </td>
                <td class="text-center">
                  <span class="badge" :class="getOBRBadgeClass(mvt.obr_submission_status)">
                    {{ mvt.obr_submission_status || 'N/A' }}
                  </span>
                </td>
              </tr>
              <tr v-if="movements.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  <p>Aucun mouvement trouvé</p>
                  <small>Essayez de modifier les filtres</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > pagination.per_page" class="card-footer">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            Affichage de {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }} mouvements
          </small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="changePage(pagination.current_page - 1)">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              <li v-for="page in visiblePages" :key="page" 
                  class="page-item" :class="{ active: page === pagination.current_page }">
                <button class="page-link" @click="changePage(page)">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                <button class="page-link" @click="changePage(pagination.current_page + 1)">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const warehouseId = route.params.id;

const loading = ref(false);
const error = ref(null);

const warehouse = ref(null);
const movements = ref([]);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
  from: 0,
  to: 0
});

const filters = ref({
  movement_type: '',
  date_from: '',
  date_to: '',
  page: 1
});

const visiblePages = computed(() => {
  const pages = [];
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  
  let start = Math.max(1, current - 2);
  let end = Math.min(last, current + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const totalAmount = computed(() => {
  return movements.value.reduce((sum, mvt) => {
    return sum + (mvt.item_quantity * mvt.item_purchase_or_sale_price);
  }, 0);
});

const isFiltered = computed(() => {
  return filters.value.movement_type !== '';
});

onMounted(async () => {
  await fetchWarehouse();
  await fetchMovements();
});

const fetchWarehouse = async () => {
  try {
    const resp = await api.get(`warehouses/${warehouseId}/dashboard`);
    if (resp.data.success) {
      warehouse.value = resp.data.data.warehouse;
    }
  } catch (err) {
    console.error('Erreur chargement entrepôt:', err);
  }
};

const fetchMovements = async () => {
  loading.value = true;
  try {
    const params = { ...filters.value };
    const resp = await api.get(`warehouses/${warehouseId}/movements`, { params });
    
    if (resp.data.success) {
      movements.value = resp.data.data.data;
      pagination.value = {
        current_page: resp.data.data.current_page,
        last_page: resp.data.data.last_page,
        per_page: resp.data.data.per_page,
        total: resp.data.data.total,
        from: resp.data.data.from,
        to: resp.data.data.to
      };
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement de l\'historique';
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.last_page) {
    filters.value.page = page;
    fetchMovements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const resetFilters = () => {
  filters.value = {
    movement_type: '',
    date_from: '',
    date_to: '',
    page: 1
  };
  fetchMovements();
};

const getMovementBadgeClass = (type) => {
  return type.startsWith('E') ? 'bg-success' : 'bg-danger';
};

const getOBRBadgeClass = (status) => {
  const classes = {
    'PENDING': 'bg-warning',
    'SUBMITTED': 'bg-info',
    'SUCCESS': 'bg-success',
    'FAILED': 'bg-danger'
  };
  return classes[status] || 'bg-secondary';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.card {
  border-radius: 12px;
}

.table {
  font-size: 0.9rem;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa;
}

.pagination {
  margin: 0;
}

.page-link {
  color: #0d6efd;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>