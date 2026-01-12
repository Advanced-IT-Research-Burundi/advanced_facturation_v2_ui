import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../components/layout/MainLayout.vue'

import Dashboard from '../views/Dashboard.vue'
import Invoices from '../views/Invoices.vue'
import Stock from '../views/Stock.vue'
import Reports from '../views/Reports.vue'
import Users from '../views/Users.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'sales',
          name: 'sales',
          component: () => import('../views/Sales.vue')
        },
        {
          path: 'clients',
          name: 'clients',
          component: () => import('../views/Clients.vue')
        },
        {
          path: 'stock',
          name: 'stock',
          component: Stock
        },
        {
          path: 'journal',
          name: 'journal',
          component: () => import('../views/Journal.vue')
        },
        {
          path: 'reports',
          name: 'reports',
          component: Reports
        },
        {
          path: 'expenses',
          name: 'expenses',
          component: () => import('../views/Expenses.vue')
        },
        {
          path: 'company',
          name: 'company',
          component: () => import('../views/Company.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: Users
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register-company',
      name: 'register-company',
      component: () => import('../views/RegisterCompany.vue')
    }
  ]
})

export default router
