<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center">
        <button class="btn btn-outline-secondary me-3" @click="$router.back()">
          <i class="bi bi-arrow-left"></i> Retour
        </button>
        <h1 class="h3 mb-0">
          <i class="bi bi-box-seam me-2"></i>
          Mouvements de Stock
          <span v-if="warehouse" class="text-primary">- {{ warehouse.name }}</span>
        </h1>
      </div>
      <div>
        <button class="btn btn-outline-info me-2" @click="showPendingTransfers">
          <i class="bi bi-hourglass-split"></i>
          Transferts en attente
          <span v-if="pendingCount > 0" class="badge bg-danger ms-1">{{ pendingCount }}</span>
        </button>
        <button class="btn btn-outline-success me-2" @click="openTransferModal">
          <i class="bi bi-arrow-left-right"></i> Créer Transfert
        </button>
        <button class="btn btn-outline-primary" @click="showMovementsHistory">
          <i class="bi bi-clock-history"></i> Historique
        </button>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
      {{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = null"></button>
    </div>

    <!-- Produits du stock avec recherche et pagination -->
    <div class="card shadow-sm mb-3">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="bi bi-boxes me-2"></i>
          Produits du Stock
        </h5>
        <div class="d-flex align-items-center gap-2">
          <div class="input-group input-group-sm" style="width: 300px;">
            <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
            <input
              type="text"
              class="form-control"
              placeholder="Rechercher un produit..."
              v-model="searchQuery"
              @input="debouncedSearch"
            >
            <button v-if="searchQuery" class="btn btn-light" @click="clearSearch">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loadingProducts" class="text-center py-4">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Chargement des produits...</p>
        </div>
        <div v-else>
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Produit</th>
                  <th>Code</th>
                  <th class="text-end">Quantité Disponible</th>
                  <th class="text-end">Prix Unitaire</th>
                  <th>Devise</th>
                  <th>Dernier Mouvement</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stock in stockProducts" :key="stock.id"
                    :class="{'table-active': selectedProduct?.id === stock.id}">
                  <td>
                    <div class="fw-bold">{{ stock.product?.item_designation }}</div>
                    <small class="text-muted">{{ stock.product?.category }}</small>
                  </td>
                  <td><code>{{ stock.product?.item_code }}</code></td>
                  <td class="text-end">
                    <span class="badge fs-6" :class="stock.quantity > 0 ? 'bg-info' : 'bg-secondary'">
                      {{ stock.quantity }} {{ stock.product?.item_measurement_unit || 'PCE' }}
                    </span>
                  </td>
                  <td class="text-end">{{ formatNumber(stock.unit_price) }}</td>
                  <td>{{ stock.currency }}</td>
                  <td>
                    <small v-if="stock.last_stock_movement" class="text-muted">
                      <span class="badge" :class="getMovementBadgeClass(stock.last_stock_movement.item_movement_type)">
                        {{ stock.last_stock_movement.item_movement_type }}
                      </span>
                      {{ formatDate(stock.last_stock_movement.created_at) }}
                    </small>
                    <small v-else class="text-muted">-</small>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-success"
                              @click="quickEntry(stock)"
                              title="Entrée de stock">
                        <i class="bi bi-plus-lg"></i> Entrée
                      </button>
                      <button class="btn btn-danger"
                              @click="quickExit(stock)"
                              :disabled="stock.quantity <= 0"
                              title="Sortie de stock">
                        <i class="bi bi-dash-lg"></i> Sortie
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="stockProducts.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    <span v-if="searchQuery">Aucun produit trouvé pour "{{ searchQuery }}"</span>
                    <span v-else>Aucun produit dans ce stock</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.total > 0" class="d-flex justify-content-between align-items-center mt-3">
            <div class="text-muted">
              Affichage de {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }} produits
            </div>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                  <button class="page-link" @click="goToPage(1)" :disabled="pagination.current_page === 1">
                    <i class="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                  <button class="page-link" @click="goToPage(pagination.current_page - 1)" :disabled="pagination.current_page === 1">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === pagination.current_page }">
                  <button class="page-link" @click="goToPage(page)">{{ page }}</button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                  <button class="page-link" @click="goToPage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                  <button class="page-link" @click="goToPage(pagination.last_page)" :disabled="pagination.current_page === pagination.last_page">
                    <i class="bi bi-chevron-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Entrée Multiple -->
    <div v-if="showEntryModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle me-2"></i>
              Entrée de Stock
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeEntryModal"></button>
          </div>
          <form @submit.prevent="submitEntry">
            <div class="modal-body">
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label class="form-label">Type d'entrée *</label>
                  <select class="form-select" v-model="entryForm.movement_type" required>
                    <option value="EN">EN - Entrée Normale</option>
                    <option value="ER">ER - Entrée Retour</option>
                    <option value="EI">EI - Entrée Inventaire</option>
                    <option value="EAJ">EAJ - Entrée Ajustement</option>
                    <option value="ET">ET - Entrée Transfert</option>
                    <option value="EAU">EAU - Entrée Autres</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Date du mouvement *</label>
                  <input type="datetime-local" class="form-control" v-model="entryForm.movement_date" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Référence facture</label>
                  <input type="text" class="form-control" v-model="entryForm.invoice_ref">
                </div>
                <div class="col-md-12">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" v-model="entryForm.description" rows="2"></textarea>
                </div>
              </div>

              <hr>

              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>Produits à entrer</h6>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="addEntryItem">
                  <i class="bi bi-plus-circle"></i> Ajouter un produit
                </button>
              </div>

              <div v-for="(item, index) in entryForm.items" :key="index" class="card mb-2">
                <div class="card-body">
                  <div class="row g-2 align-items-center">
                    <div class="col-md-4">
                      <label class="form-label small">Produit *</label>
                      <select class="form-select" v-model="item.product_id" required>
                        <option value="">Sélectionner...</option>
                        <option v-for="stock in stockProducts" :key="stock.product_id" :value="stock.product_id">
                          {{ stock.product?.item_designation }} ({{ stock.product?.item_code }})
                        </option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Quantité *</label>
                      <input type="number" step="0.01" class="form-control" 
                             v-model="item.quantity" required min="0.01">
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Prix Unitaire *</label>
                      <input type="number" step="0.01" class="form-control" 
                             v-model="item.unit_price" required min="0">
                    </div>
                    <div class="col-md-3">
                      <label class="form-label small">Devise *</label>
                      <select class="form-select" v-model="item.currency" required>
                        <option v-for="curr in CURRENCIES" :key="curr.value" :value="curr.value">
                          {{ curr.label }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-1 text-end">
                      <label class="form-label small d-block">&nbsp;</label>
                      <button type="button" class="btn btn-sm btn-outline-danger" 
                              @click="removeEntryItem(index)"
                              :disabled="entryForm.items.length === 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEntryModal">Annuler</button>
              <button type="submit" class="btn btn-success" :disabled="submitting || entryForm.items.length === 0">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                Enregistrer l'Entrée
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Sortie Multiple -->
    <div v-if="showExitModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-dash-circle me-2"></i>
              Sortie de Stock
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeExitModal"></button>
          </div>
          <form @submit.prevent="submitExit">
            <div class="modal-body">
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label class="form-label">Type de sortie *</label>
                  <select class="form-select" v-model="exitForm.movement_type" required>
                    <option value="SN">SN - Sortie Normale</option>
                    <option value="SP">SP - Sortie Perte</option>
                    <option value="SV">SV - Sortie Vol</option>
                    <option value="SD">SD - Sortie Désuétude</option>
                    <option value="SC">SC - Sortie Casse</option>
                    <option value="SAJ">SAJ - Sortie Ajustement</option>
                    <option value="ST">ST - Sortie Transfert</option>
                    <option value="SAU">SAU - Sortie Autres</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Date du mouvement *</label>
                  <input type="datetime-local" class="form-control" v-model="exitForm.movement_date" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Référence facture</label>
                  <input type="text" class="form-control" v-model="exitForm.invoice_ref">
                </div>
                <div class="col-md-12">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" v-model="exitForm.description" rows="2"></textarea>
                </div>
              </div>

              <hr>

              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>Produits à sortir</h6>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="addExitItem">
                  <i class="bi bi-plus-circle"></i> Ajouter un produit
                </button>
              </div>

              <div v-for="(item, index) in exitForm.items" :key="index" class="card mb-2">
                <div class="card-body">
                  <div class="row g-2 align-items-center">
                    <div class="col-md-6">
                      <label class="form-label small">Produit *</label>
                      <select class="form-select" v-model="item.product_id" required @change="updateExitStock(item)">
                        <option value="">Sélectionner...</option>
                        <option v-for="stock in warehouseStocks" :key="stock.product_id" :value="stock.product_id">
                          {{ stock.product?.item_designation }} - Stock: {{ stock.quantity }} {{ stock.product?.item_measurement_unit }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label small">Quantité *</label>
                      <input type="number" step="0.01" class="form-control" 
                             v-model="item.quantity" required min="0.01"
                             :max="item.available_stock">
                      <small class="text-muted">Max: {{ item.available_stock || 0 }}</small>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Prix</label>
                      <input type="text" class="form-control" v-model="item.unit_price" readonly>
                    </div>
                    <div class="col-md-1 text-end">
                      <label class="form-label small d-block">&nbsp;</label>
                      <button type="button" class="btn btn-sm btn-outline-danger" 
                              @click="removeExitItem(index)"
                              :disabled="exitForm.items.length === 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeExitModal">Annuler</button>
              <button type="submit" class="btn btn-danger" :disabled="submitting || exitForm.items.length === 0">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                Enregistrer la Sortie
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Transfert -->
    <div v-if="showTransferModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
              <i class="bi bi-arrow-left-right me-2"></i>
              Créer un Transfert entre Entrepôts
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeTransferModal"></button>
          </div>
          <form @submit.prevent="submitTransfer">
            <div class="modal-body">
              <div class="row g-3 mb-4">
                <div class="col-md-5">
                  <label class="form-label">Entrepôt Source *</label>
                  <select class="form-select" v-model="transferForm.source_warehouse_id" required @change="loadSourceStock">
                    <option value="">Sélectionner...</option>
                    <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
                  </select>
                </div>
                <div class="col-md-2 text-center pt-4">
                  <i class="bi bi-arrow-right fs-1 text-info"></i>
                </div>
                <div class="col-md-5">
                  <label class="form-label">Entrepôt Destination *</label>
                  <select class="form-select" v-model="transferForm.destination_warehouse_id" required>
                    <option value="">Sélectionner...</option>
                    <option v-for="wh in warehouses" :key="wh.id" :value="wh.id" 
                            :disabled="wh.id === transferForm.source_warehouse_id">
                      {{ wh.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea class="form-control" v-model="transferForm.notes" rows="2"></textarea>
              </div>

              <hr>

              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>Produits à transférer</h6>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="addTransferItem">
                  <i class="bi bi-plus-circle"></i> Ajouter un produit
                </button>
              </div>

              <div v-for="(item, index) in transferForm.items" :key="index" class="card mb-2">
                <div class="card-body">
                  <div class="row g-2 align-items-center">
                    <div class="col-md-6">
                      <label class="form-label small">Produit *</label>
                      <select class="form-select" v-model="item.product_id" required @change="updateTransferStock(item)">
                        <option value="">Sélectionner...</option>
                        <option v-for="stock in sourceStocks" :key="stock.product_id" :value="stock.product_id">
                          {{ stock.product?.item_designation }} - Stock: {{ stock.quantity }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small">Quantité *</label>
                      <input type="number" step="0.01" class="form-control" 
                             v-model="item.quantity" required min="0.01"
                             :max="item.available_stock">
                      <small class="text-muted">Disponible: {{ item.available_stock || 0 }}</small>
                    </div>
                    <div class="col-md-1 text-end">
                      <label class="form-label small d-block">&nbsp;</label>
                      <button type="button" class="btn btn-sm btn-outline-danger" 
                              @click="removeTransferItem(index)"
                              :disabled="transferForm.items.length === 1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeTransferModal">Annuler</button>
              <button type="submit" class="btn btn-info" :disabled="submitting || transferForm.items.length === 0">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                Créer le Transfert
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Historique des Mouvements -->
    <div v-if="showHistoryModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">
              <i class="bi bi-clock-history me-2"></i>
              Historique des Mouvements
              <span v-if="selectedWarehouseId" class="ms-2 badge bg-secondary">
                {{ warehouses.find(w => w.id == selectedWarehouseId)?.name }}
              </span>
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeHistoryModal"></button>
          </div>
          <div class="modal-body">
            <!-- Filtres -->
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <select class="form-select form-select-sm" v-model="historyFilters.movement_type" @change="fetchMovementsHistory">
                  <option value="">Tous les types</option>
                  <option v-for="(label, code) in MOUVEMENT_TYPES" :key="code" :value="code">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <input type="date" class="form-control form-control-sm" v-model="historyFilters.date_from" @change="fetchMovementsHistory">
              </div>
              <div class="col-md-4">
                <input type="date" class="form-control form-control-sm" v-model="historyFilters.date_to" @change="fetchMovementsHistory">
              </div>
            </div>

            <div v-if="loadingHistory" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Produit</th>
                    <th class="text-end">Quantité</th>
                    <th class="text-end">Prix</th>
                    <th>Référence</th>
                    <th>Statut OBR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mvt in movementsHistory" :key="mvt.id">
                    <td><small>{{ formatDate(mvt.item_movement_date) }}</small></td>
                    <td>
                      <span class="badge" :class="getMovementBadgeClass(mvt.item_movement_type)">
                        {{ mvt.item_movement_type }}
                      </span>
                    </td>
                    <td>
                      <small class="fw-bold">{{ mvt.item_designation }}</small><br>
                      <small class="text-muted">{{ mvt.item_code }}</small>
                    </td>
                    <td class="text-end">{{ mvt.item_quantity }} {{ mvt.item_measurement_unit }}</td>
                    <td class="text-end"><small>{{ mvt.item_purchase_or_sale_price }} {{ mvt.item_purchase_or_sale_currency }}</small></td>
                    <td><small>{{ mvt.item_movement_invoice_ref || '-' }}</small></td>
                    <td>
                      <span class="badge" :class="getObrStatusClass(mvt.obr_submission_status)">
                        {{ mvt.obr_submission_status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="movementsHistory.length === 0">
                    <td colspan="7" class="text-center text-muted py-4">Aucun mouvement</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Transferts en Attente -->
    <div v-if="showPendingModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title">
              <i class="bi bi-hourglass-split me-2"></i>
              Transferts en Attente d'Approbation
            </h5>
            <button type="button" class="btn-close" @click="closePendingModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingPending" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else>
              <div v-for="transfer in pendingTransfers" :key="transfer.id" class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ transfer.transfer_code }}</strong>
                    <span class="badge bg-secondary ms-2">{{ transfer.status }}</span>
                  </div>
                  <small class="text-muted">{{ formatDate(transfer.created_at) }}</small>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-5">
                      <strong>Source:</strong> {{ transfer.source_warehouse?.name }}
                    </div>
                    <div class="col-md-2 text-center">
                      <i class="bi bi-arrow-right text-success"></i>
                    </div>
                    <div class="col-md-5">
                      <strong>Destination:</strong> {{ transfer.destination_warehouse?.name }}
                    </div>
                  </div>

                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th class="text-end">Quantité</th>
                        <th class="text-end">Prix Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in transfer.items" :key="item.id">
                        <td>{{ item.product?.item_designation }}</td>
                        <td class="text-end">{{ item.quantity }}</td>
                        <td class="text-end">{{ item.unit_price }} {{ item.currency }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div v-if="transfer.notes" class="alert alert-info mb-3">
                    <strong>Notes:</strong> {{ transfer.notes }}
                  </div>

                  <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-success" @click="approveTransfer(transfer.id)">
                      <i class="bi bi-check-circle"></i> Approuver
                    </button>
                    <button class="btn btn-danger" @click="openRejectModal(transfer)">
                      <i class="bi bi-x-circle"></i> Rejeter
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="pendingTransfers.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-check-circle fs-1 d-block mb-2"></i>
                Aucun transfert en attente
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rejet -->
    <div v-if="showRejectModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Rejeter le Transfert</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeRejectModal"></button>
          </div>
          <form @submit.prevent="submitReject">
            <div class="modal-body">
              <p>Transfert: <strong>{{ selectedTransfer?.transfer_code }}</strong></p>
              <div class="mb-3">
                <label class="form-label">Raison du rejet *</label>
                <textarea class="form-control" v-model="rejectReason" rows="3" required></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeRejectModal">Annuler</button>
              <button type="submit" class="btn btn-danger" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                Confirmer le Rejet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const warehouseId = route.params.id;

const MOUVEMENT_TYPES = {
  'EN': 'Entrée Normale', 'ER': 'Entrée Retour', 'EI': 'Entrée Inventaire',
  'EAJ': 'Entrée Ajustement', 'ET': 'Entrée Transfert', 'EAU': 'Entrée Autres',
  'SN': 'Sortie Normale', 'SP': 'Sortie Perte', 'SV': 'Sortie Vol',
  'SD': 'Sortie Désuétude', 'SC': 'Sortie Casse',
  'SAJ': 'Sortie Ajustement', 'ST': 'Sortie Transfert', 'SAU': 'Sortie Autres'
};

const CURRENCIES = [
  { value: 'BIF', label: 'BIF - Franc Burundais' },
  { value: 'USD', label: 'USD - Dollar Américain' },
  { value: 'EUR', label: 'EUR - Euro' }
];

const loading = ref(false);
const loadingProducts = ref(false);
const loadingPending = ref(false);
const loadingHistory = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);

const warehouse = ref(null);
const warehouses = ref([]);
const products = ref([]);
const selectedWarehouseId = ref('');
const warehouseStocks = ref([]);
const stockProducts = ref([]);
const sourceStocks = ref([]);
const pendingTransfers = ref([]);
const pendingCount = ref(0);
const movementsHistory = ref([]);
const selectedProduct = ref(null);

// Recherche et pagination
const searchQuery = ref('');
const pagination = reactive({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: 0,
  to: 0
});

const showEntryModal = ref(false);
const showExitModal = ref(false);
const showTransferModal = ref(false);
const showPendingModal = ref(false);
const showRejectModal = ref(false);
const showHistoryModal = ref(false);
const selectedTransfer = ref(null);
const rejectReason = ref('');

// Pages visibles pour la pagination
const visiblePages = computed(() => {
  const pages = [];
  const total = pagination.last_page;
  const current = pagination.current_page;

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4);
    } else {
      start = Math.max(1, end - 4);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const entryForm = reactive({
  warehouse_id: '',
  movement_type: 'EN',
  movement_date: new Date().toISOString().slice(0, 16),
  invoice_ref: '',
  description: '',
  items: [{ product_id: '', quantity: '', unit_price: '', currency: 'BIF' }]
});

const exitForm = reactive({
  warehouse_id: '',
  movement_type: 'SN',
  movement_date: new Date().toISOString().slice(0, 16),
  invoice_ref: '',
  description: '',
  items: [{ product_id: '', quantity: '', available_stock: 0, unit_price: '' }]
});

const transferForm = reactive({
  source_warehouse_id: '',
  destination_warehouse_id: '',
  notes: '',
  items: [{ product_id: '', quantity: '', available_stock: 0 }]
});

const historyFilters = reactive({
  warehouse_id: '',
  movement_type: '',
  date_from: '',
  date_to: ''
});

onMounted(() => {
  fetchWarehouses();
  fetchProducts();
  fetchPendingCount();

  // Si un ID de stock est dans la route, charger directement ce stock
  if (warehouseId) {
    selectedWarehouseId.value = warehouseId;
    fetchWarehouse();
    fetchStockProducts();
  }
});

// Récupérer les infos de l'entrepôt
const fetchWarehouse = async () => {
  try {
    const resp = await api.get(`/stocks/${warehouseId}`);
    if (resp.data.success) {
      warehouse.value = resp.data.data;
    }
  } catch (err) {
    console.error(err);
  }
};

// Charger les produits du stock avec pagination et recherche
const fetchStockProducts = async (page = 1) => {
  if (!warehouseId) return;
  loadingProducts.value = true;
  try {
    const params = {
      page,
      per_page: pagination.per_page,
      search: searchQuery.value
    };
    const resp = await api.get(`warehouse-stock/${warehouseId}`, { params });
    if (resp.data.success) {
      // Gérer les données paginées ou non
      if (resp.data.data.data) {
        // Données paginées
        stockProducts.value = resp.data.data.data;
        pagination.current_page = resp.data.data.current_page;
        pagination.last_page = resp.data.data.last_page;
        pagination.total = resp.data.data.total;
        pagination.from = resp.data.data.from || 0;
        pagination.to = resp.data.data.to || 0;
      } else {
        // Données non paginées - les filtrer côté client
        const allProducts = resp.data.data;
        const filtered = searchQuery.value
          ? allProducts.filter(p =>
              p.product?.item_designation?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
              p.product?.item_code?.toLowerCase().includes(searchQuery.value.toLowerCase())
            )
          : allProducts;

        pagination.total = filtered.length;
        pagination.from = filtered.length > 0 ? 1 : 0;
        pagination.to = filtered.length;
        pagination.current_page = 1;
        pagination.last_page = 1;
        stockProducts.value = filtered;
      }
      // Mettre aussi à jour warehouseStocks pour les modales
      warehouseStocks.value = stockProducts.value;
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement des produits';
    console.error(err);
  } finally {
    loadingProducts.value = false;
  }
};

// Debounce pour la recherche
let debounceTimer = null;
const debouncedSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchStockProducts(1);
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchStockProducts(1);
};

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.last_page) {
    fetchStockProducts(page);
  }
};

const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

const fetchWarehouses = async () => {
  try {
    const resp = await api.get('warehouses');
    if (resp.data.success) warehouses.value = resp.data.data;
  } catch (err) {
    console.error(err);
  }
};

const fetchProducts = async () => {
  try {
    const resp = await api.get('products');
    products.value = resp.data.data;
  } catch (err) {
    console.error(err);
  }
};

const fetchWarehouseStock = async () => {
  if (!selectedWarehouseId.value) return;
  loading.value = true;
  try {
    const resp = await api.get(`warehouse-stock/${selectedWarehouseId.value}`);
    if (resp.data.success) warehouseStocks.value = resp.data.data;
  } catch (err) {
    error.value = 'Erreur lors du chargement du stock';
  } finally {
    loading.value = false;
  }
};

const fetchPendingCount = async () => {
  try {
    const resp = await api.get('warehouse-transfers/pending');
    if (resp.data.success) pendingCount.value = resp.data.data.data.length;
  } catch (err) {
    console.error(err);
  }
};

const openEntryModal = () => {
  entryForm.warehouse_id = selectedWarehouseId.value;
  showEntryModal.value = true;
};

const closeEntryModal = () => {
  showEntryModal.value = false;
  entryForm.items = [{ product_id: '', quantity: '', unit_price: '', currency: 'BIF' }];
};

const addEntryItem = () => {
  entryForm.items.push({ product_id: '', quantity: '', unit_price: '', currency: 'BIF' });
};

const removeEntryItem = (index) => {
  entryForm.items.splice(index, 1);
};

const submitEntry = async () => {
  submitting.value = true;
  try {
    const resp = await api.post('stock-entries', entryForm);
    if (resp.data.success) {
      successMessage.value = 'Entrée de stock enregistrée avec succès';
      closeEntryModal();
      if (warehouseId) {
        fetchStockProducts(pagination.current_page);
      } else {
        fetchWarehouseStock();
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    submitting.value = false;
  }
};

const openExitModal = () => {
  exitForm.warehouse_id = selectedWarehouseId.value;
  showExitModal.value = true;
};

const closeExitModal = () => {
  showExitModal.value = false;
  exitForm.items = [{ product_id: '', quantity: '', available_stock: 0, unit_price: '' }];
};

const addExitItem = () => {
  exitForm.items.push({ product_id: '', quantity: '', available_stock: 0, unit_price: '' });
};

const removeExitItem = (index) => {
  exitForm.items.splice(index, 1);
};

const updateExitStock = (item) => {
  const stock = warehouseStocks.value.find(s => s.product_id == item.product_id);
  if (stock) {
    item.available_stock = stock.quantity;
    item.unit_price = stock.unit_price + ' ' + stock.currency;
  }
};

const submitExit = async () => {
  submitting.value = true;
  try {
    const resp = await api.post('stock-exits', exitForm);
    if (resp.data.success) {
      successMessage.value = 'Sortie de stock enregistrée avec succès';
      closeExitModal();
      if (warehouseId) {
        fetchStockProducts(pagination.current_page);
      } else {
        fetchWarehouseStock();
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    submitting.value = false;
  }
};

const openTransferModal = () => {
  showTransferModal.value = true;
};

const closeTransferModal = () => {
  showTransferModal.value = false;
  transferForm.source_warehouse_id = '';
  transferForm.destination_warehouse_id = '';
  transferForm.notes = '';
  transferForm.items = [{ product_id: '', quantity: '', available_stock: 0 }];
  sourceStocks.value = [];
};

const loadSourceStock = async () => {
  if (!transferForm.source_warehouse_id) return;
  try {
    const resp = await api.get(`warehouse-stock/${transferForm.source_warehouse_id}`);
    if (resp.data.success) sourceStocks.value = resp.data.data;
  } catch (err) {
    console.error(err);
  }
};

const addTransferItem = () => {
  transferForm.items.push({ product_id: '', quantity: '', available_stock: 0 });
};

const removeTransferItem = (index) => {
  transferForm.items.splice(index, 1);
};

const updateTransferStock = (item) => {
  const stock = sourceStocks.value.find(s => s.product_id == item.product_id);
  if (stock) item.available_stock = stock.quantity;
};

const submitTransfer = async () => {
  submitting.value = true;
  try {
    const resp = await api.post('warehouse-transfers', transferForm);
    if (resp.data.success) {
      successMessage.value = 'Transfert créé avec succès. En attente d\'approbation.';
      closeTransferModal();
      fetchPendingCount();
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la création du transfert';
  } finally {
    submitting.value = false;
  }
};

const showPendingTransfers = async () => {
  showPendingModal.value = true;
  loadingPending.value = true;
  try {
    const resp = await api.get('warehouse-transfers/pending');
    if (resp.data.success) pendingTransfers.value = resp.data.data.data;
  } catch (err) {
    error.value = 'Erreur lors du chargement des transferts';
  } finally {
    loadingPending.value = false;
  }
};

const closePendingModal = () => {
  showPendingModal.value = false;
};

const approveTransfer = async (transferId) => {
  if (!confirm('Approuver ce transfert ?')) return;
  try {
    const resp = await api.post(`warehouse-transfers/${transferId}/approve`);
    if (resp.data.success) {
      successMessage.value = 'Transfert approuvé avec succès';
      showPendingTransfers();
      if (selectedWarehouseId.value) fetchWarehouseStock();
      fetchPendingCount();
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'approbation';
  }
};

const openRejectModal = (transfer) => {
  selectedTransfer.value = transfer;
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  showRejectModal.value = false;
  selectedTransfer.value = null;
  rejectReason.value = '';
};

const submitReject = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(`warehouse-transfers/${selectedTransfer.value.id}/reject`, {
      rejection_reason: rejectReason.value
    });
    if (resp.data.success) {
      successMessage.value = 'Transfert rejeté';
      closeRejectModal();
      showPendingTransfers();
      fetchPendingCount();
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du rejet';
  } finally {
    submitting.value = false;
  }
};

const showMovementsHistory = () => {
  historyFilters.warehouse_id = selectedWarehouseId.value;
  showHistoryModal.value = true;
  fetchMovementsHistory();
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
};

const fetchMovementsHistory = async () => {
  loadingHistory.value = true;
  try {
    const resp = await api.get('stock-movements', { params: historyFilters });
    if (resp.data.success) movementsHistory.value = resp.data.data.data;
  } catch (err) {
    error.value = 'Erreur lors du chargement de l\'historique';
  } finally {
    loadingHistory.value = false;
  }
};

const quickEntry = (stock) => {
  entryForm.warehouse_id = selectedWarehouseId.value;
  entryForm.items = [{
    product_id: stock.product_id,
    quantity: '',
    unit_price: stock.unit_price,
    currency: stock.currency
  }];
  showEntryModal.value = true;
};

const quickExit = (stock) => {
  exitForm.warehouse_id = selectedWarehouseId.value;
  exitForm.items = [{
    product_id: stock.product_id,
    quantity: '',
    available_stock: stock.quantity,
    unit_price: stock.unit_price + ' ' + stock.currency
  }];
  showExitModal.value = true;
};

const getMovementBadgeClass = (type) => {
  return type.startsWith('E') ? 'bg-success' : 'bg-danger';
};

const getObrStatusClass = (status) => {
  const classes = {
    'PENDING': 'bg-warning',
    'SENT': 'bg-info',
    'ACCEPTED': 'bg-success',
    'REJECTED': 'bg-danger'
  };
  return classes[status] || 'bg-secondary';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR');
};
</script>

<style scoped>
.card { border: none; border-radius: 12px; }
.modal { overflow-y: auto; }
</style>