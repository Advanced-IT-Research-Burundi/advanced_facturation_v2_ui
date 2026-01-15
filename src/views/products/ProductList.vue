<script setup>
import { computed } from "vue";

const props = defineProps({
  products: Array,
  loading: Boolean,
  pagination: Object,
  categories: Array,
});

const emit = defineEmits(["edit", "delete", "change-page"]);

const getCategoryName = (id) => {
  if (!id) return "-";
  const cat = props.categories?.find((c) => c.id === id);
  return cat ? cat.name : id;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "BIF",
  }).format(price || 0);
};

const isLowStock = (product) => {
  return (product.quantite || 0) <= (product.quantite_alert || 0);
};

const totalPages = computed(() => {
  if (!props.pagination?.total) return 1;
  return Math.ceil(props.pagination.total / 15); // Assuming 15 per page
});
</script>

<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body p-0">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-4">Code</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Marque</th>
              <th>Prix</th>
              <th>Quantité</th>
              <th class="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td class="ps-4 font-monospace small">{{ product.item_code }}</td>
              <td>{{ product.item_designation }}</td>
              <td>{{ getCategoryName(product.product_category_id) }}</td>
              <td>{{ product.marque || "-" }}</td>
              <td class="fw-bold">{{ formatPrice(product.price) }}</td>
              <td>
                <span
                  :class="{
                    'badge bg-danger': isLowStock(product),
                    'badge bg-light text-dark': !isLowStock(product),
                  }"
                >
                  {{ product.quantite || 0 }}
                  {{ product.item_measurement_unit }}
                </span>
              </td>
              <td class="text-end pe-4">
                <router-link
                  :to="{ name: 'stock.detail', params: { id: product.id } }"
                  class="btn btn-sm btn-link text-info p-1 me-1 shadow-none"
                >
                  <i class="bi bi-eye"></i>
                </router-link>
                <button
                  class="btn btn-sm btn-link text-primary p-1 me-1 shadow-none"
                  @click="$emit('edit', product)"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-sm btn-link text-danger p-1 shadow-none"
                  @click="$emit('delete', product)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
            <tr v-if="products && products.length === 0">
              <td colspan="7" class="text-center py-5 text-muted">
                Aucun produit trouvé
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav v-if="pagination.total > 0" class="p-4 border-top">
        <ul class="pagination pagination-sm justify-content-center mb-0">
          <li
            class="page-item"
            :class="{ disabled: !pagination.prev_page_url }"
          >
            <button
              class="page-link"
              @click="$emit('change-page', pagination.current_page - 1)"
            >
              Précédent
            </button>
          </li>
          <li class="page-item disabled">
            <span class="page-link px-3"
              >Page {{ pagination.current_page }} / {{ totalPages }}</span
            >
          </li>
          <li
            class="page-item"
            :class="{ disabled: !pagination.next_page_url }"
          >
            <button
              class="page-link"
              @click="$emit('change-page', pagination.current_page + 1)"
            >
              Suivant
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #f8fafc;
}
</style>
