<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Caisse" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-cash-register me-2 text-success"></i>Caisse Hôtel
        </h5>
        <button class="btn btn-outline-secondary btn-sm" @click="loadAll">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <!-- Section tabs -->
      <ul class="nav nav-pills mb-3 flex-nowrap overflow-auto">
        <li class="nav-item" v-for="s in sections" :key="s.value">
          <button
            class="nav-link d-flex align-items-center gap-1"
            :class="{ active: activeSection === s.value }"
            @click="switchSection(s.value)"
          >
            <i :class="['bi', s.icon]"></i>
            <span class="text-nowrap">{{ s.label }}</span>
          </button>
        </li>
      </ul>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-success"></div>
      </div>

      <div v-else>
        <!-- Caisse FERMÉE -->
        <div v-if="!currentRegister" class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <i class="bi bi-lock fs-1 text-muted mb-3 d-block"></i>
            <h6 class="text-muted">Aucune caisse ouverte pour {{ activeSectionLabel }}</h6>
            <button class="btn btn-success mt-3" @click="showOpenModal = true">
              <i class="bi bi-unlock me-2"></i>Ouvrir la caisse
            </button>
          </div>
        </div>

        <!-- Caisse OUVERTE -->
        <div v-else>
          <!-- Summary cards -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-md-2">
              <div class="card border-0 bg-light h-100">
                <div class="card-body text-center">
                  <div class="small text-muted">Solde d'ouverture</div>
                  <div class="fw-bold text-primary">{{ formatCurrency(currentRegister.register.opening_balance) }}</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card border-0 h-100" style="background:#d1fae5">
                <div class="card-body text-center">
                  <div class="small text-muted">Recettes</div>
                  <div class="fw-bold text-success">+ {{ formatCurrency(currentRegister.summary.total_income) }}</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card border-0 h-100" style="background:#fee2e2">
                <div class="card-body text-center">
                  <div class="small text-muted">Dépenses</div>
                  <div class="fw-bold text-danger">- {{ formatCurrency(currentRegister.summary.total_expense) }}</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div
                class="card border-0 h-100 text-white"
                :style="currentBenefice >= 0 ? 'background:#16a34a' : 'background:#dc2626'"
              >
                <div class="card-body text-center">
                  <div class="small opacity-90">Bénéfice net</div>
                  <div class="fw-bold fs-6">
                    {{ currentBenefice >= 0 ? '+' : '' }}{{ formatCurrency(currentBenefice) }}
                  </div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card border-0 bg-primary text-white h-100">
                <div class="card-body text-center">
                  <div class="small opacity-90">Solde attendu</div>
                  <div class="fw-bold">{{ formatCurrency(currentRegister.summary.expected_balance) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2 mb-4 flex-wrap">
            <button class="btn btn-outline-success btn-sm" @click="openMovement('income')">
              <i class="bi bi-plus-circle me-1"></i>Entrée
            </button>
            <button class="btn btn-outline-danger btn-sm" @click="openMovement('expense')">
              <i class="bi bi-dash-circle me-1"></i>Sortie
            </button>
            <button class="btn btn-danger btn-sm ms-auto" @click="showCloseModal = true">
              <i class="bi bi-lock me-1"></i>Fermer la caisse
            </button>
          </div>

          <!-- Movements table -->
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-list-ul me-2 text-muted"></i>Mouvements
            </div>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Référence</th>
                    <th class="text-end">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="movements.length === 0">
                    <td colspan="4" class="text-center py-4 text-muted">Aucun mouvement</td>
                  </tr>
                  <tr v-for="m in movements" :key="m.id">
                    <td class="small">{{ formatDateTime(m.created_at) }}</td>
                    <td>{{ m.description }}</td>
                    <td class="small text-muted">{{ m.reference || '—' }}</td>
                    <td class="text-end fw-semibold" :class="m.type === 'income' ? 'text-success' : 'text-danger'">
                      {{ m.type === 'income' ? '+' : '-' }} {{ formatCurrency(m.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Historique -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <span class="fw-semibold"><i class="bi bi-clock-history me-2 text-muted"></i>Historique des caisses</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0 small">
            <thead class="table-light">
              <tr>
                <th>Ouverture</th>
                <th>Fermeture</th>
                <th>Ouvert par</th>
                <th class="text-end">Solde ouv.</th>
                <th class="text-end">Solde attendu</th>
                <th class="text-end">Solde réel</th>
                <th class="text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="registers.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">Aucun historique</td>
              </tr>
              <tr v-for="r in registers" :key="r.id">
                <td>{{ formatDateTime(r.opened_at) }}</td>
                <td>{{ r.closed_at ? formatDateTime(r.closed_at) : '—' }}</td>
                <td>{{ r.opened_by?.name }}</td>
                <td class="text-end">{{ formatCurrency(r.opening_balance) }}</td>
                <td class="text-end">{{ r.expected_balance ? formatCurrency(r.expected_balance) : '—' }}</td>
                <td class="text-end">{{ r.closing_balance ? formatCurrency(r.closing_balance) : '—' }}</td>
                <td class="text-center">
                  <span class="badge" :class="r.status === 'open' ? 'bg-success' : 'bg-secondary'">
                    {{ r.status === 'open' ? 'Ouverte' : 'Fermée' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: Ouvrir caisse -->
    <div v-if="showOpenModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showOpenModal = false">
      <div class="bg-white rounded shadow-lg p-4" style="max-width:420px;width:95%">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h6 class="mb-0"><i class="bi bi-unlock me-2 text-success"></i>Ouvrir la caisse — {{ activeSectionLabel }}</h6>
          <button class="btn-close" @click="showOpenModal = false"></button>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Solde d'ouverture (BIF)</label>
          <input v-model.number="openForm.opening_balance" type="number" class="form-control" min="0" />
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Note</label>
          <input v-model="openForm.opening_note" type="text" class="form-control" placeholder="Optionnel" />
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="showOpenModal = false">Annuler</button>
          <button class="btn btn-success" @click="openRegister" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            Ouvrir
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Fermer caisse -->
    <div v-if="showCloseModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showCloseModal = false">
      <div class="bg-white rounded shadow-lg p-4" style="max-width:420px;width:95%">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h6 class="mb-0"><i class="bi bi-lock me-2 text-danger"></i>Fermer la caisse</h6>
          <button class="btn-close" @click="showCloseModal = false"></button>
        </div>
        <p class="text-muted small mb-3">Solde attendu : <strong>{{ formatCurrency(currentRegister?.summary?.expected_balance) }}</strong></p>
        <div class="mb-3">
          <label class="form-label fw-semibold">Solde réel compté (BIF)</label>
          <input v-model.number="closeForm.closing_balance" type="number" class="form-control" min="0" />
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Note de fermeture</label>
          <input v-model="closeForm.closing_note" type="text" class="form-control" placeholder="Optionnel" />
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="showCloseModal = false">Annuler</button>
          <button class="btn btn-danger" @click="closeRegister" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            Fermer la caisse
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Mouvement -->
    <div v-if="showMovementModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showMovementModal = false">
      <div class="bg-white rounded shadow-lg p-4" style="max-width:420px;width:95%">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h6 class="mb-0">
            <i :class="['bi me-2', movementForm.type === 'income' ? 'bi-plus-circle text-success' : 'bi-dash-circle text-danger']"></i>
            {{ movementForm.type === 'income' ? 'Entrée de caisse' : 'Sortie de caisse' }}
          </h6>
          <button class="btn-close" @click="showMovementModal = false"></button>
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Montant (BIF) <span class="text-danger">*</span></label>
          <input v-model.number="movementForm.amount" type="number" class="form-control" min="0.01" step="0.01" />
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Description <span class="text-danger">*</span></label>
          <input v-model="movementForm.description" type="text" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Référence</label>
          <input v-model="movementForm.reference" type="text" class="form-control" placeholder="Optionnel" />
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="showMovementModal = false">Annuler</button>
          <button class="btn" :class="movementForm.type === 'income' ? 'btn-success' : 'btn-danger'" @click="saveMovement" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import HotelHeader from '@/views/hotel/HotelHeader.vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const toast = useToast();

const sections = [
  { value: 'restaurant', label: 'Restaurant', icon: 'bi-egg-fried' },
  { value: 'bar', label: 'Bar', icon: 'bi-cup-straw' },
  { value: 'rooms', label: 'Chambres', icon: 'bi-door-closed' },
  { value: 'conference', label: 'Salles Conf.', icon: 'bi-camera-video' },
  { value: 'reception', label: 'Salle Réception', icon: 'bi-balloon-heart' },
];

const activeSection = ref('restaurant');
const activeSectionLabel = computed(() => sections.find((s) => s.value === activeSection.value)?.label ?? '');

const loading = ref(false);
const saving = ref(false);
const currentRegister = ref(null);
const registers = ref([]);
const movements = ref([]);

const currentBenefice = computed(() => {
  if (!currentRegister.value) return 0;
  return (currentRegister.value.summary.total_income || 0) - (currentRegister.value.summary.total_expense || 0);
});


const showOpenModal = ref(false);
const showCloseModal = ref(false);
const showMovementModal = ref(false);

const openForm = ref({ opening_balance: 0, opening_note: '' });
const closeForm = ref({ closing_balance: 0, closing_note: '' });
const movementForm = ref({ type: 'income', amount: 0, description: '', reference: '' });

const formatCurrency = (v) => new Intl.NumberFormat('fr-FR').format(v || 0) + ' BIF';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

const loadCurrent = async () => {
  const res = await api.get('/hotel/caisse/current', { params: { hotel_section: activeSection.value } });
  const data = res.data.data;
  currentRegister.value = data?.register ? data : null;
  if (currentRegister.value?.register?.id) {
    const mRes = await api.get(`/hotel/caisse/${currentRegister.value.register.id}/movements`);
    movements.value = mRes.data.data ?? [];
  } else {
    movements.value = [];
  }
};

const loadHistory = async () => {
  const res = await api.get('/hotel/caisse', { params: { hotel_section: activeSection.value } });
  registers.value = res.data.data?.data ?? res.data.data ?? [];
};

const loadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([loadCurrent(), loadHistory()]);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const switchSection = (section) => {
  activeSection.value = section;
  loadAll();
};

const openRegister = async () => {
  if (openForm.value.opening_balance < 0) return;
  saving.value = true;
  try {
    await api.post('/hotel/caisse/open', { ...openForm.value, hotel_section: activeSection.value });
    showOpenModal.value = false;
    openForm.value = { opening_balance: 0, opening_note: '' };
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur ouverture caisse');
  } finally {
    saving.value = false;
  }
};

const closeRegister = async () => {
  saving.value = true;
  try {
    await api.post(`/hotel/caisse/${currentRegister.value.register.id}/close`, closeForm.value);
    showCloseModal.value = false;
    closeForm.value = { closing_balance: 0, closing_note: '' };
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur fermeture caisse');
  } finally {
    saving.value = false;
  }
};

const openMovement = (type) => {
  movementForm.value = { type, amount: 0, description: '', reference: '' };
  showMovementModal.value = true;
};

const saveMovement = async () => {
  if (!movementForm.value.amount || !movementForm.value.description) {
    toast.warning('Veuillez remplir le montant et la description.');
    return;
  }
  saving.value = true;
  try {
    await api.post(`/hotel/caisse/${currentRegister.value.register.id}/movements`, movementForm.value);
    showMovementModal.value = false;
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur mouvement');
  } finally {
    saving.value = false;
  }
};

onMounted(loadAll);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}
</style>
