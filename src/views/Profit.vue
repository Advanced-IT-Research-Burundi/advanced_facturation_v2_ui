<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { FileText, Printer, RefreshCw, TrendingUp } from "lucide-vue-next";

const store = useStore();

// Données issues du store : pas de rechargement à chaque visite de la page
const loading = computed(() => store.getters["profit/isLoading"]);
const error = computed(() => store.getters["profit/error"]);
const report = computed(() => store.getters["profit/report"]);
const products = computed(() => store.getters["profit/productOptions"]);
const lastUpdatedAt = computed(() => store.getters["profit/lastUpdatedAt"]);
const view = computed({
  get: () => store.getters["profit/view"],
  set: (value) => store.commit("profit/SET_VIEW", value),
});

// Copie locale du formulaire, appliquée au store seulement au filtrage
const filters = ref({ ...store.getters["profit/filters"] });

const isPeriodValid = computed(
  () =>
    !filters.value.start_date ||
    !filters.value.end_date ||
    filters.value.start_date <= filters.value.end_date,
);

const fetchReport = (options = {}) => {
  store.commit("profit/SET_FILTERS", filters.value);
  return store.dispatch("profit/fetchReport", options);
};

const applyFilters = () => fetchReport({ force: true });

const refreshReport = () => fetchReport({ force: true });

const resetFilters = () => {
  store.commit("profit/RESET_FILTERS");
  filters.value = { ...store.getters["profit/filters"] };
  store.dispatch("profit/fetchReport", { force: true });
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

const formatUpdatedAt = (timestamp) =>
  timestamp ? new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

const printPage = () => window.print();

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const viewLabels = {
  product: "Par produit",
  period: "Par période",
  sale: "Par vente",
  expense: "Dépenses",
};

const buildPdfTable = () => {
  const data = report.value;
  const summary = data.summary;
  const profitCell = (value) =>
    `<td class="text-right ${Number(value) >= 0 ? "pos" : "neg"}">${formatPrice(value)}</td>`;
  const amountCells = (row) => `
    <td class="text-right">${formatPrice(row.revenue)}</td>
    <td class="text-right">${formatPrice(row.cost)}</td>
    ${profitCell(row.profit)}
    <td class="text-right">${formatMargin(row.margin)}</td>`;
  const totalCells = `
    <td class="text-right">${formatPrice(summary.revenue)}</td>
    <td class="text-right">${formatPrice(summary.cost)}</td>
    ${profitCell(summary.profit)}
    <td class="text-right">${formatMargin(summary.margin)}</td>`;
  const amountHeaders =
    "<th>CA HTVA</th><th>COÛT ACHAT</th><th>BÉNÉFICE BRUT</th><th>MARGE</th>";

  if (view.value === "expense") {
    return `
      <table>
        <thead><tr><th>DATE</th><th>LIBELLÉ</th><th>CATÉGORIE</th><th>MONTANT</th></tr></thead>
        <tbody>
          ${rows.value.map((row) => `
            <tr>
              <td>${formatDate(row.date)}</td>
              <td>${escapeHtml(row.name)}</td>
              <td>${escapeHtml(row.category)}</td>
              <td class="text-right">${formatPrice(row.montant)}</td>
            </tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="3">TOTAL DÉPENSES</td><td class="text-right">${formatPrice(data.expenses.total)}</td></tr></tfoot>
      </table>`;
  }

  if (view.value === "sale") {
    return `
      <table>
        <thead><tr><th>FACTURE</th><th>DATE</th><th>CLIENT</th>${amountHeaders}</tr></thead>
        <tbody>
          ${rows.value.map((row) => `
            <tr>
              <td>${escapeHtml(row.invoice_number || `#${row.invoice_id}`)}</td>
              <td>${formatDate(row.invoice_date)}</td>
              <td>${escapeHtml(row.customer_name || "Client anonyme")}</td>
              ${amountCells(row)}
            </tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="3">TOTAL</td>${totalCells}</tr></tfoot>
      </table>`;
  }

  const firstHeader = view.value === "product" ? "PRODUIT" : "DATE";
  const firstCell = (row) =>
    view.value === "product"
      ? `${escapeHtml(row.designation)}${row.product_code ? `<br><small>${escapeHtml(row.product_code)}</small>` : ""}`
      : formatDate(row.date);

  return `
    <table>
      <thead><tr><th>${firstHeader}</th><th>QUANTITÉ</th>${amountHeaders}</tr></thead>
      <tbody>
        ${rows.value.map((row) => `
          <tr>
            <td>${firstCell(row)}</td>
            <td class="text-right">${formatPrice(row.quantity)}</td>
            ${amountCells(row)}
          </tr>`).join("")}
      </tbody>
      <tfoot><tr><td>TOTAL</td><td class="text-right">${formatPrice(summary.quantity)}</td>${totalCells}</tr></tfoot>
    </table>`;
};

// PDF : ouvre une fenêtre d'impression propre (choisir « Enregistrer en PDF »)
const exportToPdf = () => {
  if (!report.value) return;

  const summary = report.value.summary;
  const applied = store.state.profit.reportFilters || {};
  const productName = products.value.find(
    (product) => String(product.id) === String(applied.product_id),
  )?.item_designation;
  const period = applied.start_date || applied.end_date
    ? `Du ${applied.start_date ? formatDate(applied.start_date) : "début"} au ${applied.end_date ? formatDate(applied.end_date) : "aujourd'hui"}`
    : "Toutes les dates";
  const filterDetails = [
    period,
    productName ? `Produit : ${productName}` : "",
    applied.invoice_id ? `Facture #${applied.invoice_id}` : "",
  ].filter(Boolean).map(escapeHtml).join(" — ");
  const fileTitle = `benefices_${view.value}_${new Date().toISOString().slice(0, 10)}`;

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${fileTitle}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; padding: 15px; }
          .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 8px; }
          .header h2 { font-size: 16px; margin-bottom: 4px; }
          .header p { font-size: 10px; color: #666; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
          .summary div { padding: 6px 8px; background: #f5f5f5; border-radius: 4px; }
          .summary span { display: block; color: #666; font-size: 9px; }
          .summary strong { font-size: 11px; }
          h3 { font-size: 12px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
          th { background: #e9ecef; font-size: 9px; }
          tbody tr:nth-child(even) { background-color: #f9f9f9; }
          tfoot td { font-weight: bold; background: #e9ecef; }
          small { color: #666; }
          .text-right { text-align: right; }
          .pos { color: #198754; }
          .neg { color: #dc3545; }
          .note { margin-top: 10px; font-size: 9px; color: #666; }
          @media print {
            body { padding: 0; }
            .summary div, th, tfoot td, tbody tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Bénéfices sur les ventes</h2>
          <p>${filterDetails} — Édité le ${new Date().toLocaleString("fr-FR")}</p>
        </div>
        <div class="summary">
          <div><span>Total ventes (HTVA)</span><strong>${formatPrice(summary.revenue)} BIF</strong></div>
          <div><span>Coût d'achat</span><strong>${formatPrice(summary.cost)} BIF</strong></div>
          <div><span>Bénéfice brut (${formatMargin(summary.margin)})</span><strong class="${Number(summary.profit) >= 0 ? "pos" : "neg"}">${formatPrice(summary.profit)} BIF</strong></div>
          <div><span>Total dépenses</span><strong>${formatPrice(summary.expenses_total)} BIF</strong></div>
          <div><span>Bénéfice net (${formatMargin(summary.net_margin)})</span><strong class="${Number(summary.net_profit) >= 0 ? "pos" : "neg"}">${formatPrice(summary.net_profit)} BIF</strong></div>
          <div><span>Factures</span><strong>${formatPrice(summary.invoices_count)}</strong></div>
          <div><span>Quantité vendue</span><strong>${formatPrice(summary.quantity)}</strong></div>
          <div><span>Lignes de vente</span><strong>${formatPrice(summary.lines_count)}</strong></div>
        </div>
        <h3>${viewLabels[view.value]}</h3>
        ${buildPdfTable()}
        <p class="note">
          Bénéfice brut = CA HTVA des ventes − coût d'achat des produits vendus.
          Bénéfice net = bénéfice brut − dépenses approuvées de la période.
        </p>
      </body>
    </html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    store.commit(
      "profit/SET_ERROR",
      "Impossible d'ouvrir la fenêtre d'impression. Autorisez les fenêtres pop-up pour ce site.",
    );
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

onMounted(() => {
  store.dispatch("profit/fetchProductOptions");
  // Réutilise le rapport en cache s'il est récent, sinon le recharge
  store.dispatch("profit/fetchReport");
});
</script>

<template>
  <div class="container-fluid py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">
        <TrendingUp :size="20" class="me-2 text-success" />
        Bénéfices sur les ventes
      </h5>
      <div class="d-flex align-items-center gap-2 noprint">
        <small v-if="lastUpdatedAt" class="text-muted">
          Mis à jour à {{ formatUpdatedAt(lastUpdatedAt) }}
        </small>
        <button
          class="btn btn-outline-secondary btn-sm"
          :disabled="loading"
          title="Recharger les données"
          @click="refreshReport"
        >
          <RefreshCw :size="14" class="me-1" :class="{ spin: loading }" />
          Actualiser
        </button>
        <button class="btn btn-outline-danger btn-sm" :disabled="!report" @click="exportToPdf">
          <FileText :size="14" class="me-1" />
          PDF
        </button>
        <button class="btn btn-info btn-sm" @click="printPage">
          <Printer :size="14" class="me-1" />
          Imprimer
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card mb-4 noprint">
      <div class="card-body py-3">
        <form class="row g-2 align-items-end" @submit.prevent="applyFilters">
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
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media print {
  .noprint {
    display: none !important;
  }
  .table {
    font-size: 11px;
  }
}
</style>
