<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">
        <i class="bi bi-clock-history me-2"></i>Historique de Production
      </h1>
      <router-link to="/bakery/production" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </router-link>
    </div>

    <div class="card shadow-sm">
      <div class="card-header">
        <div class="row g-2">
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.movement_type" @change="fetchHistory">
              <option value="">Tous les mouvements</option>
              <option value="EN">EN - Production</option>
              <option value="ST">ST - Transfert Sortie</option>
              <option value="SC">SC - Consommation</option>
            </select>
          </div>
          <div class="col-md-3">
            <input type="date" class="form-control form-control-sm" v-model="filters.date_from" @change="fetchHistory">
          </div>
          <div class="col-md-3">
            <input type="date" class="form-control form-control-sm" v-model="filters.date_to" @change="fetchHistory">
          </div>
          <div class="col-md-3">
            <!-- <button class="btn btn-sm btn-info w-100" @click="exportReport">
              <i class="bi bi-download"></i> Exporter
            </button> -->
          </div>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border"></div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Produit</th>
                <th class="text-end">Quantité</th>
                <th>Lot/Référence</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mvt in history" :key="mvt.id">
                <td><small>{{ formatDate(mvt.item_movement_date) }}</small></td>
                <td>
                  <span class="badge" :class="getBadgeClass(mvt.item_movement_type)">
                    {{ mvt.item_movement_type }}
                  </span>
                </td>
                <td>
                  <div class="fw-bold">{{ mvt.item_designation }}</div>
                  <small class="text-muted">{{ mvt.item_code }}</small>
                </td>
                <td class="text-end">
                  {{ mvt.item_quantity }} {{ mvt.item_measurement_unit }}
                </td>
                <td><small>{{ mvt.item_movement_invoice_ref }}</small></td>
                <td><small>{{ mvt.item_movement_description }}</small></td>
              </tr>
              <tr v-if="history.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  Aucun mouvement trouvé
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';

const loading = ref(false);
const history = ref([]);

const filters = reactive({
  movement_type: '',
  date_from: '',
  date_to: ''
});

onMounted(() => {
  fetchHistory();
});

const fetchHistory = async () => {
  loading.value = true;
  try {
    const resp = await api.get('bakery/production/history', { params: filters });
    if (resp.data.success) {
      history.value = resp.data.data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const getBadgeClass = (type) => {
  const classes = {
    'EN': 'bg-success',
    'ST': 'bg-primary',
    'SC': 'bg-warning',
    'SP': 'bg-danger',
    'SD': 'bg-danger'
  };
  return classes[type] || 'bg-secondary';
};

const formatDate = (date) => new Date(date).toLocaleString('fr-FR');

const exportReport = () => {
  // TODO: Implémenter export Excel/PDF
  alert('Fonction d\'export à implémenter');
};
</script>