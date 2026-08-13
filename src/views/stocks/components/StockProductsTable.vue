<template>
  <div class="card shadow-sm mb-3">
    <!-- Ligne 1: En-tête avec recherche -->
    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="bi bi-boxes me-2"></i>
        Produits du Stock
      </h5>
      <div class="d-flex align-items-center gap-2">
        <!-- Ligne 2: Barre de recherche -->
        <div class="input-group input-group-sm" style="width: 300px;">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input
            type="text"
            class="form-control"
            placeholder="Rechercher un produit..."
            :value="searchQuery"
            @input="$emit('search', $event.target.value)"
          >
          <button v-if="searchQuery" class="btn btn-light" @click="$emit('clear-search')">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Ligne 3: Corps de la carte -->
    <div class="card-body">
      <!-- Ligne 5: Contenu principal -->
      <div>
        <!-- Ligne 6: Tableau responsive -->
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <!-- Ligne 7: En-tête du tableau -->
            <thead class="table-light">
              <tr>
                <th style="width: 50px;">#</th>
                <th>Produit</th>
                <th>Code</th>
                <th class="text-end">Quantité Disponible</th>
                <th class="text-center">Alerte</th>
                <th class="text-end">Prix Unitaire</th>
                <th>Devise</th>
                <th>Dernier Mouvement</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <!-- Ligne 8: Corps du tableau -->
            <tbody>
              <!-- Ligne 9: Lignes de produits -->
              <tr v-for="(stock, index) in stockProducts" :key="stock.id"
                  :class="{'table-active': selectedProduct?.id === stock.id}">
                <!-- Ligne 10: Numéro de ligne -->
                <td class="text-muted fw-bold">{{ getRowNumber(index) }}</td>
                <!-- Ligne 11: Désignation du produit -->
                <td>
                  <div class="fw-bold">{{ stock.product?.item_designation }}</div>
                  <small class="text-muted">{{ stock.product?.category }}</small>
                </td>
                <!-- Ligne 12: Code produit -->
                <td><code>{{ stock.product?.item_code }}</code></td>
                <!-- Ligne 13: Quantité -->
                <td class="text-end">
                  <span class="badge fs-6" :class="stock.is_alert ? 'bg-danger' : stock.quantity > 0 ? 'bg-info' : 'bg-secondary'">
                    {{ stock.quantity }} {{ stock.product?.item_measurement_unit || 'PCE' }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="stock.is_alert"
                    class="badge bg-danger-subtle text-danger border border-danger-subtle"
                    :title="`Seuil: ${formatNumber(stock.alert_threshold)} ${stock.product?.item_measurement_unit || ''}`"
                  >
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    Alerte
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <!-- Ligne 14: Prix unitaire -->
                <td class="text-end">{{ formatNumber(stock.unit_price) }}</td>
                <!-- Ligne 15: Devise -->
                <td>{{ stock.currency }}</td>
                <!-- Ligne 16: Dernier mouvement -->
                <td>
                  <small v-if="stock.last_stock_movement" class="text-muted">
                    <span class="badge" :class="getMovementBadgeClass(stock.last_stock_movement.item_movement_type)">
                      {{ stock.last_stock_movement.item_movement_type }}
                    </span>
                    {{ formatDate(stock.last_stock_movement.created_at) }}
                  </small>
                  <small v-else class="text-muted">-</small>
                </td>
                <!-- Ligne 17: Boutons d'action -->
                <td class="text-center">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-success"
                            @click="$emit('quick-entry', stock)"
                            title="Entrée de stock">
                      <i class="bi bi-plus-lg"></i> Entrée
                    </button>
                    <button class="btn btn-danger"
                            @click="$emit('quick-exit', stock)"
                            :disabled="stock.quantity <= 0"
                            title="Sortie de stock">
                      <i class="bi bi-dash-lg"></i> Sortie
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Ligne 18: Message si aucun produit -->
              <tr v-if="!loading && stockProducts.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  <span v-if="searchQuery">Aucun produit trouvé pour "{{ searchQuery }}"</span>
                  <span v-else>Aucun produit dans ce stock</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Ligne 19: Pagination -->
        <div v-if="pagination.total > 0" class="d-flex justify-content-between align-items-center mt-3">
          <!-- Ligne 20: Info de pagination -->
          <div class="text-muted">
            Affichage de {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }} produits
          </div>
          <!-- Ligne 21: Navigation -->
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <!-- Ligne 22: Première page -->
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="$emit('go-to-page', 1)" :disabled="pagination.current_page === 1">
                  <i class="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <!-- Ligne 23: Page précédente -->
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="$emit('go-to-page', pagination.current_page - 1)" :disabled="pagination.current_page === 1">
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              <!-- Ligne 24: Pages visibles -->
              <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === pagination.current_page }">
                <button class="page-link" @click="$emit('go-to-page', page)">{{ page }}</button>
              </li>
              <!-- Ligne 25: Page suivante -->
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                <button class="page-link" @click="$emit('go-to-page', pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
              <!-- Ligne 26: Dernière page -->
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                <button class="page-link" @click="$emit('go-to-page', pagination.last_page)" :disabled="pagination.current_page === pagination.last_page">
                  <i class="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ligne 27: Définition des props
const props = defineProps({
  stockProducts: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  },
  pagination: {
    type: Object,
    required: true
  },
  visiblePages: {
    type: Array,
    required: true
  },
  selectedProduct: {
    type: Object,
    default: null
  }
});

// Ligne 28: Définition des émissions
defineEmits(['search', 'clear-search', 'quick-entry', 'quick-exit', 'go-to-page']);

// Ligne 29: Calcul du numéro de ligne
const getRowNumber = (index) => {
  return (props.pagination.current_page - 1) * props.pagination.per_page + index + 1;
};

// Ligne 30: Formater un nombre
const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Ligne 31: Formater une date
const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR');
};

// Ligne 32: Obtenir la classe du badge de mouvement
const getMovementBadgeClass = (type) => {
  return type.startsWith('E') ? 'bg-success' : 'bg-danger';
};
</script>
