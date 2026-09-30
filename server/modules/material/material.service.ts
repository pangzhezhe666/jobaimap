import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  count,
  eq,
  ilike,
  asc,
  desc,
  and,
} from 'drizzle-orm';
import { materialSyncV } from '@server/database/sync-views';
import type {
  PaginatedResponse,
  MaterialDetail,
  MaterialSummary,
} from '@shared/api.interface';

interface ListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(params: ListParams): Promise<PaginatedResponse<MaterialSummary>> {
    const { page, pageSize, keyword, sortBy, sortOrder } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (keyword) {
      conditions.push(ilike(materialSyncV.name, `%${keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let sortColumn: typeof materialSyncV.name | typeof materialSyncV.updatedAt = materialSyncV.name;
    if (sortBy === 'updatedAt' || sortBy === 'updated_at') {
      sortColumn = materialSyncV.updatedAt as typeof materialSyncV.name | typeof materialSyncV.updatedAt;
    }

    const sortFn = sortOrder === 'desc' ? desc : asc;

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: materialSyncV.id,
          name: materialSyncV.name,
          url: materialSyncV.url,
          updatedAt: materialSyncV.updatedAt,
        })
        .from(materialSyncV)
        .where(whereClause)
        .orderBy(sortFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(materialSyncV)
        .where(whereClause),
    ]);

    const summaryItems: MaterialSummary[] = items.map(
      (item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        updatedAt: item.updatedAt ? (item.updatedAt as Date).toISOString() : null,
      }),
    );

    return {
      items: summaryItems,
      total: totalResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async detail(id: string): Promise<MaterialDetail> {
    const rows = await this.db
      .select({
        id: materialSyncV.id,
        name: materialSyncV.name,
        url: materialSyncV.url,
        rawUrl: materialSyncV.rawUrl,
        updatedAt: materialSyncV.updatedAt,
      })
      .from(materialSyncV)
      .where(eq(materialSyncV.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('Material not found');
    }

    const row = rows[0];

    return {
      ...row,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    };
  }
}
