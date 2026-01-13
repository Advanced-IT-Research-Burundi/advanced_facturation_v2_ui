<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Entreprises</h1>
      <button class="btn btn-primary" @click="openModal()">
        <i class="bi bi-plus-lg"></i> Ajouter une entreprise
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Table -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Nom</th>
                <th>NIF (TIN)</th>
                <th>Type</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in companies" :key="company.id">
                <td class="fw-bold">{{ company.name }}</td>
                <td>{{ company.tp_TIN }}</td>
                <td>
                  <span class="badge" :class="company.tp_type == '1' ? 'bg-info' : 'bg-primary'">
                    {{ company.tp_type == '1' ? 'Physique' : 'Morale' }}
                  </span>
                </td>
                <td>{{ company.tp_phone_number }}</td>
                <td>{{ company.tp_address_province }}, {{ company.tp_address_commune }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(company)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(company.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="companies.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">Aucune entreprise trouvée.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="pagination.last_page > 1" class="d-flex justify-content-center mt-3">
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <button class="page-link" @click="changePage(pagination.current_page - 1)">Précédent</button>
            </li>
            <li class="page-item" :class="{ active: pagination.current_page === page }" v-for="page in pagination.last_page" :key="page">
              <button class="page-link" @click="changePage(page)">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
              <button class="page-link" @click="changePage(pagination.current_page + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal Form (Overlay) -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Modifier' : 'Ajouter' }} une entreprise</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="companyForm">
              
              <!-- Section 1: Identité -->
              <h6 class="border-bottom pb-2 mb-3 text-primary">Identité</h6>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Nom de l'entreprise *</label>
                  <input type="text" class="form-control" v-model="form.name" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Type *</label>
                  <select class="form-select" v-model="form.tp_type" required>
                    <option value="1">Personne Physique</option>
                    <option value="2">Personne Morale</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">NIF (TIN) *</label>
                  <input type="text" class="form-control" v-model="form.tp_TIN" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nom commercial (TP Name) *</label>
                  <input type="text" class="form-control" v-model="form.tp_name" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label">RC / Trade Number</label>
                  <input type="text" class="form-control" v-model="form.tp_trade_number">
                </div>
                 <div class="col-md-3">
                  <label class="form-label">Forme Juridique</label>
                  <input type="text" class="form-control" v-model="form.tp_legal_form" placeholder="Ex: SA, SARL">
                </div>
              </div>

              <!-- Section 2: Coordonnées -->
              <h6 class="border-bottom pb-2 mb-3 mt-4 text-primary">Coordonnées</h6>
              <div class="row g-3 mb-3">
                <div class="col-md-3">
                  <label class="form-label">Province</label>
                  <input type="text" class="form-control" v-model="form.tp_address_province">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Commune</label>
                  <input type="text" class="form-control" v-model="form.tp_address_commune">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Quartier</label>
                  <input type="text" class="form-control" v-model="form.tp_address_quartier">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Avenue</label>
                  <input type="text" class="form-control" v-model="form.tp_address_avenue">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Rue</label>
                  <input type="text" class="form-control" v-model="form.tp_address_rue">
                </div>
                <div class="col-md-2">
                  <label class="form-label">Numéro</label>
                  <input type="text" class="form-control" v-model="form.tp_address_number">
                </div>
                 <div class="col-md-3">
                  <label class="form-label">Boîte Postale</label>
                  <input type="text" class="form-control" v-model="form.tp_postal_number">
                </div>
                 <div class="col-md-3">
                  <label class="form-label">Téléphone</label>
                  <input type="text" class="form-control" v-model="form.tp_phone_number">
                </div>
              </div>

              <!-- Section 3: Infos Fiscales -->
              <h6 class="border-bottom pb-2 mb-3 mt-4 text-primary">Informations Fiscales</h6>
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label">Centre Fiscal</label>
                  <select class="form-select" v-model="form.tp_fiscal_center">
                    <option value="DPMC">DPMC (Grands Contribuables)</option>
                    <option value="DMC">DMC (Moyens Contribuables)</option>
                    <option value="DGC">DGC</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Secteur d'activité</label>
                  <input type="text" class="form-control" v-model="form.tp_activity_sector">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Assujetti TVA?</label>
                  <select class="form-select" v-model="form.vat_taxpayer">
                    <option value="YES">OUI</option>
                    <option value="NO">NON</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Taxe Consommation (CT)?</label>
                  <select class="form-select" v-model="form.ct_taxpayer">
                    <option value="YES">OUI</option>
                    <option value="NO">NON</option>
                  </select>
                </div>
                 <div class="col-md-4">
                  <label class="form-label">Prélèvement Forfaitaire (TL)?</label>
                  <select class="form-select" v-model="form.tl_taxpayer">
                    <option value="YES">OUI</option>
                    <option value="NO">NON</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">ID Système (OBR)</label>
                  <input type="text" class="form-control" v-model="form.system_or_device_id">
                </div>
              </div>

               <!-- Section 4: Autres -->
              <h6 class="border-bottom pb-2 mb-3 mt-4 text-primary">Configuration & OBR</h6>
              <div class="row g-3 mb-3">
                 <div class="col-md-3">
                  <label class="form-label">Devise par défaut</label>
                  <input type="text" class="form-control" v-model="form.default_currency" placeholder="FBu">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Utilisateur OBR</label>
                  <input type="text" class="form-control" v-model="form.obr_username">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Mot de passe OBR</label>
                  <input type="password" class="form-control" v-model="form.obr_password">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Site Web</label>
                  <input type="text" class="form-control" v-model="form.web_site">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" v-model="form.description" rows="2"></textarea>
              </div>

            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="companyForm" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Enregistrer') }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive } from "vue";
import { useStore } from "vuex";

const store = useStore();

// State
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);

// Getters from Store
const companies = computed(() => store.getters["companies/allCompanies"]);
const pagination = computed(() => store.getters["companies/getPagination"]);
const loading = computed(() => store.getters["companies/isLoading"]);
const error = computed(() => store.getters["companies/getError"]);

// Form Data
const initForm = () => ({
  name: "",
  tp_type: "1",
  tp_name: "",
  tp_TIN: "",
  tp_trade_number: "",
  tp_postal_number: "",
  tp_phone_number: "",
  tp_address_province: "",
  tp_address_commune: "",
  tp_address_quartier: "",
  tp_address_avenue: "",
  tp_address_rue: "",
  tp_address_number: "",
  tp_fiscal_center: "DPMC",
  tp_activity_sector: "",
  tp_legal_form: "",
  vat_taxpayer: "YES",
  ct_taxpayer: "NO",
  tl_taxpayer: "NO",
  system_or_device_id: "",
  default_currency: "FBu",
  obr_username: "",
  obr_password: "",
  web_site: "",
  tp_banque: "",
  tp_compte_name: "",
  description: "",
});

const form = reactive(initForm());

onMounted(() => {
  store.dispatch("companies/fetchCompanies");
});

const changePage = (page) => {
  store.dispatch("companies/fetchCompanies", page);
};

// Modal Actions
const openModal = (company = null) => {
  if (company) {
    isEditing.value = true;
    editId.value = company.id;
    // Populate form
    Object.keys(form).forEach((key) => {
      form[key] = company[key] || ""; // Handle nulls
    });
    // Ensure selects are strings if needed
    form.tp_type = String(company.tp_type);
  } else {
    isEditing.value = false;
    editId.value = null;
    Object.assign(form, initForm());
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// CRUD Actions
const submitForm = async () => {
  let result;
  if (isEditing.value) {
    result = await store.dispatch("companies/updateCompany", { id: editId.value, data: { ...form } });
  } else {
    result = await store.dispatch("companies/createCompany", { ...form });
  }

  if (result.success) {
    closeModal();
  } else {
    // Error is handled in store state
  }
};

const confirmDelete = async (id) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
    await store.dispatch("companies/deleteCompany", id);
  }
};
</script>

<style scoped>
/* Glassmorphism card effect from template */
.card {
  border: none;
  background: white;
  border-radius: 12px;
}
.modal.show {
  display: block;
}
</style>
