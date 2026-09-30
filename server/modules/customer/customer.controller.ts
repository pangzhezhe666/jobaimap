import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import type { PaginatedResponse, CustomerDetail, CustomerSummary } from '@shared/api.interface';

@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('industryId') industryId?: string,
  ): Promise<PaginatedResponse<CustomerSummary>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 50) : 20;
    return this.customerService.list({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      sortBy,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
      industryId,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<CustomerDetail> {
    return this.customerService.detail(id);
  }
}
