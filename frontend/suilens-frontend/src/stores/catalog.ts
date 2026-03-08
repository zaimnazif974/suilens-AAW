import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCatalogStore = defineStore('catalog', () => {
    const lenses = ref<any[]>([])
    const loading = ref(false)

    const fetchLenses = async () => {
        loading.value = true
        try {
            const res = await fetch(`${import.meta.env.VITE_CATALOG_API}/api/lenses`)
            if (res.ok) {
                lenses.value = await res.json()
            }
        } catch (e) {
            console.error('Error fetching lenses:', e)
        } finally {
            loading.value = false
        }
    }

    return { lenses, loading, fetchLenses }
})
