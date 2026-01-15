<script setup>
defineEmits(["create"]);
</script>

<template>
  <div class="row mb-4 mt-3">
    <div class="col-md-6">
      <h1 class="h3 fw-bold">Produits</h1>
    </div>
    <div class="col-md-6 text-end">
      <button
        class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
        @click="$emit('create')"
      >
        <i class="bi bi-plus-circle"></i> Nouveau Produit
      </button>
    </div>
  </div>
</template>
