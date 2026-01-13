<template>
    <h1>Unites</h1>
    {{ product_units }}
</template>

<script setup>
import api from '@/services/api';
import store from '@/store';
import { onMounted } from 'vue';


onMounted(() => {
    fetchUnites()
})

const fetchUnites = async (page = 1) => {
    const resp = await api.get('product-units');
    store.state.data.product_units = resp.data

    
}

const product_units = computed(() => store.state.data.product_units);



</script>