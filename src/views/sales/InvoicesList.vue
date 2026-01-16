<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  FileText,
  Search,
  Loader2,
  Eye,
  Printer,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from "lucide-vue-next";
import api from "@/services/api";

const emit = defineEmits(["view", "print"]);

const isLoading = ref(false);
const invoices = ref([]);
const searchQuery = ref("");
const filterType = ref("all");
const filterStatus = ref("all");
const pagination = ref({
  currentPage: 1,
  lastPage: 1,
  total: 0,
});

const fetchInvoices = async (page = 1) => {
  isLoading.value = true;
  try {
    const params = { page };
    if (filterType.value !== "all") {
      params.invoice_type = filterType.value;
    }
    const response = await api.get("/invoices", { params });
    if (response.data.success) {
      invoices.value = response.data.data.data || response.data.data;
      pagination.value = {
        currentPage: response.data.data.current_page || 1,
        lastPage: response.data.data.last_page || 1,
        total: response.data.data.total || invoices.value.length,
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement des factures:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchInvoices();
});

watch([filterType, filterStatus], () => {
  fetchInvoices(1);
});

const filteredInvoices = computed(() => {
  let result = invoices.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (inv) =>
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.customer_name?.toLowerCase().includes(query)
    );
  }

  if (filterStatus.value !== "all") {
    result = result.filter((inv) => inv.obr_submission_status === filterStatus.value);
  }

  return result;
});

const formatPrice = (price) => {
  const num = parseFloat(price) || 0;
  return num.toLocaleString("fr-FR");
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeLabel = (type) => {
  const types = {
    FN: "Normale",
    FA: "Avoir",
    FC: "Caution",
    FP: "Proforma",
    RC: "Remb. Caution",
  };
  return types[type] || type;
};

const getTypeBadgeClass = (type) => {
  const classes = {
    FN: "bg-primary",
    FA: "bg-danger",
    FC: "bg-warning text-dark",
    FP: "bg-secondary",
    RC: "bg-success",
  };
  return classes[type] || "bg-secondary";
};

const getStatusIcon = (status) => {
  switch (status) {
    case "ACCEPTED":
      return { icon: CheckCircle, class: "text-success" };
    case "REJECTED":
      return { icon: XCircle, class: "text-danger" };
    default:
      return { icon: Clock, class: "text-warning" };
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.lastPage) {
    fetchInvoices(page);
  }
};
</script>

<template>
  <div class="d-flex flex-column h-100 bg-white">
    <!-- Header -->
    <div class="p-3 bg-light border-bottom">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 d-flex align-items-center gap-2">
          <FileText :size="20" class="text-primary" />
          Liste des Factures
        </h5>
        <button @click="fetchInvoices(1)" class="btn btn-outline-primary btn-sm" :disabled="isLoading">
          <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>

      <!-- Filters -->
      <div class="row g-2">
        <div class="col-md-4">
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-white">
              <Search :size="14" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Rechercher..."
            />
          </div>
        </div>
        <div class="col-md-4">
          <select v-model="filterType" class="form-select form-select-sm">
            <option value="all">Tous les types</option>
            <option value="FN">Facture Normale</option>
            <option value="FA">Facture Avoir</option>
            <option value="FC">Caution</option>
            <option value="RC">Remboursement</option>
            <option value="FP">Proforma</option>
          </select>
        </div>
        <div class="col-md-4">
          <select v-model="filterStatus" class="form-select form-select-sm">
            <option value="all">Tous les statuts OBR</option>
            <option value="PENDING">En attente</option>
            <option value="ACCEPTED">Accepté</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-grow-1 overflow-auto">
      <div v-if="isLoading" class="text-center py-5">
        <Loader2 :size="32" class="animate-spin text-primary" />
        <p class="text-muted mt-2">Chargement...</p>
      </div>

      <div v-else-if="filteredInvoices.length === 0" class="text-center py-5 text-muted">
        <FileText :size="48" class="opacity-25 mb-2" />
        <p>Aucune facture trouvée</p>
      </div>

      <table v-else class="table table-hover mb-0">
        <thead class="bg-light sticky-top">
          <tr>
            <th>N° Facture</th>
            <th>Date</th>
            <th>Client</th>
            <th>Type</th>
            <th class="text-end">Montant TTC</th>
            <th class="text-center">OBR</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in filteredInvoices" :key="invoice.id">
            <td class="fw-bold">{{ invoice.invoice_number }}</td>
            <td class="small">{{ formatDate(invoice.invoice_date || invoice.created_at) }}</td>
            <td>
              <div class="text-truncate" style="max-width: 150px;">
                {{ invoice.customer_name || invoice.customer?.customer_name }}
              </div>
              <small class="text-muted">{{ invoice.customer_TIN || invoice.customer?.customer_TIN || 'N/A' }}</small>
            </td>
            <td>
              <span class="badge" :class="getTypeBadgeClass(invoice.invoice_type)">
                {{ getTypeLabel(invoice.invoice_type) }}
              </span>
            </td>
            <td class="text-end fw-bold">
              {{ formatPrice(invoice.invoice_total_amount) }}
              <small class="text-muted">{{ invoice.invoice_currency }}</small>
            </td>
            <td class="text-center">
              <component
                :is="getStatusIcon(invoice.obr_submission_status).icon"
                :size="18"
                :class="getStatusIcon(invoice.obr_submission_status).class"
                :title="invoice.obr_submission_status"
              />
            </td>
            <td class="text-center">
              <div class="btn-group btn-group-sm">
                <button
                  @click="$emit('view', invoice)"
                  class="btn btn-outline-primary"
                  title="Voir"
                >
                  <Eye :size="14" />
                </button>
                <button
                  @click="$emit('print', invoice)"
                  class="btn btn-outline-secondary"
                  title="Imprimer"
                >
                  <Printer :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.lastPage > 1" class="p-3 border-top bg-light">
      <div class="d-flex justify-content-between align-items-center">
        <small class="text-muted">
          {{ pagination.total }} factures au total
        </small>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
              <button class="page-link" @click="changePage(pagination.currentPage - 1)">
                Préc.
              </button>
            </li>
            <li class="page-item active">
              <span class="page-link">{{ pagination.currentPage }} / {{ pagination.lastPage }}</span>
            </li>
            <li class="page-item" :class="{ disabled: pagination.currentPage === pagination.lastPage }">
              <button class="page-link" @click="changePage(pagination.currentPage + 1)">
                Suiv.
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
