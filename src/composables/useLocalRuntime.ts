import { onMounted, onUnmounted, readonly, shallowRef, ref } from 'vue';
import { LocalRuntimeRepository, RuntimeError, STORAGE_KEY, CHANGE_EVENT, emptyState } from '@/runtime/local-runtime';
import type { LockPort } from '@/runtime/local-runtime';
const lock: LockPort = async job => {
  if (!navigator.locks) throw new RuntimeError('LOCK_UNAVAILABLE', '此浏览器不支持安全的本地多窗口写入。请在 HTTPS 或 localhost 的受支持浏览器使用演示。');
  return navigator.locks.request(STORAGE_KEY, () => job());
};
const repository = new LocalRuntimeRepository(
  { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
  lock, () => window.dispatchEvent(new Event(CHANGE_EVENT)),
);
/** Each view owns subscriptions. API effects occur only after durable local writes succeed. */
export function useLocalRuntime() {
  const state = shallowRef(emptyState()); const error = ref('');
  function reload() {
    try { state.value = repository.read(); error.value = '' }
    catch (e) { error.value = e instanceof Error ? e.message : '读取失败' }
  }
  function onStorage(event: StorageEvent) { if (event.key === STORAGE_KEY || event.key === null) reload() }
  onMounted(() => { reload(); window.addEventListener(CHANGE_EVENT, reload); window.addEventListener('storage', onStorage) });
  onUnmounted(() => { window.removeEventListener(CHANGE_EVENT, reload); window.removeEventListener('storage', onStorage) });
  return { state: readonly(state), error: readonly(error), reload, repository };
}
