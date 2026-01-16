<template>
  <!-- Ligne 1: Modal de sortie de stock -->
  <div v-if="show" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <!-- Ligne 2: En-tête du modal -->
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title">
            <i class="bi bi-dash-circle me-2"></i>
            Sortie de Stock
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- Ligne 3: Formulaire -->
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <!-- Ligne 4: Première ligne de champs -->
            <div class="row g-3 mb-4">
              <!-- Ligne 5: Type de sortie -->
              <div class="col-md-4">
                <label class="form-label">Type de sortie *</label>
                <select class="form-select" v-model="form.movement_type" required>
                  <option v-for="type in EXIT_TYPES" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
              <!-- Ligne 6: Date du mouvement -->
              <div class="col-md-4">
                <label class="form-label">Date du mouvement *</label>
                <input type="datetime-local" class="form-control" v-model="form.movement_date" required>
              </div>
              <!-- Ligne 7: Référence facture -->
              <div class="col-md-4">
                <label class="form-label">Référence facture</label>
                <input type="text" class="form-control" v-model="form.invoice_ref">
              </div>
              <!-- Ligne 8: Description -->
              <div class="col-md-12">
                <label class="form-label">Description</label>
                <textarea class="form-control" v-model="form.description" rows="2"></textarea>
              </div>
            </div>

            <hr>

            <!-- Ligne 9: En-tête des produits -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6>Produits à sortir</h6>
              <button type="button" class="btn btn-sm btn-outline-primary" @click="$emit('add-item')">
                <i class="bi bi-plus-circle"></i> Ajouter un produit
              </button>
            </div>

            <!-- Ligne 10: Liste des produits -->
            <div v-for="(item, index) in form.items" :key="index" class="card mb-2">
              <div class="card-body">
                <!-- Ligne 11: Numéro de ligne -->
                <div class="d-flex align-items-center mb-2">
                  <span class="badge bg-secondary me-2">Ligne {{ index + 1 }}</span>
                </div>
                <div class="row g-2 align-items-center">
                  <!-- Ligne 12: Sélection du produit -->
                  <div class="col-md-6">
                    <label class="form-label small">Produit *</label>
                    <select class="form-select" v-model="item.product_id" required @change="$emit('update-stock', item)">
                      <option value="">Sélectionner...</option>
                      <option v-for="stock in warehouseStocks" :key="stock.product_id" :value="stock.product_id">
                        {{ stock.product?.item_designation }} - Stock: {{ stock.quantity }} {{ stock.product?.item_measurement_unit }}
                      </option>
                    </select>
                  </div>
                  <!-- Ligne 13: Quantité -->
                  <div class="col-md-3">
                    <label class="form-label small">Quantité *</label>
                    <input type="number" step="0.01" class="form-control"
                           v-model="item.quantity" required min="0.01"
                           :max="item.available_stock">
                    <small class="text-muted">Max: {{ item.available_stock || 0 }}</small>
                  </div>
                  <!-- Ligne 14: Prix -->
                  <div class="col-md-2">
                    <label class="form-label small">Prix</label>
                    <input type="text" class="form-control" v-model="item.unit_price" readonly>
                  </div>
                  <!-- Ligne 15: Bouton supprimer -->
                  <div class="col-md-1 text-end">
                    <label class="form-label small d-block">&nbsp;</label>
                    <button type="button" class="btn btn-sm btn-outline-danger"
                            @click="$emit('remove-item', index)"
                            :disabled="form.items.length === 1">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ligne 16: Pied du modal -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
            <button type="submit" class="btn btn-danger" :disabled="submitting || form.items.length === 0">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer la Sortie
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ligne 17: Imports
import { EXIT_TYPES } from '../constants';

// Ligne 18: Props
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  form: {
    type: Object,
    required: true
  },
  warehouseStocks: {
    type: Array,
    required: true
  },
  submitting: {
    type: Boolean,
    default: false
  }
});

// Ligne 19: Émissions
const emit = defineEmits(['close', 'submit', 'add-item', 'remove-item', 'update-stock']);

// Ligne 20: Gestion de la soumission
const handleSubmit = () => {
  emit('submit');
};
</script>
