<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Search, Loader2 } from "lucide-vue-next";
import api from "@/services/api";

const props = defineProps({
  isLoading: Boolean,
});

const emit = defineEmits(["add-to-cart"]);

const products = ref([]);
const isLoadingProducts = ref(false);
const searchQuery = ref("");
const selectedCategory = ref("Tous");

const fetchProducts = async (search = "") => {
  isLoadingProducts.value = true;
  try {
    const response = await api.get("/products", { params: { search } });
    if (response.data.success) {
      products.value = response.data.data.data.map((p) => ({
        id: p.id,
        name: p.item_designation,
        price: p.price_ttc || p.price || 0,
        category: p.category_product?.name || "Général",
        stock: p.quantite || 0,
        vat_rate: p.vat_rate || 18,
        item_code: p.item_code,
      }));
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
  } finally {
    isLoadingProducts.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});

watch(searchQuery, (newVal) => {
  fetchProducts(newVal);
});

const categories = computed(() => {
  const cats = new Set(products.value.map((p) => p.category));
  return ["Tous", ...cats];
});

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesCategory =
      selectedCategory.value === "Tous" ||
      product.category === selectedCategory.value;
    return matchesCategory;
  });
});

const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString() : "0";
};

defineExpose({ fetchProducts });
</script>

<template>
  <div class="d-flex flex-column h-100">
    <div class="p-3 bg-white border-bottom shadow-sm z-1">
      <div class="row g-2">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0 text-muted">
              <Search :size="18" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control bg-light border-start-0"
              placeholder="Rechercher un produit..."
            />
            <span
              v-if="isLoadingProducts"
              class="input-group-text bg-light border-start-0"
            >
              <Loader2 :size="18" class="animate-spin" />
            </span>
          </div>
        </div>
        <div class="col-md-6">
          <div
            class="d-flex gap-2 overflow-auto pb-1"
            style="scrollbar-width: none"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              class="btn btn-sm text-nowrap"
              :class="
                selectedCategory === cat
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              "
            >
              {{ cat }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-grow-1 overflow-auto p-3">
      <div class="row g-3">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="col-6 col-md-4 col-xl-3"
        >
          <div
            class="card h-100 border-0 shadow-sm product-card cursor-pointer"
            @click="$emit('add-to-cart', product)"
          >
            <div class="card-body p-3 d-flex flex-column h-100">
              <div
                class="fw-bold text-dark mb-1 text-truncate"
                :title="product.name"
              >
                {{ product.name }}
              </div>
              <div class="small text-muted mb-2">{{ product.category }}</div>
              <div
                class="mt-auto d-flex justify-content-between align-items-center"
              >
                <span class="fw-bold text-primary"
                  >{{ formatPrice(product.price) }} FBU</span
                >
                <span class="badge bg-light text-secondary border">{{
                  product.stock
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  transition: all 0.2s ease;
  user-select: none;
}
.product-card:active {
  transform: scale(0.98);
}
.product-card:hover {
  transform: translateY(-2px);
  border-color: var(--bs-primary) !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
