import { Controller, Get, Param, Query } from '@nestjs/common';
import { MaterialService } from './material.service';
import type { PaginatedResponse, MaterialDetail, MaterialSummary } from '@shared/api.interface';

@Controller('api/materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<PaginatedResponse<MaterialSummary>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 50) : 20;
    return this.materialService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<MaterialDetail> {
    return this.materialService.detail(id);
  }
}
