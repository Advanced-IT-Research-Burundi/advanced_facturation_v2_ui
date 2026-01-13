<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between">
      <h1 class="h5 mb-4">Gestion des Utilisateurs</h1>
      <button @click="showModal = true" class="btn btn-primary mt-5">
        Ajouter un utilisateur
      </button>
    </div>

    <div v-if="showModal" class="modal-overlay ">
      <UsersAdd @close="showModal = false" @refresh="getusers()" />
    </div>

    <div v-if="isLoading || users.length === 0" class="text-center p-4">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else class="card glass text-center text-muted">
      <div v-if="!users || users.length === 0" class="p-4">
        <p>Aucun utilisateur trouvé</p>
      </div>

      <table v-else class="table table-hover mt-3">
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Email</th>
            <th scope="col">Company Name</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.company?.name }}</td>
            <td>
              <button @click="editUser(user)" class="btn btn-primary btn-sm me-2">
                Edit
              </button>
              <button @click="deleteUser(user)" class="btn btn-danger btn-sm">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalUsers > 0" class="p-3">
        <p>Total: {{ totalUsers }} utilisateurs</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import UsersAdd from './UsersAdd.vue';


const store = useStore();
const showModal = ref(false);

const users = computed(() => store.getters['users/allUsers']);
const totalUsers = computed(() => store.getters['users/totalUsers']);
const isLoading = computed(() => store.getters['users/isLoading']);
const error = computed(() => store.state.users.error);

const companies = computed(() => store.getters['companies/allCompanies']);

const companyMap = computed(() => {
  const map = {};
  companies.value.forEach(company => {
    map[company.id] = company.name;
  });
  return map;
});

onMounted( () => {
  getusers();
});

async function getusers() {
  try {
    await store.dispatch('users/fetchUsers');
    await store.dispatch('companies/fetchCompanies');
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
  }
}

function editUser(user) {
  store.state.data.activepage = 'editUser';
  store.state.data.editUser = user;
}

async function deleteUser(user) {
  if (confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.name} ?`)) {
    try {
      await store.dispatch('users/deleteUser', user.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  }
}
</script>

<style>
  
</style>