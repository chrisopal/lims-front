<template>
  <CatalogResourcePage
    v-bind="catalogConfigs.integrations"
    kind="integrations"
  />
</template>
<script setup lang="ts">
import CatalogResourcePage from '@/components/catalog/CatalogResourcePage.vue'
import { catalogConfigs } from '@/components/catalog/catalog-configs'
</script>
