<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
import api from "@/services/api";

// Child Components
import SalesHeader from "./SalesHeader.vue";
import POS from "./POS.vue";
import CartPanel from "./CartPanel.vue";
import InvoiceService from "./InvoiceService.vue";
import ProformaService from "./ProformaService.vue";
import ProformaFormModal from "./ProformaFormModal.vue";
import FactureAvoir from "./FactureAvoir.vue";
import Refund from "./Refund.vue";

const store = useStore();

// --- GLOBAL STATE ---
const activeTab = ref("POS");
const isSubmitting = ref(false);
const customers = ref([]);
const cart = ref(JSON.parse(localStorage.getItem("pos_cart") || "[]"));

// --- PROFORMA STATE ---
// Map state from Vuex
const proformas = computed(() => store.getters["proformats/allProformats"]);
const isLoadingProformas = computed(() => store.getters["proformats/isLoading"]);
const searchProforma = ref("");
const showProformaForm = ref(false);
const isEditingProforma = ref(false);
const editingProformaData = ref(null);

// --- INITIALIZATION ---
const fetchCustomers = async () => {
  try {
    const response = await api.get("/customers");
    if (response.data.success) customers.value = response.data.data.data;
  } catch (e) {
    console.error("Error fetching customers", e);
  }
};

const fetchProformas = () => {
  store.dispatch("proformats/fetchProformas");
};

onMounted(() => {
  fetchCustomers();
  fetchProformas();
});

// --- CART LOGIC ---
const addToCart = (product) => {
  const existing = cart.value.find((i) => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.value.push({ ...product, quantity: 1 });
};

const updateQuantity = (id, delta) => {
  const item = cart.value.find((i) => i.id === id);
  if (item && item.quantity + delta > 0) item.quantity += delta;
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter((i) => i.id !== id);
};

watch(
  cart,
  (newCart) => {
    localStorage.setItem("pos_cart", JSON.stringify(newCart));
  },
  { deep: true }
);

// --- SUBMISSION LOGIC ---
const handleInvoiceSubmit = async (payload) => {
  isSubmitting.value = true;
  try {
    const response = await api.post("/invoices", payload);
    if (response.data.success) {
      alert("Succès !");
      if (payload.invoice_action === "POS") {
        cart.value = [];
        // Optional: refresh POS products if we had a ref
      }
      // If we created a standard invoice, maybe refresh proformas/invoices list?
      // fetchProformas(); // Only if we want to mix lists
    } else {
      alert("Erreur: " + response.data.message);
    }
  } catch (e) {
    alert("Erreur lors de la soumission.");
  } finally {
    isSubmitting.value = false;
  }
};

const handleProformaSave = async (payload) => {
  isSubmitting.value = true;
  let result;
  
  if (payload.id) {
      // Update
      result = await store.dispatch("proformats/updateProforma", {
          id: payload.id, 
          data: payload.data || payload // payload might be {id, data} or just data depending on emitter
      });
  } else {
      // Create
      result = await store.dispatch("proformats/createProforma", payload);
  }

  isSubmitting.value = false;
  
  if (result.success) {
      showProformaForm.value = false;
      // Alert is optional, maybe just close modal
  } else {
      alert(result.message || "Erreur lors de l'enregistrement");
  }
};

const handleProformaDelete = async (proforma) => {
    const result = await store.dispatch("proformats/deleteProforma", proforma.id || proforma.invoice_number); // Check what ID we use
    if (!result.success) {
        alert("Erreur lors de la suppression");
    }
};

const openNewProforma = () => {
  isEditingProforma.value = false;
  editingProformaData.value = null;
  showProformaForm.value = true;
};

const handleEditProforma = (data) => {
  isEditingProforma.value = true;
  editingProformaData.value = data;
  showProformaForm.value = true;
};

// --- VIEW PROFORMA LOGIC ---
const showProformaDetails = ref(false);
const selectedProforma = ref(null);

const handleViewProforma = (proforma) => {
  selectedProforma.value = proforma;
  showProformaDetails.value = true;
};

const closeProformaDetails = () => {
    showProformaDetails.value = false;
    selectedProforma.value = null;
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return "0";
  const num = parseFloat(price);
  return !isNaN(num) ? num.toLocaleString() : "0";
};

const printProforma = () => {
  const printContent = document.getElementById('proforma-printable');
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = printContent.innerHTML;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload(); 
};
</script>

<template>
  <div class="d-flex flex-column overflow-hidden h-100" style="margin: -1.5rem">
    <SalesHeader v-model="activeTab" />

    <div class="row flex-grow-1 g-0 overflow-hidden">
      <!-- Main Content Area -->
      <div
        class="d-flex flex-column bg-light border-end overflow-hidden"
        :class="activeTab === 'POS' ? 'col-12 col-lg-8' : 'col-12'"
      >
        <POS v-if="activeTab === 'POS'" @add-to-cart="addToCart" />
        <InvoiceService
          v-else-if="activeTab === 'Service'"
          :is-submitting="isSubmitting"
          @submit="handleInvoiceSubmit"
        />
        <ProformaService
          v-else-if="activeTab === 'Proforma'"
          :proformas="proformas"
          :is-loading="isLoadingProformas"
          v-model:search-text="searchProforma"
          @create="openNewProforma"
          @edit="handleEditProforma"
          @delete="handleProformaDelete"
          @view="handleViewProforma"
        />
        <Refund v-else-if="activeTab === 'Caution'" />
        <FactureAvoir v-else-if="activeTab === 'Avoir'" />
      </div>

      <!-- Right Panel (Cart - only for POS) -->
      <CartPanel
        v-if="activeTab === 'POS'"
        :cart="cart"
        :customers="customers"
        :is-submitting="isSubmitting"
        @remove-from-cart="removeFromCart"
        @update-quantity="updateQuantity"
        @invoice-submitted="handleInvoiceSubmit"
      />
    </div>

    <!-- Modals -->
    <ProformaFormModal
      v-if="showProformaForm"
      :show="showProformaForm"
      :is-editing="isEditingProforma"
      :is-submitting="isSubmitting"
      :initial-data="editingProformaData"
      :customers="customers"
      @close="showProformaForm = false"
      @save="handleProformaSave"
    />

    <!-- MODAL DÉTAILS/APERÇU PROFORMA -->
    <div v-if="showProformaDetails && selectedProforma" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Proforma - {{ selectedProforma.invoice_number || 'APERÇU' }}</h5>
            <button type="button" class="btn-close" @click="closeProformaDetails"></button>
          </div>
          <div class="modal-body" id="proforma-printable">
            <!-- En-tête -->
            <div class="text-center mb-4 border-bottom pb-3">
              <h3 class="fw-bold">PROFORMA SERVICE</h3>
              <p class="mb-1">N° {{ selectedProforma.invoice_number || '---' }}</p>
              <p class="text-muted">Date: {{ new Date(selectedProforma.invoice_date).toLocaleDateString() }}</p>
            </div>

            <!-- Infos Client -->
            <div class="row mb-4">
              <div class="col-6">
                <h6 class="fw-bold">Client:</h6>
                <p class="mb-0">{{ selectedProforma.customer_name }}</p>
                <p class="text-muted">{{ selectedProforma.customer_TIN }}</p>
              </div>
              <div class="col-6 text-end">
                <p><strong>Devise:</strong> {{ selectedProforma.invoice_currency }}</p>
                <p><strong>Statut:</strong> {{ selectedProforma.obr_submission_status }}</p>
              </div>
            </div>

            <!-- Tableau des articles -->
            <table class="table table-bordered">
              <thead class="bg-light">
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qté</th>
                  <th>PU HT</th>
                  <th>TVA</th>
                  <th>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in selectedProforma.invoice_items" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ item.item_designation }}</td>
                  <td>{{ item.item_quantity }}</td>
                  <td>{{ formatPrice(item.item_price) }}</td>
                  <td>{{ item.vat }}%</td>
                  <td>{{ formatPrice(item.item_total_amount) }}</td>
                </tr>
              </tbody>
              <tfoot class="fw-bold">
                <tr>
                  <td colspan="5" class="text-end">Total HT</td>
                  <td>{{ formatPrice(selectedProforma.invoice_amount_nvat) }}</td>
                </tr>
                <tr>
                  <td colspan="5" class="text-end">TVA</td>
                  <td>{{ formatPrice(selectedProforma.invoice_vat_amount) }}</td>
                </tr>
                <tr class="table-primary">
                  <td colspan="5" class="text-end">TOTAL TTC</td>
                  <td>{{ formatPrice(selectedProforma.invoice_total_amount) }} {{ selectedProforma.invoice_currency }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeProformaDetails">Fermer</button>
            <button class="btn btn-primary" @click="printProforma">
              Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.cursor-pointer {
  cursor: pointer;
}
.animate-spin {
  animation: spin 1s linear infinite;
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
