<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="auth-container d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden">
    <!-- Card -->
    <div class="card glass shadow-lg p-5" style="max-width: 450px; width: 100%; z-index: 10;">
      <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 text-white mb-3" style="width: 50px; height: 50px;">
          <i class="pi pi-box fs-4"></i>
        </div>
        <h2 class="fw-bold mb-1">Bon-retour</h2>
        <p class="text-secondary small">Connectez-vous pour accéder à votre tableau de bord Advanced Facturation V2</p>
      </div>

      <form @submit.prevent>
        <div class="mb-3">
          <label class="form-label small fw-semibold">Adresse Email</label>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-muted"><i class="pi pi-envelope"></i></span>
            <input type="email" class="form-control border-start-0 ps-0" placeholder="nom@entreprise.com">
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold">Mot de passe</label>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-muted"><i class="pi pi-lock"></i></span>
            <input type="password" class="form-control border-start-0 ps-0" placeholder="••••••••">
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="rememberMe">
              <label class="form-check-label small text-muted" for="rememberMe">Se souvenir de moi</label>
            </div>
            <a href="#" class="small text-decoration-none text-primary">Mot de passe oublié ?</a>
          </div>
        </div>

        <button class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm">
          <i class="pi pi-sign-in"></i> Se Connecter
        </button>
      </form>

      <div class="text-center mt-4 small text-muted">
        Vous n'avez pas de compte ? 
        <RouterLink to="/register-company" class="text-primary fw-bold text-decoration-none">Enregistrer l'entreprise</RouterLink>
      </div>
    </div>
    
    <!-- Background Decor -->
    <div class="position-absolute bg-primary opacity-10 rounded-circle" style="width: 400px; height: 400px; top: -100px; left: -100px; filter: blur(80px);"></div>
    <div class="position-absolute bg-info opacity-10 rounded-circle" style="width: 300px; height: 300px; bottom: -50px; right: -50px; filter: blur(80px);"></div>
  </div>
</template>

<style scoped>
/* Bootstrap handles most, just minor tweaks */
.input-group-text {
  background-color: rgba(255, 255, 255, 0.8) !important;
  border-right: none;
}
.form-control {
  border-left: none;
}
</style>
