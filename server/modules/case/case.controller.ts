import { Controller, Get, Param, Query } from '@nestjs/common';
import { CaseService } from './case.service';
import type { PaginatedResponse, CaseDetail, CaseSummary } from '@shared/api.interface';

@Controller('api/cases')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('industryId') industryId?: string,
    @Query('roleId') roleId?: string,
  ): Promise<PaginatedResponse<CaseSummary>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 50) : 20;
    return this.caseService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
      industryId,
      roleId,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<CaseDetail> {
    return this.caseService.detail(id);
  }
}
