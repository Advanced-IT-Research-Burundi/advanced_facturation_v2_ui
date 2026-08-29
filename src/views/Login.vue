<script setup>
import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter, RouterLink } from "vue-router";

const store = useStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const handleLogin = async () => {
  errorMessage.value = "";
  loading.value = true;

  try {
    const result = await store.dispatch("auth/login", {
      email: email.value,
      password: password.value,
    });

    if (result.success) {
      router.push("/dashboard");
    } else {
      errorMessage.value = result.error;
    }
  } catch (error) {
    errorMessage.value = "Le serveur ne répond pas. Vérifiez votre connexion.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="auth-container d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden bg-light"
  >
    <div
      class="card glass shadow-lg p-5"
      style="max-width: 450px; width: 100%; z-index: 10"
    >
      <div class="text-center mb-4">
        <div
          class="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 text-white mb-3"
          style="width: 50px; height: 50px"
        >
          <i class="pi pi-box fs-4"></i>
        </div>
        <h2 class="fw-bold mb-1">Bon-retour</h2>
        <p class="text-secondary small">
          Connectez-vous pour accéder à votre tableau de bord Advanced
          Facturation V2
        </p>
      </div>

      <div
        v-if="errorMessage"
        class="alert alert-danger py-2 mb-3 small border-0 shadow-sm text-center"
      >
        <i class="pi pi-exclamation-circle me-1"></i> {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label small fw-semibold">Adresse Email</label>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-muted"
              ><i class="pi pi-envelope"></i
            ></span>
            <input
              v-model="email"
              type="email"
              class="form-control border-start-0 ps-0"
              placeholder="nom@entreprise.com"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold">Mot de passe</label>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-muted"
              ><i class="pi pi-lock"></i
            ></span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control border-start-0 ps-0"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="btn btn-outline-secondary border-start-0 password-toggle"
              :disabled="loading"
              :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <div class="d-flex justify-content-end mt-2">
            <span class="text-muted small" title="Fonctionnalité bientôt disponible">Mot de passe oublié ?</span>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm"></span>
          <span v-else><i class="pi pi-sign-in"></i> Se Connecter</span>
        </button>
      </form>

      <!-- <div class="text-center mt-4 small text-muted">
        Vous n'avez pas de compte ?
        <RouterLink
          to="/register-company"
          class="text-primary fw-bold text-decoration-none"
          >Enregistrer l'entreprise</RouterLink
        >
      </div> -->
    </div>

    <div
      class="position-absolute bg-primary opacity-10 rounded-circle"
      style="
        width: 400px;
        height: 400px;
        top: -100px;
        left: -100px;
        filter: blur(80px);
        opacity: 0.15;
      "
    ></div>
    <div
      class="position-absolute bg-info opacity-10 rounded-circle"
      style="
        width: 300px;
        height: 300px;
        bottom: -50px;
        right: -50px;
        filter: blur(80px);
        opacity: 0.15;
      "
    ></div>
  </div>
</template>

<style scoped>
.input-group-text {
  background-color: rgba(255, 255, 255, 0.8) !important;
  border-right: none;
}
.form-control {
  border-left: none;
  background-color: rgba(255, 255, 255, 0.9);
}
.form-control:focus {
  box-shadow: none;
  background-color: #fff;
  border-color: #ced4da;
}
.password-toggle {
  background-color: rgba(255, 255, 255, 0.9);
}
.password-toggle:focus {
  box-shadow: none;
}
.glass {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.input-group:focus-within .input-group-text,
.input-group:focus-within .form-control,
.input-group:focus-within .password-toggle {
  border-color: var(--bs-primary);
  color: var(--bs-primary);
}
.input-group:focus-within .input-group-text i {
  color: var(--bs-primary);
}
</style>
