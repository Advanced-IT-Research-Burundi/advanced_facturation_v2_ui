<template>
  <div class="container-fluid p-4">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><router-link to="/">Accueil</router-link></li>
        <li class="breadcrumb-item"><router-link to="/bakery/production">Production</router-link></li>
        <li class="breadcrumb-item active">Rapport</li>
      </ol>
    </nav>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">
        <i class="bi bi-graph-up me-2 text-secondary"></i>
        Rapport de Production
      </h1>
      <router-link to="/bakery/production" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </router-link>
    </div>

    <!-- Formulaire de génération -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-info text-white">
        <h6 class="mb-0">
          <i class="bi bi-calendar-range me-2"></i>Sélectionner la période du rapport
        </h6>
      </div>
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fw-bold">Date début *</label>
            <input 
              type="date" 
              class="form-control form-control-lg" 
              v-model="filters.date_from" 
              required
            >
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold">Date fin *</label>
            <input 
              type="date" 
              class="form-control form-control-lg" 
              v-model="filters.date_to" 
              required
            >
          </div>
          <div class="col-md-4">
            <button 
              class="btn btn-info btn-lg w-100" 
              @click="fetchReport"
              :disabled="loading || !filters.date_from || !filters.date_to"
            >
              <i class="bi bi-search me-2"></i>
              {{ loading ? 'Génération...' : 'Générer le Rapport' }}
            </button>
          </div>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="setThisWeek">
            <i class="bi bi-calendar-week"></i> Cette semaine
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="setThisMonth">
            <i class="bi bi-calendar-month"></i> Ce mois
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="setLastMonth">
            <i class="bi bi-calendar3"></i> Mois dernier
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-info" style="width: 3rem; height: 3rem;"></div>
      <p class="mt-3 text-muted">Génération du rapport en cours...</p>
    </div>

    <!-- Rapport -->
    <div v-else-if="report" class="report-content">
      <!-- Résumé général -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm stat-card-success">
            <div class="card-body text-center py-4">
              <div class="stat-icon bg-success mx-auto mb-3">
                <i class="bi bi-basket"></i>
              </div>
              <h6 class="text-muted mb-2">Total Produit</h6>
              <h2 class="mb-0 text-success">
                {{ report.summary?.total_produced || 0 }}
              </h2>
              <small class="text-muted">unités produites</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm stat-card-primary">
            <div class="card-body text-center py-4">
              <div class="stat-icon bg-primary mx-auto mb-3">
                <i class="bi bi-truck"></i>
              </div>
              <h6 class="text-muted mb-2">Total Transféré</h6>
              <h2 class="mb-0 text-primary">
                {{ report.summary?.total_transferred || 0 }}
              </h2>
              <small class="text-muted">unités transférées</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm stat-card-warning">
            <div class="card-body text-center py-4">
              <div class="stat-icon bg-warning mx-auto mb-3">
                <i class="bi bi-box-seam"></i>
              </div>
              <h6 class="text-muted mb-2">Reste en Stock</h6>
              <h2 class="mb-0 text-warning">
                {{ (report.summary?.total_produced || 0) - (report.summary?.total_transferred || 0) }}
              </h2>
              <small class="text-muted">unités disponibles</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Production par Produit -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-gradient-primary text-white">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="bi bi-pie-chart me-2"></i>Production par Produit
            </h6>
            <button class="btn btn-sm btn-light" @click="exportProductsTable">
              <i class="bi bi-download"></i> Exporter
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0" id="products-table">
              <thead class="table-light">
                <tr>
                  <th style="width: 8%">Code</th>
                  <th style="width: 32%">Produit</th>
                  <th style="width: 15%" class="text-end">Produit</th>
                  <th style="width: 15%" class="text-end">Transféré</th>
                  <th style="width: 15%" class="text-end">En Stock</th>
                  <th style="width: 15%" class="text-end">Prix Moyen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in report.by_product" :key="item.product_id">
                  <td><code>{{ item.item_code }}</code></td>
                  <td>
                    <div class="fw-bold">{{ item.item_designation }}</div>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-success badge-lg">
                      {{ item.total_produced }} {{ item.item_measurement_unit }}
                    </span>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-primary badge-lg">
                      {{ item.total_transferred }} {{ item.item_measurement_unit }}
                    </span>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-warning text-dark badge-lg">
                      {{ item.total_produced - item.total_transferred }} {{ item.item_measurement_unit }}
                    </span>
                  </td>
                  <td class="text-end">
                    <strong>{{ formatPrice(item.avg_price) }} {{ item.currency }}</strong>
                  </td>
                </tr>
                <tr v-if="!report.by_product || report.by_product.length === 0">
                  <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Aucune production pour cette période
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Production par Jour -->
      <div class="card shadow-sm border-0">
        <div class="card-header bg-gradient-secondary text-white">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="bi bi-calendar3 me-2"></i>Production par Jour
            </h6>
            <button class="btn btn-sm btn-light" @click="exportDaysTable">
              <i class="bi bi-download"></i> Exporter
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 500px;">
            <table class="table table-hover table-sm mb-0" id="days-table">
              <thead class="table-light sticky-top">
                <tr>
                  <th style="width: 50%">Date</th>
                  <th style="width: 25%" class="text-end">Produit</th>
                  <th style="width: 25%" class="text-end">Transféré</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in report.by_day" :key="day.date">
                  <td>
                    <i class="bi bi-calendar-event me-2 text-primary"></i>
                    <strong>{{ formatDateFull(day.date) }}</strong>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-success-subtle text-success">
                      {{ day.produced }}
                    </span>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-primary-subtle text-primary">
                      {{ day.transferred }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!report.by_day || report.by_day.length === 0">
                  <td colspan="3" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Aucune activité pour cette période
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="d-flex justify-content-end gap-2 mt-4">
        <button class="btn btn-outline-secondary" @click="printReport">
          <i class="bi bi-printer me-1"></i>Imprimer
        </button>
        <button class="btn btn-outline-success" @click="exportReport">
          <i class="bi bi-file-earmark-excel me-1"></i>Exporter Excel
        </button>
      </div>
    </div>

    <!-- État initial -->
    <div v-else class="text-center py-5">
      <i class="bi bi-bar-chart fs-1 text-muted d-block mb-3"></i>
      <h5 class="text-muted mb-3">Générez votre rapport de production</h5>
      <p class="text-muted">Sélectionnez une période et cliquez sur "Générer le Rapport"</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';

const loading = ref(false);
const report = ref(null);

const filters = reactive({
  date_from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10)
});

onMounted(() => {
  // Auto-générer le rapport au chargement
  fetchReport();
});

const setThisWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  filters.date_from = monday.toISOString().slice(0, 10);
  filters.date_to = new Date().toISOString().slice(0, 10);
};

const setThisMonth = () => {
  const today = new Date();
  filters.date_from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  filters.date_to = new Date().toISOString().slice(0, 10);
};

const setLastMonth = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
  
  filters.date_from = firstDay.toISOString().slice(0, 10);
  filters.date_to = lastDay.toISOString().slice(0, 10);
};

const fetchReport = async () => {
  if (!filters.date_from || !filters.date_to) {
    return;
  }

  loading.value = true;
  try {
    const resp = await api.post('bakery/production/report', filters);
    if (resp.data.success) {
      report.value = resp.data.data;
    }
  } catch (err) {
    console.error('Erreur lors de la génération du rapport:', err);
  } finally {
    loading.value = false;
  }
};

const formatDateFull = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(price);
};

const printReport = () => {
  window.print();
};

const exportReport = () => {
  alert('Fonction d\'export Excel à implémenter avec votre backend');
};

const exportProductsTable = () => {
  alert('Export du tableau des produits');
};

const exportDaysTable = () => {
  alert('Export du tableau par jour');
};
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.card {
  border-radius: 12px;
}

.stat-card-success,
.stat-card-primary,
.stat-card-warning {
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card-success::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #28a745, #20c997);
}

.stat-card-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #007bff, #0056b3);
}

.stat-card-warning::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.stat-card-success:hover,
.stat-card-primary:hover,
.stat-card-warning:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gradient-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.report-content {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
}

.badge-lg {
  padding: 0.5rem 0.8rem;
  font-weight: 500;
}

.bg-success-subtle {
  background-color: #d1e7dd;
}

.bg-primary-subtle {
  background-color: #cfe2ff;
}

code {
  font-size: 0.875rem;
  padding: 0.2rem 0.4rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

/* Print styles */
@media print {
  .breadcrumb,
  .btn,
  .card-header button {
    display: none !important;
  }

  .card {
    page-break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #dee2e6 !important;
  }

  .stat-icon {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>