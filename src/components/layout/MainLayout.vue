<script setup>
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  Pill,
  ChefHat,
  UtensilsCrossed,
  BedDouble,
  FileText,
  BarChart2,
  Wallet,
  Building,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-vue-next";
import { RouterLink, RouterView, useRouter, useRoute } from "vue-router";
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";

const store = useStore();
const router = useRouter();
const route = useRoute();

const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

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
  return user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";
});

// Company name
const fetchedCompany = ref(null);

const companyName = computed(() => {
  const user = store.state.auth.user;

  if (user?.company?.name) return user.company.name;
  if (user?.company_name) return user.company_name;
  if (fetchedCompany.value?.name) return fetchedCompany.value.name;

  return "Nom de l'entreprise";
});

const loadCompanyInfo = async () => {
  const user = store.state.auth.user;
  if (!user || !user.company_id) {
    return;
  }
  if (fetchedCompany.value && fetchedCompany.value.id === user.company_id) {
    return;
  }
  try {
    const result = await store.dispatch(
      "companies/fetchCompany",
      user.company_id,
    );
    if (result.success && result.data) {
      fetchedCompany.value = result.data;
      store.commit("auth/UPDATE_USER_COMPANY", result.data);
    }
  } catch (error) {
    console.error("Failed to fetch company info", error);
  }
};

onMounted(() => {
  loadCompanyInfo();
});

watch(
  () => store.state.auth.user?.company_id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchedCompany.value = null;
      loadCompanyInfo();
    }
  },
);

// Close sidebar on route change (mobile)
watch(
  () => route.path,
  () => {
    closeSidebar();
  },
);

const userName = computed(() => store.state.auth.user?.name || "Utilisateur");

const userRole = computed(() => {
  const roles = store.state.auth.user?.roles;
  if (!roles || roles.length === 0) return "Rôle inconnu";

  const priorityOrder = ["super_admin", "admin", "manager", "hotel_manager", "accountant", "cashier", "sales", "stock_manager", "hotel_bar_manager", "user"];
  const roleNames = roles.map((r) => r.name);
  const primary = priorityOrder.find((p) => roleNames.includes(p)) || roleNames[0];

  return primary.replace(/_/g, " ");
});

const currentUser = computed(() => store.state.auth.user);


const isAdmin = computed(() => {
  const roles = currentUser.value?.roles || [];
  return roles.some((r) =>
    ["admin", "super_admin"].includes(r.name?.toLowerCase())
  );
});

// Navigation items
// `domains` restricts visibility to specific company domains; absent = visible in all domains
const navItems = [
  { to: "/dashboard", icon: Home, label: "Accueil" },
  { to: "/sales", icon: ShoppingCart, label: "Vente", permission: "sales" },
  { to: "/clients", icon: Users, label: "Clients", permission: "clients" },
  { to: "/stock", icon: Package, label: "Stock", permission: "stock" },
  {
    to: "/pharmaceutical",
    icon: Pill,
    label: "Pharmacie",
    permission: "pharmaceutical",
    domains: ["pharmaceutical"],
  },
  {
    to: "/bakery/production",
    icon: ChefHat,
    label: "Boulangerie",
    permission: "bakery",
    domains: ["bakery"],
  },
  {
    to: "/restaurant",
    icon: UtensilsCrossed,
    label: "Restaurant",
    permission: "restaurant",
    domains: ["restaurant"],
  },
  {
    to: "/hotel",
    icon: BedDouble,
    label: "Hôtel",
    // Visible si l'utilisateur a hotel_rooms OU hotel_bar
    permissions: ["hotel_rooms", "hotel_bar"],
    domains: ["hotel"],
  },
  { to: "/journal", icon: FileText, label: "Journal", permission: "journal" },
  { 
    to: "/reports", 
    icon: BarChart2, 
    label: "Rapports", 
    permission: "reports",
    "domains":["hotel", "restaurant"] // Exclut les entreprises généralistes
  },
  { 
    to: "/bakery/rapports", 
    icon: BarChart2, 
    label: "Rapports", 
    permission: "reports",
    "domains":["bakery"] 
  },
  { to: "/expenses", icon: Wallet, label: "Dépenses", permission: "expenses" },
  { to: "/company", icon: Building, label: "Entreprise", permission: "company" },
  { to: "/users", icon: UserCog, label: "Utilisateurs", permission: "users" },
];

const companyDomain = computed(() => {
  return currentUser.value?.company?.domain || fetchedCompany.value?.domain || "general";
});

/** Vérifie si l'utilisateur possède une permission donnée dans l'un de ses rôles. */
const userHasPermission = (permission) => {
  if (isAdmin.value) return true;
  const roles = currentUser.value?.roles || [];
  for (const role of roles) {
    if (role.name?.toLowerCase() === permission.toLowerCase()) return true;
    if (role.permissions && Array.isArray(role.permissions)) {
      if (role.permissions.includes(permission)) return true;
    }
  }
  return false;
};

/**
 * Pour le nav item Hôtel, on pointe vers le premier onglet accessible :
 *   - hotel_rooms → /hotel (chambres)
 *   - hotel_bar uniquement → /hotel/restaurant-bar
 */
const hotelDefaultRoute = computed(() =>
  userHasPermission("hotel_rooms") ? "/hotel" : "/hotel/restaurant-bar",
);

const filteredNavItems = computed(() => {
  return navItems
    .map((item) => {
      // Route dynamique pour l'entrée Hôtel
      if (item.permissions?.includes("hotel_rooms")) {
        return { ...item, to: hotelDefaultRoute.value };
      }
      return item;
    })
    .filter((item) => {
      // Filtrer par domaine d'entreprise
      if (item.domains && !item.domains.includes(companyDomain.value)) {
        return false;
      }

      // Aucune permission requise → toujours visible
      if (!item.permission && !item.permissions) return true;

      // Admin voit tout
      if (isAdmin.value) return true;

      // Logique OR : visible si l'utilisateur a AU MOINS UNE des permissions
      if (item.permissions) {
        return item.permissions.some((perm) => userHasPermission(perm));
      }

      // Logique simple : une seule permission requise
      return userHasPermission(item.permission);
    });
});
</script>

<template>
  <div class="app-layout">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay d-md-none"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar bg-dark text-white" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="logo-section">
        <div class="logo-circle bg-primary">
          <span class="fw-bold fs-3">A</span>
        </div>
        <small class="logo-text">ADVANCED</small>
      </div>

      <ul
        class="nav nav-pills flex-column mb-auto py-2 px-1"
        :class="{ 'compact-nav': !isAdmin, 'gap-0': isAdmin }"
      >
        <li v-for="item in filteredNavItems" :key="item.to" class="nav-item">
          <RouterLink :to="item.to" class="nav-link" active-class="active">
            <component :is="item.icon" :size="22" class="nav-icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </aside>

    <!-- Main area -->
    <main class="main-content d-flex flex-column overflow-hidden">
      <!-- Top header -->
      <header class="app-header d-flex align-items-center justify-content-between border-bottom bg-white">
        <!-- Hamburger (mobile only) -->
        <button
          class="btn btn-light btn-sm d-md-none me-2 hamburger-btn"
          @click="toggleSidebar"
          aria-label="Menu"
        >
          <X v-if="sidebarOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>

        <h4 class="mb-0 fw-bold text-primary company-title text-truncate">{{ companyName }}</h4>

        <div class="d-flex align-items-center gap-2 ms-auto">
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

      <!-- Page content -->
      <div class="page-content bg-body">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ===== LAYOUT SHELL ===== */
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bs-body-bg);
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 110px;
  min-width: 110px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--bs-secondary);
  overflow: hidden;
  z-index: 1040;
  transition: transform 0.25s ease;
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
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.nav-pills::-webkit-scrollbar { display: none; }
.nav-pills.compact-nav {
  justify-content: flex-start !important;
  gap: 0.5rem;
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

/* ===== MAIN AREA ===== */
.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  padding: 0.65rem 1rem;
  flex-shrink: 0;
}

.company-title {
  font-size: clamp(0.9rem, 2.5vw, 1.25rem);
  max-width: 50%;
}

.page-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: clip; /* clip without creating a scroll context — allows children to scroll internally */
  padding: 0;
}

/* ===== HEADER AVATAR ===== */
.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  flex-shrink: 0;
}

.hamburger-btn {
  flex-shrink: 0;
  padding: 0.35rem 0.5rem;
}

/* ===== SCROLLBARS ===== */
.page-content::-webkit-scrollbar { width: 6px; }
.page-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

/* ===== MOBILE (< 768px) ===== */
@media (max-width: 767.98px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    width: 110px;
    min-width: 110px;
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1039;
  }
  .page-content {
    padding: 0.75rem;
  }
  .company-title {
    max-width: 45%;
    font-size: 0.9rem;
  }
}

/* ===== SMALL HEIGHT (landscape mobile) ===== */
@media (max-height: 600px) {
  .nav-link span { display: none; }
  .sidebar { width: 70px; min-width: 70px; }
}
</style>