<template>
  <v-app>
    <v-app-bar color="primary" elevation="2">
      <template v-slot:prepend>
        <v-icon icon="mdi-camera-iris" class="mx-2"></v-icon>
      </template>
      <v-app-bar-title class="font-weight-bold">Suilens Rental System</v-app-bar-title>

      <v-spacer></v-spacer>

      <v-btn to="/" exact prepend-icon="mdi-format-list-bulleted" class="text-none" variant="text">
        Catalog
      </v-btn>
      <v-btn to="/orders" prepend-icon="mdi-clipboard-text" class="text-none" variant="text">
        Orders
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
// Layout handled via vue-router
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
