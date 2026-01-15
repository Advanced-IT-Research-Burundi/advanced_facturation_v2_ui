<script setup>
import { Package, Download } from "lucide-vue-next";

defineProps({
  selectedProduct: Object,
  previewBlobUrl: String,
  codeType: String,
});

defineEmits(["download"]);
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-header bg-white border-bottom py-3">
      <h5 class="card-title mb-0 fw-bold d-flex align-items-center gap-2">
        <span class="p-1 bg-primary bg-opacity-10 rounded text-primary"
          >01</span
        >
        Aperçu de l'étiquette
      </h5>
    </div>
    <div
      class="card-body text-center py-5 d-flex align-items-center justify-content-center"
    >
      <div
        v-if="selectedProduct && previewBlobUrl"
        class="preview-container w-100"
      >
        <div
          class="label-wrapper d-inline-block bg-white border p-4 rounded shadow-sm"
        >
          <h5
            class="fw-bold mb-3 text-uppercase ls-1 text-truncate"
            style="max-width: 300px"
          >
            {{ selectedProduct.item_designation }}
          </h5>

          <div
            class="code-preview-box mb-3 d-flex justify-content-center bg-light p-3 rounded"
          >
            <img
              :src="previewBlobUrl"
              alt="Code Preview"
              :class="codeType === 'barcode' ? 'barcode-img' : 'qrcode-img'"
            />
          </div>

          <div class="font-monospace fs-4 fw-bold tracking-widest text-dark">
            {{ selectedProduct.barcode || selectedProduct.item_code }}
          </div>
        </div>
        <div class="mt-3">
          <button
            @click="$emit('download')"
            class="btn btn-sm btn-outline-dark gap-2 d-inline-flex"
          >
            <Download :size="14" /> Télécharger
          </button>
        </div>
      </div>

      <div v-else class="py-5 text-muted text-center">
        <div class="mb-4 opacity-10">
          <Package :size="100" />
        </div>
        <h5>Prêt pour la génération</h5>
        <p class="small">
          Sélectionnez un produit pour voir l'aperçu ou imprimez tout le stock.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label-wrapper {
  min-width: 320px;
  border: 1px solid #dee2e6;
}
.barcode-img {
  height: 100px;
  width: 100%;
  object-fit: contain;
}
.qrcode-img {
  width: 150px;
  height: 150px;
  object-fit: contain;
}
.ls-1 {
  letter-spacing: 1px;
}
.tracking-widest {
  letter-spacing: 0.3rem;
}
.font-monospace {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
