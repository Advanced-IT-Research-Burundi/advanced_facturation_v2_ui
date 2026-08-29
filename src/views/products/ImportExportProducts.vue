<template>
  <div class="import-export-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Import / Export Produits
      </h1>
      <p class="page-subtitle">Importez vos produits en masse via Excel ou exportez votre catalogue</p>
    </div>

    <div class="cards-grid">
      <!-- Card Import -->
      <div class="action-card import-card">
        <div class="card-icon import-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <h2 class="card-title">Importer des Produits</h2>
        <p class="card-description">
          Importez plusieurs produits en une seule fois à partir d'un fichier Excel (.xlsx, .xls) ou CSV
        </p>

        <!-- Drag & Drop Zone -->
        <div 
          class="drop-zone"
          :class="{ 'drop-zone-active': isDragging, 'drop-zone-has-file': selectedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileSelect"
            hidden
          />
          <template v-if="!selectedFile">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="drop-icon">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <p class="drop-text">Glissez votre fichier ici ou <span class="drop-link">parcourir</span></p>
            <p class="drop-hint">Formats acceptés: .xlsx, .xls, .csv (max 10MB)</p>
          </template>
          <template v-else>
            <div class="file-preview">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <div class="file-info">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button class="remove-file-btn" @click.stop="removeFile">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </template>
        </div>

        <div class="card-actions">
          <button 
            class="btn btn-secondary" 
            @click="downloadTemplate"
            :disabled="downloadingTemplate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {{ downloadingTemplate ? 'Téléchargement...' : 'Télécharger le modèle' }}
          </button>
          <button 
            class="btn btn-primary"
            @click="previewImport"
            :disabled="!selectedFile || isLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {{ isLoading ? 'Analyse...' : 'Prévisualiser' }}
          </button>
        </div>
      </div>

      <!-- Card Export -->
      <div class="action-card export-card">
        <div class="card-icon export-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h2 class="card-title">Exporter les Produits</h2>
        <p class="card-description">
          Téléchargez votre catalogue de produits complet au format Excel pour sauvegarde ou analyse
        </p>

        <div class="export-options">
          <div class="option-group">
            <label class="option-label">Catégorie (optionnel)</label>
            <select v-model="exportFilters.category_id" class="option-select">
              <option value="">Toutes les catégories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="option-group">
            <label class="option-label">Recherche (optionnel)</label>
            <input 
              type="text" 
              v-model="exportFilters.search" 
              class="option-input"
              placeholder="Nom ou code produit..."
            />
          </div>
        </div>

        <div class="export-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalProducts }}</span>
            <span class="stat-label">Produits total</span>
          </div>
        </div>

        <div class="card-actions">
          <button 
            class="btn btn-success"
            @click="exportProducts"
            :disabled="exporting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            {{ exporting ? 'Export en cours...' : 'Exporter vers Excel' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="modal-overlay" @click.self="showPreview = false">
      <div class="modal-content preview-modal">
        <div class="modal-header">
          <h2>Prévisualisation de l'import</h2>
          <button class="modal-close" @click="showPreview = false">&times;</button>
        </div>

        <div class="preview-summary">
          <div class="summary-item new">
            <span class="summary-count">{{ previewData.new_count || 0 }}</span>
            <span class="summary-label">Nouveaux produits</span>
          </div>
          <div class="summary-item duplicate">
            <span class="summary-count">{{ previewData.duplicate_count || 0 }}</span>
            <span class="summary-label">Doublons détectés</span>
          </div>
          <div class="summary-item total">
            <span class="summary-count">{{ previewData.total || 0 }}</span>
            <span class="summary-label">Total lignes</span>
          </div>
        </div>

        <div class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th>Ligne</th>
                <th>Status</th>
                <th>Code</th>
                <th>Nom</th>
                <th>Marque</th>
                <th>Unité</th>
                <th>Qté</th>
                <th>Prix Achat</th>
                <th>Prix Vente</th>
                <th>Prix Promo</th>
                <th>TVA</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in previewData.items" :key="item.row" :class="'status-' + item.status">
                <td>{{ item.row }}</td>
                <td>
                  <span class="status-badge" :class="item.status">
                    {{ item.status === 'new' ? 'Nouveau' : 'Doublon' }}
                  </span>
                </td>
                <td>{{ item.code_product }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.brand }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatNumber(item.purchase_price) }}</td>
                <td>{{ formatNumber(item.selling_price) }}</td>
                <td>{{ formatNumber(item.promo_price) }}</td>
                <td>{{ item.vat_rate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showPreview = false">Annuler</button>
          <button 
            class="btn btn-primary"
            @click="confirmImport"
            :disabled="importing || previewData.new_count === 0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {{ importing ? 'Import en cours...' : `Importer ${previewData.new_count || 0} produits` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Import Results Modal -->
    <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
      <div class="modal-content results-modal">
        <div class="modal-header">
          <h2>Résultats de l'import</h2>
          <button class="modal-close" @click="showResults = false">&times;</button>
        </div>

        <div class="results-summary">
          <div class="result-item success">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="result-count">{{ importResults.summary?.success_count || 0 }}</span>
            <span class="result-label">Importés avec succès</span>
          </div>
          <div class="result-item error" v-if="importResults.summary?.error_count > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span class="result-count">{{ importResults.summary?.error_count || 0 }}</span>
            <span class="result-label">Erreurs</span>
          </div>
          <div class="result-item warning" v-if="importResults.summary?.duplicate_count > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span class="result-count">{{ importResults.summary?.duplicate_count || 0 }}</span>
            <span class="result-label">Doublons ignorés</span>
          </div>
        </div>

        <div v-if="importResults.errors?.length > 0" class="errors-list">
          <h3>Erreurs détaillées</h3>
          <div v-for="(error, idx) in importResults.errors" :key="idx" class="error-item">
            <strong>Ligne {{ error.row }}:</strong> {{ error.message }}
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" @click="closeResults">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
  name: 'ImportExportProducts',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      isDragging: false,
      selectedFile: null,
      isLoading: false,
      downloadingTemplate: false,
      exporting: false,
      importing: false,
      showPreview: false,
      showResults: false,
      previewData: {},
      importResults: {},
      exportFilters: {
        category_id: '',
        search: ''
      },
      categories: [],
      totalProducts: 0
    };
  },
  mounted() {
    this.loadCategories();
    this.loadProductCount();
  },
  methods: {
    async loadCategories() {
      try {
        const response = await api.get('/category-products');
        this.categories = response.data.data?.data || response.data.data || [];
      } catch (error) {
        console.error('Erreur chargement catégories:', error);
      }
    },
    async loadProductCount() {
      try {
        const response = await api.get('/products?per_page=1');
        this.totalProducts = response.data.data?.total || 0;
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      }
    },
    handleDrop(event) {
      this.isDragging = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.validateAndSetFile(files[0]);
      }
    },
    handleFileSelect(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.validateAndSetFile(files[0]);
      }
    },
    validateAndSetFile(file) {
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                         'application/vnd.ms-excel', 
                         'text/csv'];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validExtensions.includes(extension)) {
        this.toast.error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.toast.error('Le fichier est trop volumineux (max 10MB)');
        return;
      }

      this.selectedFile = file;
    },
    removeFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatNumber(value) {
      return new Intl.NumberFormat('fr-FR').format(value || 0);
    },
    async downloadTemplate() {
      this.downloadingTemplate = true;
      try {
        const response = await api.get('/export/products-template', {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'modele_import_produits.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erreur téléchargement template:', error);
        this.toast.error('Erreur lors du téléchargement du modèle');
      } finally {
        this.downloadingTemplate = false;
      }
    },
    async previewImport() {
      if (!this.selectedFile) return;

      this.isLoading = true;
      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const response = await api.post('/import/products/preview', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.previewData = response.data.data;
        this.showPreview = true;
      } catch (error) {
        console.error('Erreur preview:', error);
        this.toast.error(error.response?.data?.message || 'Erreur lors de la prévisualisation');
      } finally {
        this.isLoading = false;
      }
    },
    async confirmImport() {
      if (!this.selectedFile) return;

      this.importing = true;
      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const response = await api.post('/import/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.importResults = response.data.data;
        this.showPreview = false;
        this.showResults = true;
        this.removeFile();
        this.loadProductCount();
      } catch (error) {
        console.error('Erreur import:', error);
        this.toast.error(error.response?.data?.message || 'Erreur lors de l\'import');
      } finally {
        this.importing = false;
      }
    },
    closeResults() {
      this.showResults = false;
      this.importResults = {};
    },
    async exportProducts() {
      this.exporting = true;
      try {
        const params = new URLSearchParams();
        if (this.exportFilters.category_id) {
          params.append('category_id', this.exportFilters.category_id);
        }
        if (this.exportFilters.search) {
          params.append('search', this.exportFilters.search);
        }

        const response = await api.get(`/export/products?${params.toString()}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `export_produits_${new Date().toISOString().slice(0,10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erreur export:', error);
        this.toast.error('Erreur lors de l\'export');
      } finally {
        this.exporting = false;
      }
    }
  }
};
</script>

<style scoped>
.import-export-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.import-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.export-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.card-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
  margin-bottom: 24px;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.drop-zone-active {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.02);
}

.drop-zone-has-file {
  border-style: solid;
  border-color: #10b981;
  background: #ecfdf5;
}

.drop-icon {
  color: #9ca3af;
  margin-bottom: 16px;
}

.drop-text {
  color: #4b5563;
  margin: 0 0 8px 0;
}

.drop-link {
  color: #3b82f6;
  font-weight: 500;
}

.drop-hint {
  color: #9ca3af;
  font-size: 0.75rem;
  margin: 0;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.file-icon {
  color: #10b981;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.file-size {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s;
}

.remove-file-btn:hover {
  background: #fee2e2;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.export-options {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.option-select,
.option-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.option-select:focus,
.option-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.export-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
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
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-modal {
  max-width: 1200px;
}

.results-modal {
  max-width: 600px;
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
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.modal-close:hover {
  color: #1f2937;
}

.preview-summary {
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  background: #f9fafb;
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  border-radius: 10px;
  min-width: 120px;
}

.summary-item.new {
  background: #ecfdf5;
}

.summary-item.duplicate {
  background: #fef3c7;
}

.summary-item.total {
  background: #e0e7ff;
}

.summary-count {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-item.new .summary-count { color: #059669; }
.summary-item.duplicate .summary-count { color: #d97706; }
.summary-item.total .summary-count { color: #4338ca; }

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.preview-table-container {
  flex: 1;
  overflow: auto;
  padding: 0 24px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.preview-table th,
.preview-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.preview-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
}

.preview-table tr.status-duplicate {
  background: #fef3c7;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.new {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.duplicate {
  background: #fde68a;
  color: #92400e;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.results-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  flex: 1;
  min-width: 150px;
}

.result-item.success {
  background: #ecfdf5;
  color: #059669;
}

.result-item.error {
  background: #fef2f2;
  color: #dc2626;
}

.result-item.warning {
  background: #fef3c7;
  color: #d97706;
}

.result-count {
  font-size: 1.5rem;
  font-weight: 700;
}

.result-label {
  font-size: 0.75rem;
}

.errors-list {
  padding: 0 24px 24px;
}

.errors-list h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #dc2626;
}

.error-item {
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #991b1b;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }

  .preview-summary {
    flex-direction: column;
  }
}
</style>
