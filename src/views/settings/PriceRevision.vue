<script setup>
import { computed, onMounted, ref } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

const loading = ref(false);
const applying = ref(false);
const produits = ref([]);
const sansPrix = ref([]);
const entrepot = ref(null);
const search = ref("");

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const ttc = (price, vat) => Number(price || 0) * (1 + Number(vat || 0) / 100);
const getApiError = (err, fallback) => err.response?.data?.message || fallback;

const normalize = (value) =>
  String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const aAjouter = computed(() => produits.value.filter((p) => p.missing_in_warehouse).length);
const prixARevoir = computed(() => produits.value.filter((p) => p.source !== "aucun").length);

const produitsFiltres = computed(() => {
  const terme = normalize(search.value).trim();
  if (!terme) return produits.value;
  return produits.value.filter(
    (p) => normalize(p.item_designation).includes(terme) || normalize(p.item_code).includes(terme)
  );
});

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await api.get("/products/price-revision");
    produits.value = response.data.data.produits;
    sansPrix.value = response.data.data.sans_prix;
    entrepot.value = response.data.data.entrepot;
  } catch (err) {
    toast.error(getApiError(err, "Impossible de charger la révision des prix."));
  } finally {
    loading.value = false;
  }
};

const applyRevision = async () => {
  const confirmed = await confirmDialog(
    `Appliquer la révision sur ${produits.value.length} produit(s) ? Le prix du produit sera recopié sur tous ses stocks (ou, s'il n'a pas de prix, le prix du stock deviendra le prix du produit) et ${aAjouter.value} produit(s) seront ajoutés dans ${entrepot.value?.name ?? "le stock par défaut"} avec une quantité de 0.`
  );
  if (!confirmed) return;

  applying.value = true;
  try {
    const response = await api.post("/products/price-revision");
    toast.success(response.data.message);
    await fetchData();
  } catch (err) {
    toast.error(getApiError(err, "Erreur lors de la révision des prix."));
  } finally {
    applying.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <div>
    <div class="card shadow-sm mb-3">
      <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h5 class="mb-1">Aligner les prix du stock sur les prix produits</h5>
          <div class="text-muted small">
            Le <strong>prix du produit</strong> fait référence et est recopié sur tous ses stocks. Si le produit n'a
            pas de prix, c'est le prix du stock qui devient le prix du produit.<br />
            <strong>{{ prixARevoir }}</strong> prix à réviser —
            <strong>{{ aAjouter }}</strong> produit(s) à ajouter dans
            <strong>{{ entrepot?.name ?? "le stock par défaut" }}</strong> (quantité 0).
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" :disabled="loading || applying" @click="fetchData">
            <i class="bi bi-arrow-clockwise"></i> Actualiser
          </button>
          <button
            class="btn btn-warning d-inline-flex align-items-center gap-2"
            :disabled="loading || applying || produits.length === 0"
            @click="applyRevision"
          >
            <span v-if="applying" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-repeat"></i>
            Réviser les prix
          </button>
        </div>
      </div>
    </div>

    <div v-if="sansPrix.length" class="alert alert-danger">
      <div class="fw-semibold mb-1">
        <i class="bi bi-exclamation-triangle-fill me-1"></i>
        {{ sansPrix.length }} produit(s) sans aucun prix (ni produit, ni stock) : à saisir manuellement.
      </div>
      <div class="small">
        <span v-for="(p, index) in sansPrix" :key="p.id">
          {{ p.item_designation }} ({{ p.item_code }})<span v-if="index < sansPrix.length - 1">, </span>
        </span>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h5 class="mb-0">Produits à réviser</h5>
          <input
            v-model.trim="search"
            type="search"
            class="form-control"
            style="max-width: 320px"
            placeholder="Rechercher (désignation ou code)"
          />
        </div>

        <div v-if="loading" class="text-center py-5">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Chargement des produits...
        </div>
        <div v-else-if="produits.length === 0" class="text-center text-success py-5">
          <i class="bi bi-check-circle me-1"></i> Tous les prix sont alignés et tous les produits sont dans
          {{ entrepot?.name ?? "le stock par défaut" }}.
        </div>
        <div v-else class="table-responsive" style="max-height: 60vh">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th class="text-center">TVA</th>
                <th class="text-end">Prix produit (HT)</th>
                <th class="text-end">Prix stock (HT)</th>
                <th class="text-end">Prix retenu (HT)</th>
                <th class="text-end">Prix TTC</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in produitsFiltres" :key="p.id">
                <td><code>{{ p.item_code }}</code></td>
                <td>{{ p.item_designation }}</td>
                <td class="text-center">{{ formatMoney(p.vat_rate) }}%</td>
                <td class="text-end" :class="{ 'text-danger text-decoration-line-through': p.source === 'stock' }">
                  {{ formatMoney(p.price) }}
                </td>
                <td class="text-end" :class="{ 'text-danger text-decoration-line-through': p.source === 'produit' }">
                  <span v-if="p.stock_prices.length">{{ p.stock_prices.map(formatMoney).join(" / ") }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-end fw-semibold text-success">{{ formatMoney(p.reference_price) }}</td>
                <td class="text-end">{{ formatMoney(ttc(p.reference_price, p.vat_rate)) }}</td>
                <td class="small">
                  <span v-if="p.source === 'produit'" class="badge text-bg-primary me-1">Prix produit → stock</span>
                  <span v-else-if="p.source === 'stock'" class="badge text-bg-warning me-1">Prix stock → produit</span>
                  <span v-else class="badge text-bg-danger me-1">Sans prix</span>
                  <span v-if="p.missing_in_warehouse" class="badge text-bg-info">Ajout au stock</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
