<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { X, Printer } from "lucide-vue-next";
import { useInvoicePrint } from "@/composables/useInvoicePrint";
import QRCode from "qrcode";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  invoice: {
    type: Object,
    default: null,
  },
  company: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const printRef = ref(null);
const qrCodeDataUrl = ref("");
const { printA4, printPOS } = useInvoicePrint();

const invoiceCurrency = computed(() => props.invoice?.invoice_currency || 'BIF');
const invoiceTotals = computed(() => ({
  amountNvat: parseFloat(props.invoice?.invoice_amount_nvat) || 0,
  vatAmount: parseFloat(props.invoice?.invoice_vat_amount) || 0,
  totalAmount: parseFloat(props.invoice?.invoice_total_amount) || 0,
}));

const electronicSignature = computed(() => {
  return props.invoice?.obr_electronic_signature || props.invoice?.electronic_signature || "";
});

const invoiceTypeLabel = computed(() => {
  const types = {
    FN: "Facture Normale",
    FA: "Facture Avoir",
    FC: "Facture Caution",
    FP: "Facture Proforma",
    RC: "Remboursement Caution",
  };
  return types[props.invoice?.invoice_type] || "Facture";
});

const formatPrice = (price) => {
  const num = parseFloat(price) || 0;
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateQRCode = async (invoice) => {
  if (!invoice) {
    qrCodeDataUrl.value = "";
    return;
  }
  try {
    // Le QR code encode uniquement l'identifiant OBR
    const qrData = invoice.obr_invoice_identifier || invoice.obr_invoice_registered_number || invoice.invoice_number || "";

    qrCodeDataUrl.value = await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Erreur génération QR code:", err);
    qrCodeDataUrl.value = "";
  }
};

watch(
  () => [props.show, props.invoice],
  async ([show, invoice]) => {
    if (show && invoice) {
      await nextTick();
      generateQRCode(invoice);
    } else {
      qrCodeDataUrl.value = "";
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="show && invoice" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header d-flex justify-content-between align-items-center p-3 border-bottom">
        <h5 class="mb-0">Apercu de la Facture</h5>
        <div class="d-flex gap-2">
          <button @click="printA4(props.invoice, props.company)" class="btn btn-primary btn-sm">
            <Printer :size="14" class="me-1" />
            A4
          </button>
          <button @click="printPOS(props.invoice, props.company)" class="btn btn-outline-primary btn-sm">
            <Printer :size="14" class="me-1" />
            POS
          </button>
          <button @click="$emit('close')" class="btn btn-outline-secondary btn-sm">
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- Modal Body - Invoice Preview -->
      <div class="modal-body p-4 overflow-auto" style="max-height: 70vh;">
        <div ref="printRef" class="invoice-print">
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <h1>{{ invoice.tp_name || company?.name || 'Entreprise' }}</h1>
                <p>NIF: {{ invoice.tp_TIN || company?.tp_TIN || 'N/A' }}</p>
                <p>RC: {{ invoice.tp_trade_number || company?.tp_trade_number || 'N/A' }}</p>
                <p>Tel: {{ invoice.tp_phone_number || company?.phone || 'N/A' }}</p>
                <p>Centre Fiscal: {{ invoice.tp_fiscal_center || 'DMC' }}</p>
              </div>
              <div class="invoice-info">
                <h2>{{ invoiceTypeLabel }}</h2>
                <p class="invoice-number">N°: {{ invoice.invoice_number }}</p>
                <p>Date: {{ formatDate(invoice.invoice_date || invoice.created_at) }}</p>
                <p>Devise: {{ invoice.invoice_currency || 'BIF' }}</p>
              </div>
            </div>

            <!-- Parties -->
            <div class="parties">
              <div class="party">
                <h3>VENDEUR</h3>
                <p><strong>{{ invoice.tp_name || company?.name }}</strong></p>
                <p>NIF: {{ invoice.tp_TIN || company?.tp_TIN }}</p>
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
                  <th style="width: 40px;">#</th>
                  <th>Désignation</th>
                  <th class="text-center" style="width: 60px;">Qté</th>
                  <th class="text-right" style="width: 100px;">P.U. HT</th>
                  <th class="text-center" style="width: 60px;">TVA %</th>
                  <th class="text-right" style="width: 100px;">TVA</th>
                  <th class="text-right" style="width: 120px;">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in (invoice.invoice_items || invoice.items || [])" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>{{ item.item_designation }}</td>
                  <td class="text-center">{{ item.item_quantity }}</td>
                  <td class="text-right">{{ formatPrice(item.item_price) }}</td>
                  <td class="text-center">{{ item.vat ?? 0 }}%</td>
                  <td class="text-right">{{ formatPrice((item.item_price * item.item_quantity * (item.vat ?? 0)) / 100) }}</td>
                  <td class="text-right">{{ formatPrice(item.item_total_amount ?? (item.item_price * item.item_quantity * (1 + (item.vat ?? 0) / 100))) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
              <table>
                <tbody>
                  <tr>
                    <th>Total HT</th>
                    <td class="text-right">{{ formatPrice(invoiceTotals.amountNvat) }} {{ invoiceCurrency }}</td>
                  </tr>
                  <tr>
                    <th>Total TVA</th>
                    <td class="text-right">{{ formatPrice(invoiceTotals.vatAmount) }} {{ invoiceCurrency }}</td>
                  </tr>
                  <tr class="total-row">
                    <td><strong>TOTAL TTC</strong></td>
                    <td class="text-right"><strong>{{ formatPrice(invoiceTotals.totalAmount) }} {{ invoiceCurrency }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- OBR Info -->
            <div v-if="invoice.obr_invoice_identifier || invoice.obr_electronic_signature" class="obr-info">
              <p><strong>Informations OBR:</strong></p>
              <p v-if="invoice.obr_invoice_identifier">Identifiant: {{ invoice.obr_invoice_identifier }}</p>
              <p v-if="invoice.obr_invoice_registered_number">N° Enregistré: {{ invoice.obr_invoice_registered_number }}</p>
              <p v-if="invoice.obr_electronic_signature">Signature: {{ invoice.obr_electronic_signature }}</p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>Merci pour votre confiance!</p>
              <p>Document généré le {{ formatDate(new Date()) }}</p>
              <p v-if="electronicSignature" class="electronic-signature">
                Signature électronique: {{ electronicSignature }}
              </p>
              <!-- QR Code Section -->
              <div v-if="qrCodeDataUrl" class="qr-code-section">
                <img :src="qrCodeDataUrl" alt="QR Code Facture" class="qr-code-image" />
                <p class="qr-code-sublabel">{{ invoice.obr_invoice_identifier || invoice.invoice_number }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.modal-body {
  background: #e9ecef;
}

.invoice-print {
  background: white;
  padding: 20px;
  border-radius: 4px;
}

.invoice-container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #007bff;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.company-info h1 {
  font-size: 20px;
  color: #007bff;
  margin-bottom: 5px;
}

.company-info p {
  font-size: 11px;
  color: #666;
  margin: 2px 0;
}

.invoice-info {
  text-align: right;
}

.invoice-info h2 {
  font-size: 16px;
  color: #333;
}

.invoice-info .invoice-number {
  font-size: 14px;
  font-weight: bold;
  color: #007bff;
}

.invoice-info p {
  margin: 2px 0;
  font-size: 11px;
}

.parties {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.party {
  width: 48%;
}

.party h3 {
  font-size: 12px;
  background: #f5f5f5;
  padding: 5px 10px;
  margin-bottom: 8px;
  border-left: 3px solid #007bff;
}

.party p {
  padding-left: 10px;
  font-size: 11px;
  margin: 2px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  font-size: 11px;
}

th {
  background: #007bff;
  color: white;
  font-weight: 600;
}

tr:nth-child(even) {
  background: #f9f9f9;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.totals {
  width: 300px;
  margin-left: auto;
}

.totals table {
  margin-bottom: 0;
}

.totals th {
  background: #f5f5f5;
  color: #333;
}

.total-row td {
  background: #007bff !important;
  color: white;
}

.footer {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
  font-size: 10px;
  color: #666;
  text-align: center;
}

.electronic-signature {
  word-break: break-all;
  margin-bottom: 8px;
}

.qr-code-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}



.qr-code-image {
  width: 120px;
  height: 120px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  padding: 4px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-sublabel {
  font-size: 8px;
  color: #aaa;
  margin: 0;
  font-family: monospace;
}

.obr-info {
  margin-top: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 10px;
}

.obr-info p {
  margin: 2px 0;
}
</style>
