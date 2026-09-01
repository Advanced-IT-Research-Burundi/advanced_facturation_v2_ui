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
                <td>Unite</td>
                <th>Prix d'achat</th>
                <th>Nombre par paquet</th>
                <th>Devise</th>
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
                  <input
                    type="text"
                    v-model="lineMouvememt.item_designation"
                    placeholder="Designation"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="lineMouvememt.item_measurement_unit"
                    placeholder="Unité"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="lineMouvememt.item_cost_price"
                    placeholder="Prix"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="lineMouvememt.nombre_par_paquet"
                    placeholder="Nombre par paquet"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="lineMouvememt.item_cost_price_currency"
                    placeholder="Devise"
                  />
                </td>
                <td>
                  <button class="btn btn-success" @click="saveItem(item)">
                    Valider
                  </button>
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

const lineMouvememt = ref({
  item_code: "",
  item_designation: "",
  item_quantity: "",
  item_measurement_unit: "",
  item_cost_price: "",
  item_cost_price_currency: "",
  item_movement_type: "EN",
  item_movement_invoice_ref: "",
  item_movement_description: "",
  item_movement_date: "",
  reference_dmc: "",
  rubrique_tarifaire: "",
  nombre_par_paquet: "",
  description_paquet: "",
});

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
