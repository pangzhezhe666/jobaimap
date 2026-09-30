import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  FileText,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Target,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchCustomerDetail } from '@client/src/api';
import type { CustomerDetail } from '@shared/api.interface';
import { Card, CardHeader, CardTitle, CardContent } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const cooperationVariantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
  '深度合作': 'default',
  '战略合作': 'default',
  '常规合作': 'secondary',
  '潜力客户': 'outline',
  '待拓展': 'outline',
};

const riskVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  '低风险': 'secondary',
  '中风险': 'outline',
  '高风险': 'destructive',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: CustomerDetail = await fetchCustomerDetail(id);
      setCustomer(data);
    } catch (err) {
      logger.error('获取客户详情失败', err);
      setError('获取客户详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive">{error || '客户不存在'}</div>
        <Button onClick={loadDetail} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  const cooperationVariant = customer.cooperation
    ? cooperationVariantMap[customer.cooperation] ?? 'outline'
    : 'outline';

  const riskVariant = customer.risk
    ? riskVariantMap[customer.risk] ?? 'outline'
    : 'outline';

  return (
    <div className="space-y-6">
      {/* 面包屑与返回 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        <span>客户详情</span>
      </div>

      {/* 头部信息卡 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{customer.name}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {customer.cooperation && (
                    <Badge variant={cooperationVariant}>{customer.cooperation}</Badge>
                  )}
                  {customer.risk && (
                    <Badge variant={riskVariant}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {customer.risk}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customer.latestProgress && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  最新进展
                </div>
                <div className="text-sm text-foreground leading-relaxed">
                  {customer.latestProgress}
                </div>
              </div>
            )}
            {customer.opportunityWindow && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Target className="w-3.5 h-3.5" />
                  机会窗口期
                </div>
                <div className="text-sm text-foreground leading-relaxed">
                  {customer.opportunityWindow}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 关联行业 */}
      {customer.industries && customer.industries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">关联行业</CardTitle>
                <Badge variant="secondary">{customer.industries.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customer.industries.map(industry => (
                <Link
                  key={industry.id}
                  to={`/industries/${industry.id}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-[hsla(220_14%_14%_0.03)] transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {industry.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{industry.roleCount} 个岗位</span>
                      <span>·</span>
                      <span>{industry.scenarioCount} 个场景</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关联案例 */}
      {customer.cases && customer.cases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">关联案例</CardTitle>
                <Badge variant="secondary">{customer.cases.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customer.cases.map(caseItem => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="block p-3.5 rounded-lg border border-border hover:bg-[hsla(220_14%_14%_0.03)] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {caseItem.deptName || '未命名案例'}
                        </span>
                        {caseItem.completeness && (
                          <Badge variant="outline" className="text-[10px]">
                            {caseItem.completeness}
                          </Badge>
                        )}
                        {caseItem.maturity && (
                          <Badge variant="secondary" className="text-[10px]">
                            {caseItem.maturity}
                          </Badge>
                        )}
                      </div>
                      {caseItem.info && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {caseItem.info}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {caseItem.complexity && <span>复杂度：{caseItem.complexity}</span>}
                        {caseItem.commercialScore !== null &&
                          caseItem.commercialScore !== undefined && (
                            <span>商业价值：{caseItem.commercialScore} 分</span>
                          )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关联资料 */}
      {customer.materials && customer.materials.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">关联资料</CardTitle>
                <Badge variant="secondary">{customer.materials.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customer.materials.map(material => (
                <UniversalLink
                  key={material.id}
                  to={material.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-[hsla(220_14%_14%_0.03)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-secondary text-secondary-foreground flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {material.name}
                      </div>
                      {material.updatedAt && (
                        <div className="text-xs text-muted-foreground">
                          更新于 {material.updatedAt}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </UniversalLink>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空数据兜底：既没有行业也没有案例也没有资料 */}
      {(!customer.industries || customer.industries.length === 0) &&
        (!customer.cases || customer.cases.length === 0) &&
        (!customer.materials || customer.materials.length === 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center text-muted-foreground text-sm">
                该客户暂无关联数据
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
