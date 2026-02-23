<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0">Facture Hôtel</h4>
        <small class="text-muted">{{ invoice?.invoice_number }}</small>
      </div>
      <div class="d-flex gap-2">
        <router-link :to="{ name: 'hotel.reservations' }" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Retour aux réservations
        </router-link>
        <router-link :to="{ name: 'sales' }" class="btn btn-outline-primary">
          <i class="bi bi-receipt me-1"></i> Ventes / Paiements
        </router-link>
        <button class="btn btn-outline-secondary" @click="printInvoice">
          <i class="bi bi-printer me-1"></i> Imprimer
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border"></div>
    </div>

    <div v-else-if="invoice" class="row">
      <div class="col-lg-8">
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Détails de la facture</span>
            <div>
              <span class="badge me-2" :class="getPaymentBadge(invoice.payment_status)">
                {{ getPaymentLabel(invoice.payment_status) }}
              </span>
              <span class="badge" :class="getObrBadge(invoice.obr_submission_status)">
                OBR: {{ invoice.obr_submission_status || 'PENDING' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <p class="mb-1" v-if="invoice.hotel_reservation">
                  <strong>Réservation:</strong> Chambre {{ invoice.hotel_reservation?.room?.room_number }} —
                  {{ invoice.hotel_reservation?.guest_name }}
                </p>
                <p class="mb-1"><strong>Date:</strong> {{ formatDate(invoice.invoice_date) }}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-1"><strong>Client:</strong> {{ invoice.customer_name }}</p>
                <p class="mb-1" v-if="invoice.customer_TIN"><strong>NIF:</strong> {{ invoice.customer_TIN }}</p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th class="text-center">Qté</th>
                  <th class="text-end">P.U.</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in invoice.invoice_items" :key="item.id">
                  <td>{{ item.item_designation }}</td>
                  <td class="text-center">{{ item.item_quantity }}</td>
                  <td class="text-end">{{ formatCurrency(item.item_price) }}</td>
                  <td class="text-end">{{ formatCurrency(item.item_total_amount) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="table-primary">
                  <td colspan="3" class="text-end"><strong>Total TTC:</strong></td>
                  <td class="text-end fs-5 fw-bold">{{ formatCurrency(invoice.invoice_total_amount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="card" v-if="invoice.obr_submission_status === 'ACCEPTED'">
          <div class="card-header bg-success text-white">
            <i class="bi bi-check-circle me-1"></i> Facture validée OBR
          </div>
          <div class="card-body">
            <p class="mb-1"><strong>Identifiant OBR:</strong> {{ invoice.obr_invoice_identifier }}</p>
            <p class="mb-0"><strong>N° Enregistrement:</strong> {{ invoice.obr_invoice_registered_number }}</p>
          </div>
        </div>

        <div class="card" v-if="invoice.obr_submission_status === 'REJECTED'">
          <div class="card-header bg-danger text-white">
            <i class="bi bi-x-circle me-1"></i> Erreur OBR
          </div>
          <div class="card-body">
            <p class="text-danger mb-0">{{ invoice.obr_response_message }}</p>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">Paiement</div>
          <div class="card-body">
            <p class="mb-2">
              <strong>Total:</strong> {{ formatCurrency(invoice.invoice_total_amount) }}
            </p>
            <p class="mb-2">
              <strong>Payé:</strong> {{ formatCurrency(invoice.total_paid) }}
            </p>
            <p class="mb-0">
              <strong>Reste:</strong>
              <span :class="(invoice.invoice_total_amount - (invoice.total_paid || 0)) > 0 ? 'text-danger' : 'text-success'">
                {{ formatCurrency(Math.max(0, (invoice.invoice_total_amount || 0) - (invoice.total_paid || 0))) }}
              </span>
            </p>
            <hr />
            <p class="small text-muted mb-0">
              Pour enregistrer un paiement ou envoyer à l'OBR, utilisez le module <strong>Ventes</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();

const invoice = ref(null);
const loading = ref(true);

onMounted(async () => {
  await loadInvoice();
});

async function loadInvoice() {
  loading.value = true;
  try {
    const { data } = await api.get(`/hotel/invoices/${route.params.id}`);
    invoice.value = data.data;
  } catch (error) {
    console.error('Erreur chargement facture:', error);
    alert('Facture non trouvée');
    router.push({ name: 'hotel.reservations' });
  } finally {
    loading.value = false;
  }
}

function getPaymentBadge(status) {
  const badges = {
    paid: 'bg-success',
    partial: 'bg-warning text-dark',
    unpaid: 'bg-danger',
  };
  return badges[status] || 'bg-secondary';
}

function getPaymentLabel(status) {
  const labels = { paid: 'Payée', partial: 'Partiel', unpaid: 'Non payée' };
  return labels[status] || status;
}

function getObrBadge(status) {
  const badges = {
    ACCEPTED: 'bg-success',
    REJECTED: 'bg-danger',
    PENDING: 'bg-warning text-dark',
  };
  return badges[status] || 'bg-secondary';
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-BI', { style: 'currency', currency: 'BIF' }).format(amount || 0);
}

function printInvoice() {
  window.print();
}
</script>
