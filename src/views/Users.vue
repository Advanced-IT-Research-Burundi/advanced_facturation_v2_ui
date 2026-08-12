<template>
  <div class="container-fluid p-0">
    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h5 mb-0">Gestion des Utilisateurs</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>Ajouter
      </button>
    </div>

    <!-- SEARCH & FILTERS -->
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Rechercher..." v-model="searchQuery" @input="handleSearch">
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="companyFilter" @change="handleFilterChange">
              <option value="">Toutes les entreprises</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button v-if="hasActiveFilters" @click="clearFilters" class="btn btn-outline-secondary w-100">
              <i class="bi bi-x-circle"></i> Effacer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <UsersAdd v-if="showModal" :user="selectedUser" @close="closeModal" @refresh="fetchUsers" />

    <!-- LOADING -->
    <div v-if="isLoading" class="text-center p-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- TABLE -->
    <div v-else class="card shadow-sm">
      <div v-if="filteredUsers.length === 0" class="p-5 text-center">
        <i class="bi bi-people display-1 text-muted"></i>
        <h5 class="text-muted mt-3">Aucun utilisateur trouvé</h5>
        <button @click="openCreateModal" class="btn btn-primary mt-3">
          <i class="bi bi-plus-circle me-2"></i>Ajouter un utilisateur
        </button>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôles</th>
              <th>Entreprise</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in filteredUsers" :key="user.id">
              <td>{{ calculateIndex(index) }}</td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="avatar-circle me-2" :style="{ backgroundColor: getAvatarColor(user.name) }">
                    {{ getInitials(user.name) }}
                  </div>
                  <strong>{{ user.name }}</strong>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span v-for="role in displayRoles(user.roles)" :key="role.id" :class="`badge ${getRoleBadgeClass(role.name)} me-1`">
                  {{ role.label }}
                </span>
              </td>
              <td>
                <span v-if="user.company" class="badge bg-light text-dark">{{ user.company.name }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" @click="editUser(user)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" @click="confirmDelete(user)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div v-if="filteredUsers.length > 0" class="d-flex justify-content-between align-items-center p-3 border-top">
        <div class="small text-muted">
          {{ pagination.from || 0 }} à {{ pagination.to || 0 }} sur {{ totalUsers }}
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: pagination.current_page <= 1 }">
              <button class="page-link" @click="changePage(pagination.current_page - 1)">Précédent</button>
            </li>
            <li class="page-item active">
              <button class="page-link">{{ pagination.current_page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: pagination.current_page >= lastPage }">
              <button class="page-link" @click="changePage(pagination.current_page + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import UsersAdd from './UsersAdd.vue';
import { useToast } from '@/composables/useToast';

const store = useStore();
const toast = useToast();
const showModal = ref(false);
const selectedUser = ref(null);
const searchQuery = ref('');
const searchTimeout = ref(null);
const companyFilter = ref('');

const users = computed(() => store.getters['users/allUsers']);
const totalUsers = computed(() => store.getters['users/totalUsers']);
const isLoading = computed(() => store.getters['users/isLoading']);
const error = computed(() => store.state.users.error);
const pagination = computed(() => store.state.users.pagination);
const companies = computed(() => store.getters['companies/allCompanies']);
const lastPage = computed(() => pagination.value.last_page || 1);
const hasActiveFilters = computed(() => companyFilter.value);

const filteredUsers = computed(() => {
  let filtered = users.value;
  if (companyFilter.value) {
    filtered = filtered.filter(u => u.company_id === parseInt(companyFilter.value));
  }
  return filtered;
});

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const getAvatarColor = (name) => {
  const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1'];
  return colors[name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length];
};

const getRoleBadgeClass = (role) => {
  const classes = {
    super_admin: 'bg-dark', admin: 'bg-danger', manager: 'bg-warning text-dark', user: 'bg-secondary',
    cashier: 'bg-success', sales: 'bg-info', stock_manager: 'bg-primary',
    pharmacist: 'bg-primary', baker: 'bg-warning text-dark', accountant: 'bg-info'
  };
  return classes[role] || 'bg-secondary';
};

const displayRoles = (roles = []) => {
  const superAdmin = roles.find((role) => role.name?.toLowerCase() === 'super_admin');
  if (superAdmin) return [superAdmin];

  const admin = roles.find((role) => role.name?.toLowerCase() === 'admin');
  if (admin) return [admin];

  return roles;
};

const calculateIndex = (index) => (pagination.value.current_page - 1) * pagination.value.per_page + index + 1;

const fetchUsers = async (page = 1, search = '') => {
  try {
    await store.dispatch('users/fetchUsers', { page, search });
    await store.dispatch('companies/fetchCompanies');
  } catch (e) {
    console.error('Erreur:', e);
  }
};

const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => fetchUsers(1, searchQuery.value), 500);
};

const changePage = (page) => {
  if (page > 0 && page <= lastPage.value) fetchUsers(page, searchQuery.value);
};

const openCreateModal = () => {
  selectedUser.value = null;
  showModal.value = true;
};

const editUser = (user) => {
  selectedUser.value = user;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedUser.value = null;
};

const handleFilterChange = () => fetchUsers(1, searchQuery.value);

const clearFilters = () => {
  companyFilter.value = '';
  fetchUsers(1, searchQuery.value);
};

const deleteUser = async (user) => {
  try {
    await store.dispatch('users/deleteUser', user.id);
    fetchUsers(pagination.value.current_page, searchQuery.value);
  } catch (e) {
    toast.error("Erreur lors de la suppression");
  }
};

const confirmDelete = async (user) => {
  const confirmed = await showDeleteConfirmation(user);
  if (confirmed) await deleteUser(user);
};

const showDeleteConfirmation = (user) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal fade show d-block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirmer</h5>
            <button type="button" class="btn-close btn-close-white" data-action="cancel"></button>
          </div>
          <div class="modal-body">
            <p>Supprimer <strong>${user.name}</strong> ?</p>
            <div class="alert alert-warning mb-0">
              <small><i class="bi bi-info-circle me-1"></i>Action irréversible</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="cancel">Annuler</button>
            <button class="btn btn-danger" data-action="confirm">
              <i class="bi bi-trash me-1"></i>Supprimer
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    const closeModal = (result) => {
      modal.remove();
      resolve(result);
    };
    
    modal.querySelectorAll('[data-action="cancel"]').forEach(btn => btn.addEventListener('click', () => closeModal(false)));
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => closeModal(true));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(false); });
  });
};

onMounted(() => fetchUsers(1));
</script>

<style scoped>
.avatar-circle {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
}
.table th, .table td { vertical-align: middle; padding: 12px; }
.table-hover tbody tr:hover { background-color: rgba(0, 123, 255, 0.05); }
.badge { font-size: 0.75rem; padding: 0.375rem 0.75rem; }
.card { transition: box-shadow 0.2s; }
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
</style>
