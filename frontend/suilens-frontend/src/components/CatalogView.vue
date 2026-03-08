<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4 mb-4">Lenses Catalog</h1>
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="fetchLenses">Refresh</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="loadingLenses">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col v-for="lens in lenses" :key="lens.id" cols="12" sm="6" md="4">
        <v-card class="h-100 d-flex flex-column" elevation="3">
          <v-card-title class="text-h6 font-weight-bold pt-4 text-wrap">
            {{ lens.manufacturerName }} {{ lens.modelName }}
          </v-card-title>
          <v-card-subtitle class="text-body-1 font-weight-medium">
            {{ lens.mountType }} • {{ lens.minFocalLength }}-{{ lens.maxFocalLength }}mm f/{{ lens.maxAperture }}
          </v-card-subtitle>
          <v-card-text class="flex-grow-1">
            <p class="text-body-2 mb-4">{{ lens.description }}</p>
            <div class="d-flex align-center mt-auto">
              <span class="text-h6 font-weight-bold text-primary">Rp {{ formatPrice(lens.dayPrice) }}</span>
              <span class="text-caption ml-1 text-grey-darken-1">/ day</span>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4 bg-grey-lighten-4">
            <v-btn color="primary" variant="flat" block @click="viewInventory(lens)">
              View Availability & Rent
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="lenses.length === 0" cols="12" class="text-center py-10">
        <v-icon icon="mdi-camera-off" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
        <h3 class="text-h6 text-grey">No lenses available</h3>
      </v-col>
    </v-row>

    <!-- Dialog to show inventory for a selected lens -->
    <v-dialog v-model="inventoryDialog" max-width="800px" transition="dialog-bottom-transition">
      <v-card v-if="selectedLens" rounded="lg">
        <v-toolbar color="primary" class="text-white">
          <v-toolbar-title>
            Availability: {{ selectedLens.manufacturerName }} {{ selectedLens.modelName }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="inventoryDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <v-row v-if="loadingInventory">
            <v-col class="text-center py-8"><v-progress-circular indeterminate color="primary"></v-progress-circular></v-col>
          </v-row>
          <v-row v-else>
            <v-col v-for="inv in inventory" :key="inv.id" cols="12">
              <v-card variant="elevated" elevation="2" class="mb-2">
                <v-card-item>
                  <template v-slot:title>
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-store" class="mr-2" color="primary"></v-icon>
                      <span class="text-h6">{{ inv.branchCode }}</span>
                      <v-spacer></v-spacer>
                      <v-chip :color="inv.availableQuantity > 0 ? 'success' : 'error'" variant="elevated" size="small" class="font-weight-bold">
                        {{ inv.availableQuantity > 0 ? 'Available' : 'Out of Stock' }}
                      </v-chip>
                    </div>
                  </template>
                  <template v-slot:subtitle>
                    <div class="mt-2 text-body-1 ml-8 font-weight-medium">
                      <v-icon icon="mdi-map-marker" size="small" class="mr-1"></v-icon>
                      {{ getBranchDetails(inv.branchCode).location }}
                    </div>
                  </template>
                  
                  <div class="mt-3 ml-8">
                    <div class="text-body-2 text-medium-emphasis mb-3">
                      <v-icon icon="mdi-information-outline" size="small" class="mr-1"></v-icon>
                      <em>{{ getBranchDetails(inv.branchCode).notes }}</em>
                    </div>
                    
                    <v-divider class="mb-3"></v-divider>
                    
                    <div class="d-flex align-center justify-space-between w-100">
                      <div>
                        <span class="text-subtitle-1">Available Stock: </span>
                        <span class="text-h6 font-weight-bold" :class="inv.availableQuantity > 0 ? 'text-success' : 'text-error'">
                          {{ inv.availableQuantity }}
                        </span>
                        <span class="text-caption text-grey"> / {{ inv.totalQuantity }} total</span>
                      </div>
                      
                      <v-btn 
                        color="success" 
                        variant="flat"
                        prepend-icon="mdi-cart-plus"
                        :disabled="inv.availableQuantity <= 0"
                        @click="openOrderDialog(inv.branchCode)"
                      >
                        Rent Here
                      </v-btn>
                    </div>
                  </div>
                </v-card-item>
              </v-card>
            </v-col>
            <v-col v-if="inventory.length === 0" cols="12" class="text-center py-8">
              <v-icon icon="mdi-package-variant" size="48" color="grey" class="mb-2"></v-icon>
              <div class="text-h6 text-grey">No inventory records found for this lens.</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <OrderDialog 
      v-model="orderDialog" 
      :lensId="selectedLens?.id" 
      :branchCode="selectedBranch" 
      @order-success="onOrderSuccess" 
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import OrderDialog from './OrderDialog.vue';

const lenses = ref<any[]>([]);
const loadingLenses = ref(false);

const selectedLens = ref<any>(null);
const inventory = ref<any[]>([]);
const loadingInventory = ref(false);
const inventoryDialog = ref(false);

const orderDialog = ref(false);
const selectedBranch = ref('');

const formatPrice = (price: string) => {
  return parseFloat(price).toLocaleString('id-ID');
};

const fetchLenses = async () => {
  loadingLenses.value = true;
  try {
    const res = await fetch(`${import.meta.env.VITE_CATALOG_API}/api/lenses`);
    if (res.ok) {
      lenses.value = await res.json();
    }
  } catch (e) {
    console.error('Error fetching lenses:', e);
  } finally {
    loadingLenses.value = false;
  }
};

const viewInventory = async (lens: any) => {
  selectedLens.value = lens;
  inventoryDialog.value = true;
  loadingInventory.value = true;
  inventory.value = [];
  try {
    const res = await fetch(`${import.meta.env.VITE_INVENTORY_API}/api/inventory?lensId=${lens.id}`);
    if (res.ok) {
        inventory.value = await res.json();
        const branchPriority: Record<string, number> = { 'KB-JKT-S': 3, 'KB-JKT-E': 2, 'KB-JKT-N': 1 };
        inventory.value.sort((a, b) => {
             const prioA = branchPriority[a.branchCode] || 0;
             const prioB = branchPriority[b.branchCode] || 0;
             return prioB - prioA;
        });
    }
  } catch (e) {
    console.error('Error fetching inventory:', e);
  } finally {
    loadingInventory.value = false;
  }
};

const getBranchDetails = (code: string) => {
  const branches: Record<string, { location: string, notes: string }> = {
    'KB-JKT-S': { location: 'Kebayoran Baru, Jakarta Selatan', notes: 'Studio utama, inventaris terbesar' },
    'KB-JKT-E': { location: 'Jatinegara, Jakarta Timur', notes: 'Cabang sekunder' },
    'KB-JKT-N': { location: 'Kelapa Gading, Jakarta Utara', notes: 'Cabang terbaru, stok terbatas' }
  };
  return branches[code] || { location: 'Unknown Location', notes: 'No extra details available' };
};

const openOrderDialog = (branchCode: string) => {
  selectedBranch.value = branchCode;
  orderDialog.value = true;
};

const onOrderSuccess = () => {
  // Refresh inventory after successful order
  if (selectedLens.value) {
    viewInventory(selectedLens.value);
  }
};

onMounted(() => {
  fetchLenses();
});
</script>
