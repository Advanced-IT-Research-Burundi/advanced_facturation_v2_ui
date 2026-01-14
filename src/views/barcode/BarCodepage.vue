<script setup>
import { ref, watch, onMounted } from "vue";
import api from "../../services/api";
import StockHeader from "../stocks/StockHeader.vue";
import {
  Search,
  Download,
  Trash2,
  Package,
  Loader2,
  QrCode,
  Printer,
  X,
  Layers,
} from "lucide-vue-next";

const searchQuery = ref("");
const selectedProduct = ref(null);
const loading = ref(false);
const products = ref([]);
const showDropdown = ref(false);
const previewBlobUrl = ref(null);
const codeType = ref("barcode"); // 'barcode' or 'qrcode'
const labelCount = ref(1);

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
    // Handle Laravel pagination structure
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
    fetchProducts(); // Reset to all products
    showDropdown.value = false;
  }
};

// Fetch code image as blob
const fetchCodeImage = async (productId) => {
  try {
    const endpoint = codeType.value === "barcode" ? "barcode" : "qrcode";
    const response = await api.get(`/products/${productId}/${endpoint}`, {
      responseType: "blob",
    });
    const mimeType = "image/svg+xml";
    const blob = new Blob([response.data], { type: mimeType });

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
  const extension = "svg";
  link.download = `${codeType.value}-${selectedProduct.value.item_code}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const generatePrintContent = (itemsToPrint) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const itemsHtml = itemsToPrint
    .map((product) => {
      const imageUrl = `${baseUrl}/products/${product.id}/${codeType.value}`;
      const content = Array(product.count || 1)
        .fill(0)
        .map(
          () => `
            <div class="label-item">
                <div class="label-name">${product.item_designation}</div>
                <img src="${imageUrl}" class="label-img" style="${
            codeType.value === "qrcode" ? "width:120px;" : "width:100%;"
          }">
                <div class="label-code">${
                  product.barcode || product.item_code
                }</div>
            </div>
        `
        )
        .join("");
      return content;
    })
    .join("");

  return `
        <html>
            <head>
                <title>Impression Étiquettes</title>
                <style>
                    body { font-family: sans-serif; margin: 0; padding: 10px; }
                    .print-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                    }
                    .label-item {
                        border: 1px solid #eee;
                        padding: 10px;
                        text-align: center;
                        position: relative;
                        page-break-inside: avoid;
                    }
                    .label-name { font-size: 10px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .label-img { display: block; margin: 0 auto 5px; max-height: 80px; object-fit: contain; }
                    .label-code { font-size: 11px; font-family: monospace; font-weight: bold; }
                    @media print {
                        .print-grid { grid-template-columns: repeat(4, 1fr); gap: 5px; }
                        .label-item { border: 0.5px solid #ccc; }
                    }
                </style>
            </head>
            <body>
                <div class="print-grid">${itemsHtml}</div>
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.parent.document.body.removeChild(window.frameElement);
                        }, 500);
                    };
                <\/script>
            </body>
        </html>
    `;
};

const printSelected = () => {
  if (!selectedProduct.value) return;
  triggerPrint([{ ...selectedProduct.value, count: labelCount.value }]);
};

const printAll = () => {
  if (products.value.length === 0) return;
  const allItems = products.value.map((p) => ({
    ...p,
    count: labelCount.value,
  }));
  triggerPrint(allItems);
};

const triggerPrint = (items) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.write(generatePrintContent(items));
  doc.close();
};

const clearSelection = () => {
  selectedProduct.value = null;
  searchQuery.value = "";
  fetchProducts(); // Refresh list
  if (previewBlobUrl.value) {
    window.URL.revokeObjectURL(previewBlobUrl.value);
    previewBlobUrl.value = null;
  }
};

watch(codeType, () => {
  if (selectedProduct.value) {
    fetchCodeImage(selectedProduct.value.id);
  }
});
</script>

<template>
  <div class="container-fluid">
    <StockHeader />

    <div class="row mb-4 mt-3">
      <div class="col-md-6">
        <h1 class="h3 fw-bold">Générateur de Barcode & QR Code</h1>
      </div>
      <div class="col-md-6 text-end">
        <button
          @click="printAll"
          class="btn btn-dark d-inline-flex align-items-center gap-2 shadow-sm"
        >
          <Layers :size="18" /> Tout imprimer (Stock)
        </button>
      </div>
    </div>

    <!-- Main Card -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body">
        <div class="row align-items-end g-3">
          <div class="col-md-4 position-relative">
            <label
              class="form-label fw-semibold text-muted small text-uppercase ls-1"
              >1. Sélectionner un produit</label
            >
            <div class="input-group drop-parent">
              <span class="input-group-text bg-light border-end-0">
                <Search v-if="!loading" :size="18" class="text-muted" />
                <Loader2 v-else :size="18" class="text-primary spin" />
              </span>
              <input
                v-model="searchQuery"
                @input="handleSearchInput"
                @keyup.enter="handleEnter"
                @focus="showDropdown = searchQuery.length >= 2"
                type="text"
                class="form-control bg-light border-start-0 ps-0"
                placeholder="Rechercher..."
              />
              <button
                v-if="searchQuery"
                @click="clearSelection"
                class="btn btn-light border"
                type="button"
              >
                <X :size="16" />
              </button>
            </div>

            <!-- Dropdown Results -->
            <div
              v-if="showDropdown"
              class="dropdown-results shadow-lg border rounded-2 mt-1 position-absolute w-100 bg-white"
              style="
                z-index: 1050;
                left: 12px;
                width: calc(100% - 24px);
                max-height: 300px;
                overflow-y: auto;
              "
            >
              <div
                v-for="product in products"
                :key="product.id"
                @click="selectProduct(product)"
                class="dropdown-item p-3 border-bottom d-flex align-items-center gap-3 cursor-pointer"
              >
                <Package :size="18" class="text-primary opacity-75" />
                <div>
                  <div class="fw-bold text-dark mb-0 fs-6">
                    {{ product.item_designation }}
                  </div>
                  <small class="text-muted font-monospace">{{
                    product.item_code
                  }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <label
              class="form-label fw-semibold text-muted small text-uppercase ls-1"
              >2. Type de code</label
            >
            <div class="d-flex gap-2">
              <button
                @click="codeType = 'barcode'"
                class="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                :class="
                  codeType === 'barcode' ? 'btn-dark' : 'btn-outline-secondary'
                "
              >
                <Package :size="16" /> Barcode
              </button>
              <button
                @click="codeType = 'qrcode'"
                class="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                :class="
                  codeType === 'qrcode' ? 'btn-dark' : 'btn-outline-secondary'
                "
              >
                <QrCode :size="16" /> QR Code
              </button>
            </div>
          </div>

          <div class="col-md-2">
            <label
              class="form-label fw-semibold text-muted small text-uppercase ls-1"
              >3. Quantité p.p</label
            >
            <input
              type="number"
              v-model="labelCount"
              min="1"
              max="1000"
              class="form-control bg-light"
            />
          </div>

          <div class="col-md-3 text-end">
            <div class="d-flex gap-2 justify-content-end">
              <button
                @click="printSelected"
                :disabled="!selectedProduct"
                class="btn btn-primary px-4 d-inline-flex align-items-center gap-2"
              >
                <Printer :size="18" /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview & Grid -->
    <div class="row g-4">
      <!-- Left: Live Preview -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white border-bottom py-3">
            <h5 class="card-title mb-0 fw-bold d-flex align-items-center gap-2">
              <span class="p-1 bg-primary bg-opacity-10 rounded text-primary"
                >01</span
              >
              Aperçu de l'étiquette
            </h5>
          </div>
          <div
            class="card-body text-center py-5 d-flex align-items-center justify-content-center"
          >
            <div
              v-if="selectedProduct && previewBlobUrl"
              class="preview-container w-100"
            >
              <div
                class="label-wrapper d-inline-block bg-white border p-4 rounded shadow-sm"
              >
                <h5
                  class="fw-bold mb-3 text-uppercase ls-1 text-truncate"
                  style="max-width: 300px"
                >
                  {{ selectedProduct.item_designation }}
                </h5>

                <div
                  class="code-preview-box mb-3 d-flex justify-content-center bg-light p-3 rounded"
                >
                  <img
                    :src="previewBlobUrl"
                    alt="Code Preview"
                    :class="
                      codeType === 'barcode' ? 'barcode-img' : 'qrcode-img'
                    "
                  />
                </div>

                <div
                  class="font-monospace fs-4 fw-bold tracking-widest text-dark"
                >
                  {{ selectedProduct.barcode || selectedProduct.item_code }}
                </div>
              </div>
              <div class="mt-3">
                <button
                  @click="downloadCode"
                  class="btn btn-sm btn-outline-dark gap-2 d-inline-flex"
                >
                  <Download :size="14" /> Télécharger
                </button>
              </div>
            </div>

            <div v-else class="py-5 text-muted text-center">
              <div class="mb-4 opacity-10">
                <Package :size="100" />
              </div>
              <h5>Prêt pour la génération</h5>
              <p class="small">
                Sélectionnez un produit dans la liste à droite pour voir
                l'aperçu ou imprimez tout le stock.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Fast Selection List -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm h-100 overflow-hidden">
          <div
            class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center"
          >
            <h5 class="card-title mb-0 fw-bold d-flex align-items-center gap-2">
              <span class="p-1 bg-primary bg-opacity-10 rounded text-primary"
                >02</span
              >
              Liste des Produits (Stock)
            </h5>
            <div class="badge bg-light text-dark border">
              {{ products.length }} produits
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 500px">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light sticky-top">
                  <tr>
                    <th class="ps-4">Designation</th>
                    <th>Code</th>
                    <th class="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="product in products"
                    :key="product.id"
                    :class="{
                      'table-primary-subtle':
                        selectedProduct?.id === product.id,
                    }"
                  >
                    <td class="ps-4">
                      <div class="fw-bold">{{ product.item_designation }}</div>
                      <small class="text-muted">{{
                        product.marque || "Standard"
                      }}</small>
                    </td>
                    <td>
                      <code class="text-primary">{{ product.item_code }}</code>
                    </td>
                    <td class="text-end pe-4">
                      <button
                        @click="selectProduct(product)"
                        class="btn btn-sm btn-outline-primary rounded-pill px-3"
                      >
                        Choisir
                      </button>
                    </td>
                  </tr>
                  <tr v-if="products.length === 0">
                    <td colspan="3" class="text-center py-5">
                      <div
                        class="spinner-border spinner-border-sm text-primary me-2"
                      ></div>
                      Chargement...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.dropdown-item {
  transition: background 0.2s;
}
.dropdown-item:hover {
  background-color: #f8fafc;
}
.ls-1 {
  letter-spacing: 1px;
}
.tracking-widest {
  letter-spacing: 0.3rem;
}

.label-wrapper {
  min-width: 320px;
  border: 1px solid #dee2e6;
}

.barcode-img {
  height: 100px;
  width: 100%;
  object-fit: contain;
}

.qrcode-img {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

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

.font-monospace {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.table-primary-subtle {
  background-color: #e7f1ff !important;
}

@media (max-width: 576px) {
  .label-wrapper {
    min-width: 100%;
  }
}
</style>
