<template>
  <div class="container-fluid p-0">
    <!-- Messages -->
    <div
      v-if="successMessage"
      class="alert alert-success alert-dismissible fade show"
    >
      <i class="bi bi-check-circle me-2"></i>{{ successMessage }}
      <button class="btn-close" @click="successMessage = null"></button>
    </div>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
      <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
      <button class="btn-close" @click="error = null"></button>
    </div>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3">
          <i class="bi bi-box-seam me-2"></i>
          {{ warehouse?.name }}
        </h1>
        <small class="text-muted">{{ warehouse?.location }}</small>
      </div>
      <div>
        <router-link :to="`/stock`" class="btn btn-outline-secondary me-2">
          <i class="bi bi-arrow-left"></i> Retour aux Stocks
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/bulk-entry`"
          class="btn btn-outline-success me-2"
        >
          <i class="bi bi-box-arrow-in-down"></i> Entrée Multiple
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/bulk-exit`"
          class="btn btn-outline-danger me-2"
        >
          <i class="bi bi-box-arrow-right"></i> Sortie Multiple
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/history`"
          class="btn btn-outline-warning me-2"
        >
          <i class="bi bi-clock-history"></i> Historique
        </router-link>
        <router-link
          v-if="pendingCount > 0"
          :to="`/warehouses/${warehouseId}/pending-transfers`"
          class="btn btn-outline-info me-2"
        >
          <i class="bi bi-hourglass-split"></i> Transferts
          <span class="badge bg-danger ms-1">{{ pendingCount }}</span>
        </router-link>
        <router-link
          :to="`/warehouses/${warehouseId}/create-transfer`"
          class="btn btn-outline-success me-2"
        >
          <i class="bi bi-arrow-left-right"></i> Créer Transfert
        </router-link>
        <RouterLink
          :to="`/stock/${route.params.id}/products`"
          class="btn btn-success shadow-sm"
        >
          <i class="bi bi-box-seam me-2"></i>Gérer les produits
        </RouterLink>
        <button
          type="button"
          class="btn btn-outline-primary shadow-sm ms-2"
          @click="exportStockToExcel"
          :disabled="filteredStocks.length === 0 || loading"
          title="Exporter les produits du stock en Excel"
        >
          <i class="bi bi-file-earmark-excel me-2"></i>Download
        </button>
        <button
          type="button"
          class="btn btn-outline-danger shadow-sm ms-2"
          @click="exportStockToPdf"
          :disabled="filteredStocks.length === 0 || loading"
          title="Exporter les produits du stock en PDF"
        >
          <i class="bi bi-file-earmark-pdf me-2"></i>PDF
        </button>
      </div>
    </div>

    <!-- Stock actuel -->
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0"><i class="bi bi-boxes me-2"></i>Stock Actuel</h5>
      </div>
      <div class="card-body">
        <!-- Barre de recherche -->
        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text bg-light">
              <i class="bi bi-search"></i>
            </span>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Rechercher par code ou désignation..."
            />
            <button
              v-if="searchQuery"
              class="btn btn-outline-secondary"
              @click="searchQuery = ''"
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div
          class="d-flex flex-wrap align-items-center gap-3 mb-3"
          :class="mismatchCount ? 'text-warning-emphasis' : 'text-success'"
        >
          <span class="small">
            <i
              class="bi me-1"
              :class="mismatchCount ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'"
            ></i>
            <template v-if="mismatchCount">
              {{ mismatchCount }} produit(s) avec un prix catalogue différent de
              warehouse_products
            </template>
            <template v-else>
              Tous les prix correspondent à warehouse_products
            </template>
          </span>
          <div v-if="mismatchCount" class="form-check form-switch mb-0">
            <input
              id="showOnlyMismatches"
              v-model="showOnlyMismatches"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label small text-body" for="showOnlyMismatches">
              Afficher uniquement les écarts
            </label>
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6 col-xl-3">
            <div class="summary-card border rounded-3 p-3 bg-light h-100">
              <div class="text-muted small">Produits affichés</div>
              <div class="fs-4 fw-bold">{{ filteredStocks.length }}</div>
              <div class="small text-muted">
                sur {{ validStocks.length }} produit(s)
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div class="summary-card border rounded-3 p-3 bg-light h-100">
              <div class="text-muted small">Quantité totale affichée</div>
              <div class="fs-4 fw-bold">
                {{ formatNumber(filteredStockQuantity) }}
              </div>
              <div class="small text-muted">toutes unités confondues</div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div
              class="summary-card border rounded-3 p-3 bg-primary-subtle h-100"
            >
              <div class="text-muted small">
                Chiffre d'affaires potentiel affiché
              </div>
              <div class="fs-5 fw-bold text-primary">
                {{ formatCurrencyTotals(filteredStockRevenueByCurrency) }}
              </div>
              <div v-if="searchQuery" class="small text-muted">
                Total stock: {{ formatCurrencyTotals(stockRevenueByCurrency) }}
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-3">
            <div
              class="summary-card border rounded-3 p-3 bg-warning-subtle h-100"
            >
              <div class="text-muted small">
                Chiffre d'affaires au prix promotionnel
              </div>
              <div class="fs-5 fw-bold text-warning-emphasis">
                {{ formatCurrencyTotals(filteredPromoRevenueByCurrency) }}
              </div>
              <div class="small text-muted">
                {{ filteredPromoStocksCount }} produit(s) avec prix promotionnel
              </div>
              <div v-if="searchQuery" class="small text-muted">
                Total stock: {{ formatCurrencyTotals(promoRevenueByCurrency) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Produit</th>
                <th class="text-end">Quantité</th>
                <th class="text-center">Alerte</th>
                <th class="text-center">TVA</th>
                <th class="text-end">P.U. HTVA</th>
                <th class="text-end">P.U. TVAC</th>
                <th class="text-end">Prix d'achat</th>
                <th class="text-end">Bénéfice</th>
                <th class="text-end">Prix Promotionnel</th>
                <th class="text-end">TVA Promo</th>
                <th class="text-end">Total Produit</th>
                <th class="text-end">Total Promo</th>
                <th class="text-center">Contrôle prix</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stock, index) in paginatedStocks" :key="stock.id">
                <td class="fw-bold text-muted">{{ calculateIndex(index) }}</td>
                <td>
                  <code>{{ stock.product?.item_code }}</code>
                </td>
                <td>
                  <div class="fw-bold">
                    {{ stock.product?.item_designation }}
                  </div>
                </td>
                <td class="text-end">
                  <span
                    class="badge fs-6"
                    :class="stock.is_alert ? 'bg-danger' : 'bg-info'"
                  >
                    {{ stock.quantity }}
                    {{ stock.product?.item_measurement_unit }}
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
                <td class="text-center">
                  {{ formatNumber(stock.product?.vat_rate) }}%
                </td>
                <td class="text-end">
                  {{ formatCurrency(getPriceHTVA(stock), stock.currency) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(getPriceTVAC(stock), stock.currency) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(getPurchasePrice(stock), stock.currency) }}
                </td>
                <td
                  class="text-end fw-semibold"
                  :class="getProfit(stock) >= 0 ? 'text-success' : 'text-danger'"
                >
                  {{ getProfit(stock) >= 0 ? '+' : '' }}{{
                    formatCurrency(getProfit(stock), stock.currency)
                  }}
                  <small class="d-block text-muted fw-normal">
                    {{ formatNumber(getProfitMargin(stock)) }}%
                  </small>
                </td>
                <td class="text-end">
                  <span v-if="getLibellePrice(stock) > 0" class="text-warning-emphasis fw-semibold">
                    {{ formatCurrency(getLibellePrice(stock), stock.currency) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="text-end">
                  <template v-if="getLibellePrice(stock) > 0">
                    {{ formatCurrency(getPromoVatAmount(stock), stock.currency) }}
                    <small class="d-block text-muted">
                      {{ formatNumber(stock.product?.vat_rate) }}%
                    </small>
                  </template>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="text-end fw-bold text-success">
                  {{ formatCurrency(getStockLineTotal(stock), stock.currency) }}
                </td>
                <td class="text-end fw-bold">
                  <span v-if="getLibellePrice(stock) > 0" class="text-warning-emphasis">
                    {{ formatCurrency(getStockPromoLineTotal(stock), stock.currency) }}
                  </span>
                  <span v-else class="text-muted fw-normal">-</span>
                </td>
                <td class="text-center">
                  <span
                    v-if="getPriceMismatches(stock).length"
                    class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                    :title="getPriceMismatches(stock).join('\n')"
                  >
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    Écart
                  </span>
                  <span
                    v-else
                    class="badge bg-success-subtle text-success border border-success-subtle"
                    title="Prix identiques à warehouse_products"
                  >
                    <i class="bi bi-check-circle-fill me-1"></i>OK
                  </span>
                </td>
                <td class="text-center">
                  <button
                    class="btn btn-sm btn-outline-success me-1"
                    @click="openQuickEntry(stock)"
                    title="Entrée"
                  >
                    <i class="bi bi-plus-lg"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger me-1"
                    @click="openQuickExit(stock)"
                    title="Sortie"
                  >
                    <i class="bi bi-dash-lg"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-primary"
                    @click="openUnitPriceEdit(stock)"
                    title="Modifier les prix"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredStocks.length === 0">
                <td colspan="16" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  {{
                    searchQuery
                      ? "Aucun produit trouvé"
                      : "Aucun produit en stock"
                  }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filteredStocks.length > 0" class="table-light">
              <tr class="fw-bold">
                <td colspan="3" class="text-end">Total</td>
                <td class="text-end">{{ formatNumber(filteredStockQuantity) }}</td>
                <td colspan="8"></td>
                <td class="text-end text-success">
                  {{ formatCurrencyTotals(filteredStockRevenueByCurrency) }}
                </td>
                <td class="text-end text-warning-emphasis">
                  {{ formatCurrencyTotals(filteredPromoRevenueByCurrency) }}
                </td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div
          v-if="filteredStocks.length > 0"
          class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3 pt-3 border-top"
        >
          <div class="text-muted small">
            Affichage de {{ pagination.from }} à {{ pagination.to }} sur
            {{ pagination.total }} produit(s)
          </div>
          <nav v-if="pagination.last_page > 1">
            <ul class="pagination pagination-sm mb-0 flex-wrap">
              <li
                class="page-item"
                :class="{ disabled: pagination.current_page === 1 }"
              >
                <button
                  class="page-link"
                  @click="changePage(1)"
                  :disabled="pagination.current_page === 1"
                >
                  <i class="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <li
                class="page-item"
                :class="{ disabled: pagination.current_page === 1 }"
              >
                <button
                  class="page-link"
                  @click="changePage(pagination.current_page - 1)"
                  :disabled="pagination.current_page === 1"
                >
                  <i class="bi bi-chevron-left"></i>
                </button>
              </li>
              <li
                v-for="page in visiblePages"
                :key="page"
                class="page-item"
                :class="{ active: page === pagination.current_page }"
              >
                <button class="page-link" @click="changePage(page)">
                  {{ page }}
                </button>
              </li>
              <li
                class="page-item"
                :class="{
                  disabled: pagination.current_page === pagination.last_page,
                }"
              >
                <button
                  class="page-link"
                  @click="changePage(pagination.current_page + 1)"
                  :disabled="pagination.current_page === pagination.last_page"
                >
                  <i class="bi bi-chevron-right"></i>
                </button>
              </li>
              <li
                class="page-item"
                :class="{
                  disabled: pagination.current_page === pagination.last_page,
                }"
              >
                <button
                  class="page-link"
                  @click="changePage(pagination.last_page)"
                  :disabled="pagination.current_page === pagination.last_page"
                >
                  <i class="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal Modification du Prix Unitaire -->
    <div
      v-if="showUnitPriceEditModal"
      class="modal show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-pencil-square me-2"></i>Modifier les prix
            </h5>
            <button
              class="btn-close btn-close-white"
              @click="closeUnitPriceEdit"
              :disabled="submitting"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>{{ selectedStock?.product?.item_designation }}</strong
              ><br />
              <small>{{ selectedStock?.product?.item_code }}</small>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Prix d'achat</label>
                <div class="input-group">
                  <input
                    v-model="unitPriceEditForm.purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control"
                  />
                  <span class="input-group-text">{{
                    selectedStock?.currency || "BIF"
                  }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix de vente *</label>
                <div class="input-group">
                  <input
                    v-model="unitPriceEditForm.unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control"
                    required
                  />
                  <span class="input-group-text">{{
                    selectedStock?.currency || "BIF"
                  }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">TVA (%) *</label>
                <input
                  v-model.number="unitPriceEditForm.vat_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="form-control"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix TTC</label>
                <div class="input-group">
                  <input
                    :value="unitPriceEditTtc"
                    type="number"
                    class="form-control bg-light"
                    readonly
                  />
                  <span class="input-group-text">{{
                    selectedStock?.currency || "BIF"
                  }}</span>
                </div>
                <small class="text-muted">Calculé à partir du prix de vente</small>
              </div>
            </div>
            <!-- <small class="text-muted">
              modifié le prix unitaire  .
            </small> -->
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeUnitPriceEdit"
              :disabled="submitting"
            >
              Annuler
            </button>
            <button
              class="btn btn-primary"
              @click="submitUnitPriceEdit"
              :disabled="submitting"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Entrée Rapide -->
    <div
      v-if="showQuickEntryModal"
      class="modal show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-plus-circle me-2"></i>Entrée Rapide
            </h5>
            <button
              class="btn-close btn-close-white"
              @click="closeQuickEntry"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <strong>{{ selectedStock?.product?.item_designation }}</strong
              ><br />
              <small>{{ selectedStock?.product?.item_code }}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Type d'entrée *</label>
              <select
                class="form-select"
                v-model="quickEntryForm.movement_type"
                required
              >
                <option value="EN">EN - Entrée Normale</option>
                <option value="ER">ER - Entrée par Retour</option>
                <option value="EI">EI - Entrée par Inventaire</option>
                <option value="EAJ">EAJ - Entrée par Ajustement</option>
                <option value="EAU">EAU - Entrée Autre</option>
              </select>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Quantité *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickEntryForm.quantity"
                  required
                  min="0.01"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix d'achat réel *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickEntryForm.purchase_price"
                  required
                  min="0"
                />
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Prix de vente HTVA *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickEntryForm.unit_price"
                  required
                  min="0"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Devise *</label>
                <select
                  class="form-select"
                  v-model="quickEntryForm.currency"
                  required
                >
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Date d'expiration</label>
                <input
                  type="date"
                  class="form-control"
                  v-model="quickEntryForm.date_expiration"
                />
              </div>
            </div>
            <div
              v-if="quickEntryForm.quantity && quickEntryForm.purchase_price"
              class="alert alert-success mt-3 mb-0"
            >
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-semibold">Montant Total (achat) :</span>
                <span class="fw-bold fs-5">
                  {{
                    new Intl.NumberFormat("fr-FR").format(
                      quickEntryForm.quantity * quickEntryForm.purchase_price,
                    )
                  }}
                  {{ quickEntryForm.currency }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeQuickEntry"
            >
              Annuler
            </button>
            <button
              @click="submitQuickEntry"
              class="btn btn-success"
              :disabled="submitting"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Sortie Rapide -->
    <div
      v-if="showQuickExitModal"
      class="modal show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-dash-circle me-2"></i>Sortie Rapide
            </h5>
            <button
              class="btn-close btn-close-white"
              @click="closeQuickExit"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>{{ selectedStock?.product?.item_designation }}</strong
              ><br />
              <small
                >Stock disponible: {{ selectedStock?.quantity }}
                {{ selectedStock?.product?.item_measurement_unit }}</small
              >
            </div>
            <div class="mb-3">
              <label class="form-label">Type de sortie *</label>
              <select
                class="form-select"
                v-model="quickExitForm.movement_type"
                required
              >
                <option value="SN">SN - Sortie Normale</option>
                <option value="SV">SV - Sortie par Vente</option>
                <option value="SP">SP - Sortie par Perte</option>
                <option value="SD">SD - Sortie par Détérioration</option>
                <option value="SC">SC - Sortie par Consommation</option>
                <option value="SAJ">SAJ - Sortie par Ajustement</option>
                <option value="SAU">SAU - Sortie Autre</option>
              </select>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Quantité *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickExitForm.quantity"
                  required
                  min="0.01"
                  :max="selectedStock?.quantity"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Prix de sortie</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  v-model="quickExitForm.unit_price"
                  min="0"
                />
              </div>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Devise</label>
                <select class="form-select" v-model="quickExitForm.currency">
                  <option value="BIF">BIF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div
              v-if="['SP', 'SD'].includes(quickExitForm.movement_type)"
              class="alert alert-warning mt-3 mb-0"
            >
              <i class="bi bi-exclamation-triangle me-1"></i>
              <strong>Perte de stock</strong> — Le montant sera automatiquement
              enregistré comme perte en caisse.
            </div>
            <div
              v-if="quickExitForm.quantity && quickExitForm.unit_price"
              class="alert mt-3 mb-0"
              :class="
                ['SP', 'SD'].includes(quickExitForm.movement_type)
                  ? 'alert-warning'
                  : 'alert-danger'
              "
            >
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-semibold"
                  >Montant Total
                  {{
                    ["SP", "SD"].includes(quickExitForm.movement_type)
                      ? "(Perte)"
                      : ""
                  }}
                  :</span
                >
                <span class="fw-bold fs-5">
                  {{
                    new Intl.NumberFormat("fr-FR").format(
                      quickExitForm.quantity * quickExitForm.unit_price,
                    )
                  }}
                  {{ quickExitForm.currency }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeQuickExit"
            >
              Annuler
            </button>
            <button
              @click="submitQuickExit"
              class="btn btn-danger"
              :disabled="submitting"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import api from "@/services/api";
import { useCachedApi } from "@/composables/useCachedApi";

const { cachedGet } = useCachedApi();

const route = useRoute();
const store = useStore();
const warehouseId = route.params.id;

const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const successMessage = ref(null);
const searchQuery = ref("");
const currentPage = ref(1);
const perPage = 15;

const warehouse = ref(null);
const stocks = ref([]);
const pendingCount = ref(0);
const currentUser = computed(() => store.getters["auth/currentUser"]);

const hasRole = (roleNames) => {
  const normalizedRoleNames = roleNames.map((roleName) =>
    roleName.toLowerCase(),
  );
  const roles = currentUser.value?.roles || [];
  const roleNamesFromUser = currentUser.value?.role_names || [];

  return (
    roles.some((role) => {
      const roleName = role?.name?.toLowerCase();
      const roleLabel = role?.label?.toLowerCase();
      return (
        normalizedRoleNames.includes(roleName) ||
        normalizedRoleNames.includes(roleLabel)
      );
    }) ||
    roleNamesFromUser.some((roleName) =>
      normalizedRoleNames.includes(roleName?.toLowerCase()),
    )
  );
};

const isSuperAdmin = computed(() =>
  hasRole(["super_admin", "superadmin", "super administrateur"]),
);

const validStocks = computed(() => {
  return stocks.value.filter((stock) =>
    Boolean(stock.product?.item_designation?.trim()),
  );
});

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

// Prix promo tel qu'enregistré dans warehouse_products (sans repli sur products)
const getPromoPrice = (stock) => {
  return toNumber(stock.price_promo);
};

// Prix du libellé associé au produit (catalogue libelles)
const getLibellePrice = (stock) => {
  return toNumber(stock.product?.libelle?.price);
};

// Montant de TVA unitaire au prix promotionnel : comme au POS, le prix promo est HT
// et la TVA facturée est celle du produit
const getPromoVatAmount = (stock) => {
  return (getLibellePrice(stock) * toNumber(stock.product?.vat_rate)) / 100;
};

const getPriceHTVA = (stock) => toNumber(stock.unit_price);

const getPriceTVAC = (stock) => {
  return getPriceHTVA(stock) * (1 + toNumber(stock.product?.vat_rate) / 100);
};

const getPurchasePrice = (stock) => toNumber(stock.purchase_price);

// Bénéfice unitaire HTVA = prix de vente du stock - prix d'achat réel.
const getProfit = (stock) => getPriceHTVA(stock) - getPurchasePrice(stock);

const getProfitMargin = (stock) => {
  const sellingPrice = getPriceHTVA(stock);
  return sellingPrice > 0 ? (getProfit(stock) / sellingPrice) * 100 : 0;
};

// Compare les prix du catalogue (products) avec ceux du stock (warehouse_products).
// Le POS privilégie products.price et se rabat sur products.price_promo : tout écart
// signifie que le prix facturé n'est pas celui du stock.
const getPriceMismatches = (stock) => {
  const issues = [];
  const catalogPrice = toNumber(stock.product?.price);
  const catalogPromo = toNumber(stock.product?.price_promo);

  if (catalogPrice > 0 && catalogPrice !== getPriceHTVA(stock)) {
    issues.push(
      `Prix catalogue ${formatNumber(catalogPrice)} ≠ prix stock ${formatNumber(getPriceHTVA(stock))}`,
    );
  }
  if (
    (stock.price_promo === null || stock.price_promo === undefined) &&
    catalogPromo > 0
  ) {
    issues.push(
      `Promo absente du stock, promo catalogue ${formatNumber(catalogPromo)} utilisée`,
    );
  } else if (catalogPromo > 0 && catalogPromo !== getPromoPrice(stock)) {
    issues.push(
      `Promo catalogue ${formatNumber(catalogPromo)} ≠ promo stock ${formatNumber(getPromoPrice(stock))}`,
    );
  }
  return issues;
};

const showOnlyMismatches = ref(false);

const mismatchCount = computed(
  () =>
    validStocks.value.filter((stock) => getPriceMismatches(stock).length > 0)
      .length,
);

const getStockDisplayPrice = (stock) => {
  if (isSuperAdmin.value && getLibellePrice(stock) > 0) {
    return getLibellePrice(stock);
  }

  return toNumber(stock.unit_price);
};

const getStockLineTotal = (stock) => {
  return toNumber(stock.quantity) * getStockDisplayPrice(stock);
};

// Chiffre d'affaires si tout le stock est vendu au prix promotionnel (libellé)
const getStockPromoLineTotal = (stock) => {
  return toNumber(stock.quantity) * getLibellePrice(stock);
};

const groupRevenueByCurrency = (stockList, getLineTotal = getStockLineTotal) => {
  return stockList.reduce((totals, stock) => {
    const currency = stock.currency || "BIF";
    totals[currency] = (totals[currency] || 0) + getLineTotal(stock);
    return totals;
  }, {});
};

const hasPromoPrice = (stock) => getLibellePrice(stock) > 0;

const formatNumber = (value) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
};

const formatCurrency = (amount, currency = "BIF") => {
  return `${formatNumber(amount)} ${currency || "BIF"}`;
};

const formatCurrencyTotals = (totals) => {
  const entries = Object.entries(totals);
  if (entries.length === 0) return formatCurrency(0, "BIF");
  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" / ");
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const slugifyFileName = (value) => {
  return String(value || "stock")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-]/g, "");
};

const buildStockTableHtml = () => {
  const rows = filteredStocks.value
    .map((stock, index) => {
      const quantity = toNumber(stock.quantity);
      const total = getStockLineTotal(stock);
      const currency = escapeHtml(stock.currency || "BIF");
      const mismatches = getPriceMismatches(stock);

      return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(stock.product?.item_code || "")}</td>
        <td>${escapeHtml(stock.product?.item_designation || "")}</td>
        <td style="text-align:right;">${formatNumber(quantity)}</td>
        <td style="text-align:center;">${stock.is_alert ? "Alerte" : "-"}</td>
        <td style="text-align:center;">${formatNumber(stock.product?.vat_rate || 0)}%</td>
        <td style="text-align:right;">${formatNumber(getPriceHTVA(stock))} ${currency}</td>
        <td style="text-align:right;">${formatNumber(getPriceTVAC(stock))} ${currency}</td>
        <td style="text-align:right;">${formatNumber(getPurchasePrice(stock))} ${currency}</td>
        <td style="text-align:right;">${formatNumber(getProfit(stock))} ${currency} (${formatNumber(getProfitMargin(stock))}%)</td>
        <td style="text-align:right;">${getLibellePrice(stock) > 0 ? `${formatNumber(getLibellePrice(stock))} ${currency}` : "-"}</td>
        <td style="text-align:right;">${getLibellePrice(stock) > 0 ? `${formatNumber(getPromoVatAmount(stock))} ${currency} (${formatNumber(stock.product?.vat_rate || 0)}%)` : "-"}</td>
        <td style="text-align:right;">${formatNumber(total)} ${currency}</td>
        <td style="text-align:right;">${hasPromoPrice(stock) ? `${formatNumber(getStockPromoLineTotal(stock))} ${currency}` : "-"}</td>
        <td>${mismatches.length ? escapeHtml(mismatches.join(" ; ")) : "OK"}</td>
      </tr>
    `;
    })
    .join("");

  return `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Alerte</th>
              <th>TVA</th>
              <th>P.U. HTVA</th>
              <th>P.U. TVAC</th>
              <th>Prix d'achat</th>
              <th>Bénéfice</th>
              <th>Prix Promotionnel</th>
              <th>TVA Promo</th>
              <th>Total Produit</th>
              <th>Total Promo</th>
              <th>Contrôle prix</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold; background:#f2f2f2;">
              <td colspan="3" style="text-align:right;">Total</td>
              <td style="text-align:right;">${formatNumber(filteredStockQuantity.value)}</td>
              <td colspan="8"></td>
              <td style="text-align:right;">${escapeHtml(formatCurrencyTotals(filteredStockRevenueByCurrency.value))}</td>
              <td style="text-align:right;">${escapeHtml(formatCurrencyTotals(filteredPromoRevenueByCurrency.value))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>`;
};

const exportStockToExcel = () => {
  const fileName = `stock_${slugifyFileName(warehouse.value?.name || "principal")}_${new Date().toISOString().slice(0, 10)}.xls`;

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
          th { background: #1f4e78; color: white; }
        </style>
      </head>
      <body>
        ${buildStockTableHtml()}
      </body>
    </html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// PDF : ouvre une fenêtre d'impression propre (choisir « Enregistrer en PDF »)
const exportStockToPdf = () => {
  if (filteredStocks.value.length === 0) return;

  const title = escapeHtml(warehouse.value?.name || "Stock");
  const location = escapeHtml(warehouse.value?.location || "");
  const generatedAt = new Date().toLocaleString("fr-FR");
  const fileTitle = `stock_${slugifyFileName(warehouse.value?.name || "principal")}_${new Date().toISOString().slice(0, 10)}`;

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${fileTitle}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9px; padding: 15px; }
          .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 8px; }
          .header h2 { font-size: 16px; margin-bottom: 4px; }
          .header p { font-size: 10px; color: #666; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th, td { border: 1px solid #999; padding: 4px 5px; }
          th { background: #1f4e78; color: white; font-size: 9px; }
          tbody tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            body { padding: 0; }
            .summary, th, tfoot tr, tbody tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>État du stock — ${title}</h2>
          <p>${location ? `${location} — ` : ""}${generatedAt}</p>
        </div>
        <div class="summary">
          <span><strong>Produits :</strong> ${formatNumber(filteredStocks.value.length)}</span>
          <span><strong>Quantité totale :</strong> ${formatNumber(filteredStockQuantity.value)}</span>
          <span><strong>Valeur :</strong> ${escapeHtml(formatCurrencyTotals(filteredStockRevenueByCurrency.value))}</span>
          <span><strong>Valeur au prix promotionnel :</strong> ${escapeHtml(formatCurrencyTotals(filteredPromoRevenueByCurrency.value))}</span>
        </div>
        ${buildStockTableHtml()}
      </body>
    </html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    error.value =
      "Impossible d'ouvrir la fenêtre d'impression. Autorisez les fenêtres pop-up pour ce site.";
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

// Computed property pour filtrer les stocks
const filteredStocks = computed(() => {
  const baseStocks = showOnlyMismatches.value
    ? validStocks.value.filter((stock) => getPriceMismatches(stock).length > 0)
    : validStocks.value;

  if (!searchQuery.value) return baseStocks;

  const query = searchQuery.value.toLowerCase().trim();
  return baseStocks.filter((stock) => {
    const code = stock.product?.item_code?.toLowerCase() || "";
    const designation = stock.product?.item_designation?.toLowerCase() || "";
    return code.includes(query) || designation.includes(query);
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStocks.value.length / perPage));
});

const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredStocks.value.slice(start, start + perPage);
});

const pagination = computed(() => {
  const total = filteredStocks.value.length;
  const from = total === 0 ? 0 : (currentPage.value - 1) * perPage + 1;
  const to = total === 0 ? 0 : Math.min(currentPage.value * perPage, total);

  return {
    current_page: currentPage.value,
    last_page: totalPages.value,
    per_page: perPage,
    total,
    from,
    to,
  };
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4);
    } else {
      start = Math.max(1, end - 4);
    }
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
});

const filteredStockQuantity = computed(() => {
  return filteredStocks.value.reduce(
    (total, stock) => total + toNumber(stock.quantity),
    0,
  );
});

const stockRevenueByCurrency = computed(() =>
  groupRevenueByCurrency(validStocks.value),
);

const filteredStockRevenueByCurrency = computed(() =>
  groupRevenueByCurrency(filteredStocks.value),
);

const promoRevenueByCurrency = computed(() =>
  groupRevenueByCurrency(validStocks.value.filter(hasPromoPrice), getStockPromoLineTotal),
);

const filteredPromoRevenueByCurrency = computed(() =>
  groupRevenueByCurrency(filteredStocks.value.filter(hasPromoPrice), getStockPromoLineTotal),
);

const filteredPromoStocksCount = computed(
  () => filteredStocks.value.filter(hasPromoPrice).length,
);

const showQuickEntryModal = ref(false);
const showQuickExitModal = ref(false);
const showUnitPriceEditModal = ref(false);

const selectedStock = ref(null);

const quickEntryForm = ref({
  product_id: "",
  quantity: "",
  purchase_price: "",
  unit_price: "",
  currency: "BIF",
  date_expiration: "",
  movement_type: "EN",
  invoice_ref: "",
});

const quickExitForm = ref({
  product_id: "",
  quantity: "",
  unit_price: "",
  currency: "BIF",
  movement_type: "SN",
  invoice_ref: "",
});

const unitPriceEditForm = ref({
  purchase_price: "",
  unit_price: "",
  vat_rate: "",
});

// Prix TTC calculé à partir du prix de vente et de la TVA
const computeTtc = (price, vat) =>
  parseFloat(((parseFloat(price) || 0) * (1 + (parseFloat(vat) || 0) / 100)).toFixed(2));

const unitPriceEditTtc = computed(() =>
  unitPriceEditForm.value.unit_price === "" ||
  unitPriceEditForm.value.unit_price === null
    ? ""
    : computeTtc(unitPriceEditForm.value.unit_price, unitPriceEditForm.value.vat_rate),
);

onMounted(() => {
  fetchDashboard();
});

watch([searchQuery, showOnlyMismatches], () => {
  currentPage.value = 1;
});

watch(filteredStocks, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
});

const fetchDashboard = async () => {
  loading.value = true;
  try {
    const resp = await cachedGet(`warehouses/${warehouseId}/dashboard`);
    if (resp.data.success) {
      warehouse.value = resp.data.data.warehouse;
      stocks.value = resp.data.data.stocks;
      pendingCount.value = resp.data.data.pending_count;
      currentPage.value = 1;
    }
  } catch (err) {
    error.value = "Erreur lors du chargement";
  } finally {
    loading.value = false;
  }
};

// Entrée Rapide
const openQuickEntry = (stock) => {
  selectedStock.value = stock;
  quickEntryForm.value = {
    product_id: stock.product_id,
    quantity: "",
    purchase_price: stock.purchase_price ?? stock.unit_price ?? "",
    unit_price: stock.unit_price,
    currency: stock.currency,
    date_expiration: "",
    movement_type: "EN",
    invoice_ref: "",
  };
  showQuickEntryModal.value = true;
};

const closeQuickEntry = () => {
  showQuickEntryModal.value = false;
  quickEntryForm.value = {
    product_id: "",
    quantity: "",
    purchase_price: "",
    unit_price: "",
    currency: "BIF",
    date_expiration: "",
    movement_type: "EN",
    invoice_ref: "",
  };
};

const submitQuickEntry = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(
      `warehouses/${warehouseId}/quick-entry`,
      quickEntryForm.value,
    );
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickEntry();
      fetchDashboard();
      setTimeout(() => (successMessage.value = null), 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || "Erreur";
    setTimeout(() => (error.value = null), 5000);
  } finally {
    submitting.value = false;
  }
};

// Sortie Rapide
const openQuickExit = (stock) => {
  selectedStock.value = stock;
  quickExitForm.value = {
    product_id: stock.product_id,
    quantity: "",
    unit_price: getStockDisplayPrice(stock),
    currency: stock.currency || "BIF",
    movement_type: "SN",
    invoice_ref: "",
  };
  showQuickExitModal.value = true;
};

const closeQuickExit = () => {
  showQuickExitModal.value = false;
  quickExitForm.value = {
    product_id: "",
    quantity: "",
    unit_price: "",
    currency: "BIF",
    movement_type: "SN",
    invoice_ref: "",
  };
};

const submitQuickExit = async () => {
  submitting.value = true;
  try {
    const resp = await api.post(
      `warehouses/${warehouseId}/quick-exit`,
      quickExitForm.value,
    );
    if (resp.data.success) {
      successMessage.value = resp.data.message;
      closeQuickExit();
      fetchDashboard();
      setTimeout(() => (successMessage.value = null), 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || "Erreur";
    setTimeout(() => (error.value = null), 5000);
  } finally {
    submitting.value = false;
  }
};

// Modification du prix unitaire
const openUnitPriceEdit = (stock) => {
  selectedStock.value = stock;
  unitPriceEditForm.value = {
    purchase_price: stock.purchase_price ?? "",
    unit_price: stock.unit_price ?? "",
    vat_rate: stock.product?.vat_rate ?? 0,
  };
  showUnitPriceEditModal.value = true;
};

const closeUnitPriceEdit = () => {
  showUnitPriceEditModal.value = false;
  unitPriceEditForm.value = {
    purchase_price: "",
    unit_price: "",
    vat_rate: "",
  };
};

const submitUnitPriceEdit = async () => {
  const rawUnitPrice = unitPriceEditForm.value.unit_price;
  const rawPurchasePrice = unitPriceEditForm.value.purchase_price;
  const unitPrice = Number(rawUnitPrice);
  const purchasePrice =
    rawPurchasePrice === "" || rawPurchasePrice === null
      ? null
      : Number(rawPurchasePrice);
  const vatRate = Number(unitPriceEditForm.value.vat_rate);
  if (
    rawUnitPrice === "" ||
    rawUnitPrice === null ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    !Number.isFinite(vatRate) ||
    vatRate < 0 ||
    vatRate > 100 ||
    (purchasePrice !== null &&
      (!Number.isFinite(purchasePrice) || purchasePrice < 0))
  ) {
    error.value =
      "Veuillez saisir un prix d'achat, un prix de vente et un taux de TVA valides.";
    return;
  }

  submitting.value = true;
  try {
    const productId =
      selectedStock.value?.product?.id || selectedStock.value?.product_id;
    const productResp = await api.patch(`products/${productId}`, {
      vat_rate: vatRate,
    });
    if (!productResp.data.success) {
      throw new Error(
        productResp.data.message || "Impossible de modifier la TVA.",
      );
    }
    const resp = await api.patch(
      `warehouse-products/${selectedStock.value.id}`,
      { unit_price: unitPrice, purchase_price: purchasePrice },
    );
    if (resp.data.success) {
      successMessage.value =
        "Prix d'achat, prix de vente et TVA modifiés avec succès.";
      closeUnitPriceEdit();
      await fetchDashboard();
      setTimeout(() => (successMessage.value = null), 3000);
    } else {
      throw new Error(
        resp.data.message || "Impossible de modifier les prix.",
      );
    }
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Erreur lors de la modification des prix.";
    setTimeout(() => (error.value = null), 5000);
  } finally {
    submitting.value = false;
  }
};

const calculateIndex = (index) => {
  return pagination.value.from + index;
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 12px;
}
</style>
