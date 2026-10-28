<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import ListPagination from './ListPagination.vue';

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + '01';

const loading = ref(false);
const error = ref('');
const customers = ref([]);
const totalRevenue = ref(0);
const search = ref('');
const filters = ref({ start_date: monthStart, end_date: today, limit: 50 });

const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
const formatCurrency = (num) => `${formatNumber(num)} FBU`;

const filteredCustomers = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return customers.value;
  return customers.value.filter(
    (c) =>
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.customer_phone || '').toLowerCase().includes(q),
  );
});

const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const resp = await api.get('/analytics/top-customers', { params: filters.value });
    if (resp.data.success) {
      customers.value = resp.data.data?.customers || [];
      totalRevenue.value = resp.data.data?.total_revenue || 0;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const perPage = 15;
const currentPage = ref(1);
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredCustomers.value.slice(start, start + perPage);
});

// Revenir à la première page quand la liste change (filtre, recherche, rechargement)
watch(filteredCustomers, () => {
  currentPage.value = 1;
});

onMounted(fetchData);
</script>

<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Top Clients</h1>
        <p class="text-muted mb-0">Classement des clients par chiffre d'affaires</p>
      </div>
      <router-link to="/dashboard" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i> Tableau de bord
      </router-link>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body row g-2 align-items-end">
        <div class="col-6 col-md-3">
          <label class="form-label small">Du</label>
          <input v-model="filters.start_date" type="date" class="form-control form-control-sm" />
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label small">Au</label>
          <input v-model="filters.end_date" type="date" class="form-control form-control-sm" />
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label small">Nombre</label>
          <select v-model.number="filters.limit" class="form-select form-select-sm">
            <option :value="10">10</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="col-6 col-md-2">
          <button class="btn btn-primary btn-sm w-100" @click="fetchData" :disabled="loading">Filtrer</button>
        </div>
        <div class="col-12 col-md-2 text-md-end small text-muted">
          CA total : <strong>{{ formatCurrency(totalRevenue) }}</strong>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <input v-model="search" type="text" class="form-control mb-3" placeholder="Rechercher par nom ou téléphone..." />
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Client</th>
                <th class="text-end">Factures</th>
                <th class="text-end">Panier moyen</th>
                <th class="text-end">TVA</th>
                <th class="text-end">CA Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredCustomers.length === 0">
                <td colspan="6" class="text-center text-muted py-3">Aucune donnée</td>
              </tr>
              <tr v-for="customer in paginatedItems" :key="customer.rank">
                <td><span class="badge bg-success rounded-pill">{{ customer.rank }}</span></td>
                <td>
                  <span class="fw-medium">{{ customer.customer_name }}</span>
                  <br /><small class="text-muted">{{ customer.customer_phone }}</small>
                </td>
                <td class="text-end">{{ customer.invoice_count }}</td>
                <td class="text-end">{{ formatCurrency(customer.average_basket) }}</td>
                <td class="text-end">{{ formatCurrency(customer.total_vat) }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(customer.total_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ListPagination v-if="!loading" v-model="currentPage" :total="filteredCustomers.length" :per-page="perPage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { border-radius: 12px; }
</style>
