<template>
    <div>

    <div class="d-flex flex-wrap gap-3 mb-3 border-bottom pb-2 small fw-bold">
      <span @click="goToCreate" class="cursor-pointer text-white bg-red-dark px-2 py-1 rounded shadow-sm">
        <i class="bi bi-box-arrow-in-right"></i> Entré
      </span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-arrow-counterclockwise"></i> Retour des marchandises</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-tag"></i> Category</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-file-earmark-text"></i> Fiche de Stock</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-clock-history"></i> Historique</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-activity"></i> Mouvement de stock</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-barcode"></i> Bar Code</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-cart"></i> Bon de Commande</span>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-red-dark text-white px-3 py-2 shadow-sm">
        Les entrés et les sorties
      </button>
    </div>
    </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goToCreate = () => {
  router.push({ name: "stock.create" });
};

</script>