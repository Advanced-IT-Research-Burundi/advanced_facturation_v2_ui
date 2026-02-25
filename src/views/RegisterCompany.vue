<script setup>
import { ref, reactive } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useStore } from "vuex";

const router = useRouter();
const store = useStore();

const domainOptions = [
  { value: "general", label: "Commerce Général", icon: "pi-shopping-bag" },
  { value: "hotel", label: "Hôtel / Hébergement", icon: "pi-building" },
  { value: "pharmaceutical", label: "Pharmacie / Médical", icon: "pi-heart" },
  { value: "restaurant", label: "Restaurant / Café", icon: "pi-table" },
  { value: "bakery", label: "Boulangerie / Pâtisserie", icon: "pi-star" },
];

const form = reactive({
  company_name: "",
  tp_TIN: "",
  domain: "general",
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
});

const loading = ref(false);
const error = ref(null);
const validationErrors = ref({});

const handleRegister = async () => {
  error.value = null;
  validationErrors.value = {};

  loading.value = true;

  const result = await store.dispatch("auth/registerCompany", form);

  if (result.success) {
    router.push({ name: "dashboard" }); // Correct route name is lowercase
  } else {
    error.value = result.error;
    if (result.validationErrors) {
      validationErrors.value = result.validationErrors;
    }
  }
  loading.value = false;
};
</script>

<template>
  <div
    class="d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden bg-light p-4"
  >
    <div
      class="card glass shadow-lg p-5"
      style="max-width: 600px; width: 100%; z-index: 10"
    >
      <div class="text-center mb-4">
        <div
          class="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 text-white mb-3"
          style="width: 50px; height: 50px"
        >
          <i class="pi pi-building fs-4"></i>
        </div>
        <h2 class="fw-bold mb-1">Enregistrer l'entreprise</h2>
        <p class="text-secondary small">
          Commencez à gérer votre entreprise de manière professionnelle
        </p>
      </div>

      <div
        v-if="error"
        class="alert alert-danger small py-2 mb-3 shadow-sm border-0"
      >
        <i class="pi pi-exclamation-circle me-1"></i> {{ error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label small fw-semibold"
              >Nom de l'entreprise</label
            >
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"
                ><i class="pi pi-briefcase"></i
              ></span>
              <input
                v-model="form.company_name"
                type="text"
                class="form-control"
                placeholder="Acme Inc."
                required
              />
            </div>
            <div
              v-if="validationErrors.company_name"
              class="text-danger x-small mt-1"
            >
              {{ validationErrors.company_name[0] }}
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-semibold">NIF / Tax ID</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"
                ><i class="pi pi-id-card"></i
              ></span>
              <input
                v-model="form.tp_TIN"
                type="text"
                class="form-control"
                placeholder="123456789"
                required
              />
            </div>
            <div
              v-if="validationErrors.tp_TIN"
              class="text-danger x-small mt-1"
            >
              {{ validationErrors.tp_TIN[0] }}
            </div>
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold">Domaine d'activité</label>
            <div class="row g-2">
              <div
                v-for="option in domainOptions"
                :key="option.value"
                class="col-6 col-md-4"
              >
                <button
                  type="button"
                  class="domain-option w-100 d-flex flex-column align-items-center justify-content-center gap-1 p-2 rounded-3 border"
                  :class="{ active: form.domain === option.value }"
                  @click="form.domain = option.value"
                >
                  <i :class="['pi', option.icon, 'fs-5']"></i>
                  <span class="small fw-semibold lh-1 text-center" style="font-size: 0.7rem">{{ option.label }}</span>
                </button>
              </div>
            </div>
            <div v-if="validationErrors.domain" class="text-danger x-small mt-1">
              {{ validationErrors.domain[0] }}
            </div>
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold"
              >Nom de l'administrateur</label
            >
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"
                ><i class="pi pi-user"></i
              ></span>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold"
              >Email de l'administrateur</label
            >
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"
                ><i class="pi pi-envelope"></i
              ></span>
              <input
                v-model="form.email"
                type="email"
                class="form-control"
                placeholder="admin@entreprise.com"
                required
              />
            </div>
            <div v-if="validationErrors.email" class="text-danger x-small mt-1">
              {{ validationErrors.email[0] }}
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label small fw-semibold">Mot de passe</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"
                ><i class="pi pi-lock"></i
              ></span>
              <input
                v-model="form.password"
                type="password"
                class="form-control"
                placeholder="••••••••"
                required
              />
            </div>
            <div
              v-if="validationErrors.password"
              class="text-danger x-small mt-1"
            >
              {{ validationErrors.password[0] }}
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-semibold"
              >Confirmer Mot de passe</label
            >
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"
                ><i class="pi pi-lock"></i
              ></span>
              <input
                v-model="form.password_confirmation"
                type="password"
                class="form-control"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div class="col-12 mt-4">
            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            >
              <i v-if="!loading" class="pi pi-check-circle"></i>
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm"
              ></span>
              {{ loading ? "Chargement..." : "Créer un compte" }}
            </button>
          </div>
        </div>
      </form>

      <div class="text-center mt-4 small text-muted">
        Vous avez déjà un compte ?
        <RouterLink
          to="/login"
          class="text-primary fw-bold text-decoration-none"
          >Se Connecter</RouterLink
        >
      </div>
    </div>

    <!-- Background Circles -->
    <div
      class="position-absolute bg-primary opacity-10 rounded-circle"
      style="
        width: 500px;
        height: 500px;
        top: -150px;
        right: -100px;
        filter: blur(80px);
      "
    ></div>
    <div
      class="position-absolute bg-info opacity-10 rounded-circle"
      style="
        width: 400px;
        height: 400px;
        bottom: -100px;
        left: -100px;
        filter: blur(80px);
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
}
.domain-option {
  background-color: #fff;
  border-color: #dee2e6 !important;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 64px;
}
.domain-option:hover:not(.active) {
  border-color: #0d6efd !important;
  color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.05);
}
.domain-option.active {
  border-color: #0d6efd !important;
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}
</style>
