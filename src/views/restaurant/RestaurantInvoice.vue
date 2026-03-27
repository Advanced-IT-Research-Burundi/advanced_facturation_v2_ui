<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0">Facture Restaurant</h4>
        <small class="text-muted">{{ invoice?.invoice_number }}</small>
      </div>
      <router-link :to="{ name: 'restaurant.tables' }" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Retour
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border"></div>
    </div>

    <div v-else-if="invoice" class="row">
      <!-- Invoice Details -->
      <div class="col-lg-8">
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between">
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
                <p class="mb-1"><strong>Table:</strong> {{ invoice.restaurant_table?.table_number }}</p>
                <p class="mb-1"><strong>Serveur:</strong> {{ invoice.server?.name }}</p>
                <p class="mb-1"><strong>Date:</strong> {{ formatDate(invoice.invoice_date) }}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-1"><strong>Client:</strong> {{ invoice.customer_name || 'Client Restaurant' }}</p>
                <p class="mb-1" v-if="invoice.customer_TIN"><strong>NIF:</strong> {{ invoice.customer_TIN }}</p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th class="text-center">Qté</th>
                  <th class="text-end">P.U.</th>
                  <th class="text-end">TVA</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in invoice.invoice_items" :key="item.id">
                  <td>{{ item.item_designation }}</td>
                  <td class="text-center">{{ item.item_quantity }}</td>
                  <td class="text-end">{{ formatCurrency(item.item_price) }}</td>
                  <td class="text-end">{{ item.vat }}%</td>
                  <td class="text-end">{{ formatCurrency(item.item_total_amount) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-end"><strong>Sous-total HT:</strong></td>
                  <td class="text-end">{{ formatCurrency(invoice.invoice_amount_nvat) }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-end"><strong>TVA (18%):</strong></td>
                  <td class="text-end">{{ formatCurrency(invoice.invoice_vat_amount) }}</td>
                </tr>
                <tr class="table-primary">
                  <td colspan="4" class="text-end"><strong>Total TTC:</strong></td>
                  <td class="text-end fs-5 fw-bold">{{ formatCurrency(invoice.invoice_total_amount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- OBR Info -->
        <div class="card" v-if="invoice.obr_submission_status === 'ACCEPTED'">
          <div class="card-header bg-success text-white">
            <i class="bi bi-check-circle me-1"></i> Facture validée OBR
          </div>
          <div class="card-body">
            <p class="mb-1"><strong>Identifiant OBR:</strong> {{ invoice.obr_invoice_identifier }}</p>
            <p class="mb-1"><strong>N° Enregistrement:</strong> {{ invoice.obr_invoice_registered_number }}</p>
            <p class="mb-1"><strong>Date Envoi:</strong> {{ formatDate(invoice.obr_sent_at) }}</p>
            <p class="mb-0" v-if="invoice.obr_electronic_signature">
              <strong>Signature:</strong>
              <small class="text-muted">{{ invoice.obr_electronic_signature.substring(0, 50) }}...</small>
            </p>
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

      <!-- Actions -->
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">Actions</div>
          <div class="card-body">
            <!-- Payment -->
            <div v-if="invoice.payment_status !== 'paid'" class="mb-4">
              <h6>Paiement</h6>
              <div class="mb-2">
                <label class="form-label">Méthode</label>
                <select v-model="paymentMethod" class="form-select">
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>
              <div class="mb-2">
                <label class="form-label">Montant reçu</label>
                <input v-model.number="paymentAmount" type="number" class="form-control" :placeholder="invoice.invoice_total_amount">
              </div>
              <div v-if="paymentAmount > invoice.invoice_total_amount" class="alert alert-info py-2 mb-2">
                Rendu: {{ formatCurrency(paymentAmount - invoice.invoice_total_amount) }}
              </div>
              <button class="btn btn-success w-100" @click="processPayment" :disabled="processing">
                <i class="bi bi-cash me-1"></i>
                {{ processing ? 'Traitement...' : 'Encaisser' }}
              </button>
            </div>

            <div v-else class="mb-4">
              <div class="alert alert-success mb-0">
                <i class="bi bi-check-circle me-1"></i>
                Payé - {{ invoice.payment_method }}
              </div>
            </div>

            <!-- OBR -->
            <div class="mb-4">
              <h6>OBR EBMS</h6>
              <button
                v-if="invoice.obr_submission_status !== 'ACCEPTED'"
                class="btn btn-primary w-100"
                @click="sendToObr"
                :disabled="sendingObr"
              >
                <i class="bi bi-send me-1"></i>
                {{ sendingObr ? 'Envoi...' : 'Envoyer à OBR' }}
              </button>
              <button v-else class="btn btn-outline-success w-100" disabled>
                <i class="bi bi-check-circle me-1"></i> Validée OBR
              </button>
            </div>

            <!-- Print -->
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary w-100" @click="printA4(invoice)">
                <i class="bi bi-printer me-1"></i> A4
              </button>
              <button class="btn btn-outline-dark w-100" @click="printPOS(invoice)">
                <i class="bi bi-receipt me-1"></i> POS
              </button>
            </div>
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
import { useInvoicePrint } from '@/composables/useInvoicePrint';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const invoice = ref(null);
const loading = ref(true);
const processing = ref(false);
const sendingObr = ref(false);
const paymentMethod = ref('cash');
const paymentAmount = ref(0);
const { printA4, printPOS } = useInvoicePrint();

onMounted(async () => {
  await loadInvoice();
});

async function loadInvoice() {
  loading.value = true;
  try {
    const { data } = await api.get(`/restaurant/invoices/${route.params.id}`);
    invoice.value = data.data;
    paymentAmount.value = invoice.value.invoice_total_amount;
  } catch (error) {
    console.error('Erreur chargement facture:', error);
    toast.error('Facture non trouvée');
    router.push({ name: 'restaurant.tables' });
  } finally {
    loading.value = false;
  }
}

async function processPayment() {
  processing.value = true;
  try {
    const { data } = await api.post(`/restaurant/invoices/${invoice.value.id}/pay`, {
      payment_method: paymentMethod.value,
      amount: Math.min(paymentAmount.value, invoice.value.invoice_total_amount),
    });
    invoice.value = data.data;
    toast.success('Paiement enregistré avec succès');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors du paiement');
  } finally {
    processing.value = false;
  }
}

async function sendToObr() {
  sendingObr.value = true;
  try {
    const { data } = await api.post(`/restaurant/invoices/${invoice.value.id}/send-obr`);
    if (data.success) {
      invoice.value = data.data;
      toast.success('Facture envoyée à OBR avec succès');
    } else {
      toast.error(data.message || 'Erreur OBR');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi à OBR');
  } finally {
    sendingObr.value = false;
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
</script>
