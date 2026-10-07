<script setup>
import { computed, nextTick, ref } from "vue";
import api from "@/services/api";

const TAILLE_LOT = 5;

const emit = defineEmits(["close", "done"]);

const running = ref(false);
const stopRequested = ref(false);
const details = ref([]);
const restants = ref(null);
const erreurGlobale = ref("");
const listRef = ref(null);
const filtre = ref("all");

const nbSucces = computed(() => details.value.filter((d) => d.success).length);
const nbErreurs = computed(() => details.value.length - nbSucces.value);
const detailsAffiches = computed(() =>
  filtre.value === "errors" ? details.value.filter((d) => !d.success) : details.value
);
const progression = computed(() => {
  const total = details.value.length + (restants.value ?? 0);
  return total ? Math.round((details.value.length / total) * 100) : 0;
});

const scrollToBottom = async () => {
  await nextTick();
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
};

const start = async () => {
  running.value = true;
  stopRequested.value = false;
  erreurGlobale.value = "";
  let precedent = null;

  try {
    while (!stopRequested.value) {
      const response = await api.post("/obr/sync-all", { limite: TAILLE_LOT });
      const lot = response.data.data.details || [];
      details.value.push(...lot);
      restants.value = response.data.data.restants;
      scrollToBottom();

      // Arrêt quand tout est envoyé, ou quand plus rien n'avance (ex: OBR injoignable, éléments restés en attente)
      if (restants.value === 0 || lot.length === 0) break;
      if (precedent !== null && restants.value >= precedent) {
        erreurGlobale.value = "Plus rien n'avance : synchronisation arrêtée. Vérifiez les erreurs ci-dessous.";
        break;
      }
      precedent = restants.value;
    }
  } catch (err) {
    erreurGlobale.value = err.response?.data?.message || "Erreur lors de la synchronisation OBR.";
  } finally {
    running.value = false;
    emit("done");
  }
};

const close = () => {
  if (running.value) {
    stopRequested.value = true;
    return;
  }
  emit("close");
};

defineExpose({ start });
</script>

<template>
  <div class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-cloud-upload me-1"></i> Synchronisation OBR
          </h5>
          <button type="button" class="btn-close" :disabled="running" @click="close"></button>
        </div>

        <div class="modal-body">
          <div class="d-flex flex-wrap gap-3 align-items-center mb-2">
            <span class="badge bg-success fs-6">{{ nbSucces }} acceptée(s)</span>
            <span class="badge bg-danger fs-6">{{ nbErreurs }} erreur(s)</span>
            <span v-if="restants !== null" class="badge bg-secondary fs-6">{{ restants }} en attente</span>
            <span v-if="running" class="text-muted small">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Envoi en cours (lots de {{ TAILLE_LOT }})...
            </span>
            <div class="btn-group btn-group-sm ms-auto">
              <button class="btn" :class="filtre === 'all' ? 'btn-primary' : 'btn-outline-primary'" @click="filtre = 'all'">
                Tout
              </button>
              <button class="btn" :class="filtre === 'errors' ? 'btn-danger' : 'btn-outline-danger'" @click="filtre = 'errors'">
                Erreurs seulement
              </button>
            </div>
          </div>

          <div class="progress mb-3" style="height: 6px">
            <div class="progress-bar" :class="{ 'progress-bar-striped progress-bar-animated': running }" :style="{ width: `${progression}%` }"></div>
          </div>

          <div v-if="erreurGlobale" class="alert alert-danger py-2">{{ erreurGlobale }}</div>

          <div ref="listRef" class="table-responsive" style="max-height: 55vh; overflow-y: auto">
            <table class="table table-sm table-hover align-middle mb-0">
              <thead class="table-light sticky-top">
                <tr>
                  <th style="width: 40px"></th>
                  <th style="width: 110px">Type</th>
                  <th style="width: 220px">Référence</th>
                  <th>Réponse OBR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detail, index) in detailsAffiches" :key="`${detail.type}-${detail.id}-${index}`">
                  <td>
                    <i v-if="detail.success" class="bi bi-check-circle-fill text-success"></i>
                    <i v-else class="bi bi-x-circle-fill text-danger"></i>
                  </td>
                  <td>{{ detail.type }}</td>
                  <td class="fw-semibold text-break">{{ detail.reference }}</td>
                  <td class="small text-break" :class="{ 'text-danger': !detail.success }">{{ detail.message || "-" }}</td>
                </tr>
                <tr v-if="detailsAffiches.length === 0">
                  <td colspan="4" class="text-center text-muted py-4">
                    {{ running ? "En attente des premières réponses de l'OBR..." : "Aucun élément envoyé." }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <router-link to="/settings/obr-logs" class="btn btn-link me-auto" @click="close">
            Voir les logs OBR complets
          </router-link>
          <button v-if="running" class="btn btn-outline-danger" :disabled="stopRequested" @click="stopRequested = true">
            {{ stopRequested ? "Arrêt après ce lot..." : "Arrêter" }}
          </button>
          <button v-else class="btn btn-secondary" @click="close">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>
