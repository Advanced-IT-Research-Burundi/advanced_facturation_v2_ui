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
    <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
      {{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = null"></button>
    </div>

    <!-- Table Card -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 25%;">Nom</th>
                <th>Emplacement</th>
                <th class="text-center">Production</th>
                <th class="text-center">Utilisateurs</th>
                <th class="text-center" style="width: 160px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in warehouses" :key="item.id">
                <td class="fw-bold text-primary">{{ item.name }}</td>
                <td class="text-muted">{{ item.location || '-' }}</td>
                <td class="text-center">
                  <span class="badge" :class="item.is_production ? 'bg-success' : 'bg-secondary'">
                    {{ item.is_production ? 'Oui' : 'Non' }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge bg-info">{{ item.users_count || 0 }}</span>
                </td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-success me-1" 
                          @click="openAssignModal(item)" 
                          title="Gérer les utilisateurs">
                    <i class="bi bi-people"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary me-1" 
                          @click="openEditModal(item)" 
                          title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" 
                          @click="confirmDelete(item)" 
                          title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!loading && warehouses.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
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
            <li class="page-item" 
                :class="{ active: pagination.current_page === page }" 
                v-for="page in getPageRange()" 
                :key="page">
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
                <label class="form-label">STOCK DE PRODUCTION</label>
                <select class="form-select" v-model="form.is_production">
                  <option :value="false">Non</option>
                  <option :value="true">Oui</option>
                </select>
              </div>
              <!-- <div class="mb-3">
                <label class="form-label">Company ID</label>
                <input type="number" class="form-control" 
                       v-model="form.company_id" 
                       placeholder="Ex: 1">
              </div> -->
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="warehouseForm" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Users Modal -->
    <div v-if="showAssignModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-people me-2"></i>
              Gérer les utilisateurs - {{ selectedWarehouse?.name }}
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeAssignModal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Available Users -->
              <div class="col-md-6">
                <h6 class="mb-3">
                  <i class="bi bi-person-plus text-success"></i>
                  Utilisateurs disponibles
                </h6>
                <div v-if="loadingUsers" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm text-primary"></div>
                </div>
                <div v-else-if="availableUsers.length === 0" class="text-center text-muted py-3">
                  <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                  Aucun utilisateur disponible
                </div>
                <div v-else class="list-group" style="max-height: 400px; overflow-y: auto;">
                  <div v-for="user in availableUsers" 
                       :key="user.id" 
                       class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-bold">{{ user.name }}</div>
                      <small class="text-muted">{{ user.email }}</small>
                    </div>
                    <button class="btn btn-sm btn-success" 
                            @click="assignUser(user.id)"
                            :disabled="assigningUser">
                      <i class="bi bi-plus-circle"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Assigned Users -->
              <div class="col-md-6">
                <h6 class="mb-3">
                  <i class="bi bi-person-check text-primary"></i>
                  Utilisateurs assignés
                </h6>
                <div v-if="loadingUsers" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm text-primary"></div>
                </div>
                <div v-else-if="assignedUsers.length === 0" class="text-center text-muted py-3">
                  <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                  Aucun utilisateur assigné
                </div>
                <div v-else class="list-group" style="max-height: 400px; overflow-y: auto;">
                  <div v-for="user in assignedUsers" 
                       :key="user.id" 
                       class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-bold">{{ user.name }}</div>
                      <small class="text-muted">{{ user.email }}</small>
                    </div>
                    <button class="btn btn-sm btn-danger" 
                            @click="unassignUser(user.id)"
                            :disabled="unassigningUser">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAssignModal">Fermer</button>
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
import { useConfirm } from '@/composables/useConfirm';

const { confirm: confirmDialog } = useConfirm();

// Local State
const showModal = ref(false);
const showAssignModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const loading = ref(false);
const loadingUsers = ref(false);
const assigningUser = ref(false);
const unassigningUser = ref(false);
const error = ref(null);
const successMessage = ref(null);
const selectedWarehouse = ref(null);
const availableUsers = ref([]);
const assignedUsers = ref([]);

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
    company_id: '',
    is_production: false
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
            store.state.data.warehouses = resp.data.data;
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
    form.is_production = false;
    showModal.value = true;
};

const openEditModal = (item) => {
    isEditing.value = true;
    form.id = item.id;
    form.name = item.name;
    form.location = item.location || '';
    form.company_id = item.company_id || '';
    form.is_production = item.is_production || false;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    form.id = null;
    form.name = '';
    form.location = '';
    form.company_id = '';
    form.is_production = false;
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
            successMessage.value = isEditing.value 
                ? 'Entrepôt modifié avec succès' 
                : 'Entrepôt créé avec succès';
            closeModal();
            fetchWarehouses(pagination.value.current_page);
        } else {
            error.value = resp.data.message || "Une erreur est survenue";
        }
    } catch (err) {
        console.error(err);
        error.value = err.response?.data?.message || "Erreur lors de l'enregistrement";
    } finally {
        submitting.value = false;
    }
};

const confirmDelete = async (item) => {
    if (await confirmDialog(`Êtes-vous sûr de vouloir supprimer l'entrepôt "${item.name}" ?`)) {
        try {
            loading.value = true;
            await api.delete(`warehouses/${item.id}`);
            successMessage.value = 'Entrepôt supprimé avec succès';
            fetchWarehouses(pagination.value.current_page);
        } catch (err) {
            console.error(err);
            error.value = "Impossible de supprimer cet entrepôt.";
        } finally {
            loading.value = false;
        }
    }
};

// Assign Modal Logic
const openAssignModal = async (warehouse) => {
    selectedWarehouse.value = warehouse;
    showAssignModal.value = true;
    await loadUsers(warehouse.id);
};

const closeAssignModal = () => {
    showAssignModal.value = false;
    selectedWarehouse.value = null;
    availableUsers.value = [];
    assignedUsers.value = [];
    fetchWarehouses(pagination.value.current_page);
};

const loadUsers = async (warehouseId) => {
    loadingUsers.value = true;
    try {
        const [assignedResp, availableResp] = await Promise.all([
            api.get(`warehouses/${warehouseId}/users`),
            api.get(`warehouses/${warehouseId}/available-users`)
        ]);

        if (assignedResp.data.success) {
            assignedUsers.value = assignedResp.data.data;
        }
        if (availableResp.data.success) {
            availableUsers.value = availableResp.data.data;
        }
    } catch (err) {
        console.error(err);
        error.value = "Erreur lors du chargement des utilisateurs";
    } finally {
        loadingUsers.value = false;
    }
};

const assignUser = async (userId) => {
    assigningUser.value = true;
    try {
        const resp = await api.post(`warehouses/${selectedWarehouse.value.id}/assign-user`, {
            user_id: userId
        });

        if (resp.data.success) {
            successMessage.value = 'Utilisateur assigné avec succès';
            await loadUsers(selectedWarehouse.value.id);
        } else {
            error.value = resp.data.message;
        }
    } catch (err) {
        console.error(err);
        error.value = err.response?.data?.message || "Erreur lors de l'assignation";
    } finally {
        assigningUser.value = false;
    }
};

const unassignUser = async (userId) => {
    unassigningUser.value = true;
    try {
        const resp = await api.post(`warehouses/${selectedWarehouse.value.id}/unassign-user`, {
            user_id: userId
        });

        if (resp.data.success) {
            successMessage.value = 'Utilisateur désassigné avec succès';
            await loadUsers(selectedWarehouse.value.id);
        } else {
            error.value = resp.data.message;
        }
    } catch (err) {
        console.error(err);
        error.value = err.response?.data?.message || "Erreur lors de la désassignation";
    } finally {
        unassigningUser.value = false;
    }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}

.list-group-item {
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.badge {
  font-size: 0.875rem;
  padding: 0.35em 0.65em;
}
</style>
