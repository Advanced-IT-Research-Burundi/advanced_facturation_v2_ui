<template>
  <div class="container-fluid p-0">

    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h5">Gestion des Utilisateurs</h1>
      <button @click="openCreateModal" class="btn btn-primary">
        Ajouter un utilisateur
      </button>
    </div>

    <!-- MODAL CREATE / EDIT -->
    <UsersAdd
      v-if="showModal"
      :user="selectedUser"
      @close="closeModal"
      @refresh="getUsers"
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
            <th>Nom</th>
            <th>Email</th>
            <th>Entreprise</th>
            <th style="width: 160px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.company?.name ?? '-' }}</td>
            <td>
              <button
                class="btn btn-sm btn-primary me-2"
                @click="editUser(user)"
              >
                Edit
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteUser(user)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="p-3 text-muted">
        Total : {{ totalUsers }} utilisateurs
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import UsersAdd from './UsersAdd.vue';

const store = useStore();

/* STATE */
const showModal = ref(false);
const selectedUser = ref(null);

/* GETTERS */
const users = computed(() => store.getters['users/allUsers']);
const totalUsers = computed(() => store.getters['users/totalUsers']);
const isLoading = computed(() => store.getters['users/isLoading']);
const error = computed(() => store.state.users.error);

/* FETCH */
onMounted(() => {
  getUsers();
});

async function getUsers() {
  try {
    await store.dispatch('users/fetchUsers');
    await store.dispatch('companies/fetchCompanies');
  } catch (e) {
    console.error('Erreur chargement users', e);
  }
}

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
    getUsers();
  } catch (e) {
    alert("Erreur lors de la suppression");
    console.error(e);
  }
}
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
</style>
