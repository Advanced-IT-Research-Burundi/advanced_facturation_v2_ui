<template>
  <div class="modal-overlay d-flex justify-content-center align-items-center">
    <div class="modal-card bg-white p-4 rounded shadow-lg" style="width: 90%; max-width: 800px;">
      
      <!-- HEADER -->
      <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h4 class="fw-normal">{{ isEdit ? 'Modifier Utilisateur' : 'Nouveau Utilisateur' }}</h4>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <!-- ERROR -->
      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

      <!-- FORM -->
      <form @submit.prevent="saveUser">
        <!-- NOM & EMAIL -->
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label small fw-bold">Nom</label>
            <input v-model="form.name" type="text" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-bold">Email</label>
            <input v-model="form.email" type="email" class="form-control" required />
          </div>
        </div>

        <!-- PASSWORD -->
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label small fw-bold">
              Mot de passe {{ isEdit ? '(optionnel)' : '' }}
            </label>
            <div class="input-group">
              <input
                v-model="form.password"
                :required="!isEdit"
                minlength="8"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
              />
              <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-bold">
              Confirmer {{ isEdit ? '(optionnel)' : '' }}
            </label>
            <div class="input-group">
              <input
                v-model="form.password_confirmation"
                :required="!isEdit"
                :type="showPasswordConfirm ? 'text' : 'password'"
                class="form-control"
              />
              <button type="button" class="btn btn-outline-secondary" @click="showPasswordConfirm = !showPasswordConfirm">
                <i :class="showPasswordConfirm ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- PASSWORD ERROR -->
        <div v-if="passwordError" class="alert alert-danger py-2">{{ passwordError }}</div>

        <!-- COMPANY & ROLES -->
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label small fw-bold">Entreprise</label>
            <select v-model="form.company_id" class="form-select" required>
              <option :value="null">Sélectionner...</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-bold">Rôles <span class="text-danger">*</span></label>
            <div class="border rounded p-2" style="max-height: 180px; overflow-y: auto;">
              <div v-if="loadingRoles" class="text-center py-3">
                <div class="spinner-border spinner-border-sm"></div>
              </div>
              <div v-else-if="roles.length === 0" class="text-muted small text-center py-2">
                Aucun rôle disponible
              </div>
              <div v-else>
                <div v-for="role in roles" :key="role.id" class="form-check mb-2">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :id="`role-${role.id}`"
                    :value="role.id"
                    v-model="form.roles"
                  />
                  <label class="form-check-label" :for="`role-${role.id}`">
                    <strong>{{ role.label }}</strong>
                    <small class="d-block text-muted">{{ role.description }}</small>
                  </label>
                </div>
              </div>
            </div>
            <div v-if="form.roles.length === 0" class="text-danger small mt-1">
              <i class="bi bi-exclamation-circle me-1"></i>Au moins un rôle requis
            </div>
          </div>
        </div>

        <!-- BUTTONS -->
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
          <button 
            type="submit" 
            class="btn btn-primary px-4" 
            :disabled="isSaving || form.roles.length === 0 || loadingRoles"
          >
            <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
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
  user: { type: Object, default: null }
});

const isEdit = computed(() => !!props.user);
const isSaving = ref(false);
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  company_id: null,
  roles: []
});

const companies = computed(() => store.getters['users/allCompanies']);
const roles = computed(() => store.getters['users/allRoles']);
const loadingRoles = computed(() => store.getters['users/isLoadingRoles']);

const passwordError = computed(() => {
  if (!isEdit.value || form.password) {
    if (form.password !== form.password_confirmation) {
      return 'Les mots de passe ne correspondent pas';
    }
  }
  return '';
});

const resetForm = () => {
  form.name = '';
  form.email = '';
  form.password = '';
  form.password_confirmation = '';
  form.company_id = null;
  form.roles = [];
};

watch(
  () => props.user,
  (user) => {
    if (user) {
      form.name = user.name;
      form.email = user.email;
      form.company_id = user.company_id;
      form.roles = user.roles?.map(r => r.id) || [];
      form.password = '';
      form.password_confirmation = '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const saveUser = async () => {
  if (passwordError.value || form.roles.length === 0) return;

  isSaving.value = true;
  errorMessage.value = '';

  try {
    const userData = {
      name: form.name,
      email: form.email,
      company_id: form.company_id,
      roles: form.roles
    };

    if (form.password?.length > 0) {
      userData.password = form.password;
      userData.password_confirmation = form.password_confirmation;
    }

    if (isEdit.value) {
      await store.dispatch('users/updateUser', { id: props.user.id, ...userData });
    } else {
      await store.dispatch('users/addUser', userData);
    }

    emit('refresh');
    emit('close');
  } catch (e) {
    console.error('Erreur:', e);
    errorMessage.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  store.dispatch('users/fetchCompanies');
  store.dispatch('users/fetchRoles').catch((error) => {
    errorMessage.value = 'Impossible de charger les rôles';
    console.error('Erreur chargement rôles:', error);
  });
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
.form-control:focus, .form-select:focus {
  box-shadow: none;
  border-color: #0d6efd;
}
</style>