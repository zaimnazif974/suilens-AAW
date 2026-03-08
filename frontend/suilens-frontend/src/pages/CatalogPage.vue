<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4 mb-4">Lenses Catalog</h1>
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="catalogStore.fetchLenses">Refresh</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="catalogStore.loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col v-for="lens in catalogStore.lenses" :key="lens.id" cols="12" sm="6" md="4">
        <LensCard :lens="lens" @view-inventory="openInventoryDialog" />
      </v-col>
      <v-col v-if="catalogStore.lenses.length === 0" cols="12" class="text-center py-10">
        <v-icon icon="mdi-camera-off" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
        <h3 class="text-h6 text-grey">No lenses available</h3>
      </v-col>
    </v-row>

    <!-- Dialogs -->
    <InventoryDialog v-model="inventoryDialog" :lens="selectedLens" @open-order="openOrderDialog" />
    <OrderDialog v-model="orderDialog" :lensId="selectedLens?.id" :branchCode="selectedBranch" @order-success="onOrderSuccess" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { useInventoryStore } from '../stores/inventory'
import LensCard from '../components/LensCard.vue'
import InventoryDialog from '../components/InventoryDialog.vue'
import OrderDialog from '../components/OrderDialog.vue'

const catalogStore = useCatalogStore()
const inventoryStore = useInventoryStore()

const selectedLens = ref<any>(null)
const selectedBranch = ref('')

const inventoryDialog = ref(false)
const orderDialog = ref(false)

const openInventoryDialog = (lens: any) => {
  selectedLens.value = lens
  inventoryDialog.value = true
}

const openOrderDialog = (branchCode: string) => {
  selectedBranch.value = branchCode
  orderDialog.value = true
}

const onOrderSuccess = () => {
  if (selectedLens.value) {
    inventoryStore.fetchInventory(selectedLens.value.id)
  }
}

onMounted(() => {
  catalogStore.fetchLenses()
})
</script>
