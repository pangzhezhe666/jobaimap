import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import type {
  PaginatedResponse,
  StepSummary,
  StepDetail,
} from '@shared/api.interface';
import { StepService } from './step.service';

@Controller('api/steps')
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('scenarioId') scenarioId?: string,
  ): Promise<PaginatedResponse<StepSummary>> {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSizeNum = pageSize
      ? Math.min(50, Math.max(1, parseInt(pageSize, 10)))
      : 20;
    return this.stepService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder,
      scenarioId,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<StepDetail> {
    const result = await this.stepService.detail(id);
    if (!result) {
      throw new NotFoundException('步骤不存在');
    }
    return result;
  }
}
