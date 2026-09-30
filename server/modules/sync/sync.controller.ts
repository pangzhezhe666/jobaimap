import { Controller, Get, Post, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import type {
  SyncStatusResponse,
  TestConnectionResponse,
  FullSyncTriggerResponse,
  ReloadCredentialsResponse,
} from '@shared/api.interface';

@Controller('api/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  async getSyncStatus(): Promise<SyncStatusResponse> {
    return this.syncService.getSyncStatus();
  }

  @Post('test-connection')
  async testConnection(@Req() req: Request): Promise<TestConnectionResponse> {
    return this.syncService.testConnection();
  }

  @Post('full-sync')
  async triggerFullSync(@Req() req: Request): Promise<FullSyncTriggerResponse> {
    return { success: false, message: '应用已切换为直接读取 Base 数据库同步表，全量同步功能已停用。' };
  }

  @Post('reload-credentials')
  async reloadCredentials(@Req() req: Request): Promise<ReloadCredentialsResponse> {
    return this.syncService.reloadCredentials();
  }
}
