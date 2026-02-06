<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0">Gestion des Produits par Stock</h4>
      <button class="btn btn-outline-secondary btn-sm" @click="$router.back()">
        <i class="bi bi-arrow-left me-1"></i>Retour
      </button>
    </div>

    <div class="row g-4">
      <!-- Colonne 1: Produits hors stock -->
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-primary text-white">
            <h6 class="mb-0">
              <i class="bi bi-plus-circle me-2"></i>Produits Disponibles
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="p-3">
              <input
                type="text"
                v-model="search"
                @input="handleSearchNotInStock"
                class="form-control form-control-sm mb-2"
                placeholder="Rechercher..."
              />
            </div>
            <div v-if="loadingProductsNotInStock" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="px-3">Code</th>
                    <th class="px-3">Désignation</th>
                    <th class="text-end px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in notInStock" :key="p.id">
                    <td class="px-3">{{ p.item_code }}</td>
                    <td class="px-3">{{ p.item_designation }}</td>
                    <td class="text-end px-3">
                      <button
                        class="btn btn-xs btn-secondary py-0 px-2"
                        @click="transfer(p.id)"
                        :disabled="working === p.id"
                      >
                        {{ working === p.id ? "..." : "Ajouter" }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!notInStock.length">
                    <td colspan="3" class="text-center py-3 text-muted">
                      Tous les produits sont inclus
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 2: Produits déjà dans ce stock -->
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-success text-white">
            <h6 class="mb-0">
              <i class="bi bi-box-fill me-2"></i>Produits en Stock
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="p-3">
              <input
                type="text"
                v-model="searchInStock"
                @input="handleSearchInStock"
                class="form-control form-control-sm mb-2"
                placeholder="Rechercher..."
              />
            </div>
            <div v-if="loadingProductsInStock" class="text-center py-4">
              <div class="spinner-border text-success"></div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="px-3">Code</th>
                    <th class="px-3">Désignation</th>
                    <th class="text-end px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in inStock" :key="p.id">
                    <td class="px-3">{{ p.item_code }}</td>
                    <td class="px-3">{{ p.item_designation }}</td>
                    <td class="text-end px-3">
                      <button
                        class="btn btn-xs btn-danger py-0 px-2"
                        @click="confirmDelete(p)"
                        :disabled="deleting === p.id"
                        title="Supprimer du stock"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!inStock.length">
                    <td colspan="3" class="text-center py-3 text-muted">
                      Vide
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div
      v-if="showDeleteModal"
      class="modal show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle me-2"></i>Confirmer la
              suppression
            </h5>
            <button
              class="btn-close btn-close-white"
              @click="cancelDelete"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">
              Êtes-vous sûr de vouloir supprimer ce produit du stock ?
            </p>
            <div class="alert alert-warning mb-0">
              <strong>{{ productToDelete?.item_designation }}</strong
              ><br />
              <small>Code: {{ productToDelete?.item_code }}</small>
            </div>
            <p class="text-muted small mt-2 mb-0">
              <i class="bi bi-info-circle me-1"></i>
              Cette action supprimera le produit de ce dépôt uniquement.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="cancelDelete"
            >
              Annuler
            </button>
            <button
              @click="deleteProduct"
              class="btn btn-danger"
              :disabled="deleting"
            >
              <span
                v-if="deleting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              <i v-else class="bi bi-trash me-1"></i>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import api from "@/services/api";

const route = useRoute();
const store = useStore();
const warehouseId = route.params.id;

const inStock = ref([]);
const notInStock = ref([]);
const loadingProductsInStock = ref(true);
const loadingProductsNotInStock = ref(true);
const working = ref(null);
const search = ref("");
const searchInStock = ref("");
const showDeleteModal = ref(false);
const productToDelete = ref(null);
const deleting = ref(null);

const handleSearchNotInStock = () => {
  loadProductsNotInStock();
};
const handleSearchInStock = () => {
  loadProductsInStock();
};

const loadProductsInStock = async () => {
  loadingProductsInStock.value = true;
  try {
    const resIn = await api.get(
      `/product_in_stock/${warehouseId}?search=${searchInStock.value}`,
    );
    inStock.value = resIn.data?.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loadingProductsInStock.value = false;
  }
};

const loadProductsNotInStock = async () => {
  loadingProductsNotInStock.value = true;
  try {
    const resNot = await api.get(
      `/product_not_stock/${warehouseId}?search=${search.value}`,
    );
    notInStock.value = resNot.data?.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loadingProductsNotInStock.value = false;
  }
};

const transfer = async (productId) => {
  working.value = productId;

  const res = await api.post(
    `/warehouses/${warehouseId}/products/${productId}`,
  );

  console.log(res.data);

  await loadProductsInStock();
  await loadProductsNotInStock();

  working.value = null;
};

const confirmDelete = (product) => {
  productToDelete.value = product;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  productToDelete.value = null;
};

const deleteProduct = async () => {
  if (!productToDelete.value) return;

  deleting.value = productToDelete.value.id;
  try {
    await api.delete(
      `/warehouses/${warehouseId}/products/${productToDelete.value.id}`,
    );

    // Recharger les listes
    await loadProductsInStock();
    await loadProductsNotInStock();

    // Fermer le modal
    showDeleteModal.value = false;
    productToDelete.value = null;
  } catch (e) {
    console.error("Erreur lors de la suppression:", e);
    alert("Erreur lors de la suppression du produit");
  } finally {
    deleting.value = null;
  }
};

onMounted(() => {
  loadProductsInStock();
  loadProductsNotInStock();
});
</script>

<style scoped>
.btn-xs {
  font-size: 0.75rem;
}
</style>
