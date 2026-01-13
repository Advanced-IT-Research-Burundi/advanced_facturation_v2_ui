<template>
  <div class="container-fluid p-0">
    <!-- Header -->
    <settings-header></settings-header>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Unités de mesure</h1>
      <div>
        <button class="btn btn-outline-primary me-2" @click="fetchUnites(pagination.current_page)">
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
        <div v-if="loading && product_units.length === 0" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 30%;">Nom</th>
                <th>Description</th>
                <th class="text-center" style="width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="unit in product_units" :key="unit.id">
                <td class="fw-bold text-primary">{{ unit.name }}</td>
                <td class="text-muted">{{ unit.description || '-' }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(unit)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(unit)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="product_units.length === 0">
                <td colspan="3" class="text-center py-5 text-muted">
                  <i class="bi bi-rulers fs-1 d-block mb-2"></i>
                  Aucune unité de mesure trouvée.
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
              {{ isEditing ? 'Modifier l\'unité' : 'Nouvelle unité' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="unitForm">
              <div class="mb-3">
                <label class="form-label">Nom *</label>
                <input type="text" class="form-control" 
                       v-model="form.name" 
                       required 
                       placeholder="Ex: Kg, Litre, Pièce">
              </div>

              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" v-model="form.description" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="unitForm" class="btn btn-primary" :disabled="submitting">
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
import SettingsHeader from './SettingsHeader.vue';

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
    description: ''
});

// Store Access
const product_units = computed(() => store.state.data.product_units || []);

onMounted(() => {
    fetchUnites();
});

// Actions
const fetchUnites = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
        const resp = await api.get('product-units', { params: { page } });
        // Response format: { success: true, data: { data: [...], current_page: ... } }
        if (resp.data.success) {
            store.state.data.product_units = resp.data.data.data;
            // Extract pagination info
            const { data, ...meta } = resp.data.data;
            pagination.value = meta;
        }
    } catch (err) {
        console.error(err);
        error.value = "Erreur lors du chargement des unités.";
    } finally {
        loading.value = false;
    }
}

const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        fetchUnites(page);
    }
}

const getPageRange = () => {
    const range = [];
    const last = pagination.value.last_page;
    for (let i = 1; i <= last; i++) {
        range.push(i);
    }
    // Limit range if needed
    return range;
};

// Modal Logic
const openCreateModal = () => {
    isEditing.value = false;
    form.id = null;
    form.name = '';
    form.description = '';
    showModal.value = true;
};

const openEditModal = (unit) => {
    isEditing.value = true;
    form.id = unit.id;
    form.name = unit.name;
    form.description = unit.description || '';
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    form.id = null;
    form.name = '';
    form.description = '';
};

const submitForm = async () => {
    submitting.value = true;
    try {
        let resp;
        if (isEditing.value) {
            resp = await api.put(`product-units/${form.id}`, form);
        } else {
            resp = await api.post('product-units', form);
        }

        if (resp.data.success) {
            closeModal();
            fetchUnites(pagination.value.current_page);
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

const confirmDelete = async (unit) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'unité "${unit.name}" ?`)) {
        try {
            loading.value = true;
            await api.delete(`product-units/${unit.id}`);
            fetchUnites(pagination.value.current_page);
        } catch (err) {
            console.error(err);
            error.value = "Impossible de supprimer cette unité (elle est peut-être utilisée).";
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