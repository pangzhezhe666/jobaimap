import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ListOrdered,
  Brain,
  BookOpen,
  RefreshCw,
  ChevronRight,
  Users,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchRoleDetail, fetchScenarioDetail } from '@client/src/api';
import type {
  RoleDetail,
  ScenarioDetail,
  ScenarioSummary,
  SkillSummary,
  StepSummary,
  CaseSummary,
} from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  SkillDrawer,
  StepDrawer,
  CaseDrawer,
} from '@client/src/components/drawers';
import ScenarioDirectory from './ScenarioDirectory';
import ScenarioDetailPanel from './ScenarioDetailPanel';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

type TabKey = 'overview' | 'steps' | 'eval' | 'cases';

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[8px] bg-[var(--bg-content)] border border-[var(--line-card)]">
      <div className="w-9 h-9 rounded-[6px] bg-[var(--primary-soft)] flex items-center justify-center shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="text-xl font-semibold text-foreground leading-tight">
          {value}
        </div>
        <div className="text-xs text-[var(--caption)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function RoleFieldBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value || !value.trim()) return null;
  return (
    <div className="role-field-block border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
      <div className="text-xs text-[var(--caption)] font-medium mb-1.5 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
        {value}
      </div>
    </div>
  );
}

function RoleFieldsSection({ role }: { role: RoleDetail }) {
  const functionText = role.functions?.length ? role.functions.map((f: any) => f.name).join('、') : '';

  const fields = [
    { key: 'description', label: '岗位描述', value: role.description },
    { key: 'functions', label: '所属职能', value: functionText },
    { key: 'scale', label: '岗位规模', value: role.scale },
    { key: 'managementSpan', label: '管理跨度', value: role.managementSpan },
    { key: 'value', label: '岗位价值', value: role.value },
    { key: 'scaleLever', label: '规模杠杆', value: role.scaleLever },
    { key: 'notes', label: '交付提示/备注', value: role.notes },
  ];

  const validFields = fields.filter(
    f => f.value !== null && f.value !== undefined && String(f.value).trim().length > 0,
  );

  if (validFields.length === 0) return null;

  return (
    <div className="border border-[var(--line-card)] rounded-[10px] p-5 bg-background mb-5 space-y-4">
      <h3 className="text-sm font-medium text-foreground mb-0">岗位信息</h3>
      <div className="space-y-4">
        {validFields.map(field => (
          <RoleFieldBlock
            key={field.key}
            label={field.label}
            value={String(field.value)}
          />
        ))}
      </div>
    </div>
  );
}

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [scenarioDetail, setScenarioDetail] = useState<ScenarioDetail | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [skillDrawerOpen, setSkillDrawerOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const [stepDrawerOpen, setStepDrawerOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const loadRole = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: RoleDetail = await fetchRoleDetail(id);
      setRole(data);
      if (data.scenarios && data.scenarios.length > 0) {
        setActiveScenarioId(data.scenarios[0].id);
      }
    } catch (err) {
      logger.error('获取岗位详情失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioDetail = async (scenarioId: string) => {
    setScenarioLoading(true);
    try {
      const data: ScenarioDetail = await fetchScenarioDetail(scenarioId);
      setScenarioDetail(data);
    } catch (err) {
      logger.error('获取场景详情失败', err);
      setScenarioDetail(null);
    } finally {
      setScenarioLoading(false);
    }
  };

  useEffect(() => {
    loadRole();
  }, [id]);

  useEffect(() => {
    if (activeScenarioId) {
      loadScenarioDetail(activeScenarioId);
      setActiveTab('overview');
    }
  }, [activeScenarioId]);

  const activeScenario = useMemo<ScenarioSummary | null>(() => {
    if (!role?.scenarios || !activeScenarioId) return null;
    return (
      role.scenarios.find((s: ScenarioSummary) => s.id === activeScenarioId) ?? null
    );
  }, [role?.scenarios, activeScenarioId]);

  const handleSkillClick = (skill: SkillSummary) => {
    setSelectedSkillId(skill.id);
    setSkillDrawerOpen(true);
  };

  const handleStepClick = (step: StepSummary) => {
    setSelectedStepId(step.id);
    setStepDrawerOpen(true);
  };

  const handleCaseClick = (caseItem: CaseSummary) => {
    setSelectedCaseId(caseItem.id);
    setCaseDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">加载中…</div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive text-sm">{error || '未找到该岗位'}</div>
        <Button onClick={loadRole} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  const firstIndustry = role.industries?.[0];
  const scenarioCount = role.scenarios?.length ?? 0;
  const caseCount = role.cases?.length ?? 0;

  return (
    <div className="pb-14">
      {/* 面包屑 */}
      <div className="flex items-center flex-wrap gap-1 text-[13px] text-[var(--placeholder)] mb-[18px]">
        <Link to="/industries" className="text-[var(--caption)] hover:text-[var(--primary)] transition-colors">
          行业浏览
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--disabled)]" />
        {firstIndustry && (
          <>
            <Link
              to={`/industries/${firstIndustry.id}`}
              className="text-[var(--caption)] hover:text-[var(--primary)] transition-colors max-w-[280px] truncate"
            >
              {firstIndustry.name}
            </Link>
            <ChevronRight className="w-3 h-3 text-[var(--disabled)]" />
          </>
        )}
        <span className="text-[var(--title)] font-medium max-w-[320px] truncate">
          {role.name}
        </span>
      </div>

      {/* 岗位实体头部 */}
      <div
        className="border border-[var(--line-card)] rounded-[10px] p-[22px_24px] bg-background mb-5"
        data-ai-section-type="card-stat"
      >
        {/* 标签行 */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {firstIndustry?.name && (
            <Badge variant="secondary" className="text-[12px] h-[22px] px-2 rounded-[4px] font-normal">
              <Building2 className="w-3 h-3 mr-1" />
              {firstIndustry.name}
            </Badge>
          )}
          {role.priority && (
            <Badge variant="default" className="text-[12px] h-[22px] px-2 rounded-[4px]">
              {role.priority}
            </Badge>
          )}
          {role.department && (
            <Badge variant="outline" className="text-[12px] h-[22px] px-2 rounded-[4px] font-normal">
              <Users className="w-3 h-3 mr-1" />
              {role.department}
            </Badge>
          )}
        </div>

        {/* 岗位名称 */}
        <h1 className="text-[22px] font-semibold text-foreground leading-[30px] mb-0">
          {role.name}
        </h1>
      </div>

      {/* 岗位字段区（单列全宽） */}
      <RoleFieldsSection role={role} />

      {/* 岗位统计卡 */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
        data-ai-section-type="card-stat"
      >
        <StatCard label="业务场景" value={scenarioCount} icon={Zap} />
        <StatCard label="子步骤" value={role.stepCount ?? 0} icon={ListOrdered} />
        <StatCard label="关联Skill" value={role.skillCount ?? 0} icon={Brain} />
        <StatCard label="相关案例" value={caseCount} icon={BookOpen} />
      </div>

      {/* 场景工作台双栏布局 */}
      <div id="role-workbench" className="role-ws flex gap-5 items-start pt-3">
        <ScenarioDirectory
          scenarios={role.scenarios ?? []}
          activeScenarioId={activeScenarioId}
          onSelect={setActiveScenarioId}
        />

        <main className="flex-1 min-w-0">
          <ScenarioDetailPanel
            scenario={activeScenario}
            detail={scenarioDetail}
            detailLoading={scenarioLoading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSkillClick={handleSkillClick}
            onStepClick={handleStepClick}
            onCaseClick={handleCaseClick}
            role={role}
          />
        </main>
      </div>

      {/* 底部：来源与证据 */}
      {(role.materials?.length ?? 0) > 0 && (
        <div className="mt-8 border border-[var(--line-card)] rounded-[10px] p-5 bg-background">
          <h3 className="text-sm font-medium text-foreground mb-3">来源与证据</h3>
          <div className="space-y-2">
            {role.materials?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
                <BookOpen size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0 text-sm text-foreground truncate">
                  {m.name}
                </div>
                {m.url && (
                  <UniversalLink
                    to={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    打开
                    <ExternalLink size={10} />
                  </UniversalLink>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 在多维表格中查看 */}
      <div className="mt-4 text-center">
        <UniversalLink
          to="https://bytedance.larkoffice.com/base/VG5TbQo1KaRs1bsFzVzc6fNmnqg"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          在多维表格中查看该岗位
          <ExternalLink size={10} />
        </UniversalLink>
      </div>

      {/* Skill 抽屉 */}
      <SkillDrawer
        open={skillDrawerOpen}
        onOpenChange={setSkillDrawerOpen}
        skillId={selectedSkillId}
      />

      {/* 步骤抽屉 */}
      <StepDrawer
        open={stepDrawerOpen}
        onOpenChange={setStepDrawerOpen}
        stepId={selectedStepId}
      />

      {/* 案例抽屉 */}
      <CaseDrawer
        open={caseDrawerOpen}
        onOpenChange={setCaseDrawerOpen}
        caseId={selectedCaseId}
      />
    </div>
  );
}
