import { type ScenarioVersion, setupSteps } from './scenario-repository.js'
/** The bundle keeps schema-compatible manifests separate from frontend demonstration data. */
export function scenarioPackage(version: ScenarioVersion) {
  const d = version.definition
  const semver = d.version.replace(/^v/, '')
  const nodeKey = (i: number) => `node-${i + 1}`
  const workflow = {
    apiVersion: 'lims.huixin.ai/v2',
    kind: 'WorkflowDefinition',
    metadata: { key: `${d.key}-flow`, name: `${d.name}流程`, version: semver },
    spec: {
      nodes: [
        { key: 'start', name: '开始', nodeType: 'START' },
        ...d.nodes.map((n, i) => ({
          key: nodeKey(i),
          name: n.label,
          nodeType: n.nodeType,
          config: {
            fields: n.fields,
            requiresConfirmation: !!n.requiresConfirmation,
          },
          ui: { rendererKey: n.renderer },
        })),
        { key: 'finish', name: '完成', nodeType: 'END' },
      ],
      edges: [
        { from: 'start', to: d.nodes.length ? nodeKey(0) : 'finish' },
        ...d.nodes.map((_, i) => ({
          from: nodeKey(i),
          to: i === d.nodes.length - 1 ? 'finish' : nodeKey(i + 1),
        })),
      ],
    },
  }
  const manifest = {
    apiVersion: 'lims.huixin.ai/v2',
    kind: 'ScenarioPack',
    metadata: {
      key: d.key,
      name: d.name,
      version: semver,
      labels: { domain: d.domain, customerMode: d.mode },
    },
    spec: {
      businessMode:
        d.mode === '企业内部'
          ? 'INTERNAL'
          : d.mode === '第三方委托'
            ? 'THIRD_PARTY'
            : 'HYBRID',
      requiredCapabilities: [...new Set(d.nodes.map((n) => n.executor))],
      setup: {
        steps: (version.steps || setupSteps).map((s, i) => ({
          ...s,
          order: (i + 1) * 10,
          stepType:
            s.key === 'workflow'
              ? 'WORKFLOW'
              : s.key === 'preflight'
                ? 'VALIDATION'
                : 'BUILTIN',
          required: true,
          rendererKey: `scenario-${s.key}`,
        })),
      },
      subjects: { allowedTypes: [d.subjectLabel] },
      testCapabilities: d.testItems.map((t) => ({
        itemRef: t.code,
        applicableSubjectTypes: [d.subjectLabel],
        standardBindings: [
          {
            standardVersionRef: t.standard,
            methodVersionRef: t.method,
            limitRuleVersionRef: t.limit,
          },
        ],
      })),
      workflow: {
        definitionRef: `workflow:${d.key}-flow:${semver}`,
        entryNodeKey: 'start',
      },
      forms: { request: d.requestSchema, subject: d.subjectSchema },
      reports: {
        templates: (d.assets || [])
          .filter((a) => a.kind === 'reports')
          .map((a) => `${a.code}:${a.version}`),
      },
      policies: {
        scenarioVersionLock: true,
        standardVersionLock: true,
        methodVersionLock: true,
        publishedImmutable: true,
        allowRuntimeMigration: false,
      },
    },
  }
  return {
    format: 'lims-frontend-scenario-bundle/v1',
    manifest,
    workflow,
    frontendVersion: version,
    notice:
      '前端交互配置包；Executor 名称不包含实现代码，需要后端能力注册表解析。',
  }
}
