<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4 mb-4">Orders Overview</h1>
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="fetchOrders">Refresh</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="loading">
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
              <tr v-for="order in orders" :key="order.id">
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
                    :loading="cancelling === order.id"
                    @click="cancelOrder(order.id)"
                  >
                    Cancel Order
                  </v-btn>
                  <span v-else class="text-caption text-grey font-italic">No actions</span>
                </td>
              </tr>
              <tr v-if="orders.length === 0">
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
import { ref, onMounted } from 'vue';

const orders = ref<any[]>([]);
const loading = ref(false);
const cancelling = ref<string | null>(null);

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${import.meta.env.VITE_ORDER_API}/api/orders`);
    if (res.ok) {
        const data = await res.json();
        // Sort orders by created_at descending (newest first)
        orders.value = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (e) {
    console.error('Error fetching orders:', e);
  } finally {
    loading.value = false;
  }
};

const cancelOrder = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this order? The inventory will be automatically released back to the branch.')) {
    return;
  }
  
  cancelling.value = id;
  try {
    const res = await fetch(`${import.meta.env.VITE_ORDER_API}/api/orders/${id}/cancel`, {
      method: 'PUT'
    });
    if (!res.ok) {
      const error = await res.json().catch(()=>({}));
      throw new Error(error.error || 'Failed to cancel order');
    }
    await fetchOrders();
  } catch (e: any) {
    alert(e.message);
  } finally {
    cancelling.value = null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPrice = (price: string) => {
  return parseFloat(price).toLocaleString('id-ID');
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending': 'warning',
    'confirmed': 'info',
    'active': 'primary',
    'returned': 'success',
    'cancelled': 'error'
  };
  return colors[status] || 'grey';
};

onMounted(() => {
  fetchOrders();
});
</script>
