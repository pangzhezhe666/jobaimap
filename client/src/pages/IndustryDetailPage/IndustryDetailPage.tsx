import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  ArrowLeft,
  Building2,
  Users,
  Zap,
  ListOrdered,
  FileText,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Building,
  Search,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { fetchIndustryDetail } from '@client/src/api';
import type { IndustryDetail, RoleSummary, CustomerSummary, CaseSummary } from '@shared/api.interface';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Badge } from '@client/src/components/ui/badge';
import { CustomerDrawer, CaseDrawer } from '@client/src/components/drawers';

const PRIORITY_COLORS: Record<string, string> = {
  高: 'bg-[var(--danger)]',
  中: 'bg-[var(--warning)]',
  低: 'bg-[var(--success)]',
};

function priorityDotClass(priority: string | null): string {
  if (!priority) return 'bg-[var(--disabled)]';
  return PRIORITY_COLORS[priority] ?? 'bg-[var(--disabled)]';
}

export default function IndustryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<IndustryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  // Drawer states
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIndustryDetail(id);
      setData(result);
    } catch (err) {
      logger.error('加载行业详情失败', err);
      setError('加载行业详情失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const filteredRoles = useMemo(() => {
    if (!data) return [];
    if (!keyword) return data.roles;
    const kw = keyword.toLowerCase();
    return data.roles.filter((role: RoleSummary) => {
      const name = role.name?.toLowerCase() ?? '';
      const dept = role.department?.toLowerCase() ?? '';
      const desc = role.description?.toLowerCase() ?? '';
      return name.includes(kw) || dept.includes(kw) || desc.includes(kw);
    });
  }, [data, keyword]);

  const handleCustomerClick = (customerId: string) => {
    setActiveCustomerId(customerId);
    setCustomerDrawerOpen(true);
  };

  const handleCaseClick = (caseId: string) => {
    setActiveCaseId(caseId);
    setCaseDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-40 rounded-[10px]" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-destructive">{error || '加载失败'}</div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  const hasRoles = data.roleCount > 0;

  const factItems = [
    { label: '岗位', value: data.roleCount, icon: Users },
    { label: '业务场景', value: data.scenarioCount, icon: Zap },
    { label: '子步骤', value: data.stepCount, icon: ListOrdered },
    { label: '关联案例', value: data.cases.length, icon: BookOpen },
    { label: '关联客户', value: data.customers.length, icon: Building2 },
  ];

  return (
    <div className="pb-14">
      {/* Breadcrumb */}
      <div className="flex items-center flex-wrap gap-1 text-[13px] text-[var(--placeholder)] mb-[18px]">
        <Link to="/industries" className="text-[var(--caption)] hover:text-[var(--primary)] transition-colors">
          行业浏览
        </Link>
        <ChevronRight className="w-3 h-3 text-[var(--disabled)]" />
        <span className="text-[var(--title)] max-w-[380px] truncate">
          {data.name}
        </span>
      </div>

      {/* Entity Header */}
      <div
        className="border border-[var(--line-card)] rounded-[10px] p-[22px_24px] bg-background mb-5"
        data-ai-section-type="card-stat"
      >
        {/* Tag row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {data.category && (
            <Badge variant="secondary" className="text-[12px] h-[22px] px-2 rounded-[4px] font-normal">
              {data.category}
            </Badge>
          )}
          {hasRoles ? (
            <Badge variant="default" className="text-[12px] h-[22px] px-2 rounded-[4px] font-normal">
              {data.roleCount} 个岗位
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[12px] h-[22px] px-2 rounded-[4px] font-normal">
              待梳理
            </Badge>
          )}
        </div>

        {/* Title + back + lead */}
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2 h-8 w-8 text-[var(--caption)]"
              >
                <ArrowLeft size={18} />
              </Button>
              <h1 className="text-[22px] font-semibold leading-[32px] text-[var(--title)] m-0">
                {data.name}
              </h1>
            </div>
            {data.scope && (
              <p
                className="text-[14px] text-[var(--caption)] mt-2 mb-4 ml-10 leading-[22px] m-0"
                style={{ maxWidth: '680px' }}
              >
                {data.scope}
              </p>
            )}
          </div>
        </div>

        {/* DL fields */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-6 ml-10 pt-2 pb-4"
          style={{ borderTop: '1px solid var(--divider)' }}
        >
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[var(--placeholder)] flex-none">采集说明</span>
            <span className="text-[var(--caption)] truncate">持续建设中</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[var(--placeholder)] flex-none">CSM 负责人</span>
            <span className="text-[var(--caption)] truncate">待指派</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[var(--placeholder)] flex-none">售前负责人</span>
            <span className="text-[var(--caption)] truncate">待指派</span>
          </div>
        </div>

        {/* Fact grid - 5 items */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[14px] pt-4"
          style={{ borderTop: '1px solid var(--divider)' }}
        >
          {factItems.map((fact) => {
            const IconComp = fact.icon;
            return (
              <div key={fact.label} className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--placeholder)]">
                  <IconComp size={12} style={{ color: 'var(--placeholder)' }} />
                  {fact.label}
                </div>
                <div className="text-[20px] font-semibold text-[var(--title)] mt-1 leading-[28px]">
                  {fact.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roles Section */}
      {data.roles.length > 0 && (
        <div className="mt-9">
          <div className="flex items-center justify-between mb-[14px]">
            <h2 className="text-[16px] font-medium leading-[26px] text-[var(--title)] m-0 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)]" />
              岗位
              <span className="text-[12px] text-[var(--placeholder)] font-normal">
                （{filteredRoles.length}）
              </span>
            </h2>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2.5 flex-wrap mb-[22px]">
            <div className="relative flex items-center">
              <Search className="absolute left-[9px] w-4 h-4 text-[var(--placeholder)] pointer-events-none" />
              <Input
                type="text"
                placeholder="搜索岗位名称"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-[34px] w-[260px] max-w-full pl-8 pr-2.5 border-[var(--line-component)] rounded-[6px] text-[14px] bg-background focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
              />
            </div>
            <div className="text-[12px] text-[var(--placeholder)] ml-auto">
              共 {filteredRoles.length} 条
            </div>
          </div>

          {/* Role list */}
          {filteredRoles.length === 0 ? (
            <div className="border border-dashed border-[var(--line-component)] rounded-lg py-[34px] px-5 text-center text-[var(--placeholder)] bg-[var(--bg-content)]">
              <p className="m-0 text-[14px] text-[var(--caption)]">暂无匹配的岗位</p>
            </div>
          ) : (
            <div
              className="flex flex-col border border-[var(--line-card)] rounded-lg overflow-hidden bg-background"
              data-ai-section-type="card-list"
            >
              {filteredRoles.map((role: RoleSummary, index: number) => (
                <Link
                  key={role.id}
                  to={`/roles/${role.id}`}
                  className={`flex items-center gap-4 px-5 py-[15px] cursor-pointer transition-colors hover:bg-[var(--bg-content)] min-w-0 ${
                    index !== filteredRoles.length - 1
                      ? 'border-b border-[var(--divider)]'
                      : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-[var(--title)] flex items-center gap-2">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${priorityDotClass(
                          role.priority
                        )}`}
                      />
                      <span className="truncate">{role.name}</span>
                      {role.priority && (
                        <span
                          className="text-[11px] px-1.5 py-0 rounded"
                          style={{
                            background:
                              role.priority === '高'
                                ? 'hsl(2 90% 62% / 0.12)'
                                : role.priority === '中'
                                ? 'hsl(27 100% 55% / 0.12)'
                                : 'hsl(130 56% 47% / 0.12)',
                            color:
                              role.priority === '高'
                                ? 'var(--destructive)'
                                : role.priority === '中'
                                ? 'var(--warning)'
                                : 'var(--success)',
                          }}
                        >
                          {role.priority}优先级
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[var(--caption)] mt-0.5 truncate">
                      {role.description || role.department || '—'}
                    </div>
                  </div>
                  <div className="flex gap-[18px] flex-none">
                    <div className="text-center text-[11px] text-[var(--placeholder)]">
                      <b className="block text-[16px] font-semibold text-[var(--title)]">
                        {role.scenarioCount}
                      </b>
                      场景
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--placeholder)] flex-none" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customers Section */}
      {data.customers.length > 0 && (
        <div className="mt-9">
          <div className="flex items-center justify-between mb-[14px]">
            <h2 className="text-[16px] font-medium leading-[26px] text-[var(--title)] m-0 flex items-center gap-2">
              <Building className="w-4 h-4 text-[var(--primary)]" />
              关联客户
              <span className="text-[12px] text-[var(--placeholder)] font-normal">
                （{data.customers.length}）
              </span>
            </h2>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-ai-section-type="card-list"
          >
            {data.customers.map((customer: CustomerSummary) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerClick(customer.id)}
                className="block border border-[var(--line-card)] rounded-lg bg-background p-[18px_20px] transition-all hover:border-[var(--primary)] hover:shadow-md group min-h-[100px] cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-[34px] h-[34px] rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center flex-none">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-medium text-[var(--title)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {customer.name}
                    </div>
                    {customer.risk && (
                      <div className="text-[12px] text-destructive mt-1 truncate">
                        风险：{customer.risk}
                      </div>
                    )}
                    {!customer.risk && customer.cooperation && (
                      <div className="text-[12px] text-[var(--caption)] mt-1 truncate">
                        最新进展：{customer.cooperation}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {customer.cooperation && (
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                          }}
                        >
                          {customer.cooperation}
                        </span>
                      )}
                      <span
                        className="text-[11px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--bg-base)',
                          color: 'var(--caption)',
                        }}
                      >
                        资料 0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases Section */}
      {data.cases.length > 0 && (
        <div className="mt-9">
          <div className="flex items-center justify-between mb-[14px]">
            <h2 className="text-[16px] font-medium leading-[26px] text-[var(--title)] m-0 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--primary)]" />
              相关案例
              <span className="text-[12px] text-[var(--placeholder)] font-normal">
                （{Math.min(data.cases.length, 24)}）
              </span>
            </h2>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-ai-section-type="card-list"
          >
            {data.cases.slice(0, 24).map((caseItem: CaseSummary) => (
              <div
                key={caseItem.id}
                onClick={() => handleCaseClick(caseItem.id)}
                className="block border border-[var(--line-card)] rounded-lg bg-background p-[16px_18px] transition-all hover:border-[var(--primary)] hover:shadow-sm group cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-[30px] h-[30px] rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center flex-none mt-0.5">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {caseItem.deptName && (
                        <span className="text-[12px] font-medium text-[var(--title)] truncate">
                          {caseItem.deptName}
                        </span>
                      )}
                    </div>
                    {caseItem.info && (
                      <p className="text-[13px] text-[var(--caption)] mt-1 line-clamp-2 leading-[20px] m-0">
                        {caseItem.info}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {caseItem.domainL1 && (
                        <span
                          className="text-[11px] px-1.5 py-0 rounded"
                          style={{
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                          }}
                        >
                          {caseItem.domainL1}
                        </span>
                      )}
                      {caseItem.maturity && (
                        <span
                          className="text-[11px] px-1.5 py-0 rounded"
                          style={{
                            background: 'hsl(270 50% 65% / 0.12)',
                            color: 'hsl(270 50% 45%)',
                          }}
                        >
                          {caseItem.maturity}
                        </span>
                      )}
                      {/* customer name derived from case - not directly available on CaseSummary from industry endpoint, so skip */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Drawer */}
      <CustomerDrawer
        open={customerDrawerOpen}
        onOpenChange={setCustomerDrawerOpen}
        customerId={activeCustomerId}
        onCaseClick={(caseId: string) => {
          setCustomerDrawerOpen(false);
          setActiveCaseId(caseId);
          setCaseDrawerOpen(true);
        }}
      />

      {/* Case Drawer */}
      <CaseDrawer
        open={caseDrawerOpen}
        onOpenChange={setCaseDrawerOpen}
        caseId={activeCaseId}
        onCustomerClick={(customerId: string) => {
          setCaseDrawerOpen(false);
          setActiveCustomerId(customerId);
          setCustomerDrawerOpen(true);
        }}
      />
    </div>
  );
}
