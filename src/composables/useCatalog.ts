import { onMounted, onUnmounted, readonly, ref, shallowRef } from 'vue'
import {
  CATALOG_CHANGE_EVENT,
  CATALOG_STORAGE_KEY,
  catalogRepository,
} from '@/runtime/catalog-repository'
import type { CatalogRecord, CatalogEvent } from '@/runtime/catalog-repository'

/** Reactive browser adapter; writes remain explicit repository calls and are read back after success. */
export function useCatalog() {
  const state = shallowRef<{ records: CatalogRecord[]; events:CatalogEvent[] }>({ records: [],events:[] })
  const error = ref('')

  function reload() {
    try {
      state.value = catalogRepository.read()
      error.value = ''
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '目录读取失败'
    }
  }

  function onStorage(event: StorageEvent) {
    if (event.key === CATALOG_STORAGE_KEY || event.key === null) reload()
  }

  onMounted(() => {
    reload()
    window.addEventListener(CATALOG_CHANGE_EVENT, reload)
    window.addEventListener('storage', onStorage)
  })
  onUnmounted(() => {
    window.removeEventListener(CATALOG_CHANGE_EVENT, reload)
    window.removeEventListener('storage', onStorage)
  })

  return {
    state: readonly(state),
    error: readonly(error),
    repository: catalogRepository,
    reload,
  }
}
