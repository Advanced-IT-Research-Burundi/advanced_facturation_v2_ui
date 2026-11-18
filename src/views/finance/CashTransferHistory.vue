<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowLeftRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useCachedApi } from '@/composables/useCachedApi';
import FinanceHeader from './FinanceHeader.vue';

const { cachedGet, refresh } = useCachedApi();

const router = useRouter();

const loading = ref(false);
const transfers = ref([]);
const pagination = ref({ current_page: 1, last_page: 1, total: 0 });
const summary = ref({});
const canFilterUsers = ref(false);
const today = ref(null);
const users = ref([]);

const filters = ref({
  start_date: '',
  end_date: '',
  status: '',
  user_id: '',
});

const transferStatusLabels = { pending: 'En attente', accepted: 'Validé', rejected: 'Refusé', cancelled: 'Annulé' };
const transferStatusClasses = { pending: 'bg-warning text-dark', accepted: 'bg-success', rejected: 'bg-danger', cancelled: 'bg-secondary' };

const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('fr-FR') : '-');
const formatTime = (date) => (date ? new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-');

const isExpired = (transfer) => transfer.status === 'pending' && today.value && transfer.transfer_date < today.value;

const summaryTiles = computed(() =>
  ['accepted', 'pending', 'rejected', 'cancelled'].map((status) => ({
    status,
    label: transferStatusLabels[status],
    count: summary.value?.[status]?.count || 0,
    total: summary.value?.[status]?.total || 0,
  }))
);

const fetchHistory = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page, per_page: 25 };
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    const res = await cachedGet('/cash-transfers/history', { params });
    if (res.data.success) {
      const data = res.data.data;
      transfers.value = data.transfers.data || [];
      pagination.value = {
        current_page: data.transfers.current_page,
        last_page: data.transfers.last_page,
        total: data.transfers.total,
      };
      summary.value = data.summary || {};
      canFilterUsers.value = data.can_filter_users;
      today.value = data.today;
    }
  } catch (error) {
    console.error('Error fetching transfer history:', error);
  } finally {
    loading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const res = await cachedGet('/cash-transfers/recipients');
    if (res.data.success) {
      users.value = res.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const applyFilters = () => fetchHistory(1);

const resetFilters = () => {
  filters.value = { start_date: '', end_date: '', status: '', user_id: '' };
  fetchHistory(1);
};

const goBack = () => {
  router.push({ name: 'cash-register' });
};

onMounted(async () => {
  await fetchHistory();
  if (canFilterUsers.value) {
    await fetchUsers();
  }
});
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader v-if="canFilterUsers" />

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <button type="button" class="btn btn-link text-decoration-none ps-0 mb-2" @click="goBack">
          <ArrowLeft :size="16" class="me-1" /> Retour à la caisse
        </button>
        <div class="d-flex align-items-center gap-2">
          <ArrowLeftRight :size="22" class="text-warning" />
          <div>
            <h1 class="h3 mb-0">Historique des transferts</h1>
            <p class="text-muted mb-0">Tous les transferts entre caisses, du premier au dernier</p>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div v-for="tile in summaryTiles" :key="tile.status" class="col-6 col-lg-3">
        <div class="summary-tile">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span :class="['badge', transferStatusClasses[tile.status]]">{{ tile.label }}</span>
            <small class="text-muted">{{ tile.count }} transfert(s)</small>
          </div>
          <h5 class="mb-0">{{ formatCurrency(tile.total) }}</h5>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-6 col-md-2">
            <label class="form-label small text-muted mb-1">Du</label>
            <input v-model="filters.start_date" type="date" class="form-control form-control-sm">
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label small text-muted mb-1">Au</label>
            <input v-model="filters.end_date" type="date" class="form-control form-control-sm">
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label small text-muted mb-1">Statut</label>
            <select v-model="filters.status" class="form-select form-select-sm">
              <option value="">Tous</option>
              <option v-for="(label, key) in transferStatusLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div v-if="canFilterUsers" class="col-6 col-md-3">
            <label class="form-label small text-muted mb-1">Utilisateur</label>
            <select v-model="filters.user_id" class="form-select form-select-sm">
              <option value="">Tous</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="col-12 col-md-3 d-flex gap-2">
            <button class="btn btn-sm btn-primary" @click="applyFilters">Filtrer</button>
            <button class="btn btn-sm btn-outline-secondary" @click="resetFilters">Réinitialiser</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h6 class="mb-0 fw-bold">{{ pagination.total }} transfert(s)</h6>
        <button class="btn btn-sm btn-outline-secondary" title="Actualiser" @click="refresh(() => fetchHistory(pagination.current_page))">
          <RefreshCw :size="14" />
        </button>
      </div>
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5 text-muted">Chargement...</div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>De</th>
                <th>Vers</th>
                <th class="text-end">Montant</th>
                <th>Note</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!transfers.length">
                <td colspan="7" class="text-center text-muted py-4">Aucun transfert</td>
              </tr>
              <tr v-for="transfer in transfers" :key="transfer.id">
                <td>{{ formatDate(transfer.transfer_date) }}</td>
                <td>{{ formatTime(transfer.created_at) }}</td>
                <td>{{ transfer.from_user?.name || '-' }}</td>
                <td>{{ transfer.to_user?.name || '-' }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(transfer.amount) }}</td>
                <td><small class="text-muted">{{ transfer.note || '-' }}</small></td>
                <td>
                  <span :class="['badge', isExpired(transfer) ? 'bg-secondary' : transferStatusClasses[transfer.status]]">
                    {{ isExpired(transfer) ? 'Expiré' : transferStatusLabels[transfer.status] }}
                  </span>
                  <div v-if="transfer.validated_at" class="small text-muted">
                    {{ transfer.status === 'accepted' ? 'Accepté' : 'Refusé' }}
                    par {{ transfer.validated_by?.name || '-' }}
                    le {{ formatDate(transfer.validated_at) }} à {{ formatTime(transfer.validated_at) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="pagination.last_page > 1" class="card-footer bg-white d-flex justify-content-between align-items-center">
        <small class="text-muted">Page {{ pagination.current_page }} / {{ pagination.last_page }}</small>
        <div class="btn-group btn-group-sm">
          <button
            class="btn btn-outline-secondary"
            :disabled="pagination.current_page <= 1 || loading"
            @click="fetchHistory(pagination.current_page - 1)"
          >
            <ChevronLeft :size="14" />
          </button>
          <button
            class="btn btn-outline-secondary"
            :disabled="pagination.current_page >= pagination.last_page || loading"
            @click="fetchHistory(pagination.current_page + 1)"
          >
            <ChevronRight :size="14" />
          </button>
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
</style>
