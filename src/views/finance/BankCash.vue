<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeft, Landmark, Plus, RefreshCw, Check, X, XCircle, ChevronLeft, ChevronRight, Clock
} from 'lucide-vue-next';
import api from '@/services/api';
import { useCachedApi, LIVE_TTL_MS } from '@/composables/useCachedApi';
import FinanceHeader from './FinanceHeader.vue';

const { cachedGet, refresh } = useCachedApi({ ttl: LIVE_TTL_MS });

const router = useRouter();

const loading = ref(false);
const transfers = ref([]);
const pagination = ref({ current_page: 1, last_page: 1, total: 0 });
const summary = ref({});
const available = ref({});
const hasFullAccess = ref(false);
const canValidate = ref(false);
const today = ref(null);

const filters = ref({ start_date: '', end_date: '', status: '', source: '' });

const showTransferModal = ref(false);
const submitting = ref(false);
const actionLoadingId = ref(null);
const transferForm = ref({ source: 'user_cash', amount: '', reference: '', note: '' });

const sourceLabels = {
  user_cash: 'Ma caisse',
  main_register: 'Caisse principale',
  electronic: 'Argent électronique',
};
const statusLabels = { pending: 'En attente', accepted: 'Validé', rejected: 'Refusé', cancelled: 'Annulé' };
const statusClasses = { pending: 'bg-warning text-dark', accepted: 'bg-success', rejected: 'bg-danger', cancelled: 'bg-secondary' };

// Toast notification
const toastMessage = ref('');
const toastType = ref('success');
const showToast = ref(false);

const showNotification = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 4000);
};

const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('fr-FR') : '-');
const formatTime = (date) => (date ? new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-');

// Les transferts depuis une caisse expirent à la fin de leur journée
const isExpired = (transfer) =>
  transfer.status === 'pending' && transfer.source !== 'electronic' && today.value && transfer.transfer_date < today.value;

const sourceOptions = computed(() =>
  Object.keys(sourceLabels).filter((source) => available.value[source] !== null && available.value[source] !== undefined)
);
const selectedAvailable = computed(() => Number(available.value[transferForm.value.source] || 0));
const amountTooHigh = computed(() => Number(transferForm.value.amount) > selectedAvailable.value);

const sourceTiles = computed(() =>
  Object.entries(sourceLabels).map(([source, label]) => ({
    source,
    label: source === 'user_cash' ? 'Caisses utilisateurs' : label,
    total: summary.value?.by_source?.[source] || 0,
  }))
);

const fetchBank = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page, per_page: 25 };
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    const res = await cachedGet('/bank-transfers', { params });
    if (res.data.success) {
      const data = res.data.data;
      transfers.value = data.transfers.data || [];
      pagination.value = {
        current_page: data.transfers.current_page,
        last_page: data.transfers.last_page,
        total: data.transfers.total,
      };
      summary.value = data.summary || {};
      available.value = data.available || {};
      hasFullAccess.value = data.has_full_access;
      canValidate.value = data.can_validate;
      today.value = data.today;
    }
  } catch (error) {
    console.error('Error fetching bank transfers:', error);
    showNotification('Erreur lors du chargement de la caisse Banque', 'error');
  } finally {
    loading.value = false;
  }
};

const reload = () => refresh(() => fetchBank(pagination.value.current_page));

const applyFilters = () => fetchBank(1);

const resetFilters = () => {
  filters.value = { start_date: '', end_date: '', status: '', source: '' };
  fetchBank(1);
};

const openTransferModal = async () => {
  await refresh(() => fetchBank(pagination.value.current_page));
  transferForm.value = { source: sourceOptions.value[0] || 'user_cash', amount: '', reference: '', note: '' };
  showTransferModal.value = true;
};

const submitTransfer = async () => {
  const amount = Number(transferForm.value.amount);
  if (!amount || amount <= 0) {
    showNotification('Le montant doit être supérieur à 0.', 'error');
    return;
  }
  if (amountTooHigh.value) {
    showNotification(`Le montant dépasse le disponible (${formatCurrency(selectedAvailable.value)}).`, 'error');
    return;
  }

  submitting.value = true;
  try {
    const res = await api.post('/bank-transfers', { ...transferForm.value, amount });
    if (res.data.success) {
      showNotification(res.data.message);
      showTransferModal.value = false;
      await reload();
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur lors du transfert', 'error');
  } finally {
    submitting.value = false;
  }
};

const transferAction = async (transfer, action) => {
  actionLoadingId.value = transfer.id;
  try {
    const res = await api.post(`/bank-transfers/${transfer.id}/${action}`);
    if (res.data.success) {
      showNotification(res.data.message);
      window.dispatchEvent(new CustomEvent('cash-transfers-changed'));
      await reload();
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur', 'error');
  } finally {
    actionLoadingId.value = null;
  }
};

const canCancel = (transfer) => transfer.status === 'pending' && !isExpired(transfer);

onMounted(() => fetchBank());
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader v-if="hasFullAccess" />

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <button type="button" class="btn btn-link text-decoration-none ps-0 mb-2" @click="router.push({ name: 'cash-register' })">
          <ArrowLeft :size="16" class="me-1" /> Retour à la caisse
        </button>
        <div class="d-flex align-items-center gap-2">
          <Landmark :size="22" class="text-primary" />
          <div>
            <h1 class="h3 mb-0">Caisse Banque</h1>
            <p class="text-muted mb-0">Transferts des caisses vers la banque, validés par l'administrateur</p>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" @click="openTransferModal">
        <Plus :size="18" class="me-2" /> Transférer vers la Banque
      </button>
    </div>

    <!-- Solde de la Banque (accès complet uniquement) -->
    <div v-if="hasFullAccess" class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center">
            <div class="rounded-3 p-2 bg-primary bg-opacity-10 me-3">
              <Landmark :size="24" class="text-primary" />
            </div>
            <div>
              <p class="text-muted small mb-0">Solde Banque</p>
              <h4 class="mb-0">{{ formatCurrency(summary.balance) }}</h4>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center">
            <div class="rounded-3 p-2 bg-warning bg-opacity-10 me-3">
              <Clock :size="24" class="text-warning" />
            </div>
            <div>
              <p class="text-muted small mb-0">En attente de validation</p>
              <h4 class="mb-0">{{ formatCurrency(summary.pending_total) }}</h4>
              <small class="text-muted">{{ summary.pending_count || 0 }} transfert(s)</small>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="summary-tile h-100">
          <p class="text-muted small mb-2">Reçu par source</p>
          <div v-for="tile in sourceTiles" :key="tile.source" class="d-flex justify-content-between small">
            <span>{{ tile.label }}</span>
            <span class="fw-semibold">{{ formatCurrency(tile.total) }}</span>
          </div>
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
              <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label small text-muted mb-1">Source</label>
            <select v-model="filters.source" class="form-select form-select-sm">
              <option value="">Toutes</option>
              <option v-for="(label, key) in sourceLabels" :key="key" :value="key">{{ label }}</option>
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
        <button class="btn btn-sm btn-outline-secondary" title="Actualiser" @click="reload">
          <RefreshCw :size="14" />
        </button>
      </div>
      <div class="card-body p-0">
        <div v-if="loading && !transfers.length" class="text-center py-5 text-muted">Chargement...</div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Demandé par</th>
                <th class="text-end">Montant</th>
                <th>Référence / Note</th>
                <th>Statut</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!transfers.length">
                <td colspan="7" class="text-center text-muted py-4">Aucun transfert vers la Banque</td>
              </tr>
              <tr v-for="transfer in transfers" :key="transfer.id">
                <td>
                  {{ formatDate(transfer.transfer_date) }}
                  <small class="d-block text-muted">{{ formatTime(transfer.created_at) }}</small>
                </td>
                <td>
                  {{ transfer.source === 'user_cash' ? `Caisse de ${transfer.from_user?.name || '-'}` : sourceLabels[transfer.source] }}
                </td>
                <td>{{ transfer.created_by?.name || '-' }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(transfer.amount) }}</td>
                <td>
                  <div v-if="transfer.reference" class="small fw-semibold">{{ transfer.reference }}</div>
                  <small class="text-muted">{{ transfer.note || (transfer.reference ? '' : '-') }}</small>
                </td>
                <td>
                  <span :class="['badge', isExpired(transfer) ? 'bg-secondary' : statusClasses[transfer.status]]">
                    {{ isExpired(transfer) ? 'Expiré' : statusLabels[transfer.status] }}
                  </span>
                  <div v-if="transfer.validated_at" class="small text-muted">
                    {{ transfer.status === 'accepted' ? 'Validé' : 'Refusé' }}
                    par {{ transfer.validated_by?.name || '-' }}
                    le {{ formatDate(transfer.validated_at) }} à {{ formatTime(transfer.validated_at) }}
                  </div>
                </td>
                <td class="text-center">
                  <div v-if="canCancel(transfer)" class="btn-group btn-group-sm">
                    <template v-if="canValidate">
                      <button
                        class="btn btn-success"
                        title="Valider"
                        :disabled="actionLoadingId === transfer.id"
                        @click="transferAction(transfer, 'accept')"
                      >
                        <Check :size="14" />
                      </button>
                      <button
                        class="btn btn-danger"
                        title="Refuser"
                        :disabled="actionLoadingId === transfer.id"
                        @click="transferAction(transfer, 'reject')"
                      >
                        <X :size="14" />
                      </button>
                    </template>
                    <button
                      v-else
                      class="btn btn-outline-secondary"
                      title="Annuler"
                      :disabled="actionLoadingId === transfer.id"
                      @click="transferAction(transfer, 'cancel')"
                    >
                      <XCircle :size="14" class="me-1" /> Annuler
                    </button>
                  </div>
                  <span v-else class="text-muted">-</span>
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
            @click="fetchBank(pagination.current_page - 1)"
          >
            <ChevronLeft :size="14" />
          </button>
          <button
            class="btn btn-outline-secondary"
            :disabled="pagination.current_page >= pagination.last_page || loading"
            @click="fetchBank(pagination.current_page + 1)"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal : transfert vers la Banque -->
    <div v-if="showTransferModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Landmark :size="20" class="text-primary" /> Transférer vers la Banque
            </h5>
            <button type="button" class="btn-close" @click="showTransferModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Source</label>
              <select v-model="transferForm.source" class="form-select">
                <option v-for="source in sourceOptions" :key="source" :value="source">
                  {{ sourceLabels[source] }} — disponible {{ formatCurrency(available[source]) }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Montant</label>
              <input
                v-model="transferForm.amount"
                type="number"
                min="0"
                step="any"
                class="form-control"
                :class="{ 'is-invalid': amountTooHigh }"
              >
              <div class="form-text">Disponible : {{ formatCurrency(selectedAvailable) }}</div>
              <div v-if="amountTooHigh" class="invalid-feedback">Le montant dépasse le disponible.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Référence (bordereau)</label>
              <input v-model="transferForm.reference" type="text" class="form-control" maxlength="255">
            </div>
            <div class="mb-3">
              <label class="form-label">Note</label>
              <input v-model="transferForm.note" type="text" class="form-control" maxlength="255">
            </div>
            <div class="alert alert-info small mb-0">
              Le montant ne sortira de la source qu'après validation par l'administrateur.
              <template v-if="transferForm.source !== 'electronic'">
                Un transfert de caisse non validé expire à la fin de la journée.
              </template>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showTransferModal = false">Annuler</button>
            <button class="btn btn-primary" :disabled="submitting || amountTooHigh" @click="submitTransfer">
              {{ submitting ? 'Envoi...' : 'Envoyer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
      <div :class="['toast show text-white', toastType === 'success' ? 'bg-success' : 'bg-danger']">
        <div class="toast-body">{{ toastMessage }}</div>
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
  padding: 14px;
}
</style>
