<script setup>
import {
  Package,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  ShoppingCart,
  ClipboardList,
  Wallet,
  Building,
  Home,
} from "lucide-vue-next";
import { RouterLink, RouterView } from "vue-router";
import { computed } from "vue";
import { useStore } from "vuex";

// Add the logout handler
const handleLogout = () => {
  // Clear user session and redirect to login
  localStorage.removeItem("token");
  window.location.href = "/login";
};

const store = useStore();

// Compute initials from the connected user's name
const userInitials = computed(() => {
  const user = store.state.auth.user;
  if (user && user.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return ""; // Default initials
});

const companyName = computed(() => {
  const company = store.state.auth.company;
  console.log(store.state.auth);
  if (company && company.name) {
    return company.name;
  }
  return "Nom de l'entreprise"; // Default company name
});
</script>

<template>
  <div class="d-flex vh-100 vw-100 overflow-hidden bg-light">
    <!-- Sidebar -->
    <aside
      class="d-flex flex-column flex-shrink-0 bg-dark text-white border-end border-secondary"
      style="
        width: 120px;
        transition: width 0.3s ease;
        overflow-y: auto;
        max-height: 100vh;
      "
    >
      <div
        class="d-flex flex-column align-items-center justify-content-center py-4 text-white text-decoration-none border-bottom border-secondary"
      >
        <div
          class="bg-primary rounded-3 d-flex align-items-center justify-content-center mb-2"
          style="width: 40px; height: 40px"
        >
          <span class="fw-bold fs-4">A</span>
        </div>
        <small class="fw-bold" style="font-size: 0.65rem">ADVANCED</small>
      </div>

      <ul class="nav nav-pills flex-column mb-auto py-3 gap-2 px-2">
        <li class="nav-item">
          <RouterLink
            to="/dashboard"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <Home :size="20" />
            <span class="small" style="font-size: 0.7rem">Accueil </span>
          </RouterLink>
          <RouterLink
            to="/sales"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <ShoppingCart :size="20" />
            <span class="small" style="font-size: 0.7rem">Vente</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/clients"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <Users :size="20" />
            <span class="small" style="font-size: 0.7rem">Clients</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/stock"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <Package :size="20" />
            <span class="small" style="font-size: 0.7rem">Stock</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/journal"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <ClipboardList :size="20" />
            <span class="small" style="font-size: 0.7rem">Journal</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/reports"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <BarChart2 :size="20" />
            <span class="small" style="font-size: 0.7rem">Rapports</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/expenses"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <Wallet :size="20" />
            <span class="small" style="font-size: 0.7rem">Dépenses</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/company"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <Building :size="20" />
            <span class="small" style="font-size: 0.7rem">Entr.</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/users"
            class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2"
            active-class="active bg-primary text-white"
          >
            <Users :size="20" />
            <span class="small" style="font-size: 0.7rem">Utilisateurs</span>
          </RouterLink>
        </li>
      </ul>

      <div
        class="dropdown border-top border-secondary py-3 d-flex justify-content-center"
      >
        <a
          href="#"
          class="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
          id="dropdownUser1"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          onclick="event.preventDefault();"
        >
          <div
            class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
            style="
              width: 40px;
              height: 40px;
              font-size: 1rem;
              font-weight: bold;
            "
          >
            {{ userInitials }}
          </div>
        </a>
        <ul
          class="dropdown-menu dropdown-menu-dark text-small shadow"
          aria-labelledby="dropdownUser1"
        >
          <li>
            <RouterLink to="/profile" class="dropdown-item">Profile</RouterLink>
          </li>
          <li>
            <RouterLink to="/settings" class="dropdown-item"
              >Paramètres</RouterLink
            >
          </li>
          <li><hr class="dropdown-divider" /></li>
          <li>
            <a href="#" class="dropdown-item" @click="handleLogout"
              >Déconnexion</a
            >
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Header -->
      <header
        class="d-flex align-items-center justify-content-between p-3 border-bottom bg-white"
      >
        <div>
          <h4 class="mb-0 fw-bold text-primary">
            {{ companyName || "Nom de l'entreprise" }}
          </h4>
        </div>

        <div class="d-flex align-items-center gap-3">
          <button
            class="btn btn-light position-relative rounded-circle p-2 d-flex align-items-center justify-content-center text-muted"
          >
            <Bell :size="20" />
            <span
              class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
            >
              <span class="visually-hidden">Nouvelles alertes</span>
            </span>
          </button>

          <div class="text-end d-none d-sm-block lh-1 text-muted">
            <small class="d-block fw-bold text-dark">Admin User</small>
            <span style="font-size: 0.75rem">Administrateur</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-grow-1 overflow-auto p-4 bg-body">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
aside {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.nav-link:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.1);
  color: white !important;
}

/* Custom Scrollbar for nicer feel */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
