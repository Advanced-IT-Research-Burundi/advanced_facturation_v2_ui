<script setup>
import { ref, watch } from 'vue';
import { X, User, Phone, MapPin, Save, Loader2 } from 'lucide-vue-next';
import api from '@/services/api';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'client-created']);

const isSubmitting = ref(false);
const errorMessage = ref('');
const tinState = ref('idle');
const tinMessage = ref('');
const lastVerifiedTin = ref('');

const form = ref({
  customer_name: '',
  customer_TIN: '',
  customer_phone: '',
  customer_address: '',
  vat_customer_payer: '0',
  type: 'PERSONNE PHYSIQUE',
});

// Reset form when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = {
      customer_name: '',
      customer_TIN: '',
      customer_phone: '',
      customer_address: '',
      vat_customer_payer: '0',
      type: 'PERSONNE PHYSIQUE',
    };
    errorMessage.value = '';
    tinState.value = 'idle';
    tinMessage.value = '';
    lastVerifiedTin.value = '';
  }
});

const normalizeTin = () => (form.value.customer_TIN || '').trim();

const markTinDirty = () => {
  const currentTin = normalizeTin();
  if (currentTin !== lastVerifiedTin.value) {
    tinState.value = 'idle';
    tinMessage.value = '';
  }
};

const verifyTIN = async () => {
  const tpTIN = normalizeTin();

  if (!tpTIN) {
    tinState.value = 'idle';
    tinMessage.value = '';
    lastVerifiedTin.value = '';
    return true;
  }

  tinState.value = 'checking';
  tinMessage.value = 'Vérification du NIF en cours...';

  try {
    const response = await api.post('/customers/checkTIN', { tp_TIN: tpTIN });
    const taxpayer = response.data?.data;

    if (response.data?.success && taxpayer) {
      tinState.value = 'valid';
      tinMessage.value = `NIF valide${taxpayer.tp_name ? ` - ${taxpayer.tp_name}` : ''}`;
      lastVerifiedTin.value = tpTIN;

      if (!form.value.customer_name.trim() && taxpayer.tp_name) {
        form.value.customer_name = taxpayer.tp_name;
      }

      return true;
    }

    tinState.value = 'invalid';
    tinMessage.value = response.data?.message || 'NIF invalide.';
    lastVerifiedTin.value = '';
    return false;
  } catch (error) {
    tinState.value = 'invalid';
    tinMessage.value = error.response?.data?.message || 'Impossible de vérifier le NIF pour le moment.';
    lastVerifiedTin.value = '';
    return false;
  }
};

const submitForm = async () => {
  if (!form.value.customer_name.trim()) {
    errorMessage.value = 'Le nom du client est obligatoire';
    return;
  }

  const tpTIN = normalizeTin();
  if (tpTIN && tpTIN !== lastVerifiedTin.value) {
    const isValid = await verifyTIN();
    if (!isValid) {
      errorMessage.value = 'Le NIF saisi est invalide.';
      return;
    }
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const response = await api.post('/customers', form.value);
    
    if (response.data.success) {
      emit('client-created', response.data.data);
      emit('close');
    } else {
      errorMessage.value = response.data.message || 'Erreur lors de la création';
    }
  } catch (error) {
    console.error('Error creating client:', error);
    errorMessage.value = error.response?.data?.message || 'Erreur lors de la création du client';
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop fade show" @click="$emit('close')"></div>
    <div v-if="show" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <!-- Header -->
          <div class="modal-header bg-primary text-white border-0">
            <div class="d-flex align-items-center gap-2">
              <User :size="20" />
              <h5 class="modal-title mb-0">Nouveau Client</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4">
            <!-- Error Alert -->
            <div v-if="errorMessage" class="alert alert-danger py-2 mb-3">
              {{ errorMessage }}
            </div>

            <form @submit.prevent="submitForm">
              <!-- NIF / TIN -->
              <div class="mb-3">
                <label class="form-label small fw-semibold">NIF (Optionnel)</label>
                <div class="input-group">
                  <input
                    v-model="form.customer_TIN"
                    type="text"
                    class="form-control"
                    placeholder="Ex: 4000000000"
                    @input="markTinDirty"
                    @blur="verifyTIN"
                  />
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="verifyTIN"
                    title="Vérifier le NIF"
                    :disabled="tinState === 'checking'"
                  >
                    <Loader2 v-if="tinState === 'checking'" :size="16" class="animate-spin" />
                    <i v-else class="bi bi-search"></i>
                  </button>
                </div>
                <small
                  v-if="tinMessage"
                  class="d-block mt-1"
                  :class="{
                    'text-success': tinState === 'valid',
                    'text-danger': tinState === 'invalid',
                    'text-muted': tinState === 'checking' || tinState === 'idle'
                  }"
                >
                  {{ tinMessage }}
                </small>
                <small class="text-muted">Entrez le NIF pour auto-remplir les informations</small>
              </div>

              <!-- Nom -->
              <div class="mb-3">
                <label class="form-label small fw-semibold">
                  Nom du Client <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.customer_name"
                  type="text"
                  class="form-control"
                  placeholder="Nom complet ou raison sociale"
                  required
                />
              </div>

              <!-- Téléphone -->
              <div class="mb-3">
                <label class="form-label small fw-semibold">Téléphone</label>
                <div class="input-group">
                  <span class="input-group-text bg-light">
                    <Phone :size="16" />
                  </span>
                  <input
                    v-model="form.customer_phone"
                    type="tel"
                    class="form-control"
                    placeholder="Ex: +257 79 000 000"
                  />
                </div>
              </div>

              <!-- Adresse -->
              <div class="mb-3">
                <label class="form-label small fw-semibold">Adresse</label>
                <div class="input-group">
                  <span class="input-group-text bg-light">
                    <MapPin :size="16" />
                  </span>
                  <input
                    v-model="form.customer_address"
                    type="text"
                    class="form-control"
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <!-- Assujetti TVA -->
              <div class="mb-3">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="vatPayer"
                    :checked="form.vat_customer_payer === '1'"
                    @change="form.vat_customer_payer = $event.target.checked ? '1' : '0'"
                  />
                  <label class="form-check-label small" for="vatPayer">
                    Client assujetti à la TVA
                  </label>
                </div>
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-0 bg-light">
            <button type="button" class="btn btn-light" @click="$emit('close')" :disabled="isSubmitting">
              Annuler
            </button>
            <button 
              type="button" 
              class="btn btn-primary d-flex align-items-center gap-2"
              @click="submitForm"
              :disabled="isSubmitting || !form.customer_name.trim()"
            >
              <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
              <Save v-else :size="18" />
              {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal {
  background: rgba(0, 0, 0, 0.5);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
