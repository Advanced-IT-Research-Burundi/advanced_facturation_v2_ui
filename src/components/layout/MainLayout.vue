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
  Search,
  ShoppingCart,
  ClipboardList,
  Wallet,
  Building
} from 'lucide-vue-next';
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="d-flex vh-100 vw-100 overflow-hidden bg-light">
    <!-- Sidebar -->
    <aside class="d-flex flex-column flex-shrink-0 bg-dark text-white border-end border-secondary" style="width: 90px; transition: width 0.3s ease;">
      <div class="d-flex flex-column align-items-center justify-content-center py-4 text-white text-decoration-none border-bottom border-secondary">
        <div class="bg-primary rounded-3 d-flex align-items-center justify-content-center mb-2" style="width: 40px; height: 40px;">
           <span class="fw-bold fs-4">A</span>
        </div>
        <small class="fw-bold" style="font-size: 0.65rem;">ADVANCED</small>
      </div>
      
      <ul class="nav nav-pills flex-column mb-auto py-3 gap-2 px-2">
        <li class="nav-item">
          <RouterLink to="/sales" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <ShoppingCart :size="20" />
            <span class="small" style="font-size: 0.7rem;">Vente</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/clients" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <Users :size="20" />
            <span class="small" style="font-size: 0.7rem;">Clients</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/stock" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <Package :size="20" />
            <span class="small" style="font-size: 0.7rem;">Stock</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/journal" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <ClipboardList :size="20" />
            <span class="small" style="font-size: 0.7rem;">Journal</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/reports" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <BarChart2 :size="20" />
            <span class="small" style="font-size: 0.7rem;">Rapports</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/expenses" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <Wallet :size="20" />
            <span class="small" style="font-size: 0.7rem;">Dépenses</span>
          </RouterLink>
        </li>
         <li>
          <RouterLink to="/company" class="nav-link text-white-50 d-flex flex-column align-items-center justify-content-center gap-1 p-2" active-class="active bg-primary text-white">
            <Building :size="20" />
            <span class="small" style="font-size: 0.7rem;">Entr.</span>
          </RouterLink>
        </li>
      </ul>
      
      <div class="dropdown border-top border-secondary py-3 d-flex justify-content-center">
        <a href="#" class="d-flex align-items-center text-white text-decoration-none" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="" width="36" height="36" class="rounded-circle border border-2 border-secondary">
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
        <div>
          <h4 class="mb-0 fw-bold text-primary">Company Name</h4>
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
