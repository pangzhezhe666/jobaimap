import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { IndustryModule } from './modules/industry/industry.module';
import { RoleModule } from './modules/role/role.module';
import { ScenarioModule } from './modules/scenario/scenario.module';
import { StepModule } from './modules/step/step.module';
import { SkillModule } from './modules/skill/skill.module';
import { MaterialModule } from './modules/material/material.module';
import { CaseModule } from './modules/case/case.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SearchModule } from './modules/search/search.module';
import { InsightsModule } from './modules/insights/insights.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    IndustryModule,
    RoleModule,
    ScenarioModule,
    StepModule,
    SkillModule,
    MaterialModule,
    CaseModule,
    CustomerModule,
    SearchModule,
    InsightsModule,
    SyncModule,

    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
