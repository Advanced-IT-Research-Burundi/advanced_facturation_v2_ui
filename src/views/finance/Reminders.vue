<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Bell, AlertCircle, CheckCircle, Clock, Send, Phone,
  Mail, MessageSquare, FileText, Plus, Filter, Search
} from 'lucide-vue-next';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const toast = useToast();
const { confirm: confirmDialog } = useConfirm();

// State
const loading = ref(true);
const activeTab = ref('unpaid');
const reminders = ref([]);
const unpaidInvoices = ref([]);
const stats = ref(null);
const showCreateModal = ref(false);
const selectedInvoice = ref(null);

// Filters
const statusFilter = ref('all');
const searchQuery = ref('');

// Create form
const createForm = ref({
  invoice_id: null,
  type: 'phone',
  reminder_date: new Date().toISOString().split('T')[0],
  next_reminder_date: '',
  message: ''
});

// Formatters
const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FBU';
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-';

// Reminder types
const reminderTypes = {
  phone: { label: 'Appel', icon: Phone, color: 'primary' },
  email: { label: 'Email', icon: Mail, color: 'info' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'success' },
  letter: { label: 'Courrier', icon: FileText, color: 'warning' },
  other: { label: 'Autre', icon: Bell, color: 'secondary' }
};

// Fetch functions
const fetchReminders = async () => {
  try {
    const params = {};
    if (statusFilter.value !== 'all') params.status = statusFilter.value;

    const res = await api.get('/reminders', { params });
    if (res.data.success) {
      reminders.value = res.data.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching reminders:', error);
  }
};

const fetchUnpaidInvoices = async () => {
  try {
    const res = await api.get('/reminders/unpaid-invoices');
    if (res.data.success) {
      unpaidInvoices.value = res.data.data.invoices || [];
    }
  } catch (error) {
    console.error('Error fetching unpaid invoices:', error);
  }
};

const fetchStats = async () => {
  try {
    const res = await api.get('/reminders/stats');
    if (res.data.success) {
      stats.value = res.data.data;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

// Filtered data
const filteredReminders = computed(() => {
  if (!searchQuery.value) return reminders.value;
  const query = searchQuery.value.toLowerCase();
  return reminders.value.filter(r =>
    r.invoice?.invoice_number?.toLowerCase().includes(query) ||
    r.customer?.customer_name?.toLowerCase().includes(query)
  );
});

const filteredUnpaid = computed(() => {
  if (!searchQuery.value) return unpaidInvoices.value;
  const query = searchQuery.value.toLowerCase();
  return unpaidInvoices.value.filter(inv =>
    inv.invoice_number?.toLowerCase().includes(query) ||
    inv.customer_name?.toLowerCase().includes(query)
  );
});

// Actions
const openCreateModal = (invoice = null) => {
  selectedInvoice.value = invoice;
  createForm.value = {
    invoice_id: invoice?.id || null,
    type: 'phone',
    reminder_date: new Date().toISOString().split('T')[0],
    next_reminder_date: '',
    message: invoice ? `Rappel pour la facture ${invoice.invoice_number} - Montant dû: ${formatCurrency(invoice.amount_due)}` : ''
  };
  showCreateModal.value = true;
};

const createReminder = async () => {
  try {
    const res = await api.post('/reminders', createForm.value);
    if (res.data.success) {
      showCreateModal.value = false;
      await Promise.all([fetchReminders(), fetchUnpaidInvoices(), fetchStats()]);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur lors de la création');
  }
};

const markAsSent = async (id) => {
  try {
    await api.post(`/reminders/${id}/mark-sent`);
    await fetchReminders();
    await fetchStats();
  } catch (error) {
    toast.error('Erreur lors de la mise à jour');
  }
};

const markAsPaid = async (id) => {
  try {
    await api.post(`/reminders/${id}/mark-paid`);
    await Promise.all([fetchReminders(), fetchUnpaidInvoices(), fetchStats()]);
  } catch (error) {
    toast.error('Erreur lors de la mise à jour');
  }
};

const deleteReminder = async (id) => {
  if (!(await confirmDialog('Supprimer cette relance ?'))) return;
  try {
    await api.delete(`/reminders/${id}`);
    await fetchReminders();
    await fetchStats();
  } catch (error) {
    toast.error('Erreur lors de la suppression');
  }
};

// Get status class
const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-warning text-dark',
    sent: 'bg-info',
    acknowledged: 'bg-primary',
    paid: 'bg-success'
  };
  return classes[status] || 'bg-secondary';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    sent: 'Envoyée',
    acknowledged: 'Accusée',
    paid: 'Payée'
  };
  return labels[status] || status;
};

// Init
onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchReminders(), fetchUnpaidInvoices(), fetchStats()]);
  loading.value = false;
});
</script>

<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Relances Clients</h1>
        <p class="text-muted mb-0">Suivi des factures impayées et relances</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="row g-3 mb-4" v-if="stats">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-muted small mb-1">En attente</p>
                  <h3 class="mb-0">{{ stats.by_status?.pending || 0 }}</h3>
                </div>
                <div class="rounded-3 p-2 bg-warning bg-opacity-10">
                  <Clock :size="24" class="text-warning" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-muted small mb-1">Envoyées</p>
                  <h3 class="mb-0">{{ stats.by_status?.sent || 0 }}</h3>
                </div>
                <div class="rounded-3 p-2 bg-info bg-opacity-10">
                  <Send :size="24" class="text-info" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-muted small mb-1">A faire aujourd'hui</p>
                  <h3 class="mb-0 text-danger">{{ stats.due_today || 0 }}</h3>
                </div>
                <div class="rounded-3 p-2 bg-danger bg-opacity-10">
                  <AlertCircle :size="24" class="text-danger" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <p class="text-muted small mb-1">Payées</p>
                  <h3 class="mb-0 text-success">{{ stats.by_status?.paid || 0 }}</h3>
                </div>
                <div class="rounded-3 p-2 bg-success bg-opacity-10">
                  <CheckCircle :size="24" class="text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button :class="['nav-link', activeTab === 'unpaid' && 'active']" @click="activeTab = 'unpaid'">
            Factures impayées
            <span class="badge bg-danger ms-1">{{ unpaidInvoices.length }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button :class="['nav-link', activeTab === 'reminders' && 'active']" @click="activeTab = 'reminders'">
            Mes relances
            <span class="badge bg-primary ms-1">{{ reminders.length }}</span>
          </button>
        </li>
      </ul>

      <!-- Search -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text"><Search :size="18" /></span>
            <input type="text" v-model="searchQuery" class="form-control" placeholder="Rechercher...">
          </div>
        </div>
        <div class="col-md-3" v-if="activeTab === 'reminders'">
          <select v-model="statusFilter" class="form-select" @change="fetchReminders">
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="sent">Envoyées</option>
            <option value="acknowledged">Accusées</option>
            <option value="paid">Payées</option>
          </select>
        </div>
      </div>

      <!-- Unpaid Invoices Tab -->
      <div v-if="activeTab === 'unpaid'" class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>N° Facture</th>
                  <th>Client</th>
                  <th>Date facture</th>
                  <th>Échéance</th>
                  <th class="text-end">Montant dû</th>
                  <th>Retard</th>
                  <th>Relances</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredUnpaid.length">
                  <td colspan="8" class="text-center text-muted py-4">Aucune facture impayée</td>
                </tr>
                <tr v-for="inv in filteredUnpaid" :key="inv.id">
                  <td class="fw-medium text-primary">{{ inv.invoice_number }}</td>
                  <td>{{ inv.customer_name }}</td>
                  <td>{{ formatDate(inv.invoice_date) }}</td>
                  <td>{{ formatDate(inv.due_date) }}</td>
                  <td class="text-end fw-bold text-danger">{{ formatCurrency(inv.amount_due) }}</td>
                  <td>
                    <span v-if="inv.days_overdue > 0" class="badge bg-danger">
                      {{ inv.days_overdue }} jours
                    </span>
                    <span v-else class="badge bg-success">À jour</span>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ inv.reminder_count || 0 }}</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="openCreateModal(inv)">
                      <Bell :size="14" class="me-1" /> Relancer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Reminders Tab -->
      <div v-if="activeTab === 'reminders'" class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>N° Facture</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th class="text-end">Montant dû</th>
                  <th>Niveau</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredReminders.length">
                  <td colspan="8" class="text-center text-muted py-4">Aucune relance</td>
                </tr>
                <tr v-for="rem in filteredReminders" :key="rem.id">
                  <td>{{ formatDate(rem.reminder_date) }}</td>
                  <td class="fw-medium text-primary">{{ rem.invoice?.invoice_number }}</td>
                  <td>{{ rem.customer?.customer_name }}</td>
                  <td>
                    <span :class="['badge', `bg-${reminderTypes[rem.type]?.color}`]">
                      {{ reminderTypes[rem.type]?.label }}
                    </span>
                  </td>
                  <td class="text-end fw-bold">{{ formatCurrency(rem.amount_due) }}</td>
                  <td>
                    <span class="badge bg-secondary">Niveau {{ rem.reminder_level }}</span>
                  </td>
                  <td>
                    <span :class="['badge', getStatusClass(rem.status)]">
                      {{ getStatusLabel(rem.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button v-if="rem.status === 'pending'" class="btn btn-outline-info" @click="markAsSent(rem.id)" title="Marquer envoyée">
                        <Send :size="14" />
                      </button>
                      <button v-if="rem.status !== 'paid'" class="btn btn-outline-success" @click="markAsPaid(rem.id)" title="Marquer payée">
                        <CheckCircle :size="14" />
                      </button>
                      <button class="btn btn-outline-danger" @click="deleteReminder(rem.id)" title="Supprimer">
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Créer une relance</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedInvoice" class="alert alert-info">
              <strong>Facture:</strong> {{ selectedInvoice.invoice_number }}<br>
              <strong>Client:</strong> {{ selectedInvoice.customer_name }}<br>
              <strong>Montant dû:</strong> {{ formatCurrency(selectedInvoice.amount_due) }}
            </div>

            <div class="mb-3">
              <label class="form-label">Type de relance *</label>
              <select v-model="createForm.type" class="form-select">
                <option value="phone">Appel téléphonique</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="letter">Courrier</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Date de relance *</label>
              <input type="date" v-model="createForm.reminder_date" class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Prochaine relance (optionnel)</label>
              <input type="date" v-model="createForm.next_reminder_date" class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Message</label>
              <textarea v-model="createForm.message" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="createReminder">Créer</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 12px;
}
.nav-tabs .nav-link {
  border: none;
  color: #6c757d;
}
.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom: 2px solid #0d6efd;
}
</style>
