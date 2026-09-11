<template>
  <CatalogResourcePage
    v-bind="catalogConfigs['test-items']"
    kind="test-items"
  />
</template>
<script setup lang="ts">
import CatalogResourcePage from '@/components/catalog/CatalogResourcePage.vue'
import { catalogConfigs } from '@/components/catalog/catalog-configs'
</script>
