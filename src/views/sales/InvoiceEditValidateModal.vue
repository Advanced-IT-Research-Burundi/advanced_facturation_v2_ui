<script setup>
import { ref, reactive, computed, watch } from "vue";
import { useStore } from "vuex";
import {
  X,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  Loader2,
  AlertCircle,
  User,
  ShoppingBag,
  Building2,
  CreditCard,
  Tag,
} from "lucide-vue-next";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  invoice: {
    type: Object,
    default: null,
  },
  customers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "validated", "updated"]);

const store = useStore();
const toast = useToast();

const isLoading = ref(false);
const isSaving = ref(false);
const isValidating = ref(false);
const errorMessage = ref("");
const useLibellePrices = ref(false);

// Editable Form State
const form = reactive({
  customer_id: null,
  customer_name: "",
  customer_TIN: "",
  warehouse_id: null,
  payment_type: "1",
  payment_method_id: null,
  invoice_currency: "BIF",
  items: [],
});

const warehouses = ref([]);
const productsList = ref([]);
const libellesList = ref([]);
const clientSearchText = ref("");

const fetchWarehouses = async () => {
  try {
    const res = await api.get("/warehouses");
    if (res.data?.success) {
      warehouses.value = res.data.data?.data || res.data.data || [];
    }
  } catch (e) {
    console.error("Error fetching warehouses", e);
  }
};

const fetchLibelles = async () => {
  try {
    const res = await api.get("/libelles", { params: { per_page: 100 } });
    if (res.data?.success) {
      libellesList.value = res.data.data?.data || res.data.data || [];
    }
  } catch (e) {
    console.error("Error fetching libelles", e);
  }
};

const fetchProducts = async () => {
  const cached = store.state.data?.productsPOS || [];
  if (cached.length > 0) {
    productsList.value = cached;
    return;
  }
  try {
    const res = await api.get("/products", { params: { per_page: 500 } });
    if (res.data?.success) {
      productsList.value = res.data.data?.data || res.data.data || [];
    }
  } catch (e) {
    console.error("Error fetching products", e);
  }
};

const resolveLibelleInfo = (product, fallbackItem) => {
  let libellePrice = 0;
  let libelleName = "";

  // 1. Direct libelle relation on product
  if (product?.libelle) {
    libellePrice = Number(product.libelle.price) || 0;
    libelleName = product.libelle.name || "";
  }

  // 2. Lookup via id_libelle in libelles table
  if (libellePrice <= 0 && product?.id_libelle) {
    const foundLibelle = libellesList.value.find((l) => l.id === product.id_libelle);
    if (foundLibelle) {
      libellePrice = Number(foundLibelle.price) || 0;
      libelleName = foundLibelle.name || "";
    }
  }

  // 3. Fallback on libelle_price if already loaded on item / product
  if (libellePrice <= 0) {
    libellePrice = Number(product?.libelle_price || fallbackItem?.libelle_price) || 0;
    libelleName = product?.libelle_name || fallbackItem?.libelle_name || "";
  }

  return {
    libellePrice,
    libelleName,
    hasLibelle: libellePrice > 0,
  };
};

const findProductInfo = (productId, itemDesignation) => {
  if (productId) {
    const found = productsList.value.find((p) => p.id === productId);
    if (found) return found;
  }
  if (itemDesignation) {
    const found = productsList.value.find(
      (p) =>
        (p.name && p.name.toLowerCase() === itemDesignation.toLowerCase()) ||
        (p.item_designation &&
          p.item_designation.toLowerCase() === itemDesignation.toLowerCase())
    );
    if (found) return found;
  }
  return null;
};

const initFromInvoice = (inv) => {
  if (!inv) return;
  errorMessage.value = "";
  useLibellePrices.value = false;

  form.customer_id = inv.customer_id || inv.customer?.id || null;
  form.customer_name = inv.customer_name || inv.customer?.customer_name || "";
  form.customer_TIN = inv.customer_TIN || inv.customer?.customer_TIN || "";
  clientSearchText.value = form.customer_name;
  form.warehouse_id = inv.warehouse_id || null;
  form.payment_type = inv.payment_type || "1";
  form.payment_method_id = inv.payment_method_id || null;
  form.invoice_currency = inv.invoice_currency || "BIF";

  const rawItems = inv.invoice_items || inv.invoiceItems || [];
  if (rawItems.length > 0) {
    form.items = rawItems.map((item) => {
      const prod = item.product || findProductInfo(item.product_id, item.item_designation);
      const { libellePrice, libelleName, hasLibelle } = resolveLibelleInfo(prod, item);
      const baseProductPrice = Number(prod?.price || prod?.unit_price || item.item_price) || 0;

      return {
        id: item.id,
        product_id: item.product_id || prod?.id || null,
        item_designation: item.item_designation || prod?.name || prod?.item_designation || "",
        item_quantity: Number(item.item_quantity) || 1,
        item_price: Number(item.item_price) || 0,
        product_price: baseProductPrice,
        libelle_price: libellePrice,
        libelle_name: libelleName,
        has_libelle: hasLibelle,
        vat: Number(item.vat) || 0,
        item_ct: Number(item.item_ct) || 0,
        item_tl: Number(item.item_tl) || 0,
      };
    });
  } else {
    form.items = [
      {
        product_id: null,
        item_designation: "",
        item_quantity: 1,
        item_price: 0,
        product_price: 0,
        libelle_price: 0,
        libelle_name: "",
        has_libelle: false,
        vat: 0,
        item_ct: 0,
        item_tl: 0,
      },
    ];
  }
};

watch(
  () => props.show,
  async (isShown) => {
    if (isShown && props.invoice) {
      await Promise.all([fetchWarehouses(), fetchLibelles(), fetchProducts()]);

      // If invoice doesn't have lines loaded, fetch full details
      if (!props.invoice.invoice_items && !props.invoice.invoiceItems) {
        isLoading.value = true;
        try {
          const res = await api.get(`/invoices/${props.invoice.id}`);
          initFromInvoice(res.data?.data || props.invoice);
        } catch (e) {
          console.error("Error fetching invoice details:", e);
          initFromInvoice(props.invoice);
        } finally {
          isLoading.value = false;
        }
      } else {
        initFromInvoice(props.invoice);
      }
    }
  },
  { immediate: true }
);

// --- PRIX LIBELLÉ TOGGLE LOGIC ---
const applyPriceMode = () => {
  let countApplied = 0;
  form.items.forEach((item) => {
    const libellePrice = Number(item.libelle_price) || 0;
    const basePrice = Number(item.product_price) || Number(item.item_price) || 0;

    if (useLibellePrices.value && libellePrice > 0) {
      item.item_price = libellePrice;
      countApplied++;
    } else if (!useLibellePrices.value && basePrice > 0) {
      item.item_price = basePrice;
    }
  });
  return countApplied;
};

const toggleLibellePrices = () => {
  useLibellePrices.value = !useLibellePrices.value;
  const count = applyPriceMode();
  if (useLibellePrices.value) {
    if (count > 0) {
      toast.success(`Prix des libellés appliqués sur ${count} article(s).`);
    } else {
      toast.info("Aucun des articles de cette facture ne possède de libellé avec prix configuré.");
    }
  } else {
    toast.info("Prix standards des produits rétablis.");
  }
};

// Filtered customers for autocompletion
const filteredCustomers = computed(() => {
  if (!clientSearchText.value || form.customer_id) return [];
  const term = clientSearchText.value.toLowerCase();
  return props.customers.filter(
    (c) =>
      c.customer_name?.toLowerCase().includes(term) ||
      c.customer_TIN?.includes(term)
  );
});

const selectCustomer = (c) => {
  form.customer_id = c.id;
  form.customer_name = c.customer_name;
  form.customer_TIN = c.customer_TIN || "";
  clientSearchText.value = c.customer_name;
};

const clearCustomer = () => {
  form.customer_id = null;
  form.customer_name = "";
  form.customer_TIN = "";
  clientSearchText.value = "";
};

const addItem = () => {
  form.items.push({
    product_id: null,
    item_designation: "",
    item_quantity: 1,
    item_price: 0,
    product_price: 0,
    libelle_price: 0,
    libelle_name: "",
    has_libelle: false,
    vat: 0,
    item_ct: 0,
    item_tl: 0,
  });
};

const removeItem = (index) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1);
  }
};

// Calculations
const totals = computed(() => {
  let totalHT = 0;
  let totalVAT = 0;

  form.items.forEach((item) => {
    const qty = Number(item.item_quantity) || 0;
    const price = Number(item.item_price) || 0;
    const vat = Number(item.vat) || 0;

    const lineHT = price * qty;
    const lineVAT = (lineHT * vat) / 100;

    totalHT += lineHT;
    totalVAT += lineVAT;
  });

  return {
    ht: totalHT,
    vat: totalVAT,
    ttc: totalHT + totalVAT,
  };
});

const formatMoney = (val) => {
  return (Number(val) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const buildPayload = () => ({
  customer_id: form.customer_id,
  warehouse_id: form.warehouse_id,
  payment_type: form.payment_type,
  payment_method_id: form.payment_method_id,
  invoice_currency: form.invoice_currency,
  items: form.items.map((i) => ({
    product_id: i.product_id,
    item_designation: i.item_designation,
    item_quantity: Number(i.item_quantity) || 1,
    item_price: Number(i.item_price) || 0,
    vat: Number(i.vat) || 0,
    item_ct: Number(i.item_ct) || 0,
    item_tl: Number(i.item_tl) || 0,
  })),
});

const validateForm = () => {
  if (!form.customer_id) {
    errorMessage.value = "Veuillez sélectionner un client.";
    return false;
  }
  if (!form.items.length) {
    errorMessage.value = "La facture doit contenir au moins un article.";
    return false;
  }
  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i];
    if (!item.item_designation?.trim()) {
      errorMessage.value = `L'article #${i + 1} n'a pas de désignation.`;
      return false;
    }
    if (Number(item.item_quantity) <= 0) {
      errorMessage.value = `La quantité de l'article #${i + 1} doit être supérieure à 0.`;
      return false;
    }
    if (Number(item.item_price) < 0) {
      errorMessage.value = `Le prix de l'article #${i + 1} est invalide.`;
      return false;
    }
  }
  errorMessage.value = "";
  return true;
};

// Save draft modifications without validating
const handleSave = async () => {
  if (!validateForm()) return;

  isSaving.value = true;
  errorMessage.value = "";
  try {
    const res = await api.put(`/invoices/${props.invoice.id}`, buildPayload());
    if (res.data?.success) {
      toast.success("Facture mise à jour avec succès.");
      emit("updated", res.data.data);
      emit("close");
    } else {
      errorMessage.value = res.data?.message || "Erreur lors de la mise à jour.";
    }
  } catch (e) {
    errorMessage.value =
      e.response?.data?.message || "Erreur lors de l'enregistrement de la facture.";
  } finally {
    isSaving.value = false;
  }
};

// Validate and emit invoice
const handleValidate = async () => {
  if (!validateForm()) return;

  isValidating.value = true;
  errorMessage.value = "";
  try {
    const res = await api.post(`/invoices/${props.invoice.id}/validate`, buildPayload());
    if (res.data?.success) {
      toast.success("Facture validée avec succès !");
      emit("validated", res.data.data?.invoice || res.data.data);
      emit("close");
    } else {
      errorMessage.value = res.data?.message || "Erreur lors de la validation.";
    }
  } catch (e) {
    errorMessage.value =
      e.response?.data?.message ||
      e.response?.data?.stock_details?.[0] ||
      "Erreur lors de la validation de la facture.";
  } finally {
    isValidating.value = false;
  }
};
</script>

<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.6)"
    @click.self="emit('close')"
  >
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content shadow-lg border-0 rounded-4">
        <!-- Header -->
        <div class="modal-header bg-light border-bottom px-4 py-3">
          <div>
            <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-1">
              <ShoppingBag class="text-primary" :size="22" />
              <span>Modification & Validation Facture</span>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-6">
                {{ invoice?.invoice_number }}
              </span>
            </h5>
            <small class="text-muted">
              Vérifiez les articles, appliquez les prix des libellés si souhaité, et validez définitivement
            </small>
          </div>
          <button
            type="button"
            class="btn-close"
            :disabled="isSaving || isValidating"
            @click="emit('close')"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <div v-if="isLoading" class="text-center py-5">
            <Loader2 class="animate-spin text-primary mx-auto mb-2" :size="32" />
            <p class="text-muted">Chargement des informations de la facture...</p>
          </div>

          <div v-else>
            <!-- Error Alert -->
            <div
              v-if="errorMessage"
              class="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4"
            >
              <AlertCircle :size="18" class="flex-shrink-0" />
              <div>{{ errorMessage }}</div>
            </div>

            <!-- Top Info Bar: Client & Warehouse & Payment -->
            <div class="card border border-light-subtle rounded-3 bg-light p-3 mb-4">
              <div class="row g-3 align-items-center">
                <!-- Customer Selection -->
                <div class="col-md-5">
                  <label class="form-label fw-semibold small text-secondary mb-1">
                    Client <span class="text-danger">*</span>
                  </label>
                  <div class="position-relative">
                    <div class="input-group input-group-sm">
                      <span class="input-group-text bg-white">
                        <User :size="14" />
                      </span>
                      <input
                        v-model="clientSearchText"
                        type="text"
                        class="form-control"
                        placeholder="Rechercher un client..."
                        @input="form.customer_id = null"
                      />
                      <button
                        v-if="form.customer_id"
                        class="btn btn-outline-secondary"
                        type="button"
                        @click="clearCustomer"
                      >
                        <X :size="14" />
                      </button>
                    </div>

                    <!-- Autocomplete Dropdown -->
                    <div
                      v-if="filteredCustomers.length > 0"
                      class="dropdown-menu show w-100 shadow-sm mt-1 position-absolute"
                      style="max-height: 200px; overflow-y: auto; z-index: 1050"
                    >
                      <button
                        v-for="c in filteredCustomers"
                        :key="c.id"
                        class="dropdown-item py-2"
                        type="button"
                        @click="selectCustomer(c)"
                      >
                        <div class="fw-semibold">{{ c.customer_name }}</div>
                        <small class="text-muted">NIF: {{ c.customer_TIN || 'N/A' }}</small>
                      </button>
                    </div>
                  </div>
                  <div v-if="form.customer_id" class="mt-1 small text-success">
                    ✓ Client sélectionné : {{ form.customer_name }}
                  </div>
                </div>

                <!-- Warehouse Selection -->
                <div class="col-md-4">
                  <label class="form-label fw-semibold small text-secondary mb-1">
                    Entrepôt / Stock
                  </label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-white">
                      <Building2 :size="14" />
                    </span>
                    <select v-model="form.warehouse_id" class="form-select">
                      <option :value="null">Stock principal (Par défaut)</option>
                      <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                        {{ wh.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Payment Type -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold small text-secondary mb-1">
                    Mode de Règlement
                  </label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-white">
                      <CreditCard :size="14" />
                    </span>
                    <select v-model="form.payment_type" class="form-select">
                      <option value="1">1 - Espèces (Cash)</option>
                      <option value="2">2 - Banque / Virement</option>
                      <option value="3">3 - À Crédit</option>
                      <option value="4">4 - Autres (Mobile Money)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Table Section -->
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <h6 class="fw-bold text-dark mb-0">Lignes d'articles</h6>
                  <span class="badge bg-secondary-subtle text-secondary small">
                    {{ form.items.length }} article(s)
                  </span>
                </div>

                <div class="d-flex align-items-center gap-2">
                  <!-- Case à cocher Prix libellé (liée à la table libelles) -->
                  <label
                    class="btn btn-sm btn-light border text-primary d-flex align-items-center gap-2 cart-price-toggle cursor-pointer shadow-sm mb-0"
                    title="Appliquer les prix issus de la table libelles"
                  >
                    <input
                      type="checkbox"
                      class="form-check-input mt-0 cursor-pointer"
                      :checked="useLibellePrices"
                      :disabled="form.items.length === 0 || isSaving || isValidating"
                      @change="toggleLibellePrices"
                    />
                    <Tag :size="14" />
                    <span class="fw-semibold">Prix libellé</span>
                  </label>

                  <!-- Ajouter une ligne -->
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    :disabled="isSaving || isValidating"
                    @click="addItem"
                  >
                    <Plus :size="14" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>
              </div>

              <div class="table-responsive border rounded-3">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light text-secondary small">
                    <tr>
                      <th style="width: 38%">Désignation article</th>
                      <th style="width: 14%" class="text-center">Quantité</th>
                      <th style="width: 20%" class="text-end">Prix Unitaire (HT)</th>
                      <th style="width: 10%" class="text-center">TVA</th>
                      <th style="width: 14%" class="text-end">Total TTC</th>
                      <th style="width: 4%"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in form.items" :key="idx">
                      <td>
                        <input
                          v-model="item.item_designation"
                          type="text"
                          class="form-control form-control-sm mb-1"
                          placeholder="Nom de l'article / service..."
                        />
                        <div v-if="item.has_libelle" class="d-flex align-items-center gap-1">
                          <span
                            class="badge small"
                            :class="
                              useLibellePrices
                                ? 'bg-success text-white'
                                : 'bg-primary-subtle text-primary border border-primary-subtle'
                            "
                          >
                            <Tag :size="10" class="me-1" />
                            Libellé : {{ item.libelle_name || 'Lié' }} ({{ formatMoney(item.libelle_price) }} {{ form.invoice_currency }})
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          v-model.number="item.item_quantity"
                          type="number"
                          min="0.01"
                          step="any"
                          class="form-control form-control-sm text-center"
                        />
                      </td>
                      <td>
                        <div class="input-group input-group-sm">
                          <input
                            v-model.number="item.item_price"
                            type="number"
                            min="0"
                            step="any"
                            class="form-control text-end"
                            :class="{ 'bg-success-subtle text-success fw-bold': useLibellePrices && item.has_libelle }"
                          />
                        </div>
                      </td>
                      <td>
                        <select v-model.number="item.vat" class="form-select form-select-sm text-center">
                          <option :value="0">0%</option>
                          <option :value="10">10%</option>
                          <option :value="18">18%</option>
                        </select>
                      </td>
                      <td class="text-end fw-semibold">
                        {{
                          formatMoney(
                            (Number(item.item_price) || 0) *
                              (Number(item.item_quantity) || 0) *
                              (1 + (Number(item.vat) || 0) / 100)
                          )
                        }}
                      </td>
                      <td class="text-center">
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm p-1 border-0"
                          title="Supprimer la ligne"
                          :disabled="form.items.length <= 1"
                          @click="removeItem(idx)"
                        >
                          <Trash2 :size="15" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Totals Recap -->
            <div class="row justify-content-end">
              <div class="col-md-5">
                <div class="card border border-light-subtle rounded-3 bg-light p-3">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Total Hors Taxe (HT) :</span>
                    <span class="fw-semibold">{{ formatMoney(totals.ht) }} {{ form.invoice_currency }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Total TVA :</span>
                    <span class="fw-semibold">{{ formatMoney(totals.vat) }} {{ form.invoice_currency }}</span>
                  </div>
                  <div class="border-top pt-2 d-flex justify-content-between">
                    <span class="fw-bold fs-6 text-dark">Total Net TTC :</span>
                    <span class="fw-bold fs-5 text-primary">
                      {{ formatMoney(totals.ttc) }} {{ form.invoice_currency }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :disabled="isSaving || isValidating"
            @click="emit('close')"
          >
            Fermer
          </button>

          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-outline-primary d-flex align-items-center gap-2"
              :disabled="isSaving || isValidating || isLoading"
              @click="handleSave"
            >
              <Loader2 v-if="isSaving" class="animate-spin" :size="16" />
              <Save v-else :size="16" />
              <span>Enregistrer sans valider</span>
            </button>

            <button
              type="button"
              class="btn btn-success d-flex align-items-center gap-2 shadow-sm"
              :disabled="isSaving || isValidating || isLoading"
              @click="handleValidate"
            >
              <Loader2 v-if="isValidating" class="animate-spin" :size="16" />
              <CheckCircle v-else :size="16" />
              <span>Valider & Émettre la facture</span>
            </button>
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
.animate-spin {
  animation: spin 1s linear infinite;
}
.cart-price-toggle {
  user-select: none;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
