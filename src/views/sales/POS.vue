<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Search, Loader2 } from "lucide-vue-next";
import api from "@/services/api";
import { useStore } from "vuex";

const props = defineProps({
  isLoading: Boolean,
});
const store = useStore();
const emit = defineEmits(["add-to-cart", "stock-changed"]);

const isLoadingProducts = ref(false);
const searchQuery = ref("");
const selectedCategory = ref("Tous");
const selectedStock = ref(null);
const lastAutoAddedScan = ref("");
let searchTimeout = null;

onMounted(() => {
  fetchStock();
  fetchProducts();
});
const fetchStock = async () => {
  try {
    const response = await api.get("/mes_stock");
    if (response.data.success) {
      const stocksData = response.data.data || [];
      store.state.data.stocksPOS = stocksData;
      
      // Vérifier si des stocks existent
      if (stocksData.length > 0) {
        selectedStock.value = stocksData[0].warehouse_id || stocksData[0].id;
        // Emit the warehouse_id when stock is loaded
        const warehouseId = stocksData[0]?.warehouse_id || stocksData[0]?.warehouse?.id || stocksData[0]?.id;
        emit("stock-changed", warehouseId);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des stocks:", error);
  }
};

// Watch for stock selection changes
watch(selectedStock, (newStockId) => {
  const stock = stocks.value?.find(s => s.warehouse_id === newStockId);
  if (stock) {
    const warehouseId = stock.warehouse_id || stock.warehouse?.id;
    emit("stock-changed", warehouseId);
    fetchProducts();
  }
});


const fetchProducts = async (search = "") => {
  isLoadingProducts.value = true;
  const currentSearch = search.trim();
  try {
    const response = await api.get("/pos-products", {
      params: {
        stock_id: selectedPOSStock.value,
        search: currentSearch
      }
    });
    if (response.data.success) {
      const productsData = response.data.data.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category || "Général",
        stock: p.stock,
        vat_rate: p.vat_rate,
        item_code: p.item_code,
        barcode: p.barcode,
      }));

      store.state.data.productsPOS = productsData;

      if (normalizeCode(searchQuery.value) === normalizeCode(currentSearch)) {
        autoAddSingleScanResult(productsData, currentSearch);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
  } finally {
    isLoadingProducts.value = false;
  }
};

const normalizeCode = (value) => String(value ?? "").trim().toLowerCase();

const isExactScanMatch = (product, search) => {
  const query = normalizeCode(search);
  return [product.barcode, product.item_code].some(
    (code) => normalizeCode(code) === query
  );
};

const autoAddSingleScanResult = (productsData, search) => {
  const query = search.trim();
  if (!query || productsData.length !== 1) return;

  const product = productsData[0];
  const looksLikeBarcode = query.length >= 6;
  if (!looksLikeBarcode && !isExactScanMatch(product, query)) return;

  const scanKey = `${selectedPOSStock.value}-${query}-${product.id}`;
  if (lastAutoAddedScan.value === scanKey) return;

  lastAutoAddedScan.value = scanKey;
  emit("add-to-cart", product);
  searchQuery.value = "";
  selectedCategory.value = "Tous";
};

const handleSearchEnter = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  fetchProducts(searchQuery.value);
};




// Debounce search to avoid too many API calls
watch(searchQuery, (newVal) => {
  if (!newVal.trim()) {
    lastAutoAddedScan.value = "";
  }

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    fetchProducts(newVal);
  }, 300); // 300ms debounce
});

const products = computed(() => store.state.data?.productsPOS || []);
const stocks = computed(() => store.state.data?.stocksPOS || []);

const selectedPOSStock = computed(() => selectedStock.value || store.state.data?.stocksPOS?.[0]?.warehouse_id);

const categories = computed(() => {
  if (!products.value || products.value.length === 0) return ["Tous"];
  const cats = new Set(products.value.map((p) => p.category).filter(Boolean));
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
      <div class="d-flex justify-content-between">
      <div>
        <div v-if=" stocks?.length === 0">
        <div class="alert alert-info">
          Aucun stock disponible pour vous
        </div>
      </div>
      <div v-if="stocks?.length > 1" class="">
        <select v-model="selectedStock" class="form-select">
          <option v-for="stock in stocks" :key="stock.id" :value="stock.warehouse_id">{{ stock.warehouse.name }}</option>
        </select>
      </div>
      </div>
      
    </div>

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
              @keyup.enter="handleSearchEnter"
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
