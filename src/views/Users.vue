<template>
  <div class="container-fluid p-0">

    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h5">Gestion des Utilisateurs</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        Ajouter un utilisateur
      </button>
    </div>

    <!-- SEARCH -->
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input 
                type="text" 
                class="form-control border-start-0 ps-0" 
                placeholder="Rechercher par nom, email..." 
                v-model="searchQuery"
                @input="handleSearch"
              >
            </div>
          </div>
        </div>
      </div>
    </div>  

    <!-- MODAL CREATE / EDIT -->
    <UsersAdd
      v-if="showModal"
      :user="selectedUser"
      @close="closeModal"
      @refresh="fetchUsers"
    />

    <!-- LOADING -->
    <div v-if="isLoading" class="text-center p-4">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- TABLE -->
    <div v-else class="card shadow-sm">
      <div v-if="users.length === 0" class="p-4 text-center text-muted">
        Aucun utilisateur trouvé
      </div>

      <table v-else class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Entreprise</th>
            <th style="width: 160px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in users" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.company?.name ?? '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary me-2" @click="editUser(user)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteUser(user)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- PAGINATION -->
      <div class="d-flex justify-content-between align-items-center p-3 border-top">
        <div class="small text-muted">
          Page <strong>{{ pagination.current_page }}</strong> sur <strong>{{ lastPage }}</strong>
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
              <button
  class="page-link text-danger"
  :disabled="pagination.current_page <= 1"
  @click="changePage(pagination.current_page - 1)"
>
  Précédent
</button>

            </li>
            
            <li class="page-item active">
              <button class="page-link bg-danger border-danger text-white">{{ pagination.current_page }}</button>
            </li>

            <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
              <button
                class="page-link text-danger"
                :disabled="pagination.current_page >= lastPage"
                @click="changePage(pagination.current_page + 1)"
              >
                Suivant
              </button>

            </li>
          </ul>
        </nav>
      </div>

      <div class="p-3 text-muted">
        Total : {{ totalUsers }} utilisateurs
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import UsersAdd from './UsersAdd.vue';

const store = useStore();

/* STATE */
const showModal = ref(false);
const selectedUser = ref(null);
const searchQuery = ref('');
const searchTimeout = ref(null);

/* GETTERS */
const users = computed(() => store.getters['users/allUsers']);
const totalUsers = computed(() => store.getters['users/totalUsers']);
const isLoading = computed(() => store.getters['users/isLoading']);
const error = computed(() => store.state.users.error);
const pagination = computed(() => store.state.users.pagination);

/* PAGINATION */
const lastPage = computed(()=>pagination.value.last_page || 1);

const calculateIndex = (index) => {
  return (pagination.value.current_page - 1) * pagination.value.per_page + (index + 1);
};

/* FETCH USERS */
const fetchUsers = async (page = 1, search = '') => {
  try {
    await store.dispatch('users/fetchUsers', { page, search });
    await store.dispatch('companies/fetchCompanies');
  } catch (e) {
    console.error('Erreur chargement users', e);
  }
};

/* SEARCH HANDLER */
const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    fetchUsers(1, searchQuery.value);
  }, 500);
};

/* PAGINATION CHANGE */
const changePage = (page) => {
  if (page > 0 && page <= lastPage.value) {
    fetchUsers(page, searchQuery.value);
  }
};

/* MODAL ACTIONS */
function openCreateModal() {
  selectedUser.value = null; // CREATE
  showModal.value = true;
}

function editUser(user) {
  selectedUser.value = user; // EDIT
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedUser.value = null;
}

/* DELETE */
async function deleteUser(user) {
  if (!confirm(`Voulez-vous supprimer ${user.name} ?`)) return;

  try {
    await store.dispatch('users/deleteUser', user.id);
    fetchUsers(pagination.value.current_page, searchQuery.value);
  } catch (e) {
    alert("Erreur lors de la suppression");
    console.error(e);
  }
}

onMounted(() => fetchUsers(1));
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}

.page-link {
  color: #c51818;
  border-color: #dee2e6;
}

.page-link:hover {
  color: #9b0e0e;
  background-color: #fff5f5;
}

.page-item.active .page-link {
  background-color: #c51818 !important;
  border-color: #c51818 !important;
}
</style>
