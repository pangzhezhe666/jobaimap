import type {
  GovernanceData,
  GovernanceScaleBar,
  GovernanceStackItem,
  GovernanceFunnelStep,
  GovernanceCoverageItem,
  GovernanceSkillCompleteness,
  GovernanceSignal,
  GovernanceStatus,
  GovernanceSignalItem,
} from '@shared/api.interface';

// ─── 状态配色 ─────────────────────────────────────────────────
const STATUS_COLORS: Record<GovernanceStatus, string> = {
  ok: '#35bd4b',
  good: '#1456f0',
  warn: '#ff811a',
  empty: '#c9cdd4',
};

const UNLABELED_COLOR = '#c9cdd4';

const MATURITY_COLORS = ['#1456f0', '#35bd4b', '#ff811a', '#722ed1', UNLABELED_COLOR];
const COMPLETENESS_COLORS = ['#722ed1', '#1456f0', '#35bd4b', '#ff811a', UNLABELED_COLOR];

function getStackColor(it: GovernanceStackItem, colors: string[], idx: number): string {
  if (it.label === '未标注' || !it.label) return UNLABELED_COLOR;
  return it.color || colors[idx % colors.length];
}

// ─── Helpers ──────────────────────────────────────────────────
function formatNum(n: number): string {
  return n.toLocaleString();
}

function getCompletenessColor(percent: number): string {
  if (percent >= 80) return '#35bd4b';
  if (percent >= 60) return '#1456f0';
  if (percent >= 30) return '#ff811a';
  return '#f54a45';
}

// 将 "未标注" 放到堆叠条最后
function sortStackWithUnlabeledLast(items: GovernanceStackItem[]): GovernanceStackItem[] {
  const labeled: GovernanceStackItem[] = [];
  const unlabeled: GovernanceStackItem[] = [];
  for (const it of items) {
    if (it.label === '未标注' || !it.label) {
      unlabeled.push(it);
    } else {
      labeled.push(it);
    }
  }
  return [...labeled, ...unlabeled];
}

// ─── 组件：规模条形行 ─────────────────────────────────────────
function ScaleBarRow({ item, maxValue, color = '#1456f0' }: {
  item: GovernanceScaleBar;
  maxValue: number;
  color?: string;
}) {
  const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr 56px',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '12px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: '#1f2329',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={item.label}
      >
        {item.label}
      </span>
      <span
        style={{
          position: 'relative',
          display: 'block',
          height: '12px',
          background: '#f2f3f5',
          borderRadius: '6px',
          overflow: 'visible',
        }}
      >
        <i style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'block',
          height: '100%',
          borderRadius: '6px',
          width: `${pct}%`,
          backgroundColor: color,
        }} />
      </span>
      <b style={{
        fontSize: '13px',
        fontWeight: 600,
        textAlign: 'right',
        color: '#1f2329',
        fontVariantNumeric: 'tabular-nums',
      }}>{item.value.toLocaleString()}</b>
    </div>
  );
}

// ─── 组件：规模卡片 ───────────────────────────────────────────
function ScaleCard({ title, items, color }: {
  title: string;
  items: GovernanceScaleBar[];
  color?: string;
}) {
  const maxVal = Math.max(...items.map((i: GovernanceScaleBar) => i.value), 1);
  return (
    <div
      style={{
        border: '0.5px solid #dee0e3',
        borderRadius: '8px',
        background: '#fff',
        padding: '16px 18px',
      }}
    >
      <h4 style={{
        margin: '0 0 14px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2329',
      }}>{title}</h4>
      {items.map((item: GovernanceScaleBar, idx: number) => (
        <ScaleBarRow key={item.label + idx} item={item} maxValue={maxVal} color={color} />
      ))}
    </div>
  );
}

// ─── 组件：堆叠条 + 图例 ─────────────────────────────────────
function StackCard({ title, items, colors }: {
  title: string;
  items: GovernanceStackItem[];
  colors: string[];
}) {
  const sortedItems = sortStackWithUnlabeledLast(items);
  const total = sortedItems.reduce((s: number, it: GovernanceStackItem) => s + it.value, 0);
  return (
    <div
      style={{
        border: '0.5px solid #dee0e3',
        borderRadius: '8px',
        background: '#fff',
        padding: '16px 18px',
      }}
    >
      <h4 style={{
        margin: '0 0 14px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2329',
      }}>{title}</h4>
      <div
        style={{
          display: 'flex',
          height: '16px',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#eef0f3',
        }}
      >
        {sortedItems.map((it: GovernanceStackItem, idx: number) => {
          const pct = total > 0 ? (it.value / total) * 100 : 0;
          if (pct === 0) return null;
          const barColor = getStackColor(it, colors, idx);
          return (
            <span
              key={it.label || 'unlabeled'}
              style={{
                display: 'block',
                height: '100%',
                width: `${pct}%`,
                backgroundColor: barColor,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 16px',
          marginTop: '12px',
          fontSize: '12px',
          color: '#646a73',
        }}
      >
        {sortedItems.map((it: GovernanceStackItem, idx: number) => {
          const dotColor = getStackColor(it, colors, idx);
          return (
            <span key={it.label || 'unlabeled'} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <i style={{
                width: '9px',
                height: '9px',
                borderRadius: '2px',
                backgroundColor: dotColor,
                fontStyle: 'normal',
              }} />
              {it.label || '未标注'}
              <b style={{ color: '#1f2329', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatNum(it.value)} {it.percent.toFixed(1)}%
              </b>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── 组件：可用性漏斗（5 阶段，">" 连接） ─────────────────────
function FunnelSection({ steps }: { steps: GovernanceFunnelStep[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
      }}
    >
      {steps.map((step: GovernanceFunnelStep, idx: number) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              minWidth: '130px',
              border: '0.5px solid #dee0e3',
              borderRadius: '8px',
              padding: '14px 16px',
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#1f2329',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {step.value.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', marginTop: '6px', color: '#1f2329' }}>
              {step.label}
            </div>
            <div style={{ fontSize: '12px', color: '#8f959e', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {step.ratio}%
            </div>
          </div>
          {idx < steps.length - 1 && (
            <span
              style={{
                fontSize: '22px',
                color: '#c9cdd4',
                fontWeight: 700,
                margin: '0 10px',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              {'>'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 组件：高价值待处理池 ─────────────────────────────────────
interface HighValuePoolProps {
  m34Total: number;
  m34QuantUnpassed: number;
  m34QuantPassed: number;
}

function HighValuePool({ m34Total, m34QuantUnpassed, m34QuantPassed }: HighValuePoolProps) {
  return (
    <div
      style={{
        border: '0.5px solid #ffd8a8',
        borderRadius: '8px',
        background: '#fff8ee',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#ff811a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {m34QuantUnpassed.toLocaleString()}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2329', marginBottom: '4px' }}>
          高价值待处理池
        </div>
        <div style={{ fontSize: '12px', color: '#646a73', lineHeight: '18px' }}>
          同时满足「M3/M4 + 有量化成果」但尚未审核通过的案例。三口径：M3/M4 共 {m34Total.toLocaleString()} 条；其中 M3/M4+量化未通过 {m34QuantUnpassed.toLocaleString()} 条；M3/M4+量化已通过 {m34QuantPassed.toLocaleString()} 条。
        </div>
      </div>
    </div>
  );
}

// ─── 组件：覆盖率列（字段名 + 进度条 + filled/total 百分比） ───
function CoverageColumn({ title, items }: {
  title: string;
  items: GovernanceCoverageItem[];
}) {
  return (
    <div
      style={{
        border: '0.5px solid #dee0e3',
        borderRadius: '8px',
        background: '#fff',
        padding: '16px 18px',
      }}
    >
      <h4 style={{
        margin: '0 0 14px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2329',
      }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item: GovernanceCoverageItem) => (
          <div key={item.field}>
            <div
              style={{
                fontSize: '13px',
                color: '#1f2329',
                marginBottom: '5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.field}
            >
              {item.field}
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: '#f2f3f5',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <i
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${item.percent}%`,
                  backgroundColor: STATUS_COLORS[item.status],
                }}
              />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2329', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {formatNum(item.filled)}/{formatNum(item.total)}
              <span style={{ color: '#646a73', marginLeft: '8px', fontWeight: 500 }}>
                {item.percent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 组件：Skill 资产完整度 ───────────────────────────────────
const SKILL_FIELD_ORDER = [
  '技能描述',
  '触发/输入/输出',
  '判断标准',
  'SKILL.md',
  'references',
  '安装包',
  'scripts',
  '版本号',
];

function SkillCompletenessSection({ items }: { items: GovernanceSkillCompleteness[] }) {
  // 按固定顺序排列
  const orderedItems: GovernanceSkillCompleteness[] = SKILL_FIELD_ORDER.map(
    (name: string) => items.find((it: GovernanceSkillCompleteness) => it.field === name)
      ?? { field: name, filled: 0, total: 0, percent: 0 }
  );

  return (
    <div
      style={{
        border: '0.5px solid #dee0e3',
        borderRadius: '8px',
        background: '#fff',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {orderedItems.map((item: GovernanceSkillCompleteness) => {
          const barColor = getCompletenessColor(item.percent);
          const pctText = item.total > 0 ? item.percent.toFixed(1) : '0.0';
          return (
            <div key={item.field}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1f2329',
                  marginBottom: '6px',
                }}
              >
                {item.field}
              </div>
              <div
                style={{
                  width: '100%',
                  height: '20px',
                  background: '#f8f9fa',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.percent}%`,
                    backgroundColor: barColor,
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#646a73', marginTop: '5px', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: '#1f2329', fontWeight: 600 }}>
                  {formatNum(item.filled)}/{formatNum(item.total)}
                </span>
                <span style={{ marginLeft: '10px' }}>{pctText}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 信号条目格式化 ───────────────────────────────────────────
function formatSignalValue(it: GovernanceSignalItem): string {
  if (it.percent === undefined || it.percent === null) {
    return formatNum(it.value);
  }
  // percent > 100 通常表示组数（非百分比），用 "X组 / Y条" 格式
  if (it.percent > 100) {
    return `${formatNum(Math.round(it.percent))} 组 / ${formatNum(it.value)} 条`;
  }
  return `${formatNum(it.value)} 个 (${it.percent}%)`;
}

// ─── 组件：治理信号卡片 ───────────────────────────────────────
function SignalCard({ signal }: { signal: GovernanceSignal }) {
  const isWarn = signal.tone === 'warn';
  const accentColor = isWarn ? '#ff811a' : '#1456f0';

  return (
    <div
      style={{
        border: '0.5px solid #dee0e3',
        borderRadius: '8px',
        padding: '14px 16px 14px 18px',
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: accentColor,
        }}
      />
      <h4 style={{
        margin: '0 0 4px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2329',
      }}>{signal.title}</h4>
      <p style={{
        margin: '0 0 10px',
        fontSize: '12.5px',
        lineHeight: '18px',
        color: '#646a73',
      }}>{signal.description}</p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(31,35,41,0.06)',
        }}
      >
        {signal.items.map((it: GovernanceSignalItem, idx: number) => (
          <div
            key={it.label + idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12.5px',
            }}
          >
            <span style={{ color: '#646a73' }}>{it.label}</span>
            <span style={{ color: '#1f2329', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatSignalValue(it)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 主组件：治理模块 ─────────────────────────────────────────
interface GovernanceSectionProps {
  data: GovernanceData;
  m34Total: number;
  m34QuantUnpassed: number;
  m34QuantPassed: number;
}

export default function GovernanceSection({
  data,
  m34Total,
  m34QuantUnpassed,
  m34QuantPassed,
}: GovernanceSectionProps) {
  // 拆分校验覆盖率项为左右两列（各 5 项）
  const mid = Math.ceil(data.fieldCoverage.length / 2);
  const leftCoverage = data.fieldCoverage.slice(0, mid);
  const rightCoverage = data.fieldCoverage.slice(mid);

  // 构造资产规模左侧数据（业务与客户资产）
  const businessAssets: GovernanceScaleBar[] = [
    { label: '案例资料', value: data.totalMaterials, percent: 0 },
    { label: '案例', value: data.totalCases, percent: 0 },
    { label: '客户', value: data.totalCustomers, percent: 0 },
    { label: '岗位', value: data.totalRoles, percent: 0 },
    { label: '行业', value: data.totalIndustries, percent: 0 },
  ];

  // 构造资产规模右侧数据（流程与能力资产）
  const processAssets: GovernanceScaleBar[] = [
    { label: '工作流子步骤', value: data.totalSteps, percent: 0 },
    { label: '业务工作流', value: data.totalScenarios, percent: 0 },
    { label: 'Skill', value: data.totalSkills, percent: 0 },
    { label: '职能', value: data.totalFunctions, percent: 0 },
    { label: 'MCP', value: data.totalMcp, percent: 0 },
  ];

  return (
    <section
      style={{
        marginTop: '8px',
        paddingTop: '8px',
      }}
    >
      {/* ── 治理模块标题 ─────────────────────────────────── */}
      <div style={{ marginBottom: '14px' }}>
        <h2
          className="text-base font-semibold text-[#1f2329] flex items-center gap-2"
        >
          <span
            className="w-1 h-4 rounded-sm"
            style={{ backgroundColor: '#1456f0' }}
          />
          数据治理看板
          <span className="text-xs font-normal text-[#8f959e] ml-1">
            资产规模 · 案例质量 · 覆盖率 · 治理信号
          </span>
        </h2>
      </div>

      {/* ── 1. 资产规模分布 + 案例质量结构 ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <ScaleCard
          title="业务与客户资产规模"
          items={businessAssets}
          color="#1456f0"
        />
        <ScaleCard
          title="流程与能力资产规模"
          items={processAssets}
          color="#722ed1"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <StackCard
          title="案例成熟度结构"
          items={data.maturityStack}
          colors={MATURITY_COLORS}
        />
        <StackCard
          title="数据完整度结构"
          items={data.dataCompletenessStack}
          colors={COMPLETENESS_COLORS}
        />
      </div>

      {/* ── 2. 案例可用性漏斗 ────────────────────────────── */}
      <div style={{ marginBottom: '6px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2329', margin: '16px 0 10px' }}>
          案例可用性漏斗
        </h3>
        <FunnelSection steps={data.funnel} />
      </div>

      {/* ── 3. 高价值待处理池 ────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <HighValuePool
          m34Total={m34Total}
          m34QuantUnpassed={m34QuantUnpassed}
          m34QuantPassed={m34QuantPassed}
        />
      </div>

      {/* ── 4. 关键字段覆盖率（两列） ────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2329', margin: '16px 0 10px' }}>
          关键字段覆盖率
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <CoverageColumn title="证据与主体关系" items={leftCoverage} />
          <CoverageColumn title="复用与评测关系" items={rightCoverage} />
        </div>
      </div>

      {/* ── 5. Skill 资产完整度 ──────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2329', margin: '16px 0 10px' }}>
          Skill 资产完整度
        </h3>
        <SkillCompletenessSection items={data.skillCompleteness} />
      </div>

      {/* ── 6. 数据治理信号（2x2） ───────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2329', margin: '16px 0 10px' }}>
          数据治理信号
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {data.signals.map((signal: GovernanceSignal, idx: number) => (
            <SignalCard key={signal.title + idx} signal={signal} />
          ))}
        </div>
      </div>
    </section>
  );
}
