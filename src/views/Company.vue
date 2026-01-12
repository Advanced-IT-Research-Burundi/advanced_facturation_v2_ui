<template>
  <div class="container-fluid p-0">
    <h1 class="h3 mb-4">Entreprise</h1>
    <div class="card glass p-4">
      <form @submit.prevent="updateCompany">
        <div class="mb-3">
          <label for="companyName" class="form-label"
            >Nom de l'Entreprise</label
          >
          <input
            type="text"
            id="companyName"
            v-model="company.name"
            class="form-control"
          />
        </div>
        <div class="mb-3">
          <label for="companyEmail" class="form-label">Email</label>
          <input
            type="email"
            id="companyEmail"
            v-model="company.email"
            class="form-control"
          />
        </div>
        <div class="mb-3">
          <label for="companyPhone" class="form-label">Téléphone</label>
          <input
            type="text"
            id="companyPhone"
            v-model="company.phone"
            class="form-control"
          />
        </div>
        <button type="submit" class="btn btn-primary">Mettre à jour</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const company = ref({
  name: "Advanced Facturation",
  email: "contact@advancedfacturation.com",
  phone: "123-456-7890",
});

const updateCompany = () => {
  alert("Informations mises à jour !");
};
</script>

<style scoped>
/* Add your styles here */
</style>
