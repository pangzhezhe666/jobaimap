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
} from 'drizzle-orm';
import {
  customerSyncV,
  industrySyncV,
  caseItemSyncV,
  materialSyncV,
  customerIndustrySyncV,
  customerMaterialSyncV,
  caseCustomerSyncV,
} from '@server/database/sync-views';
import type {
  PaginatedResponse,
  CustomerDetail,
  CustomerSummary,
  IndustrySummary,
  CaseSummary,
  CaseOwner,
  MaterialSummary,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  industryId?: string;
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<CustomerSummary>> {
    const { page, pageSize, keyword, sortBy, sortOrder, industryId } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (keyword) {
      conditions.push(ilike(customerSyncV.name, `%${keyword}%`));
    }

    const sortColumn = sortBy === 'name' ? customerSyncV.name : customerSyncV.name;
    const sortFn = sortOrder === 'desc' ? desc : asc;

    if (!industryId) {
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [items, totalResult] = await Promise.all([
        this.db
          .select({
            id: customerSyncV.id,
            name: customerSyncV.name,
            cooperation: customerSyncV.cooperation,
            risk: customerSyncV.risk,
          })
          .from(customerSyncV)
          .where(whereClause)
          .orderBy(sortFn(sortColumn))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(customerSyncV)
          .where(whereClause),
      ]);

      return {
        items,
        total: totalResult[0]?.total ?? 0,
        page,
        pageSize,
      };
    }

    // With industry filter: join through customer_industry
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const idQuery = this.db
      .selectDistinct({ id: customerSyncV.id })
      .from(customerSyncV)
      .innerJoin(customerIndustrySyncV, eq(customerIndustrySyncV.customerId, customerSyncV.id))
      .where(and(...[
        ...(whereClause ? [whereClause] : []),
        eq(customerIndustrySyncV.industryId, industryId),
      ]))
      .orderBy(sortFn(sortColumn))
      .limit(pageSize)
      .offset(offset);

    const idRows = await idQuery;
    const customerIds = idRows.map((r: { id: string }) => r.id);

    // Total count
    const countResult = await this.db
      .select({ total: count() })
      .from(customerSyncV)
      .innerJoin(customerIndustrySyncV, eq(customerIndustrySyncV.customerId, customerSyncV.id))
      .where(and(...[
        ...(whereClause ? [whereClause] : []),
        eq(customerIndustrySyncV.industryId, industryId),
      ]));

    let items: CustomerSummary[] = [];
    if (customerIds.length > 0) {
      const rows = await this.db
        .select({
          id: customerSyncV.id,
          name: customerSyncV.name,
          cooperation: customerSyncV.cooperation,
          risk: customerSyncV.risk,
        })
        .from(customerSyncV)
        .where(inArray(customerSyncV.id, customerIds))
        .orderBy(sortFn(sortColumn));
      items = rows;
    }

    return {
      items,
      total: countResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async detail(id: string): Promise<CustomerDetail> {
    const rows = await this.db
      .select({
        id: customerSyncV.id,
        name: customerSyncV.name,
        cooperation: customerSyncV.cooperation,
        risk: customerSyncV.risk,
        latestProgress: customerSyncV.latestProgress,
        opportunityWindow: customerSyncV.opportunityWindow,
      })
      .from(customerSyncV)
      .where(eq(customerSyncV.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('Customer not found');
    }

    const row = rows[0];

    // Fetch related industries
    const industryRels = await this.db
      .select({ industryId: customerIndustrySyncV.industryId })
      .from(customerIndustrySyncV)
      .where(eq(customerIndustrySyncV.customerId, id));
    const industryIds = industryRels.map((r: { industryId: string }) => r.industryId);
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

    // Fetch related cases (top 20, by case_date desc)
    const caseRels = await this.db
      .select({ caseId: caseCustomerSyncV.caseId })
      .from(caseCustomerSyncV)
      .where(eq(caseCustomerSyncV.customerId, id));
    const caseIds = caseRels.map((r: { caseId: string }) => r.caseId);
    let cases: CaseSummary[] = [];
    if (caseIds.length > 0) {
      const caseRows = await this.db
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
        .orderBy(desc(caseItemSyncV.caseDate))
        .limit(20);
      cases = caseRows.map((c) => ({
        ...c,
        caseDate: c.caseDate ?? null,
        owners: (c.owners as CaseOwner[] | null) ?? null,
      }));
    }

    // Fetch related materials (top 20)
    const materialRels = await this.db
      .select({ materialId: customerMaterialSyncV.materialId })
      .from(customerMaterialSyncV)
      .where(eq(customerMaterialSyncV.customerId, id));
    const materialIds = materialRels.map((r: { materialId: string }) => r.materialId);
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
        .orderBy(asc(materialSyncV.name))
        .limit(20);
      materials = materialRows.map((m) => ({
        id: m.id,
        name: m.name,
        url: m.url,
        updatedAt: m.updatedAt ? (m.updatedAt as Date).toISOString() : null,
      }));
    }

    return {
      ...row,
      industries,
      cases,
      materials,
    };
  }
}
