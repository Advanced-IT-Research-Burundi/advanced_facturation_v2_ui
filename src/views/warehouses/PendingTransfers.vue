<template>
  <div class="container-fluid py-4">
    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3">
          <i class="bi bi-hourglass-split me-2 text-warning"></i>
          Transferts en Attente
          <span class="badge bg-warning text-dark ms-2">{{ pendingTransfers.length }}</span>
        </h2>
        <small class="text-muted">{{ warehouse?.name }} - {{ warehouse?.location }}</small>
      </div>
      <router-link :to="`/stock/${warehouseId}/movements`" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Retour
      </router-link>
    </div>

    <!-- Messages -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
      <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
      <button class="btn-close" @click="successMessage = null"></button>
    </div>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">Chargement des transferts...</p>
    </div>

    <!-- Liste des transferts -->
    <div v-else>
      <div v-for="transfer in pendingTransfers" :key="transfer.id" class="card mb-4 shadow-sm">
        <div class="card-header bg-warning">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">
                <i class="bi bi-box-seam me-2"></i>
                {{ transfer.transfer_code }}
              </h5>
            </div>
            <span class="badge bg-dark">{{ formatDate(transfer.created_at) }}</span>
          </div>
        </div>
        
        <div class="card-body">
          <!-- Informations sur le transfert -->
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-building me-2 text-primary"></i>
                <div>
                  <small class="text-muted d-block">Entrepôt Source</small>
                  <strong>{{ transfer.source_warehouse?.name }}</strong>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-person me-2 text-info"></i>
                <div>
                  <small class="text-muted d-block">Créé par</small>
                  <strong>{{ transfer.created_by_user?.name || 'N/A' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="transfer.notes" class="alert alert-info mb-3">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Notes:</strong> {{ transfer.notes }}
          </div>

          <!-- Tableau des produits -->
          <div class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Code</th>
                  <th>Produit</th>
                  <th class="text-end">Quantité</th>
                  <th class="text-end">Prix Unitaire</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in transfer.items" :key="item.id">
                  <td><code>{{ item.product?.item_code }}</code></td>
                  <td>{{ item.product?.item_designation }}</td>
                  <td class="text-end">
                    {{ item.quantity }} {{ item.product?.item_measurement_unit }}
                  </td>
                  <td class="text-end">{{ item.unit_price }} {{ item.currency }}</td>
                  <td class="text-end">
                    <strong>{{ (item.quantity * item.unit_price).toFixed(2) }} {{ item.currency }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-footer bg-light">
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-success" @click="approveTransfer(transfer)" :disabled="submitting">
              <i class="bi bi-check-circle me-1"></i> Approuver
            </button>
            <button class="btn btn-danger" @click="openRejectModal(transfer)" :disabled="submitting">
              <i class="bi bi-x-circle me-1"></i> Rejeter
            </button>
          </div>
        </div>
      </div>

      <!-- Aucun transfert -->
      <div v-if="pendingTransfers.length === 0" class="card shadow-sm">
        <div class="card-body text-center py-5">
          <i class="bi bi-check-circle-fill fs-1 text-success d-block mb-3"></i>
          <h5 class="text-muted">Aucun transfert en attente</h5>
          <p class="text-muted">Tous les transferts ont été traités</p>
          <router-link :to="`/stock/${warehouseId}/movements`" class="btn btn-primary mt-3">
            <i class="bi bi-arrow-left me-2"></i>Retour au Mouvements de Stock
          </router-link>
        </div>
      </div>
    </div>

    <!-- Modal Rejet -->
    <div v-if="showRejectModal" class="modal show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-x-circle me-2"></i>Rejeter le Transfert
            </h5>
            <button class="btn-close btn-close-white" @click="closeRejectModal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>Transfert:</strong> {{ selectedTransfer?.transfer_code }}
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Raison du rejet *</label>
              <textarea class="form-control" v-model="rejectReason" rows="4"
                        placeholder="Expliquez pourquoi vous rejetez ce transfert..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeRejectModal">Annuler</button>
            <button @click="submitReject" class="btn btn-danger" :disabled="submitting || !rejectReason.trim()">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-x-circle me-1"></i>
              Confirmer le Rejet
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';
import { useConfirm } from '@/composables/useConfirm';

const route = useRoute();
const { confirm: confirmDialog } = useConfirm();
const warehouseId = route.params.id;

const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);

const warehouse = ref(null);
const pendingTransfers = ref([]);

const showRejectModal = ref(false);
const selectedTransfer = ref(null);
const rejectReason = ref('');

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    const resp = await api.get(`warehouses/${warehouseId}/dashboard`);
    if (resp.data.success) {
      warehouse.value = resp.data.data.warehouse;
      pendingTransfers.value = resp.data.data.pending_transfers;
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des transferts';
  } finally {
    loading.value = false;
  }
};

const approveTransfer = async (transfer) => {
  if (!(await confirmDialog(`Voulez-vous approuver le transfert ${transfer.transfer_code} ?`))) return;

  submitting.value = true;
  try {
    const resp = await api.post(`warehouses/${warehouseId}/transfers/${transfer.id}/approve`);
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      await fetchData();
      setTimeout(() => successMessage.value = null, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'approbation';
    setTimeout(() => error.value = null, 5000);
  } finally {
    submitting.value = false;
  }
};

const openRejectModal = (transfer) => {
  selectedTransfer.value = transfer;
  rejectReason.value = '';
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  showRejectModal.value = false;
  selectedTransfer.value = null;
  rejectReason.value = '';
};

const submitReject = async () => {
  if (!rejectReason.value.trim()) {
    error.value = 'Veuillez indiquer une raison du rejet';
    return;
  }

  submitting.value = true;
  try {
    const resp = await api.post(
      `warehouses/${warehouseId}/transfers/${selectedTransfer.value.id}/reject`,
      { rejection_reason: rejectReason.value }
    );
    
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeRejectModal();
      await fetchData();
      setTimeout(() => successMessage.value = null, 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du rejet';
    setTimeout(() => error.value = null, 5000);
  } finally {
    submitting.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.card {
  border-radius: 12px;
}

.table {
  margin-bottom: 0;
}

.modal {
  display: block;
}
</style>