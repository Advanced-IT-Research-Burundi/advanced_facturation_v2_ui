<template>
  <div>
    <StockHeader />

    <div class="mt-4 container">
      <div class="d-flex">
        <input type="text" placeholder="Nom du fichier" v-model="dmcNumber" />
        <button @click="importer">Importer</button>
      </div>

      <div>
        <div v-if="stockItem">
          <Alert variant="warning">{{ stockItem?.data?.msg }}</Alert>
          <table class="table table-hover table-sm table-bordered">
            <thead>
              <tr>
                <td>#</td>
                <th>Rubrique Tarifaire</th>
                <th>Designation</th>
                <th>Description</th>
                <th>Quantité</th>
                <th>Produit Associer</th>
                <th>Quantité Associer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in stockItem.data.result.items"
                :key="item.id"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ item.rubrique_tarifaire }}</td>
                <td>{{ item.description_article }}</td>

                <td>{{ item.description_packet }}</td>
                <td>{{ item.quantite }}</td>
                <td>
                  <input type="text" v-model="item.quantite" />
                </td>
                <td>
                  <input type="text" v-model="item.quantite" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from "@/services/api.js";
import StockHeader from "../stocks/StockHeader.vue";
import { ref, computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

const dmcNumber = ref("2026BIPORC228");
const importer = () => {
  api
    .get(`/getDmcItems/${dmcNumber.value}`)
    .then((res) => {
      console.log(res.data);
      store.state.stocksItems = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const stockItem = computed(() => {
  return store.state?.stocksItems;
});
</script>

<style></style>
