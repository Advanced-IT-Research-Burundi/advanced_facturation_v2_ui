<script setup>
import { useRouter } from 'vue-router';

defineEmits(["create"]);

const router = useRouter();

const goToImportExport = () => {
  router.push('/products/import-export');
};
</script>

<template>
  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 mt-3">
    <h1 class="h3 fw-bold mb-0">Produits</h1>
    <div class="d-flex flex-wrap gap-2">
      <button
        class="btn btn-outline-success d-inline-flex align-items-center gap-2"
        @click="goToImportExport"
      >
        <i class="bi bi-file-earmark-excel"></i>
        <span class="d-none d-sm-inline">Import/Export</span>
      </button>
      <button
        class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
        @click="$emit('create')"
      >
        <i class="bi bi-plus-circle"></i>
        <span>Nouveau Produit</span>
      </button>
    </div>
  </div>
</template>
