<template>
  <v-dialog v-model="dialog" max-width="800px" transition="dialog-bottom-transition">
    <v-card v-if="lens" rounded="lg">
      <v-toolbar color="primary" class="text-white">
        <v-toolbar-title>
          Availability: {{ lens.manufacturerName }} {{ lens.modelName }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
      </v-toolbar>
      <v-card-text class="pa-4">
        <v-row v-if="inventoryStore.loading">
          <v-col class="text-center py-8"><v-progress-circular indeterminate color="primary"></v-progress-circular></v-col>
        </v-row>
        <v-row v-else>
          <v-col v-for="inv in inventoryStore.inventory" :key="inv.id" cols="12">
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
                    {{ inventoryStore.getBranchDetails(inv.branchCode).location }}
                  </div>
                </template>

                <div class="mt-3 ml-8">
                  <div class="text-body-2 text-medium-emphasis mb-3">
                    <v-icon icon="mdi-information-outline" size="small" class="mr-1"></v-icon>
                    <em>{{ inventoryStore.getBranchDetails(inv.branchCode).notes }}</em>
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
                      @click="$emit('open-order', inv.branchCode)"
                    >
                      Rent Here
                    </v-btn>
                  </div>
                </div>
              </v-card-item>
            </v-card>
          </v-col>
          <v-col v-if="inventoryStore.inventory.length === 0" cols="12" class="text-center py-8">
            <v-icon icon="mdi-package-variant" size="48" color="grey" class="mb-2"></v-icon>
            <div class="text-h6 text-grey">No inventory records found for this lens.</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInventoryStore } from '../stores/inventory'

const props = defineProps<{
  modelValue: boolean,
  lens: any
}>()

const emit = defineEmits(['update:modelValue', 'open-order'])

const dialog = ref(props.modelValue)
watch(() => props.modelValue, (val) => { dialog.value = val })
watch(dialog, (val) => { emit('update:modelValue', val) })

const inventoryStore = useInventoryStore()

watch(() => props.lens, (newLens) => {
  if (newLens && newLens.id) {
    inventoryStore.fetchInventory(newLens.id)
  }
}, { immediate: true })

</script>
