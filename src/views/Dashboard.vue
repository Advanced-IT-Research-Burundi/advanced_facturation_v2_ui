<script setup>
import { TrendingUp, Package, Users, DollarSign } from 'lucide-vue-next';
</script>

<template>
  <div class="container-fluid p-0">
    <div class="mb-4">
      <h1 class="h3 mb-1">Aperçu du Tableau de Bord</h1>
      <p class="text-muted">Bon retour ! Voici ce qui se passe aujourd'hui.</p>
    </div>

    <!-- Stats Grid -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card glass h-100 p-3">
          <div class="d-flex align-items-center mb-2">
             <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-primary-subtle text-primary" style="width: 48px; height: 48px;">
               <DollarSign :size="24" />
             </div>
             <div>
               <h6 class="card-subtitle text-muted mb-1">Revenu Total</h6>
               <h4 class="card-title mb-0">124,500 FBU</h4>
             </div>
          </div>
          <div class="mt-2">
            <span class="badge bg-success-subtle text-success me-1">
              <i class="pi pi-arrow-up text-xs"></i> 12.5%
            </span>
            <span class="text-muted small">depuis le mois dernier</span>
          </div>
        </div>
      </div>

       <div class="col-12 col-sm-6 col-lg-3">
        <div class="card glass h-100 p-3">
          <div class="d-flex align-items-center mb-2">
             <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-danger-subtle text-danger" style="width: 48px; height: 48px;">
               <Package :size="24" />
             </div>
             <div>
               <h6 class="card-subtitle text-muted mb-1">En Stock</h6>
               <h4 class="card-title mb-0">1,240</h4>
             </div>
          </div>
          <div class="mt-2">
            <span class="badge bg-secondary-subtle text-secondary me-1">0%</span>
            <span class="text-muted small">stable</span>
          </div>
        </div>
      </div>

       <div class="col-12 col-sm-6 col-lg-3">
        <div class="card glass h-100 p-3">
          <div class="d-flex align-items-center mb-2">
             <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-info-subtle text-info" style="width: 48px; height: 48px;">
               <Users :size="24" />
             </div>
             <div>
               <h6 class="card-subtitle text-muted mb-1">Utilisateurs Actifs</h6>
               <h4 class="card-title mb-0">45</h4>
             </div>
          </div>
          <div class="mt-2">
            <span class="badge bg-success-subtle text-success me-1">+3</span>
            <span class="text-muted small">nouveaux aujourd'hui</span>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card glass h-100 p-3">
          <div class="d-flex align-items-center mb-2">
             <div class="rounded-3 d-flex align-items-center justify-content-center me-3 bg-success-subtle text-success" style="width: 48px; height: 48px;">
               <TrendingUp :size="24" />
             </div>
             <div>
               <h6 class="card-subtitle text-muted mb-1">Croissance</h6>
               <h4 class="card-title mb-0">18.2%</h4>
             </div>
          </div>
           <div class="mt-2">
             <span class="badge bg-success-subtle text-success me-1">En hausse</span>
           </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity / Mock Table -->
    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div class="card glass h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Factures Récentes</h5>
            <button class="btn btn-sm btn-light text-muted">Voir Tout</button>
          </div>
          <div class="card-body px-0">
             <div class="table-responsive px-4">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th scope="col" class="border-top-0">ID Facture</th>
                    <th scope="col" class="border-top-0">Client</th>
                    <th scope="col" class="border-top-0">Montant</th>
                    <th scope="col" class="border-top-0">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="i in 5" :key="i">
                    <td class="fw-medium text-primary">#INV-00{{ i }}</td>
                    <td>Client Corp {{ i }}</td>
                    <td class="fw-bold">{{ (i * 120000).toLocaleString() }} FBU</td>
                    <td>
                      <span class="badge bg-success-subtle text-success rounded-pill px-3">Payé</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-4">
        <div class="card glass h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4 pb-0">
            <h5 class="mb-0">Actions Rapides</h5>
          </div>
          <div class="card-body p-4 d-flex flex-column gap-3">
            <button class="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-2">
              <i class="pi pi-plus"></i> Créer une Nouvelle Facture
            </button>
            <button class="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 py-2">
              <i class="pi pi-box"></i> Ajouter un Produit
            </button>
            <button class="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 py-2">
              <i class="pi pi-file"></i> Générer un Rapport
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped overrides if needed, mostly Bootstrap now */
.bg-primary-subtle { background-color: #ffe4e6 !important; color: #C4251D !important;} /* Custom red tint override */
</style>
