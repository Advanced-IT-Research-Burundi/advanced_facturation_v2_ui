<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Depenses" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-wallet2 me-2 text-danger"></i>Dépenses Hôtel
        </h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" @click="loadAll">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn btn-danger btn-sm" @click="openAddModal">
            <i class="bi bi-plus-lg me-1"></i>Nouvelle dépense
          </button>
        </div>
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

      <!-- Stats card -->
      <div class="card border-0 mb-3" style="background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%); color:white;">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <div class="small fw-semibold opacity-90">Total dépenses — {{ activeSectionLabel }}</div>
            <div class="fs-4 fw-bold">{{ formatCurrency(totalAmount) }}</div>
          </div>
          <i class="bi bi-wallet2 fs-2 opacity-75"></i>
        </div>
      </div>

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-4">
              <input v-model="search" type="text" class="form-control form-control-sm" placeholder="Rechercher..." @input="onSearchChange" />
            </div>
            <div class="col-md-3">
              <select v-model="filterCategory" class="form-select form-select-sm" @change="loadDepenses(1)">
                <option value="">Toutes catégories</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <input v-model="filterStartDate" type="date" class="form-control form-control-sm" @change="loadDepenses(1)" />
            </div>
            <div class="col-md-2">
              <input v-model="filterEndDate" type="date" class="form-control form-control-sm" @change="loadDepenses(1)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Date</th>
                <th class="text-end">Montant</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm text-danger"></div></td>
              </tr>
              <tr v-else-if="depenses.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">Aucune dépense trouvée</td>
              </tr>
              <tr v-for="d in depenses" :key="d.id">
                <td><div class="fw-semibold">{{ d.name }}</div></td>
                <td><span class="badge bg-light text-dark border">{{ d.depense_category?.name }}</span></td>
                <td class="small text-muted">{{ formatDate(d.created_at) }}</td>
                <td class="text-end fw-semibold text-danger">{{ formatCurrency(d.montant) }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-danger" title="Supprimer" @click="deleteDepense(d)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">Page {{ pagination.current_page }} / {{ pagination.last_page }}</small>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary" :disabled="pagination.current_page === 1" @click="loadDepenses(pagination.current_page - 1)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="pagination.current_page === pagination.last_page" @click="loadDepenses(pagination.current_page + 1)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Nouvelle dépense -->
    <div v-if="showAddModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showAddModal = false">
      <div class="bg-white rounded shadow-lg p-4" style="max-width:480px;width:95%">
        <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h6 class="mb-0"><i class="bi bi-plus-circle me-2 text-danger"></i>Nouvelle dépense — {{ activeSectionLabel }}</h6>
          <button class="btn-close" @click="showAddModal = false"></button>
        </div>
        <div v-if="formError" class="alert alert-danger py-2 small">{{ formError }}</div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Désignation <span class="text-danger">*</span></label>
          <input v-model="form.name" type="text" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label fw-semibold">Montant (BIF) <span class="text-danger">*</span></label>
          <input v-model.number="form.montant" type="number" class="form-control" min="0" step="0.01" />
        </div>
        <div class="mb-3" v-if="categories.length > 0">
          <label class="form-label fw-semibold">Catégorie</label>
          <select v-model="form.depense_category_id" class="form-select">
            <option value="">— Aucune catégorie —</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="showAddModal = false">Annuler</button>
          <button class="btn btn-danger" @click="saveDepense" :disabled="saving">
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
import { useConfirm } from '@/composables/useConfirm';

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

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
const depenses = ref([]);
const categories = ref([]);
const pagination = ref({ current_page: 1, last_page: 1, total: 0 });

const search = ref('');
const filterCategory = ref('');
const filterStartDate = ref('');
const filterEndDate = ref('');

const showAddModal = ref(false);
const formError = ref('');
const form = ref({ name: '', montant: 0, depense_category_id: '' });

const totalAmount = computed(() => depenses.value.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0));

const formatCurrency = (v) => new Intl.NumberFormat('fr-FR').format(v || 0) + ' BIF';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

let searchTimer = null;
const onSearchChange = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadDepenses(1), 400);
};

const loadDepenses = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page, hotel_section: activeSection.value };
    if (search.value.trim()) params.search = search.value.trim();
    if (filterCategory.value) params.category_id = filterCategory.value;
    if (filterStartDate.value) params.start_date = filterStartDate.value;
    if (filterEndDate.value) params.end_date = filterEndDate.value;

    const res = await api.get('/hotel/depenses', { params });
    const paged = res.data.data;
    depenses.value = paged.data ?? paged;
    pagination.value = {
      current_page: paged.current_page ?? 1,
      last_page: paged.last_page ?? 1,
      total: paged.total ?? depenses.value.length,
    };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await api.get('/hotel/depense-categories');
    const raw = res.data.data;
    categories.value = Array.isArray(raw) ? raw : (raw?.data ?? []);
  } catch (e) {
    console.error(e);
  }
};

const loadAll = () => Promise.all([loadDepenses(1), loadCategories()]);

const switchSection = (section) => {
  activeSection.value = section;
  loadDepenses(1);
};

const openAddModal = () => {
  form.value = { name: '', montant: 0, depense_category_id: '' };
  formError.value = '';
  showAddModal.value = true;
};

const saveDepense = async () => {
  if (!form.value.name || !form.value.montant) {
    formError.value = 'Veuillez remplir tous les champs obligatoires.';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    await api.post('/hotel/depenses', { ...form.value, hotel_section: activeSection.value });
    showAddModal.value = false;

    await registerDepenseInCaisse(form.value.name, form.value.montant);

    await loadDepenses(1);
  } catch (e) {
    formError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement.';
  } finally {
    saving.value = false;
  }
};

/**
 * If an open cash register exists for the current section,
 * automatically record the depense as an expense movement.
 */
const registerDepenseInCaisse = async (name, montant) => {
  try {
    const res = await api.get('/hotel/caisse/current', {
      params: { hotel_section: activeSection.value },
    });
    const register = res.data?.data?.register;
    if (register?.id) {
      await api.post(`/hotel/caisse/${register.id}/movements`, {
        type: 'expense',
        amount: montant,
        description: name,
        reference: `DEP-${activeSectionLabel.value}`,
      });
    }
  } catch {
    // Aucune caisse ouverte ou erreur silencieuse — on ignore
  }
};

const deleteDepense = async (d) => {
  if (!(await confirmDialog(`Supprimer la dépense "${d.name}" ?`))) return;
  try {
    await api.delete(`/hotel/depenses/${d.id}`);
    await loadDepenses(pagination.value.current_page);
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur suppression');
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
