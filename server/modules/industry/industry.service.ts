import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, ilike, asc, desc, and, or, inArray, count, gt, sql } from 'drizzle-orm';
import {
  industrySyncV,
  industryRoleSyncV,
  roleSyncV,
  customerIndustrySyncV,
  customerSyncV,
  caseIndustrySyncV,
  caseItemSyncV,
  roleScenarioSyncV,
  scenarioStepSyncV,
} from '@server/database/sync-views';
import type { IndustrySummary, IndustryDetail, RoleSummary, CustomerSummary, CaseSummary, PaginatedResponse } from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: string;
  hasRoles?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class IndustryService {
  private readonly logger = new Logger(IndustryService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<IndustrySummary>> {
    const { page, pageSize, keyword, category, hasRoles, sortBy = 'name', sortOrder = 'asc' } = params;

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          ilike(industrySyncV.name, `%${keyword}%`),
          ilike(industrySyncV.scope, `%${keyword}%`),
        ),
      );
    }
    if (category) {
      conditions.push(eq(industrySyncV.category, category));
    }
    if (hasRoles) {
      conditions.push(gt(industrySyncV.roleCount, 0));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = this.getSortColumn(sortBy);
    const orderFn = sortOrder === 'desc' ? desc : asc;

    const offset = (page - 1) * pageSize;

    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(industrySyncV).where(whereClause),
      this.db
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
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
        items: items.map((item): IndustrySummary => ({
         id: item.id,
         name: item.name,
         category: item.category,
         scope: item.scope,
         roleCount: item.roleCount ?? 0,
        scenarioCount: item.scenarioCount ?? 0,
        stepCount: item.stepCount ?? 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  private getSortColumn(sortBy: string) {
    switch (sortBy) {
      case 'role_count':
      case 'roleCount':
        return industrySyncV.roleCount;
      case 'scenario_count':
      case 'scenarioCount':
        return industrySyncV.scenarioCount;
      case 'name':
      default:
        return industrySyncV.name;
    }
  }

  async detail(id: string): Promise<IndustryDetail> {
    const base = await this.db
      .select({
        id: industrySyncV.id,
        name: industrySyncV.name,
        category: industrySyncV.category,
        scope: industrySyncV.scope,
        notes: industrySyncV.notes,
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
      .where(eq(industrySyncV.id, id))
      .limit(1);

    if (base.length === 0) {
      throw new NotFoundException('行业不存在');
    }

    const [roleRows, customerRows, caseRows] = await Promise.all([
      this.db
        .select({
          id: roleSyncV.id,
          name: roleSyncV.name,
          priority: roleSyncV.priority,
          department: roleSyncV.department,
          description: roleSyncV.description,
        })
        .from(industryRoleSyncV)
        .innerJoin(roleSyncV, eq(industryRoleSyncV.roleId, roleSyncV.id))
        .where(eq(industryRoleSyncV.industryId, id))
        .orderBy(asc(roleSyncV.name)),

      this.db
        .select({
          id: customerSyncV.id,
          name: customerSyncV.name,
          cooperation: customerSyncV.cooperation,
          risk: customerSyncV.risk,
        })
        .from(customerIndustrySyncV)
        .innerJoin(customerSyncV, eq(customerIndustrySyncV.customerId, customerSyncV.id))
        .where(eq(customerIndustrySyncV.industryId, id))
        .orderBy(asc(customerSyncV.name)),

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
        .from(caseIndustrySyncV)
        .innerJoin(caseItemSyncV, eq(caseIndustrySyncV.caseId, caseItemSyncV.id))
        .where(eq(caseIndustrySyncV.industryId, id))
        .orderBy(desc(caseItemSyncV.caseDate))
        .limit(20),
    ]);

    // Get scenario count for each role via role_scenario
    const roleIds = roleRows.map((r) => r.id);
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

    const roles: RoleSummary[] = roleRows.map((r): RoleSummary => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
      department: r.department,
      description: r.description,
      scenarioCount: scenarioCountMap.get(r.id) ?? 0,
    }));

    const customers: CustomerSummary[] = customerRows.map((c): CustomerSummary => ({
      id: c.id,
      name: c.name,
      cooperation: c.cooperation,
      risk: c.risk,
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

    const baseRow = base[0];
    return {
      id: baseRow.id,
      name: baseRow.name,
      category: baseRow.category,
      scope: baseRow.scope,
      notes: baseRow.notes,
      roleCount: baseRow.roleCount ?? 0,
      scenarioCount: baseRow.scenarioCount ?? 0,
      stepCount: baseRow.stepCount ?? 0,
      roles,
      customers,
      cases,
    };
  }
}
