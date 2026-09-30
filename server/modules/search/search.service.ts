import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { ilike, or, desc, sql, inArray, count } from 'drizzle-orm';
import {
  industrySyncV,
  roleSyncV,
  scenarioSyncV,
  stepSyncV,
  skillSyncV,
  caseItemSyncV,
  materialSyncV,
  customerSyncV,
  industryRoleSyncV,
  roleScenarioSyncV,
  scenarioStepSyncV,
} from '@server/database/sync-views';
import type {
  GlobalSearchResult,
  IndustrySummary,
  RoleSummary,
  ScenarioSummary,
  StepSummary,
  SkillSummary,
  CaseSummary,
  MaterialSummary,
  CustomerSummary,
} from '@shared/api.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async globalSearch(keyword: string, limit: number): Promise<GlobalSearchResult> {
    if (!keyword || keyword.trim().length === 0) {
      return {
        industries: [],
        roles: [],
        scenarios: [],
        steps: [],
        skills: [],
        cases: [],
        materials: [],
        customers: [],
      };
    }

    const pattern = `%${keyword.trim()}%`;

    const [
      industries,
      roles,
      scenarios,
      steps,
      skills,
      cases,
      materials,
      customers,
    ] = await Promise.all([
      this.searchIndustries(pattern, limit),
      this.searchRoles(pattern, limit),
      this.searchScenarios(pattern, limit),
      this.searchSteps(pattern, limit),
      this.searchSkills(pattern, limit),
      this.searchCases(pattern, limit),
      this.searchMaterials(pattern, limit),
      this.searchCustomers(pattern, limit),
    ]);

    return {
      industries,
      roles,
      scenarios,
      steps,
      skills,
      cases,
      materials,
      customers,
    };
  }

  private async searchIndustries(pattern: string, limit: number): Promise<IndustrySummary[]> {
    const rows = await this.db
      .select({
        id: industrySyncV.id,
        name: industrySyncV.name,
        category: industrySyncV.category,
        scope: industrySyncV.scope,
        roleCount: sql<number>`(
          SELECT count(*)::int
          FROM ${industryRoleSyncV} ir
          WHERE ir.industry_id = ${industrySyncV.id}
        )`,
        scenarioCount: sql<number>`(
          SELECT count(DISTINCT rs.scenario_id)::int
          FROM ${industryRoleSyncV} ir
          JOIN ${roleScenarioSyncV} rs ON rs.role_id = ir.role_id
          WHERE ir.industry_id = ${industrySyncV.id}
        )`,
        stepCount: sql<number>`(
          SELECT count(DISTINCT ss.step_id)::int
          FROM ${industryRoleSyncV} ir
          JOIN ${roleScenarioSyncV} rs ON rs.role_id = ir.role_id
          JOIN ${scenarioStepSyncV} ss ON ss.scenario_id = rs.scenario_id
          WHERE ir.industry_id = ${industrySyncV.id}
        )`,
      })
      .from(industrySyncV)
      .where(ilike(industrySyncV.name, pattern))
      .orderBy(desc(industrySyncV.name))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      scope: row.scope ?? '',
      roleCount: row.roleCount ?? 0,
      scenarioCount: row.scenarioCount ?? 0,
      stepCount: row.stepCount ?? 0,
    }));
  }

  private async searchRoles(pattern: string, limit: number): Promise<RoleSummary[]> {
    const rows = await this.db
      .select({
        id: roleSyncV.id,
        name: roleSyncV.name,
        priority: roleSyncV.priority,
        department: roleSyncV.department,
        description: roleSyncV.description,
      })
      .from(roleSyncV)
      .where(ilike(roleSyncV.name, pattern))
      .orderBy(desc(roleSyncV.name))
      .limit(limit);

    const roleIds = rows.map((r) => r.id);
    let scenarioCountMap = new Map<string, number>();
    if (roleIds.length > 0) {
      const scenarioCounts = await this.db
        .select({
          roleId: roleScenarioSyncV.roleId,
          count: count(),
        })
        .from(roleScenarioSyncV)
        .where(inArray(roleScenarioSyncV.roleId, roleIds))
        .groupBy(roleScenarioSyncV.roleId);
      scenarioCountMap = new Map(
        scenarioCounts.map((row) => [row.roleId, Number(row.count)]),
      );
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      priority: row.priority,
      department: row.department,
      description: row.description,
      scenarioCount: scenarioCountMap.get(row.id) ?? 0,
    }));
  }

  private async searchScenarios(pattern: string, limit: number): Promise<ScenarioSummary[]> {
    const rows = await this.db
      .select({
        id: scenarioSyncV.id,
        name: scenarioSyncV.name,
        brief: scenarioSyncV.brief,
        status: scenarioSyncV.status,
        completeness: scenarioSyncV.completeness,
        priority: scenarioSyncV.priority,
        serviceMode: scenarioSyncV.serviceMode,
      })
      .from(scenarioSyncV)
      .where(ilike(scenarioSyncV.name, pattern))
      .orderBy(desc(scenarioSyncV.name))
      .limit(limit);

    const scenarioIds = rows.map((s) => s.id);
    let stepCountMap = new Map<string, number>();
    if (scenarioIds.length > 0) {
      const stepCounts = await this.db
        .select({
          scenarioId: scenarioStepSyncV.scenarioId,
          count: count(),
        })
        .from(scenarioStepSyncV)
        .where(inArray(scenarioStepSyncV.scenarioId, scenarioIds))
        .groupBy(scenarioStepSyncV.scenarioId);
      stepCountMap = new Map(
        stepCounts.map((row) => [row.scenarioId, Number(row.count)]),
      );
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      brief: row.brief,
      status: row.status,
      completeness: row.completeness,
      priority: row.priority,
      serviceMode: row.serviceMode,
      stepCount: stepCountMap.get(row.id) ?? 0,
    }));
  }

  private async searchSteps(pattern: string, limit: number): Promise<StepSummary[]> {
    const rows = await this.db
      .select({
        id: stepSyncV.id,
        orderNum: stepSyncV.orderNum,
        name: stepSyncV.name,
        taskType: stepSyncV.taskType,
        isHiddenWork: stepSyncV.isHiddenWork,
        aiRatio: stepSyncV.aiRatio,
        humanRatio: stepSyncV.humanRatio,
        collabRatio: stepSyncV.collabRatio,
      })
      .from(stepSyncV)
      .where(ilike(stepSyncV.name, pattern))
      .orderBy(desc(stepSyncV.name))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      orderNum: row.orderNum,
      name: row.name,
      taskType: row.taskType,
      isHiddenWork: row.isHiddenWork,
      aiRatio: row.aiRatio,
      humanRatio: row.humanRatio,
      collabRatio: row.collabRatio,
    }));
  }

  private async searchSkills(pattern: string, limit: number): Promise<SkillSummary[]> {
    const rows = await this.db
      .select({
        id: skillSyncV.id,
        name: skillSyncV.name,
        description: skillSyncV.description,
        version: skillSyncV.version,
        trigger: skillSyncV.trigger,
      })
      .from(skillSyncV)
      .where(ilike(skillSyncV.name, pattern))
      .orderBy(desc(skillSyncV.name))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      trigger: row.trigger,
    }));
  }

  private async searchCases(pattern: string, limit: number): Promise<CaseSummary[]> {
    const rows = await this.db
      .select({
        id: caseItemSyncV.id,
        deptName: caseItemSyncV.deptName,
        completeness: caseItemSyncV.completeness,
        complexity: caseItemSyncV.complexity,
        commercialScore: caseItemSyncV.commercialScore,
        info: caseItemSyncV.info,
        hasQuantResult: caseItemSyncV.hasQuantResult,
        externalLevel: caseItemSyncV.externalLevel,
        domainL1: caseItemSyncV.domainL1,
        maturity: caseItemSyncV.maturity,
        auditStatus: caseItemSyncV.auditStatus,
        recommendTag: caseItemSyncV.recommendTag,
        valueLevel: caseItemSyncV.valueLevel,
        caseDate: caseItemSyncV.caseDate,
        owners: caseItemSyncV.owners,
      })
      .from(caseItemSyncV)
      .where(
        or(
          ilike(caseItemSyncV.deptName, pattern),
          ilike(caseItemSyncV.info, pattern),
        ),
      )
      .orderBy(desc(caseItemSyncV.deptName))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      deptName: row.deptName,
      completeness: row.completeness,
      complexity: row.complexity,
      commercialScore: row.commercialScore,
      info: row.info,
      hasQuantResult: row.hasQuantResult,
      externalLevel: row.externalLevel,
      domainL1: row.domainL1,
      maturity: row.maturity,
      auditStatus: row.auditStatus,
      recommendTag: row.recommendTag,
      valueLevel: row.valueLevel,
      caseDate: row.caseDate ?? null,
      owners: row.owners as CaseSummary['owners'],
    }));
  }

  private async searchMaterials(pattern: string, limit: number): Promise<MaterialSummary[]> {
    const rows = await this.db
      .select({
        id: materialSyncV.id,
        name: materialSyncV.name,
        url: materialSyncV.url,
        updatedAt: materialSyncV.updatedAt,
      })
      .from(materialSyncV)
      .where(ilike(materialSyncV.name, pattern))
      .orderBy(desc(materialSyncV.name))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }));
  }

  private async searchCustomers(pattern: string, limit: number): Promise<CustomerSummary[]> {
    const rows = await this.db
      .select({
        id: customerSyncV.id,
        name: customerSyncV.name,
        cooperation: customerSyncV.cooperation,
        risk: customerSyncV.risk,
      })
      .from(customerSyncV)
      .where(ilike(customerSyncV.name, pattern))
      .orderBy(desc(customerSyncV.name))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      cooperation: row.cooperation,
      risk: row.risk,
    }));
  }
}
