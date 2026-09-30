import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  ArrowLeft,
  Zap,
  Users,
  ListChecks,
  Brain,
  FileText,
  BookOpen,
  Target,
  Play,
  Inbox,
  Send,
  CheckCircle2,
  AlertTriangle,
  Quote,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemHeader,
} from '@/components/ui/item';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { fetchScenarioDetail } from '@client/src/api';
import type { ScenarioDetail } from '@shared/api.interface';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  已上线: 'default',
  进行中: 'secondary',
  规划中: 'outline',
  已暂停: 'destructive',
};

const priorityVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  P0: 'destructive',
  P1: 'default',
  P2: 'secondary',
  P3: 'outline',
};

const completenessVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  完整: 'default',
  较完整: 'secondary',
  待完善: 'outline',
};

function InfoRow({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, count }: { title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
          {count !== undefined && (
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StepItem({ step, index }: { step: { id: string; orderNum: number; name: string; taskType: string | null; aiRatio: number | null; humanRatio: number | null; collabRatio: number | null }; index: number }) {
  const navigate = useNavigate();
  return (
    <Item
      variant="default"
      size="default"
      className="cursor-pointer hover:bg-accent/50 rounded-md"
      onClick={() => navigate(`/steps/${step.id}`)}
    >
      <ItemMedia variant="icon" className="bg-primary/10 text-primary font-semibold text-xs">
        {index + 1}
      </ItemMedia>
      <ItemContent>
        <ItemHeader>
          <ItemTitle className="hover:text-primary transition-colors">{step.name}</ItemTitle>
          <div className="flex items-center gap-1.5">
            {step.aiRatio !== null && step.aiRatio > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                AI {Math.round(step.aiRatio * 100)}%
              </Badge>
            )}
            {step.humanRatio !== null && step.humanRatio > 0 && (
              <Badge variant="outline" className="text-[10px] h-5">
                人 {Math.round(step.humanRatio * 100)}%
              </Badge>
            )}
            {step.collabRatio !== null && step.collabRatio > 0 && (
              <Badge variant="default" className="text-[10px] h-5">
                协作 {Math.round(step.collabRatio * 100)}%
              </Badge>
            )}
          </div>
        </ItemHeader>
        {step.taskType && <ItemDescription>{step.taskType}</ItemDescription>}
      </ItemContent>
    </Item>
  );
}

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: ScenarioDetail = await fetchScenarioDetail(id);
      setScenario(data);
    } catch (err) {
      logger.error('加载场景详情失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive">{error || '场景不存在'}</div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">行业地图</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">业务场景</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{scenario.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Zap size={18} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight truncate">{scenario.name}</h1>
          </div>
          {scenario.brief && (
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{scenario.brief}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {scenario.status && (
              <Badge variant={statusVariant[scenario.status] ?? 'outline'}>
                {scenario.status}
              </Badge>
            )}
            {scenario.completeness && (
              <Badge variant={completenessVariant[scenario.completeness] ?? 'outline'}>
                完整度：{scenario.completeness}
              </Badge>
            )}
            {scenario.priority && (
              <Badge variant={priorityVariant[scenario.priority] ?? 'outline'}>
                优先级：{scenario.priority}
              </Badge>
            )}
            {scenario.serviceMode && (
              <Badge variant="outline">
                服务模式：{scenario.serviceMode}
              </Badge>
            )}
            <Badge variant="secondary">
              共 {scenario.stepCount} 个步骤
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          返回
        </Button>
      </div>

      <Separator />

      {/* Core Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <InfoRow label="触发方式" value={scenario.trigger} icon={<Play size={16} />} />
        <InfoRow label="输入提供方" value={scenario.inputProvider} icon={<Inbox size={16} />} />
        <InfoRow label="产出物" value={scenario.output} icon={<Send size={16} />} />
        <InfoRow label="产出给谁" value={scenario.outputTarget} icon={<Users size={16} />} />
        <InfoRow label="验收标准" value={scenario.acceptance} icon={<CheckCircle2 size={16} />} />
        <InfoRow label="执行频率" value={scenario.cadence} icon={<Calendar size={16} />} />
        <InfoRow label="时效要求" value={scenario.timeliness} icon={<Clock size={16} />} />
      </div>

      {/* Detailed Description */}
      {scenario.detail && (
        <SectionCard title="场景详述" icon={<BookOpen size={16} />}>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{scenario.detail}</p>
        </SectionCard>
      )}

      {/* Pain & Consequence */}
      {(scenario.pain || scenario.consequence || scenario.quote) && (
        <div className="grid gap-4 md:grid-cols-2">
          {scenario.pain && (
            <SectionCard title="当前痛点" icon={<AlertTriangle size={16} />}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{scenario.pain}</p>
            </SectionCard>
          )}
          {scenario.consequence && (
            <SectionCard title="做不好的后果" icon={<Target size={16} />}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{scenario.consequence}</p>
            </SectionCard>
          )}
          {scenario.quote && (
            <SectionCard title="用户声音" icon={<Quote size={16} />}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap italic border-l-2 border-primary/30 pl-3">
                "{scenario.quote}"
              </p>
            </SectionCard>
          )}
        </div>
      )}

      {/* Steps */}
      <SectionCard title="工作步骤" icon={<ListChecks size={16} />} count={scenario.steps?.length}>
        {scenario.steps && scenario.steps.length > 0 ? (
          <ItemGroup>
            {scenario.steps.map((step, idx) => (
              <div key={step.id}>
                <StepItem step={step} index={idx} />
                {idx < scenario.steps.length - 1 && <ItemSeparator />}
              </div>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无工作步骤</EmptyTitle>
              <EmptyDescription>该场景下的工作步骤尚未录入</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SectionCard>

      {/* Related Roles */}
      <SectionCard title="关联岗位" icon={<Users size={16} />} count={scenario.roles?.length}>
        {scenario.roles && scenario.roles.length > 0 ? (
          <ItemGroup>
            {scenario.roles.map((role, idx) => (
              <div key={role.id}>
                <Item
                  variant="default"
                  size="default"
                  className="cursor-pointer hover:bg-accent/50 rounded-md"
                  onClick={() => navigate(`/roles/${role.id}`)}
                >
                  <ItemMedia variant="icon">
                    <Users size={16} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="hover:text-primary transition-colors">{role.name}</ItemTitle>
                      {role.priority && (
                        <Badge variant={priorityVariant[role.priority] ?? 'outline'}>
                          {role.priority}
                        </Badge>
                      )}
                    </ItemHeader>
                    {(role.department || role.description) && (
                      <ItemDescription>
                        {[role.department, role.description].filter(Boolean).join(' · ')}
                      </ItemDescription>
                    )}
                  </ItemContent>
                </Item>
                {idx < scenario.roles.length - 1 && <ItemSeparator />}
              </div>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无关联岗位</EmptyTitle>
              <EmptyDescription>该场景下的关联岗位尚未录入</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SectionCard>

      {/* Skills */}
      <SectionCard title="技能支撑" icon={<Brain size={16} />} count={scenario.skills?.length}>
        {scenario.skills && scenario.skills.length > 0 ? (
          <ItemGroup>
            {scenario.skills.map((skill, idx) => (
              <div key={skill.id}>
                <Item
                  variant="default"
                  size="default"
                  className="cursor-pointer hover:bg-accent/50 rounded-md"
                  onClick={() => navigate(`/skills/${skill.id}`)}
                >
                  <ItemMedia variant="icon" className="bg-purple-100 text-purple-600">
                    <Brain size={16} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="hover:text-primary transition-colors">{skill.name}</ItemTitle>
                      {skill.version && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          v{skill.version}
                        </Badge>
                      )}
                    </ItemHeader>
                    {skill.description && <ItemDescription>{skill.description}</ItemDescription>}
                  </ItemContent>
                </Item>
                {idx < scenario.skills.length - 1 && <ItemSeparator />}
              </div>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无技能支撑</EmptyTitle>
              <EmptyDescription>该场景下的 AI 技能尚未录入</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SectionCard>

      {/* Cases */}
      <SectionCard title="相关案例" icon={<FileText size={16} />} count={scenario.cases?.length}>
        {scenario.cases && scenario.cases.length > 0 ? (
          <ItemGroup>
            {scenario.cases.map((caseItem, idx) => (
              <div key={caseItem.id}>
                <Item
                  variant="default"
                  size="default"
                  className="cursor-pointer hover:bg-accent/50 rounded-md"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  <ItemMedia variant="icon" className="bg-amber-100 text-amber-600">
                    <FileText size={16} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="hover:text-primary transition-colors">
                        {caseItem.info || '未命名案例'}
                      </ItemTitle>
                      <div className="flex items-center gap-1.5">
                        {caseItem.maturity && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {caseItem.maturity}
                          </Badge>
                        )}
                        {caseItem.completeness && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {caseItem.completeness}
                          </Badge>
                        )}
                      </div>
                    </ItemHeader>
                    <ItemDescription>
                      {[caseItem.deptName, caseItem.domainL1].filter(Boolean).join(' · ')}
                    </ItemDescription>
                  </ItemContent>
                </Item>
                {idx < scenario.cases.length - 1 && <ItemSeparator />}
              </div>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无相关案例</EmptyTitle>
              <EmptyDescription>该场景下的相关案例尚未录入</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SectionCard>

      {/* Materials */}
      <SectionCard title="相关资料" icon={<BookOpen size={16} />} count={scenario.materials?.length}>
        {scenario.materials && scenario.materials.length > 0 ? (
          <ItemGroup>
            {scenario.materials.map((material, idx) => (
              <div key={material.id}>
                <Item
                  variant="default"
                  size="default"
                  className="cursor-pointer hover:bg-accent/50 rounded-md"
                  onClick={() => material.url && window.open(material.url, '_blank')}
                >
                  <ItemMedia variant="icon" className="bg-emerald-100 text-emerald-600">
                    <FileText size={16} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="hover:text-primary transition-colors">{material.name}</ItemTitle>
                      {material.updatedAt && (
                        <span className="text-xs text-muted-foreground">
                          更新于 {material.updatedAt}
                        </span>
                      )}
                    </ItemHeader>
                  </ItemContent>
                </Item>
                {idx < scenario.materials.length - 1 && <ItemSeparator />}
              </div>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无相关资料</EmptyTitle>
              <EmptyDescription>该场景下的相关资料尚未录入</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SectionCard>
    </div>
  );
}
