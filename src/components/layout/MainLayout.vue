<script setup>
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  BarChart2, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Search
} from 'lucide-vue-next';
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="d-flex vh-100 vw-100 overflow-hidden bg-light">
    <!-- Sidebar -->
    <aside class="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white" style="width: 260px;">
      <div class="d-flex align-items-center mb-4 mb-md-0 me-md-auto text-white text-decoration-none px-2">
        <div class="bg-primary rounded-3 d-flex align-items-center justify-content-center me-2" style="width: 36px; height: 36px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="white" fill-opacity="0.2"/>
            <path d="M12 7V17M7 12H17" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="fs-5 fw-bold">Advanced <span class="text-info">Facturation V2</span></span>
      </div>
      
      <hr class="text-secondary opacity-25">

      <ul class="nav nav-pills flex-column mb-auto gap-1">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link text-white-50 d-flex align-items-center gap-2" active-class="active bg-primary text-white">
            <LayoutDashboard :size="18" />
            Tableau de Bord
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/invoices" class="nav-link text-white-50 d-flex align-items-center gap-2" active-class="active bg-primary text-white">
            <FileText :size="18" />
            Factures
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/stock" class="nav-link text-white-50 d-flex align-items-center gap-2" active-class="active bg-primary text-white">
            <Package :size="18" />
            Stock
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/reports" class="nav-link text-white-50 d-flex align-items-center gap-2" active-class="active bg-primary text-white">
            <BarChart2 :size="18" />
            Rapports
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/users" class="nav-link text-white-50 d-flex align-items-center gap-2" active-class="active bg-primary text-white">
            <Users :size="18" />
            Utilisateurs
          </RouterLink>
        </li>
      </ul>
      
      <hr class="text-secondary opacity-25">
      
      <div class="dropdown">
        <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="" width="32" height="32" class="rounded-circle me-2">
          <strong>Admin User</strong>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li><a class="dropdown-item" href="#">Paramètres</a></li>
          <li><a class="dropdown-item" href="#">Profil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#">Se Déconnecter</a></li>
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Header -->
      <header class="d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
        <div class="input-group" style="max-width: 300px;">
          <span class="input-group-text bg-light border-end-0"><Search :size="16" class="text-muted" /></span>
          <input type="text" class="form-control bg-light border-start-0" placeholder="Rechercher des factures...">
        </div>

        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-light position-relative rounded-circle p-2 d-flex align-items-center justify-content-center text-muted">
            <Bell :size="20" />
            <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span class="visually-hidden">Nouvelles alertes</span>
            </span>
          </button>
          
          <div class="text-end d-none d-sm-block lh-1 text-muted">
            <small class="d-block fw-bold text-dark">Admin User</small>
            <span style="font-size: 0.75rem;">Administrateur</span>
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="flex-grow-1 overflow-auto p-4 bg-body">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.nav-link:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.1);
  color: white !important;
}

/* Custom Scrollbar for nicer feel */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.1);
  border-radius: 4px;
}
</style>
