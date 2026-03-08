import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderStore = defineStore('order', () => {
    const orders = ref<any[]>([])
    const loading = ref(false)
    const cancelling = ref<string | null>(null)

    const fetchOrders = async () => {
        loading.value = true
        try {
            const res = await fetch(`${import.meta.env.VITE_ORDER_API}/api/orders`)
            if (res.ok) {
                const data = await res.json()
                orders.value = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            }
        } catch (e) {
            console.error('Error fetching orders:', e)
        } finally {
            loading.value = false
        }
    }

    const cancelOrder = async (id: string) => {
        cancelling.value = id
        try {
            const res = await fetch(`${import.meta.env.VITE_ORDER_API}/api/orders/${id}/cancel`, {
                method: 'PUT'
            })
            if (!res.ok) {
                const error = await res.json().catch(() => ({}))
                throw new Error(error.error || 'Failed to cancel order')
            }
            await fetchOrders()
        } finally {
            cancelling.value = null
        }
    }

    return { orders, loading, cancelling, fetchOrders, cancelOrder }
})
