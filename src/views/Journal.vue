<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Printer } from 'lucide-vue-next';
import { useStore } from 'vuex';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const store = useStore();

// State
const invoices = ref(store.state.data.journalInvoices || []);
const loading = ref(false);
const error = ref(null);

// Dates - par défaut vide pour afficher tout
const startDate = ref('');
const endDate = ref('');

// Summary statistics
const summary = computed(() => {
  const list = invoices.value || [];
  return {
    total_invoices: list.length,
    total_amount_tvac: list.reduce((sum, inv) => sum + (parseFloat(inv.invoice_total_amount) || 0), 0),
    total_tva: list.reduce((sum, inv) => sum + (parseFloat(inv.invoice_vat_amount) || 0), 0),
    total_htva: list.reduce((sum, inv) => sum + (parseFloat(inv.invoice_amount_nvat) || 0), 0),
  };
});

// Payment types mapping (comme dans la démo)
const TYPE_PAYMENT = {
  '1': 'Espèces',
  '2': 'Banque',
  '3': 'Crédit',
  '4': 'Mobile Money',
  'cash': 'Espèces',
  'bank': 'Banque',
  'credit': 'Crédit',
  'mobile': 'Mobile Money',
};

// Invoice type labels
const INVOICE_TYPES = {
  'FN': 'Facture Normale',
  'FA': 'Facture Avoir',
  'FC': 'Facture à Crédit',
  'FP': 'Proforma',
  'RC': 'Reçu de Caisse',
};

// Fetch invoices - EXACTEMENT comme InvoicesList
const fetchInvoices = async () => {
  loading.value = true;
  error.value = null;
  console.log('Journal: Fetching invoices...');
  try {
    const params = {};
    
    // Filtres de date optionnels
    if (startDate.value) {
      params.start_date = startDate.value;
    }
    if (endDate.value) {
      params.end_date = endDate.value;
    }

    const response = await api.get('/invoices', { params });
    console.log('Journal: API Response:', response.data);
    
    if (response.data.success) {
      // Exactement comme InvoicesList
      invoices.value = response.data.data.data || response.data.data;
      store.state.data.journalInvoices = invoices.value;
      console.log('Journal: Invoices loaded:', invoices.value.length, 'factures');
    } else {
      console.log('Journal: API returned success=false');
    }
  } catch (err) {
    console.error('Journal: Error fetching invoices:', err);
    error.value = 'Erreur lors du chargement du journal des factures';
  } finally {
    loading.value = false;
  }
};

// Helpers
const formatPrice = (amount) => {
  if (!amount && amount !== 0) return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPaymentTypeLabel = (type) => {
  return TYPE_PAYMENT[type] || type || 'Espèces';
};

const getInvoiceTypeLabel = (type) => {
  return INVOICE_TYPES[type] || type || '';
};

// Print page
const printPage = () => {
  window.print();
};

// Print single invoice
const printInvoice = async (invoice) => {
  try {
    const response = await api.get(`/invoices/${invoice.id}`);
    if (response.data.success) {
      const fullInvoice = response.data.data;
      const printContent = generatePrintContent(fullInvoice);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (err) {
    console.error('Error fetching invoice for print:', err);
    toast.error('Erreur lors de la récupération de la facture');
  }
};

const generatePrintContent = (invoice) => {
  const itemsRows = invoice.invoiceItems?.map(item => `
    <tr>
      <td>${item.item_designation || item.product?.name || 'Produit'}</td>
      <td style="text-align: center;">${item.item_quantity}</td>
      <td style="text-align: right;">${formatPrice(item.item_price)} FBU</td>
      <td style="text-align: right;">${formatPrice(item.item_total_amount)} FBU</td>
    </tr>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facture ${invoice.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .company-name { font-size: 18px; font-weight: bold; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-block { width: 48%; }
        .info-block h4 { background: #f0f0f0; padding: 5px; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #333; color: white; }
        .totals { margin-top: 20px; }
        .totals table { width: 300px; margin-left: auto; }
        .totals td { border: none; padding: 5px; }
        .total-row { font-weight: bold; font-size: 14px; background: #f0f0f0; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${invoice.tp_name || 'Entreprise'}</div>
        <div>NIF: ${invoice.tp_TIN || ''}</div>
        <div>Tél: ${invoice.tp_phone_number || ''}</div>
      </div>
      <h2 style="text-align: center; margin-bottom: 20px;">FACTURE N° ${invoice.invoice_number}</h2>
      <div class="invoice-info">
        <div class="info-block">
          <h4>Client</h4>
          <p><strong>Nom:</strong> ${invoice.customer?.customer_name || invoice.customer_name || 'Client Anonyme'}</p>
          <p><strong>NIF:</strong> ${invoice.customer?.customer_TIN || invoice.customer_TIN || '-'}</p>
        </div>
        <div class="info-block">
          <h4>Facture</h4>
          <p><strong>Date:</strong> ${new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('fr-FR')}</p>
          <p><strong>Vendeur:</strong> ${invoice.user?.name || 'Inconnu'}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Désignation</th><th style="text-align:center;">Qté</th><th style="text-align:right;">Prix Unit.</th><th style="text-align:right;">Total</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="totals">
        <table>
          <tr><td>Total HTVA:</td><td style="text-align:right;">${formatPrice(invoice.invoice_amount_nvat)} FBU</td></tr>
          <tr><td>TVA:</td><td style="text-align:right;">${formatPrice(invoice.invoice_vat_amount)} FBU</td></tr>
          <tr class="total-row"><td>Total TVAC:</td><td style="text-align:right;">${formatPrice(invoice.invoice_total_amount)} FBU</td></tr>
        </table>
      </div>
      ${invoice.obr_electronic_signature ? `<div style="margin-top:20px;font-size:10px;"><strong>Signature:</strong> ${invoice.obr_electronic_signature}</div>` : ''}
      <div class="footer"><p>Merci pour votre confiance!</p></div>
    </body>
    </html>
  `;
};

// Init
onMounted(() => {
  fetchInvoices();
});
</script>

<template>
  <div class="container-fluid py-3">
    <!-- Header Navigation -->
    <div class="d-flex justify-content-end align-items-center mb-2 noprint">
      <button class="btn btn-info btn-sm" @click="printPage">
        <Printer :size="14" class="me-1" />
        Imprimer
      </button>
    </div>

    <h5 class="text-center mb-4">Historique des ventes</h5>

    <!-- Filters and Stats Row - comme dans la démo -->
    <div class="row mb-4">
      <!-- Date Filters -->
      <div class="col-md-4">
        <form @submit.prevent="fetchInvoices">
          <div class="row">
            <div class="col-6">
              <label class="small">DU</label>
              <input 
                type="date" 
                class="form-control form-control-sm" 
                v-model="startDate"
              >
            </div>
            <div class="col-6">
              <label class="small">AU</label>
              <input 
                type="date" 
                class="form-control form-control-sm" 
                v-model="endDate"
              >
            </div>
            <div class="col-6 mt-2 noprint">
              <button type="submit" class="btn btn-info btn-sm">
                Ok
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Stats Table 1 -->
      <div class="col-md-4">
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr>
              <th>DATE</th>
              <td>{{ startDate || 'Tout' }} - {{ endDate || 'Tout' }}</td>
            </tr>
            <tr>
              <th>NOMBRE TOTAL DE FACTURE</th>
              <td class="fw-bold">{{ formatPrice(summary.total_invoices) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stats Table 2 -->
      <div class="col-md-4">
        <table class="table table-sm table-striped mb-0">
          <tbody>
            <tr>
              <th>MONTANT TOTAL DES FACTURE TVAC</th>
              <td class="text-nowrap fw-bold">{{ formatPrice(summary.total_amount_tvac) }}</td>
            </tr>
            <tr>
              <th>NOMBRE TOTAL POUR TVA</th>
              <td class="text-nowrap">{{ formatPrice(summary.total_tva) }}</td>
            </tr>
            <tr>
              <th>NOMBRE TOTAL POUR HTVA</th>
              <td class="text-nowrap">{{ formatPrice(summary.total_htva) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger alert-dismissible mb-3">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>

    <!-- Main Table - exactement comme la démo -->
    <table class="table table-sm">
      <thead class="table-dark">
        <tr>
          <th scope="col">#</th>
          <th scope="col">PRODUITS</th>
          <th scope="col">MONTANT</th>
          <th scope="col" class="noprint">MODE DE PAIEMENT</th>
          <th scope="col" class="noprint">TYPE DE FACTURE</th>
          <th scope="col">TVA</th>
          <th scope="col" class="noprint">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="invoices.length === 0">
          <td colspan="7" class="text-center py-4 text-muted">
            Aucune facture trouvée
          </td>
        </tr>
        <tr v-for="invoice in invoices" :key="invoice.id">
          <th scope="row">{{ invoice.id }}</th>
          
          <!-- PRODUITS - comme dans la démo -->
          <td>
            <ul class="list-unstyled mb-0">
              <li v-for="(item, idx) in (invoice.invoice_items || invoice.invoiceItems || [])" :key="idx">
                {{ item.item_designation || item.product?.name }} | Qte : {{ item.item_quantity }} | PRIX : {{ formatPrice(item.item_price) }}
              </li>
              <li v-if="!(invoice.invoice_items || invoice.invoiceItems || []).length" class="text-muted">
                (Voir détails)
              </li>
              <li class="text-center border-top mt-2 pt-2">
                {{ formatDate(invoice.invoice_date || invoice.created_at) }}
              </li>
              <li>
                Client : <b>{{ invoice.customer?.customer_name || invoice.customer_name || 'Client Anonyme' }}</b> &nbsp;&nbsp;&nbsp; 
                Vendu par : <b>{{ invoice.user?.name || 'Inconnu' }}</b>
              </li>
            </ul>
          </td>

          <!-- MONTANT -->
          <td class="text-nowrap">{{ formatPrice(invoice.invoice_total_amount) }}</td>

          <!-- MODE DE PAIEMENT -->
          <td class="noprint">{{ getPaymentTypeLabel(invoice.payment_type) }}</td>

          <!-- TYPE DE FACTURE -->
          <td class="noprint">{{ getInvoiceTypeLabel(invoice.invoice_type) }}</td>

          <!-- TVA -->
          <td class="text-nowrap">{{ formatPrice(invoice.invoice_vat_amount) }}</td>

          <!-- Action -->
          <td class="noprint">
            <button 
              class="btn btn-sm btn-success" 
              @click="printInvoice(invoice)"
              title="Imprimer"
            >
              <Printer :size="14" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Style d'impression - cacher les éléments noprint */
@media print {
  .noprint {
    display: none !important;
  }
  
  .container-fluid {
    padding: 0 !important;
  }
  
  .table {
    font-size: 11px;
  }
}

/* Style pour les liens comme dans la démo */
a {
  color: #333;
}

a:hover {
  color: #007bff;
}

.table th {
  white-space: nowrap;
}
</style>
