<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft, Calendar, RefreshCw, Clock, Users
} from 'lucide-vue-next';
import { useStore } from 'vuex';
import api from '@/services/api';
import FinanceHeader from './FinanceHeader.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();

const loading = ref(false);
const dailySummary = ref(null);
const userProfile = ref(null);
const currentRegister = ref(store.state.data.financeCashRegisterCurrent || null);

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch (error) {
    return null;
  }
};

const currentUser = computed(() => store.getters['auth/currentUser'] || getStoredUser());
const userId = computed(() => Number(route.params.userId));

const todayIso = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};
const selectedDate = ref(todayIso());

const adminRoleNames = ['admin', 'super_admin'];
const isAdminRole = (role) => {
  const name = role?.name?.toLowerCase();
  const label = role?.label?.toLowerCase();
  return adminRoleNames.includes(name)
    || label === 'administrateur'
    || label === 'super administrateur';
};
const isAdmin = computed(() => {
  const roles = currentUser.value?.roles || [];
  const roleNames = currentUser.value?.role_names || [];
  return roles.some(isAdminRole)
    || roleNames.some((name) => adminRoleNames.includes(name?.toLowerCase()));
});

const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';
const formatDateTime = (date) => (date ? new Date(date).toLocaleString('fr-FR') : '-');

const userSummary = computed(() => {
  const rows = dailySummary.value?.user_summaries || [];
  return rows.find((row) => Number(row.user_id) === userId.value) || {
    user_id: userId.value,
    user_name: userProfile.value?.name || 'Utilisateur',
    user_email: userProfile.value?.email || null,
    transaction_count: 0,
    total_income: 0,
    total_expense: 0,
    total_adjustment: 0,
    net_amount: 0,
    latest_transaction_at: null,
  };
});

const toLocalDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const sessionMovements = computed(() => {
  const movements = currentRegister.value?.register?.movements || [];
  const selected = selectedDate.value;
  return movements.filter((mov) => {
    const sameUser = Number(mov.created_by?.id || mov.created_by) === userId.value;
    const sameDay = toLocalDateKey(mov.created_at) === selected;
    return sameUser && sameDay;
  });
});

const dayHistoryMovements = computed(() => dailySummary.value?.recent_movements || []);

const displayName = computed(() => userSummary.value.user_name || userProfile.value?.name || 'Utilisateur');
const displayEmail = computed(() => userSummary.value.user_email || userProfile.value?.email || '-');

const ensureAccess = () => {
  if (!isAdmin.value && Number(currentUser.value?.id) !== userId.value) {
    router.replace({ name: 'cash-register' });
    return false;
  }
  return true;
};

const fetchUserProfile = async () => {
  if (!isAdmin.value && Number(currentUser.value?.id) === userId.value) {
    userProfile.value = currentUser.value;
    return;
  }

  try {
    const res = await api.get(`/users/${userId.value}`);
    if (res.data.success) {
      userProfile.value = res.data.data;
    }
  } catch (error) {
    // Fallback: name may still come from daily-summary
    console.error('Error fetching user profile:', error);
  }
};

const fetchCurrentRegister = async () => {
  try {
    const res = await api.get('/cash-registers/current');
    if (res.data.success) {
      currentRegister.value = res.data.data;
    }
  } catch (error) {
    console.error('Error fetching current register:', error);
  }
};

const fetchActivity = async () => {
  if (!ensureAccess()) return;

  loading.value = true;
  try {
    const [summaryRes] = await Promise.all([
      api.get('/cash-registers/daily-summary', {
        params: {
          date: selectedDate.value,
          user_id: userId.value,
          hotel_section: 'null',
        },
      }),
      fetchCurrentRegister(),
    ]);
    if (summaryRes.data.success) {
      dailySummary.value = summaryRes.data.data;
    }
  } catch (error) {
    console.error('Error fetching user cash activity:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'cash-register' });
};

watch(userId, async () => {
  if (!ensureAccess()) return;
  await fetchUserProfile();
  await fetchActivity();
});

onMounted(async () => {
  if (!ensureAccess()) return;
  await fetchUserProfile();
  await fetchActivity();
});
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader />

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <button type="button" class="btn btn-link text-decoration-none ps-0 mb-2" @click="goBack">
          <ArrowLeft :size="16" class="me-1" /> Retour à la caisse
        </button>
        <div class="d-flex align-items-center gap-2">
          <Users :size="22" class="text-primary" />
          <div>
            <h1 class="h3 mb-0">{{ displayName }}</h1>
            <p class="text-muted mb-0">{{ displayEmail }}</p>
          </div>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input
          type="date"
          v-model="selectedDate"
          class="form-control form-control-sm"
          style="width: 150px"
          @change="fetchActivity"
        >
        
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="summary-tile">
          <p class="text-muted small mb-1">Transactions</p>
          <h5 class="mb-0">{{ userSummary.transaction_count || 0 }}</h5>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="summary-tile">
          <p class="text-muted small mb-1">Entrées</p>
          <h5 class="mb-0 text-success">+{{ formatCurrency(userSummary.total_income) }}</h5>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="summary-tile">
          <p class="text-muted small mb-1">Sorties</p>
          <h5 class="mb-0 text-danger">-{{ formatCurrency(userSummary.total_expense) }}</h5>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="summary-tile">
          <p class="text-muted small mb-1">Montant net</p>
          <h5 class="mb-0" :class="userSummary.net_amount < 0 ? 'text-danger' : 'text-success'">
            {{ userSummary.net_amount < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(userSummary.net_amount || 0)) }}
          </h5>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white d-flex align-items-center gap-2">
        <Clock :size="16" class="text-muted" />
        <h6 class="mb-0 fw-bold">Mouvements de caisse</h6>
        <span class="text-muted small ms-auto">
          {{ currentRegister?.register ? 'Session en cours' : 'Aucune caisse ouverte' }}
        </span>
      </div>
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5 text-muted">Chargement...</div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Heure</th>
                <th>Type</th>
                <th>Description</th>
                <th>Référence</th>
                <th class="text-end">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!sessionMovements.length">
                <td colspan="5" class="text-center text-muted py-4">
                  Aucun mouvement de caisse pour cet utilisateur
                </td>
              </tr>
              <tr v-for="mov in sessionMovements" :key="'session-' + mov.id">
                <td>{{ formatDateTime(mov.created_at) }}</td>
                <td>
                  <span
                    :class="[
                      'badge',
                      mov.type === 'income' ? 'bg-success' : mov.type === 'expense' ? 'bg-danger' : 'bg-warning'
                    ]"
                  >
                    {{ mov.type === 'income' ? 'Entrée' : mov.type === 'expense' ? 'Sortie' : 'Ajustement' }}
                  </span>
                </td>
                <td>{{ mov.description }}</td>
                <td>{{ mov.reference || '-' }}</td>
                <td
                  class="text-end fw-bold"
                  :class="mov.type === 'income' ? 'text-success' : mov.type === 'expense' ? 'text-danger' : ''"
                >
                  {{ mov.type === 'expense' ? '-' : '+' }}{{ formatCurrency(mov.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex align-items-center gap-2">
        <Clock :size="16" class="text-muted" />
        <h6 class="mb-0 fw-bold">Historique des transactions du jour</h6>
        <span class="text-muted small ms-auto">{{ selectedDate }}</span>
      </div>
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5 text-muted">Chargement...</div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Heure</th>
                <th>Type</th>
                <th>Description</th>
                <th>Référence</th>
                <th class="text-end">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!dayHistoryMovements.length">
                <td colspan="5" class="text-center text-muted py-4">
                  Aucune transaction enregistrée pour cette date
                </td>
              </tr>
              <tr v-for="mov in dayHistoryMovements" :key="'day-' + mov.id">
                <td>{{ formatDateTime(mov.created_at) }}</td>
                <td>
                  <span
                    :class="[
                      'badge',
                      mov.type === 'income' ? 'bg-success' : mov.type === 'expense' ? 'bg-danger' : 'bg-warning'
                    ]"
                  >
                    {{ mov.type === 'income' ? 'Entrée' : mov.type === 'expense' ? 'Sortie' : 'Ajustement' }}
                  </span>
                </td>
                <td>{{ mov.description }}</td>
                <td>{{ mov.reference || '-' }}</td>
                <td
                  class="text-end fw-bold"
                  :class="mov.type === 'income' ? 'text-success' : mov.type === 'expense' ? 'text-danger' : ''"
                >
                  {{ mov.type === 'expense' ? '-' : '+' }}{{ formatCurrency(mov.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 12px;
}

.summary-tile {
  background: #f8f9fa;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  min-height: 86px;
  padding: 14px;
}

.spin-icon {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
