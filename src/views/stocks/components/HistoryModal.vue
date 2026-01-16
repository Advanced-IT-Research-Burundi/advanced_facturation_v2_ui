<template>
  <!-- Ligne 1: Modal d'historique des mouvements -->
  <div v-if="show" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <!-- Ligne 2: En-tête du modal -->
        <div class="modal-header bg-dark text-white">
          <h5 class="modal-title">
            <i class="bi bi-clock-history me-2"></i>
            Historique des Mouvements
            <span v-if="warehouseName" class="ms-2 badge bg-secondary">
              {{ warehouseName }}
            </span>
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- Ligne 3: Corps du modal -->
        <div class="modal-body">
          <!-- Ligne 4: Filtres -->
          <div class="row g-3 mb-3">
            <!-- Ligne 5: Filtre par type -->
            <div class="col-md-4">
              <select class="form-select form-select-sm" v-model="filters.movement_type" @change="$emit('filter-change')">
                <option value="">Tous les types</option>
                <option v-for="(label, code) in MOUVEMENT_TYPES" :key="code" :value="code">
                  {{ label }}
                </option>
              </select>
            </div>
            <!-- Ligne 6: Filtre date début -->
            <div class="col-md-4">
              <input type="date" class="form-control form-control-sm" v-model="filters.date_from" @change="$emit('filter-change')">
            </div>
            <!-- Ligne 7: Filtre date fin -->
            <div class="col-md-4">
              <input type="date" class="form-control form-control-sm" v-model="filters.date_to" @change="$emit('filter-change')">
            </div>
          </div>

          <!-- Ligne 8: Chargement -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary"></div>
          </div>

          <!-- Ligne 9: Tableau -->
          <div v-else class="table-responsive">
            <table class="table table-sm table-hover">
              <!-- Ligne 10: En-tête du tableau -->
              <thead class="table-light">
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Produit</th>
                  <th class="text-end">Quantité</th>
                  <th class="text-end">Prix</th>
                  <th>Référence</th>
                  <th>Statut OBR</th>
                </tr>
              </thead>
              <!-- Ligne 11: Corps du tableau -->
              <tbody>
                <!-- Ligne 12: Lignes de mouvements -->
                <tr v-for="(mvt, index) in movements" :key="mvt.id">
                  <!-- Ligne 13: Numéro de ligne -->
                  <td class="text-muted fw-bold">{{ index + 1 }}</td>
                  <!-- Ligne 14: Date -->
                  <td><small>{{ formatDate(mvt.item_movement_date) }}</small></td>
                  <!-- Ligne 15: Type de mouvement -->
                  <td>
                    <span class="badge" :class="getMovementBadgeClass(mvt.item_movement_type)">
                      {{ mvt.item_movement_type }}
                    </span>
                  </td>
                  <!-- Ligne 16: Produit -->
                  <td>
                    <small class="fw-bold">{{ mvt.item_designation }}</small><br>
                    <small class="text-muted">{{ mvt.item_code }}</small>
                  </td>
                  <!-- Ligne 17: Quantité -->
                  <td class="text-end">{{ mvt.item_quantity }} {{ mvt.item_measurement_unit }}</td>
                  <!-- Ligne 18: Prix -->
                  <td class="text-end"><small>{{ mvt.item_purchase_or_sale_price }} {{ mvt.item_purchase_or_sale_currency }}</small></td>
                  <!-- Ligne 19: Référence -->
                  <td><small>{{ mvt.item_movement_invoice_ref || '-' }}</small></td>
                  <!-- Ligne 20: Statut OBR -->
                  <td>
                    <span class="badge" :class="getObrStatusClass(mvt.obr_submission_status)">
                      {{ mvt.obr_submission_status }}
                    </span>
                  </td>
                </tr>
                <!-- Ligne 21: Message si aucun mouvement -->
                <tr v-if="movements.length === 0">
                  <td colspan="8" class="text-center text-muted py-4">Aucun mouvement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ligne 22: Imports
import { MOUVEMENT_TYPES, OBR_STATUS_CLASSES } from '../constants';

// Ligne 23: Props
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  movements: {
    type: Array,
    required: true
  },
  filters: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  warehouseName: {
    type: String,
    default: ''
  }
});

// Ligne 24: Émissions
defineEmits(['close', 'filter-change']);

// Ligne 25: Formater une date
const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR');
};

// Ligne 26: Obtenir la classe du badge de mouvement
const getMovementBadgeClass = (type) => {
  return type.startsWith('E') ? 'bg-success' : 'bg-danger';
};

// Ligne 27: Obtenir la classe du statut OBR
const getObrStatusClass = (status) => {
  return OBR_STATUS_CLASSES[status] || 'bg-secondary';
};
</script>
