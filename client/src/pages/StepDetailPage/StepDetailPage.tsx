import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@client/src/components/ui/breadcrumb';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { fetchStepDetail } from '@client/src/api';
import type { StepDetail } from '@shared/api.interface';
import {
  ListChecks,
  Zap,
  Bot,
  Users,
  Handshake,
  AlertTriangle,
  Clock,
  FileText,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const StepDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStep = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: StepDetail = await fetchStepDetail(id);
      setStep(data);
    } catch (err) {
      logger.error('加载步骤详情失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStep();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-5 w-60" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !step) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4">
        <div className="text-destructive text-sm">{error || '步骤不存在'}</div>
        <button
          onClick={loadStep}
          className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-md text-sm border border-input hover:bg-[hsla(220_14%_14%_0.04)] transition-colors"
        >
          <RefreshCw size={14} />
          重试
        </button>
      </div>
    );
  }

  const ratioBars = [
    {
      label: 'AI 占比',
      value: step.aiRatio,
      color: 'bg-[hsl(221_83%_53%)]',
      icon: <Bot size={14} />,
    },
    {
      label: '人机协作',
      value: step.collabRatio,
      color: 'bg-[hsl(174_77%_46%)]',
      icon: <Handshake size={14} />,
    },
    {
      label: '人工作业',
      value: step.humanRatio,
      color: 'bg-[hsl(26_90%_49%)]',
      icon: <Users size={14} />,
    },
  ];

  const infoGroups = [
    {
      title: '基础信息',
      icon: <ListChecks size={16} />,
      fields: [
        { label: '任务类型', value: step.taskType },
        { label: '隐性工作', value: step.isHiddenWork },
        { label: '触发条件', value: step.trigger },
        { label: '前置条件', value: step.precondition },
      ],
    },
    {
      title: '输入输出',
      icon: <Zap size={16} />,
      fields: [
        { label: '输入', value: step.input },
        { label: '输出', value: step.output },
        { label: '动作', value: step.action },
      ],
    },
    {
      title: '质量与风险',
      icon: <AlertTriangle size={16} />,
      fields: [
        { label: '难度说明', value: step.difficultyNote },
        { label: '异常处理', value: step.exception },
        { label: '超时处理', value: step.timeout },
        { label: '关键指标', value: step.keyMetrics },
      ],
    },
    {
      title: '确认与协作',
      icon: <Users size={16} />,
      fields: [
        { label: '确认人', value: step.confirmWho },
        { label: '确认位置', value: step.confirmWhere },
        { label: '协作方', value: step.collaborators },
        { label: '依赖关系', value: step.dependencies },
      ],
    },
  ];

  const aiGroups = [
    {
      title: 'AI 可以做',
      value: step.aiCanDo,
      accent: 'text-[hsl(221_83%_53%)]',
      bg: 'bg-[hsla(221_83%_53%_0.06)]',
    },
    {
      title: 'AI 不应该做',
      value: step.aiNotDo,
      accent: 'text-[hsl(2_84%_62%)]',
      bg: 'bg-[hsla(2_84%_62%_0.06)]',
    },
    {
      title: 'AI 不能做的原因',
      value: step.aiCannotReason,
      accent: 'text-[hsl(26_90%_49%)]',
      bg: 'bg-[hsla(26_90%_49%_0.06)]',
    },
    {
      title: 'AI 前置准备',
      value: step.aiPrepare,
      accent: 'text-[hsl(174_77%_46%)]',
      bg: 'bg-[hsla(174_77%_46%_0.06)]',
    },
    {
      title: '人仍然负责',
      value: step.humanStillDo,
      accent: 'text-[hsl(130_54%_42%)]',
      bg: 'bg-[hsla(130_54%_42%_0.06)]',
    },
    {
      title: '专家做法',
      value: step.expertWay,
      accent: 'text-[hsl(292_54%_56%)]',
      bg: 'bg-[hsla(292_54%_56%_0.06)]',
    },
  ];

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
            <button
              onClick={() => navigate(-1)}
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              返回
            </button>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>步骤详情</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm">📋</span>
          <span className="text-sm text-muted-foreground">
            第 {step.orderNum} 步
          </span>
          {step.taskType && (
            <Badge variant="outline">{step.taskType}</Badge>
          )}
          {step.isHiddenWork && step.isHiddenWork === '是' && (
            <Badge variant="secondary">隐性工作</Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-foreground leading-8">
          {step.name}
        </h1>
      </div>

      {/* Ratio Cards */}
      <div className="grid grid-cols-3 gap-4" data-ai-section-type="card-stat">
        {ratioBars.map((item) => {
          const pct = item.value ?? 0;
          return (
            <Card key={item.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xl font-semibold text-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[hsl(220_14%_94%)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Groups */}
      <div className="grid grid-cols-2 gap-4">
        {infoGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{group.icon}</span>
                <CardTitle className="text-base font-medium">
                  {group.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {group.fields.map((field) => (
                <div key={field.label} className="flex gap-3">
                  <span className="text-sm text-muted-foreground w-20 flex-shrink-0">
                    {field.label}
                  </span>
                  <span className="text-sm text-foreground flex-1 break-words">
                    {field.value || '—'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Capability Groups */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          AI 能力边界
        </h2>
        <div className="grid grid-cols-2 gap-4" data-ai-section-type="card-list">
          {aiGroups.map((group) => (
            <Card
              key={group.title}
              className={`border-l-4 ${group.bg}`}
            >
              <CardContent className="p-5">
                <div className={`text-sm font-medium mb-2 ${group.accent}`}>
                  {group.title}
                </div>
                <div className="text-sm text-foreground leading-6 whitespace-pre-wrap">
                  {group.value || '—'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Related Scenarios */}
      {step.scenarios && step.scenarios.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              <CardTitle className="text-base font-medium">
                关联业务场景
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {step.scenarios.length} 个
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {step.scenarios.map((scenario) => (
                <Link
                  key={scenario.id}
                  to={`/scenarios/${scenario.id}`}
                  className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[hsl(220_14%_89%)] text-sm text-foreground hover:bg-[hsla(220_14%_14%_0.04)] transition-colors"
                >
                  <span>⚡</span>
                  <span className="truncate max-w-[200px]">
                    {scenario.name}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Materials */}
      {step.materials && step.materials.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              <CardTitle className="text-base font-medium">关联资料</CardTitle>
              <span className="text-xs text-muted-foreground">
                {step.materials.length} 个
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {step.materials.map((material) => (
                <UniversalLink
                  key={material.id}
                  to={material.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between h-10 px-3 rounded-md hover:bg-[hsla(220_14%_14%_0.04)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm">📄</span>
                    <span className="text-sm text-foreground truncate">
                      {material.name}
                    </span>
                  </div>
                  {material.updatedAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-3">
                      {material.updatedAt.slice(0, 10)}
                    </span>
                  )}
                </UniversalLink>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepDetailPage;
