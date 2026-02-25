<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import StockHeader from "../stocks/StockHeader.vue";
import api from "@/services/api";

// Child Components
import ProductHeader from "./ProductHeader.vue";
import ProductFilters from "./ProductFilters.vue";
import ProductList from "./ProductList.vue";
import ProductFormModal from "./ProductFormModal.vue";

const store = useStore();
const searchQuery = ref("");
const isEditing = ref(false);
const editId = ref(null);
const showModal = ref(false);
const selectedProduct = ref(null);
const successMessage = ref(null);

// Initial Data Fetch
onMounted(async () => {
  const [catResp, unitResp] = await Promise.all([
    api.get("/category-products"),
    api.get("/product-units"),
  ]);
  store.state.data.categoriesProducts = catResp.data?.data?.data;
  store.state.data.product_units = unitResp.data?.data?.data;

  store.dispatch("products/fetchProducts", { page: 1, search: "" });
});

// State from Vuex
const products = computed(() => store.getters["products/allProducts"]);
const loading = computed(() => store.getters["products/isLoading"]);
const pagination = computed(() => store.state.products.pagination);
const categories = computed(() => store.state.data.categoriesProducts);
const productUnits = computed(() => store.state.data.product_units);

const handleSearch = (val) => {
  searchQuery.value = val;
  store.dispatch("products/fetchProducts", { page: 1, search: val });
};

const handlePageChange = (page) => {
  store.dispatch("products/fetchProducts", { page, search: searchQuery.value });
};

const openCreateModal = () => {
  isEditing.value = false;
  selectedProduct.value = null;
  showModal.value = true;
};

const openEditModal = (product) => {
  isEditing.value = true;
  editId.value = product.id;
  selectedProduct.value = product;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedProduct.value = null;
};

const handleSave = async (payload) => {
  let result;
  if (isEditing.value) {
    result = await store.dispatch("products/updateProduct", {
      id: editId.value,
      data: payload,
    });
  } else {
    result = await store.dispatch("products/createProduct", payload);
  }

  if (result.success) {
    closeModal();
    successMessage.value = isEditing.value
      ? "Produit modifié avec succès"
      : "Produit créé avec succès";
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } else {
    alert(
      "Erreur lors de l'enregistrement: " +
        JSON.stringify(result.errors || result.error)
    );
  }
};

const handleDelete = async (product) => {
  if (
    confirm(
      `Voulez-vous vraiment supprimer le produit "${product.item_designation}" ?`
    )
  ) {
    const result = await store.dispatch("products/deleteProduct", product.id);
    if (result.success) {
      successMessage.value = "Produit supprimé avec succès";
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } else {
      alert("Erreur lors de la suppression");
    }
  }
};
</script>

<template>
  <div class="container-fluid py-4 bg-light">
    <StockHeader />

    <!-- Message de succès -->
    <div
      v-if="successMessage"
      class="alert alert-success alert-dismissible fade show"
      role="alert"
    >
      <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
      <button
        type="button"
        class="btn-close"
        @click="successMessage = null"
        aria-label="Close"
      ></button>
    </div>

    <ProductHeader @create="openCreateModal" />

    <ProductFilters
      :modelValue="searchQuery"
      @update:modelValue="handleSearch"
    />

    <ProductList
      :products="products"
      :loading="loading"
      :pagination="pagination"
      :categories="categories"
      @edit="openEditModal"
      @delete="handleDelete"
      @change-page="handlePageChange"
    />

    <ProductFormModal
      v-if="showModal"
      :show="showModal"
      :is-editing="isEditing"
      :categories="categories"
      :product-units="productUnits"
      :initial-data="selectedProduct"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.container-fluid {
  transition: all 0.3s ease;
}
</style>
