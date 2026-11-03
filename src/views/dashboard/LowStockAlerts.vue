<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import ListPagination from './ListPagination.vue';

const loading = ref(false);
const error = ref('');
const alerts = ref([]);
const summary = ref({});
const search = ref('');
const levelFilter = ref('');
const threshold = ref(10);

const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

const levelLabels = { critical: 'Critique', danger: 'Urgent', warning: 'Attention' };
const levelClasses = { critical: 'bg-danger', danger: 'bg-warning text-dark', warning: 'bg-info' };

const filteredAlerts = computed(() => {
  const q = search.value.toLowerCase().trim();
  return alerts.value.filter((a) => {
    if (levelFilter.value && a.alert_level !== levelFilter.value) return false;
    if (!q) return true;
    return (
      (a.product_name || '').toLowerCase().includes(q) ||
      (a.product_code || '').toLowerCase().includes(q) ||
      (a.warehouse_name || '').toLowerCase().includes(q)
    );
  });
});

const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const resp = await api.get('/analytics/low-stock', { params: { threshold: threshold.value } });
    if (resp.data.success) {
      alerts.value = resp.data.data?.alerts || [];
      summary.value = resp.data.data?.summary || {};
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const perPage = 15;
const currentPage = ref(1);
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredAlerts.value.slice(start, start + perPage);
});

// Revenir à la première page quand la liste change (filtre, recherche, rechargement)
watch(filteredAlerts, () => {
  currentPage.value = 1;
});

// Export : on exporte la liste filtrée (toutes les pages, pas seulement la page courante)
const exportHeaders = ['Code', 'Produit', 'Stock', 'Qté', 'Niveau'];

const getExportRows = () =>
  filteredAlerts.value.map((a) => [
    a.product_code || '',
    a.product_name || '',
    a.warehouse_name || '',
    Number(a.quantity) || 0,
    levelLabels[a.alert_level] || a.alert_level || '',
  ]);

const escapeXml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getTimestamp = () => new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportToExcel = () => {
  const rows = getExportRows();
  if (rows.length === 0) return;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles><Style ss:ID="Bold"><Font ss:Bold="1"/></Style></Styles>\n';
  xml += '<Worksheet ss:Name="Stock bas"><Table>\n';

  xml += '<Row ss:StyleID="Bold">';
  exportHeaders.forEach((h) => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
  });
  xml += '</Row>\n';

  rows.forEach((row) => {
    xml += '<Row>';
    row.forEach((cell) => {
      const type = typeof cell === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
    });
    xml += '</Row>\n';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `alertes_stock_bas_${getTimestamp()}.xls`);
};

// PDF : ouvre une fenêtre d'impression propre (choisir « Enregistrer en PDF »)
const exportToPdf = () => {
  const rows = getExportRows();
  if (rows.length === 0) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Alertes Stock Bas</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h2 { font-size: 16px; margin-bottom: 5px; }
        .header p { font-size: 11px; color: #666; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
        th { background-color: #e9ecef; font-weight: bold; font-size: 10px; }
        td { font-size: 10px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .text-right { text-align: right; }
        @media print {
          body { padding: 0; }
          .summary, th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Alertes Stock Bas</h2>
        <p>Seuil : ${escapeXml(threshold.value)} — ${new Date().toLocaleString('fr-FR')}</p>
      </div>
      <div class="summary">
        <span><strong>Total :</strong> ${formatNumber(rows.length)}</span>
        <span><strong>Critique :</strong> ${formatNumber(rows.filter((r) => r[4] === levelLabels.critical).length)}</span>
        <span><strong>Urgent :</strong> ${formatNumber(rows.filter((r) => r[4] === levelLabels.danger).length)}</span>
        <span><strong>Attention :</strong> ${formatNumber(rows.filter((r) => r[4] === levelLabels.warning).length)}</span>
      </div>
      <table>
        <thead>
          <tr>${exportHeaders.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeXml(row[0])}</td>
              <td>${escapeXml(row[1])}</td>
              <td>${escapeXml(row[2])}</td>
              <td class="text-right">${formatNumber(row[3])}</td>
              <td>${escapeXml(row[4])}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

onMounted(fetchData);
</script>

<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-1">Alertes Stock Bas</h1>
        <p class="text-muted mb-0">Produits dont la quantité est sous le seuil</p>
      </div>
      <div class="d-flex gap-2">
        <div class="dropdown">
          <button
            class="btn btn-outline-success btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            :disabled="loading || filteredAlerts.length === 0"
          >
            <i class="bi bi-download me-1"></i> Exporter
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="#" @click.prevent="exportToPdf"><i class="bi bi-file-pdf me-2"></i>PDF</a></li>
            <li><a class="dropdown-item" href="#" @click.prevent="exportToExcel"><i class="bi bi-file-earmark-excel me-2"></i>Excel</a></li>
          </ul>
        </div>
        <router-link to="/dashboard" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-left"></i> Tableau de bord
        </router-link>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="row g-3 mb-3">
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Total alertes</div>
          <div class="fs-4 fw-bold">{{ summary.total_alerts || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Critique</div>
          <div class="fs-4 fw-bold text-danger">{{ summary.critical || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Urgent</div>
          <div class="fs-4 fw-bold text-warning">{{ summary.danger || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="text-muted small">Attention</div>
          <div class="fs-4 fw-bold text-info">{{ summary.warning || 0 }}</div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-12 col-md-5">
            <input v-model="search" type="text" class="form-control" placeholder="Rechercher produit, code ou stock..." />
          </div>
          <div class="col-6 col-md-3">
            <select v-model="levelFilter" class="form-select">
              <option value="">Tous les niveaux</option>
              <option value="critical">Critique</option>
              <option value="danger">Urgent</option>
              <option value="warning">Attention</option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <div class="input-group">
              <span class="input-group-text">Seuil</span>
              <input v-model.number="threshold" type="number" min="0" class="form-control" />
            </div>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary w-100" @click="fetchData" :disabled="loading">Actualiser</button>
          </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Code</th>
                <th>Produit</th>
                <th>Stock</th>
                <th class="text-end">Qté</th>
                <th>Niveau</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredAlerts.length === 0">
                <td colspan="6" class="text-center py-3 text-success">Aucune alerte</td>
              </tr>
              <tr v-for="alert in paginatedItems" :key="alert.id">
                <td><code>{{ alert.product_code }}</code></td>
                <td class="fw-medium">{{ alert.product_name }}</td>
                <td>{{ alert.warehouse_name }}</td>
                <td class="text-end fw-bold">{{ formatNumber(alert.quantity) }}</td>
                <td>
                  <span :class="['badge', levelClasses[alert.alert_level] || 'bg-secondary']">
                    {{ levelLabels[alert.alert_level] || alert.alert_level }}
                  </span>
                </td>
                <td class="text-center">
                  <router-link :to="`/stock/${alert.warehouse_id}`" class="btn btn-sm btn-outline-primary">
                    Voir le stock
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ListPagination v-if="!loading" v-model="currentPage" :total="filteredAlerts.length" :per-page="perPage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { border-radius: 12px; }
</style>
