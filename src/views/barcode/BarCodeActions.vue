<script setup>
import { Loader2, Layers } from "lucide-vue-next";

defineProps({
  isPrintingAll: Boolean,
  productsCount: Number,
});

defineEmits(["print-all"]);
</script>

<template>
  <div class="row mb-4 mt-3">
    <div class="col-md-6">
      <h1 class="h3 fw-bold">Générateur de Barcode & QR Code</h1>
    </div>
    <div class="col-md-6 text-end">
      <button
        @click="$emit('print-all')"
        :disabled="isPrintingAll || productsCount === 0"
        class="btn btn-dark d-inline-flex align-items-center gap-2 shadow-sm"
      >
        <Loader2 v-if="isPrintingAll" :size="18" class="spin" />
        <Layers v-else :size="18" />
        {{ isPrintingAll ? "Préparation..." : "Tout imprimer (Stock)" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.spin {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
