<template>
  <div class="mb-4">
    <div class="nav nav-pills flex-row flex-wrap gap-2 header-nav">
      <router-link
        v-for="link in routeLinks"
        :key="link.name"
        :to="link.path"
        class="nav-link d-flex align-items-center justify-content-center gap-2 px-4 py-2 bg-white text-secondary border shadow-sm"
        active-class="active-nav-link"
      >
        <i :class="link.icon" class="fs-5"></i>
        <span class="fw-medium">{{ link.name }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const routeLinks = ref([
  {
    name: "Unités de mesure",
    path: "/settings/unites",
    icon: "bi bi-rulers",
  },
  {
    name: "Stocks",
    path: "/settings/stocks",
    icon: "bi bi-box-seam",
  },
  {
    name: "Configurations",
    path: "/settings",
    icon: "bi bi-sliders",
  },
  {
    name: "Méthodes de paiement",
    path: "/settings/payment-methods",
    icon: "bi bi-credit-card",
  },
  {
    name: "Journal OBR",
    path: "/settings/obr-logs",
    icon: "bi bi-file-earmark-text",
  },
]);
</script>

<style scoped>
.nav-link {
  transition: all 0.2s ease-in-out;
  border-radius: 50rem;
  white-space: nowrap;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}
.nav-link:hover {
  background-color: #f8f9fa !important;
  transform: translateY(-1px);
}
.active-nav-link {
  background-color: var(--bs-primary) !important;
  color: white !important;
  border-color: var(--bs-primary) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}
.active-nav-link:hover {
  background-color: var(--bs-primary) !important;
  color: white !important;
}
</style>
