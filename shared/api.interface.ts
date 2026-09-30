export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IndustrySummary {
  id: string;
  name: string;
  category: string | null;
  scope: string | null;
  roleCount: number;
  scenarioCount: number;
  stepCount: number;
}

export interface IndustryDetail extends IndustrySummary {
  scope: string | null;
  notes: string | null;
  roles: RoleSummary[];
  customers: CustomerSummary[];
  cases: CaseSummary[];
}

export interface RoleSummary {
  id: string;
  name: string;
  priority: string | null;
  department: string | null;
  description: string | null;
  scenarioCount: number;
}

export interface RoleDetail extends RoleSummary {
  scale: string | null;
  value: string | null;
  scaleLever: string | null;
  notes: string | null;
  managementSpan: string | null;
  stepCount: number;
  skillCount: number;
  functions: JobFunctionSummary[];
  industries: IndustrySummary[];
  scenarios: ScenarioSummary[];
  cases: CaseSummary[];
  materials: MaterialSummary[];
}

export interface ScenarioSummary {
  id: string;
  name: string;
  brief: string | null;
  status: string | null;
  completeness: string | null;
  priority: string | null;
  serviceMode: string | null;
  stepCount: number;
}

export interface ScenarioDetail extends ScenarioSummary {
  detail: string | null;
  trigger: string | null;
  inputProvider: string | null;
  output: string | null;
  outputTarget: string | null;
  acceptance: string | null;
  pain: string | null;
  quote: string | null;
  consequence: string | null;
  cadence: string | null;
  timeliness: string | null;
  roles: RoleSummary[];
  steps: StepSummary[];
  skills: SkillSummary[];
  cases: CaseSummary[];
  materials: MaterialSummary[];
}

export interface StepSummary {
  id: string;
  orderNum: number;
  name: string;
  taskType: string | null;
  isHiddenWork: string | null;
  aiRatio: number | null;
  humanRatio: number | null;
  collabRatio: number | null;
}

export interface StepDetail extends StepSummary {
  trigger: string | null;
  precondition: string | null;
  input: string | null;
  output: string | null;
  action: string | null;
  difficultyNote: string | null;
  confirmWho: string | null;
  confirmWhere: string | null;
  exception: string | null;
  timeout: string | null;
  aiCanDo: string | null;
  aiNotDo: string | null;
  aiCannotReason: string | null;
  aiPrepare: string | null;
  humanStillDo: string | null;
  expertWay: string | null;
  keyMetrics: string | null;
  dependencies: string | null;
  collaborators: string | null;
  scenarios: ScenarioSummary[];
  materials: MaterialSummary[];
}

export interface SkillSummary {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  trigger: string | null;
}

export interface SkillDetail extends SkillSummary {
  input: string | null;
  output: string | null;
  criteria: string | null;
  escalation: string | null;
  accuracy: number | null;
  reworkRate: number | null;
  duration: string | null;
  closureMinutes: number | null;
  scripts: string | null;
  referenceDocs: string | null;
  skillMd: string | null;
  url: string | null;
  packages: SkillPackage[] | null;
  scenarios: ScenarioSummary[];
  materials: MaterialSummary[];
}

export interface SkillPackage {
  token: string;
  name: string;
  size: number;
}

export interface MaterialSummary {
  id: string;
  name: string;
  url: string | null;
  updatedAt: string | null;
}

export interface MaterialDetail extends MaterialSummary {
  rawUrl: string | null;
}

export interface CaseOwner {
  id: string;
  name: string;
}

export interface CaseSummary {
  id: string;
  deptName: string | null;
  completeness: string | null;
  complexity: string | null;
  commercialScore: number | null;
  info: string | null;
  hasQuantResult: string | null;
  externalLevel: string | null;
  domainL1: string | null;
  maturity: string | null;
  auditStatus: string | null;
  recommendTag: string | null;
  valueLevel: string | null;
  caseDate: string | null;
  owners: CaseOwner[] | null;
}

export interface CaseDetail extends CaseSummary {
  doubaoCapability: string[] | null;
  evalScore: number | null;
  domainConfidence: string | null;
  customers: CustomerSummary[];
  industries: IndustrySummary[];
  roles: RoleSummary[];
  scenarios: ScenarioSummary[];
  materials: MaterialSummary[];
}

export interface CustomerSummary {
  id: string;
  name: string;
  cooperation: string | null;
  risk: string | null;
}

export interface CustomerDetail extends CustomerSummary {
  latestProgress: string | null;
  opportunityWindow: string | null;
  industries: IndustrySummary[];
  cases: CaseSummary[];
  materials: MaterialSummary[];
}

export interface JobFunctionSummary {
  id: string;
  name: string;
}

export interface GlobalSearchResult {
  industries: IndustrySummary[];
  roles: RoleSummary[];
  scenarios: ScenarioSummary[];
  steps: StepSummary[];
  skills: SkillSummary[];
  cases: CaseSummary[];
  materials: MaterialSummary[];
  customers: CustomerSummary[];
}

export interface InsightStats {
  totalIndustries: number;
  totalRoles: number;
  totalScenarios: number;
  totalSteps: number;
  totalSkills: number;
  totalMaterials: number;
  totalCases: number;
  totalCustomers: number;
  totalFunctions: number;
}

export interface IndustryDistributionItem {
  id: string;
  name: string;
  roleCount: number;
  scenarioCount: number;
  stepCount: number;
}

export interface TopRoleItem {
  id: string;
  name: string;
  industries: string[];
  scenarioCount: number;
  stepCount: number;
}

export interface OrphanScenarioItem {
  id: string;
  name: string;
  brief: string | null;
}

export interface CompletenessItem {
  label: string;
  value: number;
  percent?: number;
}

export interface DomainDistributionItem {
  label: string;
  value: number;
  percent?: number;
}

export interface ScenarioInsights {
  byStatus: CompletenessItem[];
  byCompleteness: CompletenessItem[];
  byServiceMode: CompletenessItem[];
  byPriority: CompletenessItem[];
}

export interface CaseInsights {
  byMaturity: CompletenessItem[];
  byAuditStatus: CompletenessItem[];
  byExternalLevel: CompletenessItem[];
  byDomain: DomainDistributionItem[];
  byValueLevel: CompletenessItem[];
  avgCommercialScore: number;
  avgEvalScore: number;
}

export interface StepInsights {
  totalAiRatio: number;
  totalHumanRatio: number;
  totalCollabRatio: number;
  byTaskType: CompletenessItem[];
}

export interface GovernanceMetrics {
  roleCoverage: number;
  scenarioCoverage: number;
  stepCoverage: number;
  skillCoverage: number;
  materialCoverage: number;
}

export interface GlobalInsightsResponse {
  stats: InsightStats;
  scenarioInsights: ScenarioInsights;
  caseInsights: CaseInsights;
  stepInsights: StepInsights;
  governanceMetrics: GovernanceMetrics;
  topIndustries: IndustryDistributionItem[];
  topRoles: TopRoleItem[];
  m34Total: number;
  m34QuantUnpassed: number;
  m34QuantPassed: number;
  orphanCount: number;
  dataUpdatedAt: string | null;
  dataSource: 'snapshot' | 'bitable_sync' | 'db_sync_tables';
}

// ─── 治理看板类型 ─────────────────────────────────────────────

export interface GovernanceScaleBar {
  label: string;
  value: number;
  percent: number;
}

export interface GovernanceStackItem {
  label: string;
  value: number;
  percent: number;
  color?: string;
}

export interface GovernanceFunnelStep {
  label: string;
  value: number;
  ratio: number;
}

export type GovernanceStatus = 'ok' | 'good' | 'warn' | 'empty';

export interface GovernanceCoverageItem {
  field: string;
  filled: number;
  total: number;
  percent: number;
  status: GovernanceStatus;
}

export interface GovernanceSkillCompleteness {
  field: string;
  filled: number;
  total: number;
  percent: number;
}

export type GovernanceSignalTone = 'warn' | 'info';

export interface GovernanceSignalItem {
  label: string;
  value: number;
  percent?: number;
}

export interface GovernanceSignal {
  title: string;
  description: string;
  tone: GovernanceSignalTone;
  items: GovernanceSignalItem[];
}

export interface GovernanceData {
  roleScaleByFunction: GovernanceScaleBar[];
  scenarioScaleByIndustry: GovernanceScaleBar[];
  maturityStack: GovernanceStackItem[];
  dataCompletenessStack: GovernanceStackItem[];
  funnel: GovernanceFunnelStep[];
  fieldCoverage: GovernanceCoverageItem[];
  skillCompleteness: GovernanceSkillCompleteness[];
  signals: GovernanceSignal[];
  totalMaterials: number;
  totalCustomers: number;
  totalCases: number;
  totalRoles: number;
  totalIndustries: number;
  totalScenarios: number;
  totalSteps: number;
  totalSkills: number;
  totalFunctions: number;
  totalMcp: number;
}

export interface DataSourceTableItem {
  tableName: string;
  displayName: string;
  recordCount: number;
  sourceTable: string;
  status: 'healthy' | 'empty' | 'warning';
  lastUpdated: string | null;
}

export type DataSourceMode = 'db_sync_tables';

export interface SyncStatusResponse {
  mode: DataSourceMode;
  sourceLabel: string;
  sourceDescription: string;
  totalTables: number;
  totalRecords: number;
  lastSyncAt: string | null;
  latestDataAt: string | null;
  healthStatus: 'healthy' | 'degraded' | 'unknown';
  tables: DataSourceTableItem[];
  syncDisabled: boolean;
  syncDisabledReason: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  tablesFound: number;
  tables: { key: string; tableId: string; found: boolean }[];
}

export interface FullSyncTriggerResponse {
  success: boolean;
  message: string;
  runId?: string;
}

export interface ReloadCredentialsResponse {
  success: boolean;
  message: string;
}
