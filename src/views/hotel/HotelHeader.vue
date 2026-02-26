<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useStore } from 'vuex';

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

defineEmits(['update:modelValue']);

const store = useStore();

const currentUser = computed(() => store.state.auth.user);

const isAdmin = computed(() => {
  const roles = currentUser.value?.roles || [];
  return roles.some((r) => ['admin', 'super_admin'].includes(r.name));
});

const userHasPermission = (permission) => {
  if (isAdmin.value) return true;
  const roles = currentUser.value?.roles || [];
  for (const role of roles) {
    if (role.permissions && Array.isArray(role.permissions)) {
      if (role.permissions.includes(permission)) return true;
    }
  }
  return false;
};

/**
 * hotel_rooms → Chambres (+ réservations intégrées), Salles de conf., Salle Réception, Factures
 * hotel_bar   → Restaurant-Bar, Cuisine
 */
const allTabs = [
  { id: 'Rooms',           label: 'Chambres',        route: '/hotel',                 icon: 'bi-door-closed',     permissions: ['hotel_rooms'] },
  { id: 'ConferenceRooms', label: 'Salles de Conf.',  route: '/hotel/conference-rooms', icon: 'bi-camera-video',   permissions: ['hotel_rooms'] },
  { id: 'ReceptionHalls',  label: 'Salle Réception',  route: '/hotel/reception-halls',  icon: 'bi-balloon-heart',  permissions: ['hotel_rooms'] },
  { id: 'RestaurantBar',   label: 'Restaurant-Bar',   route: '/hotel/restaurant-bar',  icon: 'bi-cup-straw',       permissions: ['hotel_bar', 'hotel_bar_order'] },
  { id: 'Kitchen',         label: 'Cuisine',          route: '/hotel/kitchen',         icon: 'bi-fire',            permissions: ['hotel_bar', 'hotel_bar_order'] },
  { id: 'Invoices',        label: 'Factures',         route: '/hotel/invoices',        icon: 'bi-receipt',         permissions: ['hotel_rooms'] },
];

const hotelTabs = computed(() =>
  allTabs.filter((tab) => tab.permissions.some((p) => userHasPermission(p))),
);
</script>

<template>
  <div class="tabs-wrapper bg-white border-bottom">
    <ul class="nav nav-tabs border-bottom-0 tabs-scroll">
      <li class="nav-item" v-for="tab in hotelTabs" :key="tab.id">
        <RouterLink
          :to="tab.route"
          class="nav-link text-dark d-flex align-items-center gap-1 tab-link"
          :class="{ active: modelValue === tab.id }"
        >
          <i :class="['bi', tab.icon, 'small']"></i>
          {{ tab.label }}
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tabs-wrapper {
  margin: 0;
}
.tabs-scroll {
  flex-wrap: nowrap !important;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 0.5rem;
}
.tabs-scroll::-webkit-scrollbar {
  display: none;
}
.tab-link {
  white-space: nowrap;
  font-size: clamp(0.72rem, 2vw, 0.875rem);
  padding: 0.5rem 0.55rem;
}
.nav-link.active {
  font-weight: 600;
  border-bottom: 2px solid var(--bs-primary) !important;
  color: var(--bs-primary) !important;
}
</style>
