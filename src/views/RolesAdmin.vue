<template>
  <CatalogResourcePage
    v-bind="catalogConfigs.roles"
    kind="roles"
    write-permission="role.manage"
  />
</template>
<script setup lang="ts">
import CatalogResourcePage from '@/components/catalog/CatalogResourcePage.vue'
import { catalogConfigs } from '@/components/catalog/catalog-configs'
</script>
