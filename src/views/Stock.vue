<template>
  <div class="container-fluid bg-light min-vh-100 p-4">
    <div
      class="d-flex flex-wrap gap-3 mb-3 border-bottom pb-2 text-primary small fw-bold"
    >
      <span
        @click="goToCreate"
        class="cursor-pointer text-decoration-none text-success"
      >
        <i class="bi bi-box-arrow-in-right"></i> Entré
      </span>
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-arrow-counterclockwise"></i> Retour des
        marchandises</span
      >
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-tag"></i> Category</span
      >
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-file-earmark-text"></i> Fiche de Stock</span
      >
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-clock-history"></i> Historique des Entres en
        stock</span
      >
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-activity"></i> Mouvement de stock</span
      >
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-barcode"></i> Bar Code</span
      >
      <span class="cursor-pointer text-decoration-none"
        ><i class="bi bi-cart"></i> Bon de Commande</span
      >
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-red-dark text-white px-3 py-2 shadow-sm">
        Les entres et les sorties
      </button>

      <div class="d-flex align-items-center gap-2">
        <h4 class="m-0 fw-normal me-4">Liste des produits</h4>

        <select
          v-model="stockFilter"
          @change="fetchStock(1)"
          class="form-select border-secondary-subtle"
          style="width: auto"
        >
          <option value="TOUT">TOUT</option>
          <option value="STOCK VIDE">STOCK VIDE</option>
          <option value="STOCK NON VIDE">STOCK NON VIDE</option>
        </select>

        <div class="input-group" style="width: 350px">
          <input
            v-model="search"
            @input="handleSearch"
            type="text"
            class="form-control"
            placeholder="Rechercher ici..."
          />
          <button class="btn btn-outline-dark" @click="fetchStock(1)">
            Ok
          </button>
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
              <th class="text-center">
                Qté <i class="bi bi-arrow-down-up ms-1"></i>
              </th>
              <th>Unite <i class="bi bi-arrow-down-up ms-1"></i></th>
              <th>Alert <i class="bi bi-arrow-down-up ms-1"></i></th>
              <th>Category</th>
              <th>Mouvement</th>
              <th>Date de Modification</th>
              <th class="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && products.length === 0">
              <td colspan="12" class="text-center py-5 text-danger fw-bold">
                Chargement des données...
              </td>
            </tr>
            <tr v-else-if="products.length === 0">
              <td colspan="12" class="text-center py-5">
                Aucun produit ne correspond à vos critères
              </td>
            </tr>

            <tr v-for="(item, index) in products" :key="item.id">
              <td class="ps-3 fw-bold text-muted">
                {{ calculateIndex(index) }}
              </td>
              <td>{{ item.product?.sku || "---" }}</td>
              <td class="fw-medium">{{ item.product?.name || "Inconnu" }}</td>
              <td>{{ item.product?.tva || "18" }}</td>
              <td>{{ formatPrice(item.unit_price) }}</td>
              <td class="text-center">
                <span
                  class="badge px-3 py-2 fs-6 w-75"
                  :class="item.quantity > 0 ? 'bg-success' : 'bg-danger'"
                >
                  {{ item.quantity }}
                </span>
              </td>
              <td>{{ item.product?.unit || "pieces" }}</td>
              <td class="text-center">
                <i
                  v-if="item.quantity <= 5"
                  class="bi bi-exclamation-triangle-fill text-danger"
                  title="Stock faible"
                ></i>
              </td>
              <td><span class="fw-bold">Pieces</span></td>
              <td class="text-primary fw-bold">EN</td>
              <td class="small text-muted">
                {{ formatDate(item.updated_at) }}
              </td>
              <td>
                <div class="d-flex gap-1 justify-content-center">
                  <button class="btn btn-teal-action btn-sm text-white">
                    Mouvement
                  </button>
                  <button class="btn btn-outline-info btn-sm">Modifier</button>
                  <button class="btn btn-outline-warning btn-sm">
                    Afficher
                  </button>
                  <button
                    class="btn btn-red-dark btn-sm text-white"
                    @click="deleteItem(item.id)"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="d-flex justify-content-between align-items-center p-3 border-top bg-light"
      >
        <div class="small text-muted">
          Affichage de <strong>{{ products.length }}</strong> sur
          <strong>{{ pagination.total }}</strong> produits au total
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li
              class="page-item"
              :class="{ disabled: !pagination.prev_page_url }"
            >
              <button
                class="page-link"
                @click="fetchStock(pagination.current_page - 1)"
              >
                Précédent
              </button>
            </li>
            <li class="page-item active">
              <span class="page-link bg-red-dark border-red-dark">{{
                pagination.current_page
              }}</span>
            </li>
            <li
              class="page-item"
              :class="{ disabled: !pagination.next_page_url }"
            >
              <button
                class="page-link"
                @click="fetchStock(pagination.current_page + 1)"
              >
                Suivant
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router"; // Ajout du router
import api from "@/services/api";

const router = useRouter(); // Initialisation du router
const products = ref([]);
const loading = ref(false);
const search = ref("");
const stockFilter = ref("TOUT");
const pagination = ref({
  current_page: 1,
  total: 0,
  prev_page_url: null,
  next_page_url: null,
});

// Fonction pour aller à la page de création
const goToCreate = () => {
  router.push({ name: "stock.create" });
};

const fetchStock = async (page = 1) => {
  loading.value = true;
  try {
    const response = await api.get(`/warehouse-products`, {
      params: {
        page: page,
        search: search.value,
        filter: stockFilter.value,
      },
    });

    if (response.data.success) {
      products.value = response.data.data.data;
      pagination.value = {
        current_page: response.data.data.current_page,
        total: response.data.data.total,
        prev_page_url: response.data.data.prev_page_url,
        next_page_url: response.data.data.next_page_url,
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du stock:", error);
  } finally {
    loading.value = false;
  }
};

let timeout = null;
const handleSearch = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    fetchStock(1);
  }, 500);
};

const calculateIndex = (index) =>
  (pagination.value.current_page - 1) * 15 + (index + 1);
const formatPrice = (price) => new Intl.NumberFormat("fr-FR").format(price);
const formatDate = (dateStr) =>
  dateStr ? dateStr.replace("T", " ").substring(0, 19) : "---";

const deleteItem = (id) => {
  if (confirm("Voulez-vous vraiment supprimer cet article du stock ?")) {
    // Logique de suppression ici
  }
};

onMounted(() => fetchStock(1));
</script>

<style scoped>
/* Vos styles restent identiques */
.btn-red-dark {
  background-color: #c51818;
  border-color: #c51818;
}
.btn-red-dark:hover {
  background-color: #a11414;
}
.btn-teal-action {
  background-color: #17a2b8;
  border: none;
}
.page-link {
  color: #c51818;
  cursor: pointer;
}
.bg-red-dark {
  background-color: #c51818 !important;
  color: white !important;
}
.page-item.disabled .page-link {
  color: #6c757d;
}
.table th {
  font-size: 0.75rem;
  color: #333;
  letter-spacing: 0.02em;
}
.table td {
  font-size: 0.85rem;
}
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  color: #c51818 !important;
}
.bi-arrow-down-up {
  font-size: 0.7rem;
  opacity: 0.3;
}
</style>
