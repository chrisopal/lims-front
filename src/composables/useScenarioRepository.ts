import { shallowRef, ref, onMounted, onUnmounted } from 'vue'
import {
  ScenarioRepository,
  SCENARIO_KEY,
  SCENARIO_EVENT,
  scenarioSeed,
} from '@/runtime/scenario-repository'
export const scenarioRepository = new ScenarioRepository(
  {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
  },
  async (job) => {
    if (!navigator.locks)
      throw Error('需要支持 Web Locks 的 localhost 或 HTTPS 浏览器')
    return navigator.locks.request(SCENARIO_KEY, job)
  },
  () => window.dispatchEvent(new Event(SCENARIO_EVENT)),
)
export function useScenarioRepository() {
  const state = shallowRef(scenarioSeed())
  const error = ref('')
  function reload() {
    try {
      state.value = scenarioRepository.read()
      error.value = ''
    } catch (e) {
      error.value = (e as Error).message
    }
  }
  const storage = (e: StorageEvent) => {
    if (e.key === SCENARIO_KEY || e.key === null) reload()
  }
  onMounted(() => {
    reload()
    window.addEventListener(SCENARIO_EVENT, reload)
    window.addEventListener('storage', storage)
  })
  onUnmounted(() => {
    window.removeEventListener(SCENARIO_EVENT, reload)
    window.removeEventListener('storage', storage)
  })
  return { state, error, reload, repository: scenarioRepository }
}
