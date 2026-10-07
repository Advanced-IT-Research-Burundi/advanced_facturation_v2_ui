<script setup>
import { computed, onMounted, ref } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";

const TAUX = 18;

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

const loading = ref(false);
const factures = ref([]);
const totalTTC = ref(0);
const produitsSansTva = ref(0);
const numeros = ref("");
const tailleLot = ref(1);
const applyingProducts = ref(false);
const runningBatch = ref(false);
const processingId = ref(null);
const resultats = ref({});

const htva = (ttc) => Math.round((Number(ttc) / (1 + TAUX / 100)) * 100) / 100;
const formatMoney = (value) =>
  Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatDate = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "-");
const getApiError = (err, fallback) => err.response?.data?.message || fallback;

const facturesEnAttente = computed(() => factures.value.filter((f) => !resultats.value[f.id]?.success));

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await api.get("/invoices/tva-correction", { params: { numeros: numeros.value } });
    factures.value = response.data.data.factures;
    totalTTC.value = response.data.data.total_ttc;
    produitsSansTva.value = response.data.data.produits_sans_tva;
  } catch (err) {
    toast.error(getApiError(err, "Impossible de charger les factures."));
  } finally {
    loading.value = false;
  }
};

const applyProductsVat = async () => {
  const confirmed = await confirmDialog(
    `Appliquer la TVA de ${TAUX} % aux ${produitsSansTva.value} produit(s) qui n'en ont pas ? Le prix de vente TTC ne change pas : le prix enregistré devient le prix hors TVA (prix / ${1 + TAUX / 100}).`
  );
  if (!confirmed) return;

  applyingProducts.value = true;
  try {
    const response = await api.post("/products/apply-vat", { taux: TAUX });
    toast.success(response.data.message);
    await fetchData();
  } catch (err) {
    toast.error(getApiError(err, "Erreur lors de l'application de la TVA aux produits."));
  } finally {
    applyingProducts.value = false;
  }
};

const replaceInvoice = async (facture) => {
  processingId.value = facture.id;
  try {
    const response = await api.post(`/invoices/${facture.id}/replace-vat`, { taux: TAUX });
    resultats.value[facture.id] = { success: true, message: response.data.message };
    return true;
  } catch (err) {
    resultats.value[facture.id] = {
      success: false,
      message: getApiError(err, "Erreur lors du remplacement."),
    };
    return false;
  } finally {
    processingId.value = null;
  }
};

const replaceOne = async (facture) => {
  const confirmed = await confirmDialog(
    `Annuler la facture ${facture.invoice_number} chez l'OBR et la recréer avec la TVA ? Cette opération est irréversible.`
  );
  if (!confirmed) return;

  if (await replaceInvoice(facture)) {
    toast.success(resultats.value[facture.id].message);
  } else {
    toast.error(resultats.value[facture.id].message);
  }
};

const replaceBatch = async () => {
  const lot = facturesEnAttente.value.slice(0, tailleLot.value);
  if (lot.length === 0) return;

  const confirmed = await confirmDialog(
    `Annuler ${lot.length} facture(s) chez l'OBR et les recréer avec la TVA ? Cette opération est irréversible. Le traitement s'arrête à la première erreur.`
  );
  if (!confirmed) return;

  runningBatch.value = true;
  let succes = 0;
  for (const facture of lot) {
    if (!(await replaceInvoice(facture))) {
      toast.error(`Arrêt sur la facture ${facture.invoice_number} : ${resultats.value[facture.id].message}`);
      break;
    }
    succes++;
  }
  runningBatch.value = false;
  if (succes > 0) {
    toast.success(`${succes} facture(s) remplacée(s) et envoyée(s) à l'OBR.`);
  }
};

onMounted(fetchData);
</script>

<template>
  <div>
    <div class="alert alert-warning d-flex gap-2">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div>
        L'annulation chez l'OBR est <strong>irréversible</strong>. Commencez par une seule facture et vérifiez sur le
        portail OBR que l'ancienne est annulée et que la nouvelle est acceptée avant de traiter le reste.
      </div>
    </div>

    <div class="card shadow-sm mb-3">
      <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h5 class="mb-1">1. Produits</h5>
          <div class="text-muted small">
            <strong>{{ produitsSansTva }}</strong> produit(s) sans TVA. Le prix TTC reste le même, le prix enregistré
            devient le prix hors TVA. À faire en premier pour que les nouvelles ventes partent avec la TVA.
          </div>
        </div>
        <button
          class="btn btn-warning d-inline-flex align-items-center gap-2"
          :disabled="applyingProducts || produitsSansTva === 0"
          @click="applyProductsVat"
        >
          <span v-if="applyingProducts" class="spinner-border spinner-border-sm"></span>
          <i v-else class="bi bi-percent"></i>
          Appliquer TVA {{ TAUX }} % aux produits
        </button>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="mb-1">2. Factures envoyées à l'OBR sans TVA</h5>
        <div class="text-muted small mb-3">
          Chaque facture est annulée chez l'OBR (sans retour de stock), recréée avec la même date et la TVA de
          {{ TAUX }} % (même total TTC), puis envoyée à l'OBR.
        </div>

        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div class="input-group" style="max-width: 420px">
            <input
              v-model.trim="numeros"
              type="search"
              class="form-control"
              placeholder="N° de facture (ex: 000630, 000631)"
              @keyup.enter="fetchData"
            />
            <button class="btn btn-outline-secondary" :disabled="loading" @click="fetchData">
              <i class="bi bi-search"></i> Rechercher
            </button>
          </div>
          <div class="d-flex align-items-center gap-2">
            <select v-model.number="tailleLot" class="form-select" style="width: auto" :disabled="runningBatch">
              <option :value="1">1 facture</option>
              <option :value="10">10 factures</option>
              <option :value="50">50 factures</option>
              <option :value="Infinity">Toutes ({{ facturesEnAttente.length }})</option>
            </select>
            <button
              class="btn btn-danger d-inline-flex align-items-center gap-2"
              :disabled="runningBatch || processingId !== null || facturesEnAttente.length === 0"
              @click="replaceBatch"
            >
              <span v-if="runningBatch" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-arrow-repeat"></i>
              Annuler & recréer
            </button>
          </div>
        </div>

        <div class="mb-2 small">
          <strong>{{ factures.length }}</strong> facture(s), total TTC
          <strong>{{ formatMoney(totalTTC) }}</strong> — TVA à déclarer
          <strong>{{ formatMoney(totalTTC - htva(totalTTC)) }}</strong>
          <span class="text-muted">(numéro saisi : la facture est listée même si sa TVA a déjà été corrigée en local)</span>
        </div>

        <div v-if="loading" class="text-center py-5">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Chargement des factures...
        </div>

        <div v-else class="table-responsive" style="max-height: 60vh">
          <table class="table table-hover table-sm align-middle">
            <thead class="table-light sticky-top">
              <tr>
                <th>Facture</th>
                <th>Client</th>
                <th class="text-end">Total TTC</th>
                <th class="text-end">HTVA</th>
                <th class="text-end">TVA {{ TAUX }} %</th>
                <th>Statut</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="facture in factures" :key="facture.id">
                <td>
                  <div class="fw-semibold">{{ facture.invoice_number }}</div>
                  <div class="text-muted small">{{ formatDate(facture.invoice_date) }}</div>
                </td>
                <td>{{ facture.customer?.customer_name || "-" }}</td>
                <td class="text-end">{{ formatMoney(facture.invoice_total_amount) }}</td>
                <td class="text-end">{{ formatMoney(htva(facture.invoice_total_amount)) }}</td>
                <td class="text-end">{{ formatMoney(facture.invoice_total_amount - htva(facture.invoice_total_amount)) }}</td>
                <td class="small">
                  <span v-if="resultats[facture.id]" :class="resultats[facture.id].success ? 'text-success' : 'text-danger'">
                    {{ resultats[facture.id].message }}
                  </span>
                  <span v-else-if="facture.is_cancelled" class="badge bg-info">Annulée, à recréer</span>
                  <span v-else class="badge bg-secondary">Envoyée sans TVA</span>
                </td>
                <td class="text-end">
                  <button
                    v-if="!resultats[facture.id]?.success"
                    class="btn btn-sm btn-outline-danger"
                    :disabled="runningBatch || processingId !== null"
                    title="Annuler chez l'OBR et recréer avec la TVA"
                    @click="replaceOne(facture)"
                  >
                    <span v-if="processingId === facture.id" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-arrow-repeat"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="factures.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-check-circle fs-1 d-block mb-2"></i>
                  Aucune facture à remplacer.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
