import { ref, onMounted, onUnmounted } from 'vue'
import {
  catalogRepository,
  CATALOG_CHANGE_EVENT,
} from '@/runtime/catalog-repository'
export interface DemoSession {
  name: string
  roleCode: string
  lab: string
}
const SESSION_KEY = 'lims.demo.session.v1'
const EVENT = 'lims-demo-session-change'
const defaultSession: DemoSession = {
  name: '演示管理员',
  roleCode: 'ROLE-ADMIN',
  lab: '全部已激活实验室',
}
export function readDemoSession(): DemoSession {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (raw === null) return { ...defaultSession }
  const s = JSON.parse(raw)
  if (
    !s ||
    typeof s.name !== 'string' ||
    typeof s.roleCode !== 'string' ||
    typeof s.lab !== 'string'
  )
    throw Error('本地身份设置异常，请重新选择演示身份')
  return s
}
export function can(permission: string): boolean {
  try {
    const s = readDemoSession()
    const role = catalogRepository
      .read()
      .records.find(
        (r) =>
          r.kind === 'roles' && r.code === s.roleCode && r.status === 'ACTIVE',
      )
    if (!role) return false
    const p = Array.isArray(role.data.policies)
      ? role.data.policies
      : String(role.data.policies || '').split(/[\s,，]+/)
    return p.includes('*') || p.includes(permission)
  } catch {
    return false
  }
}
export function useDemoSession() {
  const session = ref<DemoSession>({ ...defaultSession })
  const error = ref('')
  const reload = () => {
    try {
      session.value = readDemoSession()
      error.value = ''
    } catch (e) {
      error.value = (e as Error).message
    }
  }
  onMounted(() => {
    reload()
    window.addEventListener(EVENT, reload)
    window.addEventListener(CATALOG_CHANGE_EVENT, reload)
  })
  onUnmounted(() => {
    window.removeEventListener(EVENT, reload)
    window.removeEventListener(CATALOG_CHANGE_EVENT, reload)
  })
  function save(value: DemoSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(value))
    window.dispatchEvent(new Event(EVENT))
  }
  return { session, error, save }
}
