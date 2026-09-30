import { Injectable, Inject, Logger, ConflictException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, sql } from 'drizzle-orm';
import {
  syncRun,
  syncTableLog,
  industry,
  role,
  scenario,
  step,
  skill,
  material,
  caseItem,
  customer,
  jobFunction,
  industryRole,
  roleScenario,
  scenarioStep,
  scenarioSkill,
  roleFunction,
  caseScenario,
  caseRole,
  caseIndustry,
  caseCustomer,
  caseMaterial,
  customerIndustry,
  customerMaterial,
  skillMaterial,
  roleMaterial,
  stepMaterial,
  scenarioMaterial,
} from '@server/database/schema';
import type {
  SyncStatusResponse,
  DataSourceTableItem,
  TestConnectionResponse,
  FullSyncTriggerResponse,
  ReloadCredentialsResponse,
} from '@shared/api.interface';
import { BitableClientService, type BitableRecord } from './bitable-client.service';
import { FieldMapperService, type RelationPair } from './field-mapper.service';

type SyncTableKey =
  | 'industries'
  | 'functions'
  | 'roles'
  | 'scenarios'
  | 'steps'
  | 'skills'
  | 'materials'
  | 'cases'
  | 'customers';

const MAIN_TABLE_ORDER: SyncTableKey[] = [
  'industries',
  'functions',
  'roles',
  'scenarios',
  'steps',
  'skills',
  'materials',
  'cases',
  'customers',
];

interface SyncStats {
  recordsRead: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsUnchanged: number;
  recordsFailed: number;
}

interface IndustryRelationData {
  industryId: string;
  roleIds: string[];
}

interface RoleRelationData {
  roleId: string;
  scenarioIds: string[];
  functionIds: string[];
  materialIds: string[];
}

interface ScenarioRelationData {
  scenarioId: string;
  stepIds: string[];
  skillIds: string[];
  materialIds: string[];
}

interface SkillRelationData {
  skillId: string;
  materialIds: string[];
}

interface StepRelationData {
  stepId: string;
  materialIds: string[];
}

interface CaseRelationData {
  caseId: string;
  scenarioIds: string[];
  roleIds: string[];
  industryIds: string[];
  customerIds: string[];
  materialIds: string[];
}

interface CustomerRelationData {
  customerId: string;
  industryIds: string[];
  materialIds: string[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly bitableClient: BitableClientService,
    private readonly fieldMapper: FieldMapperService,
  ) {}

  async getSyncStatus(): Promise<SyncStatusResponse> {
    const tableDefs: { name: string; display: string; source: string; isView: boolean }[] = [
      { name: 'function_00', display: '职能', source: 'job_function_sync_v', isView: true },
      { name: 'industry_01', display: '行业', source: 'industry_sync_v', isView: true },
      { name: 'role_02', display: '岗位', source: 'role_sync_v', isView: true },
      { name: 'scenario_03', display: '业务场景工作流', source: 'scenario_sync_v', isView: true },
      { name: 'substep_04', display: '工作流子步骤', source: 'step_sync_v', isView: true },
      { name: 'mcp_05', display: 'MCP', source: 'mcp_05', isView: false },
      { name: 'skill_06', display: 'Skill业务方法', source: 'skill_sync_v', isView: true },
      { name: 'evalcard_07', display: '前场评测题卡', source: 'front_evaluation_card', isView: false },
      { name: 'sametopic_08', display: '产品同题运行与对比', source: 'product_same_topic_run_compare', isView: false },
      { name: 'seed_09', display: 'Seed题库', source: 'seed_question_bank_09', isView: false },
      { name: 'material_10', display: '案例资料明细', source: 'material_sync_v', isView: true },
      { name: 'case_11', display: '案例', source: 'case_item_sync_v', isView: true },
      { name: 'customer_12', display: '客户', source: 'customer_sync_v', isView: true },
    ];

    const tables: DataSourceTableItem[] = [];
    let totalRecords = 0;
    let emptyCount = 0;
    let latestDataDate: Date | null = null;

    for (const def of tableDefs) {
      try {
        const result = await this.db.execute(sql`
          SELECT count(*)::int AS cnt, max(_updated_at) AS last_upd
          FROM ${sql.identifier(def.source)}
        `);
        const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows;
        const count = Number(rows[0]?.cnt ?? 0);
        const lastUpd = rows[0]?.last_upd;
        totalRecords += count;
        const lastUpdDate = lastUpd instanceof Date ? lastUpd : lastUpd ? new Date(String(lastUpd)) : null;
        if (lastUpdDate && !isNaN(lastUpdDate.getTime())) {
          if (!latestDataDate || lastUpdDate > latestDataDate) {
            latestDataDate = lastUpdDate;
          }
        }
        const status: DataSourceTableItem['status'] = count > 0 ? 'healthy' : 'empty';
        if (count === 0) emptyCount += 1;
        tables.push({
          tableName: def.name,
          displayName: def.display,
          recordCount: count,
          sourceTable: def.source,
          status,
          lastUpdated: lastUpd instanceof Date ? lastUpd.toISOString() : lastUpd ? String(lastUpd) : null,
        });
      } catch (err) {
        emptyCount += 1;
        tables.push({
          tableName: def.name,
          displayName: def.display,
          recordCount: 0,
          sourceTable: def.source,
          status: 'warning',
          lastUpdated: null,
        });
        this.logger.warn(`数据源表 ${def.source} 查询失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const lastSuccessRun = await this.db
      .select({ finishedAt: syncRun.finishedAt })
      .from(syncRun)
      .where(eq(syncRun.status, 'success'))
      .orderBy(desc(syncRun.finishedAt))
      .limit(1);

    const healthStatus: SyncStatusResponse['healthStatus'] =
      emptyCount === 0 ? 'healthy' : emptyCount < 3 ? 'degraded' : 'degraded';

    return {
      mode: 'db_sync_tables',
      sourceLabel: 'Base 数据库同步表 00–12',
      sourceDescription: '应用直接读取由妙搭 Base 同步机制维护的 13 张数据库同步表，数据随飞书多维表格更新自动同步。',
      totalTables: tables.length,
      totalRecords,
      lastSyncAt: lastSuccessRun[0]?.finishedAt
        ? new Date(lastSuccessRun[0].finishedAt).toISOString()
        : null,
      latestDataAt: latestDataDate ? latestDataDate.toISOString() : null,
      healthStatus,
      tables,
      syncDisabled: true,
      syncDisabledReason: '应用已切换为直接读取 Base 数据库同步表，不再执行手动或定时同步任务。',
    };
  }

  private async getTableLogsForRun(runId: string): Promise<{ tableName: string; status: string }[]> {
    const logs = await this.db
      .select({ tableName: syncTableLog.tableName, status: syncTableLog.status })
      .from(syncTableLog)
      .where(eq(syncTableLog.runId, runId))
      .orderBy(syncTableLog.tableName);

    return logs.map((log) => ({
      tableName: log.tableName,
      status: log.status,
    }));
  }

  async reloadCredentials(): Promise<ReloadCredentialsResponse> {
    return {
      success: false,
      message: '应用已切换为直接读取 Base 数据库同步表，凭证重载功能已停用。',
    };
  }

  async testConnection(): Promise<TestConnectionResponse> {
    return {
      success: false,
      message: '应用已切换为直接读取 Base 数据库同步表，连接测试功能已停用。请查看数据源状态页了解各同步表健康情况。',
      tablesFound: 0,
      tables: [],
    };
  }

  async triggerFullSync(triggerType: string): Promise<FullSyncTriggerResponse> {
    if (!this.bitableClient.isConfigured()) {
      return {
        success: false,
        message: this.bitableClient.getConnectionMessage(),
      };
    }

    const running: typeof syncRun.$inferSelect[] = await this.db
      .select()
      .from(syncRun)
      .where(eq(syncRun.status, 'running'))
      .limit(1);

    if (running.length > 0) {
      return {
        success: false,
        message: '已有同步任务正在运行中，请稍后再试',
      };
    }

    const inserted: { id: string }[] = await this.db
      .insert(syncRun)
      .values({ triggerType, status: 'running' })
      .returning({ id: syncRun.id });

    const runId: string = inserted[0].id;
    this.logger.log(`触发全量同步，runId=${runId}，triggerType=${triggerType}`);

    void this.runFullSync(runId);

    return {
      success: true,
      message: '同步任务已启动',
      runId,
    };
  }

  async runFullSync(runId: string): Promise<void> {
    this.logger.log(`开始执行全量同步 runId=${runId}`);
    const errors: string[] = [];

    const industryRelations: IndustryRelationData[] = [];
    const roleRelations: RoleRelationData[] = [];
    const scenarioRelations: ScenarioRelationData[] = [];
    const skillRelations: SkillRelationData[] = [];
    const stepRelations: StepRelationData[] = [];
    const caseRelations: CaseRelationData[] = [];
    const customerRelations: CustomerRelationData[] = [];

    try {
      for (const tableKey of MAIN_TABLE_ORDER) {
        const logId: string | null = await this.createTableLog(runId, tableKey);
        try {
          const stats: SyncStats = await this.syncTable(
            tableKey,
            industryRelations,
            roleRelations,
            scenarioRelations,
            skillRelations,
            stepRelations,
            caseRelations,
            customerRelations,
          );
          await this.updateTableLogSuccess(logId, stats);
          this.logger.log(`表 ${tableKey} 同步完成: 读取${stats.recordsRead} 新增${stats.recordsInserted} 更新${stats.recordsUpdated}`);
        } catch (err) {
          const msg: string = err instanceof Error ? err.message : String(err);
          errors.push(`${tableKey}: ${msg}`);
          this.logger.error(`表 ${tableKey} 同步失败: ${msg}`, err instanceof Error ? err.stack : undefined);
          await this.updateTableLogFailed(logId, msg);
        }
      }

      if (errors.length === 0) {
        try {
          await this.rebuildAllRelations(
            industryRelations,
            roleRelations,
            scenarioRelations,
            skillRelations,
            stepRelations,
            caseRelations,
            customerRelations,
          );
          this.logger.log('关联表重建完成');
        } catch (err) {
          const msg: string = err instanceof Error ? err.message : String(err);
          errors.push(`关联表: ${msg}`);
          this.logger.error(`关联表重建失败: ${msg}`, err instanceof Error ? err.stack : undefined);
        }
      }

      if (errors.length === 0) {
        await this.updateRunSuccess(runId);
        this.logger.log(`全量同步成功 runId=${runId}`);
      } else {
        const errorSummary: string = errors.join('; ');
        await this.updateRunFailed(runId, errorSummary);
        this.logger.warn(`全量同步部分失败 runId=${runId}: ${errorSummary}`);
      }
    } catch (err) {
      const msg: string = err instanceof Error ? err.message : String(err);
      this.logger.error(`全量同步异常 runId=${runId}: ${msg}`, err instanceof Error ? err.stack : undefined);
      try {
        await this.updateRunFailed(runId, msg);
      } catch {
        // ignore
      }
    }
  }

  private async createTableLog(runId: string, tableName: string): Promise<string | null> {
    try {
      const result: { id: string }[] = await this.db
        .insert(syncTableLog)
        .values({
          runId,
          tableName,
          status: 'running',
          startedAt: new Date(),
        })
        .returning({ id: syncTableLog.id });
      return result[0]?.id ?? null;
    } catch (err) {
      this.logger.warn(`创建 sync_table_log 失败: ${String(err)}`);
      return null;
    }
  }

  private async updateTableLogSuccess(logId: string | null, stats: SyncStats): Promise<void> {
    if (!logId) return;
    try {
      await this.db
        .update(syncTableLog)
        .set({
          status: 'success',
          recordsRead: stats.recordsRead,
          recordsInserted: stats.recordsInserted,
          recordsUpdated: stats.recordsUpdated,
          recordsUnchanged: stats.recordsUnchanged,
          recordsFailed: stats.recordsFailed,
          finishedAt: new Date(),
        })
        .where(eq(syncTableLog.id, logId));
    } catch (err) {
      this.logger.warn(`更新 sync_table_log 成功状态失败: ${String(err)}`);
    }
  }

  private async updateTableLogFailed(logId: string | null, errorMessage: string): Promise<void> {
    if (!logId) return;
    try {
      await this.db
        .update(syncTableLog)
        .set({
          status: 'failed',
          errorMessage,
          finishedAt: new Date(),
        })
        .where(eq(syncTableLog.id, logId));
    } catch (err) {
      this.logger.warn(`更新 sync_table_log 失败状态失败: ${String(err)}`);
    }
  }

  private async updateRunSuccess(runId: string): Promise<void> {
    await this.db
      .update(syncRun)
      .set({ status: 'success', finishedAt: new Date() })
      .where(eq(syncRun.id, runId));
  }

  private async updateRunFailed(runId: string, errorSummary: string): Promise<void> {
    await this.db
      .update(syncRun)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        errorSummary,
      })
      .where(eq(syncRun.id, runId));
  }

  private async syncTable(
    tableKey: SyncTableKey,
    industryRelations: IndustryRelationData[],
    roleRelations: RoleRelationData[],
    scenarioRelations: ScenarioRelationData[],
    skillRelations: SkillRelationData[],
    stepRelations: StepRelationData[],
    caseRelations: CaseRelationData[],
    customerRelations: CustomerRelationData[],
  ): Promise<SyncStats> {
    const tableId: string = this.bitableClient.getTableId(tableKey);
    if (!tableId) {
      this.logger.warn(`表 ${tableKey} 未配置 tableId，跳过同步`);
      return { recordsRead: 0, recordsInserted: 0, recordsUpdated: 0, recordsUnchanged: 0, recordsFailed: 0 };
    }

    const stats: SyncStats = {
      recordsRead: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsUnchanged: 0,
      recordsFailed: 0,
    };

    for await (const batch of this.bitableClient.listRecords(tableId, 100)) {
      stats.recordsRead += batch.length;

      for (const record of batch) {
        try {
          const result: 'inserted' | 'updated' | 'unchanged' = await this.upsertRecord(
            tableKey,
            record,
            industryRelations,
            roleRelations,
            scenarioRelations,
            skillRelations,
            stepRelations,
            caseRelations,
            customerRelations,
          );
          if (result === 'inserted') stats.recordsInserted += 1;
          else if (result === 'updated') stats.recordsUpdated += 1;
          else stats.recordsUnchanged += 1;
        } catch (err) {
          stats.recordsFailed += 1;
          this.logger.warn(
            `记录 ${record.record_id} 写入失败: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    return stats;
  }

  private async upsertRecord(
    tableKey: SyncTableKey,
    record: BitableRecord,
    industryRelations: IndustryRelationData[],
    roleRelations: RoleRelationData[],
    scenarioRelations: ScenarioRelationData[],
    skillRelations: SkillRelationData[],
    stepRelations: StepRelationData[],
    caseRelations: CaseRelationData[],
    customerRelations: CustomerRelationData[],
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    const fields: Record<string, unknown> = record.fields as Record<string, unknown>;

    switch (tableKey) {
      case 'industries': {
        const data = this.fieldMapper.mapIndustry(record.record_id, fields);
        const roleIds: string[] = this.fieldMapper.extractRelationIds(fields, ['岗位', 'roles', 'role', '关联岗位']);
        if (roleIds.length > 0) {
          industryRelations.push({ industryId: data.id, roleIds });
        }
        return await this.upsertIndustry(data);
      }
      case 'functions': {
        const data = this.fieldMapper.mapJobFunction(record.record_id, fields);
        return await this.upsertJobFunction(data);
      }
      case 'roles': {
        const data = this.fieldMapper.mapRole(record.record_id, fields);
        const scenarioIds: string[] = this.fieldMapper.extractRelationIds(fields, ['场景', 'scenarios', 'scenario', '关联场景']);
        const functionIds: string[] = this.fieldMapper.extractRelationIds(fields, ['职能', 'functions', 'function', '关联职能']);
        const materialIds: string[] = this.fieldMapper.extractRelationIds(fields, ['资料', 'materials', 'material', '关联资料']);
        roleRelations.push({ roleId: data.id, scenarioIds, functionIds, materialIds });
        return await this.upsertRole(data);
      }
      case 'scenarios': {
        const data = this.fieldMapper.mapScenario(record.record_id, fields);
        const stepIds: string[] = this.fieldMapper.extractRelationIds(fields, ['步骤', 'steps', 'step', '关联步骤']);
        const skillIds: string[] = this.fieldMapper.extractRelationIds(fields, ['技能', 'skills', 'skill', '关联技能']);
        const materialIds: string[] = this.fieldMapper.extractRelationIds(fields, ['资料', 'materials', 'material', '关联资料']);
        scenarioRelations.push({ scenarioId: data.id, stepIds, skillIds, materialIds });
        return await this.upsertScenario(data);
      }
      case 'steps': {
        const data = this.fieldMapper.mapStep(record.record_id, fields);
        const materialIds: string[] = this.fieldMapper.extractRelationIds(fields, ['资料', 'materials', 'material', '关联资料']);
        stepRelations.push({ stepId: data.id, materialIds });
        return await this.upsertStep(data);
      }
      case 'skills': {
        const data = this.fieldMapper.mapSkill(record.record_id, fields);
        const materialIds: string[] = this.fieldMapper.extractRelationIds(fields, ['资料', 'materials', 'material', '关联资料']);
        skillRelations.push({ skillId: data.id, materialIds });
        return await this.upsertSkill(data);
      }
      case 'materials': {
        const data = this.fieldMapper.mapMaterial(record.record_id, fields);
        return await this.upsertMaterial(data);
      }
      case 'cases': {
        const data = this.fieldMapper.mapCaseItem(record.record_id, fields);
        const scenarioIds: string[] = this.fieldMapper.extractRelationIds(fields, ['场景', 'scenarios', 'scenario', '关联场景']);
        const roleIds: string[] = this.fieldMapper.extractRelationIds(fields, ['岗位', 'roles', 'role', '关联岗位']);
        const industryIds: string[] = this.fieldMapper.extractRelationIds(fields, ['行业', 'industries', 'industry', '关联行业']);
        const customerIds: string[] = this.fieldMapper.extractRelationIds(fields, ['客户', 'customers', 'customer', '关联客户']);
        const materialIds: string[] = this.fieldMapper.extractRelationIds(fields, ['资料', 'materials', 'material', '关联资料']);
        caseRelations.push({ caseId: data.id, scenarioIds, roleIds, industryIds, customerIds, materialIds });
        return await this.upsertCase(data);
      }
      case 'customers': {
        const data = this.fieldMapper.mapCustomer(record.record_id, fields);
        const industryIds: string[] = this.fieldMapper.extractRelationIds(fields, ['行业', 'industries', 'industry', '关联行业']);
        const materialIds: string[] = this.fieldMapper.extractRelationIds(fields, ['资料', 'materials', 'material', '关联资料']);
        customerRelations.push({ customerId: data.id, industryIds, materialIds });
        return await this.upsertCustomer(data);
      }
      default:
        throw new ConflictException(`未知的表: ${tableKey}`);
    }
  }

  private async upsertIndustry(
    data: { id: string; name: string; category: string | null; scope: string | null; notes: string | null; roleCount: number; scenarioCount: number; stepCount: number },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(industry, data, industry.id, data.id);
  }

  private async upsertRole(
    data: { id: string; name: string; priority: string | null; description: string | null; scale: string | null; value: string | null; scaleLever: string | null; notes: string | null; managementSpan: string | null; department: string | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(role, data, role.id, data.id);
  }

  private async upsertScenario(
    data: { id: string; name: string; brief: string | null; detail: string | null; status: string | null; completeness: string | null; serviceMode: string | null; priority: string | null; trigger: string | null; inputProvider: string | null; output: string | null; outputTarget: string | null; acceptance: string | null; pain: string | null; quote: string | null; consequence: string | null; cadence: string | null; timeliness: string | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(scenario, data, scenario.id, data.id);
  }

  private async upsertStep(
    data: { id: string; orderNum: number; name: string; taskType: string | null; isHiddenWork: string | null; trigger: string | null; precondition: string | null; input: string | null; output: string | null; action: string | null; difficultyNote: string | null; aiRatio: number | null; humanRatio: number | null; collabRatio: number | null; confirmWho: string | null; confirmWhere: string | null; exception: string | null; timeout: string | null; aiCanDo: string | null; aiNotDo: string | null; aiCannotReason: string | null; aiPrepare: string | null; humanStillDo: string | null; expertWay: string | null; keyMetrics: string | null; dependencies: string | null; collaborators: string | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(step, data, step.id, data.id);
  }

  private async upsertSkill(
    data: { id: string; name: string; description: string | null; version: string | null; trigger: string | null; input: string | null; output: string | null; criteria: string | null; escalation: string | null; scripts: string | null; referenceDocs: string | null; skillMd: string | null; url: string | null; packages: unknown; accuracy: number | null; reworkRate: number | null; duration: string | null; closureMinutes: number | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(skill, data, skill.id, data.id);
  }

  private async upsertMaterial(
    data: { id: string; name: string; url: string | null; rawUrl: string | null; updatedAt: Date | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(material, data, material.id, data.id);
  }

  private async upsertCase(
    data: { id: string; deptName: string | null; completeness: string | null; doubaoCapability: string[]; complexity: string | null; commercialScore: number | null; info: string | null; hasQuantResult: string | null; externalLevel: string | null; domainL1: string | null; evalScore: number | null; maturity: string | null; auditStatus: string | null; recommendTag: string | null; valueLevel: string | null; domainConfidence: string | null; owners: unknown; caseDate: string | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(caseItem, data, caseItem.id, data.id);
  }

  private async upsertCustomer(
    data: { id: string; name: string; risk: string | null; cooperation: string | null; latestProgress: string | null; opportunityWindow: string | null },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(customer, data, customer.id, data.id);
  }

  private async upsertJobFunction(
    data: { id: string; name: string },
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    return this.performUpsert(jobFunction, data, jobFunction.id, data.id);
  }

  private async performUpsert(
    table: { id: unknown },
    data: Record<string, unknown>,
    idColumn: unknown,
    recordId: string,
  ): Promise<'inserted' | 'updated' | 'unchanged'> {
    const insertData: Record<string, unknown> = { ...data, id: recordId };
    delete insertData['id'];

    const setClause: Record<string, unknown> = {};
    for (const key of Object.keys(insertData)) {
      setClause[key] = insertData[key] ?? null;
    }

    const existingBefore = await this.db
      .select()
      .from(table as never)
      .where(eq(idColumn as never, recordId))
      .limit(1);

    const isInsert: boolean = existingBefore.length === 0;

    if (isInsert) {
      await this.db
        .insert(table as never)
        .values({ id: recordId, ...insertData } as never)
        .onConflictDoUpdate({
          target: idColumn as never,
          set: setClause as never,
        });
      return 'inserted';
    }

    const existingRow: Record<string, unknown> = existingBefore[0] as Record<string, unknown>;
    let changed: boolean = false;
    for (const key of Object.keys(setClause)) {
      const newValue: unknown = setClause[key];
      const oldValue: unknown = existingRow[key];
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        changed = true;
        break;
      }
    }

    if (!changed) {
      return 'unchanged';
    }

    await this.db
      .update(table as never)
      .set(setClause as never)
      .where(eq(idColumn as never, recordId));

    return 'updated';
  }

  private async rebuildAllRelations(
    industryRelations: IndustryRelationData[],
    roleRelations: RoleRelationData[],
    scenarioRelations: ScenarioRelationData[],
    skillRelations: SkillRelationData[],
    stepRelations: StepRelationData[],
    caseRelations: CaseRelationData[],
    customerRelations: CustomerRelationData[],
  ): Promise<void> {
    await this.db.transaction(async (tx: PostgresJsDatabase) => {
      await tx.delete(industryRole);
      await tx.delete(roleScenario);
      await tx.delete(scenarioStep);
      await tx.delete(scenarioSkill);
      await tx.delete(roleFunction);
      await tx.delete(caseScenario);
      await tx.delete(caseRole);
      await tx.delete(caseIndustry);
      await tx.delete(caseCustomer);
      await tx.delete(caseMaterial);
      await tx.delete(customerIndustry);
      await tx.delete(customerMaterial);
      await tx.delete(skillMaterial);
      await tx.delete(roleMaterial);
      await tx.delete(stepMaterial);
      await tx.delete(scenarioMaterial);

      if (industryRelations.length > 0) {
        const rows: { industryId: string; roleId: string }[] = [];
        for (const ir of industryRelations) {
          for (const rid of ir.roleIds) {
            rows.push({ industryId: ir.industryId, roleId: rid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(industryRole).values(rows).onConflictDoNothing();
        }
      }

      if (roleRelations.length > 0) {
        const rows: { roleId: string; scenarioId: string }[] = [];
        for (const rr of roleRelations) {
          for (const sid of rr.scenarioIds) {
            rows.push({ roleId: rr.roleId, scenarioId: sid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(roleScenario).values(rows).onConflictDoNothing();
        }
      }

      if (scenarioRelations.length > 0) {
        const rows: { scenarioId: string; stepId: string; stepOrder: number }[] = [];
        for (const sr of scenarioRelations) {
          sr.stepIds.forEach((sid: string, idx: number) => {
            rows.push({ scenarioId: sr.scenarioId, stepId: sid, stepOrder: idx + 1 });
          });
        }
        if (rows.length > 0) {
          await tx.insert(scenarioStep).values(rows).onConflictDoNothing();
        }
      }

      if (scenarioRelations.length > 0) {
        const rows: { scenarioId: string; skillId: string }[] = [];
        for (const sr of scenarioRelations) {
          for (const sid of sr.skillIds) {
            rows.push({ scenarioId: sr.scenarioId, skillId: sid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(scenarioSkill).values(rows).onConflictDoNothing();
        }
      }

      if (roleRelations.length > 0) {
        const rows: { roleId: string; functionId: string }[] = [];
        for (const rr of roleRelations) {
          for (const fid of rr.functionIds) {
            rows.push({ roleId: rr.roleId, functionId: fid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(roleFunction).values(rows).onConflictDoNothing();
        }
      }

      if (caseRelations.length > 0) {
        const rows: { caseId: string; scenarioId: string }[] = [];
        for (const cr of caseRelations) {
          for (const sid of cr.scenarioIds) {
            rows.push({ caseId: cr.caseId, scenarioId: sid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(caseScenario).values(rows).onConflictDoNothing();
        }
      }

      if (caseRelations.length > 0) {
        const rows: { caseId: string; roleId: string }[] = [];
        for (const cr of caseRelations) {
          for (const rid of cr.roleIds) {
            rows.push({ caseId: cr.caseId, roleId: rid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(caseRole).values(rows).onConflictDoNothing();
        }
      }

      if (caseRelations.length > 0) {
        const rows: { caseId: string; industryId: string }[] = [];
        for (const cr of caseRelations) {
          for (const iid of cr.industryIds) {
            rows.push({ caseId: cr.caseId, industryId: iid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(caseIndustry).values(rows).onConflictDoNothing();
        }
      }

      if (caseRelations.length > 0) {
        const rows: { caseId: string; customerId: string }[] = [];
        for (const cr of caseRelations) {
          for (const cid of cr.customerIds) {
            rows.push({ caseId: cr.caseId, customerId: cid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(caseCustomer).values(rows).onConflictDoNothing();
        }
      }

      if (caseRelations.length > 0) {
        const rows: { caseId: string; materialId: string }[] = [];
        for (const cr of caseRelations) {
          for (const mid of cr.materialIds) {
            rows.push({ caseId: cr.caseId, materialId: mid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(caseMaterial).values(rows).onConflictDoNothing();
        }
      }

      if (customerRelations.length > 0) {
        const rows: { customerId: string; industryId: string }[] = [];
        for (const cr of customerRelations) {
          for (const iid of cr.industryIds) {
            rows.push({ customerId: cr.customerId, industryId: iid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(customerIndustry).values(rows).onConflictDoNothing();
        }
      }

      if (customerRelations.length > 0) {
        const rows: { customerId: string; materialId: string }[] = [];
        for (const cr of customerRelations) {
          for (const mid of cr.materialIds) {
            rows.push({ customerId: cr.customerId, materialId: mid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(customerMaterial).values(rows).onConflictDoNothing();
        }
      }

      if (skillRelations.length > 0) {
        const rows: { skillId: string; materialId: string }[] = [];
        for (const sr of skillRelations) {
          for (const mid of sr.materialIds) {
            rows.push({ skillId: sr.skillId, materialId: mid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(skillMaterial).values(rows).onConflictDoNothing();
        }
      }

      if (roleRelations.length > 0) {
        const rows: { roleId: string; materialId: string }[] = [];
        for (const rr of roleRelations) {
          for (const mid of rr.materialIds) {
            rows.push({ roleId: rr.roleId, materialId: mid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(roleMaterial).values(rows).onConflictDoNothing();
        }
      }

      if (stepRelations.length > 0) {
        const rows: { stepId: string; materialId: string }[] = [];
        for (const sr of stepRelations) {
          for (const mid of sr.materialIds) {
            rows.push({ stepId: sr.stepId, materialId: mid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(stepMaterial).values(rows).onConflictDoNothing();
        }
      }

      if (scenarioRelations.length > 0) {
        const rows: { scenarioId: string; materialId: string }[] = [];
        for (const sr of scenarioRelations) {
          for (const mid of sr.materialIds) {
            rows.push({ scenarioId: sr.scenarioId, materialId: mid });
          }
        }
        if (rows.length > 0) {
          await tx.insert(scenarioMaterial).values(rows).onConflictDoNothing();
        }
      }
    });
  }
}
