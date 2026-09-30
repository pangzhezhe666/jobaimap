/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, date, foreignKey, index, integer, jsonb, numeric, pgTable, pgView, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const syncTableLog = pgTable("sync_table_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  recordsRead: integer("records_read").notNull().default(0),
  recordsInserted: integer("records_inserted").notNull().default(0),
  recordsUpdated: integer("records_updated").notNull().default(0),
  recordsUnchanged: integer("records_unchanged").notNull().default(0),
  recordsInactivated: integer("records_inactivated").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: customTimestamptz("started_at", { precision: 6 }),
  finishedAt: customTimestamptz("finished_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_sync_table_log_run_table").on(table.runId, table.tableName),
  index("idx_sync_table_log_run_id").on(table.runId),
  foreignKey({
    columns: [table.runId],
    foreignColumns: [syncRun.id],
    name: "sync_table_log_run_id_fkey",
  }).onDelete("cascade"),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const _12Client = pgTable("12_client", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  appName: text("app_name"),
  // Synced field: auto-synced, do not modify or delete
  industry: text("industry"),
  // Synced field: auto-synced, do not modify or delete
  cooperationMethod: text("cooperation_method"),
  // Synced field: auto-synced, do not modify or delete
  latestProgress: text("latest_progress"),
  // Synced field: auto-synced, do not modify or delete
  recentWindow: text("recent_window"),
  // Synced field: auto-synced, do not modify or delete
  competitorRisk: text("competitor_risk"),
  // Synced field: auto-synced, do not modify or delete
  feishuContact: userProfile("feishu_contact"),
  /**
   * 关联岗位
   */
  // Synced field: auto-synced, do not modify or delete
  relatedPosition: jsonb("related_position"),
  /**
   * 来源资料
   */
  // Synced field: auto-synced, do not modify or delete
  sourceMaterial: jsonb("source_material"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877460054455395").on(table.id),
  uniqueIndex("unq_1877460054456387").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const case11 = pgTable("case_11", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  caseInfo: text("case_info"),
  // Synced field: auto-synced, do not modify or delete
  relatedCustomer: text("related_customer"),
  // Synced field: auto-synced, do not modify or delete
  departmentName: text("department_name"),
  // Synced field: auto-synced, do not modify or delete
  dataProvider: userProfile("data_provider"),
  // Synced field: auto-synced, do not modify or delete
  auditStatus: text("audit_status"),
  // Synced field: auto-synced, do not modify or delete
  customerIndustry: text("customer_industry"),
  /**
   * 岗位/角色
   */
  // Synced field: auto-synced, do not modify or delete
  postRole: jsonb("post_role"),
  // Synced field: auto-synced, do not modify or delete
  firstLevelBusinessDomain: text("first_level_business_domain"),
  /**
   * 二级业务场景
   */
  // Synced field: auto-synced, do not modify or delete
  secondLevelBusinessScenario: jsonb("second_level_business_scenario"),
  // Synced field: auto-synced, do not modify or delete
  businessDomainConfidence: text("business_domain_confidence"),
  // Synced field: auto-synced, do not modify or delete
  doubaoFeatureCapability: text("doubao_feature_capability").array(),
  // Synced field: auto-synced, do not modify or delete
  caseComplexity: text("case_complexity"),
  // Synced field: auto-synced, do not modify or delete
  recommendScore: text("recommend_score"),
  // Synced field: auto-synced, do not modify or delete
  commercialRecommendScore: bigint("commercial_recommend_score", { mode: 'number' }),
  // Synced field: auto-synced, do not modify or delete
  evaluateRecommendScore: bigint("evaluate_recommend_score", { mode: 'number' }),
  // Synced field: auto-synced, do not modify or delete
  caseImplementationMaturity: text("case_implementation_maturity"),
  // Synced field: auto-synced, do not modify or delete
  publishableLevel: text("publishable_level"),
  // Synced field: auto-synced, do not modify or delete
  hasQuantitativeResult: text("has_quantitative_result"),
  // Synced field: auto-synced, do not modify or delete
  valueVerificationLevel: text("value_verification_level"),
  // Synced field: auto-synced, do not modify or delete
  dataCompleteness: text("data_completeness"),
  // Synced field: auto-synced, do not modify or delete
  date: date("date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877460491704359").on(table.id),
  uniqueIndex("unq_1877460491705351").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const _10CaseDataDetail = pgTable("10_case_data_detail", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  dataName: text("data_name"),
  // Synced field: auto-synced, do not modify or delete
  relatedCase: text("related_case"),
  // Synced field: auto-synced, do not modify or delete
  dataAddress: text("data_address"),
  // Synced field: auto-synced, do not modify or delete
  appAttachment: text("app_attachment").array(),
  // Synced field: auto-synced, do not modify or delete
  lastUpdateTime: customTimestamptz("last_update_time", { precision: 6 }),
  // Synced field: auto-synced, do not modify or delete
  hasPermission: text("has_permission"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877438433130506").on(table.id),
  uniqueIndex("unq_1877438433130538").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const seedQuestionBank09 = pgTable("seed_question_bank_09", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  examPackageName: text("exam_package_name"),
  // Synced field: auto-synced, do not modify or delete
  releaseStatus: text("release_status"),
  // Synced field: auto-synced, do not modify or delete
  examPackageAttachment: text("exam_package_attachment").array(),
  // Synced field: auto-synced, do not modify or delete
  examContent: text("exam_content"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877437994716265").on(table.id),
  uniqueIndex("unq_1877437994718281").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const productSameTopicRunCompare = pgTable("product_same_topic_run_compare", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  runName: text("run_name"),
  // Synced field: auto-synced, do not modify or delete
  frontBenchmarkCard: text("front_benchmark_card"),
  // Synced field: auto-synced, do not modify or delete
  appModel: text("app_model"),
  // Synced field: auto-synced, do not modify or delete
  modelResponse: text("model_response"),
  // Synced field: auto-synced, do not modify or delete
  responseProduct: text("response_product").array(),
  // Synced field: auto-synced, do not modify or delete
  appScore: numeric("app_score"),
  // Synced field: auto-synced, do not modify or delete
  tokenMedianM: numeric("token_median_m"),
  // Synced field: auto-synced, do not modify or delete
  maasDiscountMedian: numeric("maas_discount_median"),
  // Synced field: auto-synced, do not modify or delete
  durationMedianMin: numeric("duration_median_min"),
  // Synced field: auto-synced, do not modify or delete
  appLogid: text("app_logid"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877437921573115").on(table.id),
  uniqueIndex("unq_1877437921575131").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const frontEvaluationCard = pgTable("front_evaluation_card", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  appName: text("app_name"),
  // Synced field: auto-synced, do not modify or delete
  businessScenarioWorkflow: text("business_scenario_workflow"),
  // Synced field: auto-synced, do not modify or delete
  appQuestionId: text("app_question_id"),
  // Synced field: auto-synced, do not modify or delete
  questionRound: bigint("question_round", { mode: 'number' }),
  // Synced field: auto-synced, do not modify or delete
  questionContent: text("question_content"),
  // Synced field: auto-synced, do not modify or delete
  questionAttachmentResource: text("question_attachment_resource").array(),
  // Synced field: auto-synced, do not modify or delete
  questionAttachmentExtJson: text("question_attachment_ext_json"),
  // Synced field: auto-synced, do not modify or delete
  humanBaselineAnswer: text("human_baseline_answer"),
  // Synced field: auto-synced, do not modify or delete
  humanBaselineTime: numeric("human_baseline_time"),
  // Synced field: auto-synced, do not modify or delete
  examRubricJson: text("exam_rubric_json"),
  // Synced field: auto-synced, do not modify or delete
  failureSample: text("failure_sample").array(),
  // Synced field: auto-synced, do not modify or delete
  difficultyThresholdCheckJson: text("difficulty_threshold_check_json"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877437921552443").on(table.id),
  uniqueIndex("unq_1877437921554523").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const skillBusinessMethod06 = pgTable("skill_business_method_06", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  skillName: text("skill_name"),
  // Synced field: auto-synced, do not modify or delete
  sourceEvidence: text("source_evidence"),
  // Synced field: auto-synced, do not modify or delete
  skillDescription: text("skill_description"),
  // Synced field: auto-synced, do not modify or delete
  appVersion: text("app_version"),
  // Synced field: auto-synced, do not modify or delete
  skillPackage: text("skill_package").array(),
  // Synced field: auto-synced, do not modify or delete
  skillAddress: text("skill_address"),
  // Synced field: auto-synced, do not modify or delete
  skillMd: text("skill_md"),
  // Synced field: auto-synced, do not modify or delete
  appReferences: text("app_references"),
  // Synced field: auto-synced, do not modify or delete
  appScripts: text("app_scripts"),
  // Synced field: auto-synced, do not modify or delete
  triggerCondition: text("trigger_condition"),
  // Synced field: auto-synced, do not modify or delete
  appInput: text("app_input"),
  // Synced field: auto-synced, do not modify or delete
  outputProduct: text("output_product"),
  // Synced field: auto-synced, do not modify or delete
  judgmentCriteria: text("judgment_criteria"),
  // Synced field: auto-synced, do not modify or delete
  exceptionEscalation: text("exception_escalation"),
  // Synced field: auto-synced, do not modify or delete
  timeConsumption: numeric("time_consumption"),
  // Synced field: auto-synced, do not modify or delete
  accuracyRate: numeric("accuracy_rate"),
  // Synced field: auto-synced, do not modify or delete
  reworkRate: numeric("rework_rate"),
  // Synced field: auto-synced, do not modify or delete
  closedLoopTimeliness: numeric("closed_loop_timeliness"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877437407544363").on(table.id),
  uniqueIndex("unq_1877437407545355").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const mcp05 = pgTable("mcp_05", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  mcpName: text("mcp_name"),
  // Synced field: auto-synced, do not modify or delete
  mcpConfig: text("mcp_config"),
  // Synced field: auto-synced, do not modify or delete
  usedTool: text("used_tool"),
  // Synced field: auto-synced, do not modify or delete
  sourceMaterial: text("source_material"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877460366097495").on(table.id),
  uniqueIndex("unq_1877460366097527").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const workflowSubstep = pgTable("workflow_substep", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  substepName: text("substep_name"),
  // Synced field: auto-synced, do not modify or delete
  appSequence: bigint("app_sequence", { mode: 'number' }),
  // Synced field: auto-synced, do not modify or delete
  businessWorkflow: text("business_workflow"),
  // Synced field: auto-synced, do not modify or delete
  sourceEvidence: text("source_evidence"),
  // Synced field: auto-synced, do not modify or delete
  taskType: text("task_type"),
  // Synced field: auto-synced, do not modify or delete
  triggerCondition: text("trigger_condition"),
  // Synced field: auto-synced, do not modify or delete
  appInput: text("app_input"),
  // Synced field: auto-synced, do not modify or delete
  taskKeyAction: text("task_key_action"),
  // Synced field: auto-synced, do not modify or delete
  appOutput: text("app_output"),
  // Synced field: auto-synced, do not modify or delete
  exception: text("exception"),
  // Synced field: auto-synced, do not modify or delete
  collaborationObject: text("collaboration_object"),
  // Synced field: auto-synced, do not modify or delete
  isHiddenWork: text("is_hidden_work"),
  // Synced field: auto-synced, do not modify or delete
  whoConfirm: text("who_confirm"),
  // Synced field: auto-synced, do not modify or delete
  whereConfirm: text("where_confirm"),
  // Synced field: auto-synced, do not modify or delete
  confirmTime: numeric("confirm_time"),
  // Synced field: auto-synced, do not modify or delete
  timeoutHandling: text("timeout_handling"),
  // Synced field: auto-synced, do not modify or delete
  aiIncompetentReason: text("ai_incompetent_reason"),
  // Synced field: auto-synced, do not modify or delete
  aiPrepareContent: text("ai_prepare_content"),
  // Synced field: auto-synced, do not modify or delete
  aiNotDoContent: text("ai_not_do_content"),
  // Synced field: auto-synced, do not modify or delete
  difficultyCoefficient: numeric("difficulty_coefficient"),
  // Synced field: auto-synced, do not modify or delete
  difficultyDescription: text("difficulty_description"),
  // Synced field: auto-synced, do not modify or delete
  expertApproach: text("expert_approach"),
  // Synced field: auto-synced, do not modify or delete
  aiCompletablePart: text("ai_completable_part"),
  // Synced field: auto-synced, do not modify or delete
  humanRequiredPart: text("human_required_part"),
  // Synced field: auto-synced, do not modify or delete
  keyDependency: text("key_dependency"),
  // Synced field: auto-synced, do not modify or delete
  preAiManualTime: numeric("pre_ai_manual_time"),
  // Synced field: auto-synced, do not modify or delete
  aiTaskRatio: numeric("ai_task_ratio"),
  // Synced field: auto-synced, do not modify or delete
  humanAiRatio: numeric("human_ai_ratio"),
  // Synced field: auto-synced, do not modify or delete
  pureManualRatio: numeric("pure_manual_ratio"),
  // Synced field: auto-synced, do not modify or delete
  aiOpportunityAcceptance: text("ai_opportunity_acceptance"),
  // Synced field: auto-synced, do not modify or delete
  valueBaselineKeyNum: text("value_baseline_key_num"),
  // Synced field: auto-synced, do not modify or delete
  preconditionNote: text("precondition_note"),
  // Synced field: auto-synced, do not modify or delete
  evaluationThreeElements: text("evaluation_three_elements"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877459877158948").on(table.id),
  uniqueIndex("unq_1877459877161028").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const businessScenarioWorkflow03 = pgTable("business_scenario_workflow_03", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  businessWorkflowScene: text("business_workflow_scene"),
  // Synced field: auto-synced, do not modify or delete
  relatedPost: text("related_post"),
  // Synced field: auto-synced, do not modify or delete
  relatedSkill: text("related_skill"),
  // Synced field: auto-synced, do not modify or delete
  relatedMcp: text("related_mcp"),
  // Synced field: auto-synced, do not modify or delete
  sourceEvidence: text("source_evidence"),
  // Synced field: auto-synced, do not modify or delete
  sceneIntro: text("scene_intro"),
  // Synced field: auto-synced, do not modify or delete
  workContentDesc: text("work_content_desc"),
  // Synced field: auto-synced, do not modify or delete
  triggerCondition: text("trigger_condition"),
  // Synced field: auto-synced, do not modify or delete
  frequencyTimeliness: text("frequency_timeliness"),
  // Synced field: auto-synced, do not modify or delete
  inputProvider: text("input_provider"),
  // Synced field: auto-synced, do not modify or delete
  outputResult: text("output_result"),
  // Synced field: auto-synced, do not modify or delete
  outputRecipient: text("output_recipient"),
  // Synced field: auto-synced, do not modify or delete
  totalTime: numeric("total_time"),
  // Synced field: auto-synced, do not modify or delete
  acceptanceCriteria: text("acceptance_criteria"),
  // Synced field: auto-synced, do not modify or delete
  corePainPoint: text("core_pain_point"),
  // Synced field: auto-synced, do not modify or delete
  customerFeedback: text("customer_feedback"),
  // Synced field: auto-synced, do not modify or delete
  consequenceOfMistake: text("consequence_of_mistake"),
  // Synced field: auto-synced, do not modify or delete
  priority: text("priority"),
  // Synced field: auto-synced, do not modify or delete
  executionFrequency: text("execution_frequency"),
  // Synced field: auto-synced, do not modify or delete
  dataIntegrity: text("data_integrity"),
  // Synced field: auto-synced, do not modify or delete
  serviceMethod: text("service_method"),
  // Synced field: auto-synced, do not modify or delete
  appStatus: text("app_status"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877460496031752").on(table.id),
  uniqueIndex("unq_1877460496031784").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const _00Function = pgTable("00_function", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  functionName: text("function_name"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877437219784747").on(table.id),
  uniqueIndex("unq_1877437219785739").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const post02 = pgTable("post_02", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  postName: text("post_name"),
  // Synced field: auto-synced, do not modify or delete
  industry: text("industry"),
  /**
   * 来源与证据
   */
  // Synced field: auto-synced, do not modify or delete
  sourceEvidence: jsonb("source_evidence"),
  // Synced field: auto-synced, do not modify or delete
  postDescription: text("post_description"),
  // Synced field: auto-synced, do not modify or delete
  postScale: text("post_scale"),
  // Synced field: auto-synced, do not modify or delete
  managementSpan: text("management_span"),
  // Synced field: auto-synced, do not modify or delete
  postValue: text("post_value"),
  // Synced field: auto-synced, do not modify or delete
  affiliatedDepartment: text("affiliated_department"),
  // Synced field: auto-synced, do not modify or delete
  scaleLeverage: text("scale_leverage"),
  // Synced field: auto-synced, do not modify or delete
  deliveryNote: text("delivery_note"),
  // Synced field: auto-synced, do not modify or delete
  jobPriority: text("job_priority"),
  // Synced field: auto-synced, do not modify or delete
  appFunction: text("app_function"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877460256563316").on(table.id),
  uniqueIndex("unq_1877460256565332").on(table.baseRecordId),
]);

// Synced table: data is auto-synced from external source. Do not rename or delete this table.
export const industry01 = pgTable("industry_01", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  // Synced field: auto-synced, do not modify or delete
  baseRecordId: varchar("base_record_id").unique(),
  // Synced field: auto-synced, do not modify or delete
  industryName: text("industry_name"),
  // Synced field: auto-synced, do not modify or delete
  scopeDefinition: text("scope_definition"),
  // Synced field: auto-synced, do not modify or delete
  collectionInstruction: text("collection_instruction"),
  // Synced field: auto-synced, do not modify or delete
  csmPersonInCharge: userProfileArray("csm_person_in_charge"),
  // Synced field: auto-synced, do not modify or delete
  preSalesPersonInCharge: userProfileArray("pre_sales_person_in_charge"),
  // Synced field: auto-synced, do not modify or delete
  industryCategory: text("industry_category"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`now()`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("unq_1877459749107719").on(table.id),
  uniqueIndex("unq_1877459749107751").on(table.baseRecordId),
]);

export const syncRun = pgTable("sync_run", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggerType: varchar("trigger_type", { length: 20 }).notNull().default('manual'),
  status: varchar("status", { length: 20 }).notNull().default('running'),
  startedAt: customTimestamptz("started_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  finishedAt: customTimestamptz("finished_at", { precision: 3 }),
  errorSummary: text("error_summary"),
  sourceType: varchar("source_type", { length: 20 }).notNull().default('bitable_sync'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_sync_run_status").on(table.status),
  index("idx_sync_run_started_at").on(table.startedAt),
]);

export const customerMaterial = pgTable("customer_material", {
  customerId: varchar("customer_id", { length: 32 }).primaryKey(),
  materialId: varchar("material_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_customer_material_material").on(table.materialId),
  foreignKey({
    columns: [table.customerId],
    foreignColumns: [customer.id],
    name: "customer_material_customer_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.materialId],
    foreignColumns: [material.id],
    name: "customer_material_material_id_fkey",
  }).onDelete("cascade"),
]);

export const skillMaterial = pgTable("skill_material", {
  skillId: varchar("skill_id", { length: 32 }).primaryKey(),
  materialId: varchar("material_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_skill_material_material").on(table.materialId),
  foreignKey({
    columns: [table.skillId],
    foreignColumns: [skill.id],
    name: "skill_material_skill_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.materialId],
    foreignColumns: [material.id],
    name: "skill_material_material_id_fkey",
  }).onDelete("cascade"),
]);

export const roleMaterial = pgTable("role_material", {
  roleId: varchar("role_id", { length: 32 }).primaryKey(),
  materialId: varchar("material_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_role_material_material").on(table.materialId),
  foreignKey({
    columns: [table.roleId],
    foreignColumns: [role.id],
    name: "role_material_role_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.materialId],
    foreignColumns: [material.id],
    name: "role_material_material_id_fkey",
  }).onDelete("cascade"),
]);

export const stepMaterial = pgTable("step_material", {
  stepId: varchar("step_id", { length: 32 }).primaryKey(),
  materialId: varchar("material_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_step_material_material").on(table.materialId),
  foreignKey({
    columns: [table.stepId],
    foreignColumns: [step.id],
    name: "step_material_step_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.materialId],
    foreignColumns: [material.id],
    name: "step_material_material_id_fkey",
  }).onDelete("cascade"),
]);

export const scenarioMaterial = pgTable("scenario_material", {
  scenarioId: varchar("scenario_id", { length: 32 }).primaryKey(),
  materialId: varchar("material_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_scenario_material_material").on(table.materialId),
  foreignKey({
    columns: [table.scenarioId],
    foreignColumns: [scenario.id],
    name: "scenario_material_scenario_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.materialId],
    foreignColumns: [material.id],
    name: "scenario_material_material_id_fkey",
  }).onDelete("cascade"),
]);

export const customerIndustry = pgTable("customer_industry", {
  customerId: varchar("customer_id", { length: 32 }).primaryKey(),
  industryId: varchar("industry_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_customer_industry_industry").on(table.industryId),
  foreignKey({
    columns: [table.customerId],
    foreignColumns: [customer.id],
    name: "customer_industry_customer_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.industryId],
    foreignColumns: [industry.id],
    name: "customer_industry_industry_id_fkey",
  }).onDelete("cascade"),
]);

export const caseScenario = pgTable("case_scenario", {
  caseId: varchar("case_id", { length: 32 }).primaryKey(),
  scenarioId: varchar("scenario_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_case_scenario_scenario").on(table.scenarioId),
  foreignKey({
    columns: [table.caseId],
    foreignColumns: [caseItem.id],
    name: "case_scenario_case_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.scenarioId],
    foreignColumns: [scenario.id],
    name: "case_scenario_scenario_id_fkey",
  }).onDelete("cascade"),
]);

export const caseRole = pgTable("case_role", {
  caseId: varchar("case_id", { length: 32 }).primaryKey(),
  roleId: varchar("role_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_case_role_role").on(table.roleId),
  foreignKey({
    columns: [table.caseId],
    foreignColumns: [caseItem.id],
    name: "case_role_case_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.roleId],
    foreignColumns: [role.id],
    name: "case_role_role_id_fkey",
  }).onDelete("cascade"),
]);

export const caseIndustry = pgTable("case_industry", {
  caseId: varchar("case_id", { length: 32 }).primaryKey(),
  industryId: varchar("industry_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_case_industry_industry").on(table.industryId),
  foreignKey({
    columns: [table.caseId],
    foreignColumns: [caseItem.id],
    name: "case_industry_case_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.industryId],
    foreignColumns: [industry.id],
    name: "case_industry_industry_id_fkey",
  }).onDelete("cascade"),
]);

export const caseCustomer = pgTable("case_customer", {
  caseId: varchar("case_id", { length: 32 }).primaryKey(),
  customerId: varchar("customer_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_case_customer_customer").on(table.customerId),
  foreignKey({
    columns: [table.caseId],
    foreignColumns: [caseItem.id],
    name: "case_customer_case_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.customerId],
    foreignColumns: [customer.id],
    name: "case_customer_customer_id_fkey",
  }).onDelete("cascade"),
]);

export const caseMaterial = pgTable("case_material", {
  caseId: varchar("case_id", { length: 32 }).primaryKey(),
  materialId: varchar("material_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_case_material_material").on(table.materialId),
  foreignKey({
    columns: [table.caseId],
    foreignColumns: [caseItem.id],
    name: "case_material_case_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.materialId],
    foreignColumns: [material.id],
    name: "case_material_material_id_fkey",
  }).onDelete("cascade"),
]);

export const scenarioSkill = pgTable("scenario_skill", {
  scenarioId: varchar("scenario_id", { length: 32 }).primaryKey(),
  skillId: varchar("skill_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_scenario_skill_skill").on(table.skillId),
  foreignKey({
    columns: [table.scenarioId],
    foreignColumns: [scenario.id],
    name: "scenario_skill_scenario_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.skillId],
    foreignColumns: [skill.id],
    name: "scenario_skill_skill_id_fkey",
  }).onDelete("cascade"),
]);

export const scenarioStep = pgTable("scenario_step", {
  scenarioId: varchar("scenario_id", { length: 32 }).primaryKey(),
  stepId: varchar("step_id", { length: 32 }).primaryKey(),
  stepOrder: integer("step_order").notNull().default(1),
}, (table) => [
  index("idx_scenario_step_step").on(table.stepId),
  foreignKey({
    columns: [table.scenarioId],
    foreignColumns: [scenario.id],
    name: "scenario_step_scenario_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.stepId],
    foreignColumns: [step.id],
    name: "scenario_step_step_id_fkey",
  }).onDelete("cascade"),
]);

export const roleScenario = pgTable("role_scenario", {
  roleId: varchar("role_id", { length: 32 }).primaryKey(),
  scenarioId: varchar("scenario_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_role_scenario_scenario").on(table.scenarioId),
  foreignKey({
    columns: [table.roleId],
    foreignColumns: [role.id],
    name: "role_scenario_role_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.scenarioId],
    foreignColumns: [scenario.id],
    name: "role_scenario_scenario_id_fkey",
  }).onDelete("cascade"),
]);

export const roleFunction = pgTable("role_function", {
  roleId: varchar("role_id", { length: 32 }).primaryKey(),
  functionId: varchar("function_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_role_function_function").on(table.functionId),
  foreignKey({
    columns: [table.roleId],
    foreignColumns: [role.id],
    name: "role_function_role_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.functionId],
    foreignColumns: [jobFunction.id],
    name: "role_function_function_id_fkey",
  }).onDelete("cascade"),
]);

export const industryRole = pgTable("industry_role", {
  industryId: varchar("industry_id", { length: 32 }).primaryKey(),
  roleId: varchar("role_id", { length: 32 }).primaryKey(),
}, (table) => [
  index("idx_industry_role_role").on(table.roleId),
  foreignKey({
    columns: [table.industryId],
    foreignColumns: [industry.id],
    name: "industry_role_industry_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.roleId],
    foreignColumns: [role.id],
    name: "industry_role_role_id_fkey",
  }).onDelete("cascade"),
]);

export const customer = pgTable("customer", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  risk: text("risk"),
  cooperation: varchar("cooperation", { length: 50 }),
  latestProgress: text("latest_progress"),
  opportunityWindow: text("opportunity_window"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_customer_name").on(table.name),
]);

export const caseItem = pgTable("case_item", {
  id: varchar("id", { length: 32 }).primaryKey(),
  deptName: varchar("dept_name", { length: 200 }),
  completeness: varchar("completeness", { length: 20 }),
  doubaoCapability: text("doubao_capability").array().default([]),
  complexity: varchar("complexity", { length: 50 }),
  commercialScore: integer("commercial_score"),
  info: text("info"),
  hasQuantResult: varchar("has_quant_result", { length: 10 }),
  externalLevel: varchar("external_level", { length: 20 }),
  domainL1: varchar("domain_l1", { length: 50 }),
  evalScore: integer("eval_score"),
  maturity: varchar("maturity", { length: 10 }),
  auditStatus: varchar("audit_status", { length: 20 }),
  recommendTag: varchar("recommend_tag", { length: 20 }),
  valueLevel: varchar("value_level", { length: 50 }),
  domainConfidence: varchar("domain_confidence", { length: 20 }),
  /**
   * @type { id: string; name: string }[]
   */
  owners: jsonb("owners"),
  caseDate: date("case_date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_case_maturity").on(table.maturity),
  index("idx_case_domain_l1").on(table.domainL1),
  index("idx_case_audit_status").on(table.auditStatus),
  index("idx_case_external_level").on(table.externalLevel),
  index("idx_case_completeness").on(table.completeness),
]);

export const material = pgTable("material", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  rawUrl: text("raw_url"),
  updatedAt: customTimestamptz("updated_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_material_name").on(table.name),
]);

export const skill = pgTable("skill", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }),
  trigger: text("trigger"),
  input: text("input"),
  output: text("output"),
  criteria: text("criteria"),
  escalation: text("escalation"),
  scripts: text("scripts"),
  referenceDocs: text("reference_docs"),
  skillMd: text("skill_md"),
  url: varchar("url", { length: 500 }),
  /**
   * @type { token: string; name: string; size: number }[]
   */
  packages: jsonb("packages"),
  accuracy: numeric("accuracy"),
  reworkRate: numeric("rework_rate"),
  duration: varchar("duration", { length: 50 }),
  closureMinutes: integer("closure_minutes"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_skill_name").on(table.name),
]);

export const step = pgTable("step", {
  id: varchar("id", { length: 32 }).primaryKey(),
  orderNum: integer("order_num").notNull().default(1),
  name: varchar("name", { length: 200 }).notNull(),
  taskType: varchar("task_type", { length: 20 }),
  isHiddenWork: varchar("is_hidden_work", { length: 10 }),
  trigger: varchar("trigger", { length: 200 }),
  precondition: text("precondition"),
  input: varchar("input", { length: 200 }),
  output: varchar("output", { length: 200 }),
  action: text("action"),
  difficultyNote: text("difficulty_note"),
  aiRatio: integer("ai_ratio"),
  humanRatio: integer("human_ratio"),
  collabRatio: integer("collab_ratio"),
  confirmWho: varchar("confirm_who", { length: 100 }),
  confirmWhere: varchar("confirm_where", { length: 100 }),
  exception: varchar("exception", { length: 200 }),
  timeout: varchar("timeout", { length: 200 }),
  aiCanDo: text("ai_can_do"),
  aiNotDo: text("ai_not_do"),
  aiCannotReason: text("ai_cannot_reason"),
  aiPrepare: text("ai_prepare"),
  humanStillDo: text("human_still_do"),
  expertWay: text("expert_way"),
  keyMetrics: varchar("key_metrics", { length: 200 }),
  dependencies: text("dependencies"),
  collaborators: varchar("collaborators", { length: 200 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_step_name").on(table.name),
]);

export const scenario = pgTable("scenario", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  brief: text("brief"),
  detail: text("detail"),
  status: varchar("status", { length: 50 }),
  completeness: varchar("completeness", { length: 20 }),
  serviceMode: varchar("service_mode", { length: 50 }),
  priority: varchar("priority", { length: 10 }),
  trigger: text("trigger"),
  inputProvider: varchar("input_provider", { length: 200 }),
  output: text("output"),
  outputTarget: varchar("output_target", { length: 200 }),
  acceptance: text("acceptance"),
  pain: text("pain"),
  quote: text("quote"),
  consequence: text("consequence"),
  cadence: varchar("cadence", { length: 50 }),
  timeliness: text("timeliness"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_scenario_name").on(table.name),
  index("idx_scenario_priority").on(table.priority),
]);

export const role = pgTable("role", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  priority: varchar("priority", { length: 10 }),
  description: text("description"),
  scale: text("scale"),
  value: varchar("value", { length: 200 }),
  scaleLever: varchar("scale_lever", { length: 200 }),
  notes: text("notes"),
  managementSpan: text("management_span"),
  department: varchar("department", { length: 200 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_role_name").on(table.name),
]);

export const industry = pgTable("industry", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  scope: text("scope"),
  notes: text("notes"),
  roleCount: integer("role_count").default(0),
  scenarioCount: integer("scenario_count").default(0),
  stepCount: integer("step_count").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_industry_category").on(table.category),
  index("idx_industry_name").on(table.name),
]);

export const jobFunction = pgTable("job_function", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const skillSyncV = pgView("skill_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 100 }),
  description: text("description"),
  version: varchar("version", { length: 50 }),
  trigger: text("trigger"),
  input: text("input"),
  output: text("output"),
  criteria: text("criteria"),
  escalation: text("escalation"),
  scripts: text("scripts"),
  referenceDocs: text("reference_docs"),
  skillMd: text("skill_md"),
  url: varchar("url", { length: 500 }),
  packages: jsonb("packages"),
  accuracy: numeric("accuracy"),
  reworkRate: numeric("rework_rate"),
  duration: varchar("duration", { length: 50 }),
  closureMinutes: integer("closure_minutes"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const customerMaterialSyncV = pgView("customer_material_sync_v", {
  customerId: varchar("customer_id", { length: 32 }),
  materialId: varchar("material_id", { length: 32 }),
});

export const skillMaterialSyncV = pgView("skill_material_sync_v", {
  skillId: varchar("skill_id", { length: 32 }),
  materialId: varchar("material_id", { length: 32 }),
});

export const roleMaterialSyncV = pgView("role_material_sync_v", {
  roleId: varchar("role_id", { length: 32 }),
  materialId: varchar("material_id", { length: 32 }),
});

export const stepMaterialSyncV = pgView("step_material_sync_v", {
  stepId: varchar("step_id", { length: 32 }),
  materialId: varchar("material_id", { length: 32 }),
});

export const scenarioMaterialSyncV = pgView("scenario_material_sync_v", {
  scenarioId: varchar("scenario_id", { length: 32 }),
  materialId: varchar("material_id", { length: 32 }),
});

export const caseMaterialSyncV = pgView("case_material_sync_v", {
  caseId: varchar("case_id", { length: 32 }),
  materialId: varchar("material_id", { length: 32 }),
});

export const customerIndustrySyncV = pgView("customer_industry_sync_v", {
  customerId: varchar("customer_id", { length: 32 }),
  industryId: varchar("industry_id", { length: 32 }),
});

export const caseScenarioSyncV = pgView("case_scenario_sync_v", {
  caseId: varchar("case_id", { length: 32 }),
  scenarioId: varchar("scenario_id", { length: 32 }),
});

export const caseRoleSyncV = pgView("case_role_sync_v", {
  caseId: varchar("case_id", { length: 32 }),
  roleId: varchar("role_id", { length: 32 }),
});

export const caseCustomerSyncV = pgView("case_customer_sync_v", {
  caseId: varchar("case_id", { length: 32 }),
  customerId: varchar("customer_id", { length: 32 }),
});

export const caseIndustrySyncV = pgView("case_industry_sync_v", {
  caseId: varchar("case_id", { length: 32 }),
  industryId: varchar("industry_id", { length: 32 }),
});

export const roleFunctionSyncV = pgView("role_function_sync_v", {
  roleId: varchar("role_id", { length: 32 }),
  functionId: varchar("function_id", { length: 32 }),
});

export const scenarioSkillSyncV = pgView("scenario_skill_sync_v", {
  scenarioId: varchar("scenario_id", { length: 32 }),
  skillId: varchar("skill_id", { length: 32 }),
});

export const scenarioStepSyncV = pgView("scenario_step_sync_v", {
  scenarioId: varchar("scenario_id", { length: 32 }),
  stepId: varchar("step_id", { length: 32 }),
  stepOrder: integer("step_order"),
});

export const roleScenarioSyncV = pgView("role_scenario_sync_v", {
  roleId: varchar("role_id", { length: 32 }),
  scenarioId: varchar("scenario_id", { length: 32 }),
});

export const industryRoleSyncV = pgView("industry_role_sync_v", {
  industryId: varchar("industry_id", { length: 32 }),
  roleId: varchar("role_id", { length: 32 }),
});

export const customerSyncV = pgView("customer_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 100 }),
  risk: text("risk"),
  cooperation: varchar("cooperation", { length: 50 }),
  latestProgress: text("latest_progress"),
  opportunityWindow: text("opportunity_window"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const materialSyncV = pgView("material_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 200 }),
  url: varchar("url", { length: 500 }),
  rawUrl: text("raw_url"),
  updatedAt: customTimestamptz("updated_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const caseItemSyncV = pgView("case_item_sync_v", {
  id: varchar("id", { length: 32 }),
  deptName: varchar("dept_name", { length: 200 }),
  completeness: varchar("completeness", { length: 20 }),
  doubaoCapability: text("doubao_capability").array(),
  complexity: varchar("complexity", { length: 50 }),
  commercialScore: integer("commercial_score"),
  info: text("info"),
  hasQuantResult: varchar("has_quant_result", { length: 10 }),
  externalLevel: varchar("external_level", { length: 20 }),
  domainL1: varchar("domain_l1", { length: 50 }),
  evalScore: integer("eval_score"),
  maturity: varchar("maturity", { length: 10 }),
  auditStatus: varchar("audit_status", { length: 20 }),
  recommendTag: varchar("recommend_tag", { length: 20 }),
  valueLevel: varchar("value_level", { length: 50 }),
  domainConfidence: varchar("domain_confidence", { length: 20 }),
  owners: jsonb("owners"),
  caseDate: date("case_date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const stepSyncV = pgView("step_sync_v", {
  id: varchar("id", { length: 32 }),
  orderNum: integer("order_num"),
  name: varchar("name", { length: 200 }),
  taskType: varchar("task_type", { length: 20 }),
  isHiddenWork: varchar("is_hidden_work", { length: 10 }),
  trigger: varchar("trigger", { length: 200 }),
  precondition: text("precondition"),
  input: varchar("input", { length: 200 }),
  output: varchar("output", { length: 200 }),
  action: text("action"),
  difficultyNote: text("difficulty_note"),
  aiRatio: integer("ai_ratio"),
  humanRatio: integer("human_ratio"),
  collabRatio: integer("collab_ratio"),
  confirmWho: varchar("confirm_who", { length: 100 }),
  confirmWhere: varchar("confirm_where", { length: 100 }),
  exception: varchar("exception", { length: 200 }),
  timeout: varchar("timeout", { length: 200 }),
  aiCanDo: text("ai_can_do"),
  aiNotDo: text("ai_not_do"),
  aiCannotReason: text("ai_cannot_reason"),
  aiPrepare: text("ai_prepare"),
  humanStillDo: text("human_still_do"),
  expertWay: text("expert_way"),
  keyMetrics: varchar("key_metrics", { length: 200 }),
  dependencies: text("dependencies"),
  collaborators: varchar("collaborators", { length: 200 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const scenarioSyncV = pgView("scenario_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 200 }),
  brief: text("brief"),
  detail: text("detail"),
  status: varchar("status", { length: 50 }),
  completeness: varchar("completeness", { length: 20 }),
  serviceMode: varchar("service_mode", { length: 50 }),
  priority: varchar("priority", { length: 10 }),
  trigger: text("trigger"),
  inputProvider: varchar("input_provider", { length: 200 }),
  output: text("output"),
  outputTarget: varchar("output_target", { length: 200 }),
  acceptance: text("acceptance"),
  pain: text("pain"),
  quote: text("quote"),
  consequence: text("consequence"),
  cadence: varchar("cadence", { length: 50 }),
  timeliness: text("timeliness"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const roleSyncV = pgView("role_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 200 }),
  priority: varchar("priority", { length: 10 }),
  description: text("description"),
  scale: text("scale"),
  value: varchar("value", { length: 200 }),
  scaleLever: varchar("scale_lever", { length: 200 }),
  notes: text("notes"),
  managementSpan: text("management_span"),
  department: varchar("department", { length: 200 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const industrySyncV = pgView("industry_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 100 }),
  category: varchar("category", { length: 50 }),
  scope: text("scope"),
  notes: text("notes"),
  roleCount: integer("role_count"),
  scenarioCount: integer("scenario_count"),
  stepCount: integer("step_count"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const jobFunctionSyncV = pgView("job_function_sync_v", {
  id: varchar("id", { length: 32 }),
  name: varchar("name", { length: 100 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

// table aliases
export const _00FunctionTable = _00Function;
export const _10CaseDataDetailTable = _10CaseDataDetail;
export const _12ClientTable = _12Client;
export const businessScenarioWorkflow03Table = businessScenarioWorkflow03;
export const case11Table = case11;
export const caseCustomerTable = caseCustomer;
export const caseCustomerSyncVTable = caseCustomerSyncV;
export const caseIndustryTable = caseIndustry;
export const caseIndustrySyncVTable = caseIndustrySyncV;
export const caseItemTable = caseItem;
export const caseItemSyncVTable = caseItemSyncV;
export const caseMaterialTable = caseMaterial;
export const caseMaterialSyncVTable = caseMaterialSyncV;
export const caseRoleTable = caseRole;
export const caseRoleSyncVTable = caseRoleSyncV;
export const caseScenarioTable = caseScenario;
export const caseScenarioSyncVTable = caseScenarioSyncV;
export const customerTable = customer;
export const customerIndustryTable = customerIndustry;
export const customerIndustrySyncVTable = customerIndustrySyncV;
export const customerMaterialTable = customerMaterial;
export const customerMaterialSyncVTable = customerMaterialSyncV;
export const customerSyncVTable = customerSyncV;
export const frontEvaluationCardTable = frontEvaluationCard;
export const industryTable = industry;
export const industry01Table = industry01;
export const industryRoleTable = industryRole;
export const industryRoleSyncVTable = industryRoleSyncV;
export const industrySyncVTable = industrySyncV;
export const jobFunctionTable = jobFunction;
export const jobFunctionSyncVTable = jobFunctionSyncV;
export const materialTable = material;
export const materialSyncVTable = materialSyncV;
export const mcp05Table = mcp05;
export const post02Table = post02;
export const productSameTopicRunCompareTable = productSameTopicRunCompare;
export const roleTable = role;
export const roleFunctionTable = roleFunction;
export const roleFunctionSyncVTable = roleFunctionSyncV;
export const roleMaterialTable = roleMaterial;
export const roleMaterialSyncVTable = roleMaterialSyncV;
export const roleScenarioTable = roleScenario;
export const roleScenarioSyncVTable = roleScenarioSyncV;
export const roleSyncVTable = roleSyncV;
export const scenarioTable = scenario;
export const scenarioMaterialTable = scenarioMaterial;
export const scenarioMaterialSyncVTable = scenarioMaterialSyncV;
export const scenarioSkillTable = scenarioSkill;
export const scenarioSkillSyncVTable = scenarioSkillSyncV;
export const scenarioStepTable = scenarioStep;
export const scenarioStepSyncVTable = scenarioStepSyncV;
export const scenarioSyncVTable = scenarioSyncV;
export const seedQuestionBank09Table = seedQuestionBank09;
export const skillTable = skill;
export const skillBusinessMethod06Table = skillBusinessMethod06;
export const skillMaterialTable = skillMaterial;
export const skillMaterialSyncVTable = skillMaterialSyncV;
export const skillSyncVTable = skillSyncV;
export const stepTable = step;
export const stepMaterialTable = stepMaterial;
export const stepMaterialSyncVTable = stepMaterialSyncV;
export const stepSyncVTable = stepSyncV;
export const syncRunTable = syncRun;
export const syncTableLogTable = syncTableLog;
export const workflowSubstepTable = workflowSubstep;
