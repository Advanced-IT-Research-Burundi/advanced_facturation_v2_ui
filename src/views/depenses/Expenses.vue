<template>
  <div class="container-fluid p-0">
    <!-- Header -->
    <depense-header></depense-header>
    
    <!-- Controls & Dashboard -->
    <div class="row g-4 mb-4">
       <!-- Dashboard Card -->
       <div class="col-md-12 col-xl-4">
           <div class="card shadow-sm border-0 bg-primary text-white h-100">
               <div class="card-body">
                   <h6 class="text-white-50 text-uppercase mb-2">Total Dépenses</h6>
                   <h2 class="display-6 mb-0 fw-bold">{{ formatCurrency(totalVal) }}</h2>
                   <div class="mt-2 small text-white-50">
                       Période sélectionnée
                   </div>
               </div>
           </div>
       </div>

       <!-- Filters -->
       <div class="col-md-12 col-xl-8">
           <div class="card shadow-sm border-0 h-100">
               <div class="card-body">
                   <div class="row g-3">
                       <div class="col-md-6 col-lg-3">
                           <label class="form-label small text-muted">Recherche</label>
                           <input type="text" class="form-control" placeholder="Mot-clé..." v-model="filters.search" @input="handleSearch">
                       </div>
                       <div class="col-md-6 col-lg-3">
                          <label class="form-label small text-muted">Catégorie</label>
                          <select class="form-select" v-model="filters.category_id" @change="applyFilters">
                              <option value="">Toutes</option>
                              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                          </select>
                       </div>
                       <div class="col-md-6 col-lg-3">
                           <label class="form-label small text-muted">Du</label>
                           <input type="date" class="form-control" v-model="filters.start_date" @change="applyFilters">
                       </div>
                       <div class="col-md-6 col-lg-3">
                           <label class="form-label small text-muted">Au</label>
                           <input type="date" class="form-control" v-model="filters.end_date" @change="applyFilters">
                       </div>
                       <div class="col-12 d-flex gap-2 justify-content-end align-items-end">
                           <button class="btn btn-outline-secondary" @click="resetFilters">
                               <i class="bi bi-arrow-counterclockwise"></i>
                           </button>
                           <div class="dropdown">
                              <button class="btn btn-outline-success dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                  <i class="bi bi-download me-1"></i> Exporter
                              </button>
                              <ul class="dropdown-menu">
                                  <li><a class="dropdown-item" href="#" @click.prevent="exportData('pdf')"><i class="bi bi-file-pdf me-2"></i>PDF</a></li>
                                  <li><a class="dropdown-item" href="#" @click.prevent="exportData('excel')"><i class="bi bi-file-earmark-excel me-2"></i>Excel</a></li>
                              </ul>
                           </div>
                           <button class="btn btn-primary" @click="openCreateModal">
                                <i class="bi bi-plus-lg me-1"></i> Nouvelle Dépense
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>

    <!-- Table -->
    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <div v-if="loading && expenses.length === 0" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">Description</th>
                <th>Catégorie</th>
                <th>Justificatif</th>
                <th>Date</th>
                <th class="text-end">Montant</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td class="ps-4">
                    <div class="fw-bold text-dark">{{ expense.name }}</div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border" v-if="expense.depense_category">{{ expense.depense_category.name }}</span>
                    <span class="text-muted small" v-else>-</span>
                </td>
                <td>
                    <button v-if="expense.justification_file" @click="viewJustification(expense.id)" class="btn btn-sm btn-link text-decoration-none p-0">
                        <i class="bi bi-paperclip me-1"></i>Voir
                    </button>
                    <span v-else class="text-muted small">-</span>
                </td>
                <td class="text-muted small">{{ formatDate(expense.created_at) }}</td>
                <td class="text-end fw-bold text-dark">{{ formatCurrency(expense.montant) }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-link text-primary p-1" @click="openEditModal(expense)">
                      <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-link text-danger p-1" @click="confirmDelete(expense)">
                      <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="expenses.length === 0">
                 <td colspan="6" class="text-center py-5 text-muted">
                     <i class="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                     Aucune dépense trouvée pour cette période.
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="d-flex justify-content-center py-3 border-top" v-if="pagination.last_page > 1">
            <nav>
                <ul class="pagination mb-0">
                    <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                        <button class="page-link" @click="changePage(pagination.current_page - 1)">Précédent</button>
                    </li>
                    <li class="page-item active"><span class="page-link">{{ pagination.current_page }} / {{ pagination.last_page }}</span></li>
                    <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                        <button class="page-link" @click="changePage(pagination.current_page + 1)">Suivant</button>
                    </li>
                </ul>
            </nav>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">
                {{ isEditing ? 'Modifier la dépense' : 'Nouvelle Dépense' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="expenseForm">
              <div class="mb-3">
                <label class="form-label small text-muted text-uppercase fw-bold">Libellé</label>
                <input type="text" class="form-control" v-model="form.name" required placeholder="Ex: Facture électricité...">
              </div>
              <div class="row g-3 mb-3">
                  <div class="col-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">Montant</label>
                      <div class="input-group">
                          <input type="number" class="form-control" v-model="form.montant" required min="0" step="0.01">
                          <span class="input-group-text">FBu</span>
                      </div>
                  </div>
                  <div class="col-6">
                      <label class="form-label small text-muted text-uppercase fw-bold">Catégorie</label>
                      <select class="form-select" v-model="form.depense_category_id" required>
                          <option value="" disabled>Sélectionner...</option>
                          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                      </select>
                  </div>
              </div>
              
              <div class="mb-3">
                 <label class="form-label small text-muted text-uppercase fw-bold">Justificatif (PDF/Image)</label>
                 <input type="file" class="form-control" @change="handleFileUpload" accept="image/*,.pdf">
                 <div v-if="isEditing && form.existing_file" class="form-text">
                     Fichier actuel: <button type="button" class="btn btn-link btn-sm p-0" @click="viewJustification(form.id)">Voir</button>
                 </div>
              </div>
              
              <!-- Hidden or auto-handled fields: company_id, date (if manual date needed, add inputs) -->
            </form>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-outline-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="expenseForm" class="btn btn-primary px-4" :disabled="submitting">
               {{ submitting ? 'Enregistrement...' : 'Valider' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, reactive } from "vue";
import { useStore } from "vuex";
import DepenseHeader from "./DepenseHeader.vue";

const store = useStore();

// State
const showModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const fileInput = ref(null);
const searchTimeout = ref(null);

const filters = reactive({
    search: "",
    category_id: "",
    start_date: "",
    end_date: ""
});

const form = reactive({
  id: null,
  name: "",
  montant: "",
  depense_category_id: "",
  justification_file: null,
  existing_file: null
});

// Getters
const expenses = computed(() => store.getters["expenses/allExpenses"]);
const categories = computed(() => store.getters["expenses/allCategories"]); // Ensure fetchCategories called
const loading = computed(() => store.getters["expenses/isLoading"]);
const pagination = computed(() => store.getters["expenses/paginationExpenses"]);
const totalVal = computed(() => store.getters["expenses/totalExpensesVal"]);

onMounted(() => {
  fetchData();
  // Fetch categories for dropdown
  store.dispatch("expenses/fetchCategories", { page: -1 }); 
});

const fetchData = (page = 1) => {
    store.dispatch("expenses/fetchExpenses", { 
        page, 
        ...filters 
    });
};

// Handlers
const handleSearch = () => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value);
    searchTimeout.value = setTimeout(() => fetchData(1), 500);
};

const applyFilters = () => fetchData(1);

const resetFilters = () => {
    filters.search = "";
    filters.category_id = "";
    filters.start_date = "";
    filters.end_date = "";
    fetchData(1);
};

const changePage = (p) => {
    if (p >= 1 && p <= pagination.value.last_page) fetchData(p);
};

const openCreateModal = () => {
    isEditing.value = false;
    form.id = null;
    form.name = "";
    form.montant = "";
    form.depense_category_id = "";
    form.justification_file = null;
    form.existing_file = null;
    showModal.value = true;
};

const openEditModal = (item) => {
    isEditing.value = true;
    form.id = item.id;
    form.name = item.name;
    form.montant = item.montant;
    form.depense_category_id = item.depense_category_id;
    form.justification_file = null;
    form.existing_file = item.justification_file;
    showModal.value = true;
};

const closeModal = () => showModal.value = false;

const handleFileUpload = (event) => {
    form.justification_file = event.target.files[0];
};

const submitForm = async () => {
    submitting.value = true;
    const payload = {
        name: form.name,
        montant: form.montant,
        depense_category_id: form.depense_category_id,
        justification_file: form.justification_file
    };
    
    let res;
    if (isEditing.value) {
        res = await store.dispatch("expenses/updateExpense", { id: form.id, data: payload });
    } else {
        res = await store.dispatch("expenses/createExpense", payload);
    }
    
    submitting.value = false;
    if (res.success) {
        closeModal();
        fetchData(pagination.value.current_page);
    } else {
        alert(res.message);
    }
};

const confirmDelete = async (item) => {
    if(confirm("Supprimer cette dépense ?")) {
        await store.dispatch("expenses/deleteExpense", item.id);
        fetchData(pagination.value.current_page);
    }
};

const exportData = async (format) => {
    // Assuming backend endpoint exists
    await store.dispatch("expenses/exportExpenses", { 
        start_date: filters.start_date, 
        end_date: filters.end_date, 
        format 
    });
};

// Utils
const formatCurrency = (val) => {
    if (!val) return "0 FBu";
    return new Intl.NumberFormat("fr-BI", { style: "currency", currency: "BIF" }).format(val).replace('BIF', 'FBu');
};

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
};

const viewJustification = async (expenseId) => {
    try {
        const response = await api.get(`/depenses/${expenseId}/justification`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (e) {
        alert('Impossible de charger le justificatif.');
    }
};
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}
</style>
