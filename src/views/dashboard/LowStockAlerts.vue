<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import ListPagination from './ListPagination.vue';

const loading = ref(false);
const error = ref('');
const alerts = ref([]);
const summary = ref({});
const search = ref('');
const levelFilter = ref('');
const threshold = ref(10);

const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

const levelLabels = { critical: 'Critique', danger: 'Urgent', warning: 'Attention' };
const levelClasses = { critical: 'bg-danger', danger: 'bg-warning text-dark', warning: 'bg-info' };

const filteredAlerts = computed(() => {
  const q = search.value.toLowerCase().trim();
  return alerts.value.filter((a) => {
    if (levelFilter.value && a.alert_level !== levelFilter.value) return false;
    if (!q) return true;
    return (
      (a.product_name || '').toLowerCase().includes(q) ||
      (a.product_code || '').toLowerCase().includes(q) ||
      (a.warehouse_name || '').toLowerCase().includes(q)
    );
  });
});

const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const resp = await api.get('/analytics/low-stock', { params: { threshold: threshold.value } });
    if (resp.data.success) {
      alerts.value = resp.data.data?.alerts || [];
      summary.value = resp.data.data?.summary || {};
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const perPage = 15;
const currentPage = ref(1);
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredAlerts.value.slice(start, start + perPage);
});

// Revenir à la première page quand la liste change (filtre, recherche, rechargement)
watch(filteredAlerts, () => {
  currentPage.value = 1;
});

onMounted(fetchData);
</script>

<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Alertes Stock Bas</h1>
        <p class="text-muted mb-0">Produits dont la quantité est sous le seuil</p>
      </div>
      <router-link to="/dashboard" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i> Tableau de bord
      </router-link>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="row g-3 mb-3">
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Total alertes</div>
          <div class="fs-4 fw-bold">{{ summary.total_alerts || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Critique</div>
          <div class="fs-4 fw-bold text-danger">{{ summary.critical || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Urgent</div>
          <div class="fs-4 fw-bold text-warning">{{ summary.danger || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Attention</div>
          <div class="fs-4 fw-bold text-info">{{ summary.warning || 0 }}</div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-12 col-md-5">
            <input v-model="search" type="text" class="form-control" placeholder="Rechercher produit, code ou stock..." />
          </div>
          <div class="col-6 col-md-3">
            <select v-model="levelFilter" class="form-select">
              <option value="">Tous les niveaux</option>
              <option value="critical">Critique</option>
              <option value="danger">Urgent</option>
              <option value="warning">Attention</option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <div class="input-group">
              <span class="input-group-text">Seuil</span>
              <input v-model.number="threshold" type="number" min="0" class="form-control" />
            </div>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary w-100" @click="fetchData" :disabled="loading">Actualiser</button>
          </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Code</th>
                <th>Produit</th>
                <th>Stock</th>
                <th class="text-end">Qté</th>
                <th>Niveau</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredAlerts.length === 0">
                <td colspan="6" class="text-center py-3 text-success">Aucune alerte</td>
              </tr>
              <tr v-for="alert in paginatedItems" :key="alert.id">
                <td><code>{{ alert.product_code }}</code></td>
                <td class="fw-medium">{{ alert.product_name }}</td>
                <td>{{ alert.warehouse_name }}</td>
                <td class="text-end fw-bold">{{ formatNumber(alert.quantity) }}</td>
                <td>
                  <span :class="['badge', levelClasses[alert.alert_level] || 'bg-secondary']">
                    {{ levelLabels[alert.alert_level] || alert.alert_level }}
                  </span>
                </td>
                <td class="text-center">
                  <router-link :to="`/stock/${alert.warehouse_id}`" class="btn btn-sm btn-outline-primary">
                    Voir le stock
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ListPagination v-if="!loading" v-model="currentPage" :total="filteredAlerts.length" :per-page="perPage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { border-radius: 12px; }
</style>
