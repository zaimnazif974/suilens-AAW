<template>
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
      <v-btn color="primary" variant="flat" block @click="$emit('view-inventory', lens)">
        View Availability & Rent
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  lens: any
}>()

defineEmits(['view-inventory'])

const formatPrice = (price: string | number) => {
  return parseFloat(price as string).toLocaleString('id-ID')
}
</script>
