<script setup>
import { ShieldX, ArrowLeft, Home } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div class="unauthorized-container">
    <div class="unauthorized-content text-center">
      <div class="icon-wrapper mb-4">
        <ShieldX :size="80" class="text-danger" />
      </div>
      
      <h1 class="display-5 fw-bold text-dark mb-3">Accès Refusé</h1>
      
      <p class="lead text-muted mb-4">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        <br>
        Contactez votre administrateur si vous pensez que c'est une erreur.
      </p>
      
      <div class="d-flex justify-content-center gap-3">
        <button class="btn btn-outline-secondary" @click="goBack">
          <ArrowLeft :size="18" class="me-2" />
          Retour
        </button>
        <button class="btn btn-primary" @click="goHome">
          <Home :size="18" class="me-2" />
          Accueil
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unauthorized-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 2rem;
}

.unauthorized-content {
  max-width: 500px;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 50%;
}
</style>
