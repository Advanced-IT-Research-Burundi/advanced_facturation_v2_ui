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
          path: '',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'invoices',
          name: 'invoices',
          component: Invoices
        },
        {
          path: 'stock',
          name: 'stock',
          component: Stock
        },
        {
          path: 'reports',
          name: 'reports',
          component: Reports
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
