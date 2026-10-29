<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Wallet, DollarSign, ArrowUpCircle, ArrowDownCircle,
  XCircle, Plus, RefreshCw, Printer, Users, Eye, ArrowLeftRight, Check, X
} from 'lucide-vue-next';
import { useStore } from 'vuex';
import api from '@/services/api';
import FinanceHeader from './FinanceHeader.vue';
import TransferConfirmModal from './TransferConfirmModal.vue';

const store = useStore();
const router = useRouter();

// State
const dailySummaryLoading = ref(false);
const currentRegister = ref(store.state.data.financeCashRegisterCurrent || null);
const registers = ref(store.state.data.financeCashRegisterHistory || []);
const dailySummary = ref(store.state.data.financeCashRegisterDailySummary || null);
const users = ref(store.state.data.financeCashRegisterUsers || []);
const showOpenModal = ref(false);
const showCloseModal = ref(false);
const showMovementModal = ref(false);
const showTransferModal = ref(false);
const transfers = ref([]);
const recipients = ref([]);
const transferSubmitting = ref(false);
const transferSource = ref(null);
const transferAvailable = ref(0);
const transferAvailableLoading = ref(false);
const transferForm = ref({
  to_user_id: '',
  amount: '',
  note: ''
});
const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch (error) {
    return null;
  }
};
const currentUser = computed(() => store.getters['auth/currentUser'] || getStoredUser());
const todayIso = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};
const selectedSummaryDate = ref(todayIso());

// Forms
const openForm = ref({
  opening_balance: 0,
  warehouse_id: null,
  opening_note: ''
});

const closeForm = ref({
  closing_balance: 0,
  closing_note: ''
});

const movementForm = ref({
  type: 'income',
  amount: 0,
  description: '',
  reference: ''
});

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

// Formatters
const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';
const formatDateTime = (date) => new Date(date).toLocaleString('fr-FR');
const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

// Computed
const summary = computed(() => currentRegister.value?.summary || {
  opening_balance: 0,
  total_income: 0,
  total_expense: 0,
  expected_balance: 0
});
const userSummaries = computed(() => dailySummary.value?.user_summaries || []);
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
// Accès complet à la caisse : admin ou permission "finance". Sinon, seulement sa propre caisse.
const hasFullAccess = computed(() =>
  isAdmin.value
  || (currentUser.value?.roles || []).some((role) => Array.isArray(role.permissions) && role.permissions.includes('finance'))
);
const canFilterUsers = computed(() => hasFullAccess.value || dailySummary.value?.can_filter_users === true);
const emptyUserCashRow = (user, fallbackId = null) => ({
  user_id: user?.id ?? fallbackId,
  user_name: user?.name || 'Utilisateur',
  user_email: user?.email || null,
  transaction_count: 0,
  total_income: 0,
  total_expense: 0,
  total_adjustment: 0,
  net_amount: 0,
  latest_transaction_at: null
});
const userCashRows = computed(() => {
  const summariesByUser = new Map(userSummaries.value.map((row) => [Number(row.user_id), row]));

  if (canFilterUsers.value) {
    const rows = users.value.map((user) => ({
      ...emptyUserCashRow(user),
      ...(summariesByUser.get(Number(user.id)) || {})
    }));

    userSummaries.value.forEach((row) => {
      if (!rows.some((user) => Number(user.user_id) === Number(row.user_id))) {
        rows.push(row);
      }
    });

    return rows;
  }

  if (userSummaries.value.length) return userSummaries.value;
  return [emptyUserCashRow(currentUser.value)];
});

const viewUserActivity = (userId) => {
  router.push({ name: 'cash-register-user', params: { userId: String(userId) } });
};

// Transferts entre caisses (journalier)
const isTodaySelected = computed(() => selectedSummaryDate.value === todayIso());
const transferStatusLabels = { pending: 'En attente', accepted: 'Validé', rejected: 'Refusé', cancelled: 'Annulé' };
const transferStatusClasses = { pending: 'bg-warning text-dark', accepted: 'bg-success', rejected: 'bg-danger', cancelled: 'bg-secondary' };
const pendingIncomingCount = computed(() =>
  transfers.value.filter((t) => t.status === 'pending' && Number(t.to_user_id) === Number(currentUser.value?.id)).length
);
const recipientOptions = computed(() =>
  recipients.value.filter((u) => Number(u.id) !== Number(transferSource.value?.user_id))
);
const transferAmountTooHigh = computed(() => Number(transferForm.value.amount) > transferAvailable.value);

const canTransferFrom = (row) =>
  Boolean(currentRegister.value?.register)
  && isTodaySelected.value
  && (hasFullAccess.value || Number(row.user_id) === Number(currentUser.value?.id))
  && Number(row.net_amount) > 0;

const fetchTransfers = async () => {
  try {
    const res = await api.get('/cash-transfers', { params: { date: selectedSummaryDate.value } });
    if (res.data.success) {
      transfers.value = res.data.data.transfers || [];
    }
  } catch (error) {
    console.error('Error fetching transfers:', error);
  }
};

const fetchRecipients = async () => {
  if (recipients.value.length) return;
  try {
    const res = await api.get('/cash-transfers/recipients');
    if (res.data.success) {
      recipients.value = res.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching recipients:', error);
  }
};

const onTransferClick = async (row) => {
  transferSource.value = row;
  transferForm.value = { to_user_id: '', amount: '', note: '' };
  transferAvailable.value = 0;
  showTransferModal.value = true;
  transferAvailableLoading.value = true;
  try {
    const [availableRes] = await Promise.all([
      api.get(`/cash-transfers/available/${row.user_id}`),
      fetchRecipients()
    ]);
    if (availableRes.data.success) {
      transferAvailable.value = Number(availableRes.data.data.available) || 0;
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur lors du chargement du disponible', 'error');
  } finally {
    transferAvailableLoading.value = false;
  }
};

const sourceTransfers = computed(() =>
  transfers.value.filter((t) => Number(t.from_user_id) === Number(transferSource.value?.user_id))
);

// Annuler depuis le modal puis recharger le disponible de l'expéditeur
const cancelFromModal = async (transfer) => {
  await transferAction(transfer, 'cancel');
  try {
    const res = await api.get(`/cash-transfers/available/${transferSource.value.user_id}`);
    if (res.data.success) {
      transferAvailable.value = Number(res.data.data.available) || 0;
    }
  } catch (error) {
    console.error('Error refreshing available amount:', error);
  }
};

const closeTransferModal = () => {
  showTransferModal.value = false;
  transferSource.value = null;
};

const submitTransfer = async () => {
  const amount = Number(transferForm.value.amount);
  if (!transferForm.value.to_user_id) {
    showNotification('Veuillez choisir le destinataire.', 'error');
    return;
  }
  if (!amount || amount <= 0) {
    showNotification('Le montant doit être supérieur à 0.', 'error');
    return;
  }
  if (amount > transferAvailable.value) {
    showNotification(`Le montant dépasse le disponible (${formatCurrency(transferAvailable.value)}).`, 'error');
    return;
  }

  transferSubmitting.value = true;
  try {
    const res = await api.post('/cash-transfers', {
      from_user_id: transferSource.value.user_id,
      to_user_id: transferForm.value.to_user_id,
      amount,
      note: transferForm.value.note
    });
    if (res.data.success) {
      showNotification(res.data.message);
      closeTransferModal();
      await fetchTransfers();
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur lors du transfert', 'error');
  } finally {
    transferSubmitting.value = false;
  }
};

// Confirmation d'un transfert (valider / refuser / annuler)
const confirmTransfer = ref(null);
const confirmAction = ref('accept');
const confirmLoading = ref(false);
let confirmDone = null;

const transferAction = (transfer, action) => {
  confirmTransfer.value = transfer;
  confirmAction.value = action;
  return new Promise((resolve) => { confirmDone = resolve; });
};

const closeTransferConfirm = () => {
  confirmTransfer.value = null;
  confirmDone?.();
  confirmDone = null;
};

const submitTransferConfirm = async () => {
  const transfer = confirmTransfer.value;
  if (!transfer) return;

  confirmLoading.value = true;
  try {
    const res = await api.post(`/cash-transfers/${transfer.id}/${confirmAction.value}`);
    if (res.data.success) {
      showNotification(res.data.message);
      await Promise.all([fetchTransfers(), fetchDailySummary(), fetchCurrentRegister()]);
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur', 'error');
  } finally {
    confirmLoading.value = false;
    closeTransferConfirm();
  }
};

const onSummaryDateChange = async () => {
  await Promise.all([fetchDailySummary(), fetchTransfers()]);
};

// Fetch current register
const fetchCurrentRegister = async () => {
  try {
    const res = await api.get('/cash-registers/current');
    if (res.data.success) {
      currentRegister.value = res.data.data;
      store.state.data.financeCashRegisterCurrent = currentRegister.value;
    }
  } catch (error) {
    console.error('Error fetching current register:', error);
  }
};

// Fetch all registers
const fetchRegisters = async () => {
  if (!hasFullAccess.value) return;

  try {
    const res = await api.get('/cash-registers');
    if (res.data.success) {
      registers.value = res.data.data.data || [];
      store.state.data.financeCashRegisterHistory = registers.value;
    }
  } catch (error) {
    console.error('Error fetching registers:', error);
  }
};

// Fetch users for admin filter
const fetchUsers = async () => {
  if (!canFilterUsers.value) return;

  try {
    const res = await api.get('/users', { params: { per_page: 100 } });
    if (res.data.success) {
      users.value = res.data.data.data || res.data.data || [];
      store.state.data.financeCashRegisterUsers = users.value;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    showNotification('Erreur lors du chargement des utilisateurs', 'error');
  }
};

// Fetch daily summary by user
const fetchDailySummary = async () => {
  dailySummaryLoading.value = true;
  try {
    const params = {
      date: selectedSummaryDate.value,
      hotel_section: 'null'
    };

    if (canFilterUsers.value) {
      params.user_id = 'all';
    }

    const res = await api.get('/cash-registers/daily-summary', {
      params
    });
    if (res.data.success) {
      dailySummary.value = res.data.data;
      store.state.data.financeCashRegisterDailySummary = dailySummary.value;
      if (dailySummary.value?.can_filter_users && users.value.length === 0) {
        await fetchUsers();
      }
    }
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    showNotification('Erreur lors du chargement du résumé journalier', 'error');
  } finally {
    dailySummaryLoading.value = false;
  }
};

// Open register
const openRegister = async () => {
  try {
    const res = await api.post('/cash-registers/open', openForm.value);
    if (res.data.success) {
      showOpenModal.value = false;
      openForm.value = { opening_balance: 0, warehouse_id: null, opening_note: '' };
      await fetchCurrentRegister();
      await fetchRegisters();
      await fetchDailySummary();
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur lors de l\'ouverture', 'error');
  }
};

// Close register
const closeRegister = async () => {
  if (!currentRegister.value?.register?.id) return;

  try {
    const res = await api.post(`/cash-registers/${currentRegister.value.register.id}/close`, closeForm.value);
    if (res.data.success) {
      showCloseModal.value = false;
      closeForm.value = { closing_balance: 0, closing_note: '' };
      currentRegister.value = null;
      await fetchRegisters();
      await fetchDailySummary();
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur lors de la fermeture', 'error');
  }
};

// Add movement
const addMovement = async () => {
  if (!currentRegister.value?.register?.id) return;

  if (!movementForm.value.amount || movementForm.value.amount <= 0) {
    showNotification('Le montant doit être supérieur à 0.', 'error');
    return;
  }
  if (!movementForm.value.description || !movementForm.value.description.trim()) {
    showNotification('La description est obligatoire.', 'error');
    return;
  }

  try {
    const res = await api.post(`/cash-registers/${currentRegister.value.register.id}/movements`, movementForm.value);
    if (res.data.success) {
      showMovementModal.value = false;
      movementForm.value = { type: 'income', amount: 0, description: '', reference: '' };
      await fetchCurrentRegister();
      await fetchDailySummary();
    }
  } catch (error) {
    showNotification(error.response?.data?.message || 'Erreur lors de l\'ajout', 'error');
  }
};

// Print receipt
const printReceipt = () => {
  if (!currentRegister.value) return;

  const reg = currentRegister.value.register;
  const sum = currentRegister.value.summary;

  const html = `
    <html>
    <head>
      <title>Récapitulatif Caisse</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .info { margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
      </style>
    </head>
    <body>
      <h1>Récapitulatif de Caisse</h1>
      <div class="info">
        <div class="row"><span>Ouvert le:</span><span>${formatDateTime(reg.opened_at)}</span></div>
        <div class="row"><span>Ouvert par:</span><span>${reg.opened_by?.name || '-'}</span></div>
      </div>
      <div class="info">
        <div class="row"><span>Solde d'ouverture:</span><span>${formatCurrency(sum.opening_balance)}</span></div>
        <div class="row"><span>Total entrées:</span><span style="color:green">+${formatCurrency(sum.total_income)}</span></div>
        <div class="row"><span>Total sorties:</span><span style="color:red">-${formatCurrency(sum.total_expense)}</span></div>
        <div class="row total"><span>Solde attendu:</span><span>${formatCurrency(sum.expected_balance)}</span></div>
      </div>
      <p style="text-align:center; margin-top:30px; color:#666;">Imprimé le ${formatDateTime(new Date())}</p>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showNotification('Veuillez autoriser les popups pour imprimer.', 'error');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// Init
onMounted(async () => {
  const requests = [fetchCurrentRegister(), fetchRegisters(), fetchDailySummary(), fetchTransfers()];
  if (canFilterUsers.value) {
    requests.push(fetchUsers());
  }

  await Promise.all(requests);
});
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader v-if="hasFullAccess" />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">{{ hasFullAccess ? 'Caisse Journalière' : 'Ma Caisse' }}</h1>
        <p class="text-muted mb-0">
          {{ hasFullAccess ? 'Gestion de la caisse quotidienne' : 'Vos transactions et transferts du jour' }}
        </p>
      </div>
      <div v-if="hasFullAccess" class="d-flex gap-2">
        <button v-if="!currentRegister?.register" class="btn btn-primary" @click="showOpenModal = true">
          <Wallet :size="18" class="me-2" /> Ouvrir la caisse
        </button>
        <button v-else class="btn btn-danger" @click="showCloseModal = true; closeForm.closing_balance = summary.expected_balance">
          <XCircle :size="18" class="me-2" /> Fermer la caisse
        </button>
      </div>
    </div>

    <div class="cash-register-content">
      <!-- Current Register -->
      <div v-if="currentRegister?.register" class="row g-4 mb-4">
        <!-- Summary Cards -->
        <div v-if="hasFullAccess" class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div class="rounded-3 p-2 bg-primary bg-opacity-10 me-3">
                  <Wallet :size="24" class="text-primary" />
                </div>
                <div>
                  <p class="text-muted small mb-0">Solde d'ouverture</p>
                  <h4 class="mb-0">{{ formatCurrency(summary.opening_balance) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div :class="hasFullAccess ? 'col-md-3' : 'col-md-4'">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div class="rounded-3 p-2 bg-success bg-opacity-10 me-3">
                  <ArrowUpCircle :size="24" class="text-success" />
                </div>
                <div>
                  <p class="text-muted small mb-0">Entrées</p>
                  <h4 class="mb-0 text-success">+{{ formatCurrency(summary.total_income) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div :class="hasFullAccess ? 'col-md-3' : 'col-md-4'">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div class="rounded-3 p-2 bg-danger bg-opacity-10 me-3">
                  <ArrowDownCircle :size="24" class="text-danger" />
                </div>
                <div>
                  <p class="text-muted small mb-0">Sorties</p>
                  <h4 class="mb-0 text-danger">-{{ formatCurrency(summary.total_expense) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div :class="hasFullAccess ? 'col-md-3' : 'col-md-4'">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div class="rounded-3 p-2 bg-info bg-opacity-10 me-3">
                  <DollarSign :size="24" class="text-info" />
                </div>
                <div>
                  <p class="text-muted small mb-0">{{ hasFullAccess ? 'Solde actuel' : 'Montant de ma caisse' }}</p>
                  <h4 class="mb-0">{{ formatCurrency(summary.expected_balance) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- No Open Register -->
      <div v-else class="text-center py-5">
        <Wallet :size="64" class="text-muted mb-3" />
        <h4>Aucune caisse ouverte</h4>
        <p v-if="hasFullAccess" class="text-muted">Ouvrez une caisse pour commencer à enregistrer les transactions</p>
        <p v-else class="text-muted">Demandez au responsable de caisse d'ouvrir la caisse du jour</p>
        <button v-if="hasFullAccess" class="btn btn-primary btn-lg" @click="showOpenModal = true">
          <Wallet :size="20" class="me-2" /> Ouvrir la caisse
        </button>
      </div>

      <!-- Users table -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <Users :size="18" class="text-primary" />
            <h6 class="mb-0 fw-bold">{{ hasFullAccess ? 'Utilisateurs' : 'Ma caisse du jour' }}</h6>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <input
              type="date"
              v-model="selectedSummaryDate"
              class="form-control form-control-sm"
              style="width: 150px"
              @change="onSummaryDateChange"
            >
            
            <template v-if="currentRegister?.register">
              <button v-if="hasFullAccess" class="btn btn-sm btn-outline-secondary" @click="printReceipt">
                <Printer :size="16" class="me-1" /> Imprimer
              </button>
              <button class="btn btn-sm btn-primary" @click="showMovementModal = true">
                <Plus :size="16" class="me-1" /> Ajouter mouvement
              </button>
            </template>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Utilisateur</th>
                  <th class="text-center">Transactions</th>
                  <th class="text-end">Entrées</th>
                  <th class="text-end">Sorties</th>
                  <th class="text-end">Ajustements</th>
                  <th class="text-end">Montant caisse</th>
                  <th>Dernière transaction</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!userCashRows.length">
                  <td colspan="8" class="text-center text-muted py-4">Aucun utilisateur</td>
                </tr>
                <tr v-for="user in userCashRows" :key="user.user_id">
                  <td>
                    <div class="fw-semibold">{{ user.user_name }}</div>
                    <small class="text-muted">{{ user.user_email || '-' }}</small>
                  </td>
                  <td class="text-center">{{ user.transaction_count }}</td>
                  <td class="text-end text-success">+{{ formatCurrency(user.total_income) }}</td>
                  <td class="text-end text-danger">-{{ formatCurrency(user.total_expense) }}</td>
                  <td class="text-end">{{ formatCurrency(user.total_adjustment) }}</td>
                  <td class="text-end fw-bold" :class="user.net_amount < 0 ? 'text-danger' : 'text-success'">
                    {{ user.net_amount < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(user.net_amount || 0)) }}
                  </td>
                  <td>{{ user.latest_transaction_at ? formatDateTime(user.latest_transaction_at) : '-' }}</td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button
                        type="button"
                        class="btn btn-outline-primary"
                        title="Voir l'activité"
                        @click="viewUserActivity(user.user_id)"
                      >
                        <Eye :size="14" class="me-1" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-warning text-dark fw-semibold"
                        title="Transférer vers un autre utilisateur"
                        :disabled="!canTransferFrom(user)"
                        @click="onTransferClick(user)"
                      >
                        <ArrowLeftRight :size="16" :stroke-width="2.5" class="me-1" /> Transférer
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Transferts du jour -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <ArrowLeftRight :size="18" class="text-warning" />
            <h6 class="mb-0 fw-bold">Transferts du {{ formatDate(selectedSummaryDate) }}</h6>
            <span v-if="pendingIncomingCount" class="badge bg-danger">{{ pendingIncomingCount }} à valider</span>
          </div>
          <button class="btn btn-sm btn-outline-secondary" @click="fetchTransfers" title="Actualiser">
            <RefreshCw :size="14" />
          </button>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Heure</th>
                  <th>De</th>
                  <th>Vers</th>
                  <th class="text-end">Montant</th>
                  <th>Note</th>
                  <th>Statut</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!transfers.length">
                  <td colspan="7" class="text-center text-muted py-4">Aucun transfert</td>
                </tr>
                <tr v-for="transfer in transfers" :key="transfer.id">
                  <td>{{ new Date(transfer.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</td>
                  <td>{{ transfer.from_user?.name || '-' }}</td>
                  <td>{{ transfer.to_user?.name || '-' }}</td>
                  <td class="text-end fw-bold">{{ formatCurrency(transfer.amount) }}</td>
                  <td><small class="text-muted">{{ transfer.note || '-' }}</small></td>
                  <td>
                    <span :class="['badge', transfer.status === 'pending' && !isTodaySelected ? 'bg-secondary' : transferStatusClasses[transfer.status]]">
                      {{ transfer.status === 'pending' && !isTodaySelected ? 'Expiré' : transferStatusLabels[transfer.status] }}
                    </span>
                    <div v-if="transfer.validated_at" class="small text-muted">
                      {{ transfer.status === 'accepted' ? 'Accepté' : 'Refusé' }}
                      par {{ transfer.validated_by?.name || '-' }}
                      à {{ new Date(transfer.validated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
                    </div>
                  </td>
                  <td class="text-center">
                    <template v-if="transfer.status === 'pending' && isTodaySelected">
                      <div class="btn-group btn-group-sm">
                        <template v-if="Number(transfer.to_user_id) === Number(currentUser?.id)">
                          <button class="btn btn-success" title="Valider l'arrivée" @click="transferAction(transfer, 'accept')">
                            <Check :size="14" class="me-1" /> Valider
                          </button>
                          <button class="btn btn-outline-danger" title="Refuser" @click="transferAction(transfer, 'reject')">
                            <X :size="14" />
                          </button>
                        </template>
                        <button
                          v-if="Number(transfer.from_user_id) === Number(currentUser?.id) || hasFullAccess"
                          class="btn btn-outline-secondary"
                          title="Annuler"
                          @click="transferAction(transfer, 'cancel')"
                        >
                          Annuler
                        </button>
                      </div>
                    </template>
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="hasFullAccess" class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white">
          <h6 class="mb-0 fw-bold">Historique des caisses</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Ouvert par</th>
                  <th>Fermé par</th>
                  <th class="text-end">Ouverture</th>
                  <th class="text-end">Fermeture</th>
                  <th class="text-end">Différence</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!registers.length">
                  <td colspan="7" class="text-center text-muted py-4">Aucun historique</td>
                </tr>
                <tr v-for="reg in registers" :key="reg.id">
                  <td>{{ formatDate(reg.opened_at) }}</td>
                  <td>{{ reg.opened_by?.name || '-' }}</td>
                  <td>{{ reg.closed_by?.name || '-' }}</td>
                  <td class="text-end">{{ formatCurrency(reg.opening_balance) }}</td>
                  <td class="text-end">{{ reg.closing_balance ? formatCurrency(reg.closing_balance) : '-' }}</td>
                  <td class="text-end" :class="reg.difference > 0 ? 'text-success' : reg.difference < 0 ? 'text-danger' : ''">
                    {{ reg.difference !== null ? formatCurrency(reg.difference) : '-' }}
                  </td>
                  <td>
                    <span :class="['badge', reg.status === 'open' ? 'bg-success' : 'bg-secondary']">
                      {{ reg.status === 'open' ? 'Ouverte' : 'Fermée' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Open Modal -->
    <div v-if="showOpenModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ouvrir la caisse</h5>
            <button type="button" class="btn-close" @click="showOpenModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Solde d'ouverture *</label>
              <input type="number" v-model="openForm.opening_balance" class="form-control" min="0">
            </div>
            <div class="mb-3">
              <label class="form-label">Note (optionnel)</label>
              <textarea v-model="openForm.opening_note" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showOpenModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="openRegister">Ouvrir</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Close Modal -->
    <div v-if="showCloseModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Fermer la caisse</h5>
            <button type="button" class="btn-close" @click="showCloseModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>Solde attendu:</strong> {{ formatCurrency(summary.expected_balance) }}
            </div>
            <div class="mb-3">
              <label class="form-label">Solde réel de fermeture *</label>
              <input type="number" v-model="closeForm.closing_balance" class="form-control" min="0">
            </div>
            <div class="mb-3">
              <label class="form-label">Note (optionnel)</label>
              <textarea v-model="closeForm.closing_note" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCloseModal = false">Annuler</button>
            <button type="button" class="btn btn-danger" @click="closeRegister">Fermer la caisse</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Movement Modal -->
    <div v-if="showMovementModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ajouter un mouvement</h5>
            <button type="button" class="btn-close" @click="showMovementModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Type *</label>
              <select v-model="movementForm.type" class="form-select">
                <option value="income">Entrée</option>
                <option value="expense">Sortie</option>
                <option value="adjustment">Ajustement</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Montant *</label>
              <input type="number" v-model="movementForm.amount" class="form-control" min="0">
            </div>
            <div class="mb-3">
              <label class="form-label">Description *</label>
              <input type="text" v-model="movementForm.description" class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Référence (optionnel)</label>
              <input type="text" v-model="movementForm.reference" class="form-control">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showMovementModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="addMovement">Ajouter</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Transfer Modal -->
    <div v-if="showTransferModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <ArrowLeftRight :size="18" class="me-2" />Transfert de caisse
            </h5>
            <button type="button" class="btn-close" @click="closeTransferModal" :disabled="transferSubmitting"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <div><strong>De :</strong> {{ transferSource?.user_name }}</div>
              <div>
                <strong>Disponible :</strong>
                <span v-if="transferAvailableLoading" class="spinner-border spinner-border-sm ms-1"></span>
                <span v-else>{{ formatCurrency(transferAvailable) }}</span>
              </div>
              <small class="text-muted">Montant caisse du jour, moins les transferts déjà en attente.</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Destinataire *</label>
              <select v-model="transferForm.to_user_id" class="form-select">
                <option value="" disabled>Choisir un utilisateur</option>
                <option v-for="recipient in recipientOptions" :key="recipient.id" :value="recipient.id">
                  {{ recipient.name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Montant à transférer *</label>
              <div class="input-group">
                <input
                  type="number"
                  v-model="transferForm.amount"
                  class="form-control"
                  :class="{ 'is-invalid': transferAmountTooHigh }"
                  min="0"
                  :max="transferAvailable"
                >
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="transferForm.amount = transferAvailable"
                  :disabled="transferAvailableLoading || transferAvailable <= 0"
                >
                  Tout
                </button>
                <span class="input-group-text">FBU</span>
              </div>
              <div v-if="transferAmountTooHigh" class="text-danger small mt-1">
                Le montant ne peut pas dépasser {{ formatCurrency(transferAvailable) }}.
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Note (optionnel)</label>
              <input type="text" v-model="transferForm.note" class="form-control" maxlength="255">
            </div>
            <div v-if="sourceTransfers.length" class="border-top pt-3">
              <div class="small fw-semibold mb-2">Transferts du jour de {{ transferSource?.user_name }}</div>
              <div
                v-for="transfer in sourceTransfers"
                :key="transfer.id"
                class="d-flex align-items-center gap-2 py-1 border-bottom small"
              >
                <ArrowLeftRight :size="14" class="text-warning flex-shrink-0" />
                <div class="flex-grow-1">
                  <span class="fw-semibold">{{ formatCurrency(transfer.amount) }}</span>
                  vers {{ transfer.to_user?.name || '-' }}
                  <div v-if="transfer.validated_by" class="text-muted">
                    {{ transfer.status === 'accepted' ? 'Accepté' : 'Refusé' }} par {{ transfer.validated_by.name }}
                    <span v-if="transfer.validated_at"> à {{ new Date(transfer.validated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</span>
                  </div>
                </div>
                <span :class="['badge', transferStatusClasses[transfer.status]]">
                  {{ transferStatusLabels[transfer.status] }}
                </span>
                <button
                  v-if="transfer.status === 'pending'"
                  type="button"
                  class="btn btn-sm btn-outline-danger py-0"
                  @click="cancelFromModal(transfer)"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeTransferModal" :disabled="transferSubmitting">Annuler</button>
            <button
              type="button"
              class="btn btn-warning"
              @click="submitTransfer"
              :disabled="transferSubmitting || transferAvailableLoading || transferAmountTooHigh || transferAvailable <= 0"
            >
              <span v-if="transferSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              Envoyer le transfert
            </button>
          </div>
        </div>
      </div>
    </div>

    <TransferConfirmModal
      :transfer="confirmTransfer"
      :action="confirmAction"
      :loading="confirmLoading"
      @confirm="submitTransferConfirm"
      @close="closeTransferConfirm"
    />

    <!-- Toast Notification -->
    <div v-if="showToast" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080;">
      <div class="toast show" :class="toastType === 'success' ? 'border-success' : 'border-danger'">
        <div class="toast-body d-flex align-items-center gap-2">
          <span :class="toastType === 'success' ? 'text-success' : 'text-danger'">
            {{ toastType === 'success' ? '✓' : '✗' }}
          </span>
          {{ toastMessage }}
          <button type="button" class="btn-close ms-auto" @click="showToast = false"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 12px;
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
