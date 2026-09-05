<template>
  <div class="login-page">
    <div class="login-left">
      <div class="brand-area">
        <div class="brand-logo">⚗ Laboratory Operations Platform</div>
        <div class="brand-tagline">可组合 · AI 原生 · 多场景实验室管理平台</div>
        <div class="brand-desc">
          支持企业内部实验室与第三方检测实验室，覆盖理化、食品、环境、新能源、计量、核电等多检测领域。
          AI 能力嵌入业务全链路，配置驱动流程，一站式实验室运营。
        </div>
        <div class="feature-list">
          <div class="feature-item" v-for="f in features" :key="f.title">
            <div class="feature-icon">{{ f.icon }}</div>
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
          <el-form-item label="账号">
            <el-input v-model="form.username" placeholder="请输入账号" prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item label="实验室">
            <el-select v-model="form.lab" placeholder="选择实验室" style="width:100%">
              <el-option label="华东食品检测中心" value="1" />
              <el-option label="新能源电池测试实验室" value="2" />
              <el-option label="环境监测站（第三方）" value="3" />
              <el-option label="质量管理部（内部）" value="4" />
            </el-select>
          </el-form-item>
          <el-button type="primary" style="width:100%;margin-top:8px" size="large" @click="handleLogin">
            登录
          </el-button>
        </el-form>
        <div class="login-footer">
          <span>忘记密码？</span>
          <span style="margin: 0 8px">·</span>
          <span>申请账号</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({ username: 'zhangyan@lab.com', password: '••••••••', lab: '1' })

const features = [
  { icon: '⬡', title: '可组合场景', desc: '按业务模式 + 领域包灵活组合，适配不同实验室类型' },
  { icon: '⚡', title: 'AI 嵌入业务', desc: '标准匹配、任务调度、报告审核，AI 赋能每个环节' },
  { icon: '📋', title: '端到端链路', desc: '委托受理 → 检测执行 → 报告交付全流程贯通' },
  { icon: '🔧', title: '配置驱动', desc: '流程、检测项、标准方法、报告模板均可灵活配置' },
]

function handleLogin() {
  router.push('/app/dashboard')
}
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  background: #F5F7FA;
}

.login-left {
  flex: 1;
  background: #0B1220;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.brand-area { max-width: 480px; color: #ffffff; }

.brand-logo {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  letter-spacing: -0.3px;
}

.brand-tagline {
  font-size: 13px;
  color: #1677FF;
  margin-bottom: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.brand-desc {
  font-size: 14px;
  color: #8A96A6;
  line-height: 1.7;
  margin-bottom: 40px;
  border-left: 2px solid #1677FF;
  padding-left: 16px;
}

.feature-list { display: flex; flex-direction: column; gap: 20px; }

.feature-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.feature-icon {
  width: 36px;
  height: 36px;
  background: rgba(22,119,255,0.12);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.feature-title { font-size: 13px; font-weight: 500; color: #ffffff; margin-bottom: 3px; }
.feature-desc { font-size: 12px; color: #6B7A8D; line-height: 1.5; }

.login-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F7FA;
}

.login-form-card {
  width: 360px;
  background: #ffffff;
  border: 1px solid #D9DEE7;
  border-radius: 6px;
  padding: 40px;
}

.form-header { margin-bottom: 28px; }
.form-title { font-size: 20px; font-weight: 600; color: #0B1220; margin-bottom: 4px; }
.form-subtitle { font-size: 12px; color: #8A96A6; }

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #1677FF;
  cursor: pointer;
}
</style>
