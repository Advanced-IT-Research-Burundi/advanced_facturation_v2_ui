import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import PrimeVue from 'primevue/config';
import Lara from '@primevue/themes/lara';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';

import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/base.css";

const app = createApp(App);


app.use(PrimeVue, {
        ripple: true, 
        inputStyle: "outlined", 
        theme: {
        preset: Lara,
        options: {
            darkModeSelector: '.dark-mode',
        }
    }
});
app.use(ToastService);

app.use(router);
app.use(store);

store.dispatch("auth/restoreSession");

app.mount("#app");
