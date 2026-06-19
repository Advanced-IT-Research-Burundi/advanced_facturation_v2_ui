<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  ArrowDownCircle,
  Calendar,
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
} from 'lucide-vue-next';
import api from '@/services/api';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import FinanceHeader from './FinanceHeader.vue';

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

const loading = ref(true);
const saving = ref(false);
const deposits = ref([]);
const summary = ref(null);
const currentRegister = ref(null);
const showCreateModal = ref(false);

const today = new Date().toISOString().split('T')[0];

const filters = ref({
  start_date: '',
  end_date: '',
  bank_name: '',
});

const form = ref({
  cash_register_id: null,
  amount: 0,
  deposit_date: today,
  bank_name: '',
  account_name: '',
  account_number: '',
  reference: '',
  note: '',
});

const currentBalance = computed(() => currentRegister.value?.summary?.expected_balance || 0);

const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-';
const formatDateTime = (date) => date ? new Date(date).toLocaleString('fr-FR') : '-';

const fetchCurrentRegister = async () => {
  const res = await api.get('/cash-registers/current');
  if (res.data.success) {
    currentRegister.value = res.data.data;
    form.value.cash_register_id = res.data.data?.register?.id || null;
  }
};

const fetchDeposits = async () => {
  const params = Object.fromEntries(
    Object.entries(filters.value).filter(([, value]) => value !== ''),
  );
  const res = await api.get('/bank-deposits', { params });
  if (res.data.success) {
    deposits.value = res.data.data.data || [];
  }
};

const fetchSummary = async () => {
  const params = Object.fromEntries(
    Object.entries(filters.value).filter(([, value]) => value !== ''),
  );
  const res = await api.get('/bank-deposits/summary', { params });
  if (res.data.success) {
    summary.value = res.data.data;
  }
};

const refreshAll = async () => {
  loading.value = true;
  try {
    await Promise.all([fetchCurrentRegister(), fetchDeposits(), fetchSummary()]);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors du chargement des versements');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    cash_register_id: currentRegister.value?.register?.id || null,
    amount: 0,
    deposit_date: today,
    bank_name: '',
    account_name: '',
    account_number: '',
    reference: '',
    note: '',
  };
};

const openCreateModal = () => {
  if (!currentRegister.value?.register) {
    toast.error('Ouvrez une caisse avant de faire un versement bancaire.');
    return;
  }
  resetForm();
  showCreateModal.value = true;
};

const createDeposit = async () => {
  if (!form.value.cash_register_id) {
    toast.error('Aucune caisse ouverte sélectionnée.');
    return;
  }
  if (!form.value.amount || form.value.amount <= 0) {
    toast.error('Le montant doit être supérieur à 0.');
    return;
  }
  if (Number(form.value.amount) > Number(currentBalance.value)) {
    toast.error('Le montant dépasse le solde actuel de la caisse.');
    return;
  }
  if (!form.value.bank_name.trim()) {
    toast.error('Le nom de la banque est obligatoire.');
    return;
  }

  saving.value = true;
  try {
    const res = await api.post('/bank-deposits', form.value);
    if (res.data.success) {
      toast.success('Versement bancaire enregistré.');
      showCreateModal.value = false;
      await refreshAll();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de l’enregistrement du versement');
  } finally {
    saving.value = false;
  }
};

const deleteDeposit = async (deposit) => {
  if (!(await confirmDialog('Supprimer ce versement bancaire ?'))) return;

  try {
    const res = await api.delete(`/bank-deposits/${deposit.id}`);
    if (res.data.success) {
      toast.success('Versement supprimé.');
      await refreshAll();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
  }
};

onMounted(refreshAll);
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader />

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1 class="h3 mb-1">Versements sur banque</h1>
        <p class="text-muted mb-0">Transférer l’argent des ventes de la caisse vers un compte bancaire</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="refreshAll">
          <RefreshCw :size="18" class="me-2" /> Actualiser
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="18" class="me-2" /> Nouveau versement
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else>
      <div class="row g-4 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 p-2 bg-primary bg-opacity-10">
                <Wallet :size="24" class="text-primary" />
              </div>
              <div>
                <p class="text-muted small mb-1">Solde caisse actuel</p>
                <h4 class="mb-0">{{ formatCurrency(currentBalance) }}</h4>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 p-2 bg-success bg-opacity-10">
                <Landmark :size="24" class="text-success" />
              </div>
              <div>
                <p class="text-muted small mb-1">Total versé</p>
                <h4 class="mb-0 text-success">{{ formatCurrency(summary?.total_amount) }}</h4>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 p-2 bg-info bg-opacity-10">
                <Calendar :size="24" class="text-info" />
              </div>
              <div>
                <p class="text-muted small mb-1">Versé aujourd’hui</p>
                <h4 class="mb-0">{{ formatCurrency(summary?.today_amount) }}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!currentRegister?.register" class="alert alert-warning d-flex align-items-center gap-2">
        <ArrowDownCircle :size="20" />
        <span>Aucune caisse ouverte. Ouvrez une caisse avant d’enregistrer un versement bancaire.</span>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label">Date début</label>
              <input v-model="filters.start_date" type="date" class="form-control">
            </div>
            <div class="col-md-3">
              <label class="form-label">Date fin</label>
              <input v-model="filters.end_date" type="date" class="form-control">
            </div>
            <div class="col-md-4">
              <label class="form-label">Banque</label>
              <input v-model="filters.bank_name" type="text" class="form-control" placeholder="Nom de la banque">
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-primary w-100" @click="refreshAll">
                <RefreshCw :size="16" class="me-1" /> Filtrer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 class="mb-0 fw-bold">Historique des versements</h6>
          <span class="badge bg-primary">{{ summary?.deposits_count || 0 }}</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Banque</th>
                  <th>Compte</th>
                  <th>Référence</th>
                  <th>Créé par</th>
                  <th class="text-end">Montant</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!deposits.length">
                  <td colspan="7" class="text-center text-muted py-4">Aucun versement enregistré</td>
                </tr>
                <tr v-for="deposit in deposits" :key="deposit.id">
                  <td>
                    <div class="fw-medium">{{ formatDate(deposit.deposit_date) }}</div>
                    <small class="text-muted">{{ formatDateTime(deposit.created_at) }}</small>
                  </td>
                  <td>{{ deposit.bank_name }}</td>
                  <td>
                    <div>{{ deposit.account_name || '-' }}</div>
                    <small class="text-muted">{{ deposit.account_number || '' }}</small>
                  </td>
                  <td>{{ deposit.reference || '-' }}</td>
                  <td>{{ deposit.created_by?.name || '-' }}</td>
                  <td class="text-end fw-bold text-success">{{ formatCurrency(deposit.amount) }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" title="Supprimer" @click="deleteDeposit(deposit)">
                      <Trash2 :size="15" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showCreateModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nouveau versement bancaire</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              Solde disponible en caisse: <strong>{{ formatCurrency(currentBalance) }}</strong>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Montant *</label>
                <input v-model.number="form.amount" type="number" min="0" step="0.01" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Date du versement *</label>
                <input v-model="form.deposit_date" type="date" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Banque *</label>
                <input v-model="form.bank_name" type="text" class="form-control" placeholder="Ex: BANCOBU">
              </div>
              <div class="col-md-6">
                <label class="form-label">Référence</label>
                <input v-model="form.reference" type="text" class="form-control" placeholder="Bordereau, reçu...">
              </div>
              <div class="col-md-6">
                <label class="form-label">Nom du compte</label>
                <input v-model="form.account_name" type="text" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Numéro du compte</label>
                <input v-model="form.account_number" type="text" class="form-control">
              </div>
              <div class="col-12">
                <label class="form-label">Note</label>
                <textarea v-model="form.note" class="form-control" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="createDeposit">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 8px;
}
</style>
