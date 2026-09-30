/**
 * Sync views re-declared as pgTable.
 *
 * The *_sync_v views in schema.ts are declared with pgView() but without
 * .as() (ManualViewBuilder), which makes Drizzle's query builder throw
 * "Cannot convert undefined or null to object" when used as a FROM target.
 *
 * PostgreSQL views can be SELECTed/INSERTed/UPDATEd like tables, so we
 * re-declare them here as pgTable with the same column definitions.
 */
import { sql } from 'drizzle-orm';
import {
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { customTimestamptz, userProfile } from './schema';

// ==========================================================================
// Main table views (9)
// ==========================================================================

export const jobFunctionSyncV = pgTable('job_function_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 100 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const industrySyncV = pgTable('industry_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 100 }),
  category: varchar('category', { length: 50 }),
  scope: text('scope'),
  notes: text('notes'),
  roleCount: integer('role_count'),
  scenarioCount: integer('scenario_count'),
  stepCount: integer('step_count'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const roleSyncV = pgTable('role_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 200 }),
  priority: varchar('priority', { length: 10 }),
  description: text('description'),
  scale: text('scale'),
  value: varchar('value', { length: 200 }),
  scaleLever: varchar('scale_lever', { length: 200 }),
  notes: text('notes'),
  managementSpan: text('management_span'),
  department: varchar('department', { length: 200 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const scenarioSyncV = pgTable('scenario_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 200 }),
  brief: text('brief'),
  detail: text('detail'),
  status: varchar('status', { length: 50 }),
  completeness: varchar('completeness', { length: 20 }),
  serviceMode: varchar('service_mode', { length: 50 }),
  priority: varchar('priority', { length: 10 }),
  trigger: text('trigger'),
  inputProvider: varchar('input_provider', { length: 200 }),
  output: text('output'),
  outputTarget: varchar('output_target', { length: 200 }),
  acceptance: text('acceptance'),
  pain: text('pain'),
  quote: text('quote'),
  consequence: text('consequence'),
  cadence: varchar('cadence', { length: 50 }),
  timeliness: text('timeliness'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const stepSyncV = pgTable('step_sync_v', {
  id: varchar('id', { length: 32 }),
  orderNum: integer('order_num'),
  name: varchar('name', { length: 200 }),
  taskType: varchar('task_type', { length: 20 }),
  isHiddenWork: varchar('is_hidden_work', { length: 10 }),
  trigger: varchar('trigger', { length: 200 }),
  precondition: text('precondition'),
  input: varchar('input', { length: 200 }),
  output: varchar('output', { length: 200 }),
  action: text('action'),
  difficultyNote: text('difficulty_note'),
  aiRatio: integer('ai_ratio'),
  humanRatio: integer('human_ratio'),
  collabRatio: integer('collab_ratio'),
  confirmWho: varchar('confirm_who', { length: 100 }),
  confirmWhere: varchar('confirm_where', { length: 100 }),
  exception: varchar('exception', { length: 200 }),
  timeout: varchar('timeout', { length: 200 }),
  aiCanDo: text('ai_can_do'),
  aiNotDo: text('ai_not_do'),
  aiCannotReason: text('ai_cannot_reason'),
  aiPrepare: text('ai_prepare'),
  humanStillDo: text('human_still_do'),
  expertWay: text('expert_way'),
  keyMetrics: varchar('key_metrics', { length: 200 }),
  dependencies: text('dependencies'),
  collaborators: varchar('collaborators', { length: 200 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const skillSyncV = pgTable('skill_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 100 }),
  description: text('description'),
  version: varchar('version', { length: 50 }),
  trigger: text('trigger'),
  input: text('input'),
  output: text('output'),
  criteria: text('criteria'),
  escalation: text('escalation'),
  scripts: text('scripts'),
  referenceDocs: text('reference_docs'),
  skillMd: text('skill_md'),
  url: varchar('url', { length: 500 }),
  packages: jsonb('packages'),
  accuracy: numeric('accuracy'),
  reworkRate: numeric('rework_rate'),
  duration: varchar('duration', { length: 50 }),
  closureMinutes: integer('closure_minutes'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const materialSyncV = pgTable('material_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 200 }),
  url: varchar('url', { length: 500 }),
  rawUrl: text('raw_url'),
  updatedAt: customTimestamptz('updated_at', { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const caseItemSyncV = pgTable('case_item_sync_v', {
  id: varchar('id', { length: 32 }),
  deptName: varchar('dept_name', { length: 200 }),
  completeness: varchar('completeness', { length: 20 }),
  doubaoCapability: text('doubao_capability').array(),
  complexity: varchar('complexity', { length: 50 }),
  commercialScore: integer('commercial_score'),
  info: text('info'),
  hasQuantResult: varchar('has_quant_result', { length: 10 }),
  externalLevel: varchar('external_level', { length: 20 }),
  domainL1: varchar('domain_l1', { length: 50 }),
  evalScore: integer('eval_score'),
  maturity: varchar('maturity', { length: 10 }),
  auditStatus: varchar('audit_status', { length: 20 }),
  recommendTag: varchar('recommend_tag', { length: 20 }),
  valueLevel: varchar('value_level', { length: 50 }),
  domainConfidence: varchar('domain_confidence', { length: 20 }),
  owners: jsonb('owners'),
  caseDate: date('case_date'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

export const customerSyncV = pgTable('customer_sync_v', {
  id: varchar('id', { length: 32 }),
  name: varchar('name', { length: 100 }),
  risk: text('risk'),
  cooperation: varchar('cooperation', { length: 50 }),
  latestProgress: text('latest_progress'),
  opportunityWindow: text('opportunity_window'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at', { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile('_created_by'),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at', { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile('_updated_by'),
});

// ==========================================================================
// Relation table views (16)
// ==========================================================================

export const industryRoleSyncV = pgTable('industry_role_sync_v', {
  industryId: varchar('industry_id', { length: 32 }),
  roleId: varchar('role_id', { length: 32 }),
});

export const roleFunctionSyncV = pgTable('role_function_sync_v', {
  roleId: varchar('role_id', { length: 32 }),
  functionId: varchar('function_id', { length: 32 }),
});

export const roleScenarioSyncV = pgTable('role_scenario_sync_v', {
  roleId: varchar('role_id', { length: 32 }),
  scenarioId: varchar('scenario_id', { length: 32 }),
});

export const scenarioStepSyncV = pgTable('scenario_step_sync_v', {
  scenarioId: varchar('scenario_id', { length: 32 }),
  stepId: varchar('step_id', { length: 32 }),
  stepOrder: integer('step_order'),
});

export const scenarioSkillSyncV = pgTable('scenario_skill_sync_v', {
  scenarioId: varchar('scenario_id', { length: 32 }),
  skillId: varchar('skill_id', { length: 32 }),
});

export const customerIndustrySyncV = pgTable('customer_industry_sync_v', {
  customerId: varchar('customer_id', { length: 32 }),
  industryId: varchar('industry_id', { length: 32 }),
});

export const customerMaterialSyncV = pgTable('customer_material_sync_v', {
  customerId: varchar('customer_id', { length: 32 }),
  materialId: varchar('material_id', { length: 32 }),
});

export const skillMaterialSyncV = pgTable('skill_material_sync_v', {
  skillId: varchar('skill_id', { length: 32 }),
  materialId: varchar('material_id', { length: 32 }),
});

export const roleMaterialSyncV = pgTable('role_material_sync_v', {
  roleId: varchar('role_id', { length: 32 }),
  materialId: varchar('material_id', { length: 32 }),
});

export const stepMaterialSyncV = pgTable('step_material_sync_v', {
  stepId: varchar('step_id', { length: 32 }),
  materialId: varchar('material_id', { length: 32 }),
});

export const scenarioMaterialSyncV = pgTable('scenario_material_sync_v', {
  scenarioId: varchar('scenario_id', { length: 32 }),
  materialId: varchar('material_id', { length: 32 }),
});

export const caseMaterialSyncV = pgTable('case_material_sync_v', {
  caseId: varchar('case_id', { length: 32 }),
  materialId: varchar('material_id', { length: 32 }),
});

export const caseScenarioSyncV = pgTable('case_scenario_sync_v', {
  caseId: varchar('case_id', { length: 32 }),
  scenarioId: varchar('scenario_id', { length: 32 }),
});

export const caseRoleSyncV = pgTable('case_role_sync_v', {
  caseId: varchar('case_id', { length: 32 }),
  roleId: varchar('role_id', { length: 32 }),
});

export const caseCustomerSyncV = pgTable('case_customer_sync_v', {
  caseId: varchar('case_id', { length: 32 }),
  customerId: varchar('customer_id', { length: 32 }),
});

export const caseIndustrySyncV = pgTable('case_industry_sync_v', {
  caseId: varchar('case_id', { length: 32 }),
  industryId: varchar('industry_id', { length: 32 }),
});
