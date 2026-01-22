<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Activity, Search, Filter, Calendar, User, 
  ChevronLeft, ChevronRight, Loader2, Download, RefreshCw,
  LogIn, LogOut, Package, Receipt, Users, Wallet, 
  Building, ShoppingCart, Settings, Eye, Clock, FileText
} from 'lucide-vue-next';
import api from '@/services/api';

// State
const activities = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const searchTimeout = ref(null);
const selectedType = ref('all');
const selectedAction = ref('all');
const startDate = ref('');
const endDate = ref('');
const showFilters = ref(false);
const selectedActivity = ref(null);
const showDetailsModal = ref(false);

// Data
const activityTypes = ref([]);
const activityActions = ref([]);
const stats = ref({
  today: 0,
  this_week: 0,
  by_type: {},
  daily_stats: {},
  top_users: []
});

// Pagination
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0
});

// Icons mapping
const typeIcons = {
  auth: LogIn,
  invoice: Receipt,
  product: Package,
  stock: Package,
  customer: Users,
  payment: Wallet,
  expense: Wallet,
  user: User,
  warehouse: Building,
  order: ShoppingCart,
  system: Settings,
};

// Colors mapping
const actionColors = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
  login: 'primary',
  logout: 'secondary',
  viewed: 'light',
  approved: 'success',
  cancelled: 'warning',
  paid: 'success',
  exported: 'info',
};

// Fetch functions
const fetchActivities = async (page = 1) => {
  loading.value = true;
  error.value = null;
  try {
    const params = { page, per_page: 20 };
    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedType.value !== 'all') params.log_type = selectedType.value;
    if (selectedAction.value !== 'all') params.action = selectedAction.value;
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;

    const response = await api.get('/activity-logs', { params });
    if (response.data.success) {
      const data = response.data.data;
      activities.value = data.data || [];
      pagination.value = {
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
        from: data.from || 0,
        to: data.to || 0
      };
    }
  } catch (err) {
    console.error('Error fetching activities:', err);
    error.value = 'Erreur lors du chargement du journal';
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const response = await api.get('/activity-logs/stats');
    if (response.data.success) {
      stats.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
};

const fetchTypes = async () => {
  try {
    const response = await api.get('/activity-logs/types');
    if (response.data.success) {
      activityTypes.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching types:', err);
  }
};

const fetchActions = async () => {
  try {
    const response = await api.get('/activity-logs/actions');
    if (response.data.success) {
      activityActions.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching actions:', err);
  }
};

// Handlers
const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    fetchActivities(1);
  }, 400);
};

const applyFilters = () => {
  fetchActivities(1);
};

const resetFilters = () => {
  selectedType.value = 'all';
  selectedAction.value = 'all';
  startDate.value = '';
  endDate.value = '';
  searchQuery.value = '';
  fetchActivities(1);
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.last_page) {
    fetchActivities(page);
  }
};

const openDetails = (activity) => {
  selectedActivity.value = activity;
  showDetailsModal.value = true;
};

const closeDetails = () => {
  selectedActivity.value = null;
  showDetailsModal.value = false;
};

const exportActivities = async () => {
  try {
    const params = {};
    if (selectedType.value !== 'all') params.log_type = selectedType.value;
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;

    const response = await api.get('/activity-logs/export', { params });
    if (response.data.success) {
      // Create CSV
      const data = response.data.data;
      const headers = ['Date', 'Type', 'Action', 'Description', 'Utilisateur'];
      const rows = data.map(a => [
        formatDateTime(a.created_at),
        getTypeLabel(a.log_type),
        getActionLabel(a.action),
        a.description,
        a.user?.name || 'Système'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `journal_activites_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  } catch (err) {
    console.error('Error exporting:', err);
    alert('Erreur lors de l\'export');
  }
};

// Helpers
const getTypeLabel = (type) => {
  const found = activityTypes.value.find(t => t.value === type);
  return found?.label || type;
};

const getActionLabel = (action) => {
  const found = activityActions.value.find(a => a.value === action);
  return found?.label || action;
};

const getActionBadgeClass = (action) => {
  return actionColors[action] || 'secondary';
};

const getTypeIcon = (type) => {
  return typeIcons[type] || Activity;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  return formatDateTime(dateStr);
};

// Watch filters
watch([selectedType, selectedAction], () => {
  fetchActivities(1);
});

// Init
onMounted(() => {
  fetchActivities();
  fetchStats();
  fetchTypes();
  fetchActions();
});
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">
          <Activity :size="28" class="me-2 text-primary" />
          Journal d'Activités
        </h1>
        <p class="text-muted mb-0">Historique des actions et événements du système</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="fetchActivities(pagination.current_page); fetchStats()">
          <RefreshCw :size="16" class="me-1" />
          Actualiser
        </button>
        <button class="btn btn-outline-primary" @click="exportActivities">
          <Download :size="16" class="me-1" />
          Exporter
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100 bg-primary bg-gradient text-white">
          <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1 opacity-75">Aujourd'hui</h6>
                <h2 class="mb-0 fw-bold">{{ stats.today }}</h2>
              </div>
              <Clock :size="32" class="opacity-50" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100 bg-success bg-gradient text-white">
          <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1 opacity-75">Cette semaine</h6>
                <h2 class="mb-0 fw-bold">{{ stats.this_week }}</h2>
              </div>
              <Calendar :size="32" class="opacity-50" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100 bg-info bg-gradient text-white">
          <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1 opacity-75">Factures</h6>
                <h2 class="mb-0 fw-bold">{{ stats.by_type?.invoice || 0 }}</h2>
              </div>
              <Receipt :size="32" class="opacity-50" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100 bg-warning bg-gradient text-dark">
          <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1 opacity-75">Stock</h6>
                <h2 class="mb-0 fw-bold">{{ stats.by_type?.stock || 0 }}</h2>
              </div>
              <Package :size="32" class="opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white">
                <Search :size="16" />
              </span>
              <input 
                v-model="searchQuery"
                @input="handleSearch"
                type="text" 
                class="form-control" 
                placeholder="Rechercher une activité..."
              >
            </div>
          </div>
          <div class="col-md-2">
            <select v-model="selectedType" class="form-select">
              <option value="all">Tous les types</option>
              <option v-for="type in activityTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="selectedAction" class="form-select">
              <option value="all">Toutes les actions</option>
              <option v-for="action in activityActions" :key="action.value" :value="action.value">
                {{ action.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <input 
              v-model="startDate" 
              @change="applyFilters"
              type="date" 
              class="form-control"
              placeholder="Date début"
            >
          </div>
          <div class="col-md-2">
            <input 
              v-model="endDate" 
              @change="applyFilters"
              type="date" 
              class="form-control"
              placeholder="Date fin"
            >
          </div>
        </div>
        <div v-if="startDate || endDate || selectedType !== 'all' || selectedAction !== 'all'" class="mt-2">
          <button class="btn btn-sm btn-link text-danger p-0" @click="resetFilters">
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger alert-dismissible mb-4">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>

    <!-- Activity List -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5">
          <Loader2 :size="32" class="animate-spin text-primary" />
          <p class="text-muted mt-2">Chargement...</p>
        </div>

        <div v-else-if="activities.length === 0" class="text-center py-5 text-muted">
          <Activity :size="48" class="opacity-25 mb-3" />
          <p class="mb-0">Aucune activité trouvée</p>
        </div>

        <div v-else class="activity-timeline">
          <div 
            v-for="activity in activities" 
            :key="activity.id" 
            class="activity-item d-flex p-3 border-bottom hover-bg"
            @click="openDetails(activity)"
            style="cursor: pointer;"
          >
            <!-- Icon -->
            <div class="activity-icon me-3">
              <div 
                class="rounded-circle d-flex align-items-center justify-content-center"
                :class="`bg-${getActionBadgeClass(activity.action)}-subtle text-${getActionBadgeClass(activity.action)}`"
                style="width: 44px; height: 44px;"
              >
                <component :is="getTypeIcon(activity.log_type)" :size="20" />
              </div>
            </div>

            <!-- Content -->
            <div class="activity-content flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1 fw-semibold">{{ activity.description }}</h6>
                  <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge" :class="`bg-${getActionBadgeClass(activity.action)}`">
                      {{ getActionLabel(activity.action) }}
                    </span>
                    <small class="text-muted">
                      <span class="badge bg-light text-dark">{{ getTypeLabel(activity.log_type) }}</span>
                    </small>
                    <small class="text-muted">
                      <User :size="12" class="me-1" />
                      {{ activity.user?.name || 'Système' }}
                    </small>
                  </div>
                </div>
                <small class="text-muted text-nowrap">
                  {{ formatRelativeTime(activity.created_at) }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1 || pagination.total > 0" class="d-flex justify-content-between align-items-center p-3 border-top">
          <small class="text-muted">
            Affichage {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }}
          </small>
          <nav v-if="pagination.last_page > 1">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="changePage(pagination.current_page - 1)">
                  <ChevronLeft :size="14" />
                </button>
              </li>
              <li class="page-item active">
                <span class="page-link">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
              </li>
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                <button class="page-link" @click="changePage(pagination.current_page + 1)">
                  <ChevronRight :size="14" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Top Users Card -->
    <div v-if="stats.top_users && stats.top_users.length > 0" class="card border-0 shadow-sm mt-4">
      <div class="card-header bg-white border-0 py-3">
        <h6 class="mb-0 fw-bold">
          <Users :size="18" class="me-2" />
          Utilisateurs les plus actifs ce mois
        </h6>
      </div>
      <div class="card-body p-0">
        <div class="list-group list-group-flush">
          <div 
            v-for="(user, index) in stats.top_users" 
            :key="index"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div class="d-flex align-items-center">
              <span class="badge bg-primary me-3">{{ index + 1 }}</span>
              <span>{{ user.user }}</span>
            </div>
            <span class="badge bg-secondary">{{ user.count }} actions</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal && selectedActivity" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <FileText :size="20" class="me-2" />
              Détails de l'activité
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <table class="table table-borderless mb-0">
              <tbody>
                <tr>
                  <th class="text-muted" style="width: 140px;">Date</th>
                  <td>{{ formatDateTime(selectedActivity.created_at) }}</td>
                </tr>
                <tr>
                  <th class="text-muted">Type</th>
                  <td>
                    <span class="badge bg-light text-dark">{{ getTypeLabel(selectedActivity.log_type) }}</span>
                  </td>
                </tr>
                <tr>
                  <th class="text-muted">Action</th>
                  <td>
                    <span class="badge" :class="`bg-${getActionBadgeClass(selectedActivity.action)}`">
                      {{ getActionLabel(selectedActivity.action) }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th class="text-muted">Description</th>
                  <td>{{ selectedActivity.description }}</td>
                </tr>
                <tr>
                  <th class="text-muted">Utilisateur</th>
                  <td>{{ selectedActivity.user?.name || 'Système' }}</td>
                </tr>
                <tr>
                  <th class="text-muted">Adresse IP</th>
                  <td>{{ selectedActivity.ip_address || '-' }}</td>
                </tr>
                <tr v-if="selectedActivity.properties">
                  <th class="text-muted">Données</th>
                  <td>
                    <pre class="bg-light p-2 rounded small mb-0">{{ JSON.stringify(selectedActivity.properties, null, 2) }}</pre>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" @click="closeDetails">
              Fermer
            </button>
          </div>
        </div>
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

.hover-bg:hover {
  background-color: #f8f9fa;
}

.activity-timeline .activity-item:last-child {
  border-bottom: none !important;
}

.bg-success-subtle { background-color: rgba(25, 135, 84, 0.1) !important; }
.bg-danger-subtle { background-color: rgba(220, 53, 69, 0.1) !important; }
.bg-warning-subtle { background-color: rgba(255, 193, 7, 0.1) !important; }
.bg-info-subtle { background-color: rgba(13, 202, 240, 0.1) !important; }
.bg-primary-subtle { background-color: rgba(13, 110, 253, 0.1) !important; }
.bg-secondary-subtle { background-color: rgba(108, 117, 125, 0.1) !important; }
.bg-light-subtle { background-color: rgba(248, 249, 250, 0.5) !important; }

pre {
  max-height: 200px;
  overflow-y: auto;
}
</style>
