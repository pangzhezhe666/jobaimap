import { Logger } from '@nestjs/common';
import { Automation, BindTrigger } from '@lark-apaas/fullstack-nestjs-core';
import { SyncService } from './sync.service';

@Automation()
export class SyncAutomationService {
  private readonly logger = new Logger(SyncAutomationService.name);

  constructor(private readonly syncService: SyncService) {}

  @BindTrigger('bitable_sync_scheduler')
  async scheduledSync(): Promise<void> {
    this.logger.log('开始执行定时全量同步任务');
    try {
      const result = await this.syncService.triggerFullSync('scheduled');
      if (result.success) {
        this.logger.log('定时全量同步任务触发成功');
      } else {
        this.logger.warn(`定时全量同步任务触发失败: ${result.message}`);
      }
    } catch (error) {
      this.logger.error('定时全量同步任务执行异常', error);
      throw error;
    }
  }
}
