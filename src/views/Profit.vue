<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import { Printer, TrendingUp } from "lucide-vue-next";

const loading = ref(false);
const error = ref(null);
const report = ref(null);
const products = ref([]);
const view = ref("product"); // product | period | sale

const filters = ref({
  start_date: "",
  end_date: "",
  product_id: "",
  invoice_id: "",
});

const isPeriodValid = computed(
  () =>
    !filters.value.start_date ||
    !filters.value.end_date ||
    filters.value.start_date <= filters.value.end_date,
);

const fetchProducts = async () => {
  try {
    const response = await api.get("/products", { params: { per_page: 1000 } });
    if (response.data.success) {
      const data = response.data.data;
      products.value = data?.data || data || [];
    }
  } catch (err) {
    console.error("Profit: error fetching products", err);
  }
};

const fetchReport = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    for (const [key, value] of Object.entries(filters.value)) {
      if (value) params[key] = value;
    }
    const response = await api.get("/reports/profit", { params });
    if (response.data.success) {
      report.value = response.data.data;
    }
  } catch (err) {
    console.error("Profit: error fetching report", err);
    error.value = "Erreur lors du chargement du rapport de bénéfices";
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    start_date: "",
    end_date: "",
    product_id: "",
    invoice_id: "",
  };
  fetchReport();
};

const formatPrice = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
};

const formatMargin = (margin) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(margin) || 0)} %`;

const profitClass = (value) =>
  Number(value) >= 0 ? "text-success" : "text-danger";

const rows = computed(() => {
  const data = report.value;
  if (!data) return [];
  if (view.value === "product") return data.by_product || [];
  if (view.value === "period") return data.by_period || [];
  if (view.value === "expense") return data.expenses?.items || [];
  return data.by_sale || [];
});

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
};

const printPage = () => window.print();

onMounted(() => {
  fetchProducts();
  fetchReport();
});
</script>

<template>
  <div class="container-fluid py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <TrendingUp :size="20" class="me-2 text-success" />
        Bénéfices sur les ventes
      </h5>
      <button class="btn btn-info btn-sm noprint" @click="printPage">
        <Printer :size="14" class="me-1" />
        Imprimer
      </button>
    </div>

    <!-- Filtres -->
    <div class="card mb-4 noprint">
      <div class="card-body py-3">
        <form class="row g-2 align-items-end" @submit.prevent="fetchReport">
          <div class="col-6 col-md-2">
            <label class="small" for="profit-start">DU</label>
            <input
              id="profit-start"
              type="date"
              class="form-control form-control-sm"
              v-model="filters.start_date"
            />
          </div>
          <div class="col-6 col-md-2">
            <label class="small" for="profit-end">AU</label>
            <input
              id="profit-end"
              type="date"
              class="form-control form-control-sm"
              v-model="filters.end_date"
            />
          </div>
          <div class="col-6 col-md-3">
            <label class="small" for="profit-product">Produit</label>
            <select
              id="profit-product"
              class="form-select form-select-sm"
              v-model="filters.product_id"
            >
              <option value="">Tous les produits</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.item_designation }}
              </option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <label class="small" for="profit-invoice">N° facture (ID)</label>
            <input
              id="profit-invoice"
              type="number"
              min="1"
              class="form-control form-control-sm"
              v-model="filters.invoice_id"
              placeholder="Ex: 125"
            />
          </div>
          <div class="col-12 col-md-auto d-flex gap-2">
            <button
              type="submit"
              class="btn btn-info btn-sm"
              :disabled="!isPeriodValid || loading"
            >
              {{ loading ? "Chargement..." : "Filtrer" }}
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="resetFilters">
              Réinitialiser
            </button>
          </div>
        </form>
        <div v-if="!isPeriodValid" class="small text-danger mt-2">
          La date de début doit être antérieure ou égale à la date de fin.
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="loading && !report" class="text-center py-5">
      <span class="spinner-border text-primary"></span>
    </div>

    <template v-else-if="report">
      <!-- Synthèse : ventes, puis dépenses à part -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="card h-100 border-info">
            <div class="card-body py-2">
              <div class="small text-muted">TOTAL VENTES (HTVA)</div>
              <div class="fw-bold fs-5 text-info">
                {{ formatPrice(report.summary.revenue) }} BIF
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Coût d'achat</div>
              <div class="fw-bold">{{ formatPrice(report.summary.cost) }} BIF</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Bénéfice brut</div>
              <div class="fw-bold" :class="profitClass(report.summary.profit)">
                {{ formatPrice(report.summary.profit) }} BIF
              </div>
              <small class="text-muted">{{ formatMargin(report.summary.margin) }}</small>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100 border-warning">
            <div class="card-body py-2">
              <div class="small text-muted">TOTAL DÉPENSES</div>
              <div class="fw-bold fs-5 text-warning">
                {{ formatPrice(report.summary.expenses_total) }} BIF
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100 border-success">
            <div class="card-body py-2">
              <div class="small text-muted">BÉNÉFICE NET</div>
              <div class="fw-bold fs-5" :class="profitClass(report.summary.net_profit)">
                {{ formatPrice(report.summary.net_profit) }} BIF
              </div>
              <small class="text-muted">{{ formatMargin(report.summary.net_margin) }}</small>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Factures</div>
              <div class="fw-bold">{{ formatPrice(report.summary.invoices_count) }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Quantité vendue</div>
              <div class="fw-bold">{{ formatPrice(report.summary.quantity) }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Lignes de vente</div>
              <div class="fw-bold">{{ formatPrice(report.summary.lines_count) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue -->
      <div class="mb-3 noprint">
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn btn-sm"
            :class="view === 'product' ? 'btn-success' : 'btn-outline-success'"
            @click="view = 'product'"
          >
            Par produit
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="view === 'period' ? 'btn-success' : 'btn-outline-success'"
            @click="view = 'period'"
          >
            Par période
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="view === 'sale' ? 'btn-success' : 'btn-outline-success'"
            @click="view = 'sale'"
          >
            Par vente
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="view === 'expense' ? 'btn-warning' : 'btn-outline-warning'"
            @click="view = 'expense'"
          >
            Dépenses
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <!-- Par produit -->
          <table
            v-if="view === 'product'"
            class="table table-sm table-hover table-bordered align-middle mb-0"
          >
            <thead class="table-light">
              <tr>
                <th>PRODUIT</th>
                <th>QUANTITÉ</th>
                <th class="text-end">CA HTVA</th>
                <th class="text-end">COÛT ACHAT</th>
                <th class="text-end">BÉNÉFICE BRUT</th>
                <th class="text-end">MARGE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0">
                <td colspan="6" class="text-center text-muted py-4">Aucune vente pour ces filtres</td>
              </tr>
              <tr v-for="row in rows" :key="row.product_id">
                <td>
                  <div class="fw-semibold">{{ row.designation }}</div>
                  <small class="text-muted">{{ row.product_code }}</small>
                </td>
                <td>{{ formatPrice(row.quantity) }}</td>
                <td class="text-end">{{ formatPrice(row.revenue) }}</td>
                <td class="text-end">{{ formatPrice(row.cost) }}</td>
                <td class="text-end fw-bold" :class="profitClass(row.profit)">
                  {{ formatPrice(row.profit) }}
                </td>
                <td class="text-end">{{ formatMargin(row.margin) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="rows.length" class="table-light fw-bold">
              <tr>
                <td>TOTAL</td>
                <td class="text-end">{{ formatPrice(report.summary.quantity) }}</td>
                <td class="text-end">{{ formatPrice(report.summary.revenue) }}</td>
                <td class="text-end">{{ formatPrice(report.summary.cost) }}</td>
                <td class="text-end" :class="profitClass(report.summary.profit)">
                  {{ formatPrice(report.summary.profit) }}
                </td>
                <td class="text-end">{{ formatMargin(report.summary.margin) }}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Par période -->
          <table
            v-else-if="view === 'period'"
            class="table table-sm table-hover table-bordered align-middle mb-0"
          >
            <thead class="table-light">
              <tr>
                <th>DATE</th>
                <th>QUANTITÉ</th>
                <th class="text-end">CA HTVA</th>
                <th class="text-end">COÛT ACHAT</th>
                <th class="text-end">BÉNÉFICE BRUT</th>
                <th class="text-end">MARGE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0">
                <td colspan="6" class="text-center text-muted py-4">Aucune vente pour ces filtres</td>
              </tr>
              <tr v-for="row in rows" :key="row.date">
                <td>{{ formatDate(row.date) }}</td>
                <td>{{ formatPrice(row.quantity) }}</td>
                <td class="text-end">{{ formatPrice(row.revenue) }}</td>
                <td class="text-end">{{ formatPrice(row.cost) }}</td>
                <td class="text-end fw-bold" :class="profitClass(row.profit)">
                  {{ formatPrice(row.profit) }}
                </td>
                <td class="text-end">{{ formatMargin(row.margin) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="rows.length" class="table-light fw-bold">
              <tr>
                <td>TOTAL</td>
                <td class="text-end">{{ formatPrice(report.summary.quantity) }}</td>
                <td class="text-end">{{ formatPrice(report.summary.revenue) }}</td>
                <td class="text-end">{{ formatPrice(report.summary.cost) }}</td>
                <td class="text-end" :class="profitClass(report.summary.profit)">
                  {{ formatPrice(report.summary.profit) }}
                </td>
                <td class="text-end">{{ formatMargin(report.summary.margin) }}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Par vente -->
          <table
            v-else-if="view === 'sale'"
            class="table table-sm table-hover table-bordered align-middle mb-0"
          >
            <thead class="table-light">
              <tr>
                <th>FACTURE</th>
                <th>DATE</th>
                <th>CLIENT</th>
                <th class="text-end">CA HTVA</th>
                <th class="text-end">COÛT ACHAT</th>
                <th class="text-end">BÉNÉFICE BRUT</th>
                <th class="text-end">MARGE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0">
                <td colspan="7" class="text-center text-muted py-4">Aucune vente pour ces filtres</td>
              </tr>
              <tr v-for="row in rows" :key="row.invoice_id">
                <td>{{ row.invoice_number || `#${row.invoice_id}` }}</td>
                <td>{{ formatDate(row.invoice_date) }}</td>
                <td>{{ row.customer_name || "Client anonyme" }}</td>
                <td class="text-end">{{ formatPrice(row.revenue) }}</td>
                <td class="text-end">{{ formatPrice(row.cost) }}</td>
                <td class="text-end fw-bold" :class="profitClass(row.profit)">
                  {{ formatPrice(row.profit) }}
                </td>
                <td class="text-end">{{ formatMargin(row.margin) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="rows.length" class="table-light fw-bold">
              <tr>
                <td colspan="3">TOTAL</td>
                <td class="text-end">{{ formatPrice(report.summary.revenue) }}</td>
                <td class="text-end">{{ formatPrice(report.summary.cost) }}</td>
                <td class="text-end" :class="profitClass(report.summary.profit)">
                  {{ formatPrice(report.summary.profit) }}
                </td>
                <td class="text-end">{{ formatMargin(report.summary.margin) }}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Dépenses à part -->
          <table
            v-else
            class="table table-sm table-hover table-bordered align-middle mb-0"
          >
            <thead class="table-light">
              <tr>
                <th>DATE</th>
                <th>LIBELLÉ</th>
                <th>CATÉGORIE</th>
                <th class="text-end">MONTANT</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0">
                <td colspan="4" class="text-center text-muted py-4">Aucune dépense pour cette période</td>
              </tr>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatDate(row.date) }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.category }}</td>
                <td class="text-end">{{ formatPrice(row.montant) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="rows.length" class="table-light fw-bold">
              <tr>
                <td colspan="3">TOTAL DÉPENSES</td>
                <td class="text-end text-warning">{{ formatPrice(report.expenses.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div v-if="report.expenses.by_category.length" class="card mt-3">
        <div class="card-body py-2">
          <h6 class="small fw-bold mb-2">Dépenses par catégorie</h6>
          <div class="d-flex flex-wrap gap-2">
            <span
              v-for="row in report.expenses.by_category"
              :key="row.category"
              class="badge bg-light text-dark border"
            >
              {{ row.category }} : {{ formatPrice(row.total) }} BIF ({{ row.count }})
            </span>
          </div>
        </div>
      </div>

      <p class="small text-muted mt-2">
        Bénéfice brut = CA HTVA des ventes − coût d'achat des produits vendus. Bénéfice net =
        bénéfice brut − dépenses approuvées de la période. Les dépenses sont affichées à part :
        seuls les filtres de dates s'appliquent à elles (pas le produit ni la facture).
      </p>
    </template>
  </div>
</template>

<style scoped>
@media print {
  .noprint {
    display: none !important;
  }
  .table {
    font-size: 11px;
  }
}
</style>
