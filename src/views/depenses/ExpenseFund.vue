<template>
  <div class="container-fluid p-0">
    <depense-header></depense-header>

    <div class="row g-4 mb-4">
      <div class="col-md-12 col-xl-4">
        <div class="card shadow-sm border-0 bg-primary text-white h-100">
          <div class="card-body">
            <h6 class="text-white-50 text-uppercase mb-2">Solde de la caisse des dépenses</h6>
            <h2 class="display-6 mb-0 fw-bold">{{ formatCurrency(balance) }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-12 col-xl-8 d-flex align-items-center justify-content-end">
        <button class="btn btn-primary" @click="openDepositModal">
          <i class="bi bi-plus-lg me-1"></i> Alimenter la caisse
        </button>
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Effectué par</th>
                <th>Validé par</th>
                <th class="text-end pe-4">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="movement in movements" :key="movement.id">
                <td class="ps-4 text-muted small">{{ formatDate(movement.created_at) }}</td>
                <td>{{ movement.description }}</td>
                <td>
                  <span class="badge" :class="movement.type === 'deposit' ? 'bg-success' : 'bg-secondary'">
                    {{ movement.type === 'deposit' ? 'Alimentation' : 'Dépense' }}
                  </span>
                </td>
                <td class="small">{{ performedBy(movement) }}</td>
                <td class="small">{{ movement.type === 'expense' ? movement.created_by?.name || '-' : '-' }}</td>
                <td class="text-end pe-4 fw-bold" :class="movement.type === 'deposit' ? 'text-success' : 'text-danger'">
                  {{ movement.type === 'deposit' ? '+' : '-' }} {{ formatCurrency(movement.amount) }}
                </td>
              </tr>
              <tr v-if="!loading && movements.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">Aucun mouvement dans cette caisse.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-center py-3 border-top" v-if="pagination.last_page > 1">
          <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
              <button class="page-link" @click="fetchFund(pagination.current_page - 1)">Précédent</button>
            </li>
            <li class="page-item active"><span class="page-link">{{ pagination.current_page }} / {{ pagination.last_page }}</span></li>
            <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
              <button class="page-link" @click="fetchFund(pagination.current_page + 1)">Suivant</button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="showDepositModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Alimenter la caisse des dépenses</h5>
            <button type="button" class="btn-close" @click="showDepositModal = false"></button>
          </div>
          <div class="modal-body">
            <form id="depositForm" @submit.prevent="submitDeposit">
              <div class="mb-3">
                <label class="form-label small text-muted text-uppercase fw-bold">Montant</label>
                <div class="input-group">
                  <input type="number" class="form-control" v-model="depositForm.amount" required min="0.01" step="0.01">
                  <span class="input-group-text">FBu</span>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted text-uppercase fw-bold">Description (optionnel)</label>
                <input type="text" class="form-control" v-model="depositForm.description" maxlength="255">
              </div>
            </form>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-outline-secondary" @click="showDepositModal = false">Annuler</button>
            <button type="submit" form="depositForm" class="btn btn-primary px-4" :disabled="submitting">
              {{ submitting ? 'Enregistrement...' : 'Valider' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import DepenseHeader from "./DepenseHeader.vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";

const toast = useToast();

const balance = ref(0);
const movements = ref([]);
const pagination = ref({});
const loading = ref(false);
const submitting = ref(false);
const showDepositModal = ref(false);
const depositForm = reactive({ amount: "", description: "" });

const fetchFund = async (page = 1) => {
  loading.value = true;
  try {
    const response = await api.get("/expense-fund", { params: { page } });
    const { data, ...meta } = response.data.data.movements;
    balance.value = response.data.data.balance;
    movements.value = data;
    pagination.value = meta;
  } catch (error) {
    toast.error(error.response?.data?.message || "Erreur lors du chargement de la caisse des dépenses");
  } finally {
    loading.value = false;
  }
};

const openDepositModal = () => {
  depositForm.amount = "";
  depositForm.description = "";
  showDepositModal.value = true;
};

const submitDeposit = async () => {
  submitting.value = true;
  try {
    const response = await api.post("/expense-fund/deposits", {
      amount: depositForm.amount,
      description: depositForm.description || null,
    });
    toast.success(response.data.message);
    showDepositModal.value = false;
    await fetchFund(1);
  } catch (error) {
    toast.error(error.response?.data?.message || "Erreur lors de l'alimentation de la caisse");
  } finally {
    submitting.value = false;
  }
};

const performedBy = (movement) =>
  (movement.type === "expense" ? movement.depense?.user?.name : movement.created_by?.name) || "-";

const formatCurrency = (val) =>
  new Intl.NumberFormat("fr-BI", { style: "currency", currency: "BIF" }).format(val || 0).replace("BIF", "FBu");

const formatDate = (date) => (date ? new Date(date).toLocaleString("fr-FR") : "-");

onMounted(() => fetchFund());
</script>
