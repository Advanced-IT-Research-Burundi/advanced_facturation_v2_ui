<template>
  <div class="modal-overlay d-flex justify-content-center align-items-center">
    <div class="modal-card bg-white p-4 rounded shadow-lg" style="width: 90%; max-width: 1100px;">
      <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h4 class="fw-normal">Nouveau Client</h4>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <form @submit.prevent="saveClient">
        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <label class="form-label text-muted small fw-bold text-uppercase">
              Type de Client <span class="text-danger">*</span>
            </label>
            <select v-model="form.type" class="form-select mb-3" required>
              <option value="">--- SELECT ---</option>
              <option value="PERSONNE PHYSIQUE">PERSONNE PHYSIQUE OU SOCIETE ETRANGERE</option>
              <option value="PERSONNE MORAL">PERSONNE MORAL</option>
            </select>

            <label class="form-label text-muted small fw-bold text-uppercase">Nif du client</label>
            <div class="position-relative">
              <input v-model="form.customer_TIN" type="text" class="form-control border-success-subtle" />
              <span v-if="form.customer_TIN" class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label text-muted small fw-bold text-uppercase">
              Client assujeti a la TVA ou non <span class="text-danger">*</span>
            </label>
            <select v-model="form.vat_customer_payer" class="form-select mb-3" required>
              <option value="Non assujetti">Non assujetti</option>
              <option value="assujetti à la TVA">assujetti à la TVA</option>
            </select>

            <label class="form-label text-muted small fw-bold text-uppercase">Telephone</label>
            <div class="position-relative">
              <input v-model="form.customer_phone" type="text" class="form-control border-success-subtle" />
              <span v-if="form.customer_phone" class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label text-muted small fw-bold text-uppercase">
              Nom <span class="text-danger">*</span>
            </label>
            <div class="position-relative mb-3">
              <input v-model="form.customer_name" type="text" class="form-control border-success-subtle" required />
              <span v-if="form.customer_name" class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>

            <label class="form-label text-muted small fw-bold text-uppercase">Adresse</label>
            <div class="position-relative">
              <input v-model="form.customer_address" type="text" class="form-control border-success-subtle" />
              <span v-if="form.customer_address" class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center">
          <button type="submit" class="btn btn-red px-5 py-2 w-50 text-white fw-bold" :disabled="isSaving">
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
        <p class="text-center mt-3 small text-muted text-uppercase">
          Les champs marqués d'un <span class="text-danger">*</span> sont obligatoires
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from '@/composables/useToast';

const emit = defineEmits(['close']);
const store = useStore();
const toast = useToast();
const isSaving = ref(false);

const form = reactive({
  customer_name: '',
  customer_TIN: '',
  customer_phone: '',
  customer_address: '',
  vat_customer_payer: 'Non assujetti',
  company_id: 1, 
  type: '',
  description: ''
});

const saveClient = async () => {
  if (!form.customer_name || !form.type) {
    toast.error("Veuillez remplir les champs obligatoires.");
    return;
  }

  isSaving.value = true;
  try {
    const result = await store.dispatch('clients/addClient', form);
    if (result.success) {
      emit('close');
    } else {
      const errorMsg = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || "Erreur lors de l'enregistrement");
      toast.error(errorMsg);
    }
  } catch (e) {
    const errorMsg = e.errors ? Object.values(e.errors).flat().join('\n') : "Erreur lors de l'enregistrement";
    toast.error(errorMsg);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
}

/* Thème rouge pour le bouton */
.btn-red {
  background-color: #c51818;
  border-color: #c51818;
  transition: all 0.2s;
}

.btn-red:hover {
  background-color: #9b0e0e;
  transform: translateY(-1px);
}

.form-control:focus, .form-select:focus {
  box-shadow: none;
  border-color: #c51818;
}

.border-success-subtle {
  border-color: #a3cfbb !important;
}

/* Animation d'entrée */
.modal-card {
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>