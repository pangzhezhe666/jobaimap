import {
  AlertTriangle,
  Quote,
  Brain,
  FileText,
  ChevronRight,
  Plug,
  ExternalLink,
  Users,
} from 'lucide-react';
import type {
  ScenarioDetail,
  ScenarioSummary,
  SkillSummary,
  StepSummary,
  CaseSummary,
  MaterialSummary,
  RoleSummary,
} from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@client/src/components/ui/empty';
import { priorityVariant, statusVariant } from './ScenarioDirectory';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

/* ─── spotlight 痛点卡 ─────────────────────────────────── */
function Spotlight({ pain }: { pain: string }) {
  return (
    <div className="spotlight rounded-[10px] bg-[var(--bg-base)] border border-[var(--line-card)] p-4 pl-5">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="text-[#ff811a] shrink-0 mt-0.5"
          strokeWidth={1.8}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[#ff811a] mb-1">场景核心痛点</div>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {pain}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 客户原声引用 ────────────────────────────────────── */
function CustQuote({ quote }: { quote: string }) {
  return (
    <div className="cust-quote relative rounded-[10px] bg-[#fff8e6] border border-[#f5d98a]/50 p-4 pl-10">
      <Quote
        size={20}
        className="absolute left-3 top-3.5 text-[#f2a437]/40"
        strokeWidth={2.5}
      />
      <div className="text-sm text-[#6b4a00] leading-relaxed italic whitespace-pre-wrap">
        {quote}
      </div>
    </div>
  );
}

/* ─── 行式 dl 列表 ────────────────────────────────────── */
interface DlItem {
  label: string;
  value: string | null | undefined;
  rich?: boolean;
}

function DlList({ items }: { items: DlItem[] }) {
  const validItems = items.filter(it => it.value && it.value.trim().length > 0);
  if (validItems.length === 0) return null;
  return (
    <dl className="dl-list grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      {validItems.map((item: DlItem) => (
        <div
          key={item.label}
          className="dl-item flex gap-3 text-sm border-b border-border/60 pb-2 last:border-b-0"
        >
          <dt className="shrink-0 w-[100px] text-[var(--caption)] font-normal">
            {item.label}
          </dt>
          <dd
            className={`flex-1 min-w-0 text-foreground break-words ${
              item.rich ? 'whitespace-pre-wrap leading-relaxed' : ''
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ─── 三段占比条 ──────────────────────────────────────── */
function RatioBar({
  aiRatio,
  humanRatio,
  collabRatio,
}: {
  aiRatio: number | null;
  humanRatio: number | null;
  collabRatio: number | null;
}) {
  const ai = aiRatio ?? 0;
  const human = humanRatio ?? 0;
  const collab = collabRatio ?? 0;
  const total = ai + human + collab || 1;
  const aiPct = Math.round((ai / total) * 100);
  const coPct = Math.round((collab / total) * 100);
  const huPct = Math.round((human / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#eef0f3] overflow-hidden flex">
        <div
          className="h-full bg-[#18b886]"
          style={{ width: `${aiPct}%` }}
        />
        <div
          className="h-full bg-[#f2a437]"
          style={{ width: `${coPct}%` }}
        />
        <div
          className="h-full bg-[#a8adb5]"
          style={{ width: `${huPct}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#18b886] inline-block" />
          AI {aiPct}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f2a437] inline-block" />
          协同 {coPct}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a8adb5] inline-block" />
          人工 {huPct}%
        </span>
      </div>
    </div>
  );
}

/* ─── 步骤卡片 ────────────────────────────────────────── */
function StepCard({
  step,
  index,
  total,
  onClick,
}: {
  step: StepSummary;
  index: number;
  total: number;
  onClick: () => void;
}) {
  const isLast = index === total - 1;
  return (
    <div className="relative flex gap-3">
      {/* 序号节点 + 时间线 */}
      <div className="flex flex-col items-center shrink-0 w-7">
        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 z-10 text-xs font-medium">
          {index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      {/* 步骤卡 */}
      <div
        onClick={onClick}
        className="flex-1 rounded-[8px] border border-[var(--line-card)] p-3.5 hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer mb-3 group"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {step.name}
          </h4>
          <ChevronRight
            size={14}
            className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors"
          />
        </div>
        {step.taskType && (
          <div className="text-xs text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <span className="text-primary font-medium">AI能完成的部分：</span>
            <span className="truncate">{step.taskType}</span>
          </div>
        )}
        <RatioBar
          aiRatio={step.aiRatio}
          humanRatio={step.humanRatio}
          collabRatio={step.collabRatio}
        />
      </div>
    </div>
  );
}

/* ─── 证据材料条目 ────────────────────────────────────── */
function EvidenceItem({ material }: { material: MaterialSummary }) {
  return (
    <div className="src-item flex items-center gap-3 py-3 border-b border-border/60 last:border-b-0">
      <div className="shrink-0 w-8 h-8 rounded-[6px] bg-[var(--primary-soft)] text-primary flex items-center justify-center">
        <FileText size={16} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{material.name}</div>
        {material.updatedAt && (
          <div className="text-xs text-muted-foreground mt-0.5">
            更新时间：{material.updatedAt}
          </div>
        )}
      </div>
      {material.url && (
        <UniversalLink
          to={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          打开材料
          <ExternalLink size={10} />
        </UniversalLink>
      )}
    </div>
  );
}

/* ─── 关联案例条目 ────────────────────────────────────── */
function CaseItem({
  caseItem,
  onClick,
}: {
  caseItem: CaseSummary;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="case-item rounded-[8px] border border-[var(--line-card)] p-3.5 hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {caseItem.deptName || '未命名案例'}
        </h4>
        <ChevronRight
          size={14}
          className="shrink-0 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors"
        />
      </div>
      {caseItem.info && (
        <div className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
          {caseItem.info}
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {caseItem.domainL1 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {caseItem.domainL1}
          </Badge>
        )}
        {caseItem.maturity && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {caseItem.maturity}
          </Badge>
        )}
        {caseItem.externalLevel && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
            {caseItem.externalLevel}
          </Badge>
        )}
      </div>
    </div>
  );
}

type TabKey = 'overview' | 'steps' | 'eval' | 'cases';

interface ScenarioDetailPanelProps {
  scenario: ScenarioSummary | null;
  detail: ScenarioDetail | null;
  detailLoading: boolean;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onSkillClick: (skill: SkillSummary) => void;
  onStepClick: (step: StepSummary) => void;
  onCaseClick: (caseItem: CaseSummary) => void;
  role?: RoleSummary | null;
}

export default function ScenarioDetailPanel({
  scenario,
  detail,
  detailLoading,
  activeTab,
  onTabChange,
  onSkillClick,
  onStepClick,
  onCaseClick,
  role,
}: ScenarioDetailPanelProps) {
  if (!scenario) {
    return (
      <div className="scn-detail rounded-[10px] border border-border bg-white p-12">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>请选择一个场景</EmptyTitle>
            <EmptyDescription>从左侧目录中选择场景查看详情</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const tabItems: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: '场景概览' },
    { key: 'steps', label: '工作流子步骤', count: detail?.steps?.length },
    { key: 'eval', label: '评测题卡' },
    {
      key: 'cases',
      label: '案例与证据',
      count:
        (detail?.materials?.length ?? 0) + (detail?.cases?.length ?? 0) ||
        undefined,
    },
  ];

  const evidenceList = detail?.materials ?? [];
  const caseList = detail?.cases ?? [];

  return (
    <div className="scn-detail rounded-[10px] border border-border bg-white">
      {/* 头部 */}
      <div className="scn-head px-6 pt-5 pb-5 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {role?.name && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0 h-5 font-normal"
            >
              <Users size={10} className="mr-1" />
              {role.name}
            </Badge>
          )}
          {scenario.priority && (
            <Badge
              variant={priorityVariant[scenario.priority] ?? 'outline'}
              className="text-xs px-2 py-0 h-5"
            >
              {scenario.priority}
            </Badge>
          )}
          {scenario.status && (
            <Badge
              variant={statusVariant[scenario.status] ?? 'outline'}
              className="text-xs px-2 py-0 h-5"
            >
              {scenario.status}
            </Badge>
          )}
          {scenario.serviceMode && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0 h-5 font-normal"
            >
              {scenario.serviceMode}
            </Badge>
          )}
          {scenario.completeness && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 h-5 font-normal"
            >
              {scenario.completeness}
            </Badge>
          )}
        </div>
        <h2 className="text-[20px] font-semibold text-foreground leading-7 mb-2">
          {scenario.name}
        </h2>
        {scenario.brief && (
          <p className="scn-lead text-sm text-muted-foreground leading-relaxed m-0">
            {scenario.brief}
          </p>
        )}
      </div>

      {/* 关联能力条 */}
      <div className="cap-strip px-6 py-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 关联 Skill */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                关联 Skill
              </span>
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 h-4 font-normal"
              >
                {detail?.skills?.length ?? 0}
              </Badge>
            </div>
            {detail?.skills && detail.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detail.skills.map((skill: SkillSummary) => (
                  <button
                    key={skill.id}
                    onClick={() => onSkillClick(skill)}
                    className="h-[26px] px-3 rounded-[13px] bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">暂无关联 Skill</div>
            )}
          </div>
          {/* 关联 MCP */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plug size={14} className="text-[#6b7280]" />
              <span className="text-sm font-medium text-foreground">
                关联 MCP
              </span>
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 h-4 font-normal"
              >
                0
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">暂无 MCP 记录</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="tagbar flex items-center gap-6 border-b border-border -mx-6 px-6">
          {tabItems.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`tag-tab relative py-3 text-sm transition-colors ${
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="tab-cnt ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] rounded-full bg-muted text-muted-foreground">
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="px-6 py-5">
        {detailLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            加载中…
          </div>
        ) : (
          <>
            {/* ─── Tab1: 场景概览 ─────────────────────── */}
            {activeTab === 'overview' && detail && (
              <div className="space-y-4">
                {detail.pain && <Spotlight pain={detail.pain} />}
                {detail.quote && <CustQuote quote={detail.quote} />}
                <DlList
                  items={[
                    { label: '触发条件', value: detail.trigger },
                    { label: '输入由谁提供', value: detail.inputProvider },
                    { label: '产出结果', value: detail.output },
                    { label: '输出交给谁', value: detail.outputTarget },
                    { label: '执行频率', value: detail.cadence },
                    { label: '频率与时效', value: detail.timeliness },
                    { label: '优先级', value: detail.priority },
                    { label: '数据完整度', value: detail.completeness },
                    { label: '状态', value: detail.status },
                    { label: '服务方式', value: detail.serviceMode },
                    { label: '做错后果', value: detail.consequence },
                    {
                      label: '完成验收标准',
                      value: detail.acceptance,
                      rich: true,
                    },
                    {
                      label: '详细工作内容',
                      value: detail.detail,
                      rich: true,
                    },
                  ]}
                />
              </div>
            )}

            {/* ─── Tab2: 工作流子步骤 ─────────────────── */}
            {activeTab === 'steps' && detail && (
              <div>
                <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground" />
                  点击任一步骤查看 AI 分工、边界、确认点、异常处理等全部字段
                </div>
                {detail.steps && detail.steps.length > 0 ? (
                  <div className="space-y-0">
                    {detail.steps.map((step: StepSummary, index: number) => (
                      <StepCard
                        key={step.id}
                        step={step}
                        index={index}
                        total={detail.steps!.length}
                        onClick={() => onStepClick(step)}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>暂无工作流子步骤</EmptyTitle>
                      <EmptyDescription>
                        该场景下还没有关联的工作流步骤
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            )}

            {/* ─── Tab3: 评测题卡 ─────────────────────── */}
            {activeTab === 'eval' && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>L1–L4 题卡暂无数据</EmptyTitle>
                  <EmptyDescription>
                    该场景的评测题卡尚未建立，可在治理后台维护 L1–L4 各层级题目
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {/* ─── Tab4: 案例与证据 ──────────────────── */}
            {activeTab === 'cases' && detail && (
              <div className="space-y-6">
                {/* 证据材料 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText
                      size={14}
                      className="text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <span className="text-sm font-medium text-foreground">
                      证据材料
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0 h-4 font-normal"
                    >
                      {evidenceList.length}
                    </Badge>
                  </div>
                  {evidenceList.length > 0 ? (
                    <div className="src-list -mx-1 px-1">
                      {evidenceList.map((m: MaterialSummary) => (
                        <EvidenceItem key={m.id} material={m} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground py-2">
                      暂无证据材料
                    </div>
                  )}
                </div>

                {/* 关联案例 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain
                      size={14}
                      className="text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <span className="text-sm font-medium text-foreground">
                      关联案例
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0 h-4 font-normal"
                    >
                      {caseList.length}
                    </Badge>
                  </div>
                  {caseList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {caseList.map((c: CaseSummary) => (
                        <CaseItem
                          key={c.id}
                          caseItem={c}
                          onClick={() => onCaseClick(c)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground py-2">
                      暂无关联案例
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
