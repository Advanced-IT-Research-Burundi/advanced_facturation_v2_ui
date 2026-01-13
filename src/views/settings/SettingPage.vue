<template>
  <div class="container-fluid p-0">
    <settings-header></settings-header>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Configurations</h1>
      <div>
        <button class="btn btn-outline-primary me-2" @click="fetchData">
          <i class="bi bi-arrow-clockwise"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Ajouter
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Table -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading && configs.length === 0" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Clé</th>
                <th>Valeur</th>
                <th>Description</th>
                <th class="text-center" style="width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="config in configs" :key="config.id">
                <td class="fw-bold text-primary font-monospace">{{ config.config_key }}</td>
                <td>
                  <span class="text-break">{{ formatValue(config.value) }}</span>
                </td>
                <td class="text-muted small">{{ config.description || '-' }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(config)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button v-if="canDelete(config)" class="btn btn-sm btn-outline-danger" @click="confirmDelete(config)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="configs.length === 0">
                <td colspan="4" class="text-center py-5 text-muted">
                  <i class="bi bi-sliders fs-1 d-block mb-2"></i>
                  Aucune configuration trouvée.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="pagination.last_page > 1" class="d-flex justify-content-center mt-3">
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <button class="page-link" @click="changePage(pagination.current_page - 1)">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            <li class="page-item" :class="{ active: pagination.current_page === page }" v-for="page in getPageRange()" :key="page">
              <button class="page-link" @click="changePage(page)">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
              <button class="page-link" @click="changePage(pagination.current_page + 1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditing ? 'Modifier la configuration' : 'Nouvelle configuration' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="configForm">
              <div class="mb-3">
                <label class="form-label">Clé de configuration</label>
                <input type="text" class="form-control" 
                       v-model="form.config_key" 
                       :readonly="isEditing"
                       :class="{'bg-light': isEditing}"
                       required 
                       placeholder="Ex: OBR_NEW_PARAM">
                <div v-if="isEditing" class="form-text">La clé ne peut pas être modifiée une fois créée.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Valeur</label>
                <textarea v-if="isLongText(form.value) || !isEditing" class="form-control" v-model="form.value" rows="3" required></textarea>
                <input v-else type="text" class="form-control" v-model="form.value" required>
              </div>

              <div class="mb-3">
                <label class="form-label">Description (Optionnel)</label>
                <textarea class="form-control" v-model="form.description" rows="2"></textarea>
              </div>

              <div class="mb-3" v-if="isEditing && !currentConfig?.modifiable">
                 <div class="alert alert-info py-2 small">
                    <i class="bi bi-info-circle me-1"></i> Certaines propriétés sont verrouillées par le système.
                 </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="configForm" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue';
import { useStore } from 'vuex';
import SettingsHeader from './SettingsHeader.vue';

const store = useStore();

// State
const showModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const currentConfig = ref(null);

const form = reactive({
  id: null,
  config_key: '',
  value: '',
  description: ''
});

// Setup Store Wrappers
const configs = computed(() => store.state.configs);
const pagination = computed(() => store.state.pagination);
const loading = computed(() => store.state.loading);
const error = computed(() => store.state.error);

onMounted(() => {
  fetchData();
});

const fetchData = (page = 1) => {
  store.dispatch('fetchConfigs', page);
};

const changePage = (page) => {
  fetchData(page);
};

const getPageRange = () => {
   const range = [];
   const last = pagination.value.last_page || 1;
   for (let i = 1; i <= last; i++) {
     range.push(i);
   }
   return range;
};

// Helpers
const formatValue = (val) => {
  if (val === null || val === undefined) return '-';
  if (val.length > 50) return val.substring(0, 50) + '...';
  return val;
};

const isLongText = (val) => {
  return val && val.length > 50;
};

const canDelete = (config) => {
    // If modifiable is false, assume we cannot delete (system config)
    // If modifiable is true, allow delete
    // Default to strict (false) if undefined, or based on sample data where all are false.
    // However, user might want to delete things they added.
    return config.modifiable === true || config.modifiable === 1;
};

// Modal Actions
const openCreateModal = () => {
  isEditing.value = false;
  currentConfig.value = null;
  form.id = null;
  form.config_key = '';
  form.value = '';
  form.description = '';
  showModal.value = true;
};

const openEditModal = (config) => {
  isEditing.value = true;
  currentConfig.value = config;
  form.id = config.id;
  form.config_key = config.config_key;
  form.value = config.value;
  form.description = config.description || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  currentConfig.value = null;
  form.id = null;
  form.config_key = '';
  form.value = '';
  form.description = '';
};

const submitForm = async () => {
  submitting.value = true;
  
  let result;
  if (isEditing.value) {
      // Update
      result = await store.dispatch('updateConfig', { 
        id: form.id, 
        value: form.value,
        description: form.description // Optionally send description if API allows
      });
  } else {
      // Create
      result = await store.dispatch('createConfig', { ...form });
  }
  
  submitting.value = false;
  if (result.success) {
    closeModal();
    // Refresh list if create (to see new item sorted/paginated) or just rely on store update
    if (!isEditing.value) fetchData(); 
  } else {
    alert(result.message || "Une erreur est survenue");
  }
};

const confirmDelete = async (config) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la configuration "${config.config_key}" ?`)) {
        await store.dispatch('deleteConfig', config.id);
    }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}
.font-monospace {
    font-family: monospace;
}
</style>
