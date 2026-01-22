<script setup>
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  Pill,
  ChefHat,
  FileText,
  BarChart2,
  Wallet,
  Building,
  UserCog,
  LogOut,
  Bell,
} from "lucide-vue-next";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";

const store = useStore();
const router = useRouter();

// Logout handler
const handleLogout = async () => {
  try {
    await store.dispatch("auth/logout");
  } finally {
    router.push("/login");
  }
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
const fetchedCompanyName = ref("");

// Company name
const companyName = computed(() => {
  const user = store.state.auth.user;

  if (user?.company?.name) return user.company.name;
  if (user?.company_name) return user.company_name;
  if (fetchedCompanyName.value) return fetchedCompanyName.value;

  return "Nom de l'entreprise";
});

const loadCompanyInfo = async () => {
  const user = store.state.auth.user;
  if (user && user.company_id && !user.company && !user.company_name) {
    try {
      const result = await store.dispatch(
        "companies/fetchCompany",
        user.company_id,
      );
      if (result.success && result.data) {
        fetchedCompanyName.value = result.data.name;
      }
    } catch (error) {
      console.error("Failed to fetch company info", error);
    }
  }
};

onMounted(() => {
  loadCompanyInfo();
});

// Watch for user changes (e.g. login/logout or refresh)
watch(
  () => store.state.auth.user,
  () => {
    loadCompanyInfo();
  },
);

const userName = computed(() => store.state.auth.user?.name || "Utilisateur");

const userRole = computed(() => {
  const roles = store.state.auth.user?.roles;
  if (roles && roles.length > 0) {
    return roles.map((r) => r.name).join(", ");
  }
  return "Rôle inconnu";
});

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
    icon: Home,
    label: "Accueil",
    permission: "dashboard",
  },
  {
    to: "/sales",
    icon: ShoppingCart,
    label: "Vente",
    permission: "sales",
  },
  { to: "/clients", icon: Users, label: "Clients", permission: "clients" },
  { to: "/stock", icon: Package, label: "Stock", permission: "stock" },
  {
    to: "/pharmaceutical",
    icon: Pill,
    label: "Pharmacie",
    permission: "pharmaceutical",
  },
  {
    to: "/bakery/production",
    icon: ChefHat,
    label: "Boulangerie",
    permission: "bakery",
  },
  { to: "/journal", icon: FileText, label: "Journal", permission: "journal" },
  {
    to: "/reports",
    icon: BarChart2,
    label: "Rapports",
    permission: "reports",
  },
  {
    to: "/expenses",
    icon: Wallet,
    label: "Dépenses",
    permission: "expenses",
  },
  {
    to: "/company",
    icon: Building,
    label: "Entreprise",
    permission: "company",
  },
  { to: "/users", icon: UserCog, label: "Utilisateurs", permission: "users" },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) => {
    if (!item.permission) return true;

    const roles = currentUser.value?.roles || [];

    // Admin bypass: if user has admin role, show all items
    const isAdmin = roles.some((r) =>
      ["admin", "Admin", "super_admin", "Super Admin"].includes(r.name),
    );
    if (isAdmin) return true;

    // Check role names (case insensitive)
    const roleNames = roles.map((r) => r.name?.toLowerCase());
    if (roleNames.includes(item.permission.toLowerCase())) return true;

    // Check permissions in roles
    for (const role of roles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        if (role.permissions.includes(item.permission)) return true;
        if (role.permissions.includes(item.permission.toLowerCase())) return true;
      }
    }

    return false;
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
      <ul class="nav nav-pills flex-column mb-auto py-2 gap-0 px-1">
        <li v-for="item in filteredNavItems" :key="item.to" class="nav-item">
          <RouterLink :to="item.to" class="nav-link" active-class="active">
            <component :is="item.icon" :size="22" class="nav-icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

    </aside>

    <main class="d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Header -->
      <header
        class="d-flex align-items-center justify-content-between p-3 border-bottom bg-white"
      >
        <h4 class="mb-0 fw-bold text-primary">{{ companyName }}</h4>
        <div class="d-flex align-items-center gap-3">
          <!-- Notifications -->
          <button class="btn btn-light position-relative rounded-circle p-2">
            <Bell :size="18" />
            <span
              class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
            ></span>
          </button>
          
          <!-- User Profile Dropdown -->
          <div class="dropdown">
            <a
              href="#"
              class="d-flex align-items-center gap-2 text-decoration-none dropdown-toggle"
              id="dropdownUserHeader"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click.prevent
            >
              <div class="text-end d-none d-sm-block lh-1">
                <small class="d-block fw-bold text-dark">{{ userName }}</small>
                <span class="text-muted" style="font-size: 0.75rem">{{ userRole }}</span>
              </div>
              <div class="header-avatar bg-primary text-white">{{ userInitials }}</div>
            </a>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="dropdownUserHeader">
              <li class="px-3 py-2 border-bottom">
                <div class="fw-bold">{{ userName }}</div>
                <small class="text-muted">{{ userRole }}</small>
              </li>
              <li>
                <RouterLink to="/profile" class="dropdown-item py-2">
                  <UserCog :size="16" class="me-2" />
                  Mon Profil
                </RouterLink>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a href="#" class="dropdown-item py-2 text-danger" @click.prevent="handleLogout">
                  <LogOut :size="16" class="me-2" />
                  Déconnexion
                </a>
              </li>
            </ul>
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
  width: 110px;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--bs-secondary);
  overflow: hidden;
  flex-shrink: 0;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(0.5rem, 1.5vh, 1.25rem) 0;
  border-bottom: 1px solid var(--bs-secondary);
  flex-shrink: 0;
}
.logo-circle {
  width: clamp(32px, 5vh, 44px);
  height: clamp(32px, 5vh, 44px);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}
.logo-circle span {
  font-size: clamp(0.9rem, 2vh, 1.5rem) !important;
}
.logo-text {
  font-size: clamp(0.55rem, 1vh, 0.75rem);
  font-weight: bold;
  letter-spacing: 1px;
}

.nav-pills {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  overflow: hidden;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.15rem, 0.5vh, 0.35rem);
  padding: clamp(0.35rem, 1vh, 0.7rem) 0.25rem;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-link .nav-icon {
  width: clamp(20px, 3vh, 24px);
  height: clamp(20px, 3vh, 24px);
  flex-shrink: 0;
}
.nav-link span {
  font-size: clamp(0.6rem, 1.1vh, 0.75rem);
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
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.3);
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
}

.dropdown-toggle::after {
  margin-left: 0.5rem;
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
    width: 80px;
    min-width: 80px;
  }
}

@media (max-height: 600px) {
  .nav-link span {
    display: none;
  }
  .sidebar {
    width: 70px;
    min-width: 70px;
  }
}
</style>
