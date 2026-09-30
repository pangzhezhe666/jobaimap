import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, ilike, asc, desc, and, inArray, count } from 'drizzle-orm';
import {
  roleSyncV,
  industryRoleSyncV,
  industrySyncV,
  roleFunctionSyncV,
  jobFunctionSyncV,
  roleScenarioSyncV,
  scenarioSyncV,
  scenarioStepSyncV,
  scenarioSkillSyncV,
  roleMaterialSyncV,
  materialSyncV,
  caseRoleSyncV,
  caseItemSyncV,
} from '@server/database/sync-views';
import type {
  RoleSummary,
  RoleDetail,
  IndustrySummary,
  JobFunctionSummary,
  ScenarioSummary,
  CaseSummary,
  MaterialSummary,
  PaginatedResponse,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  industryId?: string;
  functionId?: string;
}

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<RoleSummary>> {
    const { page, pageSize, keyword, sortBy = 'name', sortOrder = 'asc', industryId, functionId } = params;

    // Build base query with joins for filtering
    const baseFrom = this.db.selectDistinctOn([roleSyncV.id], {
      id: roleSyncV.id,
      name: roleSyncV.name,
      priority: roleSyncV.priority,
      department: roleSyncV.department,
      description: roleSyncV.description,
    }).from(roleSyncV);

    const joins: Array<{ table: any; on: any }> = [];
    const conditions = [];

    if (industryId) {
      joins.push({ table: industryRoleSyncV, on: eq(industryRoleSyncV.roleId, roleSyncV.id) });
      conditions.push(eq(industryRoleSyncV.industryId, industryId));
    }

    if (functionId) {
      joins.push({ table: roleFunctionSyncV, on: eq(roleFunctionSyncV.roleId, roleSyncV.id) });
      conditions.push(eq(roleFunctionSyncV.functionId, functionId));
    }

    if (keyword) {
      conditions.push(ilike(roleSyncV.name, `%${keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Apply joins
    let query = baseFrom as typeof baseFrom;
    for (const join of joins) {
      query = query.innerJoin(join.table, join.on) as typeof query;
    }

    const sortColumn = this.getSortColumn(sortBy);
    const orderFn = sortOrder === 'desc' ? desc : asc;
    const offset = (page - 1) * pageSize;

    // Count total matching roles
    const countPromise = (async (): Promise<number> => {
      let q;
      if (industryId && functionId) {
        const rows = await this.db
          .select({ count: count() })
          .from(roleSyncV)
          .innerJoin(industryRoleSyncV, eq(industryRoleSyncV.roleId, roleSyncV.id))
          .innerJoin(roleFunctionSyncV, eq(roleFunctionSyncV.roleId, roleSyncV.id))
          .where(whereClause);
        return Number(rows[0]?.count ?? 0);
      } else if (industryId) {
        const rows = await this.db
          .select({ count: count() })
          .from(roleSyncV)
          .innerJoin(industryRoleSyncV, eq(industryRoleSyncV.roleId, roleSyncV.id))
          .where(whereClause);
        return Number(rows[0]?.count ?? 0);
      } else if (functionId) {
        const rows = await this.db
          .select({ count: count() })
          .from(roleSyncV)
          .innerJoin(roleFunctionSyncV, eq(roleFunctionSyncV.roleId, roleSyncV.id))
          .where(whereClause);
        return Number(rows[0]?.count ?? 0);
      } else {
        const rows = await this.db
          .select({ count: count() })
          .from(roleSyncV)
          .where(whereClause);
        return Number(rows[0]?.count ?? 0);
      }
    })();

    const [total, items] = await Promise.all([
      countPromise,
      query
        .where(whereClause)
        .orderBy(asc(roleSyncV.id), orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
    ]);

    // Get scenario counts for each role
    const roleIds = items.map((item) => item.id);
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

    return {
      items: items.map((item): RoleSummary => ({
        id: item.id,
        name: item.name,
        priority: item.priority,
        department: item.department,
        description: item.description,
        scenarioCount: scenarioCountMap.get(item.id) ?? 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  private getSortColumn(sortBy: string) {
    switch (sortBy) {
      case 'department':
        return roleSyncV.department;
      case 'name':
      default:
        return roleSyncV.name;
    }
  }

  async detail(id: string): Promise<RoleDetail> {
    const base = await this.db
      .select({
        id: roleSyncV.id,
        name: roleSyncV.name,
        priority: roleSyncV.priority,
        department: roleSyncV.department,
        description: roleSyncV.description,
        scale: roleSyncV.scale,
        value: roleSyncV.value,
        scaleLever: roleSyncV.scaleLever,
        notes: roleSyncV.notes,
        managementSpan: roleSyncV.managementSpan,
      })
      .from(roleSyncV)
      .where(eq(roleSyncV.id, id))
      .limit(1);

    if (base.length === 0) {
      throw new NotFoundException('岗位不存在');
    }

    const [functionRows, industryRows, scenarioRows, stepCountRows, caseRows, materialRows, scenarioCountRows, skillCountRows] = await Promise.all([
      this.db
        .select({
          id: jobFunctionSyncV.id,
          name: jobFunctionSyncV.name,
        })
        .from(roleFunctionSyncV)
        .innerJoin(jobFunctionSyncV, eq(roleFunctionSyncV.functionId, jobFunctionSyncV.id))
        .where(eq(roleFunctionSyncV.roleId, id))
        .orderBy(asc(jobFunctionSyncV.name)),

      this.db
        .select({
          id: industrySyncV.id,
          name: industrySyncV.name,
          category: industrySyncV.category,
          scope: industrySyncV.scope,
          roleCount: industrySyncV.roleCount,
          scenarioCount: industrySyncV.scenarioCount,
          stepCount: industrySyncV.stepCount,
        })
        .from(industryRoleSyncV)
        .innerJoin(industrySyncV, eq(industryRoleSyncV.industryId, industrySyncV.id))
        .where(eq(industryRoleSyncV.roleId, id))
        .orderBy(asc(industrySyncV.name)),

      this.db
        .select({
          id: scenarioSyncV.id,
          name: scenarioSyncV.name,
          brief: scenarioSyncV.brief,
          status: scenarioSyncV.status,
          completeness: scenarioSyncV.completeness,
          priority: scenarioSyncV.priority,
          serviceMode: scenarioSyncV.serviceMode,
        })
        .from(roleScenarioSyncV)
        .innerJoin(scenarioSyncV, eq(roleScenarioSyncV.scenarioId, scenarioSyncV.id))
        .where(eq(roleScenarioSyncV.roleId, id))
        .orderBy(asc(scenarioSyncV.name)),

      this.db
        .select({
          scenarioId: scenarioStepSyncV.scenarioId,
          count: count(),
        })
        .from(roleScenarioSyncV)
        .innerJoin(scenarioStepSyncV, eq(scenarioStepSyncV.scenarioId, roleScenarioSyncV.scenarioId))
        .where(eq(roleScenarioSyncV.roleId, id))
        .groupBy(scenarioStepSyncV.scenarioId),

      this.db
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
        .from(caseRoleSyncV)
        .innerJoin(caseItemSyncV, eq(caseRoleSyncV.caseId, caseItemSyncV.id))
        .where(eq(caseRoleSyncV.roleId, id))
        .orderBy(desc(caseItemSyncV.caseDate))
        .limit(20),

      this.db
        .select({
          id: materialSyncV.id,
          name: materialSyncV.name,
          url: materialSyncV.url,
          updatedAt: materialSyncV.updatedAt,
        })
        .from(roleMaterialSyncV)
        .innerJoin(materialSyncV, eq(roleMaterialSyncV.materialId, materialSyncV.id))
        .where(eq(roleMaterialSyncV.roleId, id))
        .orderBy(asc(materialSyncV.name))
        .limit(20),

      this.db
        .select({ count: count() })
        .from(roleScenarioSyncV)
        .where(eq(roleScenarioSyncV.roleId, id)),

      this.db
        .select({ count: count() })
        .from(roleScenarioSyncV)
        .innerJoin(scenarioSkillSyncV, eq(scenarioSkillSyncV.scenarioId, roleScenarioSyncV.scenarioId))
        .where(eq(roleScenarioSyncV.roleId, id)),
    ]);

    const functions: JobFunctionSummary[] = functionRows.map((f): JobFunctionSummary => ({
      id: f.id,
      name: f.name,
    }));

    const industries: IndustrySummary[] = industryRows.map((i): IndustrySummary => ({
      id: i.id,
      name: i.name,
      category: i.category,
      scope: i.scope ?? '',
      roleCount: i.roleCount ?? 0,
      scenarioCount: i.scenarioCount ?? 0,
      stepCount: i.stepCount ?? 0,
    }));

    const stepCountMap = new Map<string, number>(
      stepCountRows.map((row) => [row.scenarioId, Number(row.count)]),
    );

    const scenarios: ScenarioSummary[] = scenarioRows.map((s): ScenarioSummary => ({
      id: s.id,
      name: s.name,
      brief: s.brief,
      status: s.status,
      completeness: s.completeness,
      priority: s.priority,
      serviceMode: s.serviceMode,
      stepCount: stepCountMap.get(s.id) ?? 0,
    }));

    const cases: CaseSummary[] = caseRows.map((c): CaseSummary => ({
      id: c.id,
      deptName: c.deptName,
      completeness: c.completeness,
      complexity: c.complexity,
      commercialScore: c.commercialScore,
      info: c.info,
      hasQuantResult: c.hasQuantResult,
      externalLevel: c.externalLevel,
      domainL1: c.domainL1,
      maturity: c.maturity,
      auditStatus: c.auditStatus,
      recommendTag: c.recommendTag,
      valueLevel: c.valueLevel,
      caseDate: c.caseDate ? c.caseDate : null,
      owners: c.owners as CaseSummary['owners'],
    }));

    const materials: MaterialSummary[] = materialRows.map((m): MaterialSummary => ({
      id: m.id,
      name: m.name,
      url: m.url,
      updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
    }));

    const scenarioCount = Number(scenarioCountRows[0]?.count ?? 0);
    const stepCount = stepCountRows.reduce((sum: number, row) => sum + Number(row.count), 0);
    const skillCount = Number(skillCountRows[0]?.count ?? 0);
    const baseRow = base[0];

    return {
      id: baseRow.id,
      name: baseRow.name,
      priority: baseRow.priority,
      department: baseRow.department,
      description: baseRow.description,
      scale: baseRow.scale,
      value: baseRow.value,
      scaleLever: baseRow.scaleLever,
      notes: baseRow.notes,
      managementSpan: baseRow.managementSpan,
      scenarioCount,
      stepCount,
      skillCount,
      functions,
      industries,
      scenarios,
      cases,
      materials,
    };
  }
}
