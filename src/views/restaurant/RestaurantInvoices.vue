<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Factures Restaurant</h4>
      <router-link :to="{ name: 'restaurant.tables' }" class="btn btn-outline-primary">
        <i class="bi bi-grid me-1"></i> Tables
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Statut paiement</label>
            <select v-model="filters.status" class="form-select" @change="loadInvoices">
              <option value="">Tous</option>
              <option value="paid">Payées</option>
              <option value="unpaid">Non payées</option>
              <option value="partial">Partielles</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Statut OBR</label>
            <select v-model="filters.obr_status" class="form-select" @change="loadInvoices">
              <option value="">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="ACCEPTED">Acceptées</option>
              <option value="REJECTED">Rejetées</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Date début</label>
            <input v-model="filters.start_date" type="date" class="form-control" @change="loadInvoices">
          </div>
          <div class="col-md-3">
            <label class="form-label">Date fin</label>
            <input v-model="filters.end_date" type="date" class="form-control" @change="loadInvoices">
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h6>Total Factures</h6>
            <h3>{{ stats.total || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <h6>Payées</h6>
            <h3>{{ stats.paid || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning">
          <div class="card-body">
            <h6>En attente OBR</h6>
            <h3>{{ stats.pending_obr || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h6>CA Total</h6>
            <h3>{{ formatCurrency(stats.total_amount) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border"></div>
        </div>
        <div v-else-if="invoices.length === 0" class="text-center py-5 text-muted">
          Aucune facture trouvée
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Table</th>
                <th>Serveur</th>
                <th class="text-end">Montant</th>
                <th class="text-center">Paiement</th>
                <th class="text-center">OBR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td>
                  <router-link :to="{ name: 'restaurant.invoice', params: { id: invoice.id } }">
                    {{ invoice.invoice_number }}
                  </router-link>
                </td>
                <td>{{ formatDate(invoice.invoice_date) }}</td>
                <td>{{ invoice.restaurant_table?.table_number || '-' }}</td>
                <td>{{ invoice.server?.name || '-' }}</td>
                <td class="text-end fw-bold">{{ formatCurrency(invoice.invoice_total_amount) }}</td>
                <td class="text-center">
                  <span class="badge" :class="getPaymentBadge(invoice.payment_status)">
                    {{ getPaymentLabel(invoice.payment_status) }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="getObrBadge(invoice.obr_submission_status)">
                    {{ invoice.obr_submission_status || 'PENDING' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <router-link
                      :to="{ name: 'restaurant.invoice', params: { id: invoice.id } }"
                      class="btn btn-outline-primary"
                    >
                      <i class="bi bi-eye"></i>
                    </router-link>
                    <button
                      v-if="invoice.obr_submission_status !== 'ACCEPTED'"
                      class="btn btn-outline-success"
                      @click="sendToObr(invoice)"
                      :disabled="sendingId === invoice.id"
                    >
                      <i class="bi bi-send"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="pagination.last_page > 1" class="mt-3">
          <ul class="pagination justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <a class="page-link" href="#" @click.prevent="goToPage(pagination.current_page - 1)">Précédent</a>
            </li>
            <li
              v-for="page in pagination.last_page"
              :key="page"
              class="page-item"
              :class="{ active: page === pagination.current_page }"
            >
              <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
              <a class="page-link" href="#" @click.prevent="goToPage(pagination.current_page + 1)">Suivant</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const toast = useToast();

const invoices = ref([]);
const loading = ref(false);
const sendingId = ref(null);
const stats = ref({});
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
});

const filters = reactive({
  status: '',
  obr_status: '',
  start_date: '',
  end_date: '',
});

onMounted(() => {
  loadInvoices();
  loadStats();
});

async function loadInvoices(page = 1) {
  loading.value = true;
  try {
    const params = { page, ...filters };
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key];
    });

    const { data } = await api.get('/restaurant/invoices', { params });
    invoices.value = data.data.data || data.data;
    pagination.value = {
      current_page: data.data.current_page || 1,
      last_page: data.data.last_page || 1,
      total: data.data.total || invoices.value.length,
    };
  } catch (error) {
    console.error('Erreur chargement factures:', error);
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/restaurant/dashboard');
    stats.value = {
      total: invoices.value.length,
      paid: invoices.value.filter(i => i.payment_status === 'paid').length,
      pending_obr: data.data.pending_obr || 0,
      total_amount: data.data.today_revenue || 0,
    };
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

async function sendToObr(invoice) {
  sendingId.value = invoice.id;
  try {
    const { data } = await api.post(`/restaurant/invoices/${invoice.id}/send-obr`);
    if (data.success) {
      invoice.obr_submission_status = 'ACCEPTED';
      toast.success('Facture envoyée à OBR');
    } else {
      toast.error(data.message || 'Erreur OBR');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
  } finally {
    sendingId.value = null;
  }
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.value.last_page) {
    loadInvoices(page);
  }
}

function getPaymentBadge(status) {
  const badges = { paid: 'bg-success', partial: 'bg-warning text-dark', unpaid: 'bg-danger' };
  return badges[status] || 'bg-secondary';
}

function getPaymentLabel(status) {
  const labels = { paid: 'Payée', partial: 'Partielle', unpaid: 'Non payée' };
  return labels[status] || status;
}

function getObrBadge(status) {
  const badges = { ACCEPTED: 'bg-success', REJECTED: 'bg-danger', PENDING: 'bg-warning text-dark' };
  return badges[status] || 'bg-secondary';
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-BI', { style: 'currency', currency: 'BIF' }).format(amount || 0);
}
</script>
