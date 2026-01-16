<template>
  <!-- Ligne 1: Modal des transferts en attente -->
  <div v-if="show" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <!-- Ligne 2: En-tête du modal -->
        <div class="modal-header bg-warning">
          <h5 class="modal-title">
            <i class="bi bi-hourglass-split me-2"></i>
            Transferts en Attente d'Approbation
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <!-- Ligne 3: Corps du modal -->
        <div class="modal-body">
          <!-- Ligne 4: Chargement -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary"></div>
          </div>

          <!-- Ligne 5: Liste des transferts -->
          <div v-else>
            <!-- Ligne 6: Carte de transfert -->
            <div v-for="(transfer, transferIndex) in transfers" :key="transfer.id" class="card mb-3">
              <!-- Ligne 7: En-tête de la carte -->
              <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                  <span class="badge bg-dark me-2">{{ transferIndex + 1 }}</span>
                  <strong>{{ transfer.transfer_code }}</strong>
                  <span class="badge bg-secondary ms-2">{{ transfer.status }}</span>
                </div>
                <small class="text-muted">{{ formatDate(transfer.created_at) }}</small>
              </div>

              <!-- Ligne 8: Corps de la carte -->
              <div class="card-body">
                <!-- Ligne 9: Info entrepôts -->
                <div class="row mb-3">
                  <div class="col-md-5">
                    <strong>Source:</strong> {{ transfer.source_warehouse?.name }}
                  </div>
                  <div class="col-md-2 text-center">
                    <i class="bi bi-arrow-right text-success"></i>
                  </div>
                  <div class="col-md-5">
                    <strong>Destination:</strong> {{ transfer.destination_warehouse?.name }}
                  </div>
                </div>

                <!-- Ligne 10: Tableau des produits -->
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th style="width: 50px;">#</th>
                      <th>Produit</th>
                      <th class="text-end">Quantité</th>
                      <th class="text-end">Prix Unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Ligne 11: Lignes de produits -->
                    <tr v-for="(item, itemIndex) in transfer.items" :key="item.id">
                      <td class="text-muted">{{ itemIndex + 1 }}</td>
                      <td>{{ item.product?.item_designation }}</td>
                      <td class="text-end">{{ item.quantity }}</td>
                      <td class="text-end">{{ item.unit_price }} {{ item.currency }}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Ligne 12: Notes -->
                <div v-if="transfer.notes" class="alert alert-info mb-3">
                  <strong>Notes:</strong> {{ transfer.notes }}
                </div>

                <!-- Ligne 13: Boutons d'action -->
                <div class="d-flex gap-2 justify-content-end">
                  <button class="btn btn-success" @click="$emit('approve', transfer.id)">
                    <i class="bi bi-check-circle"></i> Approuver
                  </button>
                  <button class="btn btn-danger" @click="$emit('reject', transfer)">
                    <i class="bi bi-x-circle"></i> Rejeter
                  </button>
                </div>
              </div>
            </div>

            <!-- Ligne 14: Message si aucun transfert -->
            <div v-if="transfers.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-check-circle fs-1 d-block mb-2"></i>
              Aucun transfert en attente
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ligne 15: Props
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  transfers: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Ligne 16: Émissions
defineEmits(['close', 'approve', 'reject']);

// Ligne 17: Formater une date
const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR');
};
</script>
