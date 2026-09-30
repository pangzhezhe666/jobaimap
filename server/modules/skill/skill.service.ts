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
  skillSyncV,
  scenarioSyncV,
  materialSyncV,
  scenarioSkillSyncV,
  skillMaterialSyncV,
} from '@server/database/sync-views';
import type {
  PaginatedResponse,
  SkillDetail,
  SkillSummary,
  ScenarioSummary,
  MaterialSummary,
  SkillPackage,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<SkillSummary>> {
    const { page, pageSize, keyword, sortBy, sortOrder } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          ilike(skillSyncV.name, `%${keyword}%`),
          ilike(skillSyncV.trigger, `%${keyword}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = sortBy === 'name' ? skillSyncV.name : skillSyncV.name;
    const sortFn = sortOrder === 'desc' ? desc : asc;

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: skillSyncV.id,
          name: skillSyncV.name,
          description: skillSyncV.description,
          version: skillSyncV.version,
          trigger: skillSyncV.trigger,
        })
        .from(skillSyncV)
        .where(whereClause)
        .orderBy(sortFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(skillSyncV)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async detail(id: string): Promise<SkillDetail> {
    const rows = await this.db
      .select({
        id: skillSyncV.id,
        name: skillSyncV.name,
        description: skillSyncV.description,
        version: skillSyncV.version,
        trigger: skillSyncV.trigger,
        input: skillSyncV.input,
        output: skillSyncV.output,
        criteria: skillSyncV.criteria,
        escalation: skillSyncV.escalation,
        accuracy: skillSyncV.accuracy,
        reworkRate: skillSyncV.reworkRate,
        duration: skillSyncV.duration,
        closureMinutes: skillSyncV.closureMinutes,
        scripts: skillSyncV.scripts,
        referenceDocs: skillSyncV.referenceDocs,
        skillMd: skillSyncV.skillMd,
        url: skillSyncV.url,
        packages: skillSyncV.packages,
      })
      .from(skillSyncV)
      .where(eq(skillSyncV.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('Skill not found');
    }

    const row = rows[0];

    // Fetch related scenarios via scenario_skill
    const scenarioRelations = await this.db
      .select({ scenarioId: scenarioSkillSyncV.scenarioId })
      .from(scenarioSkillSyncV)
      .where(eq(scenarioSkillSyncV.skillId, id));

    const scenarioIds = scenarioRelations.map((r: { scenarioId: string }) => r.scenarioId);

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

    // Fetch related materials via skill_material
    const materialRelations = await this.db
      .select({ materialId: skillMaterialSyncV.materialId })
      .from(skillMaterialSyncV)
      .where(eq(skillMaterialSyncV.skillId, id));

    const materialIds = materialRelations.map((r: { materialId: string }) => r.materialId);

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

    const packages: SkillPackage[] | null = row.packages as SkillPackage[] | null;

    return {
      ...row,
      accuracy: row.accuracy ? Number(row.accuracy) : null,
      reworkRate: row.reworkRate ? Number(row.reworkRate) : null,
      packages,
      scenarios,
      materials,
    };
  }
}
