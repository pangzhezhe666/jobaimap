import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, eq, ilike, asc, desc, and, inArray } from 'drizzle-orm';
import {
  stepSyncV,
  scenarioStepSyncV,
  stepMaterialSyncV,
  scenarioSyncV,
  materialSyncV,
} from '@server/database/sync-views';
import type {
  StepSummary,
  StepDetail,
  ScenarioSummary,
  MaterialSummary,
  PaginatedResponse,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  scenarioId?: string;
}

@Injectable()
export class StepService {
  private readonly logger = new Logger(StepService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<StepSummary>> {
    const { page, pageSize, keyword, sortBy, sortOrder, scenarioId } = params;

    const baseConditions = [];
    if (keyword) {
      baseConditions.push(ilike(stepSyncV.name, `%${keyword}%`));
    }

    const sortColumn = sortBy === 'name' ? stepSyncV.name : stepSyncV.orderNum;
    const sortFn = sortOrder === 'desc' ? desc : asc;
    const offset = (page - 1) * pageSize;

    let stepIds: string[] = [];
    let total = 0;

    if (scenarioId) {
      // Use join-based filtering
      const filteredQb = this.db
        .select({ id: stepSyncV.id, orderNum: stepSyncV.orderNum, name: stepSyncV.name })
        .from(stepSyncV)
        .innerJoin(scenarioStepSyncV, eq(scenarioStepSyncV.stepId, stepSyncV.id))
        .where(
          and(
            eq(scenarioStepSyncV.scenarioId, scenarioId),
            ...(keyword ? [ilike(stepSyncV.name, `%${keyword}%`)] : []),
          ),
        )
        .groupBy(stepSyncV.id);

      const countRows = await this.db
        .select({ value: count() })
        .from(filteredQb.as('filtered'));
      total = Number(countRows[0]?.value ?? 0);

      const idRows = await filteredQb
        .orderBy(sortFn(sortColumn))
        .limit(pageSize)
        .offset(offset);
      stepIds = idRows.map((r) => r.id);
    } else {
      const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const [totalResult, rows] = await Promise.all([
        this.db
          .select({ value: count() })
          .from(stepSyncV)
          .where(whereClause),
        this.db
          .select()
          .from(stepSyncV)
          .where(whereClause)
          .orderBy(sortFn(sortColumn))
          .limit(pageSize)
          .offset(offset),
      ]);

      total = Number(totalResult[0]?.value ?? 0);
      stepIds = rows.map((r) => r.id);
    }

    let items: StepSummary[] = [];
    if (stepIds.length > 0) {
      const detailRows = await this.db
        .select()
        .from(stepSyncV)
        .where(inArray(stepSyncV.id, stepIds));
      const detailMap = new Map(detailRows.map((r) => [r.id, r]));

      items = stepIds
        .map((id) => detailMap.get(id))
        .filter((s): s is typeof stepSyncV.$inferSelect => !!s)
        .map((s) => ({
          id: s.id,
          orderNum: s.orderNum,
          name: s.name,
          taskType: s.taskType,
          isHiddenWork: s.isHiddenWork,
          aiRatio: s.aiRatio,
          humanRatio: s.humanRatio,
          collabRatio: s.collabRatio,
        }));
    }

    return { items, total, page, pageSize };
  }

  async detail(id: string): Promise<StepDetail | null> {
    const baseRows = await this.db.select().from(stepSyncV).where(eq(stepSyncV.id, id));
    if (baseRows.length === 0) return null;
    const base = baseRows[0];

    const [scenarioJoinRows, materialJoinRows] = await Promise.all([
      this.db
        .select()
        .from(scenarioSyncV)
        .innerJoin(scenarioStepSyncV, eq(scenarioStepSyncV.scenarioId, scenarioSyncV.id))
        .where(eq(scenarioStepSyncV.stepId, id))
        .orderBy(asc(scenarioSyncV.name)),
      this.db
        .select()
        .from(materialSyncV)
        .innerJoin(stepMaterialSyncV, eq(stepMaterialSyncV.materialId, materialSyncV.id))
        .where(eq(stepMaterialSyncV.stepId, id))
        .orderBy(asc(materialSyncV.name)),
    ]);

    const scenarios: ScenarioSummary[] = scenarioJoinRows.map((row) => {
      const s = row.scenario_sync_v;
      return {
        id: s.id,
        name: s.name,
        brief: s.brief,
        status: s.status,
        completeness: s.completeness,
        priority: s.priority,
        serviceMode: s.serviceMode,
        stepCount: 0,
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

    return {
      id: base.id,
      orderNum: base.orderNum,
      name: base.name,
      taskType: base.taskType,
      isHiddenWork: base.isHiddenWork,
      aiRatio: base.aiRatio,
      humanRatio: base.humanRatio,
      collabRatio: base.collabRatio,
      trigger: base.trigger,
      precondition: base.precondition,
      input: base.input,
      output: base.output,
      action: base.action,
      difficultyNote: base.difficultyNote,
      confirmWho: base.confirmWho,
      confirmWhere: base.confirmWhere,
      exception: base.exception,
      timeout: base.timeout,
      aiCanDo: base.aiCanDo,
      aiNotDo: base.aiNotDo,
      aiCannotReason: base.aiCannotReason,
      aiPrepare: base.aiPrepare,
      humanStillDo: base.humanStillDo,
      expertWay: base.expertWay,
      keyMetrics: base.keyMetrics,
      dependencies: base.dependencies,
      collaborators: base.collaborators,
      scenarios,
      materials,
    };
  }
}
