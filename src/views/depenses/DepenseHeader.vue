<template>
  <div class="mb-4">
    <div class="nav nav-pills flex-row flex-wrap gap-2 header-nav">
      <router-link
        to="/expenses"
        class="nav-link d-flex align-items-center justify-content-center gap-2 px-4 py-2 bg-white text-secondary border shadow-sm"
        active-class="active-nav-link"
        :class="{ 'active-nav-link': $route.path === '/expenses' }"
      >
        <i class="bi bi-cash-stack fs-5"></i>
        <span class="fw-medium">Dépenses</span>
      </router-link>
      <router-link
        to="/expenses/categories"
        class="nav-link d-flex align-items-center justify-content-center gap-2 px-4 py-2 bg-white text-secondary border shadow-sm"
        active-class="active-nav-link"
      >
        <i class="bi bi-tags fs-5"></i>
        <span class="fw-medium">Catégories</span>
      </router-link>
    </div>
  </div>
</template>

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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}
.active-nav-link:hover {
  background-color: var(--bs-primary) !important;
  color: white !important;
}
</style>