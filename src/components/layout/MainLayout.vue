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
  Pill,
  FileText,
  Layers,
} from "lucide-vue-next";
import { RouterLink, RouterView } from "vue-router";
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

// Logout handler
const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

// Compute initials from the connected user's name
const userInitials = computed(() => {
  const user = store.state.auth.user;
  console.log("User initials", user);
  return user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";
});

// Company name
const companyName = computed(
  () => store.state.auth.company?.name || "Nom de l'entreprise",
);

const currentUser = computed(() => store.state.auth.user);

const userPermissions = computed(() => {
  if (!currentUser.value || !currentUser.value.roles) {
    return [];
  }

  const permissions = new Set();

  currentUser.value.roles.forEach((role) => {
    // Add role name as a permission (e.g. "sales" role -> "sales" permission)
    if (role.name) {
      permissions.add(role.name);
    }

    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((permission) => permissions.add(permission));
    }
  });

  return Array.from(permissions);
});

// Navigation items
const navItems = [
  {
    to: "/dashboard",
    icon: "pi-home",
    label: "Accueil",
    permission: "dashboard",
  },
  {
    to: "/sales",
    icon: "pi-shopping-cart",
    label: "Vente",
    permission: "sales",
  },
  { to: "/clients", icon: "pi-users", label: "Clients", permission: "clients" },
  { to: "/stock", icon: "pi-box", label: "Stock", permission: "stock" },
  {
    to: "/pharmaceutical",
    icon: "pi-heart",
    label: "Pharmacie",
    permission: "pharmaceutical",
  },
  {
    to: "/bakery/production",
    icon: "pi-sun",
    label: "Boulangerie",
    permission: "bakery",
  },
  { to: "/journal", icon: "pi-book", label: "Journal", permission: "journal" },
  {
    to: "/reports",
    icon: "pi-chart-bar",
    label: "Rapports",
    permission: "reports",
  },
  {
    to: "/expenses",
    icon: "pi-wallet",
    label: "Dépenses",
    permission: "expenses",
  },
  {
    to: "/company",
    icon: "pi-building",
    label: "Entreprise",
    permission: "company",
  },
  { to: "/users", icon: "pi-user", label: "Utilisateurs", permission: "users" },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) => {
    if (!item.permission) return true;

    // Admin bypass: if user has admin role, show all items
    const isAdmin = currentUser.value?.roles?.some((r) =>
      ["admin", "Admin", "super_admin"].includes(r.name),
    );
    if (isAdmin) return true;

    return userPermissions.value.includes(item.permission);
  });
});
</script>

<template>
  <div class="d-flex vh-100 vw-100 overflow-hidden bg-light">
    <aside class="sidebar bg-dark text-white">
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-circle bg-primary">
          <span class="fw-bold fs-3">A</span>
        </div>
        <small class="logo-text">ADVANCED</small>
      </div>

      <!-- Navigation -->
      <ul class="nav nav-pills flex-column mb-auto py-3 gap-1 px-2">
        <li v-for="item in filteredNavItems" :key="item.to" class="nav-item">
          <RouterLink :to="item.to" class="nav-link" active-class="active">
            <i :class="`pi ${item.icon}`"></i>
            <span class="fs-6">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- User Dropdown -->
      <div class="dropdown border-top border-secondary py-3 text-center">
        <a
          href="#"
          class="text-white text-decoration-none dropdown-toggle"
          id="dropdownUser"
          data-bs-toggle="dropdown"
          @click.prevent
        >
          <div class="user-avatar bg-primary">{{ userInitials }}</div>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark shadow">
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

    <main class="d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Header -->
      <header
        class="d-flex align-items-center justify-content-between p-3 border-bottom bg-white"
      >
        <h4 class="mb-0 fw-bold text-primary">{{ companyName }}</h4>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-light position-relative rounded-circle p-2">
            <i class="pi pi-bell"></i>
            <span
              class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
            ></span>
          </button>
          <div class="text-end d-none d-sm-block lh-1 text-muted">
            <small class="d-block fw-bold text-dark">Admin User</small>
            <span style="font-size: 0.75rem">Administrateur</span>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="flex-grow-1 overflow-auto p-4 bg-body">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.sidebar {
  width: 120px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--bs-secondary);
  overflow-y: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.sidebar::-webkit-scrollbar {
  display: none;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--bs-secondary);
}
.logo-circle {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.logo-text {
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-link i {
  font-size: 1.35rem;
}
.nav-link span {
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.1;
}
.nav-link:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
.nav-link.active {
  background: var(--bs-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
}

.overflow-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 85px;
  }
  .nav-link span {
    font-size: 0.7rem;
  }
}
</style>
