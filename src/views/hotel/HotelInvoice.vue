<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Invoices" />

    <div class="px-3 pb-4 mt-3">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="invoice">
        <!-- Action bar -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <RouterLink :to="{ name: 'hotel.invoices' }" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-left me-1"></i> Retour aux factures
          </RouterLink>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm" @click="printA4(invoice)">
              <i class="bi bi-printer me-1"></i> A4
            </button>
            <button class="btn btn-outline-primary btn-sm" @click="printPOS(invoice)">
              <i class="bi bi-receipt me-1"></i> POS
            </button>
          </div>
        </div>

        <!-- Invoice preview (same layout as sales InvoicePrintModal) -->
        <div class="bg-light p-3 rounded">
          <div class="invoice-print bg-white p-4 rounded">
            <div class="invoice-container">

              <!-- Header -->
              <div class="inv-header">
                <div class="company-info">
                  <h1>{{ invoice.tp_name || 'Entreprise' }}</h1>
                  <p>NIF: {{ invoice.tp_TIN || 'N/A' }}</p>
                  <p>RC: {{ invoice.tp_trade_number || 'N/A' }}</p>
                  <p>Tel: {{ invoice.tp_phone_number || 'N/A' }}</p>
                  <p>Centre Fiscal: {{ invoice.tp_fiscal_center || 'DMC' }}</p>
                </div>
                <div class="invoice-info">
                  <h2>Facture Normale</h2>
                  <p class="invoice-number">N°: {{ invoice.invoice_number }}</p>
                  <p>Date: {{ formatDate(invoice.invoice_date || invoice.created_at) }}</p>
                  <p>Devise: {{ invoice.invoice_currency || 'BIF' }}</p>
                </div>
              </div>

              <!-- Parties -->
              <div class="parties">
                <div class="party">
                  <h3>VENDEUR</h3>
                  <p><strong>{{ invoice.tp_name }}</strong></p>
                  <p>NIF: {{ invoice.tp_TIN }}</p>
                  <p>Assujetti TVA: {{ invoice.vat_taxpayer === '1' ? 'Oui' : 'Non' }}</p>
                </div>
                <div class="party">
                  <h3>CLIENT</h3>
                  <p><strong>{{ invoice.customer_name || invoice.customer?.customer_name }}</strong></p>
                  <p>NIF: {{ invoice.customer_TIN || invoice.customer?.customer_TIN || 'N/A' }}</p>
                  <p>Adresse: {{ invoice.customer_address || invoice.customer?.customer_address || 'N/A' }}</p>
                </div>
              </div>

              <!-- Items Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width:40px">#</th>
                    <th>Désignation</th>
                    <th class="text-center" style="width:60px">Qté</th>
                    <th class="text-right" style="width:110px">P.U. HT</th>
                    <th class="text-center" style="width:65px">TVA %</th>
                    <th class="text-right" style="width:100px">TVA</th>
                    <th class="text-right" style="width:120px">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in invoice.invoice_items" :key="item.id">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td>{{ item.item_designation }}</td>
                    <td class="text-center">{{ item.item_quantity }}</td>
                    <td class="text-right">{{ formatPrice(item.item_price) }}</td>
                    <td class="text-center">{{ item.vat || 0 }}%</td>
                    <td class="text-right">{{ formatPrice(item.item_price * item.item_quantity * (item.vat || 0) / 100) }}</td>
                    <td class="text-right">{{ formatPrice(item.item_total_amount) }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals -->
              <div class="totals">
                <table>
                  <tr>
                    <th>Total HT</th>
                    <td class="text-right">{{ formatPrice(invoice.invoice_amount_nvat) }} {{ invoice.invoice_currency }}</td>
                  </tr>
                  <tr>
                    <th>Total TVA</th>
                    <td class="text-right">{{ formatPrice(invoice.invoice_vat_amount) }} {{ invoice.invoice_currency }}</td>
                  </tr>
                  <tr class="total-row">
                    <td><strong>TOTAL TTC</strong></td>
                    <td class="text-right"><strong>{{ formatPrice(invoice.invoice_total_amount) }} {{ invoice.invoice_currency }}</strong></td>
                  </tr>
                </table>
              </div>

              <!-- Footer -->
              <div class="inv-footer">
                <p>Merci pour votre confiance!</p>
                <p>Document généré le {{ formatDate(new Date()) }}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';
import { useInvoicePrint } from '@/composables/useInvoicePrint';

const route = useRoute();
const router = useRouter();
const invoice = ref(null);
const loading = ref(true);
const { printA4, printPOS } = useInvoicePrint();

onMounted(() => loadInvoice());

async function loadInvoice() {
  loading.value = true;
  try {
    const { data } = await api.get(`/hotel/invoices/${route.params.id}`);
    invoice.value = data.data;
  } catch {
    alert('Facture non trouvée');
    router.push({ name: 'hotel.invoices' });
  } finally {
    loading.value = false;
  }
}

const formatPrice = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

</script>

<style scoped>
.invoice-container { max-width: 800px; margin: 0 auto; }

.inv-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #007bff;
  padding-bottom: 15px;
  margin-bottom: 15px;
}
.company-info h1 { font-size: 20px; color: #007bff; margin-bottom: 5px; }
.company-info p, .invoice-info p { font-size: 11px; color: #666; margin: 2px 0; }
.invoice-info { text-align: right; }
.invoice-info h2 { font-size: 16px; color: #333; }
.invoice-number { font-size: 14px; font-weight: bold; color: #007bff; }

.parties { display: flex; justify-content: space-between; margin-bottom: 20px; }
.party { width: 48%; }
.party h3 {
  font-size: 12px;
  background: #f5f5f5;
  padding: 5px 10px;
  margin-bottom: 8px;
  border-left: 3px solid #007bff;
}
.party p { padding-left: 10px; font-size: 11px; margin: 2px 0; }

table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
th { background: #007bff; color: white; font-weight: 600; }
tr:nth-child(even) { background: #f9f9f9; }
.text-right { text-align: right; }
.text-center { text-align: center; }

.totals { width: 300px; margin-left: auto; }
.totals th { background: #f5f5f5; color: #333; }
.total-row td { background: #007bff !important; color: white; }

.inv-footer {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
  font-size: 10px;
  color: #666;
  text-align: center;
}
.inv-footer p { margin: 2px 0; }
</style>
