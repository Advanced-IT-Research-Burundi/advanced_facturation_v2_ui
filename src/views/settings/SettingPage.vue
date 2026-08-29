<template>
  <div class="container-fluid p-0">
    <settings-header></settings-header>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
      <h1 class="h3 mb-0">{{ activeTab === 'configs' ? 'Configurations' : 'Factures OBR' }}</h1>
      <div>
        <button class="btn btn-outline-primary me-2" @click="refreshActiveTab">
          <i class="bi bi-arrow-clockwise"></i> Actualiser
        </button>
        <button v-if="activeTab === 'configs'" class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i> Ajouter
        </button>
      </div>
    </div>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'configs' }" @click="switchTab('configs')">
          <i class="bi bi-sliders me-1"></i> Configurations
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'obrInvoices' }" @click="switchTab('obrInvoices')">
          <i class="bi bi-receipt me-1"></i> Factures OBR
        </button>
      </li>
    </ul>

    <section v-if="activeTab === 'configs'">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="card shadow-sm">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Clé</th>
                  <th>Valeur</th>
                  <th>Description</th>
                  <th class="text-center" style="width: 120px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="config in configs" :key="config.id">
                  <td class="fw-bold text-primary font-monospace">{{ config.config_key }}</td>
                  <td>
                    <span class="text-break">{{ formatValue(config.value) }}</span>
                  </td>
                  <td class="text-muted small">{{ config.description || '-' }}</td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(config)" title="Modifier">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button v-if="canDelete(config)" class="btn btn-sm btn-outline-danger" @click="confirmDelete(config)" title="Supprimer">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="!loading && configs.length === 0">
                  <td colspan="4" class="text-center py-5 text-muted">
                    <i class="bi bi-sliders fs-1 d-block mb-2"></i>
                    Aucune configuration trouvée.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav v-if="pagination.last_page > 1" class="d-flex justify-content-center mt-3">
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="changePage(pagination.current_page - 1)">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              <li class="page-item" :class="{ active: pagination.current_page === page }" v-for="page in getPageRange()" :key="page">
                <button class="page-link" @click="changePage(page)">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                <button class="page-link" @click="changePage(pagination.current_page + 1)">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </section>

    <section v-else>
      <div class="row g-3 mb-3">
        <div class="col-sm-6 col-xl-3" v-for="stat in obrStatCards" :key="stat.label">
          <div class="card shadow-sm h-100">
            <div class="card-body py-3">
              <div class="text-muted small">{{ stat.label }}</div>
              <div class="fs-4 fw-bold">{{ stat.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div class="btn-group" role="group">
          <button
            v-for="group in obrStatusGroups"
            :key="group.value"
            class="btn btn-sm"
            :class="obrStatusGroup === group.value ? 'btn-primary' : 'btn-outline-primary'"
            @click="setObrStatusGroup(group.value)"
          >
            {{ group.label }}
          </button>
        </div>
        <div class="input-group obr-search">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input
            v-model.trim="obrSearch"
            type="search"
            class="form-control"
            placeholder="Facture, client, NIF"
            @keyup.enter="fetchObrInvoices(1)"
          >
          <button class="btn btn-outline-secondary" @click="fetchObrInvoices(1)">Rechercher</button>
        </div>
      </div>

      <div v-if="obrError" class="alert alert-danger">{{ obrError }}</div>

      <div class="card shadow-sm">
        <div class="card-body">
          <div v-if="obrLoading" class="text-center py-5">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Chargement des factures...
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Facture</th>
                  <th>Client</th>
                  <th class="text-end">Total</th>
                  <th>Statut</th>
                  <th>Réponse OBR</th>
                  <th class="text-end" style="width: 180px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in obrInvoices" :key="invoice.id">
                  <td>
                    <div class="fw-semibold">{{ invoice.invoice_number }}</div>
                    <div class="text-muted small">{{ formatDate(invoice.invoice_date || invoice.created_at) }}</div>
                    <div v-if="invoice.obr_invoice_identifier || invoice.electronic_signature" class="text-muted small text-break">
                      {{ invoice.obr_invoice_identifier || invoice.electronic_signature }}
                    </div>
                  </td>
                  <td>
                    <div>{{ invoice.customer?.customer_name || '-' }}</div>
                    <div class="text-muted small">{{ invoice.customer?.customer_TIN || '' }}</div>
                  </td>
                  <td class="text-end fw-semibold">{{ formatMoney(invoice.invoice_total_amount) }}</td>
                  <td>
                    <span class="badge" :class="getObrStatusClass(invoice)">
                      {{ getObrStatusLabel(invoice) }}
                    </span>
                    <div v-if="invoice.is_cancelled" class="text-danger small mt-1">
                      {{ invoice.cancel_reason || 'Facture annulée' }}
                    </div>
                  </td>
                  <td class="small">
                    <div>{{ latestObrMessage(invoice) }}</div>
                    <div v-if="invoice.latest_obr_log?.invoice_registered_number" class="text-muted">
                      Nº OBR: {{ invoice.latest_obr_log.invoice_registered_number }}
                    </div>
                    <div v-if="invoice.obr_sent_at" class="text-muted">
                      {{ formatDate(invoice.obr_sent_at) }}
                    </div>
                  </td>
                  <td class="text-end">
                    <button
                      v-if="canSendObrInvoice(invoice)"
                      class="btn btn-sm btn-outline-success me-1"
                      :disabled="sendingInvoiceId === invoice.id"
                      @click="sendObrInvoice(invoice)"
                      title="Envoyer à l'OBR"
                    >
                      <span v-if="sendingInvoiceId === invoice.id" class="spinner-border spinner-border-sm"></span>
                      <i v-else class="bi bi-send"></i>
                    </button>
                    <button
                      v-if="!invoice.is_cancelled"
                      class="btn btn-sm btn-outline-danger"
                      @click="openCancelInvoiceModal(invoice)"
                      title="Annuler la facture"
                    >
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="obrInvoices.length === 0">
                  <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-receipt fs-1 d-block mb-2"></i>
                    Aucune facture trouvée.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav v-if="obrPagination.last_page > 1" class="d-flex justify-content-center mt-3">
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: obrPagination.current_page === 1 }">
                <button class="page-link" @click="changeObrPage(obrPagination.current_page - 1)">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              <li class="page-item" :class="{ active: obrPagination.current_page === page }" v-for="page in getObrPageRange()" :key="page">
                <button class="page-link" @click="changeObrPage(page)">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: obrPagination.current_page === obrPagination.last_page }">
                <button class="page-link" @click="changeObrPage(obrPagination.current_page + 1)">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </section>

    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditing ? 'Modifier la configuration' : 'Nouvelle configuration' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm" id="configForm">
              <div class="mb-3">
                <label class="form-label">Clé de configuration</label>
                <input
                  v-model="form.config_key"
                  type="text"
                  class="form-control"
                  :readonly="isEditing"
                  :class="{'bg-light': isEditing}"
                  required
                  placeholder="Ex: OBR_NEW_PARAM"
                >
                <div v-if="isEditing" class="form-text">La clé ne peut pas être modifiée une fois créée.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Valeur</label>
                <textarea v-if="isLongText(form.value) || !isEditing" class="form-control" v-model="form.value" rows="3" required></textarea>
                <input v-else type="text" class="form-control" v-model="form.value" required>
              </div>

              <div class="mb-3">
                <label class="form-label">Description (Optionnel)</label>
                <textarea class="form-control" v-model="form.description" rows="2"></textarea>
              </div>

              <div class="mb-3" v-if="isEditing && !currentConfig?.modifiable">
                <div class="alert alert-info py-2 small">
                  <i class="bi bi-info-circle me-1"></i> Certaines propriétés sont verrouillées par le système.
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" form="configForm" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCancelInvoiceModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Annuler la facture</h5>
            <button type="button" class="btn-close" @click="closeCancelInvoiceModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <div class="fw-semibold">{{ invoiceToCancel?.invoice_number }}</div>
              <div class="text-muted small">{{ invoiceToCancel?.customer?.customer_name || '-' }}</div>
            </div>
            <label class="form-label">Motif</label>
            <textarea
              v-model.trim="cancelMotif"
              class="form-control"
              rows="4"
              required
              placeholder="Marchandise non conforme à la commande"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeCancelInvoiceModal">Fermer</button>
            <button type="button" class="btn btn-danger" :disabled="cancelling || !cancelMotif" @click="submitCancelInvoice">
              <span v-if="cancelling" class="spinner-border spinner-border-sm me-1"></span>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import api from '@/services/api';
import SettingsHeader from './SettingsHeader.vue';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const store = useStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

const resolveRouteTab = () => route.name === 'settings.obr-invoices' || route.query.tab === 'obrInvoices'
  ? 'obrInvoices'
  : 'configs';

const activeTab = ref(resolveRouteTab());
const showModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const currentConfig = ref(null);

const form = reactive({
  id: null,
  config_key: '',
  value: '',
  description: '',
});

const obrInvoices = ref([]);
const obrLoading = ref(false);
const obrError = ref('');
const obrStatusGroup = ref('all');
const obrSearch = ref('');
const obrLoaded = ref(false);
const sendingInvoiceId = ref(null);
const showCancelInvoiceModal = ref(false);
const invoiceToCancel = ref(null);
const cancelMotif = ref('');
const cancelling = ref(false);

const obrStats = reactive({
  total: 0,
  sent: 0,
  unsent: 0,
  cancelled: 0,
});

const obrPagination = reactive({
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 10,
});

const configs = computed(() => store.state.configs);
const pagination = computed(() => store.state.pagination);
const loading = computed(() => store.state.loading);
const error = computed(() => store.state.error);

const obrStatusGroups = [
  { label: 'Toutes', value: 'all' },
  { label: 'Envoyées', value: 'sent' },
  { label: 'Non envoyées', value: 'unsent' },
  { label: 'Annulées', value: 'cancelled' },
];

const obrStatCards = computed(() => [
  { label: 'Total', value: obrStats.total },
  { label: 'Envoyées', value: obrStats.sent },
  { label: 'Non envoyées', value: obrStats.unsent },
  { label: 'Annulées', value: obrStats.cancelled },
]);

onMounted(() => {
  fetchData();
  if (activeTab.value === 'obrInvoices') {
    fetchObrInvoices();
  }
});

watch(
  () => [route.name, route.query.tab],
  () => {
    const tab = resolveRouteTab();
    activeTab.value = tab;
    if (tab === 'obrInvoices' && !obrLoaded.value) {
      fetchObrInvoices();
    }
  }
);

const goToTabRoute = (tab) => {
  const routeName = tab === 'obrInvoices' ? 'settings.obr-invoices' : 'settings';
  if (route.name !== routeName) {
    router.push({ name: routeName });
  }
};

const fetchData = (page = 1) => {
  store.dispatch('fetchConfigs', page);
};

const refreshActiveTab = () => {
  if (activeTab.value === 'configs') {
    fetchData(pagination.value.current_page || 1);
    return;
  }

  fetchObrInvoices(obrPagination.current_page || 1);
};

const switchTab = (tab) => {
  activeTab.value = tab;
  goToTabRoute(tab);
  if (tab === 'obrInvoices' && !obrLoaded.value) {
    fetchObrInvoices();
  }
};

const changePage = (page) => {
  if (page < 1 || page > pagination.value.last_page) return;
  fetchData(page);
};

const getPageRange = () => {
  const range = [];
  const last = pagination.value.last_page || 1;
  for (let i = 1; i <= last; i++) {
    range.push(i);
  }
  return range;
};

const fetchObrInvoices = async (page = 1) => {
  obrLoading.value = true;
  obrError.value = '';

  try {
    const params = {
      page,
      per_page: obrPagination.per_page,
    };

    if (obrStatusGroup.value !== 'all') {
      params.status_group = obrStatusGroup.value;
    }

    if (obrSearch.value) {
      params.search = obrSearch.value;
    }

    const response = await api.get('/invoices/obr-monitor', { params });
    const pageData = response.data?.data || {};
    const stats = response.data?.stats || {};

    obrInvoices.value = pageData.data || [];
    obrPagination.current_page = pageData.current_page || 1;
    obrPagination.last_page = pageData.last_page || 1;
    obrPagination.total = pageData.total || 0;
    obrPagination.per_page = Number(pageData.per_page || obrPagination.per_page || 10);
    obrStats.total = stats.total || 0;
    obrStats.sent = stats.sent || 0;
    obrStats.unsent = stats.unsent || 0;
    obrStats.cancelled = stats.cancelled || 0;
    obrLoaded.value = true;
  } catch (err) {
    obrError.value = getApiError(err, 'Impossible de charger les factures OBR.');
  } finally {
    obrLoading.value = false;
  }
};

const setObrStatusGroup = (group) => {
  obrStatusGroup.value = group;
  fetchObrInvoices(1);
};

const changeObrPage = (page) => {
  if (page < 1 || page > obrPagination.last_page) return;
  fetchObrInvoices(page);
};

const getObrPageRange = () => {
  const range = [];
  for (let i = 1; i <= (obrPagination.last_page || 1); i++) {
    range.push(i);
  }
  return range;
};

const sendObrInvoice = async (invoice) => {
  sendingInvoiceId.value = invoice.id;
  try {
    const response = await api.post(`/invoices/${invoice.id}/resend-obr`);
    toast.success(response.data?.message || 'Facture envoyée à l\'OBR.');
    fetchObrInvoices(obrPagination.current_page);
  } catch (err) {
    toast.error(getApiError(err, 'Impossible d\'envoyer la facture à l\'OBR.'));
  } finally {
    sendingInvoiceId.value = null;
  }
};

const openCancelInvoiceModal = (invoice) => {
  invoiceToCancel.value = invoice;
  cancelMotif.value = '';
  showCancelInvoiceModal.value = true;
};

const closeCancelInvoiceModal = () => {
  if (cancelling.value) return;
  showCancelInvoiceModal.value = false;
  invoiceToCancel.value = null;
  cancelMotif.value = '';
};

const submitCancelInvoice = async () => {
  if (!invoiceToCancel.value || !cancelMotif.value) return;

  cancelling.value = true;
  try {
    const response = await api.post(`/invoices/${invoiceToCancel.value.id}/cancel`, {
      motif: cancelMotif.value,
      restore_stock: true,
    });
    toast.success(response.data?.message || 'Facture annulée avec succès.');
    closeCancelInvoiceModal();
    fetchObrInvoices(obrPagination.current_page);
  } catch (err) {
    toast.error(getApiError(err, 'Impossible d\'annuler la facture.'));
  } finally {
    cancelling.value = false;
  }
};

const formatValue = (val) => {
  if (val === null || val === undefined) return '-';
  if (String(val).length > 50) return String(val).substring(0, 50) + '...';
  return val;
};

const isLongText = (val) => {
  return val && val.length > 50;
};

const canDelete = (config) => {
  return config.modifiable === true || config.modifiable === 1;
};

const getObrStatusLabel = (invoice) => {
  if (invoice.is_cancelled) return 'Annulée';
  const labels = {
    ACCEPTED: 'Envoyée',
    SENT: 'Envoyée',
    PENDING: 'Non envoyée',
    REJECTED: 'Rejetée',
  };
  return labels[invoice.obr_submission_status] || invoice.obr_submission_status || 'Non envoyée';
};

const getObrStatusClass = (invoice) => {
  if (invoice.is_cancelled) return 'bg-dark';
  const classes = {
    ACCEPTED: 'bg-success',
    SENT: 'bg-success',
    PENDING: 'bg-warning text-dark',
    REJECTED: 'bg-danger',
  };
  return classes[invoice.obr_submission_status] || 'bg-secondary';
};

const canSendObrInvoice = (invoice) => {
  return !invoice.is_cancelled && !['ACCEPTED', 'SENT'].includes(invoice.obr_submission_status);
};

const latestObrMessage = (invoice) => {
  return invoice.latest_obr_log?.obr_message || invoice.obr_response_message || '-';
};

const formatMoney = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'BIF',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getApiError = (err, fallback) => {
  return err.response?.data?.message || err.message || fallback;
};

const openCreateModal = () => {
  isEditing.value = false;
  currentConfig.value = null;
  form.id = null;
  form.config_key = '';
  form.value = '';
  form.description = '';
  showModal.value = true;
};

const openEditModal = (config) => {
  isEditing.value = true;
  currentConfig.value = config;
  form.id = config.id;
  form.config_key = config.config_key;
  form.value = config.value;
  form.description = config.description || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  currentConfig.value = null;
  form.id = null;
  form.config_key = '';
  form.value = '';
  form.description = '';
};

const submitForm = async () => {
  submitting.value = true;

  let result;
  if (isEditing.value) {
    result = await store.dispatch('updateConfig', {
      id: form.id,
      value: form.value,
      description: form.description,
    });
  } else {
    result = await store.dispatch('createConfig', { ...form });
  }

  submitting.value = false;
  if (result.success) {
    closeModal();
    if (!isEditing.value) fetchData();
  } else {
    toast.error(result.message || 'Une erreur est survenue');
  }
};

const confirmDelete = async (config) => {
  if (await confirmDialog(`Êtes-vous sûr de vouloir supprimer la configuration "${config.config_key}" ?`)) {
    await store.dispatch('deleteConfig', config.id);
  }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}

.font-monospace {
  font-family: monospace;
}

.obr-search {
  max-width: 420px;
}
</style>
