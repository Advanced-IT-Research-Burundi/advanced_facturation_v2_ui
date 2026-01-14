<template>
    <div>
        <router-link v-for="route in routeListes" :key="route.label" :to="route.to" >
            <i :class="route.icon"></i> {{ route.label }}
        </router-link>
    </div>
</template>

<script setup>

    const routeListes = [
        { label: 'Liste des stocks', to: '/stocks' , icon: 'pi pi-home' },
        { label: 'Produits', to: '/stocks/produits' , icon: 'pi pi-box' },
        { label: 'Categories des produits', to: '/stocks/categories' , icon: 'pi pi-tags' },
        { label: 'Fournisseurs', to: '/stocks/fournisseurs' , icon: 'pi pi-user' },
        { label: 'Bon de commandes', to: '/stocks/bon-de-commandes' , icon: 'pi pi-file' },
        { label: 'Bar Code Generator', to: '/stocks/bar-code-generator' , icon: 'pi pi-qrcode' },
    ]

</script>