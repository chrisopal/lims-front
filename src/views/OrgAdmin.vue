<template>
  <CatalogResourcePage v-bind="catalogConfigs.orgs" kind="orgs" />
</template>
<script setup lang="ts">
import CatalogResourcePage from '@/components/catalog/CatalogResourcePage.vue'
import { catalogConfigs } from '@/components/catalog/catalog-configs'
</script>
