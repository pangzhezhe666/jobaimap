import { FileText, Briefcase, BookOpen, Building2 } from 'lucide-react';
import type {
  ScenarioSummary,
  MaterialSummary,
  CaseSummary,
  CustomerSummary,
} from '@shared/api.interface';
import { cn } from '@client/src/lib/utils';

interface LinkListProps {
  items?: { id: string; name: string; meta?: string }[] | null;
  icon?: 'scenario' | 'material' | 'case' | 'customer';
  onItemClick?: (id: string) => void;
  emptyText?: string;
}

const iconMap = {
  scenario: Briefcase,
  material: FileText,
  case: BookOpen,
  customer: Building2,
};

export default function LinkList({
  items,
  icon = 'scenario',
  onItemClick,
  emptyText = '暂无关联数据',
}: LinkListProps) {
  const Icon = iconMap[icon];

  if (!items || items.length === 0) {
    return (
      <div className="text-xs text-[var(--placeholder)] py-2">{emptyText}</div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={onItemClick ? () => onItemClick(item.id) : undefined}
          className={cn(
            'flex items-start gap-[11px] p-3 border border-[var(--line-card)] rounded-lg bg-white',
            onItemClick && 'cursor-pointer hover:border-primary transition-colors',
          )}
        >
          <Icon
            size={18}
            strokeWidth={1.8}
            className="text-primary shrink-0 mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium leading-[22px] break-words">
              {item.name}
            </div>
            {item.meta && (
              <div className="text-xs text-[var(--caption)] mt-[3px] flex gap-2.5 flex-wrap">
                {item.meta}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helpers to convert summary types to link items
export function scenarioToLinkItem(
  s: ScenarioSummary,
): { id: string; name: string; meta?: string } {
  const parts: string[] = [];
  if (s.status) parts.push(s.status);
  if (s.completeness) parts.push(`完整度 ${s.completeness}`);
  return { id: s.id, name: s.name, meta: parts.join(' · ') };
}

export function materialToLinkItem(
  m: MaterialSummary,
): { id: string; name: string; meta?: string } {
  return {
    id: m.id,
    name: m.name,
    meta: m.updatedAt ? `更新于 ${m.updatedAt.slice(0, 10)}` : undefined,
  };
}

export function caseToLinkItem(
  c: CaseSummary,
): { id: string; name: string; meta?: string } {
  const parts: string[] = [];
  if (c.deptName) parts.push(c.deptName);
  if (c.maturity) parts.push(c.maturity);
  return { id: c.id, name: c.deptName || `案例 ${c.id}`, meta: parts.join(' · ') };
}

export function customerToLinkItem(
  c: CustomerSummary,
): { id: string; name: string; meta?: string } {
  const parts: string[] = [];
  if (c.cooperation) parts.push(c.cooperation);
  if (c.risk) parts.push(`风险 ${c.risk}`);
  return { id: c.id, name: c.name, meta: parts.join(' · ') };
}


