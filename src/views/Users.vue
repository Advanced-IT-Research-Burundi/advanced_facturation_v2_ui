<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between">
    <h1 class="h5 mb-4">Gestion des Utilisateurs</h1>
      <RouterLink to="/users/create" class="btn btn-primary mt-3">Ajouter un utilisateur</RouterLink>
    </div>

    <div class="card glass text-center text-muted">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Nom</th>
            <th scope="col">Prenom</th>
            <th scope="col">Email</th>
            <th scope="col">Role</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <th scope="row">1</th>
            <td>{{ user.name }}</td>
            <td>{{ user.prenom }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>
              <RouterLink to="/users/edit" class="btn btn-primary">Edit</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, name: 'John', prenom: 'Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane', prenom: 'Doe', email: 'jane@example.com', role: 'user' },
]);
</script>