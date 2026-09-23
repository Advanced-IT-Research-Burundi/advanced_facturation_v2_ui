<template>
  <div class="container-fluid p-0">
    <settings-header></settings-header>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
      <div>
        <h1 class="h3 mb-0">Synchronisation</h1>
        <div class="text-muted small">
          Exécute <code>php artisan app:sync-data</code> pour synchroniser les données depuis le serveur principal.
        </div>
      </div>
      <div>
        <button class="btn btn-outline-secondary me-2" :disabled="running || logs.length === 0" @click="clearLogs">
          <i class="bi bi-eraser"></i> Effacer
        </button>
        <button class="btn btn-primary" :disabled="running" @click="runSync">
          <span v-if="running" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-arrow-repeat"></i>
          {{ running ? 'Synchronisation en cours...' : 'Lancer la synchronisation' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="lastRun && !running" class="alert py-2" :class="lastRun.status === 'success' ? 'alert-success' : 'alert-warning'">
      <i class="bi" :class="lastRun.status === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'"></i>
      Dernière synchronisation : {{ formatDate(lastRun.finished_at) }}
      <span v-if="lastRun.user"> par {{ lastRun.user }}</span>
      — {{ lastRun.status === 'success' ? 'réussie' : 'échouée' }}
    </div>

    <div class="card shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-terminal me-1"></i> Logs</span>
        <span class="small text-muted">{{ logs.length }} ligne(s)</span>
      </div>
      <div ref="consoleEl" class="sync-console font-monospace">
        <div v-if="logs.length === 0" class="text-secondary">
          Aucun log. Cliquez sur « Lancer la synchronisation ».
        </div>
        <div v-for="(log, index) in logs" :key="index" class="sync-line" :class="`sync-${log.level}`">
          <span class="sync-time">[{{ log.time }}]</span> {{ log.message }}
        </div>
        <div v-if="running" class="sync-line text-secondary">
          <span class="spinner-grow spinner-grow-sm"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import api from "@/services/api";
import SettingsHeader from "./SettingsHeader.vue";

const logs = ref([]);
const running = ref(false);
const error = ref("");
const lastRun = ref(null);
const consoleEl = ref(null);

const scrollToBottom = async () => {
  await nextTick();
  if (consoleEl.value) {
    consoleEl.value.scrollTop = consoleEl.value.scrollHeight;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "-");

const fetchLastRun = async () => {
  try {
    const response = await api.get("/sync-data/last");
    const data = response.data.data || {};
    lastRun.value = data.last_run;
    if (data.last_run?.logs && logs.value.length === 0) {
      logs.value = data.last_run.logs;
      scrollToBottom();
    }
    if (data.running) {
      error.value = "Une synchronisation est déjà en cours sur le serveur.";
    }
  } catch (e) {
    error.value = e.response?.data?.message || "Impossible de charger la dernière synchronisation.";
  }
};

const clearLogs = () => {
  logs.value = [];
};

// Les logs sont diffusés en direct (NDJSON) : axios ne sait pas lire un flux dans le navigateur, d'où fetch.
const runSync = async () => {
  running.value = true;
  error.value = "";
  logs.value = [];

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sync-data/run`, {
      method: "POST",
      headers: {
        Accept: "application/x-ndjson, application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Erreur HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const entry = JSON.parse(line);
        if (entry.level !== "done") {
          logs.value.push(entry);
        }
      }
      scrollToBottom();
    }
  } catch (e) {
    error.value = e.message || "La synchronisation a échoué.";
  } finally {
    running.value = false;
    fetchLastRun();
  }
};

onMounted(fetchLastRun);
</script>

<style scoped>
.sync-console {
  background: #1e1e1e;
  color: #d4d4d4;
  font-size: 0.85rem;
  height: 60vh;
  overflow-y: auto;
  padding: 1rem;
  border-bottom-left-radius: var(--bs-card-inner-border-radius);
  border-bottom-right-radius: var(--bs-card-inner-border-radius);
}
.sync-line {
  white-space: pre-wrap;
  word-break: break-word;
}
.sync-time {
  color: #808080;
}
.sync-info {
  color: #d4d4d4;
}
.sync-comment {
  color: #e5c07b;
}
.sync-success {
  color: #98c379;
}
.sync-error {
  color: #e06c75;
}
</style>
