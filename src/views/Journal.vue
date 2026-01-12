<template>
  <div class="container-fluid p-0">
    <h1 class="h3 mb-4">Journal</h1>
    <div class="card glass text-center p-5 text-muted">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Date</th>
            <th scope="col">Activité</th>
            <th scope="col">Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, index) in journalEntries" :key="index">
            <th scope="row">{{ index + 1 }}</th>
            <td>{{ entry.date }}</td>
            <td>{{ entry.activity }}</td>
            <td>{{ entry.user }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const journalEntries = ref([
  { date: "2026-01-12", activity: "Vente réalisée", user: "Admin" },
  { date: "2026-01-11", activity: "Produit ajouté", user: "John Doe" },
]);
</script>

<style scoped>
/* Add your styles here */
</style>
