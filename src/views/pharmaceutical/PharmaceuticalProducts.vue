<template>
  <div class="p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">
        <i class="bi bi-capsule me-2"></i>
        Produits Pharmaceutiques
      </h2>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="bi bi-plus-circle me-1"></i>
        Nouveau Produit Pharma
      </button>
    </div>

    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
      {{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = null"></button>
    </div>

    <!-- Filters Section -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <input
              type="text"
              class="form-control"
              placeholder="Rechercher un produit pharmaceutique..."
              v-model="searchQuery"
              @input="handleSearch"
            />
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="selectedCategory" @change="handleSearch">
              <option value="">Toutes les catégories</option>
              <option v-for="cat in pharmaceuticalCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="stockFilter" @change="handleSearch">
              <option value="">Tous les stocks</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock faible</option>
              <option value="out_of_stock">Rupture</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Unité</th>
              <th>Quantité</th>
              <th>DCI</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && products.length === 0">
              <td colspan="7" class="text-center text-muted py-4">
                Aucun produit pharmaceutique trouvé
              </td>
            </tr>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.item_code }}</td>
              <td>
                <div>{{ product.item_designation }}</div>
                <small v-if="product.dci" class="text-muted">DCI: {{ product.dci }}</small>
              </td>
              <td>
                <span class="badge bg-info">
                  {{ product.category_product?.name || 'N/A' }}
                </span>
              </td>
              <td>{{ product.product_unit?.abbreviation || 'N/A' }}</td>
              <td>
                <span
                  :class="{
                    'badge bg-success': product.quantite > 50,
                    'badge bg-warning': product.quantite <= 50 && product.quantite > 10,
                    'badge bg-danger': product.quantite <= 10
                  }"
                >
                  {{ product.quantite || 0 }}
                </span>
              </td>
              <td>{{ product.dci || '-' }}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-primary"
                    @click="openEditModal(product)"
                    title="Modifier"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    @click="handleDelete(product.id)"
                    title="Supprimer"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.last_page > 1" class="card-footer">
        <nav>
          <ul class="pagination pagination-sm mb-0 justify-content-center">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <button
                class="page-link"
                @click="handlePageChange(pagination.current_page - 1)"
                :disabled="pagination.current_page === 1"
              >
                Précédent
              </button>
            </li>
            <li
              v-for="page in visiblePages"
              :key="page"
              class="page-item"
              :class="{ active: page === pagination.current_page }"
            >
              <button class="page-link" @click="handlePageChange(page)">
                {{ page }}
              </button>
            </li>
            <li
              class="page-item"
              :class="{ disabled: pagination.current_page === pagination.last_page }"
            >
              <button
                class="page-link"
                @click="handlePageChange(pagination.current_page + 1)"
                :disabled="pagination.current_page === pagination.last_page"
              >
                Suivant
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Product Form Modal -->
    <ProductFormModal
      v-if="showModal"
      :show="showModal"
      :isEditing="isEditing"
      :editId="editId"
      :product="selectedProduct"
      :categories="pharmaceuticalCategories"
      :productUnits="productUnits"
      @close="showModal = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import ProductFormModal from "../products/ProductFormModal.vue";
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

// State
const products = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const selectedCategory = ref("");
const stockFilter = ref("");
const pharmaceuticalCategories = ref([]);
const productUnits = ref([]);
const successMessage = ref(null);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
});

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const selectedProduct = ref(null);

// Computed
const visiblePages = computed(() => {
  const pages = [];
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;

  if (last <= 7) {
    for (let i = 1; i <= last; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', last);
    } else if (current >= last - 3) {
      pages.push(1, '...', last - 4, last - 3, last - 2, last - 1, last);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', last);
    }
  }

  return pages;
});

// Methods
const fetchProducts = async (page = 1) => {
  try {
    loading.value = true;

    const params = {
      page,
      per_page: pagination.value.per_page,
      search: searchQuery.value,
    };

    if (selectedCategory.value) {
      params.category_id = selectedCategory.value;
    }

    if (stockFilter.value) {
      params.stock_filter = stockFilter.value;
    }

    const response = await api.get("/products/pharmaceutical", { params });

    if (response.data.success) {
      const data = response.data.data;
      products.value = data.data || data || [];
      pagination.value = {
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 15,
        total: data.total || 0,
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement des produits pharmaceutiques:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchProducts(1);
};

const handlePageChange = (page) => {
  if (page !== '...' && page >= 1 && page <= pagination.value.last_page) {
    fetchProducts(page);
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  editId.value = null;
  selectedProduct.value = {
    is_pharmaceutical: true,
    product_category_id: pharmaceuticalCategories.value[0]?.id || null,
  };
  showModal.value = true;
};

const openEditModal = (product) => {
  isEditing.value = true;
  editId.value = product.id;
  selectedProduct.value = { ...product };
  showModal.value = true;
};

const handleSave = async () => {
  successMessage.value = isEditing.value
    ? "Produit modifié avec succès!"
    : "Produit créé avec succès!";

  showModal.value = false;

  // Refresh the product list
  await fetchProducts(pagination.value.current_page);

  // Clear success message after 3 seconds
  setTimeout(() => {
    successMessage.value = null;
  }, 3000);
};

const handleDelete = async (productId) => {
  if (!(await confirmDialog("Êtes-vous sûr de vouloir supprimer ce produit pharmaceutique?"))) {
    return;
  }

  try {
    await api.delete(`/products/${productId}`);
    successMessage.value = "Produit supprimé avec succès!";
    await fetchProducts(pagination.value.current_page);

    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    toast.error("Erreur lors de la suppression du produit");
  }
};

// Lifecycle
onMounted(async () => {
  try {
    // Load categories (filter for pharmaceutical ones)
    const [catResp, unitResp] = await Promise.all([
      api.get("/category-products"),
      api.get("/product-units"),
    ]);

    const allCategories = catResp.data?.data?.data || [];
    // Filter only pharmaceutical categories
    pharmaceuticalCategories.value = allCategories.filter((cat) =>
      cat.name?.toLowerCase().includes("pharma")
    );

    productUnits.value = unitResp.data?.data?.data || [];

    // Load products
    await fetchProducts();
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
  }
});
</script>

<style scoped>
.badge {
  font-size: 0.85rem;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}
</style>
