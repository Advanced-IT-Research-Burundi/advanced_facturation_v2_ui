<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import ListPagination from './ListPagination.vue';

const loading = ref(false);
const error = ref('');
const invoices = ref([]);
const search = ref('');
const statusFilter = ref('');
const limit = ref(50);

const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
const formatCurrency = (num) => `${formatNumber(num)} FBU`;

const statusLabels = { success: 'Payé', pending: 'En attente', failed: 'Échoué' };
const statusClasses = { success: 'bg-success', pending: 'bg-warning text-dark', failed: 'bg-danger' };

const filteredInvoices = computed(() => {
  const q = search.value.toLowerCase().trim();
  return invoices.value.filter((i) => {
    if (statusFilter.value && i.status !== statusFilter.value) return false;
    if (!q) return true;
    return (
      String(i.invoice_number || i.id).toLowerCase().includes(q) ||
      (i.customer_name || '').toLowerCase().includes(q)
    );
  });
});

const totalAmount = computed(() =>
  filteredInvoices.value.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
);

const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const resp = await api.get('/dashboard', { params: { limit: limit.value } });
    if (resp.data.success) {
      invoices.value = resp.data.data?.recent_invoices || [];
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
  return filteredInvoices.value.slice(start, start + perPage);
});

// Revenir à la première page quand la liste change (filtre, recherche, rechargement)
watch(filteredInvoices, () => {
  currentPage.value = 1;
});

onMounted(fetchData);
</script>

<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Factures Récentes</h1>
        <p class="text-muted mb-0">Dernières factures enregistrées</p>
      </div>
      <router-link to="/dashboard" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i> Tableau de bord
      </router-link>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-12 col-md-5">
            <input v-model="search" type="text" class="form-control" placeholder="Rechercher par n° ou client..." />
          </div>
          <div class="col-6 col-md-3">
            <select v-model="statusFilter" class="form-select">
              <option value="">Tous les statuts</option>
              <option value="success">Payé</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <select v-model.number="limit" class="form-select" @change="fetchData">
              <option :value="20">20 dernières</option>
              <option :value="50">50 dernières</option>
              <option :value="100">100 dernières</option>
              <option :value="200">200 dernières</option>
            </select>
          </div>
          <div class="col-12 col-md-2 text-md-end small text-muted">
            Total : <strong>{{ formatCurrency(totalAmount) }}</strong>
          </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Client</th>
                <th class="text-end">Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredInvoices.length === 0">
                <td colspan="5" class="text-center text-muted py-3">Aucune facture</td>
              </tr>
              <tr v-for="invoice in paginatedItems" :key="invoice.id">
                <td class="fw-medium text-primary">{{ invoice.invoice_number || `#${invoice.id}` }}</td>
                <td>{{ invoice.date }}</td>
                <td>{{ invoice.customer_name }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(invoice.amount) }}</td>
                <td>
                  <span :class="['badge', statusClasses[invoice.status] || 'bg-secondary']">
                    {{ statusLabels[invoice.status] || invoice.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ListPagination v-if="!loading" v-model="currentPage" :total="filteredInvoices.length" :per-page="perPage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { border-radius: 12px; }
</style>
