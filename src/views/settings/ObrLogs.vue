<template>
  <div class="obr-logs-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Journal OBR
        </h1>
        <p class="page-subtitle">Historique des envois de factures et mouvements de stock vers OBR</p>
      </div>
      <button class="btn btn-secondary" @click="loadStats">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Actualiser
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.invoices?.total || 0 }}</span>
          <span class="stat-label">Factures envoyées</span>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.invoices?.accepted || 0 }}</span>
          <span class="stat-label">Acceptées</span>
        </div>
      </div>

      <div class="stat-card error">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.invoices?.rejected || 0 }}</span>
          <span class="stat-label">Rejetées</span>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.invoices?.pending || 0 }}</span>
          <span class="stat-label">En attente</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Type</label>
        <select v-model="filters.log_type" @change="loadLogs">
          <option value="all">Tous</option>
          <option value="INVOICE">Factures</option>
          <option value="CANCEL">Annulations</option>
          <option value="STOCK_MOVEMENT">Mouvements Stock</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Statut</label>
        <select v-model="filters.status" @change="loadLogs">
          <option value="all">Tous</option>
          <option value="ACCEPTED">Accepté</option>
          <option value="REJECTED">Rejeté</option>
          <option value="PENDING">En attente</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Recherche</label>
        <input 
          type="text" 
          v-model="filters.search" 
          placeholder="N° facture..."
          @keyup.enter="loadLogs"
        />
      </div>

      <div class="filter-group">
        <label>Date début</label>
        <input type="date" v-model="filters.start_date" @change="loadLogs" />
      </div>

      <div class="filter-group">
        <label>Date fin</label>
        <input type="date" v-model="filters.end_date" @change="loadLogs" />
      </div>
    </div>

    <!-- Logs Table -->
    <div class="table-container">
      <table class="logs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>N° Facture</th>
            <th>Statut</th>
            <th>Message OBR</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.id }}</td>
            <td>
              <span class="type-badge" :class="log.log_type.toLowerCase()">
                {{ getTypeLabel(log.log_type) }}
              </span>
            </td>
            <td>
              <span class="invoice-number">{{ log.invoice_number || '-' }}</span>
            </td>
            <td>
              <span class="status-badge" :class="log.status.toLowerCase()">
                {{ getStatusLabel(log.status) }}
              </span>
            </td>
            <td class="message-cell">
              <span class="message-text" :title="log.obr_message">
                {{ truncateMessage(log.obr_message) }}
              </span>
            </td>
            <td>{{ formatDate(log.created_at) }}</td>
            <td>
              <div class="actions">
                <button class="action-btn view" @click="viewDetails(log)" title="Voir détails">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button 
                  v-if="log.status === 'REJECTED'"
                  class="action-btn retry" 
                  @click="retryLog(log)"
                  title="Réessayer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="7" class="empty-cell">Aucun log trouvé</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.total > pagination.per_page">
      <button 
        class="page-btn"
        :disabled="pagination.current_page === 1"
        @click="changePage(pagination.current_page - 1)"
      >
        Précédent
      </button>
      <span class="page-info">
        Page {{ pagination.current_page }} sur {{ pagination.last_page }}
      </span>
      <button 
        class="page-btn"
        :disabled="pagination.current_page === pagination.last_page"
        @click="changePage(pagination.current_page + 1)"
      >
        Suivant
      </button>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails du Log #{{ selectedLog?.id }}</h2>
          <button class="modal-close" @click="showDetail = false">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedLog">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Type</label>
              <span class="type-badge" :class="selectedLog.log_type?.toLowerCase()">
                {{ getTypeLabel(selectedLog.log_type) }}
              </span>
            </div>
            <div class="detail-item">
              <label>Statut</label>
              <span class="status-badge" :class="selectedLog.status?.toLowerCase()">
                {{ getStatusLabel(selectedLog.status) }}
              </span>
            </div>
            <div class="detail-item">
              <label>N° Facture</label>
              <span>{{ selectedLog.invoice_number || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Identifiant OBR</label>
              <span class="mono">{{ selectedLog.invoice_identifier || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Signature Électronique</label>
              <span class="mono">{{ selectedLog.electronic_signature || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>N° Enregistrement OBR</label>
              <span>{{ selectedLog.invoice_registered_number || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Date Enregistrement</label>
              <span>{{ formatDate(selectedLog.invoice_registered_date) || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Tentatives</label>
              <span>{{ selectedLog.retry_count || 0 }}</span>
            </div>
          </div>

          <div class="detail-section">
            <label>Message OBR</label>
            <div class="message-box" :class="selectedLog.success ? 'success' : 'error'">
              {{ selectedLog.obr_message || 'Aucun message' }}
            </div>
          </div>

          <div class="detail-section" v-if="selectedLog.obr_response">
            <label>Réponse OBR complète</label>
            <pre class="response-box">{{ formatJson(selectedLog.obr_response) }}</pre>
          </div>

          <div class="detail-section" v-if="selectedLog.request_body">
            <label>Corps de la requête</label>
            <pre class="request-box">{{ formatJson(selectedLog.request_body) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

export default {
  name: 'ObrLogs',
  setup() {
    const toast = useToast();
    const { confirm: confirmDialog } = useConfirm();
    return { toast, confirmDialog };
  },
  data() {
    return {
      logs: [],
      stats: {},
      filters: {
        log_type: 'all',
        status: 'all',
        search: '',
        start_date: '',
        end_date: ''
      },
      pagination: {
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 1
      },
      showDetail: false,
      selectedLog: null
    };
  },
  mounted() {
    this.loadLogs();
    this.loadStats();
  },
  methods: {
    async loadLogs() {
      try {
        const params = new URLSearchParams();
        params.append('page', this.pagination.current_page);
        params.append('per_page', this.pagination.per_page);
        
        if (this.filters.log_type !== 'all') params.append('log_type', this.filters.log_type);
        if (this.filters.status !== 'all') params.append('status', this.filters.status);
        if (this.filters.search) params.append('search', this.filters.search);
        if (this.filters.start_date) params.append('start_date', this.filters.start_date);
        if (this.filters.end_date) params.append('end_date', this.filters.end_date);

        const response = await api.get(`/obr-logs?${params.toString()}`);
        const data = response.data.data;
        
        this.logs = data.data || [];
        this.pagination = {
          current_page: data.current_page,
          per_page: data.per_page,
          total: data.total,
          last_page: data.last_page
        };
      } catch (error) {
        console.error('Erreur chargement logs:', error);
      }
    },
    async loadStats() {
      try {
        const response = await api.get('/obr-logs/stats');
        this.stats = response.data.data;
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    },
    changePage(page) {
      this.pagination.current_page = page;
      this.loadLogs();
    },
    viewDetails(log) {
      this.selectedLog = log;
      this.showDetail = true;
    },
    async retryLog(log) {
      if (!(await this.confirmDialog('Réessayer cet envoi ?'))) return;
      
      try {
        await api.post(`/obr-logs/${log.id}/retry`);
        this.toast.success('Tentative de renvoi planifiée');
        this.loadLogs();
        this.loadStats();
      } catch (error) {
        console.error('Erreur retry:', error);
        this.toast.error('Erreur lors de la planification du renvoi');
      }
    },
    getTypeLabel(type) {
      const labels = {
        'INVOICE': 'Facture',
        'CANCEL': 'Annulation',
        'STOCK_MOVEMENT': 'Mouvement Stock'
      };
      return labels[type] || type;
    },
    getStatusLabel(status) {
      const labels = {
        'ACCEPTED': 'Accepté',
        'REJECTED': 'Rejeté',
        'PENDING': 'En attente'
      };
      return labels[status] || status;
    },
    truncateMessage(msg) {
      if (!msg) return '-';
      return msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
    },
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleString('fr-FR');
    },
    formatJson(data) {
      try {
        if (typeof data === 'string') {
          return JSON.stringify(JSON.parse(data), null, 2);
        }
        return JSON.stringify(data, null, 2);
      } catch {
        return data;
      }
    }
  }
};
</script>

<style scoped>
.obr-logs-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.stat-card.total { border-color: #3b82f6; }
.stat-card.success { border-color: #10b981; }
.stat-card.error { border-color: #ef4444; }
.stat-card.warning { border-color: #f59e0b; }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.total .stat-icon { background: #dbeafe; color: #3b82f6; }
.stat-card.success .stat-icon { background: #d1fae5; color: #10b981; }
.stat-card.error .stat-icon { background: #fee2e2; color: #ef4444; }
.stat-card.warning .stat-icon { background: #fef3c7; color: #f59e0b; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 150px;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th,
.logs-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.logs-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.logs-table tbody tr:hover {
  background: #f9fafb;
}

.type-badge,
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-badge.invoice { background: #dbeafe; color: #1d4ed8; }
.type-badge.cancel { background: #fee2e2; color: #dc2626; }
.type-badge.stock_movement { background: #fef3c7; color: #d97706; }

.status-badge.accepted { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #fee2e2; color: #dc2626; }
.status-badge.pending { background: #fef3c7; color: #92400e; }

.invoice-number {
  font-family: monospace;
  font-size: 0.875rem;
}

.message-cell {
  max-width: 200px;
}

.message-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn.view {
  background: #dbeafe;
  color: #3b82f6;
}

.action-btn.retry {
  background: #fef3c7;
  color: #d97706;
}

.action-btn:hover {
  transform: scale(1.1);
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.detail-item span {
  font-size: 0.875rem;
  color: #1f2937;
}

.detail-item .mono {
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.message-box {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
}

.message-box.success {
  background: #d1fae5;
  color: #065f46;
}

.message-box.error {
  background: #fee2e2;
  color: #dc2626;
}

.response-box,
.request-box {
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: monospace;
  overflow-x: auto;
  max-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-bar {
    flex-direction: column;
  }

  .filter-group select,
  .filter-group input {
    width: 100%;
  }
}
</style>
