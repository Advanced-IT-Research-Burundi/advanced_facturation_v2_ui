<template>
  <div class="container-fluid bg-light min-vh-100 p-4">
    <div class="d-flex flex-wrap gap-3 mb-3 border-bottom pb-2 small fw-bold">
      <span @click="goToCreate" class="cursor-pointer text-white bg-red-dark px-2 py-1 rounded shadow-sm">
        <i class="bi bi-box-arrow-in-right"></i> Entré
      </span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-arrow-counterclockwise"></i> Retour des marchandises</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-tag"></i> Category</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-file-earmark-text"></i> Fiche de Stock</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-clock-history"></i> Historique</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-activity"></i> Mouvement de stock</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-barcode"></i> Bar Code</span>
      <span class="cursor-pointer nav-link-custom"><i class="bi bi-cart"></i> Bon de Commande</span>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-red-dark text-white px-3 py-2 shadow-sm">
        Les entrés et les sorties
      </button>

      <div class="d-flex align-items-center gap-2">
        <h4 class="m-0 fw-normal me-4">Liste des produits</h4>

        <select v-model="stockFilter" @change="fetchStock(1)" class="form-select border-secondary-subtle" style="width: auto">
          <option value="TOUT">TOUT</option>
          <option value="STOCK VIDE">STOCK VIDE</option>
          <option value="STOCK NON VIDE">STOCK NON VIDE</option>
        </select>

        <div class="input-group" style="width: 350px">
          <input v-model="search" @input="handleSearch" type="text" class="form-control" placeholder="Rechercher ici..." />
          <button class="btn btn-outline-dark" @click="fetchStock(1)">Ok</button>
        </div>
      </div>
    </div>

    <div class="bg-white border rounded shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light text-uppercase small fw-bold border-bottom">
            <tr>
              <th class="py-3 ps-3">#</th>
              <th>CODE</th>
              <th>Designation <i class="bi bi-arrow-down-up ms-1"></i></th>
              <th>TVA(%)</th>
              <th>P U <i class="bi bi-arrow-down-up ms-1"></i></th>
              <th class="text-center">Qté <i class="bi bi-arrow-down-up ms-1"></i></th>
              <th>Unite</th>
              <th class="text-center">Alert</th>
              <th>Category</th>
              <th>Mouvement</th>
              <th>Dernière Modif.</th>
              <th class="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && products.length === 0">
              <td colspan="12" class="text-center py-5 text-danger fw-bold">
                <span class="spinner-border spinner-border-sm me-2"></span> Chargement des données...
              </td>
            </tr>
            
            <tr v-else-if="products.length === 0">
              <td colspan="12" class="text-center py-5">Aucun produit trouvé</td>
            </tr>

            <tr v-for="(item, index) in products" :key="item.id">
              <td class="ps-3 fw-bold text-muted">{{ calculateIndex(index) }}</td>
              <td class="small fw-bold">{{ item.product?.sku || item.sku }}</td>
              <td class="fw-medium">{{ item.product?.name || item.name }}</td>
              <td>{{ item.product?.tva_rate || item.tva_rate || '18' }}%</td>
              <td class="fw-bold">{{ formatPrice(item.selling_price_ttc || item.unit_price) }}</td>
              <td class="text-center">
                <span class="badge px-3 py-2 fs-6 w-75" :class="item.quantity > (item.min_quantity || 5) ? 'bg-success' : 'bg-danger'">
                  {{ item.quantity }}
                </span>
              </td>
              <td class="text-muted">{{ item.unit || 'pcs' }}</td>
              <td class="text-center">
                <i v-if="item.quantity <= (item.min_quantity || 5)" class="bi bi-exclamation-triangle-fill text-danger" title="Stock faible"></i>
              </td>
              <td><span class="badge bg-light text-dark border">Pièces</span></td>
              <td class="text-primary fw-bold">EN/OUT</td>
              <td class="small text-muted">{{ formatDate(item.updated_at) }}</td>
              <td>
                <div class="d-flex gap-1 justify-content-center">
                  <button class="btn btn-teal-action btn-sm text-white">Mouvement</button>
                  <button class="btn btn-outline-info btn-sm">Modifier</button>
                  <button class="btn btn-red-dark btn-sm text-white" @click="confirmDelete(item.id)">Supprimer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between align-items-center p-3 border-top bg-light">
        <div class="small text-muted">
          Affichage de <strong>{{ products.length }}</strong> sur <strong>{{ pagination.total }}</strong> produits
        </div>
        <nav v-if="pagination.total > 0">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
              <button class="page-link shadow-none" @click="fetchStock(pagination.current_page - 1)">Précédent</button>
            </li>
            <li class="page-item active">
              <span class="page-link bg-red-dark border-red-dark">{{ pagination.current_page }}</span>
            </li>
            <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
              <button class="page-link shadow-none" @click="fetchStock(pagination.current_page + 1)">Suivant</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex"; 

const router = useRouter();
const store = useStore();

// Filtres locaux
const search = ref("");
const stockFilter = ref("TOUT");

// Logique Vuex (Même logique que Clients.vue)
const products = computed(() => store.getters["stock/allStock"]);
const loading = computed(() => store.getters["stock/isLoading"]);
const pagination = computed(() => store.state.stock.pagination);

const goToCreate = () => router.push({ name: "stock.create" });

const fetchStock = (page = 1) => {
  // On passe les filtres à l'action du store
  store.dispatch("stock/fetchStock", {
    page,
    search: search.value,
    filter: stockFilter.value
  });
};

let timeout = null;
const handleSearch = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => fetchStock(1), 500);
};

const calculateIndex = (index) => (pagination.value.current_page - 1) * 15 + (index + 1);
const formatPrice = (price) => new Intl.NumberFormat("fr-FR").format(price || 0) + " FBU";
const formatDate = (dateStr) => {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
};

const confirmDelete = async (id) => {
  if (confirm("Voulez-vous vraiment supprimer cet article du stock ?")) {
    await store.dispatch("stock/deleteStockItem", id);
  }
};

onMounted(() => fetchStock(1));
</script>

<style scoped>
.bg-red-dark { background-color: #c51818 !important; }
.btn-red-dark { background-color: #c51818; border-color: #c51818; transition: 0.3s; }
.btn-red-dark:hover { background-color: #a11414; transform: translateY(-1px); }

.nav-link-custom {
  color: #666;
  text-decoration: none;
  cursor: pointer;
  transition: 0.2s;
}
.nav-link-custom:hover { color: #c51818 !important; }

.btn-teal-action { background-color: #17a2b8; border: none; }
.page-link { color: #c51818; border-color: #dee2e6; }
.page-item.active .page-link { background-color: #c51818 !important; border-color: #c51818 !important; color: white !important; }

.cursor-pointer { cursor: pointer; }
.table th { font-size: 0.75rem; background-color: #f8f9fa; color: #444; }
.table td { font-size: 0.85rem; }
.bi-arrow-down-up { font-size: 0.7rem; opacity: 0.4; }
</style>