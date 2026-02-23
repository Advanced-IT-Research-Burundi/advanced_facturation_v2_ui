<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

defineEmits(["update:modelValue"]);

const hotelTabs = [
  { id: "Rooms", label: "Gestion des Chambres", route: "/hotel" },
  { id: "Reservations", label: "Réservations", route: "/hotel/reservations" },
  { id: "Invoices", label: "Factures", route: "/hotel/invoices" },
];
</script>

<template>
  <div class="bg-white border-bottom px-3 pt-1">
    <ul class="nav nav-tabs border-bottom-0">
      <li class="nav-item" v-for="tab in hotelTabs" :key="tab.id">
        <RouterLink
          :to="tab.route"
          class="nav-link text-dark"
          :class="{ active: modelValue === tab.id }"
        >
          {{ tab.label }}
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.nav-link.active {
  font-weight: 600;
  border-bottom: 2px solid var(--bs-primary) !important;
}
</style>