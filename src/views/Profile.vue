<template>
  <div class="container py-4">
    <h1 class="mb-4">Mon Profil</h1>
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Informations personnelles</h5>
        <p class="card-text">
          <strong>Nom :</strong> {{ user.name }}<br />
          <strong>Email :</strong> {{ user.email }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const user = computed(() => store.state.auth.user);
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
