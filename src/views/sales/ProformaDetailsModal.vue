<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  proforma: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return "0";
  const num = parseFloat(price);
  return !isNaN(num) ? num.toLocaleString() : "0";
};

const printProforma = () => {
  const printContent = document.getElementById('proforma-printable');
  // Simple check to ensure element exists
  if (!printContent) return;

  const originalContent = document.body.innerHTML;
  document.body.innerHTML = printContent.innerHTML;
  window.print();
  document.body.innerHTML = originalContent;
  // Reloading is aggressive but preserving original behavior
  window.location.reload(); 
};
</script>

<template>
  <div v-if="show && proforma" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Proforma - {{ proforma.invoice_number || 'APERÇU' }}</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="modal-body" id="proforma-printable">
          <!-- En-tête -->
          <div class="text-center mb-4 border-bottom pb-3">
            <h3 class="fw-bold">PROFORMA SERVICE</h3>
            <p class="mb-1">N° {{ proforma.invoice_number || '---' }}</p>
            <p class="text-muted">Date: {{ new Date(proforma.invoice_date).toLocaleDateString() }}</p>
          </div>

          <!-- Infos Client -->
          <div class="row mb-4">
            <div class="col-6">
              <h6 class="fw-bold">Client:</h6>
              <p class="mb-0">{{ proforma.customer_name }}</p>
              <p class="text-muted">{{ proforma.customer_TIN }}</p>
            </div>
            <div class="col-6 text-end">
              <p><strong>Devise:</strong> {{ proforma.invoice_currency }}</p>
              <p><strong>Statut:</strong> {{ proforma.obr_submission_status }}</p>
            </div>
          </div>

          <!-- Tableau des articles -->
          <table class="table table-bordered">
            <thead class="bg-light">
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qté</th>
                <th>PU HT</th>
                <th>TVA</th>
                <th>Total TTC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in proforma.invoice_items" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td>{{ item.item_designation }}</td>
                <td>{{ item.item_quantity }}</td>
                <td>{{ formatPrice(item.item_price) }}</td>
                <td>{{ item.vat }}%</td>
                <td>{{ formatPrice(item.item_total_amount) }}</td>
              </tr>
            </tbody>
            <tfoot class="fw-bold">
              <tr>
                <td colspan="5" class="text-end">Total HT</td>
                <td>{{ formatPrice(proforma.invoice_amount_nvat) }}</td>
              </tr>
              <tr>
                <td colspan="5" class="text-end">TVA</td>
                <td>{{ formatPrice(proforma.invoice_vat_amount) }}</td>
              </tr>
              <tr class="table-primary">
                <td colspan="5" class="text-end">TOTAL TTC</td>
                <td>{{ formatPrice(proforma.invoice_total_amount) }} {{ proforma.invoice_currency }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="close">Fermer</button>
          <button class="btn btn-primary" @click="printProforma">
            Imprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
