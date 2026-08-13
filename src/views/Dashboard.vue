<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import {
  TrendingUp, TrendingDown, Package, Users, DollarSign,
  ShoppingCart, AlertTriangle, BarChart3, RefreshCw
} from 'lucide-vue-next';
import Chart from 'chart.js/auto';

const store = useStore();

const refreshing = ref(false);

const loading = computed(() => store.getters['dashboard/isLoading']);
const loadError = computed(() => store.getters['dashboard/error']);
const stats = computed(() => store.getters['dashboard/stats']);
const salesChart = computed(() => store.getters['dashboard/salesChart']);
const topProducts = computed(() => store.getters['dashboard/topProducts']);
const topCustomers = computed(() => store.getters['dashboard/topCustomers']);
const lowStockAlerts = computed(() => store.getters['dashboard/lowStockAlerts']);
const recentInvoices = computed(() => store.getters['dashboard/recentInvoices']);
const hasDashboardData = computed(() => store.getters['dashboard/hasData']);
const salesPeriod = computed({
  get: () => store.getters['dashboard/salesPeriod'],
  set: (period) => store.commit('dashboard/SET_SALES_PERIOD', period),
});

// Chart instances
let salesChartInstance = null;
let productsChartInstance = null;

// Chart refs
const salesChartCanvas = ref(null);
const productsChartCanvas = ref(null);

// Formatters
const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
const formatCurrency = (num) => `${formatNumber(num)} FBU`;

// Fetch all dashboard data
const fetchDashboardData = async () => {
  await store.dispatch('dashboard/fetchDashboardData');
  await nextTick();
  renderSalesChart();
  renderProductsChart();
};

// Refresh data
const refreshData = async () => {
  refreshing.value = true;
  await fetchDashboardData();
  refreshing.value = false;
};

// Render sales chart
const renderSalesChart = () => {
  if (!salesChartCanvas.value || !salesChart.value) return;

  if (salesChartInstance) salesChartInstance.destroy();

  const ctx = salesChartCanvas.value.getContext('2d');
  const data = Array.isArray(salesChart.value?.chart) ? salesChart.value.chart : [];
  if (!data.length) return;

  salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Ventes TVAC',
          data: data.map(d => d.total_sales),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'TVA',
          data: data.map(d => d.total_vat),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatNumber(value)
          }
        }
      }
    }
  });
};

// Render products chart
const renderProductsChart = () => {
  if (!productsChartCanvas.value || topProducts.value.length === 0) return;

  if (productsChartInstance) productsChartInstance.destroy();

  const ctx = productsChartCanvas.value.getContext('2d');

  productsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: topProducts.value.map(p => (p.product_name || '').substring(0, 20)),
      datasets: [{
        data: topProducts.value.map(p => p.total_amount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 10 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${formatCurrency(context.raw)}`
          }
        }
      }
    }
  });
};

// Watch period changes
watch(salesPeriod, async () => {
  await store.dispatch('dashboard/fetchSalesChart');
  await nextTick();
  renderSalesChart();
});

// Get alert badge class
const getAlertClass = (level) => {
  const classes = {
    critical: 'bg-danger',
    danger: 'bg-warning text-dark',
    warning: 'bg-info',
  };
  return classes[level] || 'bg-secondary';
};

// Get status badge class
const getStatusClass = (status) => {
  const classes = {
    success: 'bg-success',
    pending: 'bg-warning text-dark',
    failed: 'bg-danger',
  };
  return classes[status] || 'bg-secondary';
};

const getStatusLabel = (status) => {
  const labels = {
    success: 'Payé',
    pending: 'En attente',
    failed: 'Échoué',
  };
  return labels[status] || status;
};

onMounted(async () => {
  await nextTick();
  renderSalesChart();
  renderProductsChart();
  fetchDashboardData();
});

onUnmounted(() => {
  if (salesChartInstance) salesChartInstance.destroy();
  if (productsChartInstance) productsChartInstance.destroy();
});
</script>

<template>
  <div class="container-fluid p-0">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Tableau de Bord</h1>
        <p class="text-muted mb-0">Vue d'ensemble de votre activité</p>
      </div>
      <button class="btn btn-outline-primary btn-sm" @click="refreshData" :disabled="refreshing">
        <RefreshCw :size="16" :class="{ 'spin': refreshing }" class="me-1" />
        Actualiser
      </button>
    </div>

    <!-- Error -->
    <div v-if="loadError && !hasDashboardData" class="alert alert-danger d-flex align-items-center" role="alert">
      <span class="me-2">&#9888;</span>
      {{ loadError }}
      <button class="btn btn-sm btn-outline-danger ms-auto" @click="fetchDashboardData">Réessayer</button>
    </div>

    <div class="dashboard-content">
      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <!-- Ventes du mois -->
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-3 p-2 bg-primary bg-opacity-10 me-3">
                  <DollarSign :size="24" class="text-primary" />
                </div>
                <div class="flex-grow-1">
                  <p class="text-muted small mb-1">Ventes du mois</p>
                  <h4 class="mb-0">{{ formatCurrency(stats?.sales?.current || 0) }}</h4>
                </div>
              </div>
              <div class="mt-2">
                <span :class="['badge', stats?.sales?.growth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                  <component :is="stats?.sales?.growth >= 0 ? TrendingUp : TrendingDown" :size="12" class="me-1" />
                  {{ stats?.sales?.growth || 0 }}%
                </span>
                <span class="text-muted small ms-1">vs mois dernier</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Factures -->
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-3 p-2 bg-success bg-opacity-10 me-3">
                  <ShoppingCart :size="24" class="text-success" />
                </div>
                <div class="flex-grow-1">
                  <p class="text-muted small mb-1">Factures du mois</p>
                  <h4 class="mb-0">{{ stats?.invoices?.current || 0 }}</h4>
                </div>
              </div>
              <div class="mt-2">
                <span :class="['badge', stats?.invoices?.growth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                  {{ stats?.invoices?.growth >= 0 ? '+' : '' }}{{ stats?.invoices?.growth || 0 }}%
                </span>
                <span class="text-muted small ms-1">vs mois dernier</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stock -->
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-3 p-2 bg-info bg-opacity-10 me-3">
                  <Package :size="24" class="text-info" />
                </div>
                <div class="flex-grow-1">
                  <p class="text-muted small mb-1">Articles en stock</p>
                  <h4 class="mb-0">{{ formatNumber(stats?.stock?.total || 0) }}</h4>
                </div>
              </div>
              <div class="mt-2" v-if="stats?.stock?.low_stock_alerts > 0">
                <span class="badge bg-warning text-dark">
                  <AlertTriangle :size="12" class="me-1" />
                  {{ stats?.stock?.low_stock_alerts }} alertes
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ventes aujourd'hui -->
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-3 p-2 bg-warning bg-opacity-10 me-3">
                  <BarChart3 :size="24" class="text-warning" />
                </div>
                <div class="flex-grow-1">
                  <p class="text-muted small mb-1">Ventes aujourd'hui</p>
                  <h4 class="mb-0">{{ formatCurrency(stats?.sales?.today || 0) }}</h4>
                </div>
              </div>
              <div class="mt-2">
                <span class="badge bg-secondary-subtle text-secondary">
                  {{ stats?.invoices?.today || 0 }} factures
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="row g-3 mb-4">
        <!-- Sales Chart -->
        <div class="col-12 col-lg-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">Évolution des Ventes</h6>
              <select v-model="salesPeriod" class="form-select form-select-sm" style="width: auto;">
                <option value="day">Par jour (30j)</option>
                <option value="week">Par semaine (12s)</option>
                <option value="month">Par mois (12m)</option>
              </select>
            </div>
            <div class="card-body">
              <div style="height: 300px;">
                <canvas ref="salesChartCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products Chart -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0">
              <h6 class="mb-0 fw-bold">Top 5 Produits</h6>
            </div>
            <div class="card-body">
              <div style="height: 300px;">
                <canvas ref="productsChartCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tables Row -->
      <div class="row g-3 mb-4">
        <!-- Top Products Table -->
        <div class="col-12 col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">Top Produits Vendus</h6>
              <router-link to="/reports" class="btn btn-sm btn-link text-decoration-none">Voir tout</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Produit</th>
                      <th class="text-end">Qté</th>
                      <th class="text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="topProducts.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">Aucune donnée</td>
                    </tr>
                    <tr v-for="product in topProducts" :key="product.rank">
                      <td>
                        <span class="badge bg-primary rounded-pill">{{ product.rank }}</span>
                      </td>
                      <td>
                        <span class="fw-medium">{{ product.product_name }}</span>
                        <br><small class="text-muted">{{ product.product_code }}</small>
                      </td>
                      <td class="text-end">{{ formatNumber(product.total_quantity) }}</td>
                      <td class="text-end fw-bold">{{ formatCurrency(product.total_amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Customers Table -->
        <div class="col-12 col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">Top Clients</h6>
              <router-link to="/clients" class="btn btn-sm btn-link text-decoration-none">Voir tout</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Client</th>
                      <th class="text-end">Factures</th>
                      <th class="text-end">CA Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="topCustomers.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">Aucune donnée</td>
                    </tr>
                    <tr v-for="customer in topCustomers" :key="customer.rank">
                      <td>
                        <span class="badge bg-success rounded-pill">{{ customer.rank }}</span>
                      </td>
                      <td>
                        <span class="fw-medium">{{ customer.customer_name }}</span>
                        <br><small class="text-muted">{{ customer.customer_phone }}</small>
                      </td>
                      <td class="text-end">{{ customer.invoice_count }}</td>
                      <td class="text-end fw-bold">{{ formatCurrency(customer.total_amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="row g-3">
        <!-- Low Stock Alerts -->
        <div class="col-12 col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">
                <AlertTriangle :size="16" class="text-warning me-2" />
                Alertes Stock Bas
              </h6>
              <router-link to="/stock" class="btn btn-sm btn-link text-decoration-none">Voir tout</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Produit</th>
                      <th>Stock</th>
                      <th class="text-end">Qté</th>
                      <th>Niveau</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="lowStockAlerts.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">
                        <span class="text-success">Aucune alerte</span>
                      </td>
                    </tr>
                    <tr v-for="alert in lowStockAlerts" :key="alert.id">
                      <td>
                        <span class="fw-medium">{{ alert.product_name }}</span>
                      </td>
                      <td>{{ alert.warehouse_name }}</td>
                      <td class="text-end fw-bold">{{ formatNumber(alert.quantity) }}</td>
                      <td>
                        <span :class="['badge', getAlertClass(alert.alert_level)]">
                          {{ alert.alert_level === 'critical' ? 'Critique' : alert.alert_level === 'danger' ? 'Urgent' : 'Attention' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div class="col-12 col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">Factures Récentes</h6>
              <router-link to="/sales" class="btn btn-sm btn-link text-decoration-none">Voir tout</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>N° Facture</th>
                      <th>Client</th>
                      <th class="text-end">Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="recentInvoices.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">Aucune facture</td>
                    </tr>
                    <tr v-for="invoice in recentInvoices" :key="invoice.id">
                      <td class="fw-medium text-primary">{{ invoice.invoice_number || `#${invoice.id}` }}</td>
                      <td>{{ invoice.customer_name }}</td>
                      <td class="text-end fw-bold">{{ formatCurrency(invoice.amount) }}</td>
                      <td>
                        <span :class="['badge', getStatusClass(invoice.status)]">
                          {{ getStatusLabel(invoice.status) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 12px;
}

.card-header {
  border-radius: 12px 12px 0 0;
  padding: 1rem 1.25rem;
}

.bg-success-subtle { background-color: rgba(16, 185, 129, 0.1) !important; }
.bg-danger-subtle { background-color: rgba(239, 68, 68, 0.1) !important; }
.bg-warning-subtle { background-color: rgba(245, 158, 11, 0.1) !important; }
.bg-secondary-subtle { background-color: rgba(107, 114, 128, 0.1) !important; }

.text-success { color: #10b981 !important; }
.text-danger { color: #ef4444 !important; }

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.table th {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  font-size: 0.875rem;
  vertical-align: middle;
}
</style>
