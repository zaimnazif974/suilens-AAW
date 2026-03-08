import { createRouter, createWebHistory } from 'vue-router'
import CatalogPage from '../pages/CatalogPage.vue'
import OrdersPage from '../pages/OrdersPage.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'catalog',
            component: CatalogPage
        },
        {
            path: '/orders',
            name: 'orders',
            component: OrdersPage
        }
    ]
})

export default router
