<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import api from '@/services/api';
import {
  Printer, FileText, Package, ArrowDownCircle, ArrowUpCircle,
  CreditCard, FileCheck, History, Download, Eye, FileSpreadsheet, Wallet
} from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

const toast = useToast();

// Active tab
const activeTab = ref('invoices-history');

// Loading states
const isLoading = ref(false);

// Date filters
const filters = ref({
  date_from: new Date().toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
  warehouse_id: 'all',
  invoice_type: 'all',
  movement_type: 'all',
  hotel_section: 'all',
});

// Data
const reportData = ref(null);
const warehouses = ref([]);
const selectedInvoices = ref([]);
const reportPage = ref(1);
const reportPerPage = 50;

// Tabs configuration
const tabs = [
  { id: 'invoices-history', label: 'Historique Factures', icon: History },
  { id: 'cash-balance', label: 'Balance Caisse', icon: Wallet },
  { id: 'stock-sheet', label: 'Fiche de Stock', icon: FileText },
  { id: 'stock-movements', label: 'Mouvements Stock', icon: ArrowUpCircle },
  { id: 'stock-entries', label: 'Entrées Stock', icon: ArrowDownCircle },
  { id: 'credit-invoices', label: 'Factures à Crédit', icon: CreditCard },
  { id: 'proformas', label: 'Proformas', icon: FileCheck },
];

const invoiceTypes = [
  { value: 'all', label: 'Tous les types' },
  { value: 'FN', label: 'Facture Normale' },
  { value: 'FA', label: 'Facture Avoir' },
  { value: 'FC', label: 'Facture à Crédit' },
  { value: 'FP', label: 'Proforma' },
  { value: 'RC', label: 'Reçu de Caisse' },
];

const movementTypes = [
  { value: 'all', label: 'Tous' },
  { value: 'entry', label: 'Entrées' },
  { value: 'exit', label: 'Sorties' },
];

const hotelSections = [
  { value: 'all', label: 'Toutes les caisses' },
  { value: 'general', label: 'Caisse Générale' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'rooms', label: 'Chambres' },
  { value: 'conference', label: 'Salles Conf.' },
  { value: 'reception', label: 'Salle Réception' },
];

// Formatters
const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);
const formatCurrency = (num) => `${formatNumber(num)} FBU`;
// Fetch warehouses
const fetchWarehouses = async () => {
  try {
    const response = await api.get('/warehouses');
    if (response.data.success) {
      warehouses.value = response.data.data.data || response.data.data || [];
    }
  } catch (e) {
    console.error('Error fetching warehouses:', e);
  }
};

// Fetch report based on active tab
const fetchReport = async () => {
  isLoading.value = true;
  reportData.value = null;
  selectedInvoices.value = [];

  const endpoints = {
    'invoices-history': '/reports/invoices-history',
    'stock-sheet': '/reports/stock-sheet',
    'stock-movements': '/reports/stock-movements',
    'stock-entries': '/reports/stock-entries',
    'credit-invoices': '/reports/credit-invoices',
    'proformas': '/reports/proformas',
    'cash-balance': '/reports/cash-balance',
  };

  try {
    const paginatedTabs = ['invoices-history', 'stock-sheet', 'stock-movements', 'stock-entries', 'credit-invoices', 'proformas'];
    const params = { ...filters.value };
    if (paginatedTabs.includes(activeTab.value)) {
      params.page = reportPage.value;
      params.per_page = reportPerPage;
    }
    const response = await api.get(endpoints[activeTab.value], { params });
    if (response.data.success) {
      reportData.value = response.data.data;
    }
  } catch (e) {
    console.error('Error fetching report:', e);
  } finally {
    isLoading.value = false;
  }
};

// Toggle invoice selection
const toggleInvoiceSelection = (id) => {
  const index = selectedInvoices.value.indexOf(id);
  if (index > -1) {
    selectedInvoices.value.splice(index, 1);
  } else {
    selectedInvoices.value.push(id);
  }
};

// Select all invoices
const selectAllInvoices = () => {
  const rows = getRows('invoices');
  if (!rows.length) return;
  if (selectedInvoices.value.length === rows.length) {
    selectedInvoices.value = [];
  } else {
    selectedInvoices.value = rows.map(inv => inv.id);
  }
};

const getRows = (key) => {
  const payload = reportData.value?.[key];
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.data || [];
};

const getPagination = (key) => {
  const payload = reportData.value?.[key];
  if (!payload || Array.isArray(payload)) return null;
  return {
    current_page: payload.current_page || 1,
    last_page: payload.last_page || 1,
    total: payload.total || 0,
    from: payload.from || 0,
    to: payload.to || 0,
  };
};

const reportPagination = computed(() => {
  if (activeTab.value === 'invoices-history') return getPagination('invoices');
  if (activeTab.value === 'stock-sheet') return getPagination('items');
  if (activeTab.value === 'stock-movements' || activeTab.value === 'stock-entries') return getPagination('movements');
  if (activeTab.value === 'credit-invoices') return getPagination('invoices');
  if (activeTab.value === 'proformas') return getPagination('proformas');
  return null;
});

const changeReportPage = (page) => {
  if (!reportPagination.value) return;
  if (page < 1 || page > reportPagination.value.last_page) return;
  reportPage.value = page;
  fetchReport();
};

// Print selected invoices
const printSelectedInvoices = async () => {
  if (selectedInvoices.value.length === 0) {
    toast.warning('Veuillez sélectionner au moins une facture');
    return;
  }

  try {
    const response = await api.get('/reports/invoices-print', {
      params: { ids: selectedInvoices.value }
    });

    if (response.data.success) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(generateInvoicePrintHTML(response.data.data));
      printWindow.document.close();
      printWindow.print();
    }
  } catch (e) {
    console.error('Error printing invoices:', e);
  }
};

// Generate print HTML for multiple invoices
const generateInvoicePrintHTML = (invoices) => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Impression Factures</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .invoice { page-break-after: always; padding: 20px; }
        .invoice:last-child { page-break-after: auto; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { text-align: right; margin-top: 20px; }
        .totals p { margin: 5px 0; }
      </style>
    </head>
    <body>
  `;

  invoices.forEach(invoice => {
    html += `
      <div class="invoice">
        <div class="header">
          <h2>${invoice.company?.name || 'Entreprise'}</h2>
          <p>NIF: ${invoice.company?.tin || ''}</p>
          <h3>FACTURE N° ${invoice.invoice_number}</h3>
          <p>Date: ${invoice.invoice_date}</p>
        </div>
        <div>
          <strong>Client:</strong> ${invoice.customer?.name || 'Client'}<br>
          NIF: ${invoice.customer?.tin || 'N/A'}
        </div>
        <table>
          <thead>
            <tr><th>Désignation</th><th>Qté</th><th>P.U.</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.designation}</td>
                <td>${item.quantity}</td>
                <td>${formatNumber(item.unit_price)}</td>
                <td>${formatNumber(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Total HTVA:</strong> ${formatCurrency(invoice.amount_htva)}</p>
          <p><strong>TVA:</strong> ${formatCurrency(invoice.tva)}</p>
          <p><strong>Total TVAC:</strong> ${formatCurrency(invoice.amount_tvac)}</p>
        </div>
      </div>
    `;
  });

  html += '</body></html>';
  return html;
};

// ==================== EXPORT FUNCTIONS ====================

// Get current report data for export
const getExportData = () => {
  if (!reportData.value) return { headers: [], rows: [], filename: 'rapport' };

  const tabConfig = {
    'invoices-history': {
      filename: 'historique_factures',
      headers: ['#', 'Date', 'N° Facture', 'Client', 'HTVA', 'TVA', 'TVAC', 'Type', 'Utilisateur'],
      getData: () => getRows('invoices').map((inv, i) => [
        i + 1, inv.date, inv.invoice_number, inv.customer_name,
        inv.amount_htva, inv.tva, inv.amount_tvac, inv.invoice_type_label, inv.user_name
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Période', `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`],
        ['Total Factures', reportData.value.summary.total_invoices],
        ['Total HTVA', reportData.value.summary.total_htva],
        ['Total TVA', reportData.value.summary.total_tva],
        ['Total TVAC', reportData.value.summary.total_amount_tvac],
      ]
    },
    'stock-sheet': {
      filename: 'fiche_stock',
      headers: ['#', 'Code', 'Produit', 'Stock', 'Quantité', 'Prix Unitaire', 'Valeur Totale'],
      getData: () => getRows('items').map((item, i) => [
        i + 1, item.product_code, item.product_name, item.warehouse_name,
        item.quantity, item.unit_price, item.total_value
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Total Produits', reportData.value.summary.total_items],
        ['Quantité Totale', reportData.value.summary.total_quantity],
        ['Valeur Totale', reportData.value.summary.total_value],
      ]
    },
    'stock-movements': {
      filename: 'mouvements_stock',
      headers: ['#', 'Date', 'Produit', 'Stock', 'Type', 'Quantité', 'Prix Unit.', 'Total', 'Utilisateur'],
      getData: () => getRows('movements').map((mov, i) => [
        i + 1, mov.date, mov.product_name, mov.warehouse_name,
        mov.movement_type_label, mov.quantity, mov.unit_price, mov.total, mov.user_name
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Période', `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`],
        ['Total Mouvements', reportData.value.summary.total_movements],
        ['Entrées', reportData.value.summary.total_entries, 'Valeur', reportData.value.summary.total_entries_value],
        ['Sorties', reportData.value.summary.total_exits, 'Valeur', reportData.value.summary.total_exits_value],
      ]
    },
    'stock-entries': {
      filename: 'entrees_stock',
      headers: ['#', 'Date', 'Produit', 'Stock', 'Type', 'Quantité', 'Prix Unit.', 'Total', 'Utilisateur'],
      getData: () => getRows('movements').map((mov, i) => [
        i + 1, mov.date, mov.product_name, mov.warehouse_name,
        mov.movement_type_label, mov.quantity, mov.unit_price, mov.total, mov.user_name
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Période', `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`],
        ['Total Entrées', reportData.value.summary.total_entries],
        ['Valeur Totale', reportData.value.summary.total_entries_value],
      ]
    },
    'credit-invoices': {
      filename: 'factures_credit',
      headers: ['#', 'Date', 'N° Facture', 'Client', 'HTVA', 'TVA', 'TVAC', 'Statut', 'Utilisateur'],
      getData: () => getRows('invoices').map((inv, i) => [
        i + 1, inv.date, inv.invoice_number, inv.customer_name,
        inv.amount_htva, inv.tva, inv.amount_tvac,
        inv.status === 'success' ? 'Validé' : 'En attente', inv.user_name
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Période', `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`],
        ['Total Factures', reportData.value.summary.total_invoices],
        ['Montant Total', reportData.value.summary.total_amount],
      ]
    },
    'proformas': {
      filename: 'proformas',
      headers: ['#', 'Date', 'N° Proforma', 'Client', 'Articles', 'HTVA', 'TVA', 'TVAC', 'Utilisateur'],
      getData: () => getRows('proformas').map((p, i) => [
        i + 1, p.date, p.invoice_number, p.customer_name,
        p.items_count, p.amount_htva, p.tva, p.amount_tvac, p.user_name
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Période', `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`],
        ['Total Proformas', reportData.value.summary.total_proformas],
        ['Montant Total', reportData.value.summary.total_amount],
      ]
    },
    'cash-balance': {
      filename: 'balance_caisse',
      headers: ['#', 'Date', 'Solde Reportée', 'Entrées', 'Dépenses', 'Pertes', 'Total Sorties', 'Solde Actuel'],
      getData: () => reportData.value.rows.map((r, i) => [
        i + 1, r.date, r.carried_balance, r.income,
        r.expenses, r.losses, r.total_out, r.current_balance
      ]),
      getSummary: () => [
        [],
        ['RÉSUMÉ'],
        ['Période', `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`],
        ['Solde Initiale', reportData.value.summary.initial_balance],
        ['Total Entrées', reportData.value.summary.total_income],
        ['Total Dépenses', reportData.value.summary.total_expenses],
        ['Total Pertes', reportData.value.summary.total_losses],
        ['Solde Finale', reportData.value.summary.final_balance],
      ]
    },
  };

  const config = tabConfig[activeTab.value];
  if (!config) return { headers: [], rows: [], filename: 'rapport' };

  return {
    headers: config.headers,
    rows: [...config.getData(), ...config.getSummary()],
    filename: config.filename,
  };
};

// Export to CSV
const exportToCSV = () => {
  const { headers, rows, filename } = getExportData();
  if (rows.length === 0) return;

  // BOM for UTF-8
  let csvContent = '\uFEFF';

  // Add headers
  csvContent += headers.join(';') + '\n';

  // Add rows
  rows.forEach(row => {
    if (Array.isArray(row)) {
      csvContent += row.map(cell => {
        const cellStr = String(cell ?? '');
        // Escape quotes and wrap in quotes if contains separator
        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(';') + '\n';
    }
  });

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}_${getTimestamp()}.csv`);
};

// Export to Excel (XML format)
const exportToExcel = () => {
  const { headers, rows, filename } = getExportData();
  if (rows.length === 0) return;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles><Style ss:ID="Bold"><Font ss:Bold="1"/></Style></Styles>\n';
  xml += '<Worksheet ss:Name="Rapport"><Table>\n';

  // Headers
  xml += '<Row ss:StyleID="Bold">';
  headers.forEach(h => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
  });
  xml += '</Row>\n';

  // Data rows
  rows.forEach(row => {
    if (Array.isArray(row) && row.length > 0) {
      xml += '<Row>';
      row.forEach(cell => {
        const type = typeof cell === 'number' ? 'Number' : 'String';
        xml += `<Cell><Data ss:Type="${type}">${escapeXml(String(cell ?? ''))}</Data></Cell>`;
      });
      xml += '</Row>\n';
    }
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${filename}_${getTimestamp()}.xls`);
};

// Helper: Escape XML special characters
const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Helper: Download blob
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

// Helper: Get timestamp for filename
const getTimestamp = () => {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
};

// Print current report - opens clean print window
const printReport = () => {
  const { headers, rows, filename } = getExportData();
  if (rows.length === 0) return;

  const tabLabel = tabs.find(t => t.id === activeTab.value)?.label || 'Rapport';
  const period = reportData.value?.summary?.date_from
    ? `${reportData.value.summary.date_from} - ${reportData.value.summary.date_to}`
    : new Date().toLocaleDateString('fr-FR');

  // Build summary info based on tab
  let summaryHTML = '';
  if (reportData.value?.summary) {
    const s = reportData.value.summary;
    if (activeTab.value === 'invoices-history') {
      summaryHTML = `
        <div class="summary">
          <span><strong>Total Factures:</strong> ${formatNumber(s.total_invoices)}</span>
          <span><strong>TVAC:</strong> ${formatCurrency(s.total_amount_tvac)}</span>
          <span><strong>TVA:</strong> ${formatCurrency(s.total_tva)}</span>
          <span><strong>HTVA:</strong> ${formatCurrency(s.total_htva)}</span>
        </div>
      `;
    } else if (activeTab.value === 'stock-sheet') {
      summaryHTML = `
        <div class="summary">
          <span><strong>Total Produits:</strong> ${formatNumber(s.total_items)}</span>
          <span><strong>Quantité:</strong> ${formatNumber(s.total_quantity)}</span>
          <span><strong>Valeur:</strong> ${formatCurrency(s.total_value)}</span>
        </div>
      `;
    } else if (activeTab.value === 'stock-movements' || activeTab.value === 'stock-entries') {
      summaryHTML = `
        <div class="summary">
          <span><strong>Mouvements:</strong> ${formatNumber(s.total_movements)}</span>
          <span><strong>Entrées:</strong> ${formatCurrency(s.total_entries_value)}</span>
          <span><strong>Sorties:</strong> ${formatCurrency(s.total_exits_value)}</span>
        </div>
      `;
    } else if (activeTab.value === 'credit-invoices') {
      summaryHTML = `
        <div class="summary">
          <span><strong>Factures:</strong> ${formatNumber(s.total_invoices)}</span>
          <span><strong>Montant:</strong> ${formatCurrency(s.total_amount)}</span>
        </div>
      `;
    } else if (activeTab.value === 'proformas') {
      summaryHTML = `
        <div class="summary">
          <span><strong>Proformas:</strong> ${formatNumber(s.total_proformas)}</span>
          <span><strong>Montant:</strong> ${formatCurrency(s.total_amount)}</span>
        </div>
      `;
    } else if (activeTab.value === 'cash-balance') {
      summaryHTML = `
        <div class="summary">
          <span><strong>Solde Initiale:</strong> ${formatCurrency(s.initial_balance)}</span>
          <span><strong>Entrées:</strong> ${formatCurrency(s.total_income)}</span>
          <span><strong>Dépenses:</strong> ${formatCurrency(s.total_expenses)}</span>
          <span><strong>Pertes:</strong> ${formatCurrency(s.total_losses)}</span>
          <span><strong>Solde Finale:</strong> ${formatCurrency(s.final_balance)}</span>
        </div>
      `;
    }
  }

  // Filter out summary rows (empty arrays and summary text)
  const dataRows = rows.filter(row => Array.isArray(row) && row.length > 0 && typeof row[0] === 'number');

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${tabLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h2 { font-size: 16px; margin-bottom: 5px; }
        .header p { font-size: 11px; color: #666; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
        .summary span { font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
        th { background-color: #e9ecef; font-weight: bold; font-size: 10px; }
        td { font-size: 10px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .text-right { text-align: right; }
        .fw-bold { font-weight: bold; }
        @media print {
          body { padding: 0; }
          .summary { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${tabLabel}</h2>
        <p>Période: ${period}</p>
      </div>
      ${summaryHTML}
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataRows.map(row => `
            <tr>
              ${row.map((cell, i) => {
                const isNumber = typeof cell === 'number';
                return `<td class="${isNumber ? 'text-right' : ''}">${cell ?? ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

// Cash balance pagination
const cashBalancePage = ref(1);
const cashBalancePerPage = 20;

const cashBalancePaginatedRows = computed(() => {
  if (!reportData.value?.rows) return [];
  const start = (cashBalancePage.value - 1) * cashBalancePerPage;
  return reportData.value.rows.slice(start, start + cashBalancePerPage);
});

const cashBalanceTotalPages = computed(() => {
  if (!reportData.value?.rows) return 1;
  return Math.ceil(reportData.value.rows.length / cashBalancePerPage) || 1;
});

const cashBalanceVisiblePages = computed(() => {
  const current = cashBalancePage.value;
  const last = cashBalanceTotalPages.value;
  const pages = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(last, current + 2); i++) {
    pages.push(i);
  }
  return pages;
});

const cashBalanceGoTo = (page) => {
  if (page >= 1 && page <= cashBalanceTotalPages.value) {
    cashBalancePage.value = page;
  }
};

// Watch tab changes
watch(activeTab, () => {
  reportPage.value = 1;
  cashBalancePage.value = 1;
  fetchReport();
});

// Watch filter changes
watch(filters, () => {
  reportPage.value = 1;
  fetchReport();
}, { deep: true });

onMounted(() => {
  fetchWarehouses();
  fetchReport();
});
</script>

<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <h1 class="h3 mb-0 fw-bold">Rapports & Historique</h1>

      <!-- Export Buttons -->
      <div class="btn-group no-print">
        <button class="btn btn-success" @click="exportToExcel" :disabled="!reportData">
          <FileSpreadsheet :size="18" class="me-1" /> Excel
        </button>
        <button class="btn btn-info text-white" @click="exportToCSV" :disabled="!reportData">
          <Download :size="18" class="me-1" /> CSV
        </button>
        <button class="btn btn-primary" @click="printReport">
          <Printer :size="18" class="me-1" /> Imprimer
        </button>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <ul class="nav nav-tabs mb-4 no-print flex-nowrap overflow-auto">
      <li class="nav-item" v-for="tab in tabs" :key="tab.id">
        <button
          class="nav-link d-flex align-items-center gap-2 text-nowrap"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <!-- Filters -->
    <div class="card mb-4 no-print">
      <div class="card-body py-3">
        <div class="row g-3 align-items-end">
          <!-- Date filters for most tabs -->
          <template v-if="activeTab !== 'stock-sheet'">
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted">Du</label>
              <input type="date" v-model="filters.date_from" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted">Au</label>
              <input type="date" v-model="filters.date_to" class="form-control form-control-sm">
            </div>
          </template>

          <!-- Warehouse filter for stock tabs -->
          <div class="col-6 col-md-2" v-if="['stock-sheet', 'stock-movements', 'stock-entries'].includes(activeTab)">
            <label class="form-label small text-muted">Stock</label>
            <select v-model="filters.warehouse_id" class="form-select form-select-sm">
              <option value="all">Tous les stocks</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>

          <!-- Invoice type filter -->
          <div class="col-6 col-md-2" v-if="activeTab === 'invoices-history'">
            <label class="form-label small text-muted">Type de Facture</label>
            <select v-model="filters.invoice_type" class="form-select form-select-sm">
              <option v-for="type in invoiceTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Movement type filter -->
          <div class="col-6 col-md-2" v-if="activeTab === 'stock-movements'">
            <label class="form-label small text-muted">Type</label>
            <select v-model="filters.movement_type" class="form-select form-select-sm">
              <option v-for="type in movementTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Hotel section filter for cash balance -->
          <div class="col-6 col-md-2" v-if="activeTab === 'cash-balance'">
            <label class="form-label small text-muted">Section</label>
            <select v-model="filters.hotel_section" class="form-select form-select-sm">
              <option v-for="s in hotelSections" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>

          <!-- Print multiple button for invoice history -->
          <div class="col-auto ms-auto" v-if="activeTab === 'invoices-history' && reportData?.invoices?.length">
            <button
              class="btn btn-outline-primary btn-sm"
              @click="printSelectedInvoices"
              :disabled="selectedInvoices.length === 0"
            >
              <Printer :size="16" class="me-1" />
              Imprimer ({{ selectedInvoices.length }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Chargement...</p>
    </div>

    <!-- Report Content -->
    <div v-else-if="reportData">
      <!-- Print Header -->
      <div class="d-none d-print-block mb-4 text-center">
        <h3>{{ tabs.find(t => t.id === activeTab)?.label }}</h3>
        <p v-if="reportData.summary?.date_from">
          Période: {{ reportData.summary.date_from }} - {{ reportData.summary.date_to }}
        </p>
      </div>

      <!-- ===== INVOICES HISTORY ===== -->
      <template v-if="activeTab === 'invoices-history'">
        <!-- Summary Cards -->
        <div class="row g-3 mb-4 summary-cards no-print">
          <div class="col-6 col-lg-3">
            <div class="card bg-primary text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Nombre Total de Factures</div>
                <div class="h4 mb-0">{{ formatNumber(reportData.summary.total_invoices) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card bg-success text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Montant Total TVAC</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_amount_tvac) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card bg-info text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Total TVA</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_tva) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card bg-warning text-dark">
              <div class="card-body py-3">
                <div class="small opacity-75">Total HTVA</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_htva) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices Table -->
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 table-sm">
                <thead class="table-light">
                  <tr>
                    <th class="no-print" style="width:40px">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        @change="selectAllInvoices"
                        :checked="selectedInvoices.length === getRows('invoices').length && getRows('invoices').length > 0"
                      >
                    </th>
                    <th>#</th>
                    <th>Date</th>
                    <th>N° Facture</th>
                    <th>Client</th>
                    <th>HTVA</th>
                    <th>TVA</th>
                    <th>TVAC</th>
                    <th>Type</th>
                    <th class="no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="getRows('invoices').length === 0">
                    <td colspan="10" class="text-center py-4 text-muted">Aucune facture trouvée</td>
                  </tr>
                  <tr v-for="(invoice, index) in getRows('invoices')" :key="invoice.id">
                    <td class="no-print">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="selectedInvoices.includes(invoice.id)"
                        @change="toggleInvoiceSelection(invoice.id)"
                      >
                    </td>
                    <td>{{ index + 1 }}</td>
                    <td>{{ invoice.date }}</td>
                    <td class="fw-medium text-primary">{{ invoice.invoice_number }}</td>
                    <td>{{ invoice.customer_name }}</td>
                    <td>{{ formatCurrency(invoice.amount_htva) }}</td>
                    <td>{{ formatCurrency(invoice.tva) }}</td>
                    <td class="fw-bold">{{ formatCurrency(invoice.amount_tvac) }}</td>
                    <td>
                      <span class="badge bg-secondary">{{ invoice.invoice_type_label }}</span>
                    </td>
                    <td class="no-print">
                      <button class="btn btn-sm btn-outline-primary py-0 px-1" @click="toggleInvoiceSelection(invoice.id)">
                        <Eye :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== STOCK SHEET ===== -->
      <template v-if="activeTab === 'stock-sheet'">
        <!-- Summary -->
        <div class="row g-3 mb-4 summary-cards no-print">
          <div class="col-md-4">
            <div class="card bg-primary text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Total Produits</div>
                <div class="h4 mb-0">{{ formatNumber(reportData.summary.total_items) }}</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-success text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Quantité Totale</div>
                <div class="h4 mb-0">{{ formatNumber(reportData.summary.total_quantity) }}</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-info text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Valeur Totale</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_value) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stock Table -->
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 table-sm">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Produit</th>
                    <th>Stock</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>Valeur Totale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="getRows('items').length === 0">
                    <td colspan="7" class="text-center py-4 text-muted">Aucun produit en stock</td>
                  </tr>
                  <tr v-for="(item, index) in getRows('items')" :key="item.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ item.product_code }}</td>
                    <td class="fw-medium">{{ item.product_name }}</td>
                    <td>{{ item.warehouse_name }}</td>
                    <td>{{ formatNumber(item.quantity) }}</td>
                    <td>{{ formatCurrency(item.unit_price) }}</td>
                    <td class="fw-bold">{{ formatCurrency(item.total_value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== STOCK MOVEMENTS ===== -->
      <template v-if="activeTab === 'stock-movements' || activeTab === 'stock-entries'">
        <!-- Summary -->
        <div class="row g-3 mb-4 summary-cards no-print">
          <div class="col-6 col-lg-3">
            <div class="card bg-primary text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Total Mouvements</div>
                <div class="h4 mb-0">{{ formatNumber(reportData.summary.total_movements) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card bg-success text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Entrées ({{ reportData.summary.total_entries }})</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_entries_value) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card bg-danger text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Sorties ({{ reportData.summary.total_exits }})</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_exits_value) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card bg-info text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Solde Net</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_entries_value - reportData.summary.total_exits_value) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Movements Table -->
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 table-sm">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Produit</th>
                    <th>Stock</th>
                    <th>Type</th>
                    <th>Quantité</th>
                    <th>Prix Unit.</th>
                    <th>Total</th>
                    <th>Utilisateur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="getRows('movements').length === 0">
                    <td colspan="9" class="text-center py-4 text-muted">Aucun mouvement trouvé</td>
                  </tr>
                  <tr v-for="(mov, index) in getRows('movements')" :key="mov.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ mov.date }}</td>
                    <td class="fw-medium">{{ mov.product_name }}</td>
                    <td>{{ mov.warehouse_name }}</td>
                    <td>
                      <span :class="['badge', mov.is_entry ? 'bg-success' : 'bg-danger']">
                        {{ mov.movement_type_label }}
                      </span>
                    </td>
                    <td>{{ formatNumber(mov.quantity) }}</td>
                    <td>{{ formatCurrency(mov.unit_price) }}</td>
                    <td class="fw-bold">{{ formatCurrency(mov.total) }}</td>
                    <td>{{ mov.user_name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== CREDIT INVOICES ===== -->
      <template v-if="activeTab === 'credit-invoices'">
        <!-- Summary -->
        <div class="row g-3 mb-4 summary-cards no-print">
          <div class="col-md-6">
            <div class="card bg-warning text-dark">
              <div class="card-body py-3">
                <div class="small opacity-75">Nombre de Factures à Crédit</div>
                <div class="h4 mb-0">{{ formatNumber(reportData.summary.total_invoices) }}</div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-danger text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Montant Total à Crédit</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_amount) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Credit Invoices Table -->
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 table-sm">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>N° Facture</th>
                    <th>Client</th>
                    <th>HTVA</th>
                    <th>TVA</th>
                    <th>TVAC</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="getRows('invoices').length === 0">
                    <td colspan="8" class="text-center py-4 text-muted">Aucune facture à crédit</td>
                  </tr>
                  <tr v-for="(invoice, index) in getRows('invoices')" :key="invoice.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ invoice.date }}</td>
                    <td class="fw-medium text-primary">{{ invoice.invoice_number }}</td>
                    <td>{{ invoice.customer_name }}</td>
                    <td>{{ formatCurrency(invoice.amount_htva) }}</td>
                    <td>{{ formatCurrency(invoice.tva) }}</td>
                    <td class="fw-bold">{{ formatCurrency(invoice.amount_tvac) }}</td>
                    <td>
                      <span :class="['badge', invoice.status === 'success' ? 'bg-success' : 'bg-warning']">
                        {{ invoice.status === 'success' ? 'Validé' : 'En attente' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== PROFORMAS ===== -->
      <template v-if="activeTab === 'proformas'">
        <!-- Summary -->
        <div class="row g-3 mb-4 summary-cards no-print">
          <div class="col-md-6">
            <div class="card bg-info text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Nombre de Proformas</div>
                <div class="h4 mb-0">{{ formatNumber(reportData.summary.total_proformas) }}</div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-primary text-white">
              <div class="card-body py-3">
                <div class="small opacity-75">Montant Total</div>
                <div class="h4 mb-0">{{ formatCurrency(reportData.summary.total_amount) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Proformas Table -->
        <div class="card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 table-sm">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>N° Proforma</th>
                    <th>Client</th>
                    <th>Articles</th>
                    <th>HTVA</th>
                    <th>TVA</th>
                    <th>TVAC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="getRows('proformas').length === 0">
                    <td colspan="8" class="text-center py-4 text-muted">Aucun proforma</td>
                  </tr>
                  <tr v-for="(proforma, index) in getRows('proformas')" :key="proforma.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ proforma.date }}</td>
                    <td class="fw-medium text-primary">{{ proforma.invoice_number }}</td>
                    <td>{{ proforma.customer_name }}</td>
                    <td>{{ proforma.items_count }}</td>
                    <td>{{ formatCurrency(proforma.amount_htva) }}</td>
                    <td>{{ formatCurrency(proforma.tva) }}</td>
                    <td class="fw-bold">{{ formatCurrency(proforma.amount_tvac) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <!-- CASH BALANCE TAB -->
      <template v-if="activeTab === 'cash-balance'">
        <!-- Summary cards -->
        <div class="row g-3 mb-4" v-if="reportData.summary">
          <div class="col-6 col-md">
            <div class="card border-0 shadow-sm h-100" style="background: #f0f9ff">
              <div class="card-body text-center py-3">
                <div class="small text-muted">Solde Initiale</div>
                <div class="fw-bold fs-5" :class="reportData.summary.initial_balance >= 0 ? 'text-primary' : 'text-danger'">
                  {{ formatCurrency(reportData.summary.initial_balance) }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border-0 shadow-sm h-100" style="background: #d1fae5">
              <div class="card-body text-center py-3">
                <div class="small text-muted">Total Entrées</div>
                <div class="fw-bold fs-5 text-success">+ {{ formatCurrency(reportData.summary.total_income) }}</div>
                <div v-if="(reportData.summary.total_pos_income || 0) > 0" class="small mt-1" style="color: #7c3aed">
                  dont {{ formatCurrency(reportData.summary.total_pos_income) }} ventes POS
                </div>
                <div v-if="(reportData.summary.total_hotel_income || 0) > 0" class="small mt-1" style="color: #0369a1">
                  dont {{ formatCurrency(reportData.summary.total_hotel_income) }} chambres
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border-0 shadow-sm h-100" style="background: #fee2e2">
              <div class="card-body text-center py-3">
                <div class="small text-muted">Total Dépenses</div>
                <div class="fw-bold fs-5 text-danger">- {{ formatCurrency(reportData.summary.total_expenses) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border-0 shadow-sm h-100" style="background: #fef3c7">
              <div class="card-body text-center py-3">
                <div class="small text-muted">Total Pertes</div>
                <div class="fw-bold fs-5 text-warning">- {{ formatCurrency(reportData.summary.total_losses) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border-0 shadow-sm h-100" :style="reportData.summary.final_balance >= 0 ? 'background: #d1fae5' : 'background: #fee2e2'">
              <div class="card-body text-center py-3">
                <div class="small text-muted">Solde Finale</div>
                <div class="fw-bold fs-5" :class="reportData.summary.final_balance >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(reportData.summary.final_balance) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Balance table -->
        <div class="card shadow-sm">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <span class="fw-semibold">
              <Wallet :size="18" class="me-2 text-muted" />Balance Journalière de Caisse
            </span>
            <small v-if="reportData.rows.length" class="text-muted">
              {{ reportData.rows.length }} jour(s)
            </small>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th class="text-end">Solde Reportée</th>
                  <th class="text-end">Montant Entrée</th>
                  <th class="text-end">Dépenses</th>
                  <th class="text-end">Pertes</th>
                  <th class="text-end">Total Sorties</th>
                  <th class="text-end">Solde Actuel</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="reportData.rows.length === 0">
                  <td colspan="8" class="text-center py-4 text-muted">Aucune donnée pour cette période</td>
                </tr>
                <tr v-for="(row, index) in cashBalancePaginatedRows" :key="row.date">
                  <td>{{ (cashBalancePage - 1) * cashBalancePerPage + index + 1 }}</td>
                  <td class="fw-medium">{{ row.date }}</td>
                  <td class="text-end" :class="row.carried_balance >= 0 ? 'text-primary' : 'text-danger'">
                    {{ formatCurrency(row.carried_balance) }}
                  </td>
                  <td class="text-end text-success fw-semibold">
                    {{ row.income > 0 ? '+ ' + formatCurrency(row.income) : '—' }}
                    <div v-if="(row.pos_income || 0) > 0" class="small fw-normal" style="color: #7c3aed; font-size: 0.75rem">
                      POS: {{ formatCurrency(row.pos_income) }}
                    </div>
                    <div v-if="(row.hotel_income || 0) > 0" class="small fw-normal" style="color: #0369a1; font-size: 0.75rem">
                      Chambres: {{ formatCurrency(row.hotel_income) }}
                    </div>
                  </td>
                  <td class="text-end text-danger">
                    {{ row.expenses > 0 ? '- ' + formatCurrency(row.expenses) : '—' }}
                  </td>
                  <td class="text-end" style="color: #b45309">
                    {{ row.losses > 0 ? '- ' + formatCurrency(row.losses) : '—' }}
                  </td>
                  <td class="text-end text-danger fw-semibold">
                    {{ row.total_out > 0 ? '- ' + formatCurrency(row.total_out) : '—' }}
                  </td>
                  <td class="text-end fw-bold" :class="row.current_balance >= 0 ? 'text-success' : 'text-danger'">
                    {{ formatCurrency(row.current_balance) }}
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="reportData.rows.length > 0" class="table-dark">
                <tr class="fw-bold">
                  <td colspan="2">TOTAL</td>
                  <td class="text-end">{{ formatCurrency(reportData.summary.initial_balance) }}</td>
                  <td class="text-end text-success">+ {{ formatCurrency(reportData.summary.total_income) }}</td>
                  <td class="text-end text-danger">- {{ formatCurrency(reportData.summary.total_expenses) }}</td>
                  <td class="text-end" style="color: #fbbf24">- {{ formatCurrency(reportData.summary.total_losses) }}</td>
                  <td class="text-end text-danger">- {{ formatCurrency(reportData.summary.total_expenses + reportData.summary.total_losses) }}</td>
                  <td class="text-end" :class="reportData.summary.final_balance >= 0 ? 'text-success' : 'text-danger'">
                    {{ formatCurrency(reportData.summary.final_balance) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="cashBalanceTotalPages > 1" class="card-footer bg-white d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Page {{ cashBalancePage }} / {{ cashBalanceTotalPages }}
              — {{ (cashBalancePage - 1) * cashBalancePerPage + 1 }}-{{ Math.min(cashBalancePage * cashBalancePerPage, reportData.rows.length) }} sur {{ reportData.rows.length }}
            </small>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: cashBalancePage <= 1 }">
                  <button class="page-link" @click="cashBalanceGoTo(1)" :disabled="cashBalancePage <= 1">
                    <i class="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: cashBalancePage <= 1 }">
                  <button class="page-link" @click="cashBalanceGoTo(cashBalancePage - 1)" :disabled="cashBalancePage <= 1">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li v-for="p in cashBalanceVisiblePages" :key="p" class="page-item" :class="{ active: p === cashBalancePage }">
                  <button class="page-link" @click="cashBalanceGoTo(p)">{{ p }}</button>
                </li>
                <li class="page-item" :class="{ disabled: cashBalancePage >= cashBalanceTotalPages }">
                  <button class="page-link" @click="cashBalanceGoTo(cashBalancePage + 1)" :disabled="cashBalancePage >= cashBalanceTotalPages">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: cashBalancePage >= cashBalanceTotalPages }">
                  <button class="page-link" @click="cashBalanceGoTo(cashBalanceTotalPages)" :disabled="cashBalancePage >= cashBalanceTotalPages">
                    <i class="bi bi-chevron-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </template>

      <div
        v-if="reportPagination && reportPagination.last_page > 1"
        class="d-flex justify-content-between align-items-center mt-3 no-print"
      >
        <small class="text-muted">
          Affichage {{ reportPagination.from }} à {{ reportPagination.to }} sur {{ reportPagination.total }}
        </small>
        <div class="btn-group btn-group-sm">
          <button
            class="btn btn-outline-secondary"
            :disabled="reportPagination.current_page <= 1"
            @click="changeReportPage(reportPagination.current_page - 1)"
          >
            Préc.
          </button>
          <button class="btn btn-outline-secondary" disabled>
            {{ reportPagination.current_page }} / {{ reportPagination.last_page }}
          </button>
          <button
            class="btn btn-outline-secondary"
            :disabled="reportPagination.current_page >= reportPagination.last_page"
            @click="changeReportPage(reportPagination.current_page + 1)"
          >
            Suiv.
          </button>
        </div>
      </div>
    </div>

    <!-- No data -->
    <div v-else class="text-center py-5 text-muted">
      <FileText :size="48" class="mb-3 opacity-50" />
      <p>Aucune donnée disponible</p>
    </div>
  </div>
</template>

<style scoped>
.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 2px solid transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: transparent;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dee2e6;
}

.table-sm th,
.table-sm td {
  padding: 0.4rem 0.5rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .nav-tabs {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .nav-tabs::-webkit-scrollbar {
    display: none;
  }
}
</style>

<style>
@media print {
  /* Hide everything except data table */
  .no-print,
  .nav-tabs,
  .btn-group,
  .summary-cards,
  header,
  nav,
  aside,
  .sidebar,
  .navbar,
  .offcanvas,
  .modal,
  .toast,
  footer,
  [class*="sidebar"],
  [class*="header"],
  [class*="nav-"],
  .form-control,
  .form-select,
  .form-label,
  input,
  select,
  button,
  h1.h3,
  .mb-4 > .d-flex {
    display: none !important;
  }

  /* Hide summary cards row */
  .row.g-3.mb-4:not(:has(table)) {
    display: none !important;
  }

  /* Reset page margins */
  @page {
    margin: 8mm;
    size: A4;
  }

  /* Reset body */
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  /* Make container full width */
  .container-fluid,
  .container {
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Show print header */
  .d-print-block {
    display: block !important;
    margin-bottom: 10px !important;
  }

  .d-print-block h3 {
    font-size: 16px !important;
    margin: 0 0 5px 0 !important;
  }

  .d-print-block p {
    font-size: 11px !important;
    margin: 0 !important;
  }

  /* Data card styling */
  .card:has(table) {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
  }

  .card-body {
    padding: 0 !important;
  }

  /* Hide cards without tables (summary cards) */
  .card:not(:has(table)) {
    display: none !important;
  }

  /* Table styling */
  .table {
    font-size: 10px !important;
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .table th,
  .table td {
    padding: 5px 8px !important;
    border: 1px solid #333 !important;
  }

  .table thead th {
    background-color: #e9ecef !important;
    font-weight: bold !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Badge styling */
  .badge {
    border: 1px solid #333 !important;
    padding: 2px 6px !important;
    font-size: 9px !important;
    background: transparent !important;
    color: #000 !important;
  }

  /* Hide checkbox columns */
  .table th.no-print,
  .table td.no-print {
    display: none !important;
  }

  /* Row with table */
  .row:has(table) {
    margin: 0 !important;
  }

  .table-responsive {
    overflow: visible !important;
  }

  /* Text styling */
  .fw-bold {
    font-weight: bold !important;
  }

  .fw-medium {
    font-weight: 500 !important;
  }

  .text-primary {
    color: #000 !important;
  }
}
</style>
