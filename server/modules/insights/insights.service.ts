import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, avg, desc, isNotNull, sql, eq } from 'drizzle-orm';
import { syncRun, mcp05Table } from '@server/database/schema';
import {
  industrySyncV,
  roleSyncV,
  scenarioSyncV,
  stepSyncV,
  skillSyncV,
  caseItemSyncV,
  materialSyncV,
  customerSyncV,
  jobFunctionSyncV,
  industryRoleSyncV,
  roleScenarioSyncV,
  scenarioStepSyncV,
  scenarioSkillSyncV,
  roleFunctionSyncV,
  caseScenarioSyncV,
  caseRoleSyncV,
  caseCustomerSyncV,
  caseMaterialSyncV,
  customerIndustrySyncV,
} from '@server/database/sync-views';
import type {
  GlobalInsightsResponse,
  InsightStats,
  ScenarioInsights,
  CaseInsights,
  StepInsights,
  GovernanceMetrics,
  CompletenessItem,
  DomainDistributionItem,
  IndustryDistributionItem,
  TopRoleItem,
  OrphanScenarioItem,
  GovernanceData,
  GovernanceScaleBar,
  GovernanceStackItem,
  GovernanceFunnelStep,
  GovernanceCoverageItem,
  GovernanceSkillCompleteness,
  GovernanceSignal,
  GovernanceStatus,
  PaginatedResponse,
} from '@shared/api.interface';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getGlobalInsights(): Promise<GlobalInsightsResponse> {
    const [
      stats,
      scenarioInsights,
      caseInsights,
      stepInsights,
      governanceMetrics,
      topIndustries,
      topRoles,
      m34Metrics,
      orphanCount,
      syncInfo,
    ] = await Promise.all([
      this.getStats(),
      this.getScenarioInsights(),
      this.getCaseInsights(),
      this.getStepInsights(),
      this.getGovernanceMetrics(),
      this.getTopIndustries(),
      this.getTopRoles(),
      this.getM34Metrics(),
      this.getOrphanCount(),
      this.getLatestSyncInfo(),
    ]);

    return {
      stats,
      scenarioInsights,
      caseInsights,
      stepInsights,
      governanceMetrics,
      topIndustries,
      topRoles,
      m34Total: m34Metrics.m34Total,
      m34QuantUnpassed: m34Metrics.m34QuantUnpassed,
      m34QuantPassed: m34Metrics.m34QuantPassed,
      orphanCount,
      dataUpdatedAt: syncInfo.at,
      dataSource: syncInfo.source,
    };
  }

  private async getLatestSyncInfo(): Promise<{ at: string | null; source: 'snapshot' | 'bitable_sync' | 'db_sync_tables' }> {
    const rows: { finishedAt: Date | null; status: string; sourceType: string | null }[] = await this.db
      .select({ finishedAt: syncRun.finishedAt, status: syncRun.status, sourceType: syncRun.sourceType })
      .from(syncRun)
      .where(eq(syncRun.status, 'success'))
      .orderBy(desc(syncRun.finishedAt))
      .limit(1);
    if (rows.length > 0 && rows[0].finishedAt) {
      const src = rows[0].sourceType;
      if (src === 'db_sync_tables') {
        return { at: rows[0].finishedAt.toISOString(), source: 'db_sync_tables' };
      }
      return { at: rows[0].finishedAt.toISOString(), source: 'bitable_sync' };
    }
    return { at: null, source: 'snapshot' };
  }

  private async getStats(): Promise<InsightStats> {
    const [
      industriesResult,
      rolesResult,
      scenariosResult,
      stepsResult,
      skillsResult,
      materialsResult,
      casesResult,
      customersResult,
      functionsResult,
    ] = await Promise.all([
      this.db.select({ value: count() }).from(industrySyncV),
      this.db.select({ value: count() }).from(roleSyncV),
      this.db.select({ value: count() }).from(scenarioSyncV),
      this.db.select({ value: count() }).from(stepSyncV),
      this.db.select({ value: count() }).from(skillSyncV),
      this.db.select({ value: count() }).from(materialSyncV),
      this.db.select({ value: count() }).from(caseItemSyncV),
      this.db.select({ value: count() }).from(customerSyncV),
      this.db.select({ value: count() }).from(jobFunctionSyncV),
    ]);

    return {
      totalIndustries: industriesResult[0]?.value ?? 0,
      totalRoles: rolesResult[0]?.value ?? 0,
      totalScenarios: scenariosResult[0]?.value ?? 0,
      totalSteps: stepsResult[0]?.value ?? 0,
      totalSkills: skillsResult[0]?.value ?? 0,
      totalMaterials: materialsResult[0]?.value ?? 0,
      totalCases: casesResult[0]?.value ?? 0,
      totalCustomers: customersResult[0]?.value ?? 0,
      totalFunctions: functionsResult[0]?.value ?? 0,
    };
  }

  private async getScenarioInsights(): Promise<ScenarioInsights> {
    const [byStatusRows, byCompletenessRows, byServiceModeRows, byPriorityRaw, totalRaw] =
      await Promise.all([
        this.db
          .select({ label: scenarioSyncV.status, value: count() })
          .from(scenarioSyncV)
          .where(isNotNull(scenarioSyncV.status))
          .groupBy(scenarioSyncV.status),
        this.db
          .select({ label: scenarioSyncV.completeness, value: count() })
          .from(scenarioSyncV)
          .where(isNotNull(scenarioSyncV.completeness))
          .groupBy(scenarioSyncV.completeness),
        this.db
          .select({ label: scenarioSyncV.serviceMode, value: count() })
          .from(scenarioSyncV)
          .where(isNotNull(scenarioSyncV.serviceMode))
          .groupBy(scenarioSyncV.serviceMode),
        this.db.execute(sql`
          SELECT
            CASE
              WHEN ${scenarioSyncV.priority} IS NULL OR LENGTH(TRIM(${scenarioSyncV.priority})) = 0 THEN '未标注'
              ELSE TRIM(${scenarioSyncV.priority})
            END AS label,
            count(*)::int AS value
          FROM ${scenarioSyncV}
          GROUP BY label
          ORDER BY label
        `),
        this.db.select({ value: count() }).from(scenarioSyncV),
      ]);

    const totalScenarios = totalRaw[0]?.value ?? 0;
    const pct = (v: number): number =>
      totalScenarios > 0 ? Math.round((v / totalScenarios) * 100) : 0;

    const priorityRows = Array.isArray(byPriorityRaw)
      ? byPriorityRaw
      : (byPriorityRaw as { rows: { label: string; value: number }[] }).rows;

    // 固定顺序：非"未标注"按字母序，"未标注"放最后
    const labeled: CompletenessItem[] = [];
    let unlabeled: CompletenessItem | null = null;
    priorityRows.forEach((r: { label: string; value: number }) => {
      const v = Number(r.value);
      if (r.label === '未标注') {
        unlabeled = { label: '未标注', value: v, percent: pct(v) };
      } else {
        labeled.push({ label: r.label, value: v, percent: pct(v) });
      }
    });
    labeled.sort((a, b) => a.label.localeCompare(b.label));
    const byPriority = [...labeled];
    if (unlabeled) byPriority.push(unlabeled);

    return {
      byStatus: byStatusRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
      byCompleteness: byCompletenessRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
      byServiceMode: byServiceModeRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
      byPriority,
    };
  }

  private async getCaseInsights(): Promise<CaseInsights> {
    const [
      byMaturityRows,
      byAuditStatusRows,
      byExternalLevelRows,
      byDomainRaw,
      byValueLevelRaw,
      avgCommercialResult,
      avgEvalResult,
      totalRaw,
    ] = await Promise.all([
      this.db
        .select({ label: caseItemSyncV.maturity, value: count() })
        .from(caseItemSyncV)
        .where(isNotNull(caseItemSyncV.maturity))
        .groupBy(caseItemSyncV.maturity),
      this.db
        .select({ label: caseItemSyncV.auditStatus, value: count() })
        .from(caseItemSyncV)
        .where(isNotNull(caseItemSyncV.auditStatus))
        .groupBy(caseItemSyncV.auditStatus),
      this.db
        .select({ label: caseItemSyncV.externalLevel, value: count() })
        .from(caseItemSyncV)
        .where(isNotNull(caseItemSyncV.externalLevel))
        .groupBy(caseItemSyncV.externalLevel),
      this.db.execute(sql`
        SELECT
          CASE
            WHEN ${caseItemSyncV.domainL1} IS NULL OR LENGTH(TRIM(${caseItemSyncV.domainL1})) = 0 THEN '未标注'
            ELSE TRIM(${caseItemSyncV.domainL1})
          END AS label,
          count(*)::int AS value
        FROM ${caseItemSyncV}
        GROUP BY label
        ORDER BY label
      `),
      this.db.execute(sql`
        SELECT LEFT(${caseItemSyncV.valueLevel}, 1) AS label, count(*)::int AS value
        FROM ${caseItemSyncV}
        WHERE ${caseItemSyncV.valueLevel} IS NOT NULL
        GROUP BY LEFT(${caseItemSyncV.valueLevel}, 1)
      `),
      this.db.select({ value: avg(caseItemSyncV.commercialScore) }).from(caseItemSyncV),
      this.db.select({ value: avg(caseItemSyncV.evalScore) }).from(caseItemSyncV),
      this.db.select({ value: count() }).from(caseItemSyncV),
    ]);

    const totalCases = totalRaw[0]?.value ?? 0;
    const pct = (v: number): number =>
      totalCases > 0 ? Math.round((v / totalCases) * 100) : 0;

    const parseAvg = (val: string | number | null | undefined): number => {
      if (val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return Math.round(num);
    };

    const domainRows = Array.isArray(byDomainRaw)
      ? byDomainRaw
      : (byDomainRaw as { rows: { label: string; value: number }[] }).rows;

    const labeledDomains: DomainDistributionItem[] = [];
    let unlabeledDomain: DomainDistributionItem | null = null;
    domainRows.forEach((r: { label: string; value: number }) => {
      const v = Number(r.value);
      if (r.label === '未标注') {
        unlabeledDomain = { label: '未标注', value: v, percent: pct(v) };
      } else {
        labeledDomains.push({ label: r.label, value: v, percent: pct(v) });
      }
    });
    labeledDomains.sort((a, b) => a.label.localeCompare(b.label));
    const byDomain = [...labeledDomains];
    if (unlabeledDomain) byDomain.push(unlabeledDomain);

    return {
      byMaturity: byMaturityRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
      byAuditStatus: byAuditStatusRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
      byExternalLevel: byExternalLevelRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
      byDomain,
      byValueLevel: (Array.isArray(byValueLevelRaw)
        ? byValueLevelRaw
        : (byValueLevelRaw as { rows: { label: string; value: number }[] }).rows
      )
        .filter((r: { label: string; value: number }) => r.label !== null && r.label.length > 0)
        .map((r: { label: string; value: number }) => ({ label: r.label, value: Number(r.value) })),
      avgCommercialScore: parseAvg(avgCommercialResult[0]?.value),
      avgEvalScore: parseAvg(avgEvalResult[0]?.value),
    };
  }

  private async getStepInsights(): Promise<StepInsights> {
    const [avgAiResult, avgHumanResult, avgCollabResult, byTaskTypeRows] =
      await Promise.all([
        this.db.select({ value: avg(stepSyncV.aiRatio) }).from(stepSyncV),
        this.db.select({ value: avg(stepSyncV.humanRatio) }).from(stepSyncV),
        this.db.select({ value: avg(stepSyncV.collabRatio) }).from(stepSyncV),
        this.db
          .select({ label: stepSyncV.taskType, value: count() })
          .from(stepSyncV)
          .where(isNotNull(stepSyncV.taskType))
          .groupBy(stepSyncV.taskType),
      ]);

    const parseAvg = (val: string | number | null | undefined): number => {
      if (val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return Math.round(num);
    };

    return {
      totalAiRatio: parseAvg(avgAiResult[0]?.value),
      totalHumanRatio: parseAvg(avgHumanResult[0]?.value),
      totalCollabRatio: parseAvg(avgCollabResult[0]?.value),
      byTaskType: byTaskTypeRows
        .filter((r): r is { label: string; value: number } => r.label !== null)
        .map((r) => ({ label: r.label, value: r.value })),
    };
  }

  private async getGovernanceMetrics(): Promise<GovernanceMetrics> {
    const [
      roleWithDescResult,
      roleTotalResult,
      scenarioWithDetailResult,
      scenarioTotalResult,
      stepWithActionResult,
      stepTotalResult,
      skillWithDescResult,
      skillTotalResult,
      materialWithUrlResult,
      materialTotalResult,
    ] = await Promise.all([
      this.db.select({ value: count() }).from(roleSyncV).where(isNotNull(roleSyncV.description)),
      this.db.select({ value: count() }).from(roleSyncV),
      this.db.select({ value: count() }).from(scenarioSyncV).where(isNotNull(scenarioSyncV.detail)),
      this.db.select({ value: count() }).from(scenarioSyncV),
      this.db.select({ value: count() }).from(stepSyncV).where(isNotNull(stepSyncV.action)),
      this.db.select({ value: count() }).from(stepSyncV),
      this.db.select({ value: count() }).from(skillSyncV).where(isNotNull(skillSyncV.description)),
      this.db.select({ value: count() }).from(skillSyncV),
      this.db.select({ value: count() }).from(materialSyncV).where(isNotNull(materialSyncV.url)),
      this.db.select({ value: count() }).from(materialSyncV),
    ]);

    const calcCoverage = (withField: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((withField / total) * 100);
    };

    return {
      roleCoverage: calcCoverage(
        roleWithDescResult[0]?.value ?? 0,
        roleTotalResult[0]?.value ?? 0,
      ),
      scenarioCoverage: calcCoverage(
        scenarioWithDetailResult[0]?.value ?? 0,
        scenarioTotalResult[0]?.value ?? 0,
      ),
      stepCoverage: calcCoverage(
        stepWithActionResult[0]?.value ?? 0,
        stepTotalResult[0]?.value ?? 0,
      ),
      skillCoverage: calcCoverage(
        skillWithDescResult[0]?.value ?? 0,
        skillTotalResult[0]?.value ?? 0,
      ),
      materialCoverage: calcCoverage(
        materialWithUrlResult[0]?.value ?? 0,
        materialTotalResult[0]?.value ?? 0,
      ),
    };
  }

  private async getTopIndustries(): Promise<IndustryDistributionItem[]> {
    const result = await this.db.execute(sql`
      SELECT
        i.id,
        i.name,
        COALESCE(rc.role_count, 0)::int AS role_count,
        COALESCE(sc.scenario_count, 0)::int AS scenario_count,
        COALESCE(stc.step_count, 0)::int AS step_count
      FROM ${industrySyncV} i
      LEFT JOIN (
        SELECT industry_id, count(*) AS role_count
        FROM ${industryRoleSyncV}
        GROUP BY industry_id
      ) rc ON rc.industry_id = i.id
      LEFT JOIN (
        SELECT ir.industry_id, count(DISTINCT rs.scenario_id)::int AS scenario_count
        FROM ${industryRoleSyncV} ir
        JOIN ${roleScenarioSyncV} rs ON rs.role_id = ir.role_id
        GROUP BY ir.industry_id
      ) sc ON sc.industry_id = i.id
      LEFT JOIN (
        SELECT ir.industry_id, count(DISTINCT ss.step_id)::int AS step_count
        FROM ${industryRoleSyncV} ir
        JOIN ${roleScenarioSyncV} rs ON rs.role_id = ir.role_id
        JOIN ${scenarioStepSyncV} ss ON ss.scenario_id = rs.scenario_id
        GROUP BY ir.industry_id
      ) stc ON stc.industry_id = i.id
       ORDER BY COALESCE(rc.role_count, 0) DESC
       LIMIT 15
     `);
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows;

    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name),
      roleCount: Number(row.role_count ?? 0),
      scenarioCount: Number(row.scenario_count ?? 0),
      stepCount: Number(row.step_count ?? 0),
    }));
  }

  // 1. TopRoleItem 新增 industries 字段（关联行业名数组，去重，字母序）
  private async getTopRoles(): Promise<TopRoleItem[]> {
    const result = await this.db.execute(sql`
      SELECT
        r.id,
        r.name,
        COALESCE(sc.scenario_count, 0)::int AS scenario_count,
        COALESCE(stc.step_count, 0)::int AS step_count,
        COALESCE(
          (
            SELECT array_agg(i.name ORDER BY i.name)
            FROM (
              SELECT DISTINCT ind.name
              FROM ${industryRoleSyncV} ir2
              JOIN ${industrySyncV} ind ON ind.id = ir2.industry_id
              WHERE ir2.role_id = r.id
            ) i
          ),
          ARRAY[]::varchar[]
        ) AS industries
      FROM ${roleSyncV} r
      LEFT JOIN (
        SELECT role_id, count(*) AS scenario_count
        FROM ${roleScenarioSyncV}
        GROUP BY role_id
      ) sc ON sc.role_id = r.id
      LEFT JOIN (
        SELECT rs.role_id, count(DISTINCT ss.step_id)::int AS step_count
        FROM ${roleScenarioSyncV} rs
        JOIN ${scenarioStepSyncV} ss ON ss.scenario_id = rs.scenario_id
        GROUP BY rs.role_id
      ) stc ON stc.role_id = r.id
      ORDER BY COALESCE(sc.scenario_count, 0) DESC, r.name ASC
      LIMIT 15
    `);
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows;

    return rows.map((row: Record<string, unknown>) => {
      const indRaw = row.industries as string[] | null | undefined;
      const industries: string[] = Array.isArray(indRaw)
        ? [...new Set(indRaw.filter((x: string) => x && x.trim().length > 0))].sort()
        : [];
      return {
        id: String(row.id),
        name: String(row.name),
        industries,
        scenarioCount: Number(row.scenario_count ?? 0),
        stepCount: Number(row.step_count ?? 0),
      };
    });
  }

  private async getM34Metrics(): Promise<{
    m34Total: number;
    m34QuantUnpassed: number;
    m34QuantPassed: number;
  }> {
    const result = await this.db.execute(sql`
      SELECT
        count(*)::int AS m34_total,
        count(*) FILTER (
          WHERE (
            lower(trim(COALESCE(has_quant_result, ''))) IN (
              '是', '有', '有量化成果', '已量化', '已验证',
              'yes', 'true', '1', 'y'
            )
            OR commercial_score IS NOT NULL
            OR eval_score IS NOT NULL
          )
          AND lower(trim(COALESCE(audit_status, ''))) IN (
            '通过', '审核通过', '已通过', 'pass', 'passed', 'approved'
          )
        )::int AS m34_quant_passed,
        count(*) FILTER (
          WHERE (
            lower(trim(COALESCE(has_quant_result, ''))) IN (
              '是', '有', '有量化成果', '已量化', '已验证',
              'yes', 'true', '1', 'y'
            )
            OR commercial_score IS NOT NULL
            OR eval_score IS NOT NULL
          )
          AND lower(trim(COALESCE(audit_status, ''))) NOT IN (
            '通过', '审核通过', '已通过', 'pass', 'passed', 'approved'
          )
        )::int AS m34_quant_unpassed
      FROM ${caseItemSyncV}
      WHERE maturity IN ('M3', 'M4')
    `);
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows;
    const row = rows[0];
    return {
      m34Total: Number(row?.m34_total ?? 0),
      m34QuantUnpassed: Number(row?.m34_quant_unpassed ?? 0),
      m34QuantPassed: Number(row?.m34_quant_passed ?? 0),
    };
  }

  private async getOrphanCount(): Promise<number> {
    const result = await this.db.execute(sql`
      SELECT count(*)::int AS cnt
      FROM ${scenarioSyncV} s
      WHERE NOT EXISTS (
        SELECT 1 FROM ${roleScenarioSyncV} rs
        WHERE rs.scenario_id = s.id
      )
    `);
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows;
    return Number(rows[0]?.cnt ?? 0);
  }

  async getOrphanScenarios(params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }): Promise<PaginatedResponse<OrphanScenarioItem>> {
    const { page, pageSize, keyword } = params;
    const offset = (page - 1) * pageSize;
    const kw = keyword?.trim() ?? '';

    const whereClause = kw
      ? sql`WHERE NOT EXISTS (
          SELECT 1 FROM ${roleScenarioSyncV} rs
          WHERE rs.scenario_id = s.id
        )
        AND (s.name ILIKE ${'%' + kw + '%'} OR s.brief ILIKE ${'%' + kw + '%'})`
      : sql`WHERE NOT EXISTS (
          SELECT 1 FROM ${roleScenarioSyncV} rs
          WHERE rs.scenario_id = s.id
        )`;

    const [countResult, dataResult] = await Promise.all([
      this.db.execute(sql`
        SELECT count(*)::int AS cnt
        FROM ${scenarioSyncV} s
        ${whereClause}
      `),
      this.db.execute(sql`
        SELECT s.id, s.name, s.brief
        FROM ${scenarioSyncV} s
        ${whereClause}
        ORDER BY s.name ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `),
    ]);

    const countRows = Array.isArray(countResult)
      ? countResult
      : (countResult as { rows: Record<string, unknown>[] }).rows;
    const total = Number(countRows[0]?.cnt ?? 0);

    const dataRows = Array.isArray(dataResult)
      ? dataResult
      : (dataResult as { rows: Record<string, unknown>[] }).rows;
    const items: OrphanScenarioItem[] = dataRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name),
      brief: row.brief ? String(row.brief) : null,
    }));

    return { items, total, page, pageSize };
  }

  // ─── 治理看板 ────────────────────────────────────────────────
  async getGovernanceData(): Promise<GovernanceData> {
    const [
      roleScaleByFunction,
      scenarioScaleByIndustry,
      maturityStack,
      dataCompletenessStack,
      funnel,
      fieldCoverage,
      skillCompleteness,
      signals,
      totalIndustriesResult,
      totalRolesResult,
      totalScenariosResult,
      totalStepsResult,
      totalSkillsResult,
      totalMaterialsResult,
      totalCasesResult,
      totalCustomersResult,
      totalFunctionsResult,
      totalMcpResult,
    ] = await Promise.all([
      this.getRoleScaleByFunction(),
      this.getScenarioScaleByIndustry(),
      this.getMaturityStack(),
      this.getDataCompletenessStack(),
      this.getFunnel(),
      this.getFieldCoverage(),
      this.getSkillCompleteness(),
      this.getSignals(),
      this.db.select({ value: count() }).from(industrySyncV),
      this.db.select({ value: count() }).from(roleSyncV),
      this.db.select({ value: count() }).from(scenarioSyncV),
      this.db.select({ value: count() }).from(stepSyncV),
      this.db.select({ value: count() }).from(skillSyncV),
      this.db.select({ value: count() }).from(materialSyncV),
      this.db.select({ value: count() }).from(caseItemSyncV),
      this.db.select({ value: count() }).from(customerSyncV),
      this.db.select({ value: count() }).from(jobFunctionSyncV),
      this.db.select({ value: count() }).from(mcp05Table),
    ]);

    const num = (r: { value: string | number | null }[]): number => {
      const v = r[0]?.value;
      if (v === null || v === undefined) return 0;
      return typeof v === 'string' ? parseInt(v, 10) : v;
    };

    return {
      roleScaleByFunction,
      scenarioScaleByIndustry,
      maturityStack,
      dataCompletenessStack,
      funnel,
      fieldCoverage,
      skillCompleteness,
      signals,
      totalMaterials: num(totalMaterialsResult),
      totalCustomers: num(totalCustomersResult),
      totalCases: num(totalCasesResult),
      totalRoles: num(totalRolesResult),
      totalIndustries: num(totalIndustriesResult),
      totalScenarios: num(totalScenariosResult),
      totalSteps: num(totalStepsResult),
      totalSkills: num(totalSkillsResult),
      totalFunctions: num(totalFunctionsResult),
      totalMcp: num(totalMcpResult),
    };
  }

  // 1. 岗位资产规模（按职能分）
  private async getRoleScaleByFunction(): Promise<GovernanceScaleBar[]> {
    const rows = await this.db
      .select({
        id: jobFunctionSyncV.id,
        name: jobFunctionSyncV.name,
        count: sql<number>`count(${roleSyncV.id})::int`,
      })
      .from(jobFunctionSyncV)
      .leftJoin(roleFunctionSyncV, eq(roleFunctionSyncV.functionId, jobFunctionSyncV.id))
      .leftJoin(roleSyncV, eq(roleSyncV.id, roleFunctionSyncV.roleId))
      .groupBy(jobFunctionSyncV.id, jobFunctionSyncV.name)
      .orderBy(desc(sql`count(${roleSyncV.id})::int`))
      .limit(9);

    const total = rows.reduce((s: number, r) => s + (r.count ?? 0), 0);
    return rows.map((r) => ({
      label: r.name,
      value: r.count ?? 0,
      percent: total > 0 ? Math.round(((r.count ?? 0) / total) * 100) : 0,
    }));
  }

  // 2. 场景资产规模（按行业 Top10）
  private async getScenarioScaleByIndustry(): Promise<GovernanceScaleBar[]> {
    const rows = await this.db
      .select({
        id: industrySyncV.id,
        name: industrySyncV.name,
        count: sql<number>`count(DISTINCT ${roleScenarioSyncV.scenarioId})::int`,
      })
      .from(industrySyncV)
      .leftJoin(industryRoleSyncV, eq(industryRoleSyncV.industryId, industrySyncV.id))
      .leftJoin(roleScenarioSyncV, eq(roleScenarioSyncV.roleId, industryRoleSyncV.roleId))
      .groupBy(industrySyncV.id, industrySyncV.name)
      .orderBy(desc(sql`count(DISTINCT ${roleScenarioSyncV.scenarioId})::int`))
      .limit(10);

    const max = Math.max(...rows.map((r) => r.count ?? 0), 1);
    return rows.map((r) => ({
      label: r.name,
      value: r.count ?? 0,
      percent: Math.round(((r.count ?? 0) / max) * 100),
    }));
  }

  // 3. 成熟度堆叠条（含"未标注"）
  private async getMaturityStack(): Promise<GovernanceStackItem[]> {
    const round1 = (n: number): number => Math.round(n * 10) / 10;
    const result = await this.db.execute(sql`
      SELECT
        CASE
          WHEN ${caseItemSyncV.maturity} IS NULL OR LENGTH(TRIM(${caseItemSyncV.maturity})) = 0 THEN '未标注'
          ELSE TRIM(${caseItemSyncV.maturity})
        END AS label,
        count(*)::int AS value
      FROM ${caseItemSyncV}
      GROUP BY label
    `);
    const totalResult = await this.db.select({ value: count() }).from(caseItemSyncV);
    const total = totalResult[0]?.value ?? 0;
    const rows = Array.isArray(result) ? result : (result as { rows: { label: string; value: number }[] }).rows;

    const order = ['M1', 'M2', 'M3', 'M4', '未标注'];
    const map = new Map<string, number>();
    rows.forEach((r: { label: string; value: number }) => {
      map.set(r.label, Number(r.value));
    });
    return order.map((label) => {
      const v = map.get(label) ?? 0;
      return {
        label,
        value: v,
        percent: total > 0 ? round1((v / total) * 100) : 0,
      };
    });
  }

  // 4. 数据完整度堆叠条（替代原 valueLevelStack，读取 completeness 字段）
  private async getDataCompletenessStack(): Promise<GovernanceStackItem[]> {
    const round1 = (n: number): number => Math.round(n * 10) / 10;
    const result = await this.db.execute(sql`
      SELECT
        CASE
          WHEN ${caseItemSyncV.completeness} IS NULL OR LENGTH(TRIM(${caseItemSyncV.completeness})) = 0 THEN '未标注'
          ELSE TRIM(${caseItemSyncV.completeness})
        END AS label,
        count(*)::int AS value
      FROM ${caseItemSyncV}
      GROUP BY label
      ORDER BY label
    `);
    const totalResult = await this.db.select({ value: count() }).from(caseItemSyncV);
    const total = totalResult[0]?.value ?? 0;
    const rows = Array.isArray(result) ? result : (result as { rows: { label: string; value: number }[] }).rows;

    const map = new Map<string, number>();
    rows.forEach((r: { label: string; value: number }) => {
      map.set(r.label, Number(r.value));
    });

    const mk = (label: string, v: number): GovernanceStackItem => ({
      label,
      value: v,
      percent: total > 0 ? round1((v / total) * 100) : 0,
    });

    const knownOrder = ['L0', 'L1', 'L2', 'L3', 'L4'];
    const known: GovernanceStackItem[] = [];
    const others: GovernanceStackItem[] = [];
    for (const [label, value] of map.entries()) {
      if (label === '未标注') continue;
      if (knownOrder.includes(label)) {
        known.push(mk(label, value));
      } else {
        others.push(mk(label, value));
      }
    }
    known.sort((a, b) => a.label.localeCompare(b.label));
    others.sort((a, b) => a.label.localeCompare(b.label));
    const unlabeled = map.get('未标注');
    const resultArr: GovernanceStackItem[] = [...known, ...others];
    if (unlabeled !== undefined) {
      resultArr.push(mk('未标注', unlabeled));
    }
    return resultArr;
  }

  // 5. 可用性漏斗（5阶段，基于案例）
  private async getFunnel(): Promise<GovernanceFunnelStep[]> {
    const result = await this.db.execute(sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (
          WHERE lower(trim(COALESCE(${caseItemSyncV.auditStatus}, ''))) IN (
            '通过', '审核通过', '已通过', 'pass', 'passed', 'approved'
          )
        )::int AS passed,
        count(*) FILTER (
          WHERE (
            lower(trim(COALESCE(${caseItemSyncV.hasQuantResult}, ''))) IN (
              '是', '有', '有量化成果', '已量化', '已验证',
              'yes', 'true', '1', 'y'
            )
            OR ${caseItemSyncV.commercialScore} IS NOT NULL
            OR ${caseItemSyncV.evalScore} IS NOT NULL
          )
        )::int AS quant,
        count(*) FILTER (
          WHERE ${caseItemSyncV.maturity} IN ('M3', 'M4')
        )::int AS m34,
        count(*) FILTER (
          WHERE ${caseItemSyncV.maturity} IN ('M3', 'M4')
          AND (
            lower(trim(COALESCE(${caseItemSyncV.hasQuantResult}, ''))) IN (
              '是', '有', '有量化成果', '已量化', '已验证',
              'yes', 'true', '1', 'y'
            )
            OR ${caseItemSyncV.commercialScore} IS NOT NULL
            OR ${caseItemSyncV.evalScore} IS NOT NULL
          )
          AND lower(trim(COALESCE(${caseItemSyncV.auditStatus}, ''))) IN (
            '通过', '审核通过', '已通过', 'pass', 'passed', 'approved'
          )
        )::int AS m34_quant_passed
      FROM ${caseItemSyncV}
    `);
    const rows = Array.isArray(result) ? result : (result as { rows: Record<string, unknown>[] }).rows;
    const row = rows[0];
    const total = Number(row?.total ?? 0);
    const passed = Number(row?.passed ?? 0);
    const quant = Number(row?.quant ?? 0);
    const m34 = Number(row?.m34 ?? 0);
    const m34QuantPassed = Number(row?.m34_quant_passed ?? 0);

    const ratio = (v: number): number =>
      total > 0 ? Math.round((v / total) * 100) : 0;

    return [
      { label: '全部案例', value: total, ratio: 100 },
      { label: '审核通过', value: passed, ratio: ratio(passed) },
      { label: '有量化成果', value: quant, ratio: ratio(quant) },
      { label: '成熟度 M3/M4', value: m34, ratio: ratio(m34) },
      { label: 'M3/M4+量化+通过', value: m34QuantPassed, ratio: ratio(m34QuantPassed) },
    ];
  }

  // 6. 关键字段覆盖率（10项，分两组）
  private async getFieldCoverage(): Promise<GovernanceCoverageItem[]> {
    const statusOf = (pct: number): GovernanceStatus => {
      if (pct >= 80) return 'ok';
      if (pct >= 60) return 'good';
      if (pct >= 30) return 'warn';
      return 'empty';
    };
    const round1 = (n: number): number => Math.round(n * 10) / 10;

    const [
      // A 组
      scenarioTotalResult,
      stepTotalResult,
      materialTotalResult,
      caseTotalResult,
      customerTotalResult,
      // A1: 工作流来源证据 (business_scenario_workflow_03.source_evidence 字段 trim 后非空)
      scenarioEvidenceResult,
      // A2: 子步骤来源证据 (workflow_substep.source_evidence 字段 trim 后非空)
      stepEvidenceResult,
      // A3: 资料所属案例 (在 case_material_sync_v 中有记录的 material 数)
      materialWithCaseResult,
      // A4: 案例所属客户 (在 case_customer_sync_v 中有记录的 case 数)
      caseWithCustomerResult,
      // A5: 客户所属行业 (在 customer_industry_sync_v 中有记录的 customer 数)
      customerWithIndustryResult,
      // B 组
      // B1: 工作流关联 Skill (在 scenario_skill_sync_v 中有记录的 scenario 数)
      scenarioWithSkillResult,
      // B2: 工作流关联 MCP (暂不支持，固定 0)
      // B3: 案例关联岗位 (在 case_role_sync_v 中有记录的 case 数)
      caseWithRoleResult,
      // B4: 案例关联二级场景 (在 case_scenario_sync_v 中有记录的 case 数)
      caseWithScenarioResult,
      // B5: 子步骤评测三要素 (key_metrics 字段 trim 后非空)
      stepMetricsResult,
    ] = await Promise.all([
      // totals
      this.db.select({ value: count() }).from(scenarioSyncV),
      this.db.select({ value: count() }).from(stepSyncV),
      this.db.select({ value: count() }).from(materialSyncV),
      this.db.select({ value: count() }).from(caseItemSyncV),
      this.db.select({ value: count() }).from(customerSyncV),
      // A1
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM workspace_aadkwdupdgifs.business_scenario_workflow_03
        WHERE source_evidence IS NOT NULL
          AND LENGTH(TRIM(source_evidence)) > 0
      `),
      // A2
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM workspace_aadkwdupdgifs.workflow_substep
        WHERE source_evidence IS NOT NULL
          AND LENGTH(TRIM(source_evidence)) > 0
      `),
      // A3
      this.db.execute(sql`
        SELECT count(DISTINCT ${caseMaterialSyncV.materialId})::int AS value
        FROM ${caseMaterialSyncV}
      `),
      // A4
      this.db.execute(sql`
        SELECT count(DISTINCT ${caseCustomerSyncV.caseId})::int AS value
        FROM ${caseCustomerSyncV}
      `),
      // A5
      this.db.execute(sql`
        SELECT count(DISTINCT ${customerIndustrySyncV.customerId})::int AS value
        FROM ${customerIndustrySyncV}
      `),
      // B1
      this.db.execute(sql`
        SELECT count(DISTINCT ${scenarioSkillSyncV.scenarioId})::int AS value
        FROM ${scenarioSkillSyncV}
      `),
      // B3
      this.db.execute(sql`
        SELECT count(DISTINCT ${caseRoleSyncV.caseId})::int AS value
        FROM ${caseRoleSyncV}
      `),
      // B4
      this.db.execute(sql`
        SELECT count(DISTINCT ${caseScenarioSyncV.caseId})::int AS value
        FROM ${caseScenarioSyncV}
      `),
      // B5
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${stepSyncV}
        WHERE ${stepSyncV.keyMetrics} IS NOT NULL
          AND LENGTH(TRIM(${stepSyncV.keyMetrics})) > 0
      `),
    ]);

    const num = (r: unknown): number => {
      const arr = Array.isArray(r) ? r : (r as { rows: { value: number }[] }).rows;
      return Number(arr[0]?.value ?? 0);
    };

    const scenarioTotal = scenarioTotalResult[0]?.value ?? 0;
    const stepTotal = stepTotalResult[0]?.value ?? 0;
    const materialTotal = materialTotalResult[0]?.value ?? 0;
    const caseTotal = caseTotalResult[0]?.value ?? 0;
    const customerTotal = customerTotalResult[0]?.value ?? 0;

    const mkItem = (
      field: string,
      filled: number,
      total: number,
    ): GovernanceCoverageItem => {
      const pct = total > 0 ? round1((filled / total) * 100) : 0;
      return { field, filled, total, percent: pct, status: statusOf(pct) };
    };

    return [
      // A 组：证据与主体关系
      mkItem('工作流来源证据', num(scenarioEvidenceResult), scenarioTotal),
      mkItem('子步骤来源证据', num(stepEvidenceResult), stepTotal),
      mkItem('资料所属案例', num(materialWithCaseResult), materialTotal),
      mkItem('案例所属客户', num(caseWithCustomerResult), caseTotal),
      mkItem('客户所属行业', num(customerWithIndustryResult), customerTotal),
      // B 组：复用与评测关系
      mkItem('工作流关联Skill', num(scenarioWithSkillResult), scenarioTotal),
      mkItem('工作流关联MCP', 0, scenarioTotal),
      mkItem('案例关联岗位', num(caseWithRoleResult), caseTotal),
      mkItem('案例关联二级场景', num(caseWithScenarioResult), caseTotal),
      mkItem('子步骤评测三要素', num(stepMetricsResult), stepTotal),
    ];
  }

  // 7. Skill 资产完整度（8项）
  private async getSkillCompleteness(): Promise<GovernanceSkillCompleteness[]> {
    const totalResult = await this.db.select({ value: count() }).from(skillSyncV);
    const total = totalResult[0]?.value ?? 0;
    const round1 = (n: number): number => Math.round(n * 10) / 10;
    const pct = (n: number): number => (total > 0 ? round1((n / total) * 100) : 0);

    const [
      descResult,
      tioResult, // trigger + input + output 三者都有
      criteriaResult,
      skillMdResult,
      refDocsResult,
      packagesResult,
      scriptsResult,
      versionResult,
    ] = await Promise.all([
      // 1. 技能描述
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.description} IS NOT NULL
          AND LENGTH(TRIM(${skillSyncV.description})) > 0
      `),
      // 2. 触发/输入/输出 三者都有
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.trigger} IS NOT NULL AND LENGTH(TRIM(${skillSyncV.trigger})) > 0
          AND ${skillSyncV.input} IS NOT NULL AND LENGTH(TRIM(${skillSyncV.input})) > 0
          AND ${skillSyncV.output} IS NOT NULL AND LENGTH(TRIM(${skillSyncV.output})) > 0
      `),
      // 3. 判断标准
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.criteria} IS NOT NULL
          AND LENGTH(TRIM(${skillSyncV.criteria})) > 0
      `),
      // 4. SKILL.md
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.skillMd} IS NOT NULL
          AND LENGTH(TRIM(${skillSyncV.skillMd})) > 0
      `),
      // 5. references
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.referenceDocs} IS NOT NULL
          AND LENGTH(TRIM(${skillSyncV.referenceDocs})) > 0
      `),
      // 6. 安装包 (packages jsonb 数组非空且长度 > 0)
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.packages} IS NOT NULL
          AND jsonb_array_length(${skillSyncV.packages}) > 0
      `),
      // 7. scripts
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.scripts} IS NOT NULL
          AND LENGTH(TRIM(${skillSyncV.scripts})) > 0
      `),
      // 8. 版本号
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${skillSyncV}
        WHERE ${skillSyncV.version} IS NOT NULL
          AND LENGTH(TRIM(${skillSyncV.version})) > 0
      `),
    ]);

    const num = (r: unknown): number => {
      const arr = Array.isArray(r) ? r : (r as { rows: { value: number }[] }).rows;
      return Number(arr[0]?.value ?? 0);
    };

    return [
      { field: '技能描述', filled: num(descResult), total, percent: pct(num(descResult)) },
      { field: '触发/输入/输出', filled: num(tioResult), total, percent: pct(num(tioResult)) },
      { field: '判断标准', filled: num(criteriaResult), total, percent: pct(num(criteriaResult)) },
      { field: 'SKILL.md', filled: num(skillMdResult), total, percent: pct(num(skillMdResult)) },
      { field: 'references', filled: num(refDocsResult), total, percent: pct(num(refDocsResult)) },
      { field: '安装包', filled: num(packagesResult), total, percent: pct(num(packagesResult)) },
      { field: 'scripts', filled: num(scriptsResult), total, percent: pct(num(scriptsResult)) },
      { field: '版本号', filled: num(versionResult), total, percent: pct(num(versionResult)) },
    ];
  }

  // 8. 治理信号（4张卡：重复项、关系缺失、高价值待处理、未挂载场景）
  private async getSignals(): Promise<GovernanceSignal[]> {
    const [
      // 信号1：同名案例（按 dept_name 分组）
      dupCaseResult,
      // 信号1：同名资料
      dupMaterialResult,
      // 信号1：同名 Skill
      dupSkillResult,
      // 信号1：同名 MCP
      dupMcpResult,
      // 信号2：未关联职能的岗位
      roleNoFuncResult,
      // 信号2：未关联行业的客户
      customerNoIndustryResult,
      // 信号2：未关联岗位的案例
      caseNoRoleResult,
      // 信号2：未关联二级场景的案例
      caseNoScenarioResult,
      // 信号3：M3/M4 相关数据
      m34Result,
      // 信号4：未挂载场景
      orphanResult,
      scenarioTotalResult,
      roleTotalResult,
      customerTotalResult,
      caseTotalResult,
    ] = await Promise.all([
      // 同名案例：dept_name trim 后相同且非空，统计 组数 + 项数
      this.db.execute(sql`
        SELECT count(*)::int AS groups, sum(cnt)::int AS items
        FROM (
          SELECT TRIM(${caseItemSyncV.deptName}) AS nm, count(*) AS cnt
          FROM ${caseItemSyncV}
          WHERE ${caseItemSyncV.deptName} IS NOT NULL
            AND LENGTH(TRIM(${caseItemSyncV.deptName})) > 0
          GROUP BY TRIM(${caseItemSyncV.deptName})
          HAVING count(*) > 1
        ) t
      `),
      // 同名资料
      this.db.execute(sql`
        SELECT count(*)::int AS groups, sum(cnt)::int AS items
        FROM (
          SELECT TRIM(${materialSyncV.name}) AS nm, count(*) AS cnt
          FROM ${materialSyncV}
          WHERE ${materialSyncV.name} IS NOT NULL
            AND LENGTH(TRIM(${materialSyncV.name})) > 0
          GROUP BY TRIM(${materialSyncV.name})
          HAVING count(*) > 1
        ) t
      `),
      // 同名 Skill
      this.db.execute(sql`
        SELECT count(*)::int AS groups, sum(cnt)::int AS items
        FROM (
          SELECT TRIM(${skillSyncV.name}) AS nm, count(*) AS cnt
          FROM ${skillSyncV}
          WHERE ${skillSyncV.name} IS NOT NULL
            AND LENGTH(TRIM(${skillSyncV.name})) > 0
          GROUP BY TRIM(${skillSyncV.name})
          HAVING count(*) > 1
        ) t
      `),
      // 同名 MCP
      this.db.execute(sql`
        SELECT count(*)::int AS groups, sum(cnt)::int AS items
        FROM (
          SELECT TRIM(${mcp05Table.mcpName}) AS nm, count(*) AS cnt
          FROM ${mcp05Table}
          WHERE ${mcp05Table.mcpName} IS NOT NULL
            AND LENGTH(TRIM(${mcp05Table.mcpName})) > 0
          GROUP BY TRIM(${mcp05Table.mcpName})
          HAVING count(*) > 1
        ) t
      `),
      // 未关联职能的岗位
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${roleSyncV} r
        WHERE NOT EXISTS (
          SELECT 1 FROM ${roleFunctionSyncV} rf WHERE rf.role_id = r.id
        )
      `),
      // 未关联行业的客户
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${customerSyncV} c
        WHERE NOT EXISTS (
          SELECT 1 FROM ${customerIndustrySyncV} ci WHERE ci.customer_id = c.id
        )
      `),
      // 未关联岗位的案例
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${caseItemSyncV} c
        WHERE NOT EXISTS (
          SELECT 1 FROM ${caseRoleSyncV} cr WHERE cr.case_id = c.id
        )
      `),
      // 未关联二级场景的案例
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${caseItemSyncV} c
        WHERE NOT EXISTS (
          SELECT 1 FROM ${caseScenarioSyncV} cs WHERE cs.case_id = c.id
        )
      `),
      // M3/M4 数据
      this.getM34Metrics(),
      // 未挂载场景数
      this.db.execute(sql`
        SELECT count(*)::int AS value
        FROM ${scenarioSyncV} s
        WHERE NOT EXISTS (
          SELECT 1 FROM ${roleScenarioSyncV} rs WHERE rs.scenario_id = s.id
        )
      `),
      // 场景总数
      this.db.select({ value: count() }).from(scenarioSyncV),
      // 岗位总数
      this.db.select({ value: count() }).from(roleSyncV),
      // 客户总数
      this.db.select({ value: count() }).from(customerSyncV),
      // 案例总数
      this.db.select({ value: count() }).from(caseItemSyncV),
    ]);

    const rowVal = (r: unknown): number => {
      const arr = Array.isArray(r) ? r : (r as { rows: { value: number }[] }).rows;
      return Number(arr[0]?.value ?? 0);
    };

    const dupRow = (r: unknown): { groups: number; items: number } => {
      const arr = Array.isArray(r) ? r : (r as { rows: { groups: number; items: number }[] }).rows;
      return {
        groups: Number(arr[0]?.groups ?? 0),
        items: Number(arr[0]?.items ?? 0),
      };
    };

    const dupCase = dupRow(dupCaseResult);
    const dupMaterial = dupRow(dupMaterialResult);
    const dupSkill = dupRow(dupSkillResult);
    const dupMcp = dupRow(dupMcpResult);

    const roleNoFunc = rowVal(roleNoFuncResult);
    const customerNoIndustry = rowVal(customerNoIndustryResult);
    const caseNoRole = rowVal(caseNoRoleResult);
    const caseNoScenario = rowVal(caseNoScenarioResult);

    const m34Metrics = m34Result as { m34Total: number; m34QuantUnpassed: number; m34QuantPassed: number };
    const orphanCount2 = rowVal(orphanResult);
    const scenarioTotal = scenarioTotalResult[0]?.value ?? 0;
    const totalRoles = roleTotalResult[0]?.value ?? 0;
    const totalCustomers = customerTotalResult[0]?.value ?? 0;
    const totalCases = caseTotalResult[0]?.value ?? 0;

    const pct = (v: number, t: number): number =>
      t > 0 ? Math.round((v / t) * 100) : 0;

    return [
      {
        title: '重复项需语义复核',
        description: '以下对象存在同名记录，需语义复核确认是否为重复项。',
        tone: 'warn',
        items: [
          { label: '同名案例', value: dupCase.items, percent: dupCase.groups },
          { label: '同名资料', value: dupMaterial.items, percent: dupMaterial.groups },
          { label: '同名 Skill', value: dupSkill.items, percent: dupSkill.groups },
          { label: '同名 MCP', value: dupMcp.items, percent: dupMcp.groups },
        ],
      },
      {
        title: '关系字段需补齐',
        description: '以下关系字段存在空缺，影响数据关联完整性。',
        tone: 'warn',
        items: [
          { label: '未关联职能的岗位', value: roleNoFunc, percent: pct(roleNoFunc, totalRoles) },
          { label: '未关联行业的客户', value: customerNoIndustry, percent: pct(customerNoIndustry, totalCustomers) },
          { label: '未关联岗位的案例', value: caseNoRole, percent: pct(caseNoRole, totalCases) },
          { label: '未关联二级场景的案例', value: caseNoScenario, percent: pct(caseNoScenario, totalCases) },
        ],
      },
      {
        title: '高价值待处理',
        description: 'M3/M4 成熟度且有量化成果但未审核通过的案例需优先处理。',
        tone: 'info',
        items: [
          { label: 'M3/M4 案例总数', value: m34Metrics.m34Total },
          { label: '有量化成果但未通过审核', value: m34Metrics.m34QuantUnpassed },
          { label: '有量化成果且已通过审核', value: m34Metrics.m34QuantPassed },
        ],
      },
      {
        title: '未挂载场景',
        description: '尚未关联到任何岗位的业务场景，可能存在岗位梳理缺口。',
        tone: 'info',
        items: [
          { label: '未挂载场景数', value: orphanCount2, percent: pct(orphanCount2, scenarioTotal) },
        ],
      },
    ];
  }

}
