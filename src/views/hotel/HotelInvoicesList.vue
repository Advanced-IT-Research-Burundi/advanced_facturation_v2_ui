<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Invoices" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-receipt me-2 text-primary"></i>Factures Hôtel
        </h5>
        <button class="btn btn-outline-secondary" @click="loadInvoices">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <!-- Filters -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-5">
              <select v-model="filterPayment" class="form-select form-select-sm" @change="loadInvoices">
                <option value="">Tous les statuts de paiement</option>
                <option value="unpaid">Non payées</option>
                <option value="partial">Paiement partiel</option>
                <option value="paid">Payées</option>
              </select>
            </div>
            <div class="col-md-3">
              <button class="btn btn-sm btn-outline-secondary w-100" @click="resetFilters">
                <i class="bi bi-x-circle me-1"></i>Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Table -->
      <div v-else class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>N° Facture</th>
                <th>Réservation</th>
                <th>Client</th>
                <th>Date</th>
                <th class="text-end">Montant</th>
                <th>Paiement</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td class="fw-semibold">{{ invoice.invoice_number }}</td>
                <td>
                  <span v-if="invoice.hotel_reservation">
                    <i class="bi bi-door-closed me-1 text-muted"></i>
                    Chambre {{ invoice.hotel_reservation?.room?.room_number }}
                    — {{ invoice.hotel_reservation?.guest_name }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>{{ invoice.customer_name || invoice.customer?.name || '—' }}</td>
                <td class="small text-muted">{{ formatDate(invoice.invoice_date) }}</td>
                <td class="text-end fw-semibold">{{ formatCurrency(invoice.invoice_total_amount) }}</td>
                <td>
                  <span class="badge" :class="getPaymentBadge(invoice.payment_status)">
                    {{ getPaymentLabel(invoice.payment_status) }}
                  </span>
                </td>
                <td>
                  <RouterLink
                    :to="{ name: 'hotel.invoice', params: { id: invoice.id } }"
                    class="btn btn-sm btn-outline-primary"
                  >
                    <i class="bi bi-eye"></i>
                  </RouterLink>
                </td>
              </tr>
              <tr v-if="invoices.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-receipt fs-1 d-block mb-2"></i>
                  Aucune facture trouvée
                </td>
              </tr>
            </tbody>
          </table>
        </div> <!-- /table-responsive -->

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">
            {{ pagination.from }}–{{ pagination.to }} sur {{ pagination.total }} factures
          </small>
          <div class="d-flex gap-1">
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="pagination.current_page === 1"
              @click="changePage(pagination.current_page - 1)"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              class="btn btn-sm"
              :class="page === pagination.current_page ? 'btn-primary' : 'btn-outline-secondary'"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="pagination.current_page === pagination.last_page"
              @click="changePage(pagination.current_page + 1)"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';

const loading = ref(false);
const invoices = ref([]);
const filterPayment = ref('');
const pagination = ref({
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
  total: 0,
});

const visiblePages = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const pages = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(last, current + 2); i++) {
    pages.push(i);
  }
  return pages;
});

const loadInvoices = async (page = pagination.value.current_page) => {
  loading.value = true;
  try {
    const params = { page };
    if (filterPayment.value) params.payment_status = filterPayment.value;

    const { data } = await api.get('/hotel/invoices', { params });
    invoices.value = data.data.data;
    pagination.value = {
      current_page: data.data.current_page,
      last_page: data.data.last_page,
      from: data.data.from ?? 0,
      to: data.data.to ?? 0,
      total: data.data.total,
    };
  } catch (e) {
    console.error('Erreur chargement factures hôtel:', e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  pagination.value.current_page = page;
  loadInvoices(page);
};

const resetFilters = () => {
  filterPayment.value = '';
  loadInvoices(1);
};

const getPaymentBadge = (status) => {
  const badges = { paid: 'bg-success', partial: 'bg-warning text-dark', unpaid: 'bg-danger' };
  return badges[status] || 'bg-secondary';
};

const getPaymentLabel = (status) => {
  const labels = { paid: 'Payée', partial: 'Partiel', unpaid: 'Non payée' };
  return labels[status] || status || '—';
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(amount || 0) + ' BIF';
};

onMounted(() => loadInvoices(1));
</script>
