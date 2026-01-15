<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import api from "@/services/api";
import LotFormModal from "./LotFormModal.vue";

const store = useStore();

const lots = computed(() => store.getters["pharmaceutical/allLots"]);
const loading = computed(() => store.getters["pharmaceutical/lotsLoading"]);
const pagination = computed(() => store.getters["pharmaceutical/lotsPagination"]);

const searchQuery = ref("");
const statusFilter = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedLot = ref(null);

const products = ref([]);
const warehouses = ref([]);
const fournisseurs = ref([]);

onMounted(async () => {
  await fetchLots();
  await loadFormData();
});

const fetchLots = async () => {
  await store.dispatch("pharmaceutical/fetchLots", {
    page: pagination.value.current_page || 1,
    search: searchQuery.value,
    status: statusFilter.value,
  });
};

const loadFormData = async () => {
  try {
    const [prodRes, wareRes, fournRes] = await Promise.all([
      api.get("/products?per_page=1000"),
      api.get("/warehouses"),
      api.get("/fournisseurs"),
    ]);
    products.value = prodRes.data.data.data || prodRes.data.data || [];
    warehouses.value = wareRes.data.data.data || wareRes.data.data || [];
    fournisseurs.value = fournRes.data.data.data || fournRes.data.data || [];
  } catch (error) {
    console.error("Error loading form data:", error);
  }
};

const handleSearch = () => {
  fetchLots();
};

const handlePageChange = (page) => {
  store.dispatch("pharmaceutical/fetchLots", {
    page,
    search: searchQuery.value,
    status: statusFilter.value,
  });
};

const openCreateModal = () => {
  isEditing.value = false;
  selectedLot.value = null;
  showModal.value = true;
};

const openEditModal = (lot) => {
  isEditing.value = true;
  selectedLot.value = { ...lot };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedLot.value = null;
};

const handleSave = async (lotData) => {
  let result;
  if (isEditing.value) {
    result = await store.dispatch("pharmaceutical/updateLot", {
      id: selectedLot.value.id,
      data: lotData,
    });
  } else {
    result = await store.dispatch("pharmaceutical/createLot", lotData);
  }

  if (result.success) {
    closeModal();
    await fetchLots();
  } else {
    alert(result.error || "Erreur lors de l'enregistrement");
  }
};

const handleDelete = async (lot) => {
  if (confirm(`Supprimer le lot ${lot.lot_number} ?`)) {
    const result = await store.dispatch("pharmaceutical/deleteLot", lot.id);
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
    case "active":
      return "bg-success";
    case "expired":
      return "bg-danger";
    case "recalled":
      return "bg-warning";
    case "depleted":
      return "bg-secondary";
    default:
      return "bg-light text-dark";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "active":
      return "Actif";
    case "expired":
      return "Expire";
    case "recalled":
      return "Rappele";
    case "depleted":
      return "Epuise";
    default:
      return status;
  }
};

const getDaysUntilExpiration = (date) => {
  if (!date) return 0;
  const expDate = new Date(date);
  const today = new Date();
  return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
};

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.per_page) || 1);
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Gestion des Lots</h2>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="bi bi-plus-circle me-2"></i>Nouveau Lot
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
                placeholder="Rechercher par numero de lot ou produit..."
                v-model="searchQuery"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select bg-light" v-model="statusFilter" @change="handleSearch">
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="expired">Expire</option>
              <option value="recalled">Rappele</option>
              <option value="depleted">Epuise</option>
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
                <th>N Lot</th>
                <th>Produit</th>
                <th>Entrepot</th>
                <th>Quantite</th>
                <th>Expiration</th>
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
              <tr v-else-if="lots.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  Aucun lot trouve
                </td>
              </tr>
              <tr v-for="lot in lots" :key="lot.id" v-else>
                <td><code class="fs-6">{{ lot.lot_number }}</code></td>
                <td>
                  <div>{{ lot.product?.item_designation || "-" }}</div>
                  <small class="text-muted">{{ lot.product?.item_code }}</small>
                </td>
                <td>{{ lot.warehouse?.name || "-" }}</td>
                <td>
                  <span :class="{ 'text-danger fw-bold': lot.current_quantity <= 0 }">
                    {{ lot.current_quantity }} / {{ lot.initial_quantity }}
                  </span>
                </td>
                <td>
                  <div>{{ formatDate(lot.expiration_date) }}</div>
                  <small
                    :class="{
                      'text-danger': getDaysUntilExpiration(lot.expiration_date) <= 30,
                      'text-warning': getDaysUntilExpiration(lot.expiration_date) <= 90 && getDaysUntilExpiration(lot.expiration_date) > 30,
                      'text-muted': getDaysUntilExpiration(lot.expiration_date) > 90,
                    }"
                  >
                    {{ getDaysUntilExpiration(lot.expiration_date) }} jours
                  </small>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(lot.status)">
                    {{ getStatusLabel(lot.status) }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="openEditModal(lot)" title="Modifier">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" @click="handleDelete(lot)" title="Supprimer">
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
    <LotFormModal
      :show="showModal"
      :is-editing="isEditing"
      :initial-data="selectedLot"
      :products="products"
      :warehouses="warehouses"
      :fournisseurs="fournisseurs"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>
