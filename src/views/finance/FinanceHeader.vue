<script setup>
import { Bell, Boxes, Coins, Landmark, Wallet } from 'lucide-vue-next';

const links = [
  { name: 'Caisse', path: '/cash-register', icon: Wallet },
  { name: 'Versements banque', path: '/bank-deposits', icon: Landmark },
  { name: 'Valeur du stock', path: '/finance-stock-value', icon: Boxes },
  // { name: 'Relances', path: '/reminders', icon: Bell },
  // { name: 'Devises', path: '/currencies', icon: Coins },
];
</script>

<template>
  <div class="nav nav-pills flex-row flex-wrap gap-2 mb-4 finance-tabs">
    <router-link
      v-for="link in links"
      :key="link.path"
      :to="link.path"
      class="nav-link d-flex align-items-center justify-content-center gap-2 px-3 py-2 bg-white text-secondary border shadow-sm"
      active-class="active-nav-link"
    >
      <component :is="link.icon" :size="18" />
      <span class="fw-medium">{{ link.name }}</span>
    </router-link>
  </div>
</template>

<style scoped>
.finance-tabs .nav-link {
  border-radius: 6px;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
}

.finance-tabs .nav-link:hover {
  background-color: #f8f9fa !important;
  transform: translateY(-1px);
}

.active-nav-link {
  background-color: var(--bs-primary) !important;
  color: white !important;
  border-color: var(--bs-primary) !important;
}
</style>
