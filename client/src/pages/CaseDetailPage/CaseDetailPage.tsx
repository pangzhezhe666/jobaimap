import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Users,
  Zap,
  FileText,
  Star,
  TrendingUp,
  Award,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchCaseDetail } from '@client/src/api';
import type { CaseDetail } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: CaseDetail = await fetchCaseDetail(id);
      setCaseData(data);
    } catch (err) {
      logger.error('获取案例详情失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading) {
    return <CaseDetailSkeleton />;
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive">{error || '未找到案例信息'}</div>
        <Button onClick={loadDetail} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  const statusVariant = (status: string | null): 'default' | 'secondary' | 'outline' => {
    if (!status) return 'outline';
    const s = status.toLowerCase();
    if (s.includes('已通过') || s.includes('完成') || s.includes('已上线') || s.includes('高')) return 'default';
    if (s.includes('进行中') || s.includes('待') || s.includes('中')) return 'secondary';
    return 'outline';
  };

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
            <BreadcrumbPage>案例详情</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back + Header */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          返回列表
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground truncate">
                {caseData.deptName || '未命名案例'}
              </h1>
              {caseData.auditStatus && (
                <Badge variant={statusVariant(caseData.auditStatus)}>
                  {caseData.auditStatus}
                </Badge>
              )}
              {caseData.recommendTag && (
                <Badge variant="default" className="bg-amber-500 border-amber-500/80">
                  <Star size={10} className="mr-1" />
                  {caseData.recommendTag}
                </Badge>
              )}
            </div>
            {caseData.info && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {caseData.info}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5" data-ai-section-type="card-stat">
        <MetricCard
          icon={<TrendingUp size={16} />}
          label="商业价值分"
          value={caseData.commercialScore !== null ? caseData.commercialScore.toFixed(1) : '—'}
          accent="text-emerald-600"
        />
        <MetricCard
          icon={<Award size={16} />}
          label="评估得分"
          value={caseData.evalScore !== null ? caseData.evalScore.toFixed(1) : '—'}
          accent="text-blue-600"
        />
        <MetricCard
          icon={<Target size={16} />}
          label="完整度"
          value={caseData.completeness || '—'}
          accent="text-violet-600"
        />
        <MetricCard
          icon={<Layers size={16} />}
          label="复杂度"
          value={caseData.complexity || '—'}
          accent="text-orange-600"
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Basic Info */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow label="一级领域" value={caseData.domainL1} icon={<Layers size={14} />} />
              <InfoRow label="成熟度" value={caseData.maturity} icon={<CheckCircle2 size={14} />} />
              <InfoRow label="价值层级" value={caseData.valueLevel} icon={<TrendingUp size={14} />} />
              <InfoRow
                label="对外等级"
                value={caseData.externalLevel}
                icon={<AlertCircle size={14} />}
              />
              <InfoRow
                label="量化成果"
                value={caseData.hasQuantResult}
                icon={<Target size={14} />}
              />
              <InfoRow label="案例时间" value={caseData.caseDate} icon={<Calendar size={14} />} />
              <InfoRow
                label="领域置信度"
                value={caseData.domainConfidence}
                icon={<Award size={14} />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Owners */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              负责人
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.owners && caseData.owners.length > 0 ? (
              <div className="space-y-2.5">
                {caseData.owners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center gap-2.5 py-1.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {owner.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm text-foreground font-medium truncate">
                      {owner.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">暂无负责人信息</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Doubao Capability */}
      {caseData.doubaoCapability && caseData.doubaoCapability.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              豆包能力
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {caseData.doubaoCapability.map((cap, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customers */}
        <RelatedListCard
          title="关联客户"
          icon={<Building2 size={16} className="text-blue-500" />}
          items={caseData.customers}
          renderItem={(c) => (
            <>
              <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
              {c.cooperation && (
                <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                  {c.cooperation}
                </Badge>
              )}
            </>
          )}
          emptyText="暂无关联客户"
        />

        {/* Industries */}
        <RelatedListCard
          title="关联行业"
          icon={<Briefcase size={16} className="text-emerald-500" />}
          items={caseData.industries}
          itemPathPrefix="/industries"
          renderItem={(i) => (
            <>
              <span className="text-sm font-medium text-foreground truncate">{i.name}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {i.scenarioCount} 个场景
              </span>
            </>
          )}
          emptyText="暂无关联行业"
        />

        {/* Roles */}
        <RelatedListCard
          title="关联岗位"
          icon={<Users size={16} className="text-violet-500" />}
          items={caseData.roles}
          itemPathPrefix="/roles"
          renderItem={(r) => (
            <>
              <span className="text-sm font-medium text-foreground truncate">{r.name}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {r.scenarioCount} 个场景
              </span>
            </>
          )}
          emptyText="暂无关联岗位"
        />

        {/* Scenarios */}
        <RelatedListCard
          title="关联场景"
          icon={<Zap size={16} className="text-amber-500" />}
          items={caseData.scenarios}
          itemPathPrefix="/scenarios"
          renderItem={(s) => (
            <>
              <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
              {s.status && (
                <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                  {s.status}
                </Badge>
              )}
            </>
          )}
          emptyText="暂无关联场景"
        />
      </div>

      {/* Materials */}
      <RelatedListCard
        title="关联资料"
        icon={<FileText size={16} className="text-rose-500" />}
        items={caseData.materials}
        itemPathPrefix="/materials"
        renderItem={(m) => (
          <>
            <FileText size={14} className="text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground truncate flex-1">{m.name}</span>
            {m.updatedAt && (
              <span className="text-xs text-muted-foreground shrink-0">{m.updatedAt}</span>
            )}
          </>
        )}
        emptyText="暂无关联资料"
        fullWidth
      />
    </div>
  );
};

/* ---------- Sub-components ---------- */

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

const MetricCard = ({ icon, label, value, accent = 'text-primary' }: MetricCardProps) => (
  <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className={`text-xl font-semibold ${accent}`}>{value}</div>
  </div>
);

interface InfoRowProps {
  label: string;
  value: string | null;
  icon: React.ReactNode;
}

const InfoRow = ({ label, value, icon }: InfoRowProps) => (
  <div className="flex items-start gap-2.5">
    <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground font-medium truncate">{value || '—'}</div>
    </div>
  </div>
);

interface RelatedItem {
  id: string;
  name?: string;
}

interface RelatedListCardProps<T extends RelatedItem> {
  title: string;
  icon: React.ReactNode;
  items: T[] | null | undefined;
  renderItem: (item: T) => React.ReactNode;
  itemPathPrefix?: string;
  emptyText: string;
  fullWidth?: boolean;
}

function RelatedListCard<T extends RelatedItem>({
  title,
  icon,
  items,
  renderItem,
  itemPathPrefix,
  emptyText,
  fullWidth,
}: RelatedListCardProps<T>) {
  const hasItems = items && items.length > 0;

  return (
    <Card className={fullWidth ? 'md:col-span-2' : ''}>
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
          {hasItems && (
            <span className="text-xs font-normal text-muted-foreground">
              · {items!.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="space-y-1">
            {items!.map((item) => {
              const content = (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-[hsla(220_14%_14%_0.03)] transition-colors min-w-0">
                  {renderItem(item)}
                </div>
              );
              return itemPathPrefix ? (
                <Link
                  key={item.id}
                  to={`${itemPathPrefix}/${item.id}`}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-6 text-center">{emptyText}</div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Skeleton ---------- */

const CaseDetailSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-4 w-28" />
    <div className="space-y-4">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-card-border p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="md:col-span-2 h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
    <Skeleton className="h-32 rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
    <Skeleton className="h-48 rounded-xl" />
  </div>
);

export default CaseDetailPage;
