<template>
  <div>
    <StockHeader />

    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Libellés des produits</h2>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreateModal">
          <i class="bi bi-plus-lg"></i>
          Nouveau libellé
        </button>
      </div>

      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="bg-light">
                <tr>
                  <th class="border-bottom-0 py-3 ps-4">Nom</th>
                  <th class="border-bottom-0 py-3">Description</th>
                  <th class="border-bottom-0 py-3">Prix</th>
                  <th class="border-bottom-0 py-3">TVA (%)</th>
                  <th class="border-bottom-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="libelle in libelles" :key="libelle.id">
                  <td class="ps-4 fw-medium">{{ libelle.name }}</td>
                  <td>{{ libelle.description || '-' }}</td>
                  <td>{{ libelle.price ?? '-' }}</td>
                  <td>{{ libelle.tva ?? '-' }}</td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(libelle)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(libelle)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="!loading && libelles.length === 0">
                  <td colspan="5" class="text-center py-5 text-muted">
                    Aucun libellé trouvé
                  </td>
                </tr>
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-5 text-muted">
                    Chargement...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-footer bg-white border-top-0 py-3" v-if="pagination.total > 0">
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Affichage de {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }} éléments
            </small>
            <nav aria-label="Page navigation">
              <ul class="pagination mb-0">
                <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
                  <button class="page-link" @click="fetchLibelles(pagination.prev_page_url)" :disabled="!pagination.prev_page_url">
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                <li class="page-item active" aria-current="page">
                  <span class="page-link">{{ pagination.current_page }}</span>
                </li>
                <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
                  <button class="page-link" @click="fetchLibelles(pagination.next_page_url)" :disabled="!pagination.next_page_url">
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title">{{ isEditing ? 'Modifier le libellé' : 'Nouveau libellé' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="mb-3">
                <label for="name" class="form-label">Nom <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="name" v-model="form.name" required placeholder="Nom du libellé">
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" v-model="form.description" rows="3" placeholder="Description courte (optionnel)"></textarea>
              </div>
              <div class="mb-3">
                <label for="price" class="form-label">Prix</label>
                <input type="number" class="form-control" id="price" v-model="form.price" min="0" step="0.01" placeholder="Prix (optionnel)">
              </div>
              <div class="mb-3">
                <label for="tva" class="form-label">TVA (%)</label>
                <input type="number" class="form-control" id="tva" v-model="form.tva" min="0" max="100" step="0.01" placeholder="TVA (optionnel)">
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="formLoading">
                  <span v-if="formLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {{ isEditing ? 'Mettre à jour' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center py-4">
            <i class="bi bi-exclamation-circle text-danger display-1 mb-3"></i>
            <h5 class="mb-3">Êtes-vous sûr ?</h5>
            <p class="text-muted mb-4">Cette action est irréversible.</p>
            <div class="d-flex justify-content-center gap-2">
              <button type="button" class="btn btn-light" @click="closeDeleteModal">Annuler</button>
              <button type="button" class="btn btn-danger" @click="deleteLibelle" :disabled="formLoading">
                <span v-if="formLoading" class="spinner-border spinner-border-sm me-1"></span>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';
import StockHeader from '../stocks/StockHeader.vue';
import { useToast } from '@/composables/useToast';

const toast = useToast()
const loading = ref(false)
const formLoading = ref(false)
const libelles = ref([])

const pagination = ref({
  current_page: 1,
  from: 0,
  to: 0,
  total: 0,
  prev_page_url: null,
  next_page_url: null
})

const showModal = ref(false)
const isEditing = ref(false)
const form = reactive({
  id: null,
  name: '',
  description: '',
  price: null,
  tva: null
})

const showDeleteModal = ref(false)
const libelleToDelete = ref(null)

onMounted(() => {
  fetchLibelles()
})

const fetchLibelles = async (url = '/libelles') => {
  loading.value = true
  try {
    let endpoint = url
    if (url.startsWith('http')) {
      const urlObj = new URL(url)
      endpoint = '/libelles' + urlObj.search
    }

    const resp = await api.get(endpoint)
    if (resp.data.success) {
      const result = resp.data.data
      libelles.value = result.data || []
      pagination.value = {
        current_page: result.current_page,
        from: result.from,
        to: result.to,
        total: result.total,
        prev_page_url: result.prev_page_url,
        next_page_url: result.next_page_url
      }
    }
  } catch (error) {
    console.error("Erreur chargement libelles:", error)
    toast.error("Impossible de charger les libellés.")
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.id = null
  form.name = ''
  form.description = ''
  form.price = null
  form.tva = null
  showModal.value = true
}

const openEditModal = (libelle) => {
  isEditing.value = true
  form.id = libelle.id
  form.name = libelle.name
  form.description = libelle.description
  form.price = libelle.price ?? null
  form.tva = libelle.tva ?? null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  formLoading.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price === '' ? null : form.price,
      tva: form.tva === '' ? null : form.tva
    }

    if (isEditing.value) {
      await api.put(`/libelles/${form.id}`, payload)
    } else {
      await api.post('/libelles', payload)
    }

    await fetchLibelles()
    closeModal()
  } catch (error) {
    console.error("Erreur sauvegarde:", error)
    toast.error("Une erreur est survenue lors de la sauvegarde.")
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = (libelle) => {
  libelleToDelete.value = libelle
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  libelleToDelete.value = null
}

const deleteLibelle = async () => {
  if (!libelleToDelete.value) return

  formLoading.value = true
  try {
    await api.delete(`/libelles/${libelleToDelete.value.id}`)
    await fetchLibelles()
    closeDeleteModal()
  } catch (error) {
    console.error("Erreur suppression:", error)
    toast.error("Impossible de supprimer ce libellé.")
  } finally {
    formLoading.value = false
  }
}
</script>

<style scoped>
.table > :not(caption) > * > * {
  background-color: transparent;
}
</style>
