<template>
  <div class="login-page">
    <div class="login-left">
      <div class="brand-area">
        <div class="brand-logo">Laboratory Operations Platform</div>
        <div class="brand-tagline">可组合 · AI 原生 · 多场景实验室管理平台</div>
        <div class="brand-desc">
          支持企业内部实验室与第三方检测实验室，覆盖理化、食品、环境、新能源、计量、核电等多检测领域。AI
          能力嵌入业务全链路，配置驱动流程，一站式实验室运营。
        </div>
        <div class="feature-list">
          <div class="feature-item" v-for="f in features" :key="f.title">
            <el-icon class="feature-icon"><component :is="f.icon" /></el-icon>
            <div>
              <div class="feature-title">{{ f.title }}</div>
              <div class="feature-desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-form-card">
        <div class="form-header">
          <div class="form-title">登录工作台</div>
          <div class="form-subtitle">Laboratory Operations Platform</div>
        </div>
        <el-form :model="form" label-position="top" size="default">
          <el-alert
            title="前端本地交互环境，选择演示身份进入"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />
          <el-form-item label="显示姓名"
            ><el-input v-model="form.name" placeholder="请输入显示姓名"
          /></el-form-item>
          <el-form-item label="角色"
            ><el-select v-model="form.roleCode" style="width: 100%"
              ><el-option
                v-for="r in roles"
                :key="r.id"
                :label="r.name"
                :value="r.code" /></el-select
          ></el-form-item>
          <el-form-item label="实验室"
            ><el-select v-model="form.lab" style="width: 100%"
              ><el-option
                label="全部已激活实验室"
                value="全部已激活实验室" /><el-option
                v-for="lab in labs"
                :key="lab.id"
                :label="lab.name"
                :value="lab.name" /></el-select
          ></el-form-item>
          <div v-if="message || catalog.error.value" role="alert">
            {{ message || catalog.error.value }}
          </div>
          <el-button
            type="primary"
            style="width: 100%; margin-top: 8px"
            size="large"
            @click="handleLogin"
            >登录</el-button
          >
        </el-form>
        <div class="login-footer">角色权限用于前端交互验证</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCatalog } from '@/composables/useCatalog'
import { useDemoSession } from '@/composables/useDemoSession'
import { useRouter } from 'vue-router'
const router = useRouter()
const catalog = useCatalog()
const demo = useDemoSession()
const message = ref('')
const roles = computed(() =>
  catalog.state.value.records.filter(
    (r) => r.kind === 'roles' && r.status === 'ACTIVE',
  ),
)
const labs = computed(() =>
  catalog.state.value.records.filter(
    (r) => r.kind === 'labs' && r.status === 'ACTIVE',
  ),
)
const form = ref({
  name: '演示管理员',
  roleCode: 'ROLE-ADMIN',
  lab: '全部已激活实验室',
})
const features = [
  {
    icon: 'Connection',
    title: '可组合场景',
    desc: '按业务模式 + 领域包灵活组合，适配不同实验室类型',
  },
  {
    icon: 'Cpu',
    title: 'AI 嵌入业务',
    desc: '标准匹配、任务调度、报告审核，AI 赋能每个环节',
  },
  {
    icon: 'List',
    title: '端到端链路',
    desc: '委托受理 → 检测执行 → 报告交付全流程贯通',
  },
  {
    icon: 'Setting',
    title: '配置驱动',
    desc: '流程、检测项、标准方法、报告模板均可灵活配置',
  },
]
function handleLogin() {
  try {
    if (
      !form.value.name.trim() ||
      !roles.value.some((r) => r.code === form.value.roleCode)
    )
      throw Error('请输入姓名并选择可用角色')
    demo.save(form.value)
    router.push('/app/dashboard')
  } catch (e) {
    message.value = (e as Error).message
  }
}
</script>
<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--ui-canvas);
}
.login-left {
  flex: 1;
  min-width: 0;
  background: #0b1220;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}
.brand-area {
  max-width: 480px;
  color: #fff;
}
.brand-logo {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: -0.3px;
}
.brand-tagline {
  font-size: 13px;
  color: #80b5ff;
  margin-bottom: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.brand-desc {
  font-size: 14px;
  color: #a7b2c3;
  line-height: 1.7;
  margin-bottom: 40px;
  border-left: 2px solid var(--ui-brand);
  padding-left: 16px;
}
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.feature-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.feature-icon {
  width: 20px;
  height: 20px;
  color: #a7b2c3;
  font-size: 18px;
  flex-shrink: 0;
}
.feature-title {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 3px;
}
.feature-desc {
  font-size: 12px;
  color: #a7b2c3;
  line-height: 1.5;
}
.login-right {
  width: 480px;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-canvas);
}
.login-form-card {
  width: 360px;
  max-width: 100%;
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 40px;
}
.form-header {
  margin-bottom: 28px;
}
.form-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--ui-text);
  margin-bottom: 4px;
}
.form-subtitle {
  font-size: 12px;
  color: var(--ui-text-tertiary);
}
.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--ui-action-text);
  cursor: pointer;
}
@media (max-width: 767px) {
  .login-page {
    flex-direction: column;
  }
  .login-left {
    flex: 0 0 auto;
    padding: 24px 16px;
  }
  .brand-logo {
    font-size: 20px;
  }
  .brand-tagline {
    margin-bottom: 0;
  }
  .brand-desc,
  .feature-list {
    display: none;
  }
  .login-right {
    width: 100%;
    flex: 1;
    padding: 24px 16px;
    align-items: flex-start;
  }
  .login-form-card {
    width: 100%;
    max-width: 360px;
    padding: 24px;
  }
}
</style>
