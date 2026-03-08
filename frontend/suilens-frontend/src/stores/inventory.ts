import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
    const inventory = ref<any[]>([])
    const loading = ref(false)

    const fetchInventory = async (lensId: string) => {
        loading.value = true
        inventory.value = []
        try {
            const res = await fetch(`${import.meta.env.VITE_INVENTORY_API}/api/inventory/lenses/${lensId}`)
            if (res.ok) {
                inventory.value = await res.json()
                const branchPriority: Record<string, number> = { 'KB-JKT-S': 3, 'KB-JKT-E': 2, 'KB-JKT-N': 1 }
                inventory.value.sort((a, b) => {
                    const prioA = branchPriority[a.branchCode] || 0
                    const prioB = branchPriority[b.branchCode] || 0
                    return prioB - prioA
                })
            }
        } catch (e) {
            console.error('Error fetching inventory:', e)
        } finally {
            loading.value = false
        }
    }

    const getBranchDetails = (code: string) => {
        const branches: Record<string, { location: string, notes: string }> = {
            'KB-JKT-S': { location: 'Kebayoran Baru, Jakarta Selatan', notes: 'Studio utama, inventaris terbesar' },
            'KB-JKT-E': { location: 'Jatinegara, Jakarta Timur', notes: 'Cabang sekunder' },
            'KB-JKT-N': { location: 'Kelapa Gading, Jakarta Utara', notes: 'Cabang terbaru, stok terbatas' }
        }
        return branches[code] || { location: 'Unknown Location', notes: 'No extra details available' }
    }

    return { inventory, loading, fetchInventory, getBranchDetails }
})
