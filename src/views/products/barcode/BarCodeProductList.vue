<script setup>
defineProps({
  products: Array,
  selectedProductId: Number,
});

defineEmits(["select-product"]);
</script>

<template>
  <div class="card border-0 shadow-sm h-100 overflow-hidden">
    <div
      class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center"
    >
      <h5 class="card-title mb-0 fw-bold d-flex align-items-center gap-2">
        <span class="p-1 bg-primary bg-opacity-10 rounded text-primary"
          >02</span
        >
        Liste des Produits (Stock)
      </h5>
      <div class="badge bg-light text-dark border">
        {{ products.length }} produits
      </div>
    </div>
    <div class="card-body p-0">
      <div class="table-responsive" style="max-height: 500px">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light sticky-top">
            <tr>
              <th class="ps-4">Designation</th>
              <th>Code</th>
              <th class="text-end pe-4">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in products"
              :key="product.id"
              :class="{
                'table-primary-subtle': selectedProductId === product.id,
              }"
            >
              <td class="ps-4">
                <div class="fw-bold">{{ product.item_designation }}</div>
                <small class="text-muted">{{
                  product.marque || "Standard"
                }}</small>
              </td>
              <td>
                <code class="text-primary">{{ product.item_code }}</code>
              </td>
              <td class="text-end pe-4">
                <button
                  @click="$emit('select-product', product)"
                  class="btn btn-sm btn-outline-primary rounded-pill px-3"
                >
                  Choisir
                </button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="3" class="text-center py-5">
                <div
                  class="spinner-border spinner-border-sm text-primary me-2"
                ></div>
                Chargement...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-primary-subtle {
  background-color: #e7f1ff !important;
}
</style>
