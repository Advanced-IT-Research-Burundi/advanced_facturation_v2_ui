import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../components/layout/MainLayout.vue";

import Dashboard from "../views/Dashboard.vue";
import Reports from "../views/Reports.vue";

const router = createRouter({
  history: createWebHistory("/"),
  routes: [
    {
      path: "/",
      component: MainLayout,
      redirect: "/dashboard",
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: Dashboard,
          // Dashboard accessible à tous les utilisateurs authentifiés
        },
        {
          path: "/importation",
          name: "importation",
          component: () => import("../views/importation/ImportationPage.vue"),
        },
        {
          path: "sales",
          name: "sales",
          component: () => import("../views/sales/Sales.vue"),
          meta: { permission: "sales" },
        },
        {
          path: "clients",
          name: "clients",
          component: () => import("../views/clients/Clients.vue"),
          meta: { permission: "clients" },
        },
        {
          path: "stock",
          name: "stock",
          component: () => import("../views/stocks/StockWelcomePage.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "/products/bon-de-commandes",
          name: "Bon-commande",
          component: () => import("../views/bon_commande/BonCommande.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "products/bar-code-generator",
          name: "barcode",
          component: () => import("../views/products/barcode/BarCodepage.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "stock/:id",
          name: "stock.detail",
          component: () => import("../views/stocks/StockDetail.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "stock/:id/movements",
          name: "stock.movements",
          component: () => import("../views/stocks/StockMouvement.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "stock-movements",
          name: "stock-movements",
          component: () => import("../views/stocks/StockMouvement.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "/warehouses/:id/bulk-entry",
          name: "WarehouseBulkEntry",
          component: () => import("@/views/warehouses/BulkEntry.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "/warehouses/:id/bulk-exit",
          name: "WarehouseBulkExit",
          component: () => import("@/views/warehouses/BulkExit.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "/warehouses/:id/create-transfer",
          name: "WarehouseCreateTransfer",
          component: () => import("@/views/warehouses/CreateTransfer.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "/warehouses/:id/pending-transfers",
          name: "WarehousePendingTransfers",
          component: () => import("@/views/warehouses/PendingTransfers.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "/warehouses/:id/history",
          name: "WarehouseHistory",
          component: () => import("@/views/warehouses/History.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "stock/:id/products",
          name: "stock.products",
          component: () => import("../views/stocks/StockProducts.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "bakery",
          name: "bakery",
          component: () => import("../views/BakeryManagement.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "/bakery/production",
          name: "BakeryProduction",
          component: () => import("../views/BakeryProduction.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "/bakery/production/record",
          name: "ProductionRecord",
          component: () => import("../views/bakery/ProductionRecord.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "/bakery/production/transfer",
          name: "ProductionTransfer",
          component: () => import("../views/bakery/ProductionTransfer.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "/bakery/production/history",
          name: "ProductionHistory",
          component: () => import("../views/bakery/ProductionHistory.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "/bakery/rapports",
          name: "BolangerieRapports",
          component: () => import("../views/bakery/BolangerieRapports.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "/bakery/production/report",
          name: "ProductionReport",
          component: () => import("../views/bakery/BolangerieRapports.vue"),
          meta: { permission: "bakery" },
        },
        {
          path: "products",
          name: "products",
          component: () => import("../views/products/ProductPage.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "products/categories",
          name: "products.categories",
          component: () => import("../views/products/ProductCategory.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "products/import-export",
          name: "products.import-export",
          component: () => import("../views/products/ImportExportProducts.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "fournisseurs",
          name: "fournisseurs",
          component: () => import("../views/fournisseurs/FournisseurPage.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "stock/create",
          name: "stock.create",
          component: () => import("../views/ProductsCreate.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "journal",
          name: "journal",
          component: () => import("../views/Journal.vue"),
          meta: { permission: "journal" },
        },
        {
          path: "obr-invoices",
          name: "obr-invoices",
          component: () => import("../views/ObrInvoices.vue"),
          meta: { permission: "obr-invoices" },
        },
        {
          path: "obr-mouvements",
          name: "obr-mouvements",
          component: () => import("../views/ObrStockMouvements.vue"),
          meta: { permission: "obr-mouvements" },
        },
        {
          path: "reports",
          name: "reports",
          component: Reports,
          meta: { permission: "reports" },
        },
        {
          path: "expenses",
          name: "expenses",
          component: () => import("../views/depenses/Expenses.vue"),
          meta: { permission: "expenses" },
        },
        {
          path: "expenses/categories",
          name: "expenses.categories",
          component: () => import("../views/depenses/DepenseCategory.vue"),
          meta: { permission: "expenses" },
        },
        {
          path: "company",
          name: "company",
          component: () => import("../views/companies/Company.vue"),
          meta: { permission: "company" },
        },
        {
          path: "users",
          name: "users",
          component: () => import("../views/Users.vue"),
          meta: { permission: "users" },
        },
        {
          path: "settings/unites",
          name: "settings.unites",
          component: () => import("../views/settings/Unites.vue"),
          meta: { permission: "settings" },
        },
        {
          path: "settings/stocks",
          name: "settings.stocks",
          component: () => import("../views/stocks/Stocks.vue"),
          meta: { permission: "stock" },
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("../views/Profile.vue"),
          // Profile accessible à tous les utilisateurs connectés
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("../views/settings/SettingPage.vue"),
          meta: { permission: "settings" },
        },
        {
          path: "settings/obr-invoices",
          name: "settings.obr-invoices",
          component: () => import("../views/settings/SettingPage.vue"),
          meta: { permission: "settings" },
        },
        {
          path: "settings/payment-methods",
          name: "settings.payment-methods",
          component: () => import("../views/settings/PaymentMethods.vue"),
          meta: { permission: "settings" },
        },
        {
          path: "settings/obr-logs",
          name: "settings.obr-logs",
          component: () => import("../views/settings/ObrLogs.vue"),
          meta: { permission: "settings" },
        },
        // Routes Pharmaceutiques
        {
          path: "pharmaceutical",
          name: "pharmaceutical",
          component: () =>
            import("../views/pharmaceutical/PharmaceuticalDashboard.vue"),
          meta: { permission: "pharmaceutical" },
        },
        {
          path: "pharmaceutical/products",
          name: "pharmaceutical.products",
          component: () =>
            import("../views/pharmaceutical/PharmaceuticalProducts.vue"),
          meta: { permission: "pharmaceutical" },
        },
        {
          path: "lots",
          name: "lots",
          component: () => import("../views/lots/LotsPage.vue"),
          meta: { permission: "pharmaceutical" },
        },
        {
          path: "prescriptions",
          name: "prescriptions",
          component: () =>
            import("../views/prescriptions/PrescriptionsPage.vue"),
          meta: { permission: "pharmaceutical" },
        },
        // Routes Gestion Financière
        {
          path: "cash-register",
          name: "cash-register",
          component: () => import("../views/finance/CashRegister.vue"),
          meta: { permission: "finance" },
        },
        {
          path: "bank-deposits",
          name: "bank-deposits",
          component: () => import("../views/finance/BankDeposits.vue"),
          meta: { permission: "finance" },
        },
        {
          path: "finance-stock-value",
          name: "finance-stock-value",
          component: () => import("@/views/finance/StockValue.vue"),
          meta: { permission: "finance" },
        },
        {
          path: "reminders",
          name: "reminders",
          component: () => import("../views/finance/Reminders.vue"),
          meta: { permission: "finance" },
        },
        {
          path: "currencies",
          name: "currencies",
          component: () => import("../views/finance/Currencies.vue"),
          meta: { permission: "finance" },
        },
        // Routes Hotel
        {
          path: "hotel",
          name: "hotel.rooms",
          component: () => import("../views/hotel/HotelRooms.vue"),
          meta: { permission: "hotel_rooms" },
        },
        {
          path: "hotel/reservations",
          name: "hotel.reservations",
          component: () => import("../views/hotel/HotelReservations.vue"),
          meta: { permission: "hotel_rooms" },
        },
        {
          path: "hotel/conference-rooms",
          name: "hotel.conference-rooms",
          component: () => import("../views/hotel/HotelConferenceRooms.vue"),
          meta: { permission: "hotel_rooms" },
        },
        {
          path: "hotel/reception-halls",
          name: "hotel.reception-halls",
          component: () => import("../views/hotel/HotelReceptionHalls.vue"),
          meta: { permission: "hotel_rooms" },
        },
        {
          path: "hotel/restaurant-bar",
          name: "hotel.restaurant-bar",
          component: () => import("../views/hotel/HotelRestaurantBar.vue"),
          meta: { permissions: ["hotel_bar", "hotel_bar_order"] },
        },
        {
          path: "hotel/kitchen",
          name: "hotel.kitchen",
          component: () => import("../views/hotel/HotelKitchen.vue"),
          meta: { permissions: ["hotel_bar", "hotel_bar_order"] },
        },
        {
          path: "hotel/invoices",
          name: "hotel.invoices",
          component: () => import("../views/hotel/HotelInvoicesList.vue"),
          meta: { permission: "hotel_rooms" },
        },
        {
          path: "hotel/invoice/:id",
          name: "hotel.invoice",
          component: () => import("../views/hotel/HotelInvoice.vue"),
          meta: { permission: "hotel_rooms" },
        },
        {
          path: "hotel/caisse",
          name: "hotel.caisse",
          component: () => import("../views/hotel/HotelCaisse.vue"),
          meta: { permissions: ["hotel_rooms", "hotel_bar"] },
        },
        {
          path: "hotel/caisse-globale",
          name: "hotel.caisse-globale",
          component: () => import("../views/hotel/HotelCaisseGlobale.vue"),
          meta: { permissions: ["hotel_rooms", "hotel_bar"] },
        },
        {
          path: "hotel/depenses",
          name: "hotel.depenses",
          component: () => import("../views/hotel/HotelDepenses.vue"),
          meta: { permissions: ["hotel_rooms", "hotel_bar"] },
        },
        {
          path: "hotel/rapports",
          name: "hotel.rapports",
          component: () => import("../views/hotel/HotelRapports.vue"),
          meta: { permission: "hotel_rooms" },
        },
        // Routes Restaurant
        {
          path: "restaurant",
          name: "restaurant.tables",
          component: () => import("../views/restaurant/RestaurantTables.vue"),
          meta: { permission: "restaurant" },
        },
        {
          path: "restaurant/orders",
          name: "restaurant.orders",
          component: () => import("../views/restaurant/RestaurantOrders.vue"),
          meta: { permission: "restaurant" },
        },
        {
          path: "restaurant/invoices",
          name: "restaurant.invoices",
          component: () => import("../views/restaurant/RestaurantInvoices.vue"),
          meta: { permission: "restaurant" },
        },
        {
          path: "restaurant/invoice/:id",
          name: "restaurant.invoice",
          component: () => import("../views/restaurant/RestaurantInvoice.vue"),
          meta: { permission: "restaurant" },
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
    },
    {
      path: "/register-company",
      name: "register-company",
      component: () => import("../views/RegisterCompany.vue"),
    },

    {
      path: "/unauthorized",
      name: "unauthorized",
      component: () => import("../views/Unauthorized.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFound.vue"),
    },
  ],
});

// Helper function to check permissions
const hasPermission = (user, requiredPermission) => {
  if (!user || !requiredPermission) return true;

  // Get all roles
  const roles = user.roles || [];

  // Check if user is admin
  const isAdmin = roles.some((r) =>
    ["admin", "super_admin"].includes(r.name?.toLowerCase()),
  );
  if (isAdmin) return true;

  // Check role names
  const roleNames = roles.map((r) => r.name?.toLowerCase());
  if (roleNames.includes(requiredPermission.toLowerCase())) return true;

  // Check permissions in roles
  for (const role of roles) {
    if (role.permissions && Array.isArray(role.permissions)) {
      if (role.permissions.includes(requiredPermission)) return true;
      if (role.permissions.includes(requiredPermission.toLowerCase()))
        return true;
    }
  }

  return false;
};

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem("token");
  const isAuthenticated = !!token;
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  // Public routes - always accessible
  const publicRoutes = ["login", "register-company", "unauthorized"];

  if (publicRoutes.includes(to.name)) {
    // If already authenticated and going to login, redirect to dashboard
    if (isAuthenticated && to.name === "login") {
      next({ name: "dashboard" });
      return;
    }
    next();
    return;
  }

  // Check authentication for protected routes
  if (!isAuthenticated) {
    next({ name: "login" });
    return;
  }

  // Dashboard and profile are always accessible to authenticated users
  const alwaysAccessible = ["dashboard", "profile"];
  if (alwaysAccessible.includes(to.name)) {
    next();
    return;
  }

  // Check permission if route has meta.permission (string) or meta.permissions (array, OR logic)
  const requiredPermission = to.meta?.permission;
  const requiredPermissions = to.meta?.permissions;

  if (requiredPermissions) {
    const allowed = requiredPermissions.some((p) => hasPermission(user, p));
    if (!allowed) {
      next({ name: "dashboard" });
      return;
    }
  } else if (requiredPermission && !hasPermission(user, requiredPermission)) {
    next({ name: "dashboard" });
    return;
  }

  next();
});

export default router;
