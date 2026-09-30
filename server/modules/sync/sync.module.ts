import { Module } from '@nestjs/common';
import { MiaodaConnectionsModule } from '@lark-apaas/miaoda-connections-sdk';
import { BitableClientService } from './bitable-client.service';
import { FieldMapperService } from './field-mapper.service';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncAutomationService } from './sync.automation';

@Module({
  imports: [MiaodaConnectionsModule.forRoot()],
  controllers: [SyncController],
  providers: [
    BitableClientService,
    FieldMapperService,
    SyncService,
    SyncAutomationService,
  ],
  exports: [SyncService],
})
export class SyncModule {}
