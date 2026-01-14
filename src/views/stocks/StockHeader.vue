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
  { label: 'Fournisseurs', to: '/products/fournisseurs', icon: 'pi pi-user' },
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