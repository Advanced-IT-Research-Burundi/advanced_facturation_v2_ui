<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Wallet, DollarSign, ArrowUpCircle, ArrowDownCircle,
  Clock, CheckCircle, XCircle, Plus, RefreshCw, Printer
} from 'lucide-vue-next';
import api from '@/services/api';

// State
const loading = ref(true);
const currentRegister = ref(null);
const registers = ref([]);
const showOpenModal = ref(false);
const showCloseModal = ref(false);
const showMovementModal = ref(false);

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

// Fetch current register
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

// Fetch all registers
const fetchRegisters = async () => {
  try {
    const res = await api.get('/cash-registers');
    if (res.data.success) {
      registers.value = res.data.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching registers:', error);
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
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Erreur lors de l\'ouverture');
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
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Erreur lors de la fermeture');
  }
};

// Add movement
const addMovement = async () => {
  if (!currentRegister.value?.register?.id) return;

  try {
    const res = await api.post(`/cash-registers/${currentRegister.value.register.id}/movements`, movementForm.value);
    if (res.data.success) {
      showMovementModal.value = false;
      movementForm.value = { type: 'income', amount: 0, description: '', reference: '' };
      await fetchCurrentRegister();
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Erreur lors de l\'ajout');
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
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// Init
onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchCurrentRegister(), fetchRegisters()]);
  loading.value = false;
});
</script>

<template>
  <div class="container-fluid p-0">
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

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else>
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
                      <th>Description</th>
                      <th>Référence</th>
                      <th class="text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!currentRegister.register.movements?.length">
                      <td colspan="5" class="text-center text-muted py-4">Aucun mouvement</td>
                    </tr>
                    <tr v-for="mov in currentRegister.register.movements" :key="mov.id">
                      <td>{{ formatDateTime(mov.created_at) }}</td>
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
    </template>

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
  </div>
</template>

<style scoped>
.card {
  border-radius: 12px;
}
</style>
