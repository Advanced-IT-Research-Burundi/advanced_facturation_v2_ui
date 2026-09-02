<template>
  <div>
    <StockHeader />

    <div class="mt-4 container">
      <div class="d-flex">
        <input type="text" placeholder="Nom du fichier" v-model="dmcNumber" />
        <button @click="importer">Importer</button>
      </div>

      <div v-if="errorMessage" class="alert alert-danger">
        <ul>
          <li v-for="(error, index) in errorMessage.errors" :key="index">
            {{ error[0] }}
          </li>
        </ul>
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
                <th>Quantité</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in stockItem.data.result.items"
                :key="item.id"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <input
                    type="text"
                    v-model="getLine(item).rubrique_tarifaire"
                    :placeholder="item.rubrique_tarifaire"
                    @load="
                      !getLine(item).rubrique_tarifaire &&
                      (getLine(item).rubrique_tarifaire =
                        item.rubrique_tarifaire)
                    "
                  />
                </td>
                <td>{{ item.description_article }}</td>

                <td>{{ item.description_packet }}</td>
                <td>{{ item.quantite }}</td>
                <td>
                  <div class="position-relative">
                    <input
                      type="text"
                      v-model="getLine(item).item_designation"
                      @keyup="searchProductName(item)"
                      @blur="hideSuggestions(item)"
                      autocomplete="off"
                      placeholder="Designation"
                    />
                    <ul
                      v-if="suggestions[item.id]?.length"
                      class="list-group position-absolute w-100"
                      style="z-index: 10; max-height: 180px; overflow-y: auto"
                    >
                      <li
                        v-for="product in suggestions[item.id]"
                        :key="product.id"
                        class="list-group-item list-group-item-action py-1"
                        style="cursor: pointer"
                        @mousedown.prevent="selectProduct(item, product)"
                      >
                        {{ product.item_designation }}
                        <small class="text-muted"
                          >({{ product.item_measurement_unit }})</small
                        >
                      </li>
                    </ul>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    v-model="getLine(item).item_measurement_unit"
                    placeholder="Unité"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="getLine(item).item_cost_price"
                    placeholder="Prix"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="getLine(item).nombre_par_paquet"
                    placeholder="Nombre par paquet"
                  />
                </td>
                <td>
                  <select
                    name="item_cost_price_currency"
                    id="item_cost_price_currency"
                    v-model="getLine(item).item_cost_price_currency"
                  >
                    <option value="BIF">BIF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    v-model="getLine(item).item_quantity"
                    placeholder="Quantité"
                  />
                </td>
                <td>
                  <textarea
                    v-model="getLine(item).item_movement_description"
                    placeholder="Description"
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

// Chaque ligne importée garde son propre état, indexé par item.id,
// pour éviter que la saisie d'une ligne n'écrase les autres.
const lines = ref({});
const suggestions = ref({});
const errorMessage = ref("");

const getLine = (item) => {
  const id = item.id;

  if (!lines.value[id]) {
    lines.value[id] = {
      item_code: "",
      item_designation: "",
      item_quantity: item.quantite ?? "",
      item_measurement_unit: "",
      item_cost_price: "",
      item_cost_price_currency: "",
      item_movement_type: "EN",
      item_movement_invoice_ref: "",
      item_movement_description: "",
      item_movement_date: new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),

      reference_dmc: "",

      // Valeur par défaut provenant de item
      rubrique_tarifaire: item.rubrique_tarifaire ?? "",

      nombre_par_paquet: "",

      description_article: item.description_article ?? "",
      description_paquet: item.description_packet ?? "",

      product_id: null,
    };
  }

  return lines.value[id];
};

const saveItem = async (item) => {
  const line = getLine(item);
  line.reference_dmc = dmcNumber.value;
  try {
    const res = await api.post("/productstMovements", line);
    console.log(res.data);
  } catch (err) {
    console.log(err.response.data.message);
    errorMessage.value = err.response.data;
  }
};

const searchProductName = async (item) => {
  const term = getLine(item).item_designation?.trim();
  if (!term || term.length < 2) {
    suggestions.value[item.id] = [];
    return;
  }
  try {
    const res = await api.get(`/productsItemes/${encodeURIComponent(term)}`);
    suggestions.value[item.id] = res.data?.data ?? [];
  } catch (err) {
    console.log(err);
    suggestions.value[item.id] = [];
  }
};

const selectProduct = (item, product) => {
  const line = getLine(item);
  line.item_designation = product.item_designation;
  line.item_measurement_unit = product.item_measurement_unit;
  line.product_id = product.id;
  line.item_code = product.id;
  suggestions.value[item.id] = [];
};

const hideSuggestions = (item) => {
  // Délai pour laisser le @mousedown de sélection s'exécuter avant le blur.
  setTimeout(() => {
    suggestions.value[item.id] = [];
  }, 150);
};

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
