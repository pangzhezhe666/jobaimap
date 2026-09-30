import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import type { GlobalSearchResult } from '@shared/api.interface';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ): Promise<GlobalSearchResult> {
    const keyword = q ?? '';
    const limitNum = limit ? Math.min(parseInt(limit, 10), 20) : 10;
    return this.searchService.globalSearch(keyword, limitNum);
  }
}
