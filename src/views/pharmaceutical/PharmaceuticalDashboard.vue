<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import PharmaceHeader from "./PharmaceHeader.vue";
import { useToast } from '@/composables/useToast';

const store = useStore();
const router = useRouter();
const toast = useToast();

const stats = computed(() => store.getters["pharmaceutical/dashboardStats"] || {});
const loading = computed(() => store.getters["pharmaceutical/dashboardLoading"]);
const expiringSoon = computed(() => store.getters["pharmaceutical/expiringSoonLots"]);
const alertStats = computed(() => store.getters["pharmaceutical/alertStats"]);

onMounted(async () => {
  await Promise.all([
    store.dispatch("pharmaceutical/fetchDashboardStats"),
    store.dispatch("pharmaceutical/fetchExpiringSoon", { days: 30, limit: 10 }),
    store.dispatch("pharmaceutical/fetchAlertStats"),
  ]);
});

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const getDaysUntilExpiration = (date) => {
  if (!date) return 0;
  const expDate = new Date(date);
  const today = new Date();
  const diff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  return diff;
};

const getAlertClass = (days) => {
  if (days <= 0) return "bg-danger";
  if (days <= 30) return "bg-warning";
  return "bg-info";
};

const navigateTo = (route) => {
  router.push(route);
};

const generateAlerts = async () => {
  const result = await store.dispatch("pharmaceutical/generateAlerts");
  if (result.success) {
    toast.success(`${result.data.alerts_created} nouvelles alertes generees`);
  }
};
</script>

<template>
<div>
  <PharmaceHeader />
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Dashboard Pharmaceutique</h2>
      <button class="btn btn-primary" @click="generateAlerts">
        <i class="bi bi-arrow-clockwise me-2"></i>Actualiser les Alertes
      </button>
    </div>

    <div>
      <!-- Stats Cards Row 1 -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <i class="bi bi-capsule text-primary fs-4"></i>
                </div>
                <div>
                  <h6 class="text-muted mb-1">Produits Pharma</h6>
                  <h3 class="mb-0">{{ stats.products?.total_pharmaceutical || 0 }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                  <i class="bi bi-file-medical text-warning fs-4"></i>
                </div>
                <div>
                  <h6 class="text-muted mb-1">Sur Ordonnance</h6>
                  <h3 class="mb-0">{{ stats.products?.requires_prescription || 0 }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                  <i class="bi bi-box-seam text-success fs-4"></i>
                </div>
                <div>
                  <h6 class="text-muted mb-1">Lots Actifs</h6>
                  <h3 class="mb-0">{{ stats.lots?.total_active_lots || 0 }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                  <i class="bi bi-receipt text-info fs-4"></i>
                </div>
                <div>
                  <h6 class="text-muted mb-1">Ordonnances en attente</h6>
                  <h3 class="mb-0">{{ stats.prescriptions?.pending || 0 }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Stats Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm border-start border-danger border-4 h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-danger mb-1">Alertes Critiques</h6>
                  <h2 class="mb-0">{{ alertStats.critical || 0 }}</h2>
                </div>
                <i class="bi bi-exclamation-triangle text-danger fs-1"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm border-start border-warning border-4 h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-warning mb-1">Alertes Warning</h6>
                  <h2 class="mb-0">{{ alertStats.warning || 0 }}</h2>
                </div>
                <i class="bi bi-exclamation-circle text-warning fs-1"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm border-start border-danger border-4 h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-danger mb-1">Lots Expires</h6>
                  <h2 class="mb-0">{{ stats.lots?.expired || 0 }}</h2>
                </div>
                <i class="bi bi-calendar-x text-danger fs-1"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expiring Soon Table -->
      <div class="row">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Lots Expirant Bientot</h5>
              <button class="btn btn-sm btn-outline-primary" @click="navigateTo('/lots')">
                Voir tous les lots
              </button>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Produit</th>
                      <th>N Lot</th>
                      <th>Entrepot</th>
                      <th>Quantite</th>
                      <th>Expiration</th>
                      <th>Jours Restants</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="lot in expiringSoon" :key="lot.id">
                      <td>{{ lot.product?.item_designation || "-" }}</td>
                      <td><code>{{ lot.lot_number }}</code></td>
                      <td>{{ lot.warehouse?.name || "-" }}</td>
                      <td>{{ lot.current_quantity }}</td>
                      <td>{{ formatDate(lot.expiration_date) }}</td>
                      <td>
                        <span
                          class="badge"
                          :class="getAlertClass(getDaysUntilExpiration(lot.expiration_date))"
                        >
                          {{ getDaysUntilExpiration(lot.expiration_date) }} jours
                        </span>
                      </td>
                    </tr>
                    <tr v-if="expiringSoon.length === 0">
                      <td colspan="6" class="text-center py-4 text-muted">
                        Aucun lot expirant prochainement
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white">
              <h5 class="mb-0">Actions Rapides</h5>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <button class="btn btn-outline-primary w-100 py-3" @click="navigateTo('/lots')">
                    <i class="bi bi-box-seam d-block fs-3 mb-2"></i>
                    Gerer les Lots
                  </button>
                </div>
                <div class="col-md-3">
                  <button class="btn btn-outline-success w-100 py-3" @click="navigateTo('/prescriptions')">
                    <i class="bi bi-file-medical d-block fs-3 mb-2"></i>
                    Ordonnances
                  </button>
                </div>
                <div class="col-md-3">
                  <button class="btn btn-outline-info w-100 py-3" @click="navigateTo('/pharmaceutical/products')">
                    <i class="bi bi-capsule d-block fs-3 mb-2"></i>
                    Produits Pharma
                  </button>
                </div>
                <div class="col-md-3">
                  <button class="btn btn-outline-warning w-100 py-3" @click="navigateTo('/clients')">
                    <i class="bi bi-people d-block fs-3 mb-2"></i>
                    Historique Patients
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
