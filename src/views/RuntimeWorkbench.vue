<template>
  <div class="runtime-workbench">
    <LocalDemoNotice />
    <el-alert v-if="error || actionError" :title="error || actionError" type="error" :closable="false" show-icon />
    <template v-if="work && request && node && !error">
      <header class="runtime-header">
        <div><el-button link @click="backToWork">返回我的工作</el-button><h1>{{ node.label }} <RuntimeStatus :status="work.status" /></h1><p>{{ request.number }} · {{ request.snapshot.name }} <strong>{{ request.snapshot.version }}</strong></p></div>
        <div class="runtime-actions"><el-button v-if="work.status==='READY'" type="primary" :loading="busy" @click="start">开始处理</el-button><template v-else-if="work.status==='IN_PROGRESS'"><el-button :loading="busy" @click="save(false)">保存节点记录</el-button><el-button type="primary" :loading="busy" @click="save(true)">完成当前节点（演示）</el-button></template><el-button v-else-if="nextWork" type="primary" @click="router.push(`/app/operations/work-items/${nextWork.id}`)">打开下一工作项</el-button><span v-else class="finished-text">本地演示流程已完成</span></div>
      </header>
      <div class="runtime-layout">
        <aside class="runtime-context">
          <h2>绑定上下文</h2>
          <dl><dt>快照引用（未签名）</dt><dd class="mono">{{ request.snapshot.snapshotRef }}</dd><dt>流程版本</dt><dd>{{ request.snapshot.workflowVersion }}</dd><dt>检测对象</dt><dd>{{ request.subjects.length }} 个 {{ request.snapshot.subjectLabel }}</dd><dt>检测项</dt><dd>{{ request.itemCodes.join(' / ') }}</dd></dl>
          <h2>节点能力描述</h2><dl><dt>Node Type</dt><dd class="mono">{{ node.nodeType }}</dd><dt>前端 Renderer</dt><dd class="mono">{{ node.renderer }}</dd><dt>Executor（仅描述）</dt><dd class="mono">{{ node.executor }}</dd></dl><p class="context-hint">此版本不运行 Java 代码、脚本、规则引擎或仪器指令。</p>
        </aside>
        <main class="runtime-main">
          <section class="record-panel">
            <div class="record-head"><h2>{{ renderer.label }}</h2><span role="status">{{ dirty ? '有未保存修改' : work.status==='COMPLETED' ? '已完成 · 只读' : '本地记录' }}</span></div>
            <p class="record-hint">{{ renderer.hint }}</p>
            <div v-if="issues.length" ref="errorSummary" tabindex="-1" class="record-errors" role="alert"><div v-for="issue in issues" :key="issue.path">{{ issue.message }}</div></div>
            <SchemaFields :fields="node.fields" v-model="values" prefix="record" :issues="issues" :disabled="work.status!=='IN_PROGRESS' || busy" />
            <el-checkbox v-if="node.requiresConfirmation" v-model="confirmed" :disabled="work.status!=='IN_PROGRESS' || busy">我已核对当前节点记录（本地演示，不代表授权签字）</el-checkbox>
            <el-alert v-if="work.status==='READY'" title="先点击“开始处理”再填写记录。未到达节点不能直接跳过执行。" type="info" :closable="false" />
            <el-alert v-else-if="work.status==='COMPLETED'" title="当前节点记录只读。该操作不是正式报告签发、质量放行或合规审核。" type="info" :closable="false" />
          </section>
          <section class="runtime-evidence"><h2>委托信息与对象</h2><dl><template v-for="f in request.snapshot.requestFields" :key="f.key"><dt>{{ f.label }}</dt><dd>{{ request.data[f.key] || '—' }}</dd></template></dl><div class="subjects-table"><el-table :data="request.subjects" border><el-table-column v-for="f in request.snapshot.subjectFields" :key="f.key" :prop="f.key" :label="f.label" min-width="140" /></el-table></div></section>
        </main>
        <aside class="runtime-trace">
          <h2>运行进度（顺序演示）</h2>
          <ol class="runtime-timeline"><li v-for="(n,index) in request.snapshot.nodes" :key="n.key"><span>{{ index+1 }}. {{ n.label }}</span><RuntimeStatus v-if="nodeWork(index)" :status="nodeWork(index)!.status"/><span v-else class="pending-node">未到达</span></li></ol>
          <h2>本地操作记录</h2><div v-for="e in events" :key="e.id" class="event-row"><time>{{ new Date(e.at).toLocaleString('zh-CN') }}</time><p>{{ e.message }}</p></div><p class="context-hint">浏览器记录可被用户修改或清除，不是合规审计证据。</p>
        </aside>
      </div>
    </template>
    <el-empty v-else-if="!error" description="工作项不存在，或来自其他浏览器的演示空间。"><el-button @click="backToWork">返回我的工作</el-button></el-empty>
  </div>
</template>
<script setup lang="ts">
import {computed,ref,watch,nextTick,onMounted,onUnmounted} from 'vue';
import {useRoute,useRouter,onBeforeRouteLeave,onBeforeRouteUpdate} from 'vue-router';
import {ElMessage,ElMessageBox} from 'element-plus';
import {useLocalRuntime} from '@/composables/useLocalRuntime';
import {clone,validateFields} from '@/runtime/local-runtime';
import type {Values,Issue,WorkItem} from '@/runtime/local-runtime';
import LocalDemoNotice from '@/components/runtime/LocalDemoNotice.vue';
import RuntimeStatus from '@/components/runtime/RuntimeStatus.vue';
import SchemaFields from '@/components/runtime/SchemaFields.vue';
const route=useRoute();const router=useRouter();const {state,error,repository}=useLocalRuntime();
const work=computed(()=>state.value.workItems.find(w=>w.id===route.params.id));
const request=computed(()=>state.value.requests.find(r=>r.id===work.value?.requestId));
const node=computed(()=>request.value?.snapshot.nodes[work.value?.nodeIndex ?? -1]);
const rendererRegistry={record:{label:'节点业务记录',hint:'字段来自当前委托绑定的节点定义。'},sampling:{label:'现场采样记录',hint:'填写点位、容器和现场记录；没有实际获取 GPS 或操作采样仪器。'},measurement:{label:'几何量测量记录',hint:'录入特征和测量记录；本页不计算不确定度或自动判定公差合格。'},review:{label:'人工核对记录',hint:'确认意见只用于本地演示，不是电子签名或合规审核结论。'}};
const renderer=computed(()=>rendererRegistry[node.value?.renderer || 'record']);
const values=ref<Values>({});const confirmed=ref(false);const revision=ref(-1);const loadedId=ref('');const savedSignature=ref('');
const busy=ref(false);const actionError=ref('');const issues=ref<Issue[]>([]);const errorSummary=ref<HTMLElement|null>(null);
const signature=()=>JSON.stringify([values.value,confirmed.value]);
const dirty=computed(()=>!!loadedId.value&&signature()!==savedSignature.value);
const nodeWork=(index:number)=>state.value.workItems.find(w=>w.requestId===request.value?.id&&w.nodeIndex===index);
const nextWork=computed(()=>work.value?nodeWork(work.value.nodeIndex+1):undefined);
const events=computed(()=>state.value.events.filter(e=>e.targetId===request.value?.id||state.value.workItems.some(w=>w.requestId===request.value?.id&&w.id===e.targetId)).slice().reverse());
function apply(w:WorkItem){values.value=clone(w.values);confirmed.value=w.confirmed;revision.value=w.revision;loadedId.value=w.id;savedSignature.value=signature();issues.value=[];actionError.value=''}
// Own writes are applied from their returned revision. Treat only outside writes as conflicts.
watch(work,w=>{if(!w||busy.value)return;if(loadedId.value!==w.id||!dirty.value)apply(clone(w));else if(w.revision!==revision.value)actionError.value='工作项已更新；当前未保存输入被保留，请确认后刷新。'},{immediate:true});
async function perform(fn:()=>Promise<void>){if(busy.value)return;busy.value=true;actionError.value='';try{await fn()}catch(e){actionError.value=e instanceof Error?e.message:'操作失败'}finally{busy.value=false}}
async function start(){if(work.value)await perform(async()=>apply(await repository.startWork(work.value!.id,revision.value)))}
async function save(complete:boolean){
 if(!work.value||!node.value)return;
 if(complete){issues.value=validateFields(node.value.fields,values.value,'record',1);if(node.value.requiresConfirmation&&!confirmed.value)issues.value.push({path:'record.confirmation',message:'请确认已核对当前节点记录',step:1});if(issues.value.length){await nextTick();errorSummary.value?.focus();return}}
 await perform(async()=>{const updated=await repository.saveWork(work.value!.id,revision.value,values.value,confirmed.value,complete);apply(updated);ElMessage.success(complete?'本地节点已完成':'节点记录已保存到本浏览器')});
}
async function leave(){if(!dirty.value)return true;try{await ElMessageBox.confirm('当前节点有未保存记录。是否离开？','未保存修改',{confirmButtonText:'离开',cancelButtonText:'继续编辑',type:'warning'});return true}catch{return false}}
onBeforeRouteLeave(leave);onBeforeRouteUpdate(leave);
function beforeUnload(e:BeforeUnloadEvent){if(dirty.value){e.preventDefault();e.returnValue=''}}
onMounted(()=>window.addEventListener('beforeunload',beforeUnload));onUnmounted(()=>window.removeEventListener('beforeunload',beforeUnload));
function backToWork(){void router.push({path:'/app/operations/my-work',query:request.value?{requestId:request.value.id}:{}})}
</script>
<style scoped>
.runtime-workbench {min-width:0;color:var(--ui-text);}.runtime-header {display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid var(--ui-border);background:var(--ui-surface);}.runtime-header h1 {display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0 4px;font-size:22px;font-weight:600;}.runtime-header p {font-size:13px;color:var(--ui-text-secondary);margin:0;}.runtime-actions {display:flex;gap:8px;flex-wrap:wrap;}.runtime-layout {display:grid;grid-template-columns:230px minmax(0,1fr) 260px;min-height:calc(100vh - 220px);}.runtime-context,.runtime-trace {padding:20px;background:var(--ui-surface);min-width:0;}.runtime-context {border-right:1px solid var(--ui-border);}.runtime-trace {border-left:1px solid var(--ui-border);}.runtime-main {padding:20px;min-width:0;}.runtime-workbench h2 {font-size:16px;margin:0 0 12px;font-weight:600;}.runtime-workbench dl {margin:0 0 24px;}.runtime-workbench dt {color:var(--ui-text-secondary);font-size:12px;margin-top:12px;}.runtime-workbench dd {margin:4px 0 0;font-size:13px;overflow-wrap:anywhere;}.mono {font-family:var(--ui-font-mono);}.context-hint,.record-hint {font-size:12px;color:var(--ui-text-secondary);line-height:1.6;}.record-panel,.runtime-evidence {background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:6px;padding:20px;margin-bottom:16px;min-width:0;}.record-head {display:flex;justify-content:space-between;align-items:baseline;gap:8px;}.record-head span {font-size:12px;color:var(--ui-text-secondary);}.record-panel :deep(.el-checkbox) {height:auto;white-space:normal;margin:8px 0 16px;align-items:flex-start;}.record-panel :deep(.el-checkbox__label) {white-space:normal;}.record-errors {background:var(--ui-danger-bg);border:1px solid var(--ui-danger);color:var(--ui-danger);padding:12px;border-radius:4px;margin-bottom:16px;font-size:13px;}.runtime-timeline {list-style:none;margin:0 0 28px;padding:0;}.runtime-timeline li {padding:10px 0;border-bottom:1px solid var(--ui-border-subtle);display:flex;align-items:flex-start;justify-content:space-between;gap:8px;font-size:13px;}.pending-node {font-size:12px;color:var(--ui-text-tertiary);white-space:nowrap;}.event-row {font-size:12px;border-bottom:1px solid var(--ui-border-subtle);padding:10px 0;}.event-row time {color:var(--ui-text-secondary);}.event-row p {margin:4px 0 0;overflow-wrap:anywhere;}.finished-text {color:var(--ui-success);font-size:13px;}.subjects-table {overflow-x:auto;max-width:100%;}
@media(max-width:1200px){.runtime-layout {grid-template-columns:210px minmax(0,1fr);}.runtime-trace {grid-column:1 / -1;border-left:0;border-top:1px solid var(--ui-border);}}
@media(max-width:767px){.runtime-header {flex-direction:column;align-items:stretch;padding:16px;}.runtime-layout {grid-template-columns:minmax(0,1fr);}.runtime-context {border-right:0;border-bottom:1px solid var(--ui-border);padding:16px;grid-row:2;}.runtime-main {padding:16px;grid-row:1;}.runtime-trace {grid-row:3;}.record-panel,.runtime-evidence {padding:16px;}.record-head {flex-wrap:wrap;}.runtime-actions .el-button + .el-button {margin-left:0;}.runtime-context dl {margin-bottom:12px;}.runtime-header p {overflow-wrap:anywhere;}}
</style>
