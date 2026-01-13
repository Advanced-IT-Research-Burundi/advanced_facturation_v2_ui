<template>
  <div class="container-fluid p-0">
    <!-- Header -->
    <settings-header></settings-header>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Entrepôts</h1>
      <div>
        <button class="btn btn-outline-primary me-2" @click="fetchWarehouses(pagination.current_page)">
          <i class="bi bi-arrow-clockwise"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Ajouter
        </button>
      </div>
    </div>

    <!-- Alert Feedback -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Table Card -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading && warehouses.length === 0" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 30%;">Nom</th>
                <th>Emplacement</th>
                <th>ID Entreprise</th>
                <th class="text-center" style="width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in warehouses" :key="item.id">
                <td class="fw-bold text-primary">{{ item.name }}</td>
                <td class="text-muted">{{ item.location || '-' }}</td>
                 <td class="text-muted">{{ item.company_id || '-' }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(item)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(item)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="warehouses.length === 0">
                <td colspan="4" class="text-center py-5 text-muted">
                  <i class="bi bi-building fs-1 d-block mb-2"></i>
                  Aucun entrepôt trouvé.
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
              {{ isEditing ? 'Modifier l\'entrepôt' : 'Nouveau entrepôt' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="warehouseForm">
              <div class="mb-3">
                <label class="form-label">Nom *</label>
                <input type="text" class="form-control" 
                       v-model="form.name" 
                       required 
                       placeholder="Ex: Entrepôt Principal">
              </div>

              <div class="mb-3">
                <label class="form-label">Emplacement</label>
                 <input type="text" class="form-control" 
                       v-model="form.location" 
                       placeholder="Ex: Zone Industrielle">
              </div>

               <div class="mb-3">
                <label class="form-label">Company ID</label>
                 <input type="number" class="form-control" 
                       v-model="form.company_id" 
                       placeholder="Ex: 1">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="warehouseForm" class="btn btn-primary" :disabled="submitting">
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
import api from '@/services/api';
import store from '@/store';
import { onMounted, computed, ref, reactive } from 'vue';
import SettingsHeader from '../settings/SettingsHeader.vue';

// Local State
const showModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const loading = ref(false);
const error = ref(null);
const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
});

const form = reactive({
    id: null,
    name: '',
    location: '',
    company_id: ''
});

// Store Access
const warehouses = computed(() => store.state.data.warehouses || []);

onMounted(() => {
    fetchWarehouses();
});

// Actions
const fetchWarehouses = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
        const resp = await api.get('warehouses', { params: { page } });
        
        if (resp.data.success) {
            store.state.data.warehouses = resp.data.data.data;
            // Extract pagination info
            const { data, ...meta } = resp.data.data;
            pagination.value = meta;
        }
    } catch (err) {
        console.error(err);
        error.value = "Erreur lors du chargement des entrepôts.";
    } finally {
        loading.value = false;
    }
}

const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        fetchWarehouses(page);
    }
}

const getPageRange = () => {
    const range = [];
    const last = pagination.value.last_page;
    for (let i = 1; i <= last; i++) {
        range.push(i);
    }
    return range;
};

// Modal Logic
const openCreateModal = () => {
    isEditing.value = false;
    form.id = null;
    form.name = '';
    form.location = '';
    form.company_id = '';
    showModal.value = true;
};

const openEditModal = (item) => {
    isEditing.value = true;
    form.id = item.id;
    form.name = item.name;
    form.location = item.location || '';
    form.company_id = item.company_id || '';
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    form.id = null;
    form.name = '';
    form.location = '';
    form.company_id = '';
};

const submitForm = async () => {
    submitting.value = true;
    try {
        let resp;
        if (isEditing.value) {
            resp = await api.put(`warehouses/${form.id}`, form);
        } else {
            resp = await api.post('warehouses', form);
        }

        if (resp.data.success) {
            closeModal();
            fetchWarehouses(pagination.value.current_page);
        } else {
            alert(resp.data.message || "Une erreur est survenue");
        }
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
        submitting.value = false;
    }
};

const confirmDelete = async (item) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'entrepôt "${item.name}" ?`)) {
        try {
            loading.value = true;
            await api.delete(`warehouses/${item.id}`);
            fetchWarehouses(pagination.value.current_page);
        } catch (err) {
            console.error(err);
            error.value = "Impossible de supprimer cet entrepôt.";
        } finally {
            loading.value = false;
        }
    }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}
</style>