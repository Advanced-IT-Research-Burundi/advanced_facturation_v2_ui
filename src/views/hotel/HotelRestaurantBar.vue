<template>
  <div class="hotel-page">
    <HotelHeader modelValue="RestaurantBar" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-cup-straw me-2 text-primary"></i>Restaurant-Bar
        </h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="loadAll">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button v-if="canOrder" class="btn btn-primary" @click="openNewOrderModal">
            <i class="bi bi-plus-lg me-1"></i> Nouvelle Commande
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="row mb-4 g-3">
        <div class="col-6 col-md-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Tables libres</div>
                  <div class="fs-3 fw-bold">{{ stats.freeTables }}</div>
                </div>
                <i class="bi bi-check-circle fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-danger text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Tables occupées</div>
                  <div class="fs-3 fw-bold">{{ stats.occupiedTables }}</div>
                </div>
                <i class="bi bi-people-fill fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-warning h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Commandes en cours</div>
                  <div class="fs-3 fw-bold">{{ stats.activeOrders }}</div>
                </div>
                <i class="bi bi-clock-history fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">CA aujourd'hui</div>
                  <div class="fs-6 fw-bold">{{ formatCurrency(stats.revenueToday) }}</div>
                </div>
                <i class="bi bi-cash-stack fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs: Tables / Commandes / Menu / Stock Bar -->
      <ul class="nav nav-pills mb-3">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'tables' }" @click="activeTab = 'tables'">
            <i class="bi bi-grid me-1"></i>Tables
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
            <i class="bi bi-list-check me-1"></i>Commandes
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'menu' }" @click="activeTab = 'menu'">
            <i class="bi bi-journal-text me-1"></i>Menu & Boissons
          </button>
        </li>
        <li v-if="canManage" class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">
            <i class="bi bi-box-seam me-1"></i>Stock Bar
          </button>
        </li>
        <li v-if="canManage" class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'movements' }" @click="activeTab = 'movements'; loadMovements()">
            <i class="bi bi-arrow-left-right me-1"></i>Entrées / Sorties
          </button>
        </li>
      </ul>

      <!-- TAB: Tables — visible en lecture pour hotel_bar_order, gestion complète pour hotel_bar -->
      <div v-if="activeTab === 'tables'">
        <div v-if="canManage" class="d-flex justify-content-end mb-3">
          <button class="btn btn-sm btn-outline-primary" @click="openTableModal(null)">
            <i class="bi bi-plus me-1"></i>Ajouter une table
          </button>
        </div>
        <div class="row g-3">
          <div
            v-for="table in tables"
            :key="table.id"
            class="col-6 col-md-4 col-lg-3"
          >
            <div
              class="card text-center table-card"
              :class="getTableCardClass(table.status)"
              style="cursor: pointer;"
              @click="selectTable(table)"
            >
              <div class="card-body p-3">
                <i class="bi bi-table fs-2 mb-1 d-block"></i>
                <h6 class="card-title mb-1">Table {{ table.number }}</h6>
                <span class="badge" :class="getTableBadgeClass(table.status)">
                  {{ getTableStatusLabel(table.status) }}
                </span>
                <div class="small text-muted mt-1">
                  <i class="bi bi-people me-1"></i>{{ table.seats }} places
                </div>
                <div class="small text-muted" v-if="table.location">
                  <i class="bi bi-geo-alt me-1"></i>{{ table.location }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="tables.length === 0" class="col-12 text-center py-5 text-muted">
            <i class="bi bi-table fs-1 d-block mb-2"></i>Aucune table configurée
          </div>
        </div>
      </div>

      <!-- TAB: Orders -->
      <div v-if="activeTab === 'orders'">
        <div class="card">
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Table</th>
                  <th>Client</th>
                  <th>Articles</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Heure</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id">
                  <td>
                    <span class="fw-bold">{{ order.location_label || (order.is_room_service ? 'Chambre ' + order.room_number : 'Table ' + order.table_number) }}</span>
                    <span v-if="order.is_room_service" class="badge bg-warning text-dark ms-1 small">Room Service</span>
                  </td>
                  <td>{{ order.client_name || '—' }}</td>
                  <td>
                    <span class="badge bg-secondary">{{ order.items.length }} article(s)</span>
                  </td>
                  <td class="fw-semibold text-primary">{{ formatCurrency(order.total) }}</td>
                  <td>
                    <span class="badge" :class="getOrderBadgeClass(order.status)">
                      {{ getOrderStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="small text-muted">{{ order.time }}</td>
                  <td>
                    <div class="d-flex gap-1 flex-wrap">
                      <button class="btn btn-sm btn-outline-primary" @click="viewOrder(order)" title="Voir">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-dark" @click="handlePrintA4(order)" title="Imprimer A4">
                        <i class="bi bi-printer me-1"></i>A4
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" @click="handlePrintPOS(order)" title="Ticket POS">
                        <i class="bi bi-receipt me-1"></i>POS
                      </button>
                      <button
                        v-if="order.status === 'pending'"
                        class="btn btn-sm btn-success"
                        @click="updateOrderStatus(order, 'preparing')"
                        title="Démarrer"
                      >
                        <i class="bi bi-check"></i>
                      </button>
                      <button
                        v-if="order.status === 'preparing'"
                        class="btn btn-sm btn-primary"
                        @click="updateOrderStatus(order, 'served')"
                        title="Servir"
                      >
                        <i class="bi bi-box-arrow-up"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="orders.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">
                    <i class="bi bi-list-check fs-1 d-block mb-2"></i>Aucune commande en cours
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: Menu (visible en lecture pour hotel_bar_order, gestion complète pour hotel_bar) -->
      <div v-if="activeTab === 'menu'">
        <!-- Section : Articles Bar -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 fw-bold"><i class="bi bi-cup-straw me-2 text-primary"></i>Articles Bar & Boissons</h6>
          <button v-if="canManage" class="btn btn-sm btn-outline-primary" @click="openMenuItemModal(null)">
            <i class="bi bi-plus me-1"></i>Ajouter un article
          </button>
        </div>
        <div class="row g-3 mb-4">
          <div v-for="item in menuItems" :key="'menu-'+item.id" class="col-12 col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="badge mb-1" :class="getCategoryBadge(item.category)">{{ item.category }}</span>
                    <h6 class="card-title mb-1">{{ item.name }}</h6>
                    <p class="small text-muted mb-0" v-if="item.description">{{ item.description }}</p>
                  </div>
                  <div class="text-end">
                    <div class="fw-bold text-primary">{{ formatCurrency(item.price) }}</div>
                    <span class="badge" :class="item.available ? 'bg-success' : 'bg-secondary'">
                      {{ item.available ? 'Disponible' : 'Indisponible' }}
                    </span>
                  </div>
                </div>
                <div v-if="canManage" class="d-flex gap-1 mt-2">
                  <button class="btn btn-sm btn-outline-primary" @click="openMenuItemModal(item)">
                    <i class="bi bi-pencil"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="menuItems.length === 0" class="col-12 text-center text-muted py-3">Aucun article bar</div>
        </div>

        <!-- Section : Plats Cuisine -->
        <div class="d-flex align-items-center mb-3 border-top pt-3">
          <h6 class="mb-0 fw-bold"><i class="bi bi-fire me-2 text-danger"></i>Plats Cuisine</h6>
        </div>
        <div class="row g-3">
          <div v-for="dish in dishes" :key="'dish-'+dish.id" class="col-12 col-md-6 col-lg-4">
            <div class="card h-100" :class="dish.available ? '' : 'opacity-50'">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="badge mb-1 bg-danger">{{ dish.category }}</span>
                    <h6 class="card-title mb-1">{{ dish.name }}</h6>
                    <p class="small text-muted mb-0" v-if="dish.description">{{ dish.description }}</p>
                    <p class="small text-muted mb-0" v-if="dish.prep_time">
                      <i class="bi bi-clock me-1"></i>{{ dish.prep_time }} min
                    </p>
                  </div>
                  <div class="text-end">
                    <div class="fw-bold text-primary">{{ formatCurrency(dish.price) }}</div>
                    <span class="badge" :class="dish.available ? 'bg-success' : 'bg-secondary'">
                      {{ dish.available ? 'Disponible' : 'Indisponible' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="dishes.length === 0" class="col-12 text-center text-muted py-3">Aucun plat cuisine</div>
        </div>
      </div>

      <!-- TAB: Stock Bar -->
      <div v-if="activeTab === 'stock' && canManage">
        <div class="d-flex gap-2 justify-content-between mb-3 align-items-center">
          <input v-model="barStockSearch" type="text" class="form-control form-control-sm" style="max-width:260px" placeholder="Rechercher un article..." />
          <button class="btn btn-sm btn-outline-primary" @click="openBarStockModal(null)">
            <i class="bi bi-plus me-1"></i>Ajouter un article en stock
          </button>
        </div>
        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Article</th>
                  <th>Quantité</th>
                  <th>Unité</th>
                  <th>Seuil d'alerte</th>
                  <th>Prix d'achat</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredBarStockItems" :key="item.id">
                  <td class="fw-semibold">{{ item.name }}</td>
                  <td>{{ parseFloat(item.quantity) }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ parseFloat(item.alert_threshold) }}</td>
                  <td>{{ parseFloat(item.purchase_price || 0).toLocaleString('fr-FR') }} BIF</td>
                  <td>
                    <span class="badge" :class="parseFloat(item.quantity) <= parseFloat(item.alert_threshold) ? 'bg-danger' : 'bg-success'">
                      {{ parseFloat(item.quantity) <= parseFloat(item.alert_threshold) ? 'Stock faible' : 'OK' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" @click="openBarStockModal(item)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredBarStockItems.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">Aucun article en stock</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: Mouvements de stock bar -->
      <div v-if="activeTab === 'movements' && canManage">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 fw-bold"><i class="bi bi-arrow-left-right me-2 text-primary"></i>Entrées / Sorties — Stock Bar</h6>
          <button class="btn btn-primary btn-sm" @click="openMovementModal('bar')">
            <i class="bi bi-plus me-1"></i>Nouveau mouvement
          </button>
        </div>
        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Article</th>
                  <th>Type</th>
                  <th>Qté avant</th>
                  <th>Qté mouvement</th>
                  <th>Qté après</th>
                  <th class="text-end">Montant</th>
                  <th>Raison</th>
                  <th>Par</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="stockMovements.length === 0">
                  <td colspan="9" class="text-center py-4 text-muted">Aucun mouvement</td>
                </tr>
                <tr v-for="m in stockMovements" :key="m.id">
                  <td class="small text-muted">{{ formatDateTime(m.created_at) }}</td>
                  <td class="fw-semibold">{{ m.stock_item_name }}</td>
                  <td>
                    <span class="badge" :class="m.movement_type === 'in' ? 'bg-success' : 'bg-danger'">
                      {{ m.movement_type === 'in' ? 'Entrée' : 'Sortie' }}
                    </span>
                  </td>
                  <td>{{ parseFloat(m.quantity_before) }}</td>
                  <td :class="m.movement_type === 'in' ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    {{ m.movement_type === 'in' ? '+' : '-' }}{{ parseFloat(m.quantity) }}
                  </td>
                  <td>{{ parseFloat(m.quantity_after) }}</td>
                  <td class="text-end fw-semibold" :class="m.movement_type === 'in' ? 'text-success' : 'text-danger'">
                    {{ m.unit_price ? new Intl.NumberFormat('fr-FR').format(parseFloat(m.quantity) * parseFloat(m.unit_price)) + ' ' + (m.currency || 'BIF') : '—' }}
                  </td>
                  <td class="small">{{ m.reason || '—' }}</td>
                  <td class="small text-muted">{{ m.user?.name || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL: Mouvement de stock -->
      <div v-if="showMovementModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showMovementModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 480px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0 fw-bold">
              <i class="bi bi-arrow-left-right me-2 text-primary"></i>
              Mouvement de stock — {{ movementForm.stock_type === 'bar' ? 'Bar' : 'Cuisine' }}
            </h5>
            <button class="btn-close" @click="showMovementModal = false"></button>
          </div>
          <div v-if="movementError" class="alert alert-danger py-2 small">{{ movementError }}</div>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-semibold">Type de mouvement <span class="text-danger">*</span></label>
              <div class="d-flex gap-2">
                <button type="button" class="btn flex-fill" :class="movementForm.movement_type === 'in' ? 'btn-success' : 'btn-outline-success'" @click="movementForm.movement_type = 'in'">
                  <i class="bi bi-arrow-down-circle me-1"></i>Entrée (réception)
                </button>
                <button type="button" class="btn flex-fill" :class="movementForm.movement_type === 'out' ? 'btn-danger' : 'btn-outline-danger'" @click="movementForm.movement_type = 'out'">
                  <i class="bi bi-arrow-up-circle me-1"></i>Sortie (perte/ajust.)
                </button>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Ingrédient <span class="text-danger">*</span></label>
              <select v-model="movementForm.stock_item_id" class="form-select" @change="onMovementItemChange">
                <option value="">Sélectionner...</option>
                <option v-for="item in movementStockList" :key="item.id" :value="item.id">
                  {{ item.name }} ({{ parseFloat(item.quantity) }} {{ item.unit }})
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Quantité <span class="text-danger">*</span></label>
              <input v-model.number="movementForm.quantity" type="number" class="form-control" min="0.001" step="any" />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Prix Unitaire (BIF)</label>
              <input v-model.number="movementForm.unit_price" type="number" class="form-control" min="0" step="0.01" />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Référence</label>
              <input v-model="movementForm.reference" type="text" class="form-control" placeholder="N° bon livraison..." />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Devise</label>
              <select v-model="movementForm.currency" class="form-select">
                <option value="BIF">BIF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Raison</label>
              <input v-model="movementForm.reason" type="text" class="form-control" placeholder="Ex: Livraison fournisseur, perte, ajustement..." />
            </div>
            <div v-if="movementForm.movement_type === 'out'" class="col-12">
              <div class="form-check form-switch">
                <input v-model="movementForm.is_loss" type="checkbox" class="form-check-input" id="isLossBar" />
                <label class="form-check-label fw-semibold" for="isLossBar">
                  <i class="bi bi-exclamation-triangle text-warning me-1"></i>Perte de stock (enregistrer en caisse)
                </label>
              </div>
              <small v-if="movementForm.is_loss" class="text-warning">
                Le montant sera enregistré comme dépense/perte dans la caisse {{ movementForm.stock_type === 'bar' ? 'Bar' : 'Restaurant' }}
              </small>
            </div>
            <div v-if="movementForm.quantity && movementForm.unit_price" class="col-12">
              <div class="alert py-2 mb-0" :class="movementForm.movement_type === 'in' ? 'alert-success' : (movementForm.is_loss ? 'alert-warning' : 'alert-danger')">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="fw-semibold">Montant Total {{ movementForm.is_loss ? '(Perte)' : '' }} :</span>
                  <span class="fw-bold fs-5">
                    {{ new Intl.NumberFormat('fr-FR').format(movementForm.quantity * movementForm.unit_price) }}
                    {{ movementForm.currency }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" @click="showMovementModal = false">Annuler</button>
            <button class="btn btn-primary" @click="saveMovement" :disabled="savingMovement">
              <span v-if="savingMovement" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: Table detail / New order -->
      <div v-if="selectedTable" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="selectedTable = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 420px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">Table {{ selectedTable.number }}</h5>
            <button class="btn-close" @click="selectedTable = null"></button>
          </div>
          <p><strong>Statut :</strong> {{ getTableStatusLabel(selectedTable.status) }}</p>
          <p><strong>Places :</strong> {{ selectedTable.seats }}</p>
          <p v-if="selectedTable.location"><strong>Zone :</strong> {{ selectedTable.location }}</p>
          <div class="d-flex gap-2 flex-wrap mt-3">
            <button v-if="selectedTable.status === 'free' && canOrder" class="btn btn-primary btn-sm" @click="openNewOrderModal(selectedTable)">
              <i class="bi bi-plus me-1"></i>Nouvelle commande
            </button>
            <button v-if="canManage" class="btn btn-outline-primary btn-sm" @click="openTableModal(selectedTable)">
              <i class="bi bi-pencil me-1"></i>Modifier
            </button>
            <button v-if="canManage" class="btn btn-outline-danger btn-sm ms-auto" @click="deleteTable(selectedTable)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: New Order -->
      <div v-if="showOrderModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showOrderModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">
              <i class="bi bi-basket me-2"></i>Nouvelle Commande
              <span v-if="orderForm.table" class="text-muted small ms-2">— Table {{ orderForm.table.number }}</span>
            </h5>
            <button class="btn-close" @click="showOrderModal = false"></button>
          </div>
          <div class="row g-3 mb-3">
            <!-- Type : Table ou Chambre -->
            <div class="col-12">
              <div class="btn-group w-100" role="group">
                <input type="radio" class="btn-check" id="type-table" value="table" v-model="orderForm.order_type" />
                <label class="btn btn-outline-primary" for="type-table">
                  <i class="bi bi-grid me-1"></i>Table Restaurant
                </label>
                <input type="radio" class="btn-check" id="type-room" value="room" v-model="orderForm.order_type" />
                <label class="btn btn-outline-warning" for="type-room">
                  <i class="bi bi-door-closed me-1"></i>Room Service (Chambre)
                </label>
              </div>
            </div>

            <!-- Sélecteur table OU numéro chambre -->
            <div class="col-md-6">
              <template v-if="orderForm.order_type === 'table'">
                <label class="form-label small fw-bold">Table</label>
                <select v-model="orderForm.table_id" class="form-select">
                  <option v-for="t in tables" :key="t.id" :value="t.id">
                    Table {{ t.number }} — {{ t.status === 'free' ? 'Libre' : 'Occupée' }}
                  </option>
                </select>
              </template>
              <template v-else>
                <label class="form-label small fw-bold">N° Chambre <span class="text-danger">*</span></label>
                <input
                  v-model="orderForm.room_number"
                  type="text"
                  class="form-control"
                  placeholder="Ex: 101, Suite A..."
                  required
                />
              </template>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Nom du client</label>
              <input v-model="orderForm.client_name" type="text" class="form-control" placeholder="Optionnel" />
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Articles commandés</label>
            <div class="row g-2 mb-2">
              <div class="col-3">
                <select v-model="newItem.type" class="form-select form-select-sm">
                  <option value="menu">Bar</option>
                  <option value="dish">Cuisine</option>
                </select>
              </div>
              <div class="col-5">
                <select v-if="newItem.type === 'menu'" v-model="newItem.menu_item_id" class="form-select form-select-sm">
                  <option value="">— Article bar —</option>
                  <option v-for="m in availableMenuItems" :key="m.id" :value="m.id">{{ m.name }} ({{ formatCurrency(m.price) }})</option>
                </select>
                <select v-else v-model="newItem.dish_id" class="form-select form-select-sm">
                  <option value="">— Plat cuisine —</option>
                  <option v-for="d in availableDishes" :key="d.id" :value="d.id">{{ d.name }} ({{ formatCurrency(d.price) }})</option>
                </select>
              </div>
              <div class="col-2">
                <input v-model.number="newItem.qty" type="number" class="form-control form-control-sm" min="1" placeholder="Qté" />
              </div>
              <div class="col-2">
                <button type="button" class="btn btn-sm btn-primary w-100" @click="addItemToOrder">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
            <div class="list-group">
              <div v-for="(item, idx) in orderForm.items" :key="idx" class="list-group-item py-2 d-flex justify-content-between align-items-center">
                <span>{{ item.name }} × {{ item.qty }}</span>
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-semibold text-primary">{{ formatCurrency(item.price * item.qty) }}</span>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="orderForm.items.splice(idx, 1)">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
              <div v-if="orderForm.items.length === 0" class="list-group-item text-muted text-center py-3">
                Aucun article ajouté
              </div>
            </div>
            <div class="text-end mt-2 fw-bold">
              Total : {{ formatCurrency(orderTotal) }}
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="showOrderModal = false">Annuler</button>
            <button class="btn btn-primary" @click="saveOrder" :disabled="savingOrder || orderForm.items.length === 0 || (orderForm.order_type === 'room' && !orderForm.room_number)">
              <span v-if="savingOrder" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer la commande
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: View Order -->
      <div v-if="viewingOrder" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="viewingOrder = null">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 480px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">Commande — Table {{ viewingOrder.table_number }}</h5>
            <button class="btn-close" @click="viewingOrder = null"></button>
          </div>
          <div class="list-group mb-3">
            <div v-for="item in viewingOrder.items" :key="item.name" class="list-group-item py-2 d-flex justify-content-between">
              <span>{{ item.name }} × {{ item.qty }}</span>
              <span class="fw-semibold text-primary">{{ formatCurrency(item.price * item.qty) }}</span>
            </div>
          </div>
          <div class="text-end fw-bold fs-6 mb-3">Total : {{ formatCurrency(viewingOrder.total) }}</div>
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span class="badge fs-6" :class="getOrderBadgeClass(viewingOrder.status)">{{ getOrderStatusLabel(viewingOrder.status) }}</span>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-outline-dark btn-sm" @click="handlePrintA4(viewingOrder)">
                <i class="bi bi-printer me-1"></i>A4
              </button>
              <button class="btn btn-outline-secondary btn-sm" @click="handlePrintPOS(viewingOrder)">
                <i class="bi bi-receipt me-1"></i>POS
              </button>
              <button v-if="viewingOrder.status === 'served'" class="btn btn-success btn-sm" @click="closeOrder(viewingOrder)">
                <i class="bi bi-cash-coin me-1"></i>Encaisser
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: Table add/edit -->
      <div v-if="showTableModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showTableModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 440px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingTable ? 'Modifier Table' : 'Nouvelle Table' }}</h5>
            <button class="btn-close" @click="showTableModal = false"></button>
          </div>
          <form @submit.prevent="saveTable">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Numéro <span class="text-danger">*</span></label>
                <input v-model="tableForm.number" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Places <span class="text-danger">*</span></label>
                <input v-model.number="tableForm.seats" type="number" class="form-control" required min="1" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Zone</label>
                <input v-model="tableForm.location" type="text" class="form-control" placeholder="Terrasse, intérieur..." />
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showTableModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: Menu item -->
      <div v-if="showMenuModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showMenuModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 500px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingMenuItem ? 'Modifier Article' : 'Nouvel Article' }}</h5>
            <button class="btn-close" @click="showMenuModal = false"></button>
          </div>
          <form @submit.prevent="saveMenuItem">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label small fw-bold">Nom <span class="text-danger">*</span></label>
                <input v-model="menuForm.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Catégorie</label>
                <select v-model="menuForm.category" class="form-select">
                  <option value="Plat">Plat</option>
                  <option value="Boisson">Boisson</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Entrée">Entrée</option>
                  <option value="Alcool">Alcool</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Prix <span class="text-danger">*</span></label>
                <input v-model.number="menuForm.price" type="number" class="form-control" required min="0" step="0.01" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Disponibilité</label>
                <select v-model="menuForm.available" class="form-select">
                  <option :value="true">Disponible</option>
                  <option :value="false">Indisponible</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Description</label>
                <textarea v-model="menuForm.description" class="form-control" rows="2"></textarea>
              </div>
              <!-- Lien stock bar -->
              <div class="col-12 border-top pt-3">
                <label class="form-label small fw-bold text-muted">
                  <i class="bi bi-box-seam me-1"></i>Lier à un stock bar (optionnel)
                </label>
              </div>
              <div class="col-md-7">
                <label class="form-label small">Article en stock</label>
                <select v-model="menuForm.bar_stock_id" class="form-select form-select-sm">
                  <option :value="null">— Aucun stock lié —</option>
                  <option v-for="s in barStockItems" :key="s.id" :value="s.id">
                    {{ s.name }} ({{ parseFloat(s.quantity) }} {{ s.unit }} dispo)
                  </option>
                </select>
              </div>
              <div class="col-md-5">
                <label class="form-label small">Unités consommées par commande</label>
                <input v-model.number="menuForm.stock_per_serving" type="number" class="form-control form-control-sm" min="0" step="0.01" />
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showMenuModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: Bar Stock add/edit -->
      <div v-if="showBarStockModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showBarStockModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 460px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0"><i class="bi bi-box-seam me-2"></i>{{ editingBarStock ? 'Modifier stock' : 'Nouvel article en stock' }}</h5>
            <button class="btn-close" @click="showBarStockModal = false"></button>
          </div>
          <form @submit.prevent="saveBarStock">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small fw-bold">Nom <span class="text-danger">*</span></label>
                <input v-model="barStockForm.name" type="text" class="form-control" required placeholder="Ex: Heineken 33cl, Coca-Cola..." />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Quantité</label>
                <input v-model.number="barStockForm.quantity" type="number" class="form-control" min="0" step="0.01" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Unité</label>
                <input v-model="barStockForm.unit" type="text" class="form-control" placeholder="bouteille, pcs, L..." />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Seuil d'alerte</label>
                <input v-model.number="barStockForm.alert_threshold" type="number" class="form-control" min="0" step="0.01" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Prix d'achat (BIF)</label>
                <input v-model.number="barStockForm.purchase_price" type="number" class="form-control" min="0" step="0.01" placeholder="0" />
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showBarStockModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useStore } from 'vuex';
import api from '@/services/api';
import HotelHeader from './HotelHeader.vue';
import { useInvoicePrint } from '@/composables/useInvoicePrint';
import { useToast } from '@/composables/useToast';

const store = useStore();
const toast = useToast();
const currentUser = computed(() => store.state.auth.user);
const company = computed(() => currentUser.value?.company ?? null);

const isAdmin = computed(() => {
  const roles = currentUser.value?.roles || [];
  return roles.some((r) => ['admin', 'super_admin'].includes(r.name));
});
const hasPermission = (perm) => {
  if (isAdmin.value) return true;
  const roles = currentUser.value?.roles || [];
  return roles.some((r) => r.permissions?.includes(perm));
};
/** Peut gérer le menu, les tables, etc. */
const canManage = computed(() => hasPermission('hotel_bar'));
/** Peut passer des commandes (hotel_bar ou hotel_bar_order) */
const canOrder = computed(() => hasPermission('hotel_bar') || hasPermission('hotel_bar_order'));

const { printA4, printPOS, buildBarOrderInvoice } = useInvoicePrint();
const handlePrintA4 = (order) => printA4(buildBarOrderInvoice(order, company.value), company.value);
const handlePrintPOS = (order) => printPOS(buildBarOrderInvoice(order, company.value), company.value);

const activeTab = ref('tables');
const loading = ref(false);
const tables = ref([]);
const orders = ref([]);
const menuItems = ref([]);
const dishes = ref([]);
const barStockItems = ref([]);
const barStockSearch = ref('');
const filteredBarStockItems = computed(() =>
  barStockSearch.value.trim()
    ? barStockItems.value.filter((i) => i.name.toLowerCase().includes(barStockSearch.value.toLowerCase()))
    : barStockItems.value,
);
const selectedTable = ref(null);
const viewingOrder = ref(null);

const showOrderModal = ref(false);
const savingOrder = ref(false);
const showTableModal = ref(false);
const editingTable = ref(null);
const showMenuModal = ref(false);
const editingMenuItem = ref(null);
const showBarStockModal = ref(false);
const editingBarStock = ref(null);
const barStockForm = reactive({ name: '', quantity: 0, unit: 'bouteille', alert_threshold: 5, purchase_price: 0 });

const stockMovements = ref([]);
const showMovementModal = ref(false);
const savingMovement = ref(false);
const movementError = ref('');
const movementForm = reactive({
  stock_type: 'bar',
  stock_item_id: '',
  movement_type: 'in',
  quantity: 1,
  unit_price: 0,
  currency: 'BIF',
  is_loss: false,
  reason: '',
  reference: '',
});

const newItem = reactive({ type: 'menu', menu_item_id: '', dish_id: '', qty: 1 });

const orderForm = reactive({
  order_type: 'table',
  table: null,
  table_id: null,
  room_number: '',
  client_name: '',
  items: [],
});

const tableForm = reactive({ number: '', seats: 4, location: '' });
const menuForm = reactive({ name: '', category: 'Plat', price: 0, available: true, description: '', bar_stock_id: null, stock_per_serving: 1 });

const stats = computed(() => ({
  freeTables: tables.value.filter((t) => t.status === 'free').length,
  occupiedTables: tables.value.filter((t) => t.status === 'occupied').length,
  activeOrders: orders.value.filter((o) => ['pending', 'preparing', 'served'].includes(o.status)).length,
  revenueToday: orders.value
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total ?? 0), 0),
}));

const availableMenuItems = computed(() => menuItems.value.filter((m) => m.available));
const availableDishes = computed(() => dishes.value.filter((d) => d.available));

const orderTotal = computed(() => orderForm.items.reduce((s, i) => s + i.price * i.qty, 0));

const loadAll = async () => {
  loading.value = true;
  try {
    const [tablesRes, ordersRes, menuRes, dishesRes, barStockRes] = await Promise.all([
      api.get('/hotel/restaurant-tables'),
      api.get('/hotel/restaurant-orders', { params: { today: true } }),
      api.get('/hotel/menu-items'),
      api.get('/hotel/dishes'),
      api.get('/hotel/bar-stock'),
    ]);
    tables.value = tablesRes.data.data;
    orders.value = ordersRes.data.data;
    menuItems.value = menuRes.data.data;
    dishes.value = dishesRes.data.data;
    barStockItems.value = barStockRes.data.data;
  } catch (e) {
    console.error('Erreur chargement restaurant-bar:', e);
  } finally {
    loading.value = false;
  }
};

const selectTable = (table) => { selectedTable.value = table; };

const openNewOrderModal = (table = null) => {
  orderForm.order_type = table ? 'table' : 'table';
  orderForm.table = table;
  orderForm.table_id = table ? table.id : (tables.value[0]?.id ?? null);
  orderForm.room_number = '';
  orderForm.client_name = '';
  orderForm.items = [];
  newItem.type = 'menu';
  newItem.menu_item_id = '';
  newItem.dish_id = '';
  newItem.qty = 1;
  selectedTable.value = null;
  showOrderModal.value = true;
};

const addItemToOrder = () => {
  if (newItem.type === 'dish') {
    const dish = dishes.value.find((d) => d.id === newItem.dish_id);
    if (!dish) return;
    const existing = orderForm.items.find((i) => i.type === 'dish' && i.dish_id === newItem.dish_id);
    if (existing) {
      existing.qty += newItem.qty;
    } else {
      orderForm.items.push({ type: 'dish', dish_id: dish.id, name: dish.name, price: dish.price, qty: newItem.qty });
    }
    newItem.dish_id = '';
  } else {
    const menu = menuItems.value.find((m) => m.id === newItem.menu_item_id);
    if (!menu) return;
    const existing = orderForm.items.find((i) => i.type !== 'dish' && i.menu_item_id === newItem.menu_item_id);
    if (existing) {
      existing.qty += newItem.qty;
    } else {
      orderForm.items.push({ type: 'menu', menu_item_id: menu.id, name: menu.name, price: menu.price, qty: newItem.qty });
    }
    newItem.menu_item_id = '';
  }
  newItem.qty = 1;
};

const saveOrder = async () => {
  savingOrder.value = true;
  try {
    const payload = {
      client_name: orderForm.client_name,
      items: orderForm.items.map((i) =>
        i.type === 'dish'
          ? { hotel_dish_id: i.dish_id, qty: i.qty }
          : { hotel_menu_item_id: i.menu_item_id, qty: i.qty },
      ),
    };

    if (orderForm.order_type === 'room') {
      payload.room_number = orderForm.room_number;
    } else {
      payload.hotel_restaurant_table_id = orderForm.table_id;
    }

    await api.post('/hotel/restaurant-orders', payload);
    showOrderModal.value = false;
    activeTab.value = 'orders';
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur lors de la commande');
  } finally {
    savingOrder.value = false;
  }
};

const updateOrderStatus = async (order, status) => {
  try {
    await api.put(`/hotel/restaurant-orders/${order.id}/status`, { status });
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur');
  }
};

const viewOrder = (order) => { viewingOrder.value = order; };

const registerOrderInCaisse = async (amount, description, section, reference) => {
  try {
    const res = await api.get('/hotel/caisse/current', { params: { hotel_section: section } });
    const register = res.data?.data?.register;
    if (register?.id) {
      await api.post(`/hotel/caisse/${register.id}/movements`, {
        type: 'income',
        amount,
        description,
        reference,
      });
    }
  } catch {
    // Pas de caisse ouverte — on ignore
  }
};

const itemLabel = (i) => `${i.name || ''} x${i.qty ?? i.quantity ?? 1}`;

const buildOrderDescription = (order, itemsSubset = null) => {
  const items = itemsSubset ?? (Array.isArray(order.items) ? order.items : []);
  const itemStr = items.length ? ` | ${items.map(itemLabel).join(', ')}` : '';

  if (order.room_number) {
    return `Service chambre — Chambre N°${order.room_number}${itemStr}`;
  }
  const table = order.table?.number ? `Table N°${order.table.number}` : `Commande #${order.id}`;
  return `${table}${itemStr}`;
};

const barCategories = ['Boisson', 'Alcool'];
const restaurantCategories = ['Plat', 'Entrée', 'Dessert', 'Cuisine'];

const getItemSection = (item) => {
  const cat = item.category || '';
  if (barCategories.includes(cat)) {
    return 'bar';
  }
  if (restaurantCategories.includes(cat)) {
    return 'restaurant';
  }
  if (item.hotel_dish_id || item.item_type === 'dish') {
    return 'restaurant';
  }
  if (item.hotel_menu_item_id || item.item_type === 'menu') {
    return 'bar';
  }
  return 'restaurant';
};

const closeOrder = async (order) => {
  try {
    await api.put(`/hotel/restaurant-orders/${order.id}/status`, { status: 'paid' });

    const items = Array.isArray(order.items) ? order.items : [];

    if (order.room_number) {
      await registerOrderInCaisse(
        order.total,
        buildOrderDescription(order),
        'rooms',
        `CHAMBRE N°${order.room_number}`,
      );
    } else {
      const grouped = {};
      items.forEach((item) => {
        const section = getItemSection(item);
        if (!grouped[section]) {
          grouped[section] = { items: [], total: 0 };
        }
        grouped[section].items.push(item);
        grouped[section].total += parseFloat(item.price) * (item.qty ?? 1);
      });

      const tableRef = `TABLE N°${order.table?.number ?? order.id}`;
      const sectionNames = { restaurant: 'Restaurant', bar: 'Bar' };

      for (const [section, data] of Object.entries(grouped)) {
        if (data.total > 0) {
          await registerOrderInCaisse(
            data.total,
            `${sectionNames[section] || section} — ${buildOrderDescription(order, data.items)}`,
            section,
            tableRef,
          );
        }
      }

      if (Object.keys(grouped).length === 0 && order.total > 0) {
        await registerOrderInCaisse(order.total, buildOrderDescription(order), 'restaurant', tableRef);
      }
    }

    viewingOrder.value = null;
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur');
  }
};

const openTableModal = (table) => {
  editingTable.value = table;
  if (table) {
    Object.assign(tableForm, { number: table.number, seats: table.seats, location: table.location || '' });
  } else {
    Object.assign(tableForm, { number: '', seats: 4, location: '' });
  }
  selectedTable.value = null;
  showTableModal.value = true;
};

const saveTable = async () => {
  try {
    if (editingTable.value) {
      await api.put(`/hotel/restaurant-tables/${editingTable.value.id}`, tableForm);
    } else {
      await api.post('/hotel/restaurant-tables', tableForm);
    }
    showTableModal.value = false;
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
  }
};

const deleteTable = async (table) => {
  try {
    await api.delete(`/hotel/restaurant-tables/${table.id}`);
    selectedTable.value = null;
    await loadAll();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur lors de la suppression');
  }
};

const openMenuItemModal = (item) => {
  editingMenuItem.value = item;
  if (item) {
    Object.assign(menuForm, { name: item.name, category: item.category, price: item.price, available: item.available, description: item.description || '', bar_stock_id: item.bar_stock_id ?? null, stock_per_serving: item.stock_per_serving ?? 1 });
  } else {
    Object.assign(menuForm, { name: '', category: 'Plat', price: 0, available: true, description: '', bar_stock_id: null, stock_per_serving: 1 });
  }
  showMenuModal.value = true;
};

const saveMenuItem = async () => {
  try {
    if (editingMenuItem.value) {
      await api.put(`/hotel/menu-items/${editingMenuItem.value.id}`, menuForm);
    } else {
      await api.post('/hotel/menu-items', menuForm);
    }
    showMenuModal.value = false;
    const menuRes = await api.get('/hotel/menu-items');
    menuItems.value = menuRes.data.data;
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
  }
};

const getTableCardClass = (status) => {
  const c = { free: 'border-success', occupied: 'border-danger bg-danger bg-opacity-10' };
  return c[status] || '';
};

const getTableBadgeClass = (status) => {
  const c = { free: 'bg-success', occupied: 'bg-danger' };
  return c[status] || 'bg-secondary';
};

const getTableStatusLabel = (status) => ({ free: 'Libre', occupied: 'Occupée' }[status] || status);

const getOrderBadgeClass = (status) => {
  const c = { pending: 'bg-warning text-dark', preparing: 'bg-info text-dark', served: 'bg-primary', paid: 'bg-success', cancelled: 'bg-secondary' };
  return c[status] || 'bg-secondary';
};

const getOrderStatusLabel = (status) => {
  const l = { pending: 'En attente', preparing: 'En préparation', served: 'Servi', paid: 'Payé', cancelled: 'Annulé' };
  return l[status] || status;
};

const getCategoryBadge = (cat) => {
  const c = { Plat: 'bg-primary', Boisson: 'bg-info text-dark', Alcool: 'bg-warning text-dark', Dessert: 'bg-pink', Entrée: 'bg-success', Autre: 'bg-secondary' };
  return c[cat] || 'bg-secondary';
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 BIF';
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' BIF';
};

const openBarStockModal = (item) => {
  editingBarStock.value = item;
  if (item) {
    Object.assign(barStockForm, { name: item.name, quantity: item.quantity, unit: item.unit, alert_threshold: item.alert_threshold, purchase_price: item.purchase_price || 0 });
  } else {
    Object.assign(barStockForm, { name: '', quantity: 0, unit: 'bouteille', alert_threshold: 5, purchase_price: 0 });
  }
  showBarStockModal.value = true;
};

const saveBarStock = async () => {
  try {
    if (editingBarStock.value) {
      await api.put(`/hotel/bar-stock/${editingBarStock.value.id}`, barStockForm);
    } else {
      await api.post('/hotel/bar-stock', barStockForm);
    }
    showBarStockModal.value = false;
    const res = await api.get('/hotel/bar-stock');
    barStockItems.value = res.data.data;
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
  }
};

const loadMovements = async () => {
  try {
    const res = await api.get('/hotel/stock-movements', { params: { stock_type: 'bar' } });
    stockMovements.value = res.data.data?.data ?? res.data.data ?? [];
  } catch (e) {
    console.error('Erreur chargement mouvements:', e);
  }
};

const movementStockList = computed(() => {
  return movementForm.stock_type === 'bar' ? barStockItems.value : [];
});

const onMovementItemChange = () => {
  const list = movementForm.stock_type === 'bar' ? barStockItems.value : [];
  const item = list.find(i => i.id === movementForm.stock_item_id);
  if (item) {
    movementForm.unit_price = parseFloat(item.purchase_price || 0);
  }
};

const openMovementModal = (type) => {
  movementForm.stock_type = type;
  movementForm.stock_item_id = '';
  movementForm.movement_type = 'in';
  movementForm.quantity = 1;
  movementForm.unit_price = 0;
  movementForm.currency = 'BIF';
  movementForm.is_loss = false;
  movementForm.reason = '';
  movementForm.reference = '';
  movementError.value = '';
  showMovementModal.value = true;
};

const saveMovement = async () => {
  savingMovement.value = true;
  movementError.value = '';
  try {
    await api.post('/hotel/stock-movements', {
      stock_type: movementForm.stock_type,
      stock_item_id: movementForm.stock_item_id,
      movement_type: movementForm.movement_type,
      quantity: movementForm.quantity,
      unit_price: movementForm.unit_price || null,
      currency: movementForm.currency || 'BIF',
      is_loss: movementForm.is_loss || false,
      reason: movementForm.reason || null,
      reference: movementForm.reference || null,
    });
    showMovementModal.value = false;
    await loadAll();
    await loadMovements();
  } catch (e) {
    movementError.value = e.response?.data?.message || 'Erreur lors de l\'enregistrement';
  } finally {
    savingMovement.value = false;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) { return ''; }
  return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => loadAll());
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
.table-card {
  border-width: 2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.table-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
