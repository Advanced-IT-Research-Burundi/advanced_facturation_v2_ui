<template>
  <!-- Ligne 1: Modal de transfert -->
  <div v-if="show" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <!-- Ligne 2: En-tête du modal -->
        <div class="modal-header bg-info text-white">
          <h5 class="modal-title">
            <i class="bi bi-arrow-left-right me-2"></i>
            Créer un Transfert entre Entrepôts
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- Ligne 3: Formulaire -->
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <!-- Ligne 4: Sélection des entrepôts -->
            <div class="row g-3 mb-4">
              <!-- Ligne 5: Entrepôt source -->
              <div class="col-md-5">
                <label class="form-label">Entrepôt Source *</label>
                <select class="form-select" v-model="form.source_warehouse_id" required @change="$emit('load-source-stock')">
                  <option value="">Sélectionner...</option>
                  <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
                </select>
              </div>
              <!-- Ligne 6: Flèche -->
              <div class="col-md-2 text-center pt-4">
                <i class="bi bi-arrow-right fs-1 text-info"></i>
              </div>
              <!-- Ligne 7: Entrepôt destination -->
              <div class="col-md-5">
                <label class="form-label">Entrepôt Destination *</label>
                <select class="form-select" v-model="form.destination_warehouse_id" required>
                  <option value="">Sélectionner...</option>
                  <option v-for="wh in warehouses" :key="wh.id" :value="wh.id"
                          :disabled="wh.id === form.source_warehouse_id">
                    {{ wh.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Ligne 8: Notes -->
            <div class="mb-3">
              <label class="form-label">Notes</label>
              <textarea class="form-control" v-model="form.notes" rows="2"></textarea>
            </div>

            <hr>

            <!-- Ligne 9: En-tête des produits -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6>Produits à transférer</h6>
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
                      <option v-for="stock in sourceStocks" :key="stock.product_id" :value="stock.product_id">
                        {{ stock.product?.item_designation }} - Stock: {{ stock.quantity }}
                      </option>
                    </select>
                  </div>
                  <!-- Ligne 13: Quantité -->
                  <div class="col-md-4">
                    <label class="form-label small">Quantité *</label>
                    <input type="number" step="0.01" class="form-control"
                           v-model="item.quantity" required min="0.01"
                           :max="item.available_stock">
                    <small class="text-muted">Disponible: {{ item.available_stock || 0 }}</small>
                  </div>
                  <!-- Ligne 14: Bouton supprimer -->
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

          <!-- Ligne 15: Pied du modal -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
            <button type="submit" class="btn btn-info" :disabled="submitting || form.items.length === 0">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Créer le Transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ligne 16: Props
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  form: {
    type: Object,
    required: true
  },
  warehouses: {
    type: Array,
    required: true
  },
  sourceStocks: {
    type: Array,
    required: true
  },
  submitting: {
    type: Boolean,
    default: false
  }
});

// Ligne 17: Émissions
const emit = defineEmits(['close', 'submit', 'add-item', 'remove-item', 'update-stock', 'load-source-stock']);

// Ligne 18: Gestion de la soumission
const handleSubmit = () => {
  emit('submit');
};
</script>
