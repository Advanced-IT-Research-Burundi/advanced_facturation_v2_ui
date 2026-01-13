<template>
  <div class="container-fluid p-0">
    <h1 class="h3 mb-4">Dépenses</h1>
    <div class="card glass text-center p-5 text-muted">
      Gestion des Dépenses
    </div>
    <div class="card glass p-4">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(expense, index) in expenses" :key="index">
            <th scope="row">{{ index + 1 }}</th>
            <td>{{ expense.date }}</td>
            <td>{{ expense.description }}</td>
            <td>{{ expense.amount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const expenses = ref([
  { date: "2026-01-10", description: "Achat de fournitures", amount: "150.00" },
  {
    date: "2026-01-11",
    description: "Paiement facture électricité",
    amount: "200.00",
  },
]);
</script>

<style scoped>
/* Add your styles here */
</style>
