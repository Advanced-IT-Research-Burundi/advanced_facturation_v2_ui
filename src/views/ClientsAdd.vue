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
            <label class="form-label text-muted small fw-bold text-uppercase">Type de Client</label>
            <select v-model="form.type" class="form-select mb-3">
              <option value="">--- SELECT ---</option>
              <option value="PERSONNE PHYSIQUE">PERSONNE PHYSIQUE OU SOCIETE ETRANGERE</option>
              <option value="PERSONNE MORAL">PERSONNE MORAL</option>
            </select>
            <label class="form-label text-muted small fw-bold text-uppercase">Nif du client</label>
            <div class="position-relative">
              <input v-model="form.customer_TIN" type="text" class="form-control border-success-subtle" />
              <span class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label text-muted small fw-bold text-uppercase">Client assujeti a la TVA ou non</label>
            <select v-model="form.vat_customer_payer" class="form-select mb-3">
              <option value="Non assujetti">Non assujetti</option>
              <option value="assujetti à la TVA">assujetti à la TVA</option>
            </select>
            <label class="form-label text-muted small fw-bold text-uppercase">Telephone</label>
            <div class="position-relative">
              <input v-model="form.customer_phone" type="text" class="form-control border-success-subtle" />
              <span class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label text-muted small fw-bold text-uppercase">Nom</label>
            <div class="position-relative mb-3">
              <input v-model="form.customer_name" type="text" class="form-control border-success-subtle" required />
              <span class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
            <label class="form-label text-muted small fw-bold text-uppercase">Adresse</label>
            <div class="position-relative">
              <input v-model="form.customer_address" type="text" class="form-control border-success-subtle" />
              <span class="position-absolute top-50 end-0 translate-middle-y me-2 text-success">✔</span>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center">
          <button type="submit" class="btn btn-primary px-5 py-2 w-50" :disabled="isSaving">
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useStore } from 'vuex';

const emit = defineEmits(['close']);
const store = useStore();
const isSaving = ref(false);

const form = reactive({
  customer_name: '',
  customer_TIN: '',
  customer_phone: '',
  customer_address: '',
  vat_customer_payer: 'Non assujetti',
  company_id: 1, // À dynamiser selon votre logique entreprise
  type: '',
  description: ''
});

const saveClient = async () => {
  isSaving.value = true;
  try {
    await store.dispatch('clients/addClient', form);
    emit('close');
  } catch (e) {
    alert("Erreur lors de l'enregistrement");
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
.form-control:focus, .form-select:focus {
  box-shadow: none;
  border-color: #0d6efd;
}
.border-success-subtle {
  border-color: #a3cfbb !important;
}
</style>