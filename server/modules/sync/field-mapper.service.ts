import { Injectable, Logger } from '@nestjs/common';

interface BitableFieldValue {
  text?: string;
  value?: string;
  name?: string;
  id?: string;
  record_id?: string;
  [key: string]: unknown;
}

interface IndustryRecord {
  id: string;
  name: string;
  category: string | null;
  scope: string | null;
  notes: string | null;
  roleCount: number;
  scenarioCount: number;
  stepCount: number;
}

interface RoleRecord {
  id: string;
  name: string;
  priority: string | null;
  description: string | null;
  scale: string | null;
  value: string | null;
  scaleLever: string | null;
  notes: string | null;
  managementSpan: string | null;
  department: string | null;
}

interface ScenarioRecord {
  id: string;
  name: string;
  brief: string | null;
  detail: string | null;
  status: string | null;
  completeness: string | null;
  serviceMode: string | null;
  priority: string | null;
  trigger: string | null;
  inputProvider: string | null;
  output: string | null;
  outputTarget: string | null;
  acceptance: string | null;
  pain: string | null;
  quote: string | null;
  consequence: string | null;
  cadence: string | null;
  timeliness: string | null;
}

interface StepRecord {
  id: string;
  orderNum: number;
  name: string;
  taskType: string | null;
  isHiddenWork: string | null;
  trigger: string | null;
  precondition: string | null;
  input: string | null;
  output: string | null;
  action: string | null;
  difficultyNote: string | null;
  aiRatio: number | null;
  humanRatio: number | null;
  collabRatio: number | null;
  confirmWho: string | null;
  confirmWhere: string | null;
  exception: string | null;
  timeout: string | null;
  aiCanDo: string | null;
  aiNotDo: string | null;
  aiCannotReason: string | null;
  aiPrepare: string | null;
  humanStillDo: string | null;
  expertWay: string | null;
  keyMetrics: string | null;
  dependencies: string | null;
  collaborators: string | null;
}

interface SkillRecord {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  trigger: string | null;
  input: string | null;
  output: string | null;
  criteria: string | null;
  escalation: string | null;
  scripts: string | null;
  referenceDocs: string | null;
  skillMd: string | null;
  url: string | null;
  packages: unknown;
  accuracy: number | null;
  reworkRate: number | null;
  duration: string | null;
  closureMinutes: number | null;
}

interface MaterialRecord {
  id: string;
  name: string;
  url: string | null;
  rawUrl: string | null;
  updatedAt: Date | null;
}

interface CaseItemRecord {
  id: string;
  deptName: string | null;
  completeness: string | null;
  doubaoCapability: string[];
  complexity: string | null;
  commercialScore: number | null;
  info: string | null;
  hasQuantResult: string | null;
  externalLevel: string | null;
  domainL1: string | null;
  evalScore: number | null;
  maturity: string | null;
  auditStatus: string | null;
  recommendTag: string | null;
  valueLevel: string | null;
  domainConfidence: string | null;
  owners: unknown;
  caseDate: string | null;
}

interface CustomerRecord {
  id: string;
  name: string;
  risk: string | null;
  cooperation: string | null;
  latestProgress: string | null;
  opportunityWindow: string | null;
}

interface JobFunctionRecord {
  id: string;
  name: string;
}

export interface RelationPair {
  sourceId: string;
  targetId: string;
  order?: number;
}

@Injectable()
export class FieldMapperService {
  private readonly logger = new Logger(FieldMapperService.name);

  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[\s_\-]+/g, '');
  }

  private buildFieldIndex(fields: Record<string, unknown>): Map<string, string> {
    const index: Map<string, string> = new Map<string, string>();
    for (const key of Object.keys(fields)) {
      index.set(this.normalizeKey(key), key);
    }
    return index;
  }

  private findField(
    index: Map<string, string>,
    keywords: string[],
  ): string | null {
    for (const kw of keywords) {
      const normalized: string = this.normalizeKey(kw);
      if (index.has(normalized)) {
        return index.get(normalized) ?? null;
      }
    }
    return null;
  }

  private extractText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const first: unknown = value[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object') {
        const obj: Record<string, unknown> = first as Record<string, unknown>;
        if (typeof obj.text === 'string') return obj.text;
        if (typeof obj.value === 'string') return obj.value;
        if (typeof obj.name === 'string') return obj.name;
      }
      return null;
    }

    if (typeof value === 'object') {
      const obj: Record<string, unknown> = value as Record<string, unknown>;
      if (typeof obj.text === 'string') return obj.text;
      if (typeof obj.value === 'string') return obj.value;
      if (typeof obj.name === 'string') return obj.name;
    }

    return null;
  }

  private extractNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed: number = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const first: unknown = value[0];
      if (typeof first === 'number') return first;
      if (first && typeof first === 'object') {
        const obj: Record<string, unknown> = first as Record<string, unknown>;
        if (typeof obj.value === 'number') return obj.value;
      }
    }
    return null;
  }

  private extractStringArray(value: unknown): string[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) {
      const result: string[] = [];
      for (const item of value) {
        if (typeof item === 'string') {
          result.push(item);
        } else if (item && typeof item === 'object') {
          const obj: Record<string, unknown> = item as Record<string, unknown>;
          if (typeof obj.text === 'string') result.push(obj.text);
          else if (typeof obj.name === 'string') result.push(obj.name);
          else if (typeof obj.value === 'string') result.push(obj.value);
        }
      }
      return result;
    }
    if (typeof value === 'string') return [value];
    return [];
  }

  private extractDate(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      const date: Date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      const date: Date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    }
    if (Array.isArray(value) && value.length > 0) {
      const first: unknown = value[0];
      if (first && typeof first === 'object') {
        const obj: Record<string, unknown> = first as Record<string, unknown>;
        if (typeof obj.value === 'number') return this.extractDate(obj.value);
      }
    }
    return null;
  }

  private extractTimestampDate(value: unknown): Date | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      const date: Date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'string') {
      const date: Date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  extractRelationIds(
    fields: Record<string, unknown>,
    keywords: string[],
  ): string[] {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const fieldName: string | null = this.findField(index, keywords);
    if (!fieldName) return [];

    const value: unknown = fields[fieldName];
    if (!Array.isArray(value)) return [];

    const ids: string[] = [];
    for (const item of value) {
      if (item && typeof item === 'object') {
        const obj: Record<string, unknown> = item as Record<string, unknown>;
        const rid: unknown = obj.record_id ?? obj.id;
        if (typeof rid === 'string') {
          ids.push(rid);
        }
      }
    }
    return ids;
  }

  extractAllRelationFields(fields: Record<string, unknown>): Map<string, string[]> {
    const result: Map<string, string[]> = new Map<string, string[]>();
    for (const [key, value] of Object.entries(fields)) {
      if (!Array.isArray(value)) continue;
      if (value.length === 0) continue;
      const first: unknown = value[0];
      if (!first || typeof first !== 'object') continue;
      const obj: Record<string, unknown> = first as Record<string, unknown>;
      if ('record_id' in obj || 'id' in obj) {
        const ids: string[] = [];
        for (const item of value) {
          const itemObj: Record<string, unknown> = item as Record<string, unknown>;
          const rid: unknown = itemObj.record_id ?? itemObj.id;
          if (typeof rid === 'string') ids.push(rid);
        }
        result.set(key, ids);
      }
    }
    return result;
  }

  mapIndustry(recordId: string, fields: Record<string, unknown>): IndustryRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '中文名', '行业名称']) ?? '',
      category: getText(['分类', 'category', '类别', '大类']),
      scope: getText(['范围', 'scope', '覆盖范围', '领域']),
      notes: getText(['备注', 'notes', '说明', '描述', 'note']),
      roleCount: 0,
      scenarioCount: 0,
      stepCount: 0,
    };
  }

  mapRole(recordId: string, fields: Record<string, unknown>): RoleRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '岗位名称', '岗位']) ?? '',
      priority: getText(['优先级', 'priority', '优先级排序']),
      description: getText(['描述', 'description', '岗位职责', '职责', '简介']),
      scale: getText(['规模', 'scale', '岗位规模', '人数规模']),
      value: getText(['价值', 'value', '核心价值', '岗位价值']),
      scaleLever: getText(['规模杠杆', 'scaleLever', 'scale_lever', '杠杆点']),
      notes: getText(['备注', 'notes', '说明']),
      managementSpan: getText(['管理幅度', 'managementSpan', 'management_span', '管理范围']),
      department: getText(['部门', 'department', '所属部门', 'dept']),
    };
  }

  mapScenario(recordId: string, fields: Record<string, unknown>): ScenarioRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '场景名称', '场景']) ?? '',
      brief: getText(['简介', 'brief', '一句话描述', '概要']),
      detail: getText(['详情', 'detail', '详细描述', '详细说明', '内容']),
      status: getText(['状态', 'status', '进展状态']),
      completeness: getText(['完整度', 'completeness', '完整度等级']),
      serviceMode: getText(['服务模式', 'serviceMode', 'service_mode', '交付模式']),
      priority: getText(['优先级', 'priority', '重要性']),
      trigger: getText(['触发', 'trigger', '触发条件', '触发场景']),
      inputProvider: getText(['输入提供方', 'inputProvider', 'input_provider', '输入方']),
      output: getText(['输出', 'output', '产出', '交付物']),
      outputTarget: getText(['输出目标', 'outputTarget', 'output_target', '产出对象']),
      acceptance: getText(['验收标准', 'acceptance', '验收条件', '验收']),
      pain: getText(['痛点', 'pain', '业务痛点', '问题']),
      quote: getText(['引用', 'quote', '用户原话', '典型表述']),
      consequence: getText(['后果', 'consequence', '不做的后果', '影响']),
      cadence: getText(['频率', 'cadence', '发生频率', '频次']),
      timeliness: getText(['时效性', 'timeliness', '时间要求']),
    };
  }

  mapStep(recordId: string, fields: Record<string, unknown>): StepRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };
    const getNumber = (keywords: string[]): number | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractNumber(fields[field]) : null;
    };

    return {
      id: recordId,
      orderNum: getNumber(['序号', 'orderNum', 'order', '排序', '顺序']) ?? 1,
      name: getText(['名称', 'name', 'Name', '步骤名称', '步骤']) ?? '',
      taskType: getText(['任务类型', 'taskType', 'task_type', '类型']),
      isHiddenWork: getText(['隐性工作', 'isHiddenWork', 'is_hidden_work', '是否隐性']),
      trigger: getText(['触发', 'trigger', '触发条件']),
      precondition: getText(['前置条件', 'precondition', '前提条件', '前置']),
      input: getText(['输入', 'input', '输入项']),
      output: getText(['输出', 'output', '输出项', '产出']),
      action: getText(['动作', 'action', '操作', '执行动作']),
      difficultyNote: getText(['难点说明', 'difficultyNote', 'difficulty_note', '难点']),
      aiRatio: getNumber(['AI占比', 'aiRatio', 'ai_ratio', 'AI占比(%)', 'AI比例']),
      humanRatio: getNumber(['人工占比', 'humanRatio', 'human_ratio', '人工比例']),
      collabRatio: getNumber(['协作占比', 'collabRatio', 'collab_ratio', '协作比例']),
      confirmWho: getText(['确认人', 'confirmWho', 'confirm_who', '谁确认']),
      confirmWhere: getText(['确认位置', 'confirmWhere', 'confirm_where', '在哪确认']),
      exception: getText(['异常处理', 'exception', '异常', '例外情况']),
      timeout: getText(['超时', 'timeout', '超时时间', '时限']),
      aiCanDo: getText(['AI能做', 'aiCanDo', 'ai_can_do', 'AI可完成']),
      aiNotDo: getText(['AI不能做', 'aiNotDo', 'ai_not_do', 'AI不能完成']),
      aiCannotReason: getText(['AI无法推理', 'aiCannotReason', 'ai_cannot_reason', 'AI推理局限']),
      aiPrepare: getText(['AI准备', 'aiPrepare', 'ai_prepare', 'AI前置准备']),
      humanStillDo: getText(['人仍需做', 'humanStillDo', 'human_still_do', '人工仍需处理']),
      expertWay: getText(['专家做法', 'expertWay', 'expert_way', '最佳实践']),
      keyMetrics: getText(['关键指标', 'keyMetrics', 'key_metrics', '衡量指标']),
      dependencies: getText(['依赖', 'dependencies', '依赖项', '前置依赖']),
      collaborators: getText(['协作方', 'collaborators', '协作角色', '协同方']),
    };
  }

  mapSkill(recordId: string, fields: Record<string, unknown>): SkillRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };
    const getNumber = (keywords: string[]): number | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractNumber(fields[field]) : null;
    };
    const getStringArray = (keywords: string[]): string[] => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractStringArray(fields[field]) : [];
    };

    const packagesArr: string[] = getStringArray(['依赖包', 'packages', 'package', '依赖', 'npm包']);
    const packages: unknown = packagesArr.length > 0
      ? packagesArr.map((p: string) => ({ token: p, name: p, size: 0 }))
      : null;

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '技能名称', '技能']) ?? '',
      description: getText(['描述', 'description', '技能描述', '简介']),
      version: getText(['版本', 'version', '版本号']),
      trigger: getText(['触发', 'trigger', '触发条件', '使用场景']),
      input: getText(['输入', 'input', '入参', '输入参数']),
      output: getText(['输出', 'output', '出参', '输出结果']),
      criteria: getText(['标准', 'criteria', '验收标准', '质量标准']),
      escalation: getText(['升级路径', 'escalation', '升级', '上报路径']),
      scripts: getText(['脚本', 'scripts', '脚本内容']),
      referenceDocs: getText(['参考文档', 'referenceDocs', 'reference_docs', '文档链接']),
      skillMd: getText(['skillMd', 'skill_md', '技能文档', 'md文档', 'markdown']),
      url: getText(['链接', 'url', 'Url', 'URL', '地址']),
      packages,
      accuracy: getNumber(['准确率', 'accuracy', '准确度']),
      reworkRate: getNumber(['返工率', 'reworkRate', 'rework_rate']),
      duration: getText(['耗时', 'duration', '执行时长', '时长']),
      closureMinutes: getNumber(['关闭分钟数', 'closureMinutes', 'closure_minutes', '关闭时长']),
    };
  }

  mapMaterial(recordId: string, fields: Record<string, unknown>): MaterialRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };

    const updatedAtRaw: unknown = (() => {
      const field: string | null = this.findField(index, ['更新时间', 'updatedAt', 'update_time', '修改时间']);
      return field ? fields[field] : null;
    })();

    let urlValue: string | null = getText(['链接', 'url', 'Url', 'URL', '地址', '文件链接']);
    let rawUrlValue: string | null = getText(['原始链接', 'rawUrl', 'raw_url', '源地址']);

    if (!urlValue && !rawUrlValue) {
      const index2: Map<string, string> = this.buildFieldIndex(fields);
      const attachmentField: string | null = this.findField(index2, ['附件', 'attachment', '文件', '资料文件']);
      if (attachmentField) {
        const val: unknown = fields[attachmentField];
        if (Array.isArray(val) && val.length > 0) {
          const first: unknown = val[0];
          if (first && typeof first === 'object') {
            const obj: Record<string, unknown> = first as Record<string, unknown>;
            if (typeof obj.url === 'string') {
              urlValue = obj.url;
              rawUrlValue = typeof obj.tmp_url === 'string' ? obj.tmp_url : obj.url;
            }
          }
        }
      }
    }

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '资料名称', '文件名', '标题']) ?? '',
      url: urlValue,
      rawUrl: rawUrlValue,
      updatedAt: this.extractTimestampDate(updatedAtRaw),
    };
  }

  mapCaseItem(recordId: string, fields: Record<string, unknown>): CaseItemRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };
    const getNumber = (keywords: string[]): number | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractNumber(fields[field]) : null;
    };
    const getStringArray = (keywords: string[]): string[] => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractStringArray(fields[field]) : [];
    };

    const ownersField: string | null = this.findField(index, ['负责人', 'owners', 'owner', 'ownerId', '人员']);
    let owners: unknown = null;
    if (ownersField) {
      const val: unknown = fields[ownersField];
      if (Array.isArray(val)) {
        const ownerList: { id: string; name: string }[] = [];
        for (const item of val) {
          if (item && typeof item === 'object') {
            const obj: Record<string, unknown> = item as Record<string, unknown>;
            const oid: string = typeof obj.id === 'string' ? obj.id : '';
            const oname: string = typeof obj.name === 'string' ? obj.name :
              (Array.isArray(obj.name) && obj.name.length > 0 && typeof obj.name[0] === 'string' ? obj.name[0] : '');
            if (oid) ownerList.push({ id: oid, name: oname });
          }
        }
        if (ownerList.length > 0) owners = ownerList;
      }
    }

    return {
      id: recordId,
      deptName: getText(['部门', 'deptName', 'dept_name', '部门名称', '所属部门']),
      completeness: getText(['完整度', 'completeness', '完整度等级', '完成度']),
      doubaoCapability: getStringArray(['豆包能力', 'doubaoCapability', 'doubao_capability', 'AI能力', '模型能力']),
      complexity: getText(['复杂度', 'complexity', '复杂程度']),
      commercialScore: getNumber(['商业价值', 'commercialScore', 'commercial_score', '商业评分']),
      info: getText(['信息', 'info', '案例介绍', '简介', '背景']),
      hasQuantResult: getText(['量化结果', 'hasQuantResult', 'has_quant_result', '是否量化']),
      externalLevel: getText(['对外等级', 'externalLevel', 'external_level', '外部评级']),
      domainL1: getText(['一级领域', 'domainL1', 'domain_l1', '领域', '行业领域']),
      evalScore: getNumber(['评估分数', 'evalScore', 'eval_score', '评分']),
      maturity: getText(['成熟度', 'maturity', '成熟度等级']),
      auditStatus: getText(['审核状态', 'auditStatus', 'audit_status', '审批状态']),
      recommendTag: getText(['推荐标签', 'recommendTag', 'recommend_tag', '推荐']),
      valueLevel: getText(['价值等级', 'valueLevel', 'value_level', '价值层级']),
      domainConfidence: getText(['领域置信度', 'domainConfidence', 'domain_confidence']),
      owners,
      caseDate: this.extractDate(
        (() => {
          const field: string | null = this.findField(index, ['案例日期', 'caseDate', 'case_date', '日期', '发生时间']);
          return field ? fields[field] : null;
        })(),
      ),
    };
  }

  mapCustomer(recordId: string, fields: Record<string, unknown>): CustomerRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '客户名称', '客户', '客户名']) ?? '',
      risk: getText(['风险', 'risk', '客户风险', '风险等级']),
      cooperation: getText(['合作状态', 'cooperation', '合作情况', '合作']),
      latestProgress: getText(['最新进展', 'latestProgress', 'latest_progress', '进展']),
      opportunityWindow: getText(['机会窗口', 'opportunityWindow', 'opportunity_window', '窗口期']),
    };
  }

  mapJobFunction(recordId: string, fields: Record<string, unknown>): JobFunctionRecord {
    const index: Map<string, string> = this.buildFieldIndex(fields);
    const getText = (keywords: string[]): string | null => {
      const field: string | null = this.findField(index, keywords);
      return field ? this.extractText(fields[field]) : null;
    };

    return {
      id: recordId,
      name: getText(['名称', 'name', 'Name', '职能名称', '职能', '岗位职能']) ?? '',
    };
  }
}
