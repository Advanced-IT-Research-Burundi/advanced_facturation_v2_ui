<template>
  <div class="container-fluid bg-light">
    <div class="mb-4">
      <h2 class="fw-normal">
        Historique des factures OBR : <span class="fw-bold text-danger">{{ totalObrInvoices }}</span>
      </h2>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 py-2">
        <div class="d-flex align-items-center gap-2">
          <h4 class="m-0 fw-normal text-dark">Liste des factures OBR</h4>
        </div>

        <div class="search-box" style="width: 300px;">
          <input
            v-model="search"
            @input="handleSearch"
            type="text"
            class="form-control border-danger-subtle"
            placeholder="Rechercher (n° facture, client, NIF...)"
          />
        </div>
      </div>
    </div>

    <div class="bg-white border rounded shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light text-uppercase small fw-bold">
            <tr>
              <th class="py-3 ps-3">#</th>
              <th class="py-3">N° FACTURE</th>
              <th class="py-3">DATE</th>
              <th class="py-3">CLIENT</th>
              <th class="py-3">MONTANT TOTAL</th>
              <th class="py-3">PAIEMENT</th>
              <th class="py-3">STATUT OBR</th>
              <th class="py-3">SIGNATURE ELECTRONIQUE</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center py-5">Chargement...</td>
            </tr>
            <tr v-else-if="obrInvoices.length === 0">
              <td colspan="8" class="text-center py-5">Aucune facture OBR trouvée</td>
            </tr>
            <tr v-for="(invoice, index) in obrInvoices" :key="invoice.id">
              <td class="ps-3 fw-bold">{{ calculateIndex(index) }}</td>
              <td class="fw-medium">{{ invoice.invoice_number }}</td>
              <td>
                <div class="d-flex flex-column small">
                  <span>{{ formatDate(invoice.invoice_date).date }}</span>
                  <span class="text-muted">{{ formatDate(invoice.invoice_date).time }}</span>
                </div>
              </td>
              <td>{{ invoice.customer_name || invoice.customer?.customer_name || '' }}</td>
              <td>{{ formatAmount(invoice.invoice_total_amount) }} {{ invoice.invoice_currency }}</td>
              <td>
                <span class="badge" :class="paymentStatusClass(invoice.payment_status)">
                  {{ invoice.payment_status || '-' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="obrStatusClass(invoice.obr_submission_status)">
                  {{ invoice.obr_submission_status || '-' }}
                </span>
              </td>
              <td class="small text-muted">{{ invoice.electronic_signature || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between align-items-center p-3 border-top">
        <div class="small text-muted">
          Page <strong>{{ pagination?.current_page || 1 }}</strong> sur <strong>{{ lastPage }}</strong>
        </div>
        <nav v-if="lastPage > 1">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: !pagination?.prev_page_url }">
              <button class="page-link text-danger" @click="changePage((pagination?.current_page || 1) - 1)">Précédent</button>
            </li>

            <li class="page-item active">
              <button class="page-link bg-danger border-danger text-white">{{ pagination?.current_page || 1 }}</button>
            </li>

            <li class="page-item" :class="{ disabled: !pagination?.next_page_url }">
              <button class="page-link text-danger" @click="changePage((pagination?.current_page || 1) + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const search = ref("");
const searchTimeout = ref(null);
const perPage = 15;

const obrInvoices = computed(() => store.getters["obrInvoices/allObrInvoices"]);
const totalObrInvoices = computed(() => store.getters["obrInvoices/totalObrInvoices"]);
const loading = computed(() => store.getters["obrInvoices/isLoading"]);
const pagination = computed(() => store.state.obrInvoices.pagination);

const lastPage = computed(() => pagination.value?.last_page || 1);

const fetchObrInvoices = (page = 1, searchTerm = search.value) => {
  store.dispatch("obrInvoices/fetchObrInvoices", { page, search: searchTerm });
};

const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    fetchObrInvoices(1, search.value);
  }, 400);
};

const changePage = (page) => {
  if (page > 0 && page <= lastPage.value) {
    fetchObrInvoices(page, search.value);
  }
};

const calculateIndex = (index) => {
  const currentPage = pagination.value?.current_page || 1;
  return (currentPage - 1) * perPage + (index + 1);
};

const formatDate = (dateStr) => {
  if (!dateStr) return { date: "", time: "" };
  const d = new Date(dateStr);
  return {
    date: d.toISOString().split("T")[0],
    time: d.toTimeString().split(" ")[0],
  };
};

const formatAmount = (amount) => {
  const value = Number(amount || 0);
  return value.toLocaleString("fr-FR");
};

const paymentStatusClass = (status) => {
  switch (status) {
    case "paid":
      return "bg-success-subtle text-success";
    case "partial":
      return "bg-warning-subtle text-warning";
    default:
      return "bg-secondary-subtle text-secondary";
  }
};

const obrStatusClass = (status) => {
  switch (status) {
    case "SENT":
      return "bg-success-subtle text-success";
    case "PENDING":
      return "bg-warning-subtle text-warning";
    case "FAILED":
      return "bg-danger-subtle text-danger";
    default:
      return "bg-secondary-subtle text-secondary";
  }
};

onMounted(() => {
  const lastQuery = store.getters["obrInvoices/lastQuery"] || {};
  search.value = lastQuery.search || "";
  fetchObrInvoices(lastQuery.page || 1, search.value);
});
</script>

<style lang="scss" scoped>
.page-link {
  color: #c51818;
  border-color: #dee2e6;
}

.page-link:hover {
  color: #9b0e0e;
  background-color: #fff5f5;
}

.page-item.active .page-link {
  background-color: #c51818 !important;
  border-color: #c51818 !important;
}

.border-danger-subtle {
  border-color: #f5c2c7 !important;
}
</style>
