<script setup>
import { ref, watch, onMounted } from "vue";
import api from "../../../services/api";
import StockHeader from "../../stocks/StockHeader.vue";
import { Loader2, Printer } from "lucide-vue-next";

// Child Components
import BarCodeActions from "./BarCodeActions.vue";
import BarCodeSearch from "./BarCodeSearch.vue";
import BarCodeConfig from "./BarCodeConfig.vue";
import BarCodePreview from "./BarCodePreview.vue";
import BarCodeProductList from "./BarCodeProductList.vue";

const searchQuery = ref("");
const selectedProduct = ref(null);
const loading = ref(false);
const products = ref([]);
const showDropdown = ref(false);
const previewBlobUrl = ref(null);
const codeType = ref("barcode"); // 'barcode' or 'qrcode'
const labelCount = ref(1);
const isPrintingAll = ref(false);
const isPrintingSelected = ref(false);

// Initialize with all products on mount
onMounted(() => {
  fetchProducts();
});

// Search/Fetch products
const fetchProducts = async (query = "") => {
  loading.value = true;
  try {
    const url = query ? `/products?search=${query}` : "/products";
    const response = await api.get(url);
    products.value = response.data.data.data || response.data.data || [];
    showDropdown.value = query.length >= 2 && products.value.length > 0;
  } catch (error) {
    console.error("Error fetching products:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = () => {
  if (searchQuery.value.length >= 2) {
    fetchProducts(searchQuery.value);
  } else if (searchQuery.value.length === 0) {
    fetchProducts();
    showDropdown.value = false;
  }
};

const fetchCodeImage = async (productId) => {
  try {
    const endpoint = codeType.value === "barcode" ? "barcode" : "qrcode";
    const response = await api.get(`/products/${productId}/${endpoint}`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "image/svg+xml" });

    if (previewBlobUrl.value) {
      window.URL.revokeObjectURL(previewBlobUrl.value);
    }
    previewBlobUrl.value = window.URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching code image:", error);
  }
};

const selectProduct = async (product) => {
  selectedProduct.value = product;
  searchQuery.value = product.item_designation;
  showDropdown.value = false;
  await fetchCodeImage(product.id);
};

const handleEnter = async () => {
  if (showDropdown.value && products.value.length > 0) {
    selectProduct(products.value[0]);
  }
};

const downloadCode = () => {
  if (!previewBlobUrl.value || !selectedProduct.value) return;
  const link = document.createElement("a");
  link.href = previewBlobUrl.value;
  link.download = `${codeType.value}-${selectedProduct.value.item_code}.svg`;
  link.click();
};

const generatePrintContent = (itemsToPrint) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const itemsHtml = itemsToPrint
    .map((product) => {
      const imageUrl = `${baseUrl}/products/${product.id}/${codeType.value}`;
      return Array(product.count || 1)
        .fill(0)
        .map(
          () => `
      <div class="label-item">
        <div class="label-name">${product.item_designation}</div>
        <img src="${imageUrl}" class="label-img" style="${
            codeType.value === "qrcode" ? "width:120px;" : "width:100%;"
          }">
        <div class="label-code">${product.barcode || product.item_code}</div>
      </div>
    `
        )
        .join("");
    })
    .join("");

  return `
    <html>
      <head>
        <title>Impression Étiquettes</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 10px; }
          .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .label-item { border: 1px solid #eee; padding: 10px; text-align: center; page-break-inside: avoid; }
          .label-name { font-size: 10px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .label-img { display: block; margin: 0 auto 5px; max-height: 80px; object-fit: contain; }
          .label-code { font-size: 11px; font-family: monospace; font-weight: bold; }
          @media print { .print-grid { grid-template-columns: repeat(4, 1fr); gap: 5px; } .label-item { border: 0.5px solid #ccc; } }
        </style>
      </head>
      <body>
        <div class="print-grid">${itemsHtml}</div>
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); window.parent.document.body.removeChild(window.frameElement); }, 500);
          };
        <\/script>
      </body>
    </html>
  `;
};

const triggerPrint = (items, onComplete) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.write(generatePrintContent(items));
  doc.close();
  setTimeout(() => {
    if (onComplete) onComplete();
  }, 2000);
};

const printSelected = () => {
  if (!selectedProduct.value) return;
  isPrintingSelected.value = true;
  triggerPrint([{ ...selectedProduct.value, count: labelCount.value }], () => {
    isPrintingSelected.value = false;
  });
};

const printAll = () => {
  if (products.value.length === 0) return;
  isPrintingAll.value = true;
  triggerPrint(
    products.value.map((p) => ({ ...p, count: labelCount.value })),
    () => {
      isPrintingAll.value = false;
    }
  );
};

const clearSelection = () => {
  selectedProduct.value = null;
  searchQuery.value = "";
  fetchProducts();
  if (previewBlobUrl.value) {
    window.URL.revokeObjectURL(previewBlobUrl.value);
    previewBlobUrl.value = null;
  }
};

watch(codeType, () => {
  if (selectedProduct.value) fetchCodeImage(selectedProduct.value.id);
});
</script>

<template>
  <div class="container-fluid">
    <StockHeader />
    <BarCodeActions
      :is-printing-all="isPrintingAll"
      :products-count="products.length"
      @print-all="printAll"
    />

    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body">
        <div class="row align-items-end g-3">
          <div class="col-md-4">
            <BarCodeSearch
              v-model="searchQuery"
              :loading="loading"
              :products="products"
              :show-dropdown="showDropdown"
              @search-input="handleSearchInput"
              @select-product="selectProduct"
              @clear="clearSelection"
              @enter="handleEnter"
            />
          </div>
          <div class="col-md-8">
            <BarCodeConfig
              v-model:code-type="codeType"
              v-model:label-count="labelCount"
            >
              <template #actions>
                <button
                  @click="printSelected"
                  :disabled="!selectedProduct || isPrintingSelected"
                  class="btn btn-primary px-4 d-inline-flex align-items-center gap-2"
                >
                  <Loader2 v-if="isPrintingSelected" :size="18" class="spin" />
                  <Printer v-else :size="18" />
                  {{ isPrintingSelected ? "En cours..." : "Imprimer" }}
                </button>
              </template>
            </BarCodeConfig>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-5">
        <BarCodePreview
          :selected-product="selectedProduct"
          :preview-blob-url="previewBlobUrl"
          :code-type="codeType"
          @download="downloadCode"
        />
      </div>
      <div class="col-lg-7">
        <BarCodeProductList
          :products="products"
          :selected-product-id="selectedProduct?.id"
          @select-product="selectProduct"
        />
      </div>
    </div>
  </div>
</template>

<style>
.spin {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
