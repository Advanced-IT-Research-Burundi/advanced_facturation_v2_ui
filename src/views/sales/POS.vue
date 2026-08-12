<script setup>
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { Search, Loader2 } from "lucide-vue-next";
import api from "@/services/api";
import { useStore } from "vuex";

const props = defineProps({
  isLoading: Boolean,
  cart: {
    type: Array,
    default: () => [],
  },
});
const store = useStore();
const emit = defineEmits(["add-to-cart", "stock-changed"]);

const isLoadingProducts = ref(false);
const isLoadingMoreProducts = ref(false);
const searchQuery = ref("");
const selectedCategory = ref("Tous");
const selectedStock = ref(null);
const productScrollEl = ref(null);
const searchInputEl = ref(null);
const lastAutoAddedScan = ref("");
const currentPage = ref(0);
const hasMoreProducts = ref(true);
let searchTimeout = null;
let productsRequestVersion = 0;
const POS_PRODUCTS_PER_PAGE = 15;

onMounted(() => {
  focusSearchInput();
  fetchStock();
});

const focusSearchInput = async () => {
  await nextTick();
  searchInputEl.value?.focus();
};

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
  const stock = stocks.value?.find((item) =>
    String(item.warehouse_id || item.warehouse?.id || item.id) === String(newStockId)
  );
  if (stock && newStockId) {
    const warehouseId = stock.warehouse_id || stock.warehouse?.id || stock.id;
    emit("stock-changed", warehouseId);
    fetchProducts();
  }
});

const getProductStock = (product) => {
  const value = product.stock
    ?? product.quantity_available
    ?? product.available_stock
    ?? product.stock_quantity
    ?? product.quantity
    ?? product.warehouse_product?.quantity
    ?? 0;

  return Number(value) || 0;
};

const getProductsPayload = (responseData) => {
  const payload = responseData?.data;

  if (Array.isArray(payload)) {
    return { items: payload, meta: responseData?.meta, links: responseData?.links };
  }

  if (Array.isArray(payload?.data)) {
    return { items: payload.data, meta: payload.meta, links: payload.links };
  }

  return { items: [], meta: null, links: null };
};

const hasNextPage = ({ meta, links, itemCount }, page) => {
  if (meta?.last_page !== undefined) {
    return page < Number(meta.last_page);
  }

  if (links?.next !== undefined) {
    return Boolean(links.next);
  }

  return itemCount >= POS_PRODUCTS_PER_PAGE;
};

const mergeUniqueProducts = (existingProducts, newProducts) => {
  const seen = new Set(
    existingProducts.map((product) => product.warehouse_product_id || product.id)
  );

  return [
    ...existingProducts,
    ...newProducts.filter((product) => {
      const key = product.warehouse_product_id || product.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
};

const fetchProducts = async (search = "", options = {}) => {
  if (!selectedPOSStock.value) {
    store.state.data.productsPOS = [];
    currentPage.value = 0;
    hasMoreProducts.value = false;
    return;
  }

  const reset = options.reset !== false;
  const page = reset ? 1 : currentPage.value + 1;
  const requestVersion = reset ? ++productsRequestVersion : productsRequestVersion;

  if (!reset && (!hasMoreProducts.value || isLoadingMoreProducts.value || isLoadingProducts.value)) {
    return;
  }

  if (reset) {
    isLoadingProducts.value = true;
    isLoadingMoreProducts.value = false;
    currentPage.value = 0;
    hasMoreProducts.value = true;
    store.state.data.productsPOS = [];
    if (productScrollEl.value) {
      productScrollEl.value.scrollTop = 0;
    }
  } else {
    isLoadingMoreProducts.value = true;
  }

  const currentSearch = search.trim();

  try {
    const response = await api.get("/pos-products", {
      params: {
        stock_id: selectedPOSStock.value,
        search: currentSearch,
        page,
        per_page: POS_PRODUCTS_PER_PAGE,
      }
    });

    if (requestVersion !== productsRequestVersion) return;
    if (!response.data.success) return;

    const { items, meta, links } = getProductsPayload(response.data);
    const productsData = items
      .map((p) => ({
        id: p.id,
        warehouse_product_id: p.warehouse_product_id,
        warehouse_id: selectedPOSStock.value,
        name: p.name,
        price: Number(p.price || p.unit_price) || 0,
        unit_price: Number(p.unit_price) || 0,
        category: p.category || "Général",
        stock: getProductStock(p),
        vat_rate: p.vat_rate,
        item_code: p.item_code,
        barcode: p.barcode,
      }))
      .filter((product) => product.stock > 0);

    store.state.data.productsPOS = reset
      ? productsData
      : mergeUniqueProducts(products.value, productsData);
    currentPage.value = page;
    hasMoreProducts.value = hasNextPage({ meta, links, itemCount: items.length }, page);

    if (reset && normalizeCode(searchQuery.value) === normalizeCode(currentSearch)) {
      autoAddSingleScanResult(productsData, currentSearch);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
  } finally {
    if (requestVersion === productsRequestVersion) {
      isLoadingProducts.value = false;
      isLoadingMoreProducts.value = false;
    }
  }
};

const normalizeCode = (value) => String(value ?? "").trim().toLowerCase();

const isExactScanMatch = (product, search) => {
  const query = normalizeCode(search);
  return [product.barcode, product.item_code].some(
    (code) => normalizeCode(code) === query
  );
};

const getCartQuantity = (productId) => {
  const item = props.cart.find((cartItem) => cartItem.id === productId);
  return Number(item?.quantity) || 0;
};

const getAvailableStock = (product) => {
  return Math.max((Number(product.stock) || 0) - getCartQuantity(product.id), 0);
};

const addProductToCart = (product) => {
  if (getAvailableStock(product) <= 0) return false;

  emit("add-to-cart", product);
  return true;
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
  if (addProductToCart(product)) {
    searchQuery.value = "";
    selectedCategory.value = "Tous";
  }
};

const handleSearchEnter = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  fetchProducts(searchQuery.value, { reset: true });
};

const handleProductScroll = () => {
  const element = productScrollEl.value;
  if (!element) return;

  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight;

  if (distanceFromBottom <= 120) {
    fetchProducts(searchQuery.value, { reset: false });
  }
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
    fetchProducts(newVal, { reset: true });
  }, 300); // 300ms debounce
});

const products = computed(() => store.state.data?.productsPOS || []);
const stocks = computed(() => store.state.data?.stocksPOS || []);

const selectedPOSStock = computed(() => selectedStock.value || store.state.data?.stocksPOS?.[0]?.warehouse_id);

const categories = computed(() => {
  if (!availableProducts.value || availableProducts.value.length === 0) return ["Tous"];
  const cats = new Set(availableProducts.value.map((p) => p.category).filter(Boolean));
  return ["Tous", ...cats];
});

const availableProducts = computed(() => {
  return products.value.filter((product) => {
    return getAvailableStock(product) > 0;
  });
});

const filteredProducts = computed(() => {
  return availableProducts.value.filter((product) => {
    const matchesCategory =
      selectedCategory.value === "Tous" ||
      product.category === selectedCategory.value;
    return matchesCategory;
  });
});

const formatPrice = (price) => {
  return typeof price === "number" ? price.toLocaleString() : "0";
};

defineExpose({ fetchProducts, focusSearchInput });
</script>

<template>
  <div class="pos-products-panel d-flex flex-column h-100">
    <div class="products-toolbar p-3 bg-white border-bottom shadow-sm z-1">
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
              ref="searchInputEl"
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

    <div
      ref="productScrollEl"
      class="products-scroll-area p-3"
      @scroll.passive="handleProductScroll"
    >
      <div class="row g-3">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="col-6 col-md-4"
        >
          <div
            class="card h-100 border-0 shadow-sm product-card cursor-pointer"
            @click="addProductToCart(product)"
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
                  getAvailableStock(product)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="isLoadingMoreProducts"
        class="d-flex align-items-center justify-content-center gap-2 py-3 text-muted"
      >
        <Loader2 :size="18" class="animate-spin" />
        <span>Chargement des autres produits...</span>
      </div>

      <div
        v-if="!isLoadingProducts && filteredProducts.length === 0"
        class="text-center text-muted py-5"
      >
        Aucun produit disponible
      </div>
    </div>
  </div>
</template>

<style scoped>
.pos-products-panel {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.products-toolbar {
  flex: 0 0 auto;
}
.products-scroll-area {
  flex: 1 1 auto;
  height: calc(100vh - 170px);
  max-height: calc(100vh - 170px);
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.products-scroll-area::-webkit-scrollbar {
  width: 8px;
}
.products-scroll-area::-webkit-scrollbar-thumb {
  background: #c7cdd6;
  border-radius: 8px;
}
.products-scroll-area::-webkit-scrollbar-track {
  background: #eef1f5;
}
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
