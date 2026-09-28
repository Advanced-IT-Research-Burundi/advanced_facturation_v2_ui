<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import POS from "./POS.vue";
import CartPanel from "./CartPanel.vue";

const props = defineProps({
  customers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["sale-completed", "add-client"]);

const store = useStore();
const toast = useToast();

const posRef = ref(null);
const splitContainerRef = ref(null);

// --- CART STATE ---
const cart = ref(JSON.parse(localStorage.getItem("pos_cart") || "[]"));
const selectedWarehouseId = ref(null);
const isSubmitting = ref(false);

// --- SAVED CARTS STATE ---
const SAVED_CARTS_KEY = "pos_saved_carts";
const activeSavedCartId = ref(null);
const savedCarts = ref(JSON.parse(localStorage.getItem(SAVED_CARTS_KEY) || "[]"));

// --- SPLIT RESIZER STATE ---
const productsPaneWidth = ref(Number(localStorage.getItem("pos_products_width")) || 60);
const isResizingPOS = ref(false);
const MIN_PRODUCTS_WIDTH = 38;
const MAX_PRODUCTS_WIDTH = 76;

const posProducts = computed(() => store.state.data?.productsPOS || []);
const currentUser = computed(() => store.getters["auth/currentUser"]);

const hasRole = (roleNames) => {
  const normalizedRoleNames = roleNames.map((roleName) => roleName.toLowerCase());
  const roles = currentUser.value?.roles || [];
  const roleNamesFromUser = currentUser.value?.role_names || [];

  return (
    roles.some((role) => {
      const roleName = role?.name?.toLowerCase();
      const roleLabel = role?.label?.toLowerCase();
      return normalizedRoleNames.includes(roleName) || normalizedRoleNames.includes(roleLabel);
    }) ||
    roleNamesFromUser.some((roleName) => normalizedRoleNames.includes(roleName?.toLowerCase()))
  );
};

const isSuperAdmin = computed(() =>
  hasRole(["super_admin", "superadmin", "super administrateur"])
);

const getPromoPrice = (product) => {
  const promoPrice = Number(product?.price_promo);
  return Number.isFinite(promoPrice) ? promoPrice : 0;
};

const getEffectiveProductPrice = (product) => {
  const promoPrice = getPromoPrice(product);
  if (isSuperAdmin.value && promoPrice > 0) {
    return promoPrice;
  }
  return Number(product?.price || product?.unit_price) || 0;
};

// --- RESIZING LOGIC ---
const clampPaneWidth = (value) => {
  return Math.min(MAX_PRODUCTS_WIDTH, Math.max(MIN_PRODUCTS_WIDTH, value));
};

const posResizeStyles = computed(() => ({
  "--pos-products-width": `${productsPaneWidth.value}%`,
  "--pos-resizer-width": "10px",
}));

const handlePOSResizeMove = (event) => {
  if (!isResizingPOS.value || !splitContainerRef.value) return;
  const bounds = splitContainerRef.value.getBoundingClientRect();
  const nextWidth = ((event.clientX - bounds.left) / bounds.width) * 100;
  productsPaneWidth.value = clampPaneWidth(nextWidth);
};

const stopPOSResize = () => {
  if (!isResizingPOS.value) return;
  isResizingPOS.value = false;
  localStorage.setItem("pos_products_width", String(productsPaneWidth.value));
  document.body.classList.remove("pos-resizing");
  window.removeEventListener("pointermove", handlePOSResizeMove);
  window.removeEventListener("pointerup", stopPOSResize);
  window.removeEventListener("pointercancel", stopPOSResize);
};

const startPOSResize = (event) => {
  event.preventDefault();
  isResizingPOS.value = true;
  document.body.classList.add("pos-resizing");
  window.addEventListener("pointermove", handlePOSResizeMove);
  window.addEventListener("pointerup", stopPOSResize);
  window.addEventListener("pointercancel", stopPOSResize);
};

// --- SAVED CARTS SYNC ---
const persistSavedCarts = () => {
  localStorage.setItem(SAVED_CARTS_KEY, JSON.stringify(savedCarts.value));
};

const normalizeBackendSavedCart = (savedCart) => ({
  id: savedCart.local_id,
  server_id: savedCart.id,
  identifier: savedCart.identifier,
  created_at: savedCart.created_at,
  updated_at: savedCart.updated_at,
  customer: savedCart.customer || savedCart.customer_snapshot,
  currency: savedCart.currency,
  payment_type: savedCart.payment_type,
  warehouse_id: savedCart.warehouse_id,
  total_ht: Number(savedCart.total_ht) || 0,
  total_tva: Number(savedCart.total_tva) || 0,
  total_ttc: Number(savedCart.total_ttc) || 0,
  items: savedCart.items || [],
  sync_status: "synced",
});

const savedCartPayload = (savedCart) => ({
  local_id: savedCart.id,
  identifier: savedCart.identifier,
  customer_id: savedCart.customer?.id || null,
  warehouse_id: savedCart.warehouse_id || null,
  currency: savedCart.currency || "BIF",
  payment_type: savedCart.payment_type || "1",
  total_ht: Number(savedCart.total_ht) || 0,
  total_tva: Number(savedCart.total_tva) || 0,
  total_ttc: Number(savedCart.total_ttc) || 0,
  customer_snapshot: savedCart.customer || null,
  items: savedCart.items.map((item) => ({ ...item })),
});

const updateSavedCartSyncState = (savedCartId, updates) => {
  const index = savedCarts.value.findIndex((item) => item.id === savedCartId);
  if (index === -1) return;

  savedCarts.value.splice(index, 1, {
    ...savedCarts.value[index],
    ...updates,
  });
  persistSavedCarts();
};

const syncSavedCartToBackend = (savedCart) => {
  updateSavedCartSyncState(savedCart.id, { sync_status: "syncing" });

  api
    .post("/saved-pos-carts", savedCartPayload(savedCart))
    .then((response) => {
      const backendCart = response.data?.data;
      updateSavedCartSyncState(savedCart.id, {
        server_id: backendCart?.id,
        sync_status: "synced",
        updated_at: backendCart?.updated_at || savedCart.updated_at,
      });
    })
    .catch((error) => {
      console.error("Erreur synchro facture enregistrée:", error);
      updateSavedCartSyncState(savedCart.id, { sync_status: "pending" });
    });
};

const deleteSavedCartFromBackend = (savedCart) => {
  if (!savedCart) return;
  const key = encodeURIComponent(savedCart.id || savedCart.identifier);
  api.delete(`/saved-pos-carts/${key}`).catch((error) => {
    console.error("Erreur suppression facture enregistrée:", error);
  });
};

const fetchSavedCartsFromBackend = () => {
  api
    .get("/saved-pos-carts", { params: { per_page: 100 } })
    .then((response) => {
      const records = response.data?.data?.data || response.data?.data || [];
      const backendCarts = records.map(normalizeBackendSavedCart);
      const localById = new Map(savedCarts.value.map((item) => [item.id, item]));

      backendCarts.forEach((backendCart) => {
        const localCart = localById.get(backendCart.id);
        if (!localCart || localCart.sync_status === "synced") {
          localById.set(backendCart.id, backendCart);
        }
      });

      savedCarts.value = Array.from(localById.values()).sort((a, b) => {
        return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
      });
      persistSavedCarts();
    })
    .catch((error) => {
      console.error("Erreur chargement factures enregistrées:", error);
    });
};

const padNumber = (value) => String(value).padStart(2, "0");

const buildSavedCartIdentifier = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    padNumber(now.getMonth() + 1),
    padNumber(now.getDate()),
  ].join("");
  const timePart = [
    padNumber(now.getHours()),
    padNumber(now.getMinutes()),
    padNumber(now.getSeconds()),
  ].join("");

  return `FACT-ATT-${datePart}-${timePart}`;
};

const handleSaveCart = (draft) => {
  const existingIndex = activeSavedCartId.value
    ? savedCarts.value.findIndex((item) => item.id === activeSavedCartId.value)
    : -1;
  const existingDraft = existingIndex >= 0 ? savedCarts.value[existingIndex] : null;
  const savedDraft = {
    id: existingDraft?.id || `saved-cart-${Date.now()}`,
    identifier: existingDraft?.identifier || buildSavedCartIdentifier(),
    created_at: existingDraft?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...draft,
    items: draft.items.map((item) => ({ ...item })),
  };

  if (existingIndex >= 0) {
    savedCarts.value.splice(existingIndex, 1, savedDraft);
  } else {
    savedCarts.value.unshift(savedDraft);
  }

  activeSavedCartId.value = null;
  cart.value = [];
  persistSavedCarts();
  toast.success(`Facture enregistrée: ${savedDraft.identifier}`);
  syncSavedCartToBackend(savedDraft);
};

const handleRestoreSavedCart = (savedCart) => {
  cart.value = savedCart.items.map((item) => ({ ...item }));
  selectedWarehouseId.value = savedCart.warehouse_id || selectedWarehouseId.value;
  activeSavedCartId.value = savedCart.id;
  toast.success(`Facture reprise: ${savedCart.identifier}`);
};

const handleDeleteSavedCart = (savedCartId) => {
  const savedCart = savedCarts.value.find((item) => item.id === savedCartId);
  savedCarts.value = savedCarts.value.filter((item) => item.id !== savedCartId);
  if (activeSavedCartId.value === savedCartId) {
    activeSavedCartId.value = null;
  }
  persistSavedCarts();
  deleteSavedCartFromBackend(savedCart);
  toast.success(
    savedCart
      ? `Facture enregistrée supprimée: ${savedCart.identifier}`
      : "Facture enregistrée supprimée"
  );
};

// Handle warehouse change from POS
const handleStockChanged = (warehouseId) => {
  const hasCartFromAnotherStock = cart.value.some(
    (item) => !item.warehouse_id || item.warehouse_id !== warehouseId
  );

  if (
    (selectedWarehouseId.value && selectedWarehouseId.value !== warehouseId) ||
    (!selectedWarehouseId.value && hasCartFromAnotherStock)
  ) {
    cart.value = [];
  }

  selectedWarehouseId.value = warehouseId;
};

// --- CART ITEM OPERATIONS ---
const addToCart = (product) => {
  const vatRate =
    product.vat_rate === null || product.vat_rate === undefined
      ? 0
      : Number(product.vat_rate);
  const productPrice = getEffectiveProductPrice(product);

  const normalizedProduct = {
    id: product.id,
    warehouse_product_id: product.warehouse_product_id,
    warehouse_id: product.warehouse_id || selectedWarehouseId.value,
    name: product.name,
    price: productPrice,
    product_price: productPrice,
    libelle: product.libelle,
    libelle_price: Number(product.libelle_price) || 0,
    quantity: 1,
    category: product.category,
    vat_rate: Number.isNaN(vatRate) ? 0 : vatRate,
    item_code: product.item_code,
    barcode: product.barcode,
    unit_price: Number(product.unit_price) || 0,
    price_promo: getPromoPrice(product),
    stock: Number(product.stock) || 0,
    item_ct: product.item_ct || 0,
    item_tl: product.item_tl || 0,
  };

  const existingIndex = cart.value.findIndex((i) => i.id === normalizedProduct.id);
  if (existingIndex !== -1) {
    const [existing] = cart.value.splice(existingIndex, 1);
    if ((isSuperAdmin.value || !existing.price || Number(existing.price) <= 0) && productPrice > 0) {
      existing.price = productPrice;
    }
    existing.price_promo = getPromoPrice(product);
    existing.product_price = existing.product_price || productPrice;
    existing.libelle = product.libelle;
    existing.libelle_price = Number(product.libelle_price) || 0;
    existing.quantity++;
    cart.value.unshift(existing);
  } else {
    cart.value.unshift(normalizedProduct);
  }
};

const updateQuantity = (id, delta) => {
  const item = cart.value.find((i) => i.id === id);
  if (item && item.quantity + delta > 0) item.quantity += delta;
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter((i) => i.id !== id);
};

const clearCart = () => {
  cart.value = [];
  activeSavedCartId.value = null;
};

watch(
  posProducts,
  (products) => {
    cart.value.forEach((item) => {
      const product = products.find((posProduct) => posProduct.id === item.id);
      const productPrice = getEffectiveProductPrice(product);
      if (!isSuperAdmin.value && item.price && Number(item.price) > 0) return;
      if (productPrice > 0) {
        item.price = productPrice;
        item.unit_price = Number(product?.unit_price) || productPrice;
        item.price_promo = getPromoPrice(product);
        item.product_price = item.product_price || productPrice;
        item.libelle = product?.libelle;
        item.libelle_price = Number(product?.libelle_price) || 0;
        item.warehouse_product_id = product?.warehouse_product_id || item.warehouse_product_id;
        item.warehouse_id = product?.warehouse_id || item.warehouse_id;
      }
    });
  },
  { deep: true }
);

watch(
  cart,
  (newCart) => {
    localStorage.setItem("pos_cart", JSON.stringify(newCart));
  },
  { deep: true }
);

// --- INVOICE SUBMISSION ---
const getStockErrorMessage = (stockDetails = [], payloadItems = []) => {
  const unavailableItem = stockDetails.find((item) => item && item.is_available === false);
  if (!unavailableItem) return null;

  const payloadItem = payloadItems.find((item) => item.product_id === unavailableItem.product_id);
  const designation = payloadItem?.item_designation || `Produit #${unavailableItem.product_id}`;

  return `${designation}: stock insuffisant (disponible ${unavailableItem.available}, demandé ${unavailableItem.requested})`;
};

const getValidationErrorMessage = (errors) => {
  if (!errors) return null;
  if (typeof errors === "string") return errors;

  const firstErrorField = Object.keys(errors)[0];
  const firstError = errors[firstErrorField];

  if (Array.isArray(firstError)) return firstError[0];
  if (typeof firstError === "string") return firstError;

  return null;
};

const getInvoiceSubmitErrorMessage = (error, payload) => {
  const responseData = error.response?.data;
  const stockMessage = getStockErrorMessage(responseData?.stock_details, payload?.items || []);

  if (stockMessage) return stockMessage;
  if (responseData?.message) return responseData.message;

  const validationMessage = getValidationErrorMessage(responseData?.errors);
  if (validationMessage) return validationMessage;

  return error.message || "Erreur lors de la soumission.";
};

const decrementPOSStockAfterSale = (items = []) => {
  const soldQuantities = new Map();

  items.forEach((item) => {
    const key = item.warehouse_product_id || item.product_id;
    if (!key) return;

    const quantity = Number(item.item_quantity) || 0;
    soldQuantities.set(key, (soldQuantities.get(key) || 0) + quantity);
  });

  const updatedProducts = posProducts.value
    .map((product) => {
      const key = product.warehouse_product_id || product.id;
      const soldQuantity = soldQuantities.get(key) || 0;

      return {
        ...product,
        stock: Math.max((Number(product.stock) || 0) - soldQuantity, 0),
      };
    })
    .filter((product) => Number(product.stock) > 0);

  store.commit("SET_POS_PRODUCTS", {
    stockId: selectedWarehouseId.value,
    products: updatedProducts,
  });
};

const handleInvoiceSubmit = async (payload) => {
  isSubmitting.value = true;
  try {
    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      const createdInvoice = response.data.data?.invoice || response.data.data;

      decrementPOSStockAfterSale(payload.items);
      if (activeSavedCartId.value) {
        const savedCartToDelete = savedCarts.value.find(
          (item) => item.id === activeSavedCartId.value
        );
        savedCarts.value = savedCarts.value.filter(
          (item) => item.id !== activeSavedCartId.value
        );
        activeSavedCartId.value = null;
        persistSavedCarts();
        deleteSavedCartFromBackend(savedCartToDelete);
      }
      cart.value = [];
      await posRef.value?.fetchProducts?.();

      emit("sale-completed", createdInvoice);
    } else {
      toast.error("Erreur: " + response.data.message);
    }
  } catch (e) {
    console.error("Erreur lors de la soumission:", e);
    toast.error(getInvoiceSubmitErrorMessage(e, payload));
  } finally {
    isSubmitting.value = false;
  }
};

const focusSearchInput = () => {
  posRef.value?.focusSearchInput?.();
};

defineExpose({
  focusSearchInput,
});

onMounted(() => {
  fetchSavedCartsFromBackend();
});

onBeforeUnmount(() => {
  stopPOSResize();
});
</script>

<template>
  <div
    ref="splitContainerRef"
    class="row g-0 pos-sales-row flex-grow-1 overflow-hidden"
    :style="posResizeStyles"
  >
    <!-- Left Section: POS Product Catalog & Search -->
    <div class="pos-main-column col-12 col-lg-7 d-flex flex-column bg-light border-end products-section overflow-hidden">
      <POS
        ref="posRef"
        :cart="cart"
        @add-to-cart="addToCart"
        @stock-changed="handleStockChanged"
      />
    </div>

    <!-- Draggable Split Resizer -->
    <div
      class="pos-resizer"
      role="separator"
      aria-label="Ajuster la largeur produits panier"
      title="Ajuster la largeur"
      @pointerdown="startPOSResize"
    >
      <span class="pos-resizer-line"></span>
    </div>

    <!-- Right Section: Cart Panel -->
    <CartPanel
      class="cart-section"
      :cart="cart"
      :customers="customers"
      :is-submitting="isSubmitting"
      :saved-carts="savedCarts"
      :warehouse-id="selectedWarehouseId"
      @clear-cart="clearCart"
      @remove-from-cart="removeFromCart"
      @update-quantity="updateQuantity"
      @invoice-submitted="handleInvoiceSubmit"
      @save-cart="handleSaveCart"
      @restore-saved-cart="handleRestoreSavedCart"
      @delete-saved-cart="handleDeleteSavedCart"
      @add-client="emit('add-client')"
    />
  </div>
</template>

<style scoped>
.pos-sales-row,
.pos-main-column {
  min-height: 0;
}
.pos-sales-row {
  align-items: stretch;
  flex: 1 1 0;
  height: 0;
}
.products-section,
.cart-section {
  height: 100%;
  min-height: 0;
}
.products-section {
  overflow: hidden;
}
.pos-resizer {
  display: none;
}
:global(body.pos-resizing),
:global(body.pos-resizing *) {
  cursor: w-resize !important;
  user-select: none !important;
}
@media (min-width: 992px) {
  .pos-sales-row {
    flex-wrap: nowrap;
  }
  .pos-main-column {
    flex: 0 0 var(--pos-products-width) !important;
    width: var(--pos-products-width) !important;
    max-width: var(--pos-products-width) !important;
  }
  .pos-sales-row > .cart-section {
    flex: 0 0 calc(100% - var(--pos-products-width) - var(--pos-resizer-width)) !important;
    width: calc(100% - var(--pos-products-width) - var(--pos-resizer-width)) !important;
    max-width: calc(100% - var(--pos-products-width) - var(--pos-resizer-width)) !important;
  }
  .pos-resizer {
    cursor: w-resize;
    display: flex;
    flex: 0 0 var(--pos-resizer-width);
    width: var(--pos-resizer-width);
    align-items: stretch;
    justify-content: center;
    background: #eef1f5;
    border-left: 1px solid #d9dee7;
    border-right: 1px solid #d9dee7;
    touch-action: none;
    z-index: 5;
  }
  .pos-resizer:hover,
  .pos-resizer:active {
    background: #dde3ec;
  }
  .pos-resizer-line {
    width: 2px;
    margin: 0 1px;
    background: #9aa6b8;
  }
}
</style>
