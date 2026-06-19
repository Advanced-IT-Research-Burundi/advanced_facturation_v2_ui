<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  DollarSign, TrendingUp, RefreshCw, Plus, Edit2, Trash2, History
} from 'lucide-vue-next';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import FinanceHeader from './FinanceHeader.vue';

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

// State
const loading = ref(true);
const currencies = ref([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showConvertModal = ref(false);
const showHistoryModal = ref(false);
const selectedCurrency = ref(null);
const rateHistory = ref([]);

// Forms
const createForm = ref({
  code: '',
  name: '',
  symbol: '',
  exchange_rate: 1,
  decimal_places: 2
});

const editForm = ref({
  name: '',
  symbol: '',
  exchange_rate: 1,
  is_active: true
});

const convertForm = ref({
  amount: 0,
  from: 'FBU',
  to: 'USD'
});

const convertResult = ref(null);

// Formatters
const formatNumber = (num, decimals = 2) => new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals
}).format(num || 0);

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

// Fetch currencies
const fetchCurrencies = async () => {
  try {
    const res = await api.get('/currencies', { params: { active_only: false } });
    if (res.data.success) {
      currencies.value = res.data.data;
    }
  } catch (error) {
    console.error('Error fetching currencies:', error);
  }
};

// Base currency
const baseCurrency = computed(() => currencies.value.find(c => c.is_base));

// Create currency
const createCurrency = async () => {
  try {
    const res = await api.post('/currencies', createForm.value);
    if (res.data.success) {
      showCreateModal.value = false;
      createForm.value = { code: '', name: '', symbol: '', exchange_rate: 1, decimal_places: 2 };
      await fetchCurrencies();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la création');
  }
};

// Edit currency
const openEditModal = (currency) => {
  selectedCurrency.value = currency;
  editForm.value = {
    name: currency.name,
    symbol: currency.symbol,
    exchange_rate: currency.exchange_rate,
    is_active: currency.is_active
  };
  showEditModal.value = true;
};

const updateCurrency = async () => {
  try {
    const res = await api.put(`/currencies/${selectedCurrency.value.id}`, editForm.value);
    if (res.data.success) {
      showEditModal.value = false;
      await fetchCurrencies();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
  }
};

// Delete currency
const deleteCurrency = async (id) => {
  if (!(await confirmDialog('Supprimer cette devise ?'))) return;
  try {
    await api.delete(`/currencies/${id}`);
    await fetchCurrencies();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
  }
};

// Convert
const convert = async () => {
  try {
    const res = await api.get('/currencies/convert', {
      params: convertForm.value
    });
    if (res.data.success) {
      convertResult.value = res.data.data;
    }
  } catch (error) {
    toast.error('Erreur lors de la conversion');
  }
};

// View history
const viewHistory = async (currency) => {
  selectedCurrency.value = currency;
  try {
    const res = await api.get(`/currencies/${currency.id}/history`);
    if (res.data.success) {
      rateHistory.value = res.data.data.history || [];
      showHistoryModal.value = true;
    }
  } catch (error) {
    toast.error('Erreur lors du chargement de l\'historique');
  }
};

// Update rate
const updateRate = async () => {
  if (!selectedCurrency.value) return;
  try {
    const res = await api.post(`/currencies/${selectedCurrency.value.id}/rate`, {
      exchange_rate: editForm.value.exchange_rate
    });
    if (res.data.success) {
      showEditModal.value = false;
      await fetchCurrencies();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du taux');
  }
};

// Init
onMounted(async () => {
  loading.value = true;
  await fetchCurrencies();
  loading.value = false;
});
</script>

<template>
  <div class="container-fluid p-0">
    <FinanceHeader />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Gestion des Devises</h1>
        <p class="text-muted mb-0">Configuration des taux de change</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" @click="showConvertModal = true">
          <RefreshCw :size="18" class="me-2" /> Convertir
        </button>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <Plus :size="18" class="me-2" /> Ajouter devise
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else>
      <!-- Base Currency Card -->
      <div v-if="baseCurrency" class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-auto">
              <div class="rounded-3 p-3 bg-primary bg-opacity-10">
                <DollarSign :size="32" class="text-primary" />
              </div>
            </div>
            <div class="col">
              <h5 class="mb-1">Devise de base: {{ baseCurrency.code }}</h5>
              <p class="text-muted mb-0">{{ baseCurrency.name }} ({{ baseCurrency.symbol }})</p>
            </div>
            <div class="col-auto">
              <span class="badge bg-primary fs-6">1 {{ baseCurrency.code }} = 1</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Currencies Grid -->
      <div class="row g-4">
        <div v-for="currency in currencies" :key="currency.id" class="col-md-6 col-lg-4">
          <div :class="['card border-0 shadow-sm h-100', !currency.is_active && 'opacity-50']">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4 class="mb-0">{{ currency.code }}</h4>
                  <p class="text-muted small mb-0">{{ currency.name }}</p>
                </div>
                <span class="fs-3 fw-bold text-primary">{{ currency.symbol }}</span>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">Taux de change</span>
                  <span class="fw-bold">
                    1 {{ currency.code }} = {{ formatNumber(currency.exchange_rate, 2) }} {{ baseCurrency?.code }}
                  </span>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span :class="['badge', currency.is_base ? 'bg-primary' : currency.is_active ? 'bg-success' : 'bg-secondary']">
                    {{ currency.is_base ? 'Base' : currency.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="btn-group btn-group-sm" v-if="!currency.is_base">
                  <button class="btn btn-outline-secondary" @click="viewHistory(currency)" title="Historique">
                    <History :size="14" />
                  </button>
                  <button class="btn btn-outline-primary" @click="openEditModal(currency)" title="Modifier">
                    <Edit2 :size="14" />
                  </button>
                  <button class="btn btn-outline-danger" @click="deleteCurrency(currency.id)" title="Supprimer">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Conversion Card -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white">
          <h6 class="mb-0 fw-bold">Conversion rapide</h6>
        </div>
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label">Montant</label>
              <input type="number" v-model="convertForm.amount" class="form-control" min="0">
            </div>
            <div class="col-md-3">
              <label class="form-label">De</label>
              <select v-model="convertForm.from" class="form-select">
                <option v-for="c in currencies" :key="c.id" :value="c.code">{{ c.code }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Vers</label>
              <select v-model="convertForm.to" class="form-select">
                <option v-for="c in currencies" :key="c.id" :value="c.code">{{ c.code }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" @click="convert">
                <RefreshCw :size="16" class="me-2" /> Convertir
              </button>
            </div>
          </div>

          <div v-if="convertResult" class="alert alert-success mt-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>{{ formatNumber(convertResult.original_amount) }} {{ convertResult.from_currency }}</strong>
                <span class="mx-2">=</span>
                <strong class="fs-4">{{ convertResult.formatted }}</strong>
              </div>
              <div class="text-muted small">
                Taux: 1 {{ convertResult.from_currency }} = {{ formatNumber(convertResult.exchange_rate, 4) }} {{ convertResult.to_currency }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ajouter une devise</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Code (3 caractères) *</label>
              <input type="text" v-model="createForm.code" class="form-control" maxlength="3" placeholder="USD">
            </div>
            <div class="mb-3">
              <label class="form-label">Nom *</label>
              <input type="text" v-model="createForm.name" class="form-control" placeholder="Dollar Américain">
            </div>
            <div class="mb-3">
              <label class="form-label">Symbole *</label>
              <input type="text" v-model="createForm.symbol" class="form-control" placeholder="$">
            </div>
            <div class="mb-3">
              <label class="form-label">Taux de change (vers {{ baseCurrency?.code }}) *</label>
              <input type="number" v-model="createForm.exchange_rate" class="form-control" step="0.0001" min="0">
              <small class="text-muted">1 [nouvelle devise] = X {{ baseCurrency?.code }}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Décimales</label>
              <input type="number" v-model="createForm.decimal_places" class="form-control" min="0" max="6">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="createCurrency">Créer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Modifier {{ selectedCurrency?.code }}</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nom</label>
              <input type="text" v-model="editForm.name" class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Symbole</label>
              <input type="text" v-model="editForm.symbol" class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Taux de change (vers {{ baseCurrency?.code }})</label>
              <input type="number" v-model="editForm.exchange_rate" class="form-control" step="0.0001" min="0">
            </div>
            <div class="form-check">
              <input type="checkbox" v-model="editForm.is_active" class="form-check-input" id="isActive">
              <label class="form-check-label" for="isActive">Devise active</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="updateCurrency">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="showHistoryModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Historique {{ selectedCurrency?.code }}</h5>
            <button type="button" class="btn-close" @click="showHistoryModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Taux</th>
                    <th>Modifié par</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!rateHistory.length">
                    <td colspan="3" class="text-center text-muted">Aucun historique</td>
                  </tr>
                  <tr v-for="h in rateHistory" :key="h.id">
                    <td>{{ formatDate(h.effective_date) }}</td>
                    <td class="fw-bold">{{ formatNumber(h.rate, 4) }}</td>
                    <td>{{ h.updated_by?.name || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showHistoryModal = false">Fermer</button>
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
