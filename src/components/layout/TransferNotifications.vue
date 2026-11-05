<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Bell } from "lucide-vue-next";
import api from "@/services/api";
import { useAdminAccess } from "@/composables/useAdminAccess";
import { useConfirm } from "@/composables/useConfirm";
import { useToast } from "@/composables/useToast";

const REFRESH_INTERVAL_MS = 30000;

const toast = useToast();
const { confirm } = useConfirm();
const { currentUser } = useAdminAccess();

const transfers = ref([]);
const processingId = ref(null);
let knownTransferIds = null;
let refreshTimer = null;

const pendingTransfers = computed(() =>
  transfers.value.filter(
    (transfer) => transfer.status === "pending" && Number(transfer.to_user_id) === Number(currentUser.value?.id),
  ),
);

const formatAmount = (amount) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount)} FBu`;

const senderName = (transfer) => transfer.from_user?.name || "Un utilisateur";

const announceNewTransfers = () => {
  // Au premier chargement, seul le compteur de la cloche signale les transferts existants
  if (knownTransferIds) {
    pendingTransfers.value
      .filter((transfer) => !knownTransferIds.has(transfer.id))
      .forEach((transfer) => {
        toast.info(`${senderName(transfer)} vous a envoyé ${formatAmount(transfer.amount)}`);
      });
  }
  knownTransferIds = new Set(pendingTransfers.value.map((transfer) => transfer.id));
};

const fetchTransfers = async () => {
  try {
    const response = await api.get("/cash-transfers");
    if (response.data.success) {
      transfers.value = response.data.data.transfers || [];
      announceNewTransfers();
    }
  } catch (error) {
    console.error("Error fetching transfer notifications:", error);
  }
};

const decide = async (transfer, action) => {
  const isAccept = action === "accept";
  const confirmed = await confirm(
    `${isAccept ? "Accepter" : "Refuser"} ${formatAmount(transfer.amount)} de ${senderName(transfer)} ?`,
    {
      confirmText: isAccept ? "Accepter" : "Refuser",
      confirmClass: isAccept ? "btn-success" : "btn-danger",
    },
  );
  if (!confirmed) return;

  processingId.value = transfer.id;
  try {
    const response = await api.post(`/cash-transfers/${transfer.id}/${action}`);
    toast.success(response.data.message);
    window.dispatchEvent(new CustomEvent("cash-transfers-changed"));
  } catch (error) {
    toast.error(error.response?.data?.message || "Erreur lors du traitement du transfert");
  } finally {
    processingId.value = null;
    await fetchTransfers();
  }
};

onMounted(() => {
  fetchTransfers();
  refreshTimer = setInterval(fetchTransfers, REFRESH_INTERVAL_MS);
  window.addEventListener("cash-transfers-changed", fetchTransfers);
});

onUnmounted(() => {
  clearInterval(refreshTimer);
  window.removeEventListener("cash-transfers-changed", fetchTransfers);
});
</script>

<template>
  <div class="dropdown">
    <button
      type="button"
      class="btn btn-link text-secondary position-relative p-1"
      data-bs-toggle="dropdown"
      data-bs-auto-close="outside"
      aria-expanded="false"
      :aria-label="`Transferts reçus : ${pendingTransfers.length} à traiter`"
      title="Transferts reçus"
    >
      <Bell :size="20" />
      <span
        v-if="pendingTransfers.length"
        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
      >
        {{ pendingTransfers.length }}
      </span>
    </button>

    <div class="dropdown-menu dropdown-menu-end shadow-sm p-0 notifications-menu">
      <div class="px-3 py-2 border-bottom fw-bold">Transferts reçus</div>
      <div v-if="!pendingTransfers.length" class="px-3 py-4 text-center text-muted small">
        Aucun transfert à traiter
      </div>
      <div v-for="transfer in pendingTransfers" :key="transfer.id" class="px-3 py-2 border-bottom">
        <div class="small">
          <b>{{ senderName(transfer) }}</b> vous a envoyé
          <b class="text-nowrap">{{ formatAmount(transfer.amount) }}</b>
        </div>
        <div v-if="transfer.note" class="small text-muted text-break">{{ transfer.note }}</div>
        <div class="d-flex gap-2 mt-2">
          <button
            type="button"
            class="btn btn-sm btn-success"
            :disabled="processingId === transfer.id"
            @click="decide(transfer, 'accept')"
          >
            Accepter
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :disabled="processingId === transfer.id"
            @click="decide(transfer, 'reject')"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-menu {
  width: 320px;
  max-width: 90vw;
  max-height: 60vh;
  overflow-y: auto;
}
</style>
