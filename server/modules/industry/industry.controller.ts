import { Controller, Get, Param, Query } from '@nestjs/common';
import { IndustryService } from './industry.service';
import type { IndustrySummary, IndustryDetail, PaginatedResponse } from '@shared/api.interface';

@Controller('api/industries')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('hasRoles') hasRoles?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<PaginatedResponse<IndustrySummary>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 200) : 20;
    const order = sortOrder === 'desc' ? 'desc' : 'asc';
    const hasRolesBool = hasRoles === 'true' || hasRoles === '1';

    return this.industryService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      category,
      hasRoles: hasRoles ? hasRolesBool : undefined,
      sortBy,
      sortOrder: order,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<IndustryDetail> {
    return this.industryService.detail(id);
  }
}
