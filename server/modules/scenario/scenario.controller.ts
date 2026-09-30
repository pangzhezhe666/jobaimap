import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import type {
  PaginatedResponse,
  ScenarioSummary,
  ScenarioDetail,
} from '@shared/api.interface';
import { ScenarioService } from './scenario.service';

@Controller('api/scenarios')
export class ScenarioController {
  constructor(private readonly scenarioService: ScenarioService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('roleId') roleId?: string,
    @Query('industryId') industryId?: string,
  ): Promise<PaginatedResponse<ScenarioSummary>> {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSizeNum = pageSize
      ? Math.min(50, Math.max(1, parseInt(pageSize, 10)))
      : 20;
    return this.scenarioService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder,
      roleId,
      industryId,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<ScenarioDetail> {
    const result = await this.scenarioService.detail(id);
    if (!result) {
      throw new NotFoundException('场景不存在');
    }
    return result;
  }
}
