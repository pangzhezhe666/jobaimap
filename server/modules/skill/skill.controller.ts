import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkillService } from './skill.service';
import type { PaginatedResponse, SkillDetail, SkillSummary } from '@shared/api.interface';

@Controller('api/skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<PaginatedResponse<SkillSummary>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 50) : 20;
    return this.skillService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<SkillDetail> {
    return this.skillService.detail(id);
  }
}
