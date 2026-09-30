import { Controller, Get, Param, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import type { RoleSummary, RoleDetail, PaginatedResponse } from '@shared/api.interface';

@Controller('api/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('industryId') industryId?: string,
    @Query('functionId') functionId?: string,
  ): Promise<PaginatedResponse<RoleSummary>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 50) : 20;
    const order = sortOrder === 'desc' ? 'desc' : 'asc';

    return this.roleService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder: order,
      industryId,
      functionId,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<RoleDetail> {
    return this.roleService.detail(id);
  }
}
