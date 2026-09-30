import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, eq, ilike, asc, desc, and, inArray } from 'drizzle-orm';
import {
  scenarioSyncV,
  scenarioStepSyncV,
  roleScenarioSyncV,
  scenarioSkillSyncV,
  scenarioMaterialSyncV,
  caseScenarioSyncV,
  roleSyncV,
  stepSyncV,
  skillSyncV,
  materialSyncV,
  caseItemSyncV,
  industryRoleSyncV,
} from '@server/database/sync-views';
import type {
  ScenarioSummary,
  ScenarioDetail,
  RoleSummary,
  StepSummary,
  SkillSummary,
  MaterialSummary,
  CaseSummary,
  PaginatedResponse,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  roleId?: string;
  industryId?: string;
}

@Injectable()
export class ScenarioService {
  private readonly logger = new Logger(ScenarioService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<ScenarioSummary>> {
    const { page, pageSize, keyword, sortBy, sortOrder, roleId, industryId } = params;

    const baseConditions = [];
    if (keyword) {
      baseConditions.push(ilike(scenarioSyncV.name, `%${keyword}%`));
    }

    const hasJoinFilter = !!roleId || !!industryId;

    const sortColumn = sortBy === 'status'
      ? scenarioSyncV.status
      : sortBy === 'priority'
        ? scenarioSyncV.priority
        : scenarioSyncV.name;
    const sortFn = sortOrder === 'desc' ? desc : asc;
    const offset = (page - 1) * pageSize;

    let scenarioIds: string[] = [];
    let total = 0;

    if (hasJoinFilter) {
      // Build a subquery to get filtered scenario IDs via joins
      let qb = this.db
        .select({ id: scenarioSyncV.id })
        .from(scenarioSyncV)
        .innerJoin(roleScenarioSyncV, eq(roleScenarioSyncV.scenarioId, scenarioSyncV.id));

      if (industryId) {
        qb = qb.innerJoin(industryRoleSyncV, eq(industryRoleSyncV.roleId, roleScenarioSyncV.roleId));
      }

      const joinConditions = [];
      if (roleId) joinConditions.push(eq(roleScenarioSyncV.roleId, roleId));
      if (industryId) joinConditions.push(eq(industryRoleSyncV.industryId, industryId));
      if (keyword) joinConditions.push(ilike(scenarioSyncV.name, `%${keyword}%`));

      const filteredQb = qb.where(and(...joinConditions)).groupBy(scenarioSyncV.id);

      const countRows = await this.db
        .select({ value: count() })
        .from(filteredQb.as('filtered'));
      total = Number(countRows[0]?.value ?? 0);

      const idRows = await filteredQb
        .orderBy(sortFn(sortColumn))
        .limit(pageSize)
        .offset(offset);
      scenarioIds = idRows.map((r) => r.id);
    } else {
      // Simple query without join filters
      const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const [totalResult, rows] = await Promise.all([
        this.db
          .select({ value: count() })
          .from(scenarioSyncV)
          .where(whereClause),
        this.db
          .select()
          .from(scenarioSyncV)
          .where(whereClause)
          .orderBy(sortFn(sortColumn))
          .limit(pageSize)
          .offset(offset),
      ]);

      total = Number(totalResult[0]?.value ?? 0);
      scenarioIds = rows.map((r) => r.id);
    }

    // Fetch full scenario records in the same order
    let items: ScenarioSummary[] = [];
    if (scenarioIds.length > 0) {
      const detailRows = await this.db
        .select()
        .from(scenarioSyncV)
        .where(inArray(scenarioSyncV.id, scenarioIds));

      const detailMap = new Map(detailRows.map((r) => [r.id, r]));

      const stepCountRows = await this.db
        .select({
          scenarioId: scenarioStepSyncV.scenarioId,
          count: count(),
        })
        .from(scenarioStepSyncV)
        .where(inArray(scenarioStepSyncV.scenarioId, scenarioIds))
        .groupBy(scenarioStepSyncV.scenarioId);
      const stepCounts = new Map(stepCountRows.map((r) => [r.scenarioId, Number(r.count)]));

      items = scenarioIds
        .map((id) => detailMap.get(id))
        .filter((s): s is typeof scenarioSyncV.$inferSelect => !!s)
        .map((s) => ({
          id: s.id,
          name: s.name,
          brief: s.brief,
          status: s.status,
          completeness: s.completeness,
          priority: s.priority,
          serviceMode: s.serviceMode,
          stepCount: stepCounts.get(s.id) ?? 0,
        }));
    }

    return { items, total, page, pageSize };
  }

  async detail(id: string): Promise<ScenarioDetail | null> {
    const baseRows = await this.db.select().from(scenarioSyncV).where(eq(scenarioSyncV.id, id));
    if (baseRows.length === 0) return null;
    const base = baseRows[0];

    const [
      stepCountRows,
      roleJoinRows,
      stepJoinRows,
      skillJoinRows,
      materialJoinRows,
      caseJoinRows,
    ] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(scenarioStepSyncV)
        .where(eq(scenarioStepSyncV.scenarioId, id)),
      this.db
        .select()
        .from(roleSyncV)
        .innerJoin(roleScenarioSyncV, eq(roleScenarioSyncV.roleId, roleSyncV.id))
        .where(eq(roleScenarioSyncV.scenarioId, id))
        .orderBy(asc(roleSyncV.name)),
      this.db
        .select()
        .from(stepSyncV)
        .innerJoin(scenarioStepSyncV, eq(scenarioStepSyncV.stepId, stepSyncV.id))
        .where(eq(scenarioStepSyncV.scenarioId, id))
        .orderBy(asc(scenarioStepSyncV.stepOrder)),
      this.db
        .select()
        .from(skillSyncV)
        .innerJoin(scenarioSkillSyncV, eq(scenarioSkillSyncV.skillId, skillSyncV.id))
        .where(eq(scenarioSkillSyncV.scenarioId, id))
        .orderBy(asc(skillSyncV.name)),
      this.db
        .select()
        .from(materialSyncV)
        .innerJoin(scenarioMaterialSyncV, eq(scenarioMaterialSyncV.materialId, materialSyncV.id))
        .where(eq(scenarioMaterialSyncV.scenarioId, id))
        .orderBy(asc(materialSyncV.name))
        .limit(20),
      this.db
        .select()
        .from(caseItemSyncV)
        .innerJoin(caseScenarioSyncV, eq(caseScenarioSyncV.caseId, caseItemSyncV.id))
        .where(eq(caseScenarioSyncV.scenarioId, id))
        .limit(20),
    ]);

    const stepCount = Number(stepCountRows[0]?.count ?? 0);

    const roles: RoleSummary[] = roleJoinRows.map((row) => {
      const r = row.role_sync_v;
      return {
        id: r.id,
        name: r.name,
        priority: r.priority,
        department: r.department,
        description: r.description,
        scenarioCount: 0,
      };
    });

    const steps: StepSummary[] = stepJoinRows.map((row) => {
      const s = row.step_sync_v;
      return {
        id: s.id,
        orderNum: s.orderNum,
        name: s.name,
        taskType: s.taskType,
        isHiddenWork: s.isHiddenWork,
        aiRatio: s.aiRatio,
        humanRatio: s.humanRatio,
        collabRatio: s.collabRatio,
      };
    });

    const skills: SkillSummary[] = skillJoinRows.map((row) => {
      const s = row.skill_sync_v;
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        version: s.version,
        trigger: s.trigger,
      };
    });

    const materials: MaterialSummary[] = materialJoinRows.map((row) => {
      const m = row.material_sync_v;
      return {
        id: m.id,
        name: m.name,
        url: m.url,
        updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
      };
    });

    const cases: CaseSummary[] = caseJoinRows.map((row) => {
      const c = row.case_item_sync_v;
      return {
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
        caseDate: c.caseDate ? String(c.caseDate) : null,
        owners: c.owners as CaseSummary['owners'],
      };
    });

    return {
      id: base.id,
      name: base.name,
      brief: base.brief,
      status: base.status,
      completeness: base.completeness,
      priority: base.priority,
      serviceMode: base.serviceMode,
      stepCount,
      detail: base.detail,
      trigger: base.trigger,
      inputProvider: base.inputProvider,
      output: base.output,
      outputTarget: base.outputTarget,
      acceptance: base.acceptance,
      pain: base.pain,
      quote: base.quote,
      consequence: base.consequence,
      cadence: base.cadence,
      timeliness: base.timeliness,
      roles,
      steps,
      skills,
      cases,
      materials,
    };
  }
}
