<template>
  <div class="container py-4">
    <h1 class="mb-4">Paramètres</h1>
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Modifier les paramètres</h5>
        <form @submit.prevent="saveSettings">
          <div class="mb-3">
            <label for="emailNotifications" class="form-label"
              >Notifications par email</label
            >
            <input
              type="checkbox"
              id="emailNotifications"
              v-model="settings.emailNotifications"
              class="form-check-input"
            />
          </div>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const settings = ref({
  emailNotifications: true,
});

const saveSettings = () => {
  console.log("Paramètres enregistrés :", settings.value);
};
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
