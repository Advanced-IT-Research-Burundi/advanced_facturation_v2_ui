<template>
  <div class="hotel-page">
    <HotelHeader modelValue="Kitchen" />

    <div class="px-3 pb-4 mt-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="mb-0 fw-bold">
          <i class="bi bi-fire me-2 text-danger"></i>Cuisine
        </h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="loadAll">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button v-if="canManage" class="btn btn-primary" @click="openDishModal(null)">
            <i class="bi bi-plus-lg me-1"></i> Nouveau Plat
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="row mb-4 g-3">
        <div class="col-6 col-md-3">
          <div class="card bg-warning h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">En attente</div>
                  <div class="fs-3 fw-bold">{{ stats.pending }}</div>
                </div>
                <i class="bi bi-hourglass-split fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-info text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">En préparation</div>
                  <div class="fs-3 fw-bold">{{ stats.preparing }}</div>
                </div>
                <i class="bi bi-fire fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Prêts à servir</div>
                  <div class="fs-3 fw-bold">{{ stats.ready }}</div>
                </div>
                <i class="bi bi-check-circle fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-semibold">Plats au menu</div>
                  <div class="fs-3 fw-bold">{{ dishes.length }}</div>
                </div>
                <i class="bi bi-journal-text fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs: Bons de commande (tous) / Recettes & Stock (gestion complète uniquement) -->
      <ul class="nav nav-pills mb-3">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
            <i class="bi bi-ticket me-1"></i>Bons de Commande
          </button>
        </li>
        <li v-if="canManage" class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'dishes' }" @click="activeTab = 'dishes'">
            <i class="bi bi-journal-text me-1"></i>Recettes & Plats
          </button>
        </li>
        <li v-if="canManage" class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">
            <i class="bi bi-box-seam me-1"></i>Stock Cuisine
          </button>
        </li>
        <li v-if="canManage" class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'movements' }" @click="activeTab = 'movements'; loadMovements()">
            <i class="bi bi-arrow-left-right me-1"></i>Entrées / Sorties
          </button>
        </li>
      </ul>

      <!-- TAB: Bons de Commande cuisine -->
      <div v-if="activeTab === 'orders'">
        <div class="row g-3">
          <!-- Colonne: En attente -->
          <div class="col-12 col-md-4">
            <div class="card border-warning">
              <div class="card-header bg-warning fw-bold">
                <i class="bi bi-hourglass-split me-2"></i>En attente ({{ pendingOrders.length }})
              </div>
              <div class="card-body p-2">
                <div v-for="order in pendingOrders" :key="order.id" class="kitchen-ticket mb-2 border rounded p-2">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <span class="fw-bold">
                      {{ order.location_label || (order.is_room_service ? 'Chambre ' + order.room_number : 'Table ' + order.table_number) }}
                    </span>
                    <span v-if="order.is_room_service" class="badge bg-warning text-dark ms-1 small">Room</span>
                    <span class="small text-muted ms-1">{{ order.time }}</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li v-for="item in order.items" :key="item.name" class="d-flex justify-content-between">
                      <span><i class="bi bi-dot"></i>{{ item.name }}</span>
                      <strong>×{{ item.qty }}</strong>
                    </li>
                  </ul>
                  <div v-if="order.notes" class="small text-muted fst-italic mb-1">
                    <i class="bi bi-chat-left-dots me-1"></i>{{ order.notes }}
                  </div>
                  <div class="d-flex gap-1 mb-1">
                    <button class="btn btn-sm btn-outline-dark flex-fill" @click="printKitchenTicketA4(order, company)">
                      <i class="bi bi-printer me-1"></i>A4
                    </button>
                    <button class="btn btn-sm btn-outline-secondary flex-fill" @click="printKitchenTicketPOS(order, company)">
                      <i class="bi bi-receipt me-1"></i>POS
                    </button>
                  </div>
                  <button class="btn btn-sm btn-info w-100" @click="updateOrderStatus(order, 'preparing')">
                    <i class="bi bi-fire me-1"></i>Démarrer la préparation
                  </button>
                </div>
                <div v-if="pendingOrders.length === 0" class="text-center text-muted py-3 small">
                  Aucune commande en attente
                </div>
              </div>
            </div>
          </div>

          <!-- Colonne: En préparation -->
          <div class="col-12 col-md-4">
            <div class="card border-info">
              <div class="card-header bg-info text-white fw-bold">
                <i class="bi bi-fire me-2"></i>En préparation ({{ preparingOrders.length }})
              </div>
              <div class="card-body p-2">
                <div v-for="order in preparingOrders" :key="order.id" class="kitchen-ticket mb-2 border rounded p-2">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <span class="fw-bold">
                        {{ order.location_label || (order.is_room_service ? 'Chambre ' + order.room_number : 'Table ' + order.table_number) }}
                      </span>
                      <span v-if="order.is_room_service" class="badge bg-warning text-dark ms-1 small">Room</span>
                    </div>
                    <span class="badge bg-info text-dark">{{ elapsedTime(order.started_at) }}</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li v-for="item in order.items" :key="item.name" class="d-flex justify-content-between">
                      <span><i class="bi bi-dot"></i>{{ item.name }}</span>
                      <strong>×{{ item.qty }}</strong>
                    </li>
                  </ul>
                  <div class="d-flex gap-1 mb-1">
                    <button class="btn btn-sm btn-outline-dark flex-fill" @click="printKitchenTicketA4(order, company)">
                      <i class="bi bi-printer me-1"></i>A4
                    </button>
                    <button class="btn btn-sm btn-outline-secondary flex-fill" @click="printKitchenTicketPOS(order, company)">
                      <i class="bi bi-receipt me-1"></i>POS
                    </button>
                  </div>
                  <button class="btn btn-sm btn-success w-100" @click="updateOrderStatus(order, 'ready')">
                    <i class="bi bi-check-circle me-1"></i>Prêt à servir
                  </button>
                </div>
                <div v-if="preparingOrders.length === 0" class="text-center text-muted py-3 small">
                  Aucune commande en préparation
                </div>
              </div>
            </div>
          </div>

          <!-- Colonne: Prêts -->
          <div class="col-12 col-md-4">
            <div class="card border-success">
              <div class="card-header bg-success text-white fw-bold">
                <i class="bi bi-check-circle me-2"></i>Prêts à servir ({{ readyOrders.length }})
              </div>
              <div class="card-body p-2">
                <div v-for="order in readyOrders" :key="order.id" class="kitchen-ticket mb-2 border-success border rounded p-2">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <span class="fw-bold">
                        {{ order.location_label || (order.is_room_service ? 'Chambre ' + order.room_number : 'Table ' + order.table_number) }}
                      </span>
                      <span v-if="order.is_room_service" class="badge bg-warning text-dark ms-1 small">Room</span>
                    </div>
                    <span class="small text-muted">{{ order.time }}</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li v-for="item in order.items" :key="item.name">
                      <i class="bi bi-check text-success"></i> {{ item.name }} ×{{ item.qty }}
                    </li>
                  </ul>
                  <div class="d-flex gap-1 mb-1">
                    <button class="btn btn-sm btn-outline-dark flex-fill" @click="printKitchenTicketA4(order, company)">
                      <i class="bi bi-printer me-1"></i>A4
                    </button>
                    <button class="btn btn-sm btn-outline-secondary flex-fill" @click="printKitchenTicketPOS(order, company)">
                      <i class="bi bi-receipt me-1"></i>POS
                    </button>
                  </div>
                  <button class="btn btn-sm btn-outline-secondary w-100" @click="updateOrderStatus(order, 'served')">
                    <i class="bi bi-arrow-up-right me-1"></i>Marquer comme servi
                  </button>
                </div>
                <div v-if="readyOrders.length === 0" class="text-center text-muted py-3 small">
                  Aucune commande prête
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: Recettes & Plats -->
      <div v-if="activeTab === 'dishes'">
        <div class="row g-3">
          <div
            v-for="dish in dishes"
            :key="dish.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span class="badge mb-1" :class="getCategoryBadge(dish.category)">{{ dish.category }}</span>
                    <h6 class="card-title mb-0">{{ dish.name }}</h6>
                  </div>
                  <div class="text-end">
                    <span class="badge" :class="dish.available ? 'bg-success' : 'bg-secondary'">
                      {{ dish.available ? 'Dispo' : 'Indispo' }}
                    </span>
                  </div>
                </div>
                <p class="small text-muted mb-2" v-if="dish.description">{{ dish.description }}</p>
                <div class="small mb-2" v-if="dish.ingredients">
                  <i class="bi bi-list-ul me-1 text-muted"></i>
                  <span class="text-muted">Ingrédients : </span>{{ dish.ingredients }}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="fw-bold text-primary">{{ formatCurrency(dish.price) }}</span>
                  <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary" @click="openDishModal(dish)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm"
                      :class="dish.available ? 'btn-outline-secondary' : 'btn-outline-success'"
                      @click="dish.available = !dish.available"
                    >
                      <i :class="['bi', dish.available ? 'bi-eye-slash' : 'bi-eye']"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteDish(dish)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="dishes.length === 0" class="col-12 text-center py-5 text-muted">
            <i class="bi bi-journal-text fs-1 d-block mb-2"></i>Aucun plat configuré
          </div>
        </div>
      </div>

      <!-- TAB: Stock Cuisine -->
      <div v-if="activeTab === 'stock'">
        <div class="d-flex gap-2 justify-content-between mb-3 align-items-center">
          <input v-model="stockSearch" type="text" class="form-control form-control-sm" style="max-width:260px" placeholder="Rechercher un ingrédient..." />
          <button class="btn btn-sm btn-outline-primary" @click="openStockModal(null)">
            <i class="bi bi-plus me-1"></i>Ajouter un ingrédient
          </button>
        </div>
        <div class="card">
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Ingrédient</th>
                  <th>Quantité</th>
                  <th>Unité</th>
                  <th>Seuil d'alerte</th>
                  <th>Prix d'achat</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredStockItems" :key="item.id">
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
                    <button class="btn btn-sm btn-outline-primary" @click="openStockModal(item)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredStockItems.length === 0">
                  <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-box-seam fs-1 d-block mb-2"></i>Aucun ingrédient enregistré
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: Mouvements stock cuisine -->
      <div v-if="activeTab === 'movements' && canManage">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 fw-bold"><i class="bi bi-arrow-left-right me-2 text-primary"></i>Entrées / Sorties — Stock Cuisine</h6>
          <button class="btn btn-primary btn-sm" @click="openMovementModal('kitchen')">
            <i class="bi bi-plus me-1"></i>Nouveau mouvement
          </button>
        </div>
        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Ingrédient</th>
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
              <i class="bi bi-arrow-left-right me-2 text-primary"></i>Mouvement — Stock Cuisine
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
                <option v-for="item in stockItems" :key="item.id" :value="item.id">
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
                <input v-model="movementForm.is_loss" type="checkbox" class="form-check-input" id="isLossKitchen" />
                <label class="form-check-label fw-semibold" for="isLossKitchen">
                  <i class="bi bi-exclamation-triangle text-warning me-1"></i>Perte de stock (enregistrer en caisse)
                </label>
              </div>
              <small v-if="movementForm.is_loss" class="text-warning">
                Le montant sera enregistré comme dépense/perte dans la caisse Restaurant
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

      <!-- MODAL: Dish -->
      <div v-if="showDishModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showDishModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingDish ? 'Modifier le plat' : 'Nouveau Plat' }}</h5>
            <button class="btn-close" @click="showDishModal = false"></button>
          </div>
          <form @submit.prevent="saveDish">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label small fw-bold">Nom du plat <span class="text-danger">*</span></label>
                <input v-model="dishForm.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Catégorie</label>
                <select v-model="dishForm.category" class="form-select">
                  <option value="Entrée">Entrée</option>
                  <option value="Plat principal">Plat principal</option>
                  <option value="Grillades">Grillades</option>
                  <option value="Poissons">Poissons</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Accompagnement">Accompagnement</option>
                  <option value="Spécial">Spécial</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Prix <span class="text-danger">*</span></label>
                <input v-model.number="dishForm.price" type="number" class="form-control" required min="0" step="0.01" />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Temps de préparation (min)</label>
                <input v-model.number="dishForm.prep_time" type="number" class="form-control" min="0" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Ingrédients principaux</label>
                <input v-model="dishForm.ingredients" type="text" class="form-control" placeholder="Ex: bœuf, pommes de terre, oignons..." />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Description / Recette</label>
                <textarea v-model="dishForm.description" class="form-control" rows="3"></textarea>
              </div>
              <div class="col-12">
                <div class="form-check form-switch">
                  <input v-model="dishForm.available" type="checkbox" class="form-check-input" id="dishAvailable" />
                  <label class="form-check-label" for="dishAvailable">Disponible au menu</label>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showDishModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="savingDish">
                <span v-if="savingDish" class="spinner-border spinner-border-sm me-1"></span>
                {{ savingDish ? 'Enregistrement...' : (editingDish ? 'Mettre à jour' : 'Enregistrer') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: Stock item -->
      <div v-if="showStockModal" class="modal-overlay d-flex justify-content-center align-items-center" @click.self="showStockModal = false">
        <div class="bg-white rounded shadow-lg p-4" style="width: 90%; max-width: 460px;">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 class="mb-0">{{ editingStock ? 'Modifier' : 'Nouvel Ingrédient' }}</h5>
            <button class="btn-close" @click="showStockModal = false"></button>
          </div>
          <form @submit.prevent="saveStock">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small fw-bold">Ingrédient <span class="text-danger">*</span></label>
                <input v-model="stockForm.name" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Quantité</label>
                <input v-model.number="stockForm.quantity" type="number" class="form-control" min="0" step="0.01" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Unité</label>
                <input v-model="stockForm.unit" type="text" class="form-control" placeholder="kg, L, pcs..." />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Seuil alerte</label>
                <input v-model.number="stockForm.alert_threshold" type="number" class="form-control" min="0" />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Prix d'achat (BIF)</label>
                <input v-model.number="stockForm.purchase_price" type="number" class="form-control" min="0" step="0.01" placeholder="0" />
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button type="button" class="btn btn-secondary" @click="showStockModal = false">Annuler</button>
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

const store = useStore();
const currentUser = computed(() => store.state.auth.user);
const isAdmin = computed(() => {
  const roles = currentUser.value?.roles || [];
  return roles.some((r) => ['admin', 'super_admin'].includes(r.name));
});
const hasPermission = (perm) => {
  if (isAdmin.value) return true;
  const roles = currentUser.value?.roles || [];
  return roles.some((r) => r.permissions?.includes(perm));
};
/** Gestion complète (hotel_bar) */
const canManage = computed(() => hasPermission('hotel_bar'));
/** Voir les bons de commande (hotel_bar ou hotel_bar_order) */
const canViewOrders = computed(() => hasPermission('hotel_bar') || hasPermission('hotel_bar_order'));

const company = computed(() => currentUser.value?.company ?? null);
const { printKitchenTicketA4, printKitchenTicketPOS } = useInvoicePrint();

const activeTab = ref('orders');
const loading = ref(false);

const kitchenOrders = ref([]);
const dishes = ref([]);
const stockItems = ref([]);
const stockSearch = ref('');
const filteredStockItems = computed(() =>
  stockSearch.value.trim()
    ? stockItems.value.filter((i) => i.name.toLowerCase().includes(stockSearch.value.toLowerCase()))
    : stockItems.value,
);

const showDishModal = ref(false);
const editingDish = ref(null);
const savingDish = ref(false);
const showStockModal = ref(false);
const editingStock = ref(null);

const stockMovements = ref([]);
const showMovementModal = ref(false);
const savingMovement = ref(false);
const movementError = ref('');
const movementForm = reactive({
  stock_type: 'kitchen',
  stock_item_id: '',
  movement_type: 'in',
  quantity: 1,
  unit_price: 0,
  currency: 'BIF',
  is_loss: false,
  reason: '',
  reference: '',
});

const dishForm = reactive({
  name: '', category: 'Plat principal', price: 0, prep_time: 15,
  ingredients: '', description: '', available: true,
});

const stockForm = reactive({ name: '', quantity: 0, unit: 'kg', alert_threshold: 5, purchase_price: 0 });

const stats = computed(() => ({
  pending: kitchenOrders.value.filter(o => o.status === 'pending').length,
  preparing: kitchenOrders.value.filter(o => o.status === 'preparing').length,
  ready: kitchenOrders.value.filter(o => o.status === 'ready').length,
}));

const pendingOrders = computed(() => kitchenOrders.value.filter(o => o.status === 'pending'));
const preparingOrders = computed(() => kitchenOrders.value.filter(o => o.status === 'preparing'));
const readyOrders = computed(() => kitchenOrders.value.filter(o => o.status === 'ready'));

const loadAll = async () => {
  loading.value = true;
  try {
    const [ordersRes, dishesRes, stockRes] = await Promise.all([
      api.get('/hotel/kitchen/orders'),
      api.get('/hotel/dishes'),
      api.get('/hotel/kitchen-stock'),
    ]);
    kitchenOrders.value = ordersRes.data.data.map(o => ({
      ...o,
      started_at: o.status === 'preparing' ? (o.updated_at ? new Date(o.updated_at).getTime() : null) : null,
    }));
    dishes.value = dishesRes.data.data;
    stockItems.value = stockRes.data.data;
  } catch (e) {
    console.error('Erreur chargement cuisine:', e);
  } finally {
    loading.value = false;
  }
};

const updateOrderStatus = async (order, status) => {
  try {
    await api.put(`/hotel/restaurant-orders/${order.id}/status`, { status });
    if (status === 'preparing') order.started_at = Date.now();
    order.status = status;
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur');
  }
};

const elapsedTime = (startedAt) => {
  if (!startedAt) return '';
  const mins = Math.floor((Date.now() - startedAt) / 60000);
  return `${mins} min`;
};

const openDishModal = (dish) => {
  editingDish.value = dish;
  if (dish) {
    Object.assign(dishForm, { name: dish.name, category: dish.category, price: dish.price, prep_time: dish.prep_time || 0, ingredients: dish.ingredients || '', description: dish.description || '', available: dish.available });
  } else {
    Object.assign(dishForm, { name: '', category: 'Plat principal', price: 0, prep_time: 15, ingredients: '', description: '', available: true });
  }
  showDishModal.value = true;
};

const saveDish = async () => {
  savingDish.value = true;
  try {
    if (editingDish.value) {
      await api.put(`/hotel/dishes/${editingDish.value.id}`, dishForm);
    } else {
      await api.post('/hotel/dishes', dishForm);
    }
    showDishModal.value = false;
    const res = await api.get('/hotel/dishes');
    dishes.value = res.data.data;
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
  } finally {
    savingDish.value = false;
  }
};

const deleteDish = async (dish) => {
  try {
    await api.delete(`/hotel/dishes/${dish.id}`);
    const res = await api.get('/hotel/dishes');
    dishes.value = res.data.data;
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur lors de la suppression');
  }
};

const openStockModal = (item) => {
  editingStock.value = item;
  if (item) {
    Object.assign(stockForm, { name: item.name, quantity: item.quantity, unit: item.unit, alert_threshold: item.alert_threshold, purchase_price: item.purchase_price || 0 });
  } else {
    Object.assign(stockForm, { name: '', quantity: 0, unit: 'kg', alert_threshold: 5, purchase_price: 0 });
  }
  showStockModal.value = true;
};

const saveStock = async () => {
  try {
    if (editingStock.value) {
      await api.put(`/hotel/kitchen-stock/${editingStock.value.id}`, stockForm);
    } else {
      await api.post('/hotel/kitchen-stock', stockForm);
    }
    showStockModal.value = false;
    const res = await api.get('/hotel/kitchen-stock');
    stockItems.value = res.data.data;
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
  }
};

const getCategoryBadge = (cat) => {
  const c = {
    'Plat principal': 'bg-primary', 'Grillades': 'bg-danger', 'Poissons': 'bg-info text-dark',
    'Entrée': 'bg-success', 'Dessert': 'bg-warning text-dark', 'Accompagnement': 'bg-secondary',
    'Spécial': 'bg-dark',
  };
  return c[cat] || 'bg-secondary';
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 BIF';
  return new Intl.NumberFormat('fr-BI', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' BIF';
};

const loadMovements = async () => {
  try {
    const res = await api.get('/hotel/stock-movements', { params: { stock_type: 'kitchen' } });
    stockMovements.value = res.data.data?.data ?? res.data.data ?? [];
  } catch (e) {
    console.error('Erreur chargement mouvements cuisine:', e);
  }
};

const onMovementItemChange = () => {
  const item = stockItems.value.find(i => i.id === movementForm.stock_item_id);
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
.kitchen-ticket {
  background: #fafafa;
  transition: box-shadow 0.15s;
}
.kitchen-ticket:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
