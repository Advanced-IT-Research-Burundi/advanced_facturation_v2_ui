<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import api from '@/services/api';
import { Printer } from 'lucide-vue-next';

const isLoading = ref(false);
const filters = ref({
    date_from: new Date().toISOString().slice(0, 8) + '01', // Start of month
    date_to: new Date().toISOString().slice(0, 10),
    user_id: 'all',
    warehouse_id: 'all'
});

const reportData = ref(null);
const users = ref([]);
const warehouses = ref([]);

// Chart instances
let salesChart = null;
let userChart = null;
let warehouseChart = null;

// Refs for canvas elements
const salesChartCanvas = ref(null);
const userChartCanvas = ref(null);
const warehouseChartCanvas = ref(null);

const fetchFiltersData = async () => {
    try {
        const [usersRes, warehousesRes] = await Promise.all([
            api.get('/users'),
            api.get('/warehouses')
        ]);
        if(usersRes.data.success) users.value = usersRes.data.data.data || usersRes.data.data;
        if(warehousesRes.data.success) warehouses.value = warehousesRes.data.data.data || warehousesRes.data.data;
    } catch (e) {
        console.error("Error loading filters", e);
    }
};

const fetchReport = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/reports/sales', { params: filters.value });
        if (response.data.success) {
            reportData.value = response.data.data;
            // Delay chart update slightly to ensure DOM is ready if switching states
            setTimeout(updateCharts, 100);
        }
    } catch (e) {
        console.error("Error loading report", e);
    } finally {
        isLoading.value = false;
    }
};

const updateCharts = () => {
    if (!reportData.value) return;

    // Destroy old charts
    if (salesChart) salesChart.destroy();
    if (userChart) userChart.destroy();
    if (warehouseChart) warehouseChart.destroy();

    // 1. Daily Sales Chart
    if (salesChartCanvas.value) {
        const dailyLabels = reportData.value.daily_sales.map(d => new Date(d.date).toLocaleDateString());
        const dailyData = reportData.value.daily_sales.map(d => d.total);

        salesChart = new Chart(salesChartCanvas.value, {
            type: 'line',
            data: {
                labels: dailyLabels,
                datasets: [{
                    label: 'Ventes Journalières',
                    data: dailyData,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 2. Sales by User
    if (userChartCanvas.value) {
        const userLabels = reportData.value.sales_by_user.map(u => u.name);
        const userData = reportData.value.sales_by_user.map(u => u.total);

        userChart = new Chart(userChartCanvas.value, {
            type: 'doughnut',
            data: {
                labels: userLabels,
                datasets: [{
                    data: userData,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 3. Sales by Warehouse
    if (warehouseChartCanvas.value) {
        if (reportData.value.sales_by_warehouse && reportData.value.sales_by_warehouse.length > 0) {
            const whLabels = reportData.value.sales_by_warehouse.map(w => w.name);
            const whData = reportData.value.sales_by_warehouse.map(w => w.total);

            warehouseChart = new Chart(warehouseChartCanvas.value, {
                type: 'bar',
                data: {
                    labels: whLabels,
                    datasets: [{
                        label: 'Ventes par Stock',
                        data: whData,
                        backgroundColor: '#10b981'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
};

const handlePrint = () => {
    setTimeout(() => window.print(), 100);
};

onMounted(() => {
    fetchFiltersData();
    fetchReport();
});

watch(filters, () => {
    fetchReport();
}, { deep: true });
</script>

<template>
    <div class="sales-report d-flex flex-column bg-white p-3">
        <!-- Filters Header -->
        <div class="card mb-3 no-print">
            <div class="card-body py-3">
                <div class="row g-3 align-items-end">
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Du</label>
                        <input type="date" v-model="filters.date_from" class="form-control form-control-sm">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Au</label>
                        <input type="date" v-model="filters.date_to" class="form-control form-control-sm">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small text-muted">Utilisateur</label>
                        <select v-model="filters.user_id" class="form-select form-select-sm">
                            <option value="all">Tous</option>
                            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small text-muted">Stock</label>
                        <select v-model="filters.warehouse_id" class="form-select form-select-sm">
                            <option value="all">Tous</option>
                            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                        </select>
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-primary btn-sm w-100" @click="handlePrint">
                            <Printer :size="16" class="me-1"/> Imprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- En-tête réservé à l'impression : volontairement simple, comme le journal. -->
        <div class="report-print-header d-none d-print-block">
             <h3>Rapport des ventes</h3>
             <p>Période : {{ new Date(filters.date_from).toLocaleDateString() }} au {{ new Date(filters.date_to).toLocaleDateString() }}</p>
        </div>

        <div v-if="reportData" class="flex-grow-1">
             <!-- Version imprimée : un seul tableau, clair et complet. -->
             <div class="sales-report-print d-none d-print-block">
                 <table class="table table-bordered print-table report-main-table">
                     <thead>
                         <tr>
                             <th style="width: 28%">Rubrique</th>
                             <th>Détail</th>
                             <th class="text-end" style="width: 26%">Valeur</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr class="print-section-row"><th colspan="3">Résumé des ventes</th></tr>
                         <tr><td>Chiffre d'affaires</td><td>Montant total des ventes</td><td class="text-end fw-bold">{{ reportData.metrics.revenue.toLocaleString() }} FBU</td></tr>
                         <tr><td>Nombre de factures</td><td>Factures enregistrées</td><td class="text-end fw-bold">{{ reportData.metrics.count }}</td></tr>
                         <tr><td>Panier moyen</td><td>Montant moyen par facture</td><td class="text-end fw-bold">{{ Math.round(reportData.metrics.average_basket).toLocaleString() }} FBU</td></tr>

                         <tr class="print-section-row"><th colspan="3">Ventes par jour</th></tr>
                         <tr v-for="sale in reportData.daily_sales" :key="sale.date">
                             <td>Journalier</td><td>{{ new Date(sale.date).toLocaleDateString() }}</td><td class="text-end">{{ Number(sale.total || 0).toLocaleString() }} FBU</td>
                         </tr>
                         <tr v-if="!reportData.daily_sales.length"><td colspan="3" class="text-center text-muted">Aucune vente pour cette période</td></tr>

                         <tr class="print-section-row"><th colspan="3">Ventes par utilisateur</th></tr>
                         <tr v-for="user in reportData.sales_by_user" :key="user.name">
                             <td>Utilisateur</td><td>{{ user.name }}</td><td class="text-end">{{ Number(user.total || 0).toLocaleString() }} FBU</td>
                         </tr>
                         <tr v-if="!reportData.sales_by_user.length"><td colspan="3" class="text-center text-muted">Aucune donnée</td></tr>

                         <tr class="print-section-row"><th colspan="3">Ventes par stock</th></tr>
                         <tr v-for="warehouse in reportData.sales_by_warehouse" :key="warehouse.name">
                             <td>Stock</td><td>{{ warehouse.name }}</td><td class="text-end">{{ Number(warehouse.total || 0).toLocaleString() }} FBU</td>
                         </tr>
                         <tr v-if="!reportData.sales_by_warehouse.length"><td colspan="3" class="text-center text-muted">Aucune donnée</td></tr>
                     </tbody>
                 </table>
             </div>

             <!-- KPIs -->
             <div class="row g-3 mb-4 no-print">
                 <div class="col-md-4">
                     <div class="card bg-primary text-white h-100">
                         <div class="card-body">
                             <h6 class="card-title opacity-75">Chiffre d'Affaires</h6>
                             <h3 class="fw-bold mb-0">{{ reportData.metrics.revenue.toLocaleString() }} FBU</h3>
                         </div>
                     </div>
                 </div>
                 <div class="col-md-4">
                     <div class="card bg-success text-white h-100">
                         <div class="card-body">
                             <h6 class="card-title opacity-75">Nombre de Factures</h6>
                             <h3 class="fw-bold mb-0">{{ reportData.metrics.count }}</h3>
                         </div>
                     </div>
                 </div>
                 <div class="col-md-4">
                     <div class="card bg-warning text-dark h-100">
                         <div class="card-body">
                             <h6 class="card-title opacity-75">Panier Moyen</h6>
                             <h3 class="fw-bold mb-0">{{ Math.round(reportData.metrics.average_basket).toLocaleString() }} FBU</h3>
                         </div>
                     </div>
                 </div>
             </div>

             <!-- Charts -->
             <div class="row g-3 mb-4 print-break-inside-avoid no-print">
                 <div class="col-12">
                     <div class="card h-100">
                         <div class="card-header bg-white fw-bold">Évolution des Ventes</div>
                         <div class="card-body" style="height: 300px;">
                             <canvas ref="salesChartCanvas"></canvas>
                         </div>
                     </div>
                 </div>
             </div>

             <div class="row g-3 print-break-inside-avoid no-print">
                 <div class="col-md-6">
                     <div class="card h-100">
                         <div class="card-header bg-white fw-bold">Par Utilisateur</div>
                         <div class="card-body" style="height: 300px;">
                             <canvas ref="userChartCanvas"></canvas>
                         </div>
                     </div>
                 </div>
                 <div class="col-md-6">
                     <div class="card h-100">
                         <div class="card-header bg-white fw-bold">Par Stock</div>
                         <div class="card-body" style="height: 300px;">
                             <canvas v-show="reportData.sales_by_warehouse.length" ref="warehouseChartCanvas"></canvas>
                             <div v-if="!reportData.sales_by_warehouse.length" class="h-100 d-flex align-items-center justify-content-center text-muted">
                                 Données non disponibles pour cette vue
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
        <div v-else class="flex-grow-1 d-flex align-items-center justify-content-center">
             <span class="spinner-border text-primary me-2"></span> Chargement...
        </div>
    </div>
</template>

<style scoped>
@media print {
    @page { margin: 12mm; }

    .sales-report {
        display: block !important;
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
    }
    .no-print { display: none !important; }
    .card { border: none !important; box-shadow: none !important; }
    .card-header { border-bottom: 2px solid #000 !important; }
    .print-break-inside-avoid { break-inside: avoid; }
    .h-100 { height: auto !important; }
    canvas { max-width: 100% !important; }
    .sales-report-print { display: block !important; }
    .report-print-header {
        display: block !important;
        text-align: center;
        border-bottom: 2px solid #007bff;
        margin-bottom: 14px;
        padding-bottom: 8px;
    }
    .report-print-header h3 { font-size: 18px; margin: 0 0 4px; color: #007bff; }
    .report-print-header p { font-size: 11px; margin: 0; }
    .print-table { font-size: 11px; width: 100%; margin-bottom: 12px !important; }
    .print-table th, .print-table td { padding: 5px 7px; vertical-align: middle; }
    .print-table th, .print-table td { border-color: #ddd !important; }
    .print-table thead th { background: #007bff !important; color: #fff !important; }
    .report-main-table { border-color: #ddd !important; }
    .report-main-table tbody tr:nth-child(even):not(.print-section-row) td { background: #f9f9f9 !important; }
    .report-main-table .print-section-row th {
        background: #f5f5f5 !important;
        color: #333 !important;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .03em;
        border-left: 3px solid #007bff !important;
        padding-top: 7px;
        padding-bottom: 7px;
    }
}
</style>
