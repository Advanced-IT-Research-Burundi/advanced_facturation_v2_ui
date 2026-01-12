<template>
  <div class="container-fluid p-0">
    <h1 class="h3 mb-4 fw-bold text-dark">Rapports & Analytiques</h1>
    
    <div class="card glass shadow-sm p-4 border-0">
      <div class="row mb-5">
        <div class="col-md-6">
          <div class="chart-wrapper">
            <h5 class="chart-title text-muted mb-3">Performance Mensuelle</h5>
            <div class="canvas-container">
              <canvas id="monthlyPerformanceChart"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="chart-wrapper">
            <h5 class="chart-title text-muted mb-3">Répartition des Dépenses</h5>
            <div class="canvas-container">
              <canvas id="expenseDistributionChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <h5 class="mb-3 fw-bold">Liste des rapports récents</h5>
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th scope="col" style="width: 50px">#</th>
              <th scope="col">Rapport</th>
              <th scope="col">Détails</th>
              <th scope="col" class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(report, index) in reports" :key="index">
              <th scope="row">{{ index + 1 }}</th>
              <td class="fw-medium">{{ report.title }}</td>
              <td class="text-secondary">{{ report.details }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.8rem">Voir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

const reports = ref([
  { title: "Rapport de Ventes", details: "Analyse des ventes mensuelles" },
  { title: "Rapport de Stock", details: "État des stocks actuels" },
  { title: "Rapport RH", details: "Suivi des présences" },
]);

onMounted(() => {
  // Configuration commune pour réduire la taille et rendre responsive
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permet de forcer la hauteur via CSS
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 11 }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 } } },
      x: { ticks: { font: { size: 10 } } }
    }
  };

  // --- Graphique en Barres ---
  const ctxBar = document.getElementById("monthlyPerformanceChart").getContext("2d");
  new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [{
        label: "Ventes (k€)",
        data: [12, 19, 3, 5, 2],
        backgroundColor: "rgba(13, 110, 253, 0.6)", // Bleu Bootstrap
        borderColor: "rgb(13, 110, 253)",
        borderWidth: 1,
        borderRadius: 4
      }],
    },
    options: commonOptions
  });

  // --- Graphique en Camembert ---
  const ctxPie = document.getElementById("expenseDistributionChart").getContext("2d");
  new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: ["Marketing", "Salaires", "Logistique", "Autres"],
      datasets: [{
        data: [300, 500, 200, 100],
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
        ],
        borderWidth: 1,
      }],
    },
    options: {
      ...commonOptions,
      scales: {} // Pas d'axes pour un camembert
    }
  });
});
</script>

<style scoped>
/* Conteneur principal avec effet flou léger */
.glass {
  background: white;
  border-radius: 12px;
}

/* Contrôle précis de la taille des graphiques */
.canvas-container {
  position: relative;
  height: 220px; /* Hauteur réduite pour les graphiques */
  width: 100%;
}

.chart-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table {
  font-size: 0.9rem;
}

/* Style pour la table-responsive */
.table-responsive {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .canvas-container {
    height: 180px; /* Encore plus petit sur mobile */
  }
}
</style>