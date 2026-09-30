import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchGlobalInsights, fetchGovernanceData, fetchOrphanScenarios } from '@client/src/api';
import type {
  GlobalInsightsResponse,
  CompletenessItem,
  IndustryDistributionItem,
  TopRoleItem,
  OrphanScenarioItem,
  DomainDistributionItem,
  GovernanceData,
  PaginatedResponse,
} from '@shared/api.interface';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@client/src/components/ui/drawer';
import GovernanceSection from './GovernanceSection';
import {
  Database,
  BookOpen,
  Workflow,
  Brain,
  Building2,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  Search,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ─── KPI 配置 ─────────────────────────────────────────────────
interface KpiConfig {
  key: string;
  label: string;
  icon: typeof Database;
  color: string;
  bgTint: string;
}

const KPI_CONFIG: KpiConfig[] = [
  { key: 'totalRecords', label: '总记录数', icon: Database, color: '#1456f0', bgTint: 'rgba(20,86,240,0.08)' },
  { key: 'totalCases', label: '案例总数', icon: BookOpen, color: '#35bd4b', bgTint: 'rgba(53,189,75,0.08)' },
  { key: 'processAssets', label: '流程资产', icon: Workflow, color: '#ff811a', bgTint: 'rgba(255,129,26,0.08)' },
  { key: 'totalSkills', label: 'Skill 总数', icon: Brain, color: '#722ed1', bgTint: 'rgba(114,46,209,0.08)' },
  { key: 'industriesWithRoles', label: '已梳理岗位的行业', icon: Building2, color: '#1456f0', bgTint: 'rgba(20,86,240,0.08)' },
  { key: 'rolesWithScenarios', label: '有场景的岗位', icon: Users, color: '#35bd4b', bgTint: 'rgba(53,189,75,0.08)' },
];

// ─── 环形图配色 ───────────────────────────────────────────────
const PRIORITY_COLORS = ['#f54a45', '#ff811a', '#35bd4b', '#8f959e'];
const DOMAIN_COLORS = [
  '#1456f0', '#35bd4b', '#ff811a', '#722ed1',
  '#13c2c2', '#eb2f96', '#faad14', '#f54a45',
];

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

// ─── 组件：KPI 卡片 ───────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number;
  subText: string;
  icon: typeof Database;
  color: string;
  bgTint: string;
}

function KpiCard({ label, value, subText, icon: Icon, color, bgTint }: KpiCardProps) {
  return (
    <div
      className="rounded-lg border bg-white hover:shadow-sm transition-shadow"
      style={{ borderColor: '#dee0e3', borderWidth: '0.5px', padding: '14px 16px' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgTint }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <span className="text-xs text-[#8f959e] truncate">{label}</span>
      </div>
      <div
        className="font-semibold leading-tight"
        style={{ color, fontSize: '26px' }}
      >
        {formatNum(value)}
      </div>
      <div className="text-xs text-[#8f959e] mt-1 truncate" title={subText}>
        {subText}
      </div>
    </div>
  );
}

// ─── 组件：行业岗位条形行（蓝色渐变，越深越靠前） ─────────────
interface IndustryBarRowProps {
  name: string;
  roleCount: number;
  scenarioCount: number;
  maxValue: number;
  rank: number;
  total: number;
}

function IndustryBarRow({ name, roleCount, scenarioCount, maxValue, rank, total }: IndustryBarRowProps) {
  // 蓝色渐变：越深排名越前
  const lightness = 70 - (rank / Math.max(total, 1)) * 35; // 70% → 35%
  const barColor = `hsl(224, 89%, ${lightness}%)`;
  const pct = maxValue > 0 ? (roleCount / maxValue) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 group cursor-pointer hover:bg-[#f8f9fa] rounded px-1 -mx-1 transition-colors"
      style={{ height: '34px' }}
    >
      <span
        className="text-sm text-[#1f2329] font-medium truncate flex-shrink-0"
        style={{ width: '120px' }}
        title={name}
      >
        {name}
      </span>
      <div className="flex-1 relative h-5 bg-[#f2f3f5] rounded overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex items-center gap-1 text-xs flex-shrink-0 w-16 justify-end">
        <span className="text-[#1f2329] font-semibold tabular-nums">{roleCount}</span>
        <span className="text-[#8f959e]">岗位</span>
      </div>
    </div>
  );
}

// ─── 组件：SVG 环形图 + 图例 ──────────────────────────────────
interface DonutItem {
  label: string;
  value: number;
}

interface SvgDonutProps {
  items: DonutItem[];
  colors: string[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}

function SvgDonut({ items, colors, size = 150, thickness = 16, centerLabel = '总计' }: SvgDonutProps) {
  const total = items.reduce((s: number, it) => s + it.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-5 w-full">
      {/* SVG 环形图 */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 背景轨道 */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#f2f3f5"
            strokeWidth={thickness}
          />
          {/* 各段 */}
          {total > 0 && items.map((it, idx: number) => {
            const segmentPct = it.value / total;
            const dashLen = segmentPct * circumference;
            const dashOffset = -offsetAcc;
            offsetAcc += dashLen;
            if (dashLen === 0) return null;
            return (
              <circle
                key={it.label || idx}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        {/* 中心文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xs text-[#8f959e] leading-tight">{centerLabel}</div>
          <div className="text-xl font-semibold text-[#1f2329] leading-tight mt-0.5">
            {formatNum(total)}
          </div>
        </div>
      </div>
      {/* 图例 */}
      <div className="flex-1 space-y-2 min-w-0">
        {items.map((it, idx: number) => {
          const pct = total > 0 ? ((it.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={it.label || idx} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="text-[#646a73] flex-1 leading-tight" title={it.label || '未标注'}>
                {it.label || '未标注'}
              </span>
              <span className="text-[#1f2329] font-medium flex-shrink-0 tabular-nums">
                {it.value}
              </span>
              <span className="text-[#8f959e] w-12 text-right flex-shrink-0 tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────
export default function GlobalInsightsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<GlobalInsightsResponse | null>(null);
  const [governanceData, setGovernanceData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orphanDrawerOpen, setOrphanDrawerOpen] = useState(false);
  const [orphanKeyword, setOrphanKeyword] = useState('');
  const [orphanPage, setOrphanPage] = useState(1);
  const [orphanData, setOrphanData] = useState<PaginatedResponse<OrphanScenarioItem> | null>(null);
  const [orphanLoading, setOrphanLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const snapshotDateText = data?.dataUpdatedAt
    ? new Date(data.dataUpdatedAt).toLocaleDateString('zh-CN')
    : formatDate(new Date());
  const dataSourceText = data?.dataSource === 'bitable_sync' ? '多维表格同步' : data?.dataSource === 'db_sync_tables' ? '数据库同步表 00–12' : '数据快照';

  useEffect(() => {
    const load = async () => {
      try {
        const [result, govResult] = await Promise.all([
          fetchGlobalInsights(),
          fetchGovernanceData(),
        ]);
        setData(result);
        setGovernanceData(govResult);
      } catch (err) {
        logger.error('加载全局洞察失败', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const loadOrphanScenarios = useCallback(async (page: number, keyword: string) => {
    setOrphanLoading(true);
    try {
      const result: PaginatedResponse<OrphanScenarioItem> = await fetchOrphanScenarios({
        page,
        pageSize: 20,
        keyword: keyword.trim() || undefined,
      });
      setOrphanData(result);
    } catch (err) {
      logger.error('加载未挂载场景失败', err);
    } finally {
      setOrphanLoading(false);
    }
  }, []);

  const handleOrphanSearch = (value: string) => {
    setOrphanKeyword(value);
    setOrphanPage(1);
    void loadOrphanScenarios(1, value);
  };

  const handleOrphanOpen = () => {
    setOrphanDrawerOpen(true);
    if (!orphanData) {
      void loadOrphanScenarios(1, '');
    }
  };

  const handleOrphanLoadMore = () => {
    if (!orphanData || orphanLoading) return;
    if (orphanPage * orphanData.pageSize >= orphanData.total) return;
    const nextPage = orphanPage + 1;
    setOrphanPage(nextPage);
    void loadOrphanScenarios(nextPage, orphanKeyword);
  };

  // ── 派生 KPI 数据 ─────────────────────────────────────────
  const kpiValues = useMemo(() => {
    if (!data) return null;
    const { stats, caseInsights, governanceMetrics } = data;

    // 总记录数：9 张表合计
    const totalRecords =
      stats.totalIndustries + stats.totalRoles + stats.totalScenarios +
      stats.totalSteps + stats.totalSkills + stats.totalMaterials +
      stats.totalCases + stats.totalCustomers + stats.totalFunctions;

    // 审核通过案例数
    const approvedCases = caseInsights.byAuditStatus.find(
      (c: CompletenessItem) => c.label === '通过' || c.label === '审核通过' || c.label === '已通过',
    )?.value ?? 0;

    // 流程资产 = 工作流(场景) + 子步骤
    const processAssets = stats.totalScenarios + stats.totalSteps;

    // 带安装包的 Skill 数（按覆盖率估算）
    const skillsWithPkg = Math.round(stats.totalSkills * (governanceMetrics.skillCoverage / 100));

    // 有场景的岗位数（按覆盖率估算）
    const rolesWithScenarios = Math.round(stats.totalRoles * (governanceMetrics.scenarioCoverage / 100));

    return {
      totalRecords,
      totalCases: stats.totalCases,
      processAssets,
      totalSkills: stats.totalSkills,
      industriesWithRoles: stats.totalIndustries,
      rolesWithScenarios,
      totalScenarios: stats.totalScenarios,
      totalSteps: stats.totalSteps,
      subTexts: {
        totalRecords: '9 张表有数据',
        totalCases: `${approvedCases} 条审核通过`,
        processAssets: `${stats.totalScenarios} 工作流 · ${stats.totalSteps} 子步骤`,
        totalSkills: `${skillsWithPkg} 个带安装包`,
        industriesWithRoles: `覆盖 ${stats.totalRoles} 个岗位`,
        rolesWithScenarios: `共 ${stats.totalRoles} 个岗位`,
        totalScenarios: '工作流',
        totalSteps: '子步骤',
      },
    };
  }, [data]);

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-[#1456f0]" size={24} />
          <h1 className="text-[22px] font-semibold leading-7 text-[#1f2329]">全局洞察</h1>
        </div>
        <Skeleton className="h-4 w-64 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i: number) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[380px] rounded-lg lg:col-span-2" />
          <div className="space-y-4">
            <Skeleton className="h-[180px] rounded-lg" />
            <Skeleton className="h-[180px] rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  // ── Error / empty ────────────────────────────────────────
  if (error || !data || !kpiValues) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#8f959e]">
        <p>{error || '暂无数据'}</p>
      </div>
    );
  }

  const { scenarioInsights, caseInsights, stepInsights, topIndustries, topRoles } = data;
  const maxRoleCount = Math.max(...topIndustries.map((i: IndustryDistributionItem) => i.roleCount), 1);

  return (
    <div className="space-y-6 p-6">
      {/* ── 页面标题 ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(20,86,240,0.08)' }}
          >
            <BarChart3 className="text-[#1456f0]" size={20} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold leading-7 text-[#1f2329]">全局洞察</h1>
            <p className="text-sm text-[#646a73] mt-1">
              跨行业汇总岗位、业务场景、资产规模、案例质量、覆盖率与数据治理信号
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#8f959e]">
          <TrendingUp size={14} />
          <span>{dataSourceText}：{snapshotDateText}</span>
        </div>
      </div>

      {/* ── KPI 卡片（6 个） ──────────────────────────── */}
      <section data-ai-section-type="card-stat">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI_CONFIG.map((cfg) => {
            const value = kpiValues[cfg.key as keyof typeof kpiValues] as number ?? 0;
            const subText = kpiValues.subTexts[cfg.key as keyof typeof kpiValues.subTexts] ?? '';
            return (
              <KpiCard
                key={cfg.key}
                label={cfg.label}
                value={value}
                subText={subText}
                icon={cfg.icon}
                color={cfg.color}
                bgTint={cfg.bgTint}
              />
            );
          })}
        </div>
      </section>

      {/* ── 图表区（左 1 大 + 右 2 堆叠） ──────────────── */}
      <section>
        <div className="chart-grid grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* 左大卡：行业岗位分布 */}
          <div
            className="chart-card rounded-lg border bg-white lg:col-span-2"
            style={{ borderColor: '#dee0e3', borderWidth: '0.5px', padding: '18px 20px' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} style={{ color: '#1456f0' }} />
              <h3 className="text-sm font-semibold text-[#1f2329]">行业岗位分布 Top15</h3>
            </div>
            <div className="space-y-1">
              {topIndustries.map((ind: IndustryDistributionItem, idx: number) => (
                <IndustryBarRow
                  key={ind.id}
                  name={ind.name}
                  roleCount={ind.roleCount}
                  scenarioCount={ind.scenarioCount}
                  maxValue={maxRoleCount}
                  rank={idx}
                  total={topIndustries.length}
                />
              ))}
            </div>
          </div>

          {/* 右列：2 个环形图堆叠 */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            {/* 场景优先级分布 */}
            <div
              className="chart-card rounded-lg border bg-white flex-1"
              style={{ borderColor: '#dee0e3', borderWidth: '0.5px', padding: '18px 20px' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} style={{ color: '#1456f0' }} />
                <h3 className="text-sm font-semibold text-[#1f2329]">场景优先级分布</h3>
              </div>
              {scenarioInsights.byPriority.length > 0 ? (
                <SvgDonut
                  items={scenarioInsights.byPriority as DonutItem[]}
                  colors={PRIORITY_COLORS}
                  size={140}
                  thickness={16}
                  centerLabel="场景总数"
                />
              ) : (
                <div className="flex items-center justify-center h-36 text-xs text-[#8f959e]">
                  暂无优先级数据
                </div>
              )}
            </div>

            {/* 案例一级业务域分布 */}
            <div
              className="chart-card rounded-lg border bg-white flex-1"
              style={{ borderColor: '#dee0e3', borderWidth: '0.5px', padding: '18px 20px' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} style={{ color: '#1456f0' }} />
                <h3 className="text-sm font-semibold text-[#1f2329]">案例一级业务域分布</h3>
              </div>
              {caseInsights.byDomain.length > 0 ? (
                <SvgDonut
                  items={caseInsights.byDomain.slice(0, 6) as DomainDistributionItem[]}
                  colors={DOMAIN_COLORS}
                  size={140}
                  thickness={16}
                  centerLabel="案例总数"
                />
              ) : (
                <div className="flex items-center justify-center h-36 text-xs text-[#8f959e]">
                  暂无领域数据
                </div>
              )}
            </div>

            {/* 子步骤 AI 分工 */}
            <div
              className="chart-card rounded-lg border bg-white flex-1"
              style={{ borderColor: '#dee0e3', borderWidth: '0.5px', padding: '18px 20px' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} style={{ color: '#1456f0' }} />
                <h3 className="text-sm font-semibold text-[#1f2329]">子步骤 AI 分工</h3>
              </div>
              {stepInsights && (stepInsights.totalAiRatio + stepInsights.totalHumanRatio + stepInsights.totalCollabRatio) > 0 ? (
                <SvgDonut
                  items={[
                    { label: 'AI 主导', value: stepInsights.totalAiRatio },
                    { label: '人做为主', value: stepInsights.totalHumanRatio },
                    { label: '人机协作', value: stepInsights.totalCollabRatio },
                  ]}
                  colors={['#1456f0', '#8f959e', '#35bd4b']}
                  size={140}
                  thickness={16}
                  centerLabel="子步骤"
                />
              ) : (
                <div className="flex items-center justify-center h-36 text-xs text-[#8f959e]">
                  暂无分工数据
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 治理模块 ─────────────────────────────────────── */}
      {governanceData && data && (
        <GovernanceSection
          data={governanceData}
          m34Total={data.m34Total}
          m34QuantUnpassed={data.m34QuantUnpassed}
          m34QuantPassed={data.m34QuantPassed}
        />
      )}

      {/* ── Top12 岗位表格 ──────────────────────────────── */}
      <section>
        <div className="section-head flex items-center gap-2 mb-3.5">
          <h2 className="text-base font-semibold text-[#1f2329] flex items-center gap-2">
            <span
              className="w-1 h-4 rounded-sm"
              style={{ backgroundColor: '#1456f0' }}
            />
             Top15 岗位
           </h2>
           <span className="text-xs text-[#8f959e]">按场景数排序</span>
        </div>
        <div
          className="rounded-lg border bg-white overflow-hidden"
          style={{ borderColor: '#dee0e3', borderWidth: '0.5px' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[#646a73] bg-[#f8f9fa]">
                 <th className="text-left font-normal py-2.5 px-4 w-12">#</th>
                 <th className="text-left font-normal py-2.5 px-4">岗位</th>
                 <th className="text-left font-normal py-2.5 px-4">所属行业</th>
                 <th className="text-right font-normal py-2.5 px-4">场景数</th>
                 <th className="text-right font-normal py-2.5 px-4">子步骤数</th>
               </tr>
            </thead>
            <tbody>
              {topRoles.map((role: TopRoleItem, idx: number) => (
                <tr
                  key={role.id}
                  className="border-t border-[#f2f3f5] hover:bg-[#f8f9fa] transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <span
                      className={
                        'inline-flex items-center justify-center text-[10px] font-medium rounded-sm w-5 h-5 ' +
                        (idx < 3
                          ? 'bg-[#1456f0] text-white'
                          : 'bg-[#f2f3f5] text-[#646a73]')
                      }
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#1f2329] font-medium">
                     {role.name}
                   </td>
                   <td className="py-2.5 px-4 text-[#646a73] text-xs leading-relaxed">
                     {role.industries.length > 0
                       ? role.industries.join('、')
                       : <span className="text-[#bbbfc4]">—</span>
                     }
                   </td>
                   <td className="py-2.5 px-4 text-right text-[#1f2329] tabular-nums">
                     {role.scenarioCount}
                   </td>
                  <td className="py-2.5 px-4 text-right text-[#8f959e] tabular-nums">
                    {role.stepCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 未挂载场景 ──────────────────────────────────── */}
      <section>
        <div className="section-head flex items-center justify-between mb-3.5">
          <h2 className="text-base font-semibold text-[#1f2329] flex items-center gap-2">
            <span
              className="w-1 h-4 rounded-sm"
              style={{ backgroundColor: '#1456f0' }}
            />
            未挂载场景
          </h2>
           <span className="text-xs text-[#8f959e]">
             共 {data.orphanCount} 个
           </span>
        </div>
         <Drawer direction="right" open={orphanDrawerOpen} onOpenChange={setOrphanDrawerOpen}>
           <DrawerTrigger asChild>
             <button
               type="button"
               onClick={handleOrphanOpen}
               className="w-full rounded-lg border bg-white hover:bg-[#f8f9fa] transition-colors text-left px-5 py-4 flex items-center justify-between group"
               style={{ borderColor: '#dee0e3', borderWidth: '0.5px' }}
             >
               <div className="flex items-center gap-3">
                 <div
                   className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: 'rgba(255,129,26,0.12)' }}
                 >
                   <BarChart3 size={20} style={{ color: '#ff811a' }} />
                 </div>
                 <div>
                   <div className="text-sm font-medium text-[#1f2329]">
                     共 {data.orphanCount} 个场景尚未关联到岗位，点击查看场景清单
                   </div>
                   <div className="text-xs text-[#8f959e] mt-0.5">
                     识别岗位场景覆盖缺口，支持按名称和简介搜索
                   </div>
                 </div>
               </div>
               <ChevronRight size={18} className="text-[#8f959e] group-hover:text-[#1456f0] transition-colors" />
             </button>
           </DrawerTrigger>
           <DrawerContent className="w-[480px] max-w-[90vw] h-full flex flex-col">
             <DrawerHeader>
               <DrawerTitle>未挂载场景清单</DrawerTitle>
               <div className="relative mt-3">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f959e]" />
                 <Input
                   value={orphanKeyword}
                   onChange={(e) => handleOrphanSearch(e.target.value)}
                   placeholder="搜索场景名称或简介..."
                   className="pl-9"
                 />
                 {orphanKeyword && (
                   <button
                     type="button"
                     onClick={() => handleOrphanSearch('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f959e] hover:text-[#1f2329]"
                   >
                     <X size={16} />
                   </button>
                 )}
               </div>
               <div className="text-xs text-[#8f959e] mt-2">
                 共 {orphanData?.total ?? 0} 条结果
               </div>
             </DrawerHeader>
             <div ref={listRef} className="flex-1 overflow-y-auto px-4">
               {orphanLoading && !orphanData ? (
                 <div className="flex items-center justify-center py-12">
                   <Loader2 size={20} className="animate-spin text-[#1456f0]" />
                 </div>
               ) : orphanData?.items.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <Search size={32} className="text-[#bbbfc4] mb-3" />
                   <div className="text-sm text-[#646a73]">没有找到匹配的场景</div>
                   <div className="text-xs text-[#8f959e] mt-1">试试其他关键词</div>
                 </div>
               ) : (
                 <div className="space-y-2 py-2">
                   {orphanData?.items.map((item: OrphanScenarioItem) => (
                     <button
                       key={item.id}
                       type="button"
                       onClick={() => {
                         setOrphanDrawerOpen(false);
                         navigate(`/scenarios/${item.id}`);
                       }}
                       className="w-full text-left p-3 rounded-md hover:bg-[#f8f9fa] transition-colors border border-transparent hover:border-[#e5e6eb]"
                     >
                       <div className="text-sm font-medium text-[#1f2329] truncate">{item.name}</div>
                       {item.brief && (
                         <div className="text-xs text-[#8f959e] mt-1 line-clamp-2">{item.brief}</div>
                       )}
                     </button>
                   ))}
                   {orphanData && orphanPage * orphanData.pageSize < orphanData.total && (
                     <div className="flex justify-center py-3">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={handleOrphanLoadMore}
                         disabled={orphanLoading}
                       >
                         {orphanLoading ? (
                           <Loader2 size={14} className="mr-2 animate-spin" />
                         ) : null}
                         加载更多
                       </Button>
                     </div>
                   )}
                 </div>
               )}
             </div>
             <div className="px-4 pb-4 pt-2 border-t border-[#f2f3f5]">
               <DrawerClose asChild>
                 <Button variant="outline" className="w-full">关闭</Button>
               </DrawerClose>
             </div>
           </DrawerContent>
         </Drawer>
       </section>
     </div>
   );
 }
