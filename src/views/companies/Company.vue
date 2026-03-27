<template>
  <div class="container-fluid p-0">
    <CompanyHader />
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Entreprises</h1>
      <button class="btn btn-primary" @click="openModal()">
        <i class="bi bi-plus-lg"></i> Ajouter une entreprise
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input 
                type="text" 
                class="form-control border-start-0 ps-0" 
                placeholder="Rechercher par nom, TIN..." 
                v-model="searchQuery"
                @input="handleSearch"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Table -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading && companies.length === 0" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 80px;">Logo</th>
                <th>Nom</th>
                <th>NIF (TIN)</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in companies" :key="company.id">
                <td>
                  <img v-if="company.company_logo" :src="getImageUrl(company.company_logo)" class="rounded-circle border" width="40" height="40" style="object-fit: cover;">
                  <div v-else class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border" style="width: 40px; height: 40px;">
                    <i class="bi bi-building"></i>
                  </div>
                </td>
                <td class="fw-bold">
                  {{ company.name }}<br>
                  <small class="text-muted">{{ company.tp_name }}</small>
                </td>
                <td>{{ company.tp_TIN }}</td>
                <td>
                  <span class="badge" :class="company.tp_type == '1' ? 'bg-info' : 'bg-primary'">
                    {{ company.tp_type == '1' ? 'Physique' : 'Morale' }}
                  </span>
                </td>
                <td>
                  <div><i class="bi bi-telephone text-muted me-1"></i> {{ company.tp_phone_number }}</div>
                  <div class="small text-muted">{{ company.tp_address_province }}, {{ company.tp_address_commune }}</div>
                </td>
                <td>
                   <button class="btn btn-sm btn-outline-info me-2" @click="viewDetails(company)" title="Voir">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(company)" title="Modifier">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(company.id)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="companies.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  Aucune entreprise trouvée.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="pagination.last_page > 1" class="d-flex justify-content-center mt-3">
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <button class="page-link" @click="changePage(pagination.current_page - 1)">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
            <li class="page-item" :class="{ active: pagination.current_page === page }" v-for="page in getPageRange()" :key="page">
              <button class="page-link" @click="changePage(page)">{{ page }}</button>
            </li>
            <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
              <button class="page-link" @click="changePage(pagination.current_page + 1)">
                 <i class="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- ADD/EDIT Modal -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi" :class="isEditing ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
              {{ isEditing ? 'Modifier' : 'Ajouter' }} une entreprise
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="companyForm">
              
              <!-- Logo Upload Section -->
              <div class="row g-3 mb-4">
                 <div class="col-12 text-center">
                    <div class="position-relative d-inline-block group-hover">
                      <img :src="previewImage || placeholderImage" class="rounded-circle shadow-sm border" width="100" height="100" style="object-fit: cover;">
                      <label for="logoInput" class="position-absolute bottom-0 end-0 bg-primary text-white p-1 rounded-circle cursor-pointer shadow-sm hover-scale" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-camera"></i>
                      </label>
                      <input type="file" id="logoInput" class="d-none" @change="handleFileUpload" accept="image/*">
                    </div>
                    <div class="small text-muted mt-2">Logo de l'entreprise</div>
                 </div>
              </div>

              <!-- Section 1: Identité -->
              <h6 class="border-bottom pb-2 mb-3 text-primary"><i class="bi bi-card-checklist me-2"></i>Identité</h6>
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
              <h6 class="border-bottom pb-2 mb-3 mt-4 text-primary"><i class="bi bi-geo-alt me-2"></i>Coordonnées</h6>
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
              <h6 class="border-bottom pb-2 mb-3 mt-4 text-primary"><i class="bi bi-bank me-2"></i>Informations Fiscales</h6>
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
              <h6 class="border-bottom pb-2 mb-3 mt-4 text-primary"><i class="bi bi-gear me-2"></i>Configuration & OBR</h6>
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

    <!-- DETAILS Modal -->
    <div v-if="showDetailModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
             <button type="button" class="btn-close" @click="closeDetailModal"></button>
          </div>
          <div class="modal-body text-center pt-0">
             <!-- Cover / Header -->
             <div class="mb-4">
                <img :src="getImageUrl(selectedCompany.company_logo)" class="rounded-circle shadow-lg border border-3 border-white mb-3" width="120" height="120" style="object-fit: cover; margin-top: -60px; background:white;"  v-if="selectedCompany.company_logo">
                <div v-else class="rounded-circle bg-light d-inline-flex align-items-center justify-content-center text-primary border border-3 border-white mb-3 shadow-lg" style="width: 120px; height: 120px; margin-top: -20px;">
                    <i class="bi bi-building fs-1"></i>
                </div>
                <h2 class="h4 mb-1">{{ selectedCompany.name }}</h2>
                <div class="text-muted small">{{ selectedCompany.tp_name }}</div>
                 <span class="badge bg-light text-dark mt-2 border">NIF: {{ selectedCompany.tp_TIN }}</span>
             </div>

             <!-- Details Grid -->
             <div class="row g-4 text-start px-3">
                <div class="col-md-6">
                   <h6 class="text-uppercase text-xs fw-bolder text-primary mb-3">Détails Juridiques</h6>
                   <ul class="list-unstyled text-sm">
                      <li class="mb-2"><span class="text-muted d-block small">Type</span> {{ selectedCompany.tp_type == '1' ? 'Personne Physique' : 'Personne Morale' }}</li>
                      <li class="mb-2"><span class="text-muted d-block small">Forme Juridique</span> {{ selectedCompany.tp_legal_form || '-' }}</li>
                      <li class="mb-2"><span class="text-muted d-block small">RC / Trade No.</span> {{ selectedCompany.tp_trade_number || '-' }}</li>
                      <li class="mb-2"><span class="text-muted d-block small">Secteur</span> {{ selectedCompany.tp_activity_sector || '-' }}</li>
                   </ul>
                </div>
                <div class="col-md-6">
                   <h6 class="text-uppercase text-xs fw-bolder text-primary mb-3">Coordonnées</h6>
                   <ul class="list-unstyled text-sm">
                      <li class="mb-2"><i class="bi bi-geo-alt me-2 text-primary"></i> {{ selectedCompany.tp_address_province }}, {{ selectedCompany.tp_address_commune }}</li>
                      <li class="mb-2 ms-4 text-muted small">{{ selectedCompany.tp_address_quartier }}, {{ selectedCompany.tp_address_avenue }}</li>
                      <li class="mb-2"><i class="bi bi-telephone me-2 text-primary"></i> {{ selectedCompany.tp_phone_number || '-' }}</li>
                      <li class="mb-2"><i class="bi bi-globe me-2 text-primary"></i> {{ selectedCompany.web_site || '-' }}</li>
                   </ul>
                </div>
                 <div class="col-12">
                   <div class="p-3 bg-light rounded border">
                      <h6 class="text-uppercase text-xs fw-bolder text-primary mb-2">Configuration Fiscale</h6>
                      <div class="d-flex flex-wrap gap-2">
                         <span class="badge" :class="selectedCompany.vat_taxpayer === 'YES' ? 'bg-success' : 'bg-secondary'">TVA</span>
                         <span class="badge" :class="selectedCompany.ct_taxpayer === 'YES' ? 'bg-success' : 'bg-secondary'">Taxe Conso.</span>
                         <span class="badge" :class="selectedCompany.tl_taxpayer === 'YES' ? 'bg-success' : 'bg-secondary'">Prélèvement Forf.</span>
                         <span class="badge bg-dark">Centre: {{ selectedCompany.tp_fiscal_center }}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          <div class="modal-footer bg-light border-0">
             <button class="btn btn-outline-primary" @click="editFromDetail(selectedCompany)">Modifier</button>
             <button class="btn btn-secondary" @click="closeDetailModal">Fermer</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive } from "vue";
import { useStore } from "vuex";
import CompanyHader from "./CompanyHader.vue";
import { useConfirm } from '@/composables/useConfirm';

const store = useStore();
const { confirm: confirmDialog } = useConfirm();

// State
const showModal = ref(false);
const showDetailModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const searchQuery = ref("");
const searchTimeout = ref(null);
const selectedCompany = ref({});
const previewImage = ref(null);
const logoFile = ref(null);

// Getters from Store
const companies = computed(() => store.getters["companies/allCompanies"]);
const pagination = computed(() => store.getters["companies/getPagination"]);
const loading = computed(() => store.getters["companies/isLoading"]);
const error = computed(() => store.getters["companies/getError"]);

const placeholderImage = "https://via.placeholder.com/100?text=Logo";

// Form Data configuration
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
  store.dispatch("companies/fetchCompanies", { page, search: searchQuery.value });
};

// Search with Debounce
const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    store.dispatch("companies/fetchCompanies", { page: 1, search: searchQuery.value });
  }, 500);
};

const getPageRange = () => {
  const range = [];
  for (let i = 1; i <= pagination.value.last_page; i++) {
    range.push(i);
  }
  // Ideally implement smarter range 1, 2, ..., 10
  return range.length > 10 ? range.slice(0, 10) : range; 
};

// Image Utilities
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Adjust base URL as needed based on where Laravel stores public files
  // e.g., if storing in 'public/storage', then URL is 'http://api-url/storage/...'
  // Assuming the API returns a relative path or full URL. If relative:
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const storageBase = baseUrl.replace(/\/api\/?$/, '');
  return `${storageBase}/storage/${path}`;
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    logoFile.value = file;
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Action Modals
const openModal = (company = null) => {
  if (company) {
    isEditing.value = true;
    editId.value = company.id;
    logoFile.value = null;
    previewImage.value = company.company_logo ? getImageUrl(company.company_logo) : null;
    
    // Populate form
    Object.keys(form).forEach((key) => {
      form[key] = company[key] || ""; 
    });
    form.tp_type = String(company.tp_type);
  } else {
    isEditing.value = false;
    editId.value = null;
    logoFile.value = null;
    previewImage.value = null;
    Object.assign(form, initForm());
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const viewDetails = (company) => {
  selectedCompany.value = company;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
    showDetailModal.value = false;
};

const editFromDetail = (company) => {
    closeDetailModal();
    openModal(company);
};

const submitForm = async () => {
  // Construct payload
  const payload = { ...form };
  if (logoFile.value) {
    payload.company_logo = logoFile.value;
  }

  let result;
  if (isEditing.value) {
    result = await store.dispatch("companies/updateCompany", { id: editId.value, data: payload });
  } else {
    result = await store.dispatch("companies/createCompany", payload);
  }

  if (result.success) {
    closeModal();
    store.dispatch("companies/fetchCompanies", { page: pagination.value.current_page, search: searchQuery.value });
  } else {
     // Error handled by store
  }
};

const confirmDelete = async (id) => {
  if (await confirmDialog("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
    await store.dispatch("companies/deleteCompany", id);
    store.dispatch("companies/fetchCompanies", { page: pagination.value.current_page, search: searchQuery.value });
  }
};
</script>

<style scoped>
.card {
  border: none;
  background: white;
  border-radius: 12px;
}
.modal.show {
  display: block;
}
.hover-scale {
    transition: transform 0.2s;
}
.hover-scale:hover {
    transform: scale(1.1);
}
.cursor-pointer {
    cursor: pointer;
}
.group-hover:hover .shadow-sm {
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
</style>
