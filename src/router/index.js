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
        },
        {
          path: "sales",
          name: "sales",
          component: () => import("../views/sales/Sales.vue"),
        },
        {
          path: "clients",
          name: "clients",
          component: () => import("../views/clients/Clients.vue"),
        },
        {
          path: "stock",
          name: "stock",
          component: () => import("../views/stocks/StockWelcomPage.vue"),
        },
        {
          path: "/products/bon-de-commandes",
          name: "Bon-commande",
          component: () => import("../views/bon_commande/BonCommande.vue"),
        },
        {
          path: "products/bar-code-generator",
          name: "barcode",
          component: () => import("../views/products/barcode/BarCodepage.vue"),
        },
        {
          path: "stock/:id",
          name: "stock.detail",
          component: () => import("../views/stocks/StockDetail.vue"),
        },
        {
          path: "stock/:id/movements",
          name: "stock.movements",
          component: () => import("../views/stocks/StockMouvement.vue"),
        },
        {
          path: "stock-movements",
          name: "stock-movements",
          component: () => import("../views/stocks/StockMouvement.vue"),
        },

        {
          path: 'stock/:id/products',
          name: "stock.products",
          component: () => import("../views/stocks/StockProducts.vue"),
        },
        {
          path: "bakery",
          name: "bakery",
          component: () => import("../views/BakeryManagemen.vue"),
        },
        {
          path: "products",
          name: "products",
          component: () => import("../views/products/ProductPage.vue"),
        },
        {
          path: "products/categories",
          name: "products.categories",
          component: () => import("../views/products/ProductCategory.vue"),
        },
        {
          path: "fournisseurs",
          name: "fournisseurs",
          component: () => import("../views/fournisseurs/FournisseurPage.vue"),
        },
        {
          path: "stock/create",
          name: "stock.create",
          component: () => import("../views/ProductsCreate.vue"),
        },
        {
          path: "journal",
          name: "journal",
          component: () => import("../views/Journal.vue"),
        },
        {
          path: "reports",
          name: "reports",
          component: Reports,
        },
        {
          path: "expenses",
          name: "expenses",
          component: () => import("../views/depenses/Expenses.vue"),
        },
        {
          path: "expenses/categories",
          name: "expenses.categories",
          component: () => import("../views/depenses/DepenseCategory.vue"),
        },
        {
          path: "company",
          name: "company",
          component: () => import("../views/companies/Company.vue"),
        },
        {
          path: "users",
          name: "users",
          component: () => import("../views/Users.vue"),
        },
        {
          path: "settings/unites",
          name: "settings.unites",
          component: () => import("../views/settings/Unites.vue"),
        },
        {
          path: "settings/stocks",
          name: "settings.stocks",
          component: () => import("../views/stocks/Stocks.vue"),
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("../views/Profile.vue"),
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("../views/settings/SettingPage.vue"),
        },
        // Routes Pharmaceutiques
        {
          path: "pharmaceutical",
          name: "pharmaceutical",
          component: () => import("../views/pharmaceutical/PharmaceuticalDashboard.vue"),
        },
        {
          path: "lots",
          name: "lots",
          component: () => import("../views/lots/LotsPage.vue"),
        },
        {
          path: "prescriptions",
          name: "prescriptions",
          component: () => import("../views/prescriptions/PrescriptionsPage.vue"),
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
  ],
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token");

  if (
    to.name !== "login" &&
    to.name !== "register-company" &&
    !isAuthenticated
  ) {
    next({ name: "login" });
  } else {
    next();
  }
});

export default router;
