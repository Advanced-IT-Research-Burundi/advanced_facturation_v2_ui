<template>
  <div class="container-fluid">
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="fw-bold text-primary">Gestion de Boulangerie</h2>
        <p class="text-muted">Production et gestion des produits de boulangerie</p>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'production' }" 
           @click="activeTab = 'production'" href="#">
          <i class="pi pi-cog me-2"></i>Production
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'recipes' }" 
           @click="activeTab = 'recipes'" href="#">
          <i class="pi pi-book me-2"></i>Recettes
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'ingredients' }" 
           @click="activeTab = 'ingredients'" href="#">
          <i class="pi pi-shopping-bag me-2"></i>Ingrédients
        </a>
      </li>
    </ul>

    <!-- Production Tab -->
    <div v-if="activeTab === 'production'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>Productions en cours</h4>
        <button class="btn btn-primary" @click="showProductionModal = true">
          <i class="pi pi-plus me-2"></i>Nouvelle Production
        </button>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>N° Lot</th>
                    <th>Recette</th>
                    <th>Quantité</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Produits finis</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prod in productions" :key="prod.id">
                    <td>{{ prod.batch_number }}</td>
                    <td>{{ prod.recipe?.name }}</td>
                    <td>{{ prod.quantity }} unités</td>
                    <td>{{ new Date(prod.production_date).toLocaleDateString() }}</td>
                    <td>
                      <span class="badge" :class="{
                        'bg-warning': prod.status === 'planned',
                        'bg-info': prod.status === 'in_progress',
                        'bg-success': prod.status === 'completed',
                        'bg-primary': prod.status === 'transferred'
                      }">
                        {{ prod.status }}
                      </span>
                    </td>
                    <td>{{ prod.finished_products || 0 }}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button v-if="prod.status === 'planned'" 
                                class="btn btn-info" 
                                @click="updateProductionStatus(prod.id, 'in_progress')">
                          Démarrer
                        </button>
                        <button v-if="prod.status === 'in_progress'" 
                                class="btn btn-success" 
                                @click="updateProductionStatus(prod.id, 'completed')">
                          Terminer
                        </button>
                        <button v-if="prod.status === 'completed'" 
                                class="btn btn-primary" 
                                @click="transferToStock(prod.id)">
                          Transférer au stock
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Production Modal -->
    <div v-if="showProductionModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nouvelle Production</h5>
            <button type="button" class="btn-close" @click="showProductionModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="startProduction">
              <div class="mb-3">
                <label class="form-label">Recette</label>
                <select v-model="newProduction.recipe_id" class="form-select" required>
                  <option :value="null">Sélectionner une recette</option>
                  <option v-for="recipe in recipes" :key="recipe.id" :value="recipe.id">
                    {{ recipe.name }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Quantité</label>
                <input v-model.number="newProduction.quantity" type="number" class="form-control" min="1" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Date de production</label>
                <input v-model="newProduction.production_date" type="date" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">N° de lot</label>
                <input v-model="newProduction.batch_number" type="text" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea v-model="newProduction.notes" class="form-control" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showProductionModal = false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="startProduction">Créer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipes Tab -->
    <div v-if="activeTab === 'recipes'">
      <h4>Liste des Recettes</h4>
      <p class="text-muted">Gérez vos recettes de production</p>
    </div>

    <!-- Ingredients Tab -->
    <div v-if="activeTab === 'ingredients'">
      <h4>Gestion des Ingrédients</h4>
      <p class="text-muted">Suivez vos stocks d'ingrédients</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const activeTab = ref('production');
const productions = ref([]);
const recipes = ref([]);
const ingredients = ref([]);
const showProductionModal = ref(false);

const newProduction = ref({
  recipe_id: null,
  quantity: 1,
  production_date: new Date().toISOString().split('T')[0],
  batch_number: '',
  notes: ''
});

const productionForm = ref({
  id: null,
  recipe_id: null,
  quantity: 0,
  status: 'planned',
  ingredients_used: [],
  finished_products: 0,
  waste: 0,
  production_date: new Date().toISOString().split('T')[0]
});

// Fetch data
const fetchProductions = async () => {
  try {
    const response = await axios.get('/api/bakery/productions');
    productions.value = response.data;
  } catch (error) {
    console.error('Error fetching productions:', error);
  }
};

const fetchRecipes = async () => {
  try {
    const response = await axios.get('/api/bakery/recipes');
    recipes.value = response.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
  }
};

const startProduction = async () => {
  try {
    await axios.post('/api/bakery/productions', newProduction.value);
    showProductionModal.value = false;
    fetchProductions();
    resetForm();
  } catch (error) {
    console.error('Error starting production:', error);
  }
};

const updateProductionStatus = async (id, status) => {
  try {
    await axios.patch(`/api/bakery/productions/${id}`, { status });
    fetchProductions();
  } catch (error) {
    console.error('Error updating status:', error);
  }
};

const transferToStock = async (productionId) => {
  try {
    await axios.post(`/api/bakery/productions/${productionId}/transfer`);
    fetchProductions();
  } catch (error) {
    console.error('Error transferring to stock:', error);
  }
};

const resetForm = () => {
  newProduction.value = {
    recipe_id: null,
    quantity: 1,
    production_date: new Date().toISOString().split('T')[0],
    batch_number: '',
    notes: ''
  };
};

onMounted(() => {
  fetchProductions();
  fetchRecipes();
});
</script>
<style scoped>
.nav-link {
  cursor: pointer;
}
.modal {
  display: block;
}
</style>