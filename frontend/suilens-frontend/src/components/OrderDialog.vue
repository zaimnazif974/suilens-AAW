<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>
        <span class="text-h5">Place Order</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent>
          <v-text-field
            v-model="order.customerName"
            label="Customer Name"
            :rules="[v => !!v || 'Name is required']"
            required
            variant="outlined"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="order.customerEmail"
            label="Customer Email"
            :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
            required
            variant="outlined"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="order.startDate"
            label="Start Date"
            type="date"
            :rules="[v => !!v || 'Start date is required']"
            required
            variant="outlined"
            class="mb-2"
            :min="today"
          ></v-text-field>
          <v-text-field
            v-model="order.endDate"
            label="End Date"
            type="date"
            :rules="[v => !!v || 'End date is required']"
            required
            variant="outlined"
            class="mb-2"
            :min="order.startDate || today"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!valid" :loading="loading" @click="submit">Order</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  lensId: string;
  branchCode: string;
}>();

const emit = defineEmits(['update:modelValue', 'order-success']);

const dialog = ref(props.modelValue);
watch(() => props.modelValue, (val) => {
  dialog.value = val;
});
watch(dialog, (val) => {
  emit('update:modelValue', val);
});

const today = computed(() => new Date().toISOString().split('T')[0]);

const valid = ref(false);
const loading = ref(false);
const form = ref<any>(null);

const order = ref({
  customerName: '',
  customerEmail: '',
  startDate: '',
  endDate: ''
});

const close = () => {
  dialog.value = false;
  order.value = { customerName: '', customerEmail: '', startDate: '', endDate: '' };
};

const submit = async () => {
  if (!valid.value) return;
  
  loading.value = true;
  try {
    const response = await fetch(`${import.meta.env.VITE_ORDER_API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lensId: props.lensId,
        branchCode: props.branchCode,
        customerName: order.value.customerName,
        customerEmail: order.value.customerEmail,
        startDate: new Date(order.value.startDate).toISOString(),
        endDate: new Date(order.value.endDate).toISOString()
      })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(()=>({}));
        throw new Error(error.error || 'Failed to place order');
    }
    
    emit('order-success');
    close();
    alert('Order placed successfully!');
  } catch (err: any) {
    alert('Error: ' + err.message);
  } finally {
    loading.value = false;
  }
};
</script>
