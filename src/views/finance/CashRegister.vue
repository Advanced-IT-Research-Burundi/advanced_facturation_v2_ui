<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Wallet, DollarSign, ArrowUpCircle, ArrowDownCircle,
  Clock, XCircle, Plus, RefreshCw, Printer, Users, Calendar
} from 'lucide-vue-next';
import { useStore } from 'vuex';
import api from '@/services/api';
import FinanceHeader from './FinanceHeader.vue';

const store = useStore();

// State
const loading = ref(false);
const dailySummaryLoading = ref(false);
const currentRegister = ref(store.state.data.financeCashRegisterCurrent || null);
const registers = ref(store.state.data.financeCashRegisterHistory || []);
const dailySummary = ref(store.state.data.financeCashRegisterDailySummary || null);
const users = ref(store.state.data.financeCashRegisterUsers || []);
const showOpenModal = ref(false);
const showCloseModal = ref(false);
const showMovementModal = ref(false);
const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch (error) {
    return null;
  }
};
const currentUser = computed(() => store.getters['auth/currentUser'] || getStoredUser());
const selectedUserId = ref('all');
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
const dailyTotals = computed(() => dailySummary.value?.summary || {
  total_opening: 0,
  total_income: 0,
  total_expense: 0,
  total_adjustment: 0,
  net_amount: 0,
  total_transactions: 0
});
const userSummaries = computed(() => dailySummary.value?.user_summaries || []);
const recentDailyMovements = computed(() => dailySummary.value?.recent_movements || []);
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
const canFilterUsers = computed(() => isAdmin.value || dailySummary.value?.can_filter_users === true);
const effectiveUserId = computed(() => (canFilterUsers.value ? selectedUserId.value : currentUser.value?.id));
const displayedCurrentMovements = computed(() => {
  const movements = currentRegister.value?.register?.movements || [];
  const userId = effectiveUserId.value;

  if (canFilterUsers.value && (!userId || userId === 'all')) return movements;
  return movements.filter((mov) => Number(mov.created_by?.id || mov.created_by) === Number(userId));
});
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

  if (canFilterUsers.value && selectedUserId.value === 'all') {
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

  if (canFilterUsers.value && selectedUserId.value !== 'all') {
    const selectedUser = users.value.find((user) => Number(user.id) === Number(selectedUserId.value));
    return [{
      ...emptyUserCashRow(selectedUser, selectedUserId.value),
      ...(summariesByUser.get(Number(selectedUserId.value)) || {})
    }];
  }

  if (userSummaries.value.length) return userSummaries.value;
  return [emptyUserCashRow(currentUser.value)];
});

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
      params.user_id = selectedUserId.value;
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
  const requests = [fetchCurrentRegister(), fetchRegisters(), fetchDailySummary()];
  if (canFilterUsers.value) {
    requests.push(fetchUsers());
  }

  await Promise.all(requests);
});
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Caisse Journalière</h1>
        <p class="text-muted mb-0">Gestion de la caisse quotidienne</p>
      </div>
      <div class="d-flex gap-2">
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
        <div class="col-md-3">
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

        <div class="col-md-3">
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

        <div class="col-md-3">
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

        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div class="rounded-3 p-2 bg-info bg-opacity-10 me-3">
                  <DollarSign :size="24" class="text-info" />
                </div>
                <div>
                  <p class="text-muted small mb-0">Solde actuel</p>
                  <h4 class="mb-0">{{ formatCurrency(summary.expected_balance) }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions & Movements -->
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">Mouvements de caisse</h6>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" @click="printReceipt">
                  <Printer :size="16" class="me-1" /> Imprimer
                </button>
                <button class="btn btn-sm btn-primary" @click="showMovementModal = true">
                  <Plus :size="16" class="me-1" /> Ajouter mouvement
                </button>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Heure</th>
                      <th>Type</th>
                      <th>Utilisateur</th>
                      <th>Description</th>
                      <th>Référence</th>
                      <th class="text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!displayedCurrentMovements.length">
                      <td colspan="6" class="text-center text-muted py-4">Aucun mouvement</td>
                    </tr>
                    <tr v-for="mov in displayedCurrentMovements" :key="mov.id">
                      <td>{{ formatDateTime(mov.created_at) }}</td>
                      <td>
                        <span :class="['badge', mov.type === 'income' ? 'bg-success' : mov.type === 'expense' ? 'bg-danger' : 'bg-warning']">
                          {{ mov.type === 'income' ? 'Entrée' : mov.type === 'expense' ? 'Sortie' : 'Ajustement' }}
                        </span>
                      </td>
                      <td>{{ mov.created_by?.name || '-' }}</td>
                      <td>{{ mov.description }}</td>
                      <td>{{ mov.reference || '-' }}</td>
                      <td class="text-end fw-bold" :class="mov.type === 'income' ? 'text-success' : mov.type === 'expense' ? 'text-danger' : ''">
                        {{ mov.type === 'expense' ? '-' : '+' }}{{ formatCurrency(mov.amount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Open Register -->
      <div v-else class="text-center py-5">
        <Wallet :size="64" class="text-muted mb-3" />
        <h4>Aucune caisse ouverte</h4>
        <p class="text-muted">Ouvrez une caisse pour commencer à enregistrer les transactions</p>
        <button class="btn btn-primary btn-lg" @click="showOpenModal = true">
          <Wallet :size="20" class="me-2" /> Ouvrir la caisse
        </button>
      </div>

      <!-- Daily User Summary -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <Users :size="18" class="text-primary" />
            <h6 class="mb-0 fw-bold">Caisse journalière par utilisateur</h6>
          </div>
          <div class="d-flex align-items-center gap-2">
            <Calendar :size="16" class="text-muted" />
            <input
              type="date"
              v-model="selectedSummaryDate"
              class="form-control form-control-sm"
              style="width: 150px"
              @change="fetchDailySummary"
            >
            <select
              v-if="canFilterUsers"
              v-model="selectedUserId"
              class="form-select form-select-sm user-filter"
              @change="fetchDailySummary"
            >
              <option value="all">Tous les utilisateurs</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
            </select>
            <span v-else class="badge bg-light text-dark border">
              {{ currentUser?.name || 'Mon compte' }}
            </span>
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="dailySummaryLoading"
              @click="fetchDailySummary"
            >
              <RefreshCw :size="16" class="me-1" :class="{ 'spin-icon': dailySummaryLoading }" />
              Actualiser
            </button>
          </div>
        </div>
        <div class="card-body">
          <div>
            <div class="row g-3 mb-4">
              <div class="col-6 col-lg-3">
                <div class="summary-tile">
                  <p class="text-muted small mb-1">Transactions</p>
                  <h5 class="mb-0">{{ dailyTotals.total_transactions || 0 }}</h5>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="summary-tile">
                  <p class="text-muted small mb-1">Entrées du jour</p>
                  <h5 class="mb-0 text-success">+{{ formatCurrency(dailyTotals.total_income) }}</h5>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="summary-tile">
                  <p class="text-muted small mb-1">Sorties du jour</p>
                  <h5 class="mb-0 text-danger">-{{ formatCurrency(dailyTotals.total_expense) }}</h5>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="summary-tile">
                  <p class="text-muted small mb-1">Montant net caisse</p>
                  <h5 class="mb-0" :class="dailyTotals.net_amount < 0 ? 'text-danger' : 'text-success'">
                    {{ dailyTotals.net_amount < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(dailyTotals.net_amount || 0)) }}
                  </h5>
                </div>
              </div>
            </div>

            <div class="table-responsive mb-4">
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!userCashRows.length">
                    <td colspan="7" class="text-center text-muted py-4">Aucune transaction pour cette date</td>
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
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="d-flex align-items-center gap-2 mb-2">
              <Clock :size="16" class="text-muted" />
              <h6 class="mb-0 fw-bold">Historique des transactions du jour</h6>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Heure</th>
                    <th>Utilisateur</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Référence</th>
                    <th class="text-end">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!recentDailyMovements.length">
                    <td colspan="6" class="text-center text-muted py-4">Aucune transaction enregistrée</td>
                  </tr>
                  <tr v-for="mov in recentDailyMovements" :key="mov.id">
                    <td>{{ formatDateTime(mov.created_at) }}</td>
                    <td>{{ mov.created_by?.name || '-' }}</td>
                    <td>
                      <span :class="['badge', mov.type === 'income' ? 'bg-success' : mov.type === 'expense' ? 'bg-danger' : 'bg-warning']">
                        {{ mov.type === 'income' ? 'Entrée' : mov.type === 'expense' ? 'Sortie' : 'Ajustement' }}
                      </span>
                    </td>
                    <td>{{ mov.description }}</td>
                    <td>{{ mov.reference || '-' }}</td>
                    <td class="text-end fw-bold" :class="mov.type === 'income' ? 'text-success' : mov.type === 'expense' ? 'text-danger' : ''">
                      {{ mov.type === 'expense' ? '-' : '+' }}{{ formatCurrency(mov.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="card border-0 shadow-sm mt-4">
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

.summary-tile {
  background: #f8f9fa;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  min-height: 86px;
  padding: 14px;
}

.user-filter {
  min-width: 210px;
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
