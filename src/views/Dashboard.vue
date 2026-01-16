<script setup>
import { ref, onMounted } from 'vue';
import { TrendingUp, TrendingDown, Package, Users, DollarSign } from 'lucide-vue-next';
import api from '@/services/api';

const loading = ref(true);
const error = ref(null);

const dashboardData = ref({
  revenue: { total: 0, growth: 0 },
  stock: { total: 0, change: 0 },
  users: { total: 0, new_today: 0 },
  growth: { percentage: 0, trend: 'up' },
  recent_invoices: []
});

const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

const getStatusBadgeClass = (status) => {
  const statusClasses = {
    'success': 'bg-success-subtle text-success',
    'pending': 'bg-warning-subtle text-warning',
    'failed': 'bg-danger-subtle text-danger',
  };
  return statusClasses[status] || 'bg-secondary-subtle text-secondary';
};

const getStatusLabel = (status) => {
  const statusLabels = {
    'success': 'Payé',
    'pending': 'En attente',
    'failed': 'Échoué',
  };
  return statusLabels[status] || status;
};

const fetchDashboard = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await api.get('/dashboard');
    if (response.data.success) {
      dashboardData.value = response.data.data;
    }
  } catch (err) {
    console.error('Erreur lors du chargement du dashboard:', err);
    error.value = 'Impossible de charger les données du dashboard';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <div class="container-fluid p-0">
    <div class="mb-4">
      <h1 class="h3 mb-1">Aperçu du Tableau de Bord</h1>
      <p class="text-muted">Bon retour ! Voici ce qui se passe aujourd'hui.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-2 text-muted">Chargement des données...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchDashboard">Réessayer</button>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      <!-- Stats Grid -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card glass h-100 p-3">
            <div class="d-flex align-items-center mb-2">
               <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-primary-subtle text-primary" style="width: 48px; height: 48px;">
                 <DollarSign :size="24" />
               </div>
               <div>
                 <h6 class="card-subtitle text-muted mb-1">Revenu Total</h6>
                 <h4 class="card-title mb-0">{{ formatNumber(dashboardData.revenue.total) }} FBU</h4>
               </div>
            </div>
            <div class="mt-2">
              <span :class="['badge me-1', dashboardData.revenue.growth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                <component :is="dashboardData.revenue.growth >= 0 ? TrendingUp : TrendingDown" :size="12" class="me-1" />
                {{ dashboardData.revenue.growth }}%
              </span>
              <span class="text-muted small">depuis le mois dernier</span>
            </div>
          </div>
        </div>

         <div class="col-12 col-sm-6 col-lg-3">
          <div class="card glass h-100 p-3">
            <div class="d-flex align-items-center mb-2">
               <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-danger-subtle text-danger" style="width: 48px; height: 48px;">
                 <Package :size="24" />
               </div>
               <div>
                 <h6 class="card-subtitle text-muted mb-1">En Stock</h6>
                 <h4 class="card-title mb-0">{{ formatNumber(dashboardData.stock.total) }}</h4>
               </div>
            </div>
            <div class="mt-2">
              <span :class="['badge me-1', dashboardData.stock.change === 0 ? 'bg-secondary-subtle text-secondary' : (dashboardData.stock.change > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger')]">
                {{ dashboardData.stock.change }}%
              </span>
              <span class="text-muted small">{{ dashboardData.stock.change === 0 ? 'stable' : 'variation' }}</span>
            </div>
          </div>
        </div>

         <div class="col-12 col-sm-6 col-lg-3">
          <div class="card glass h-100 p-3">
            <div class="d-flex align-items-center mb-2">
               <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-info-subtle text-info" style="width: 48px; height: 48px;">
                 <Users :size="24" />
               </div>
               <div>
                 <h6 class="card-subtitle text-muted mb-1">Utilisateurs Actifs</h6>
                 <h4 class="card-title mb-0">{{ dashboardData.users.total }}</h4>
               </div>
            </div>
            <div class="mt-2">
              <span class="badge bg-success-subtle text-success me-1">+{{ dashboardData.users.new_today }}</span>
              <span class="text-muted small">nouveaux aujourd'hui</span>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card glass h-100 p-3">
            <div class="d-flex align-items-center mb-2">
               <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-success-subtle text-success" style="width: 48px; height: 48px;">
                 <TrendingUp :size="24" />
               </div>
               <div>
                 <h6 class="card-subtitle text-muted mb-1">Croissance</h6>
                 <h4 class="card-title mb-0">{{ dashboardData.growth.percentage }}%</h4>
               </div>
            </div>
             <div class="mt-2">
               <span :class="['badge me-1', dashboardData.growth.trend === 'up' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger']">
                 {{ dashboardData.growth.trend === 'up' ? 'En hausse' : 'En baisse' }}
               </span>
             </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity / Table -->
      <div class="row g-4">
        <div class="col-12 col-lg-8">
          <div class="card glass h-100">
            <div class="card-header bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Factures Récentes</h5>
              <router-link to="/sales" class="btn btn-sm btn-light text-muted">Voir Tout</router-link>
            </div>
            <div class="card-body px-0">
               <div class="table-responsive px-4">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th scope="col" class="border-top-0">ID Facture</th>
                      <th scope="col" class="border-top-0">Client</th>
                      <th scope="col" class="border-top-0">Montant</th>
                      <th scope="col" class="border-top-0">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="dashboardData.recent_invoices.length === 0">
                      <td colspan="4" class="text-center text-muted py-4">Aucune facture récente</td>
                    </tr>
                    <tr v-for="invoice in dashboardData.recent_invoices" :key="invoice.id">
                      <td class="fw-medium text-primary">{{ invoice.invoice_number || `#INV-${invoice.id}` }}</td>
                      <td>{{ invoice.customer_name }}</td>
                      <td class="fw-bold">{{ formatNumber(invoice.amount) }} FBU</td>
                      <td>
                        <span :class="['badge rounded-pill px-3', getStatusBadgeClass(invoice.status)]">
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

        <div class="col-12 col-lg-4">
          <div class="card glass h-100">
            <div class="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 class="mb-0">Actions Rapides</h5>
            </div>
            <div class="card-body p-4 d-flex flex-column gap-3">
              <router-link to="/sales" class="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-2">
                <i class="pi pi-plus"></i> Créer une Nouvelle Facture
              </router-link>
              <router-link to="/products" class="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 py-2">
                <i class="pi pi-box"></i> Ajouter un Produit
              </router-link>
              <router-link to="/reports" class="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 py-2">
                <i class="pi pi-file"></i> Générer un Rapport
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bg-primary-subtle { background-color: #ffe4e6 !important; color: #C4251D !important;}
</style>
