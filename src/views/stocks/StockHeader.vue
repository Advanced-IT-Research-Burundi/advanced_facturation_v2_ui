<template>
  <div class="header-container bg-white shadow-sm border-bottom py-3 px-4">
    <div class="d-flex flex-wrap gap-2 align-items-center nav-scroll">
      <router-link
        v-for="route in routeListes"
        :key="route.label"
        :to="route.to"
        class="nav-link custom-link"
        active-class="active-link"
      >
        <i :class="[route.icon, 'me-2']"></i>
        <span>{{ route.label }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
const routeListes = [
  { label: 'Liste des stocks', to: '/stock', icon: 'pi pi-home' },
  { label: 'Produits', to: '/products', icon: 'pi pi-box' },
  { label: 'Categories des produits', to: '/products/categories', icon: 'pi pi-tags' },
  { label: 'Fournisseurs', to: '/fournisseurs', icon: 'pi pi-user' },
  { label: 'Bon de commandes', to: '/products/bon-de-commandes', icon: 'pi pi-file' },
  { label: 'Bar Code Generator', to: '/products/bar-code-generator', icon: 'pi pi-qrcode' },
];
</script>

<style scoped>
.header-container {
  overflow: hidden; /* Prevent outer scroll */
  background-color: #ffffff;
}

.nav-scroll {
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE 10+ */
    padding-bottom: 2px;
}
.nav-scroll::-webkit-scrollbar { 
    display: none;  /* Chrome/Safari */
}

.custom-link {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 50px; /* Pill shape */
  color: #64748b;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
  font-size: 0.9rem;
  white-space: nowrap;
}

.custom-link:hover {
  background-color: #fff1f1;
  color: #c51818;
}

.custom-link.active-link {
  background-color: #c51818;
  color: white;
  box-shadow: 0 4px 10px rgba(197, 24, 24, 0.2);
}

.custom-link i {
  font-size: 1.1em;
}

/* Ensure responsiveness on smaller screens */
@media (max-width: 768px) {
  .header-container {
    padding: 1rem !important;
  }
}
</style>
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