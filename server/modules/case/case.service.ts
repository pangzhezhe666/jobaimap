import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  count,
  eq,
  ilike,
  asc,
  desc,
  and,
  inArray,
  or,
} from 'drizzle-orm';
import {
  caseItemSyncV,
  customerSyncV,
  industrySyncV,
  roleSyncV,
  scenarioSyncV,
  materialSyncV,
  caseCustomerSyncV,
  caseIndustrySyncV,
  caseRoleSyncV,
  caseScenarioSyncV,
  caseMaterialSyncV,
} from '@server/database/sync-views';
import type {
  PaginatedResponse,
  CaseDetail,
  CaseSummary,
  CaseOwner,
  CustomerSummary,
  IndustrySummary,
  RoleSummary,
  ScenarioSummary,
  MaterialSummary,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  industryId?: string;
  roleId?: string;
}

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<CaseSummary>> {
    const { page, pageSize, keyword, sortBy, sortOrder, industryId, roleId } = params;
    const offset = (page - 1) * pageSize;

    const sortFn = sortOrder === 'desc' ? desc : asc;
    const sortDate = sortBy === 'caseDate' || sortBy === 'case_date';

    const keywordConditions = [];
    if (keyword) {
      keywordConditions.push(
        or(
          ilike(caseItemSyncV.deptName, `%${keyword}%`),
          ilike(caseItemSyncV.info, `%${keyword}%`),
        ),
      );
    }

    const needsFilter = Boolean(industryId || roleId);

    if (!needsFilter) {
      const whereClause = keywordConditions.length > 0 ? and(...keywordConditions) : undefined;
      const orderBy = sortDate ? sortFn(caseItemSyncV.caseDate) : sortFn(caseItemSyncV.deptName);

      const [items, totalResult] = await Promise.all([
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
          .from(caseItemSyncV)
          .where(whereClause)
          .orderBy(orderBy)
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(caseItemSyncV)
          .where(whereClause),
      ]);

      const summaryItems: CaseSummary[] = items.map((item) => ({
        ...item,
        caseDate: item.caseDate ?? null,
        owners: (item.owners as CaseOwner[] | null) ?? null,
      }));

      return {
        items: summaryItems,
        total: totalResult[0]?.total ?? 0,
        page,
        pageSize,
      };
    }

    // With industry / role filter: use separate query branches to avoid type issues
    const whereClause = keywordConditions.length > 0 ? and(...keywordConditions) : undefined;
    const orderCol = sortDate ? caseItemSyncV.caseDate : caseItemSyncV.deptName;

    let idRows: { id: string }[] = [];
    let totalRows: { total: number }[] = [];

    if (industryId && roleId) {
      const filter = whereClause
        ? and(whereClause, eq(caseIndustrySyncV.industryId, industryId), eq(caseRoleSyncV.roleId, roleId))
        : and(eq(caseIndustrySyncV.industryId, industryId), eq(caseRoleSyncV.roleId, roleId));

      [idRows, totalRows] = await Promise.all([
        this.db
          .selectDistinct({ id: caseItemSyncV.id })
          .from(caseItemSyncV)
          .innerJoin(caseIndustrySyncV, eq(caseIndustrySyncV.caseId, caseItemSyncV.id))
          .innerJoin(caseRoleSyncV, eq(caseRoleSyncV.caseId, caseItemSyncV.id))
          .where(filter)
          .orderBy(sortFn(orderCol))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(caseItemSyncV)
          .innerJoin(caseIndustrySyncV, eq(caseIndustrySyncV.caseId, caseItemSyncV.id))
          .innerJoin(caseRoleSyncV, eq(caseRoleSyncV.caseId, caseItemSyncV.id))
          .where(filter),
      ]);
    } else if (industryId) {
      const filter = whereClause
        ? and(whereClause, eq(caseIndustrySyncV.industryId, industryId))
        : eq(caseIndustrySyncV.industryId, industryId);

      [idRows, totalRows] = await Promise.all([
        this.db
          .selectDistinct({ id: caseItemSyncV.id })
          .from(caseItemSyncV)
          .innerJoin(caseIndustrySyncV, eq(caseIndustrySyncV.caseId, caseItemSyncV.id))
          .where(filter)
          .orderBy(sortFn(orderCol))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(caseItemSyncV)
          .innerJoin(caseIndustrySyncV, eq(caseIndustrySyncV.caseId, caseItemSyncV.id))
          .where(filter),
      ]);
    } else if (roleId) {
      const filter = whereClause
        ? and(whereClause, eq(caseRoleSyncV.roleId, roleId))
        : eq(caseRoleSyncV.roleId, roleId);

      [idRows, totalRows] = await Promise.all([
        this.db
          .selectDistinct({ id: caseItemSyncV.id })
          .from(caseItemSyncV)
          .innerJoin(caseRoleSyncV, eq(caseRoleSyncV.caseId, caseItemSyncV.id))
          .where(filter)
          .orderBy(sortFn(orderCol))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(caseItemSyncV)
          .innerJoin(caseRoleSyncV, eq(caseRoleSyncV.caseId, caseItemSyncV.id))
          .where(filter),
      ]);
    }

    const caseIds = idRows.map((r) => r.id);

    let items: CaseSummary[] = [];
    if (caseIds.length > 0) {
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
        .where(inArray(caseItemSyncV.id, caseIds))
        .orderBy(sortFn(orderCol));

      items = rows.map((item) => ({
        ...item,
        caseDate: item.caseDate ?? null,
        owners: (item.owners as CaseOwner[] | null) ?? null,
      }));
    }

    return {
      items,
      total: totalRows[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async detail(id: string): Promise<CaseDetail> {
    const rows = await this.db
      .select({
        id: caseItemSyncV.id,
        deptName: caseItemSyncV.deptName,
        completeness: caseItemSyncV.completeness,
        doubaoCapability: caseItemSyncV.doubaoCapability,
        complexity: caseItemSyncV.complexity,
        commercialScore: caseItemSyncV.commercialScore,
        info: caseItemSyncV.info,
        hasQuantResult: caseItemSyncV.hasQuantResult,
        externalLevel: caseItemSyncV.externalLevel,
        domainL1: caseItemSyncV.domainL1,
        evalScore: caseItemSyncV.evalScore,
        maturity: caseItemSyncV.maturity,
        auditStatus: caseItemSyncV.auditStatus,
        recommendTag: caseItemSyncV.recommendTag,
        valueLevel: caseItemSyncV.valueLevel,
        domainConfidence: caseItemSyncV.domainConfidence,
        caseDate: caseItemSyncV.caseDate,
        owners: caseItemSyncV.owners,
      })
      .from(caseItemSyncV)
      .where(eq(caseItemSyncV.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('Case not found');
    }

    const row = rows[0];

    // Fetch related customers
    const customerRels = await this.db
      .select({ customerId: caseCustomerSyncV.customerId })
      .from(caseCustomerSyncV)
      .where(eq(caseCustomerSyncV.caseId, id));
    const customerIds = customerRels.map((r) => r.customerId);
    let customers: CustomerSummary[] = [];
    if (customerIds.length > 0) {
      const customerRows = await this.db
        .select({
          id: customerSyncV.id,
          name: customerSyncV.name,
          cooperation: customerSyncV.cooperation,
          risk: customerSyncV.risk,
        })
        .from(customerSyncV)
        .where(inArray(customerSyncV.id, customerIds))
        .orderBy(asc(customerSyncV.name));
      customers = customerRows;
    }

    // Fetch related industries
    const industryRels = await this.db
      .select({ industryId: caseIndustrySyncV.industryId })
      .from(caseIndustrySyncV)
      .where(eq(caseIndustrySyncV.caseId, id));
    const industryIds = industryRels.map((r) => r.industryId);
    let industries: IndustrySummary[] = [];
    if (industryIds.length > 0) {
      const industryRows = await this.db
        .select({
          id: industrySyncV.id,
          name: industrySyncV.name,
          category: industrySyncV.category,
          scope: industrySyncV.scope,
          roleCount: industrySyncV.roleCount,
          scenarioCount: industrySyncV.scenarioCount,
          stepCount: industrySyncV.stepCount,
        })
        .from(industrySyncV)
        .where(inArray(industrySyncV.id, industryIds))
        .orderBy(asc(industrySyncV.name));
      industries = industryRows.map((i) => ({
        ...i,
        scope: i.scope ?? '',
        roleCount: i.roleCount ?? 0,
        scenarioCount: i.scenarioCount ?? 0,
        stepCount: i.stepCount ?? 0,
      }));
    }

    // Fetch related roles
    const roleRels = await this.db
      .select({ roleId: caseRoleSyncV.roleId })
      .from(caseRoleSyncV)
      .where(eq(caseRoleSyncV.caseId, id));
    const roleIds = roleRels.map((r) => r.roleId);
    let roles: RoleSummary[] = [];
    if (roleIds.length > 0) {
      const roleRows = await this.db
        .select({
          id: roleSyncV.id,
          name: roleSyncV.name,
          priority: roleSyncV.priority,
          department: roleSyncV.department,
          description: roleSyncV.description,
        })
        .from(roleSyncV)
        .where(inArray(roleSyncV.id, roleIds))
        .orderBy(asc(roleSyncV.name));
      roles = roleRows.map((r) => ({
        ...r,
        scenarioCount: 0,
      }));
    }

    // Fetch related scenarios
    const scenarioRels = await this.db
      .select({ scenarioId: caseScenarioSyncV.scenarioId })
      .from(caseScenarioSyncV)
      .where(eq(caseScenarioSyncV.caseId, id));
    const scenarioIds = scenarioRels.map((r) => r.scenarioId);
    let scenarios: ScenarioSummary[] = [];
    if (scenarioIds.length > 0) {
      const scenarioRows = await this.db
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
        .where(inArray(scenarioSyncV.id, scenarioIds))
        .orderBy(asc(scenarioSyncV.name));
      scenarios = scenarioRows.map((s) => ({
        ...s,
        stepCount: 0,
      }));
    }

    // Fetch related materials
    const materialRels = await this.db
      .select({ materialId: caseMaterialSyncV.materialId })
      .from(caseMaterialSyncV)
      .where(eq(caseMaterialSyncV.caseId, id));
    const materialIds = materialRels.map((r) => r.materialId);
    let materials: MaterialSummary[] = [];
    if (materialIds.length > 0) {
      const materialRows = await this.db
        .select({
          id: materialSyncV.id,
          name: materialSyncV.name,
          url: materialSyncV.url,
          updatedAt: materialSyncV.updatedAt,
        })
        .from(materialSyncV)
        .where(inArray(materialSyncV.id, materialIds))
        .orderBy(asc(materialSyncV.name));
      materials = materialRows.map((m) => ({
        id: m.id,
        name: m.name,
        url: m.url,
        updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
      }));
    }

    return {
      ...row,
      caseDate: row.caseDate ?? null,
      owners: (row.owners as CaseOwner[] | null) ?? null,
      doubaoCapability: row.doubaoCapability ?? null,
      customers,
      industries,
      roles,
      scenarios,
      materials,
    };
  }
}
