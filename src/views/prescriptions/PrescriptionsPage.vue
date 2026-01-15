<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import api from "@/services/api";
import PrescriptionFormModal from "./PrescriptionFormModal.vue";

const store = useStore();

const prescriptions = computed(() => store.getters["pharmaceutical/allPrescriptions"]);
const loading = computed(() => store.getters["pharmaceutical/prescriptionsLoading"]);
const pagination = computed(() => store.getters["pharmaceutical/prescriptionsPagination"]);

const searchQuery = ref("");
const statusFilter = ref("");
const showModal = ref(false);
const selectedPrescription = ref(null);

const customers = ref([]);
const products = ref([]);

onMounted(async () => {
  await fetchPrescriptions();
  await loadFormData();
});

const fetchPrescriptions = async () => {
  await store.dispatch("pharmaceutical/fetchPrescriptions", {
    page: pagination.value.current_page || 1,
    search: searchQuery.value,
    status: statusFilter.value,
  });
};

const loadFormData = async () => {
  try {
    const [custRes, prodRes] = await Promise.all([
      api.get("/customers"),
      api.get("/products?per_page=1000"),
    ]);
    customers.value = custRes.data.data.data || custRes.data.data || [];
    products.value = (prodRes.data.data.data || prodRes.data.data || []).filter(
      (p) => p.is_pharmaceutical || p.requires_prescription
    );
  } catch (error) {
    console.error("Error loading form data:", error);
  }
};

const handleSearch = () => {
  fetchPrescriptions();
};

const handlePageChange = (page) => {
  store.dispatch("pharmaceutical/fetchPrescriptions", {
    page,
    search: searchQuery.value,
    status: statusFilter.value,
  });
};

const openCreateModal = () => {
  selectedPrescription.value = null;
  showModal.value = true;
};

const viewPrescription = async (prescription) => {
  try {
    const response = await api.get(`/prescriptions/${prescription.id}`);
    if (response.data.success) {
      selectedPrescription.value = response.data.data;
      showModal.value = true;
    }
  } catch (error) {
    alert("Erreur lors du chargement de l'ordonnance");
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedPrescription.value = null;
};

const handleSave = async (prescriptionData) => {
  const result = await store.dispatch("pharmaceutical/createPrescription", prescriptionData);
  if (result.success) {
    closeModal();
    await fetchPrescriptions();
  } else {
    alert(result.error || "Erreur lors de l'enregistrement");
  }
};

const handleDelete = async (prescription) => {
  if (prescription.status !== "pending") {
    alert("Seules les ordonnances en attente peuvent etre supprimees");
    return;
  }
  if (confirm(`Supprimer l'ordonnance ${prescription.prescription_number} ?`)) {
    const result = await store.dispatch("pharmaceutical/deletePrescription", prescription.id);
    if (!result.success) {
      alert(result.error || "Erreur lors de la suppression");
    }
  }
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "pending":
      return "bg-warning text-dark";
    case "partially_dispensed":
      return "bg-info";
    case "fully_dispensed":
      return "bg-success";
    case "expired":
      return "bg-secondary";
    case "cancelled":
      return "bg-danger";
    default:
      return "bg-light text-dark";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "En attente";
    case "partially_dispensed":
      return "Partiellement delivree";
    case "fully_dispensed":
      return "Delivree";
    case "expired":
      return "Expiree";
    case "cancelled":
      return "Annulee";
    default:
      return status;
  }
};

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.per_page) || 1);
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Gestion des Ordonnances</h2>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="bi bi-plus-circle me-2"></i>Nouvelle Ordonnance
      </button>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search"></i>
              </span>
              <input
                type="text"
                class="form-control bg-light border-start-0"
                placeholder="Rechercher par numero, patient ou medecin..."
                v-model="searchQuery"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select bg-light" v-model="statusFilter" @change="handleSearch">
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="partially_dispensed">Partiellement delivree</option>
              <option value="fully_dispensed">Delivree</option>
              <option value="expired">Expiree</option>
              <option value="cancelled">Annulee</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" @click="handleSearch">
              Filtrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>N Ordonnance</th>
                <th>Patient</th>
                <th>Medecin</th>
                <th>Date</th>
                <th>Articles</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status"></div>
                </td>
              </tr>
              <tr v-else-if="prescriptions.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  Aucune ordonnance trouvee
                </td>
              </tr>
              <tr v-for="prescription in prescriptions" :key="prescription.id" v-else>
                <td><code class="fs-6">{{ prescription.prescription_number }}</code></td>
                <td>
                  <div>{{ prescription.patient_name }}</div>
                  <small class="text-muted">{{ prescription.customer?.customer_name }}</small>
                </td>
                <td>
                  <div>{{ prescription.prescriber_name }}</div>
                  <small class="text-muted">{{ prescription.prescriber_registration }}</small>
                </td>
                <td>{{ formatDate(prescription.prescription_date) }}</td>
                <td>
                  <span class="badge bg-secondary">
                    {{ prescription.items?.length || 0 }} produit(s)
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(prescription.status)">
                    {{ getStatusLabel(prescription.status) }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info" @click="viewPrescription(prescription)" title="Voir">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      @click="handleDelete(prescription)"
                      title="Supprimer"
                      :disabled="prescription.status !== 'pending'"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="card-footer bg-white" v-if="pagination.total > pagination.per_page">
        <nav>
          <ul class="pagination pagination-sm mb-0 justify-content-center">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <button class="page-link" @click="handlePageChange(pagination.current_page - 1)">
                Precedent
              </button>
            </li>
            <li class="page-item disabled">
              <span class="page-link">Page {{ pagination.current_page }} / {{ totalPages }}</span>
            </li>
            <li class="page-item" :class="{ disabled: pagination.current_page >= totalPages }">
              <button class="page-link" @click="handlePageChange(pagination.current_page + 1)">
                Suivant
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal -->
    <PrescriptionFormModal
      :show="showModal"
      :initial-data="selectedPrescription"
      :customers="customers"
      :products="products"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>
