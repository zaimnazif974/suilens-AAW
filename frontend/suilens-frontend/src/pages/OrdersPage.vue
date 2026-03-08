<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4 mb-4">Orders Overview</h1>
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="orderStore.fetchOrders">Refresh</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="orderStore.loading">
      <v-col class="text-center py-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <v-card elevation="2">
          <v-table hover>
            <thead>
              <tr class="bg-grey-lighten-4 text-left">
                <th class="font-weight-bold text-subtitle-1">Customer</th>
                <th class="font-weight-bold text-subtitle-1">Lens Item</th>
                <th class="font-weight-bold text-subtitle-1">Branch</th>
                <th class="font-weight-bold text-subtitle-1">Rental Period</th>
                <th class="font-weight-bold text-subtitle-1">Total Price</th>
                <th class="font-weight-bold text-subtitle-1">Status</th>
                <th class="font-weight-bold text-subtitle-1 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orderStore.orders" :key="order.id">
                <td class="py-3">
                  <div class="font-weight-bold">{{ order.customerName }}</div>
                  <div class="text-caption text-grey-darken-1">{{ order.customerEmail }}</div>
                </td>
                <td class="py-3">
                  {{ order.lensSnapshot.manufacturerName }} {{ order.lensSnapshot.modelName }}
                </td>
                <td class="py-3">
                  <v-chip size="small" variant="flat" color="teal-lighten-4" class="text-teal-darken-4 font-weight-bold">
                    {{ order.branchCode }}
                  </v-chip>
                </td>
                <td class="py-3">
                  <div class="d-flex align-center">
                    <span class="text-grey-darken-3">{{ formatDate(order.startDate) }}</span>
                    <v-icon icon="mdi-arrow-right-thin" class="mx-1" size="small"></v-icon>
                    <span class="text-grey-darken-3">{{ formatDate(order.endDate) }}</span>
                  </div>
                </td>
                <td class="py-3 font-weight-bold text-primary">Rp {{ formatPrice(order.totalPrice) }}</td>
                <td class="py-3">
                  <v-chip :color="getStatusColor(order.status)" size="small" class="text-uppercase font-weight-bold" variant="elevated">
                    {{ order.status }}
                  </v-chip>
                </td>
                <td class="py-3 text-center">
                  <v-btn
                    v-if="order.status !== 'cancelled' && order.status !== 'returned'"
                    color="error"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-cancel"
                    :loading="orderStore.cancelling === order.id"
                    @click="handleCancel(order.id)"
                  >
                    Cancel Order
                  </v-btn>
                  <span v-else class="text-caption text-grey font-italic">No actions</span>
                </td>
              </tr>
              <tr v-if="orderStore.orders.length === 0">
                <td colspan="7" class="text-center py-10">
                  <v-icon icon="mdi-text-box-search-outline" size="48" color="grey" class="mb-3"></v-icon>
                  <div class="text-h6 text-grey">No orders found.</div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrderStore } from '../stores/order'

const orderStore = useOrderStore()

const handleCancel = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this order? The inventory will be automatically released back to the branch.')) {
    return
  }
  
  try {
    await orderStore.cancelOrder(id)
  } catch (e: any) {
    alert(e.message)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatPrice = (price: string) => {
  return parseFloat(price).toLocaleString('id-ID')
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending': 'warning',
    'confirmed': 'info',
    'active': 'primary',
    'returned': 'success',
    'cancelled': 'error'
  }
  return colors[status] || 'grey'
}

onMounted(() => {
  orderStore.fetchOrders()
})
</script>
