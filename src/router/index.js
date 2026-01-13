import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../components/layout/MainLayout.vue";

import Dashboard from "../views/Dashboard.vue";
import Stock from "../views/Stock.vue";
import Reports from "../views/Reports.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: MainLayout,
      redirect: "/dashboard", // Ajout d'une redirection par défaut
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: Dashboard,
        },
        {
          path: "sales",
          name: "sales",
          component: () => import("../views/Sales.vue"),
        },
        {
          path: "clients",
          name: "clients",
          component: () => import("../views/clients/Clients.vue"), // Votre vue dynamique
        },
        {
          path: "stock",
          name: "stock",
          component: Stock,
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
          component: () => import("../views/Expenses.vue"),
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
          path: "profile",
          name: "profile",
          component: () => import("../views/Profile.vue"),
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("../views/settings/SettingPage.vue"),
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
