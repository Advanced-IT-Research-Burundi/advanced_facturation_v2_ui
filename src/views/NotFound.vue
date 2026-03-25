<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light px-3">
    <h1 class="display-4 text-muted">404</h1>
    <p class="text-secondary mb-4">Cette page n'existe pas ou a été déplacée.</p>
    <button type="button" class="btn btn-primary" @click="router.push({ name: 'dashboard' })">
      Retour au tableau de bord
    </button>
  </div>
</template>
