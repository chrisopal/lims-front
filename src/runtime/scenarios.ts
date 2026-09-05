import type { ScenarioDefinition, RuntimeNode, FieldDefinition } from './local-runtime.js';
const note = (label = '操作记录'): FieldDefinition[] => [{ key:'notes',label,type:'textarea',required:true }];
const record = (key:string,label:string,executor:string,fields=note(),renderer:RuntimeNode['renderer']='record',requiresConfirmation=false):RuntimeNode => ({key,nodeType:key,label,executor,fields,renderer,requiresConfirmation});
/** Bundled descriptors only. No arbitrary code or remote UI loading. */
export const nodeRegistry:Record<string,RuntimeNode> = {
 REQUEST_ACCEPTANCE:record('REQUEST_ACCEPTANCE','委托受理','requestAcceptanceExecutor',note('受理意见')),
 SAMPLE_RECEIPT:record('SAMPLE_RECEIPT','收样','sampleReceivingExecutor',[{key:'sampleCode',label:'样品编号',type:'text',required:true},{key:'condition',label:'接收状况',type:'select',required:true,options:['完好（演示）','已记录偏差（演示）']}]),
 SAMPLE_PREPARATION:record('SAMPLE_PREPARATION','样品前处理','samplePreparationExecutor'),
 LAB_TEST_EXECUTION:record('LAB_TEST_EXECUTION','实验室检测','laboratoryTestExecutor',[{key:'rawRecord',label:'原始记录引用',type:'text',required:true},...note('结果说明（不自动判定合格）')]),
 TECHNICAL_REVIEW:record('TECHNICAL_REVIEW','技术审核','technicalReviewExecutor',note('人工核对意见'),'review',true),
 REPORT_RELEASE:record('REPORT_RELEASE','报告签发演示','reportReleaseExecutor',[{key:'reportRef',label:'演示报告引用',type:'text',required:true},...note('签发演示说明')],'review',true),
 SAMPLING_PLAN:record('SAMPLING_PLAN','监测方案','samplingPlanningExecutor',note('采样方案')),
 FIELD_SAMPLING:record('FIELD_SAMPLING','现场采样','fieldSamplingExecutor',[{key:'point',label:'采样点位',type:'text',required:true},{key:'container',label:'容器编号',type:'text',required:true},{key:'sampleDate',label:'采样日期',type:'date',required:true},...note('现场记录')],'sampling',true),
 SAMPLE_TRANSPORT:record('SAMPLE_TRANSPORT','样品运输','sampleTransportExecutor',[{key:'handover',label:'交接单号',type:'text',required:true},{key:'receiver',label:'接收人',type:'text',required:true}]),
 INTERNAL_REQUEST:record('INTERNAL_REQUEST','内部申请受理','internalRequestExecutor'),
 TASK_PLANNING:record('TASK_PLANNING','任务策划','testPlanningExecutor'),
 METROLOGY_MEASUREMENT:record('METROLOGY_MEASUREMENT','CMM 测量','metrologyMeasurementExecutor',[{key:'feature',label:'被测特征',type:'text',required:true},{key:'value',label:'测量值',type:'text',required:true},{key:'unit',label:'单位',type:'select',required:true,options:['mm','μm','°']},{key:'rawRecord',label:'原始测量文件引用',type:'text',required:true}],'measurement',true),
 RESULT_REVIEW:record('RESULT_REVIEW','结果核对','resultReviewExecutor',note('结果核对意见（不自动计算判定）'),'review',true),
 QUALITY_FEEDBACK:record('QUALITY_FEEDBACK','结果回写演示','qualityFeedbackExecutor',note('回写说明（未连接 QMS）'),'review',true),
};
const nodes=(keys:string[])=>keys.map(key=>JSON.parse(JSON.stringify(nodeRegistry[key])) as RuntimeNode);
// Standard identifiers are inherited sample labels, not verified regulatory data.
export const demoScenarios:ScenarioDefinition[] = [
 {id:1,key:'third-party-food-physchem',name:'第三方食品理化检测',version:'v1.2.0',mode:'第三方委托',domain:'食品检测',activationScope:'华东食品实验室',workflowVersion:'food-flow v1.4',active:true,snapshotRef:'DEMO-SNAPSHOT/third-party-food-physchem@v1.2.0',requestSchema:'third-party-request-intake · v3',subjectSchema:'food-sample-intake · v3',subjectLabel:'食品样品',
 requestFields:[{key:'customer',label:'委托方名称',type:'text',required:true,placeholder:'请输入演示委托方名称'},{key:'contact',label:'联系人',type:'text',required:true},{key:'purpose',label:'检测目的',type:'select',required:true,options:['合规检测','出口认证','研发验证','纠纷仲裁']},{key:'dueDate',label:'期望完成日期',type:'date',required:true},{key:'requirements',label:'特殊要求',type:'textarea',span:2}],
 subjectFields:[{key:'name',label:'样品名称',type:'text',required:true,width:160},{key:'category',label:'食品类别',type:'select',required:true,options:['粮食及制品','肉及肉制品','水产品','蔬菜','饮料'],width:150},{key:'batch',label:'批次 / Lot',type:'text',required:true,width:130},{key:'quantity',label:'数量',type:'text',required:true,width:90}],
 testItems:[{code:'FOOD.PB',name:'铅 Pb',standard:'GB 5009.12-2023',method:'ICP-MS Pb v2.1',limit:'Food Pb Limit v3'},{code:'FOOD.CD',name:'镉 Cd',standard:'GB 5009.15-2023',method:'ICP-MS Cd v2.0',limit:'Food Cd Limit v2'},{code:'FOOD.MOISTURE',name:'水分',standard:'GB 5009.3-2016',method:'Drying v3',limit:'Product Spec v5'}],
 nodes:nodes(['REQUEST_ACCEPTANCE','SAMPLE_RECEIPT','SAMPLE_PREPARATION','LAB_TEST_EXECUTION','TECHNICAL_REVIEW','REPORT_RELEASE'])},
 {id:2,key:'environment-water-field',name:'环境水质现场监测',version:'v2.0.1',mode:'第三方委托',domain:'环境检测',activationScope:'深圳综合实验室',workflowVersion:'env-field-flow v2.3',active:true,snapshotRef:'DEMO-SNAPSHOT/environment-water-field@v2.0.1',requestSchema:'environment-project-request · v2',subjectSchema:'sampling-point · v4',subjectLabel:'采样点位',
 requestFields:[{key:'customer',label:'委托单位',type:'text',required:true},{key:'project',label:'监测项目',type:'text',required:true},{key:'monitoringType',label:'监测类型',type:'select',required:true,options:['地表水','地下水','工业废水','生活污水']},{key:'dueDate',label:'计划完成日期',type:'date',required:true},{key:'requirements',label:'现场要求',type:'textarea',span:2}],
 subjectFields:[{key:'pointCode',label:'点位编号',type:'text',required:true,width:120},{key:'pointName',label:'点位名称',type:'text',required:true,width:160},{key:'pointType',label:'点位类型',type:'select',required:true,options:['地表水','地下水','排放口'],width:130},{key:'location',label:'位置描述',type:'text',required:true,width:180}],
 testItems:[{code:'ENV.COD',name:'COD',standard:'HJ 828-2017',method:'Dichromate v2',limit:'Discharge COD v4'},{code:'ENV.NH3N',name:'氨氮',standard:'HJ 535-2009',method:'Nessler v2',limit:'Discharge NH3N v3'}],
 nodes:nodes(['SAMPLING_PLAN','FIELD_SAMPLING','SAMPLE_TRANSPORT','SAMPLE_RECEIPT','LAB_TEST_EXECUTION','TECHNICAL_REVIEW','REPORT_RELEASE'])},
 {id:3,key:'internal-metrology',name:'企业内部几何量检测',version:'v2.1.0',mode:'企业内部',domain:'几何量',activationScope:'北京计量实验室',workflowVersion:'metrology-flow v2.1',active:true,snapshotRef:'DEMO-SNAPSHOT/internal-metrology@v2.1.0',requestSchema:'internal-metrology-request · v2',subjectSchema:'metrology-part · v3',subjectLabel:'零件 / Part',
 requestFields:[{key:'department',label:'申请部门',type:'text',required:true},{key:'source',label:'来源业务',type:'select',required:true,options:['来料检验','过程检验','成品检验','研发试验']},{key:'workOrder',label:'工单 / 项目号',type:'text'},{key:'dueDate',label:'要求完成日期',type:'date',required:true},{key:'requirements',label:'测量要求',type:'textarea',span:2}],
 subjectFields:[{key:'partNo',label:'零件号',type:'text',required:true,width:130},{key:'partName',label:'零件名称',type:'text',required:true,width:160},{key:'serial',label:'序列号',type:'text',required:true,width:130},{key:'drawing',label:'图纸版本',type:'text',required:true,width:110}],
 testItems:[{code:'MET.DIAMETER',name:'孔径',standard:'Drawing Rev.C',method:'CMM Dimension v4',limit:'Tolerance Profile v7'},{code:'MET.FLATNESS',name:'平面度',standard:'ISO 1101:2017',method:'CMM GD&T v3',limit:'Drawing Tolerance v5'}],
 nodes:nodes(['INTERNAL_REQUEST','TASK_PLANNING','METROLOGY_MEASUREMENT','RESULT_REVIEW','TECHNICAL_REVIEW','QUALITY_FEEDBACK'])},
];
