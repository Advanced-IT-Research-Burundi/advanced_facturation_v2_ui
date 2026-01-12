<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden bg-light p-4">
    <div class="card glass shadow-lg p-5" style="max-width: 600px; width: 100%; z-index: 10;">
      <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 text-white mb-3" style="width: 50px; height: 50px;">
          <i class="pi pi-building fs-4"></i>
        </div>
        <h2 class="fw-bold mb-1">Enregistrer l'entreprise</h2>
        <p class="text-secondary small">Commencez à gérer votre entreprise de manière professionnelle</p>
      </div>

      <form @submit.prevent>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label small fw-semibold">Nom de l'entreprise</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"><i class="pi pi-briefcase"></i></span>
              <input type="text" class="form-control" placeholder="Acme Inc.">
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-semibold">NIF / Tax ID</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"><i class="pi pi-id-card"></i></span>
              <input type="text" class="form-control" placeholder="123456789">
            </div>
          </div>
          
          <div class="col-12">
            <label class="form-label small fw-semibold">Email de l'entreprise</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"><i class="pi pi-envelope"></i></span>
              <input type="email" class="form-control" placeholder="contact@entreprise.com">
            </div>
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold">Numéro de téléphone</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"><i class="pi pi-phone"></i></span>
              <input type="tel" class="form-control" placeholder="+257 60 000 000">
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label small fw-semibold">Mot de passe</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"><i class="pi pi-lock"></i></span>
              <input type="password" class="form-control" placeholder="••••••••">
            </div>
          </div>
          <div class="col-md-6">
             <label class="form-label small fw-semibold">Confirmer Mot de passe</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted"><i class="pi pi-lock"></i></span>
              <input type="password" class="form-control" placeholder="••••••••">
            </div>
          </div>
          
          <div class="col-12">
            <div class="form-check mt-2">
              <input class="form-check-input" type="checkbox" id="terms">
              <label class="form-check-label small text-muted" for="terms">
                J'accepte les <a href="#" class="text-primary text-decoration-none">Conditions d'utilisation</a> et la <a href="#" class="text-primary text-decoration-none">Politique de confidentialité</a>.
              </label>
            </div>
          </div>
          
          <div class="col-12 mt-4">
            <button class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2">
              <i class="pi pi-check-circle"></i> Créer un compte
            </button>
          </div>
        </div>
      </form>

      <div class="text-center mt-4 small text-muted">
        Vous avez déjà un compte ? 
        <RouterLink to="/login" class="text-primary fw-bold text-decoration-none">Se Connecter</RouterLink>
      </div>
    </div>
    
    <!-- Background Circles -->
    <div class="position-absolute bg-primary opacity-10 rounded-circle" style="width: 500px; height: 500px; top: -150px; right: -100px; filter: blur(80px);"></div>
    <div class="position-absolute bg-info opacity-10 rounded-circle" style="width: 400px; height: 400px; bottom: -100px; left: -100px; filter: blur(80px);"></div>
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
</style>
