<template>
  <div class="container-fluid bg-light">
    <div class="d-flex flex-wrap gap-3 mb-3 border-bottom pb-2 small fw-bold">
      <span class="cursor-pointer text-white bg-red-dark px-2 py-1 rounded">
        <i class="bi bi-box-arrow-in-right"></i> Entré
      </span>
      <span @click="$router.push('/stock')" class="cursor-pointer nav-link-custom">
        <i class="bi bi-arrow-counterclockwise"></i> Retour des marchandises
      </span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-tag"></i> Category</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-file-earmark-text"></i> Fiche de Stock</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-clock-history"></i> Historique des Entres</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-activity"></i> Mouvement de stock</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-barcode"></i> Bar Code</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-cart"></i> Bon de Commande</span>
    </div>

    <h4 class="mb-4 fw-normal">Nouveau Produit</h4>

    <div class="bg-white p-4 border rounded shadow-sm">
      <form @submit.prevent @keydown.enter="preventInputEnterSubmit">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Code de produit</label>
            <div class="input-group">
              <input type="text" v-model="form.sku" class="form-control border-success" required />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Designation</label>
            <div class="input-group">
              <input type="text" v-model="form.name" class="form-control border-success" required />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Marque</label>
            <div class="input-group">
              <input type="text" v-model="form.brand" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Unité de mesure</label>
            <div class="input-group">
              <input type="text" v-model="form.unit" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>

          <div class="col-md-2">
            <label class="form-label text-uppercase small text-muted text-danger">Prix d'achat</label>
            <div class="input-group">
              <input type="number" step="0.01" v-model="form.purchase_price" class="form-control border-danger" />
              <span class="input-group-text bg-white border-danger text-danger"><i class="bi bi-x-lg"></i></span>
            </div>
          </div>
          <div class="col-md-2">
            <label class="form-label text-uppercase small text-muted">Prix de revient TVAC</label>
            <div class="input-group">
              <input type="number" step="0.01" v-model="form.cost_price_vat" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>

          <div class="col-md-2">
            <label class="form-label text-uppercase small text-muted">Taux de TVA (%)</label>
            <select v-model="form.tva_rate" @change="calculateFromHt" class="form-select border-secondary">
              <option :value="18">18</option>
              <option :value="10">10</option>
              <option :value="0">0</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">PV HTVA</label>
            <div class="input-group">
              <input type="number" step="0.01" v-model="form.selling_price_ht" @input="calculateFromHt" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-percent"></i></span>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">PV TVAC (Auto)</label>
            <div class="input-group">
              <input type="number" step="0.01" v-model="form.selling_price_ttc" @input="calculateFromTtc" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-calculator"></i></span>
            </div>
          </div>

          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Quantité Minimum</label>
            <div class="input-group">
              <input type="number" v-model="form.min_quantity" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Date d'expiration</label>
            <div class="input-group">
              <input type="date" v-model="form.expiry_date" class="form-control border-success" />
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-uppercase small text-muted">Catégorie</label>
            <div class="input-group">
              <select v-model="form.category_id" class="form-select border-success">
                <option value="">Sélectionner...</option>
                <option value="pieces">Pièces</option>
              </select>
              <span class="input-group-text bg-white border-success text-success"><i class="bi bi-check2"></i></span>
            </div>
          </div>
          <div class="col-md-12">
            <label class="form-label text-uppercase small text-muted">Spécification technique</label>
            <textarea v-model="form.specifications" class="form-control border-secondary" rows="3"></textarea>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" @click="$router.push('/stock')" class="btn btn-outline-secondary px-4 shadow-sm">
            Annuler
          </button>
          <button type="button" @click="submitProduct" class="btn btn-red-dark text-white px-5 py-2 shadow" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            Enregistrer le produit
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";

const router = useRouter();
const submitting = ref(false);

const form = reactive({
  sku: "",
  name: "",
  brand: "",
  unit: "",
  purchase_price: 0,
  cost_price_vat: 0,
  tva_rate: 18,
  selling_price_ht: 0,
  selling_price_ttc: 0,
  min_quantity: 0,
  expiry_date: "",
  category_id: "pieces",
  specifications: "",
});

// CALCULS BIDIRECTIONNELS POUR LA VENTE
const calculateFromHt = () => {
  const ht = parseFloat(form.selling_price_ht) || 0;
  const tva = parseFloat(form.tva_rate) || 0;
  form.selling_price_ttc = parseFloat((ht * (1 + tva / 100)).toFixed(2));
};

const calculateFromTtc = () => {
  const ttc = parseFloat(form.selling_price_ttc) || 0;
  const tva = parseFloat(form.tva_rate) || 0;
  form.selling_price_ht = parseFloat((ttc / (1 + tva / 100)).toFixed(2));
};

const preventInputEnterSubmit = (event) => {
  const target = event.target;
  if (!target || target.tagName === "TEXTAREA") return;

  if (target.tagName === "INPUT" || target.tagName === "SELECT") {
    event.preventDefault();
  }
};

const submitProduct = async () => {
  submitting.value = true;
  try {
    const response = await api.post("/products", form);
    if (response.data.success) {
      router.push("/stock");
    }
  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.bg-red-dark { background-color: #c51818 !important; }
.btn-red-dark { background-color: #c51818; border: 1px solid #c51818; font-weight: 500; }
.btn-red-dark:hover { background-color: #a11414; border-color: #a11414; }
.nav-link-custom { color: #666; text-decoration: none; transition: color 0.2s; }
.nav-link-custom:hover { color: #c51818 !important; }
.form-label { font-weight: 500; margin-bottom: 0.3rem; }
.border-success { border-color: #198754 !important; }
.border-danger { border-color: #dc3545 !important; }
.text-success { color: #198754 !important; }
.text-danger { color: #dc3545 !important; }
.cursor-pointer { cursor: pointer; }
.input-group-text { font-size: 0.8rem; }
</style>
