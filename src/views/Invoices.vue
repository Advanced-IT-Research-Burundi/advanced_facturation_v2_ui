<script setup>
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-vue-next';

// Mock data
const invoices = [
  { id: 'INV-001', client: 'Acme Corp', amount: 1200500, date: '25/10/2025', status: 'Payé' },
  { id: 'INV-002', client: 'Globex Inc', amount: 850000, date: '28/10/2025', status: 'En Attente' },
  { id: 'INV-003', client: 'Soylent Corp', amount: 2300000, date: '01/11/2025', status: 'En Retard' },
  { id: 'INV-004', client: 'Initech', amount: 450750, date: '02/11/2025', status: 'Payé' },
  { id: 'INV-005', client: 'Umbrella Corp', amount: 5000000, date: '05/11/2025', status: 'En Attente' },
];

const statusClass = (status) => {
  switch(status) {
    case 'Payé': return 'bg-success-subtle text-success';
    case 'En Attente': return 'bg-warning-subtle text-warning';
    case 'En Retard': return 'bg-danger-subtle text-danger';
    default: return 'bg-secondary-subtle text-secondary';
  }
};
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-0">Factures</h1>
        <p class="text-muted small mb-0">Gérez et facturez vos clients.</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2">
        <Plus :size="18" />
        Nouvelle Facture
      </button>
    </div>

    <!-- Filters -->
    <div class="card glass mb-4">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-auto col-12 flex-grow-1">
             <div class="input-group">
                <span class="input-group-text bg-light border-end-0 text-muted"><Search :size="16" /></span>
                <input type="text" class="form-control border-start-0 bg-light" placeholder="Rechercher facture # ou client...">
             </div>
          </div>
          <div class="col-auto d-flex gap-2">
            <button class="btn btn-light border d-flex align-items-center gap-2">
              <Filter :size="16" /> Filtrer
            </button>
            <button class="btn btn-light border">Exporter</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card glass flex-grow-1 overflow-hidden d-flex flex-column">
      <div class="table-responsive flex-grow-1">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light sticky-top">
            <tr>
              <th scope="col" class="py-3 ps-4 text-muted text-uppercase small border-bottom-0">ID Facture</th>
              <th scope="col" class="py-3 text-muted text-uppercase small border-bottom-0">Client</th>
              <th scope="col" class="py-3 text-muted text-uppercase small border-bottom-0">Date</th>
              <th scope="col" class="py-3 text-muted text-uppercase small border-bottom-0">Montant</th>
              <th scope="col" class="py-3 text-muted text-uppercase small border-bottom-0">Statut</th>
              <th scope="col" class="py-3 pe-4 text-end text-muted text-uppercase small border-bottom-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id">
              <td class="ps-4 fw-medium">{{ inv.id }}</td>
              <td>{{ inv.client }}</td>
              <td class="text-muted">{{ inv.date }}</td>
              <td class="fw-bold">{{ inv.amount.toLocaleString() }} FBU</td>
              <td>
                <span class="badge rounded-pill" :class="statusClass(inv.status)">{{ inv.status }}</span>
              </td>
              <td class="pe-4 text-end">
                <button class="btn btn-sm btn-link text-muted p-0">
                  <MoreHorizontal :size="18" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="card-footer bg-transparent border-top py-3 px-4 d-flex justify-content-between align-items-center">
         <span class="text-muted small">Affichage de 1-5 sur 120 résultats</span>
         <nav aria-label="Page navigation">
           <ul class="pagination pagination-sm mb-0">
             <li class="page-item disabled"><a class="page-link" href="#">Précédent</a></li>
             <li class="page-item active"><a class="page-link" href="#">1</a></li>
             <li class="page-item"><a class="page-link" href="#">2</a></li>
             <li class="page-item"><a class="page-link" href="#">3</a></li>
             <li class="page-item"><a class="page-link" href="#">Suivant</a></li>
           </ul>
         </nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-responsive {
  min-height: 0;
}
</style>
