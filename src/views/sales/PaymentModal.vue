<script setup>
import { ref, watch, computed } from 'vue';
import { X, Check, DollarSign, Trash2, Calendar, CreditCard, FileText } from 'lucide-vue-next';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const props = defineProps({
  show: Boolean,
  invoice: Object,
  companyCurrency: {
    type: String,
    default: 'BIF'
  }
});

const emit = defineEmits(['close', 'payment-added']);

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

const loading = ref(false);
const payments = ref([]);
const showForm = ref(false);

const form = ref({
  amount: 0,
  payment_method: 'cash',
  reference: '',
  note: '',
  payment_date: new Date().toISOString().split('T')[0]
});

// Calculate remaining amount
const remainingAmount = computed(() => {
  if (!props.invoice) return 0;
  const total = parseFloat(props.invoice.invoice_total_amount);
  const paid = parseFloat(props.invoice.total_paid || 0); // Need to make sure invoice has total_paid updated locally or fetch it
  
  // Or calculate from loaded payments if we fetch real-time
  const paidRealTime = payments.value.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  // Use the larger of the two to be safe, or stick to backend value?
  // Let's rely on local computation if available for immediate feedback
  return Math.max(0, total - paidRealTime);
});

const fetchPayments = async () => {
  if (!props.invoice?.id) return;
  loading.value = true;
  try {
    const res = await api.get(`/payments?invoice_id=${props.invoice.id}`);
    if (res.data.success) {
      payments.value = res.data.data.data;
    }
  } catch (e) {
    console.error("Error fetching payments", e);
  } finally {
    loading.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal && props.invoice) {
    form.value.amount = 0; // Will be set to remaining in watch invoice
    form.value.payment_method = 'cash';
    form.value.reference = '';
    form.value.note = '';
    showForm.value = true;
    fetchPayments();
  }
});

watch(() => props.invoice, (newVal) => {
  if (newVal) {
    // We'll update the default amount when payments are fetched or when invoice opens
    // But initially we might just use the invoice props if up to date
    form.value.amount = Math.max(0, parseFloat(newVal.invoice_total_amount) - (parseFloat(newVal.total_paid) || 0));
  }
}, { immediate: true });

// Update default amount when payments change
watch(payments, () => {
  if (props.invoice) {
     const total = parseFloat(props.invoice.invoice_total_amount);
     const paid = payments.value.reduce((sum, p) => sum + parseFloat(p.amount), 0);
     form.value.amount = Math.max(0, total - paid);
  }
});

const submitPayment = async () => {
  if (form.value.amount <= 0) return;
  
  loading.value = true;
  try {
     const payload = {
         invoice_id: props.invoice.id,
         ...form.value
     };
     
     const res = await api.post('/payments', payload);
     if (res.data.success) {
         // Refresh payments
         await fetchPayments();
         // Reset form partly
         form.value.reference = '';
         form.value.note = '';
         emit('payment-added', res.data.data);
     }
  } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l\'enregistrement du paiement');
  } finally {
      loading.value = false;
  }
};

const deletePayment = async (id) => {
    if (!(await confirmDialog('Êtes-vous sûr de vouloir supprimer ce paiement ?'))) return;
    
    try {
        await api.delete(`/payments/${id}`);
        fetchPayments();
        emit('payment-added'); // To trigger refresh of parent if needed
    } catch (e) {
        console.error(e);
        toast.error('Erreur lors de la suppression');
    }
};

const formatPrice = (p) => {
    return new Intl.NumberFormat('fr-FR').format(p);
};

const formatDate = (d) => {
    return new Date(d).toLocaleDateString();
};

const getMethodLabel = (m) => {
    const map = {
        cash: 'Espèces',
        card: 'Carte Bancaire',
        bank_transfer: 'Virement',
        check: 'Chèque',
        mobile_money: 'Mobile Money'
    };
    return map[m] || m;
};
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show" style="display: block; background-color: rgba(0,0,0,0.5);"></div>
  <div v-if="show" class="modal fade show" style="display: block;" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title d-flex align-items-center gap-2">
            <DollarSign />
            Gestion des Paiements - Facture #{{ invoice?.invoice_number }}
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>
        
        <div class="modal-body p-4">
            <div class="row g-4">
                <!-- Left: Form -->
                <div class="col-md-5 border-end">
                    <h6 class="fw-bold mb-3 text-secondary">Nouveau Paiement</h6>
                    
                    <div class="mb-3">
                        <label class="form-label small text-muted">Montant à payer</label>
                        <div class="input-group">
                            <input type="number" v-model="form.amount" class="form-control fw-bold" min="0" :max="remainingAmount">
                            <span class="input-group-text">{{ invoice?.invoice_currency }}</span>
                        </div>
                        <div class="form-text text-end" :class="remainingAmount > 0 ? 'text-danger' : 'text-success'">
                            Reste dû: {{ formatPrice(remainingAmount) }} {{ invoice?.invoice_currency }}
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Mode de paiement</label>
                        <select v-model="form.payment_method" class="form-select">
                            <option value="cash">Espèces</option>
                            <option value="mobile_money">Mobile Money (Lumicash/Ecocash)</option>
                            <option value="bank_transfer">Virement Bancaire</option>
                            <option value="check">Chèque</option>
                            <option value="card">Carte Bancaire</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Date</label>
                        <input type="date" v-model="form.payment_date" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Référence (Optionnel)</label>
                        <input type="text" v-model="form.reference" class="form-control" placeholder="Ex: N° Bordereau, Transaction ID">
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Note</label>
                        <textarea v-model="form.note" class="form-control" rows="2"></textarea>
                    </div>

                    <button class="btn btn-primary w-100" @click="submitPayment" :disabled="loading || form.amount <= 0">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        Enregistrer le paiement
                    </button>
                </div>

                <!-- Right: History -->
                <div class="col-md-7">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="fw-bold text-secondary mb-0">Historique</h6>
                        <span class="badge bg-success bg-opacity-10 text-success">
                            Total Payé: {{ formatPrice(payments.reduce((s,p) => s + parseFloat(p.amount), 0)) }} {{ invoice?.invoice_currency }}
                        </span>
                    </div>

                    <div class="table-responsive border rounded" style="max-height: 400px;">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="table-light sticky-top">
                                <tr>
                                    <th>Date</th>
                                    <th>Mode</th>
                                    <th class="text-end">Montant</th>
                                    <th>Ref</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="payments.length === 0">
                                    <td colspan="5" class="text-center py-4 text-muted small">Aucun paiement enregistré</td>
                                </tr>
                                <tr v-for="pay in payments" :key="pay.id">
                                    <td style="font-size: 0.85rem;">{{ formatDate(pay.payment_date) }}</td>
                                    <td style="font-size: 0.85rem;">{{ getMethodLabel(pay.payment_method) }}</td>
                                    <td class="text-end fw-bold text-success">{{ formatPrice(pay.amount) }}</td>
                                    <td style="font-size: 0.8rem;" class="text-muted">{{ pay.reference || '-' }}</td>
                                    <td class="text-end">
                                        <button @click="deletePayment(pay.id)" class="btn btn-link text-danger p-0">
                                            <Trash2 :size="14" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
