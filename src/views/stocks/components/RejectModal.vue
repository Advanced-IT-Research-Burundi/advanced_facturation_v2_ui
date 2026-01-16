<template>
  <!-- Ligne 1: Modal de rejet -->
  <div v-if="show" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- Ligne 2: En-tête du modal -->
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title">Rejeter le Transfert</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- Ligne 3: Formulaire -->
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <!-- Ligne 4: Info transfert -->
            <p>Transfert: <strong>{{ transfer?.transfer_code }}</strong></p>
            <!-- Ligne 5: Raison du rejet -->
            <div class="mb-3">
              <label class="form-label">Raison du rejet *</label>
              <textarea
                class="form-control"
                :value="reason"
                @input="$emit('update:reason', $event.target.value)"
                rows="3"
                required
              ></textarea>
            </div>
          </div>

          <!-- Ligne 6: Pied du modal -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
            <button type="submit" class="btn btn-danger" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Confirmer le Rejet
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ligne 7: Props
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  transfer: {
    type: Object,
    default: null
  },
  reason: {
    type: String,
    default: ''
  },
  submitting: {
    type: Boolean,
    default: false
  }
});

// Ligne 8: Émissions
const emit = defineEmits(['close', 'submit', 'update:reason']);

// Ligne 9: Gestion de la soumission
const handleSubmit = () => {
  emit('submit');
};
</script>
