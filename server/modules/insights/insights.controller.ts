import { Controller, Get, Query } from '@nestjs/common';
import { InsightsService } from './insights.service';
import type {
  GlobalInsightsResponse,
  GovernanceData,
  OrphanScenarioItem,
  PaginatedResponse,
} from '@shared/api.interface';

@Controller('api/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  async getGlobalInsights(): Promise<GlobalInsightsResponse> {
    return this.insightsService.getGlobalInsights();
  }

  @Get('global')
  async getGlobalInsightsV2(): Promise<GlobalInsightsResponse> {
    return this.insightsService.getGlobalInsights();
  }

  @Get('governance')
  async getGovernanceData(): Promise<GovernanceData> {
    return this.insightsService.getGovernanceData();
  }

  @Get('orphan-scenarios')
  async getOrphanScenarios(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PaginatedResponse<OrphanScenarioItem>> {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;
    return this.insightsService.getOrphanScenarios({
      page: Math.max(1, p),
      pageSize: Math.min(100, Math.max(1, ps)),
      keyword,
    });
  }
}
