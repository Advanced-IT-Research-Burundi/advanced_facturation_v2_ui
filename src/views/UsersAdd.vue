<template>
  <div class="modal-overlay d-flex justify-content-center align-items-center">
    <div class="modal-card bg-white p-4 rounded shadow-lg" style="width: 90%; max-width: 800px;">
      
      <!-- HEADER -->
      <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h4 class="fw-normal">
          {{ isEdit ? 'Modifier Utilisateur' : 'Nouveau Utilisateur' }}
        </h4>
        <button class="btn-close" @click="$emit('close')"></button>
      </div> 
      
      

      <!-- ERROR -->
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <!-- FORM -->
      <form @submit.prevent="saveUser">
        <!-- NOM & EMAIL -->
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <label class="form-label text-muted small fw-bold text-uppercase">Nom</label>
            <input
              v-model="form.name"
              type="text"
              class="form-control border-success-subtle"
              required
            />
          </div>

          <div class="col-md-6">
            <label class="form-label text-muted small fw-bold text-uppercase">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="form-control border-success-subtle"
              required
            />
          </div>
        </div>

        <!-- PASSWORD -->
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <label class="form-label text-muted small fw-bold text-uppercase">
              Mot de passe {{ isEdit ? '(optionnel)' : '' }}
            </label>
            <div class="input-group">
              <input
                v-model="form.password"
                :required="!isEdit"
                minlength="8"
                :type="showPassword ? 'text' : 'password'"
                class="form-control border-success-subtle"
              />
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label text-muted small fw-bold text-uppercase">
              Confirmer mot de passe {{ isEdit ? '(optionnel)' : '' }}
            </label>
            <div class="input-group">
              <input
                v-model="form.password_confirmation"
                :required="!isEdit"
                :type="showPasswordConfirm ? 'text' : 'password'"
                class="form-control border-success-subtle"
              />
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="showPasswordConfirm = !showPasswordConfirm"
              >
                <i :class="showPasswordConfirm ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- PASSWORD ERROR -->
        <div v-if="passwordError" class="text-danger mb-3">
          {{ passwordError }}
        </div>

        <!-- COMPANY -->
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <label class="form-label text-muted small fw-bold text-uppercase">Entreprise</label>
            <select
              v-model="form.company_id"
              class="form-select border-success-subtle"
            >
              <option :value="null">Sélectionner une entreprise</option>
              <option
                v-for="company in companies"
                :key="company.id"
                :value="company.id"
              >
                {{ company.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- ACTION -->
        <div class="d-flex justify-content-center">
          <button
            type="submit"
            class="btn btn-primary px-5 py-2 w-50"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Enregistrer') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const emit = defineEmits(['close', 'refresh']);

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
});

const isEdit = computed(() => !!props.user);

const isSaving = ref(false);
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const errorMessage = ref('');
const editUserId = ref(null); // ID séparé pour l'édition

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  company_id: null
});

/* PRE-FILL FORM IN EDIT MODE */
watch(
  () => props.user,
  (user) => {
    if (user) {
      form.name = user.name;
      form.email = user.email;
      form.company_id = user.company_id;
      editUserId.value = user.id; // Stocker l'ID séparément
      form.password = '';       
      form.password_confirmation = '';
    } else {
      // Reset form for new user
      form.name = '';
      form.email = '';
      form.password = '';   
      form.password_confirmation = '';
      form.company_id = null;
      editUserId.value = null;
    }
  },
  { immediate: true }
);

const companies = computed(() => store.getters['companies/allCompanies']);

onMounted(() => {
  store.dispatch('companies/fetchCompanies');
});

const passwordError = computed(() => {
  if (!isEdit.value || form.password) {
    if (form.password !== form.password_confirmation) {
      return 'Les mots de passe ne correspondent pas';
    }
  }
  return '';
});

const saveUser = async () => {
  // Vérifier la correspondance des mots de passe
  if (passwordError.value) return;

  isSaving.value = true;
  errorMessage.value = '';

  try {
    // Préparer les données à envoyer
    const userData = {
      name: form.name,
      email: form.email,
      company_id: form.company_id
    };

    // Inclure les mots de passe seulement s'ils sont remplis
    if (form.password && form.password.length > 0) {
      userData.password = form.password;
      userData.password_confirmation = form.password_confirmation;
    }

    if (isEdit.value) {
      // ✅ Pour la modification, inclure l'ID directement dans l'objet
      await store.dispatch('users/updateUser', { 
        id: editUserId.value,
        ...userData
      });
    } else {
      // Pour la création
      await store.dispatch('users/addUser', userData);
    }

    // Rafraîchir la liste et fermer le modal
    emit('refresh');
    emit('close');

  } catch (e) {
    console.error('Erreur lors de l\'enregistrement:', e);
    errorMessage.value = e.response?.data?.message || e.message || 'Erreur lors de l\'enregistrement';
  } finally {
    isSaving.value = false;
  }
};





</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
.form-control:focus,
.form-select:focus {
  box-shadow: none;
  border-color: #0d6efd;
}
.border-success-subtle {
  border-color: #a3cfbb !important;
}
</style>