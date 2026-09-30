import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import type { ScenarioSummary } from '@shared/api.interface';
import { Input } from '@client/src/components/ui/input';

const priorityVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  P0: 'destructive',
  P1: 'default',
  P2: 'secondary',
  P3: 'outline',
  高: 'default',
  中: 'secondary',
  低: 'outline',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  已上线: 'default',
  进行中: 'secondary',
  规划中: 'outline',
  已暂停: 'destructive',
};

interface ScenarioDirectoryProps {
  scenarios: ScenarioSummary[];
  activeScenarioId: string | null;
  onSelect: (id: string) => void;
}

export default function ScenarioDirectory({
  scenarios,
  activeScenarioId,
  onSelect,
}: ScenarioDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? scenarios.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : scenarios;

  return (
    <aside className="scn-dir w-[300px] shrink-0 sticky top-[64px]">
      <div className="rounded-[10px] bg-[var(--side-bg)] p-3 space-y-3">
        {/* 搜索框 */}
        <div className="scn-dir-search relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="搜索业务场景"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-sm bg-white"
          />
        </div>

        {/* 场景计数 */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            共 {filtered.length} 个业务场景
          </span>
        </div>

        {/* 场景列表 */}
        <div className="scn-dir-list space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
          {filtered.length > 0 ? (
            filtered.map(scenario => {
              const isActive = scenario.id === activeScenarioId;
              return (
                <div
                  key={scenario.id}
                  onClick={() => onSelect(scenario.id)}
                  className={`scn-dir-item rounded-[6px] px-3 py-[9px] cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[var(--side-selected)] text-primary'
                      : 'hover:bg-[var(--side-hover)] text-foreground'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`text-sm font-medium line-clamp-2 flex-1 min-w-0 ${
                        isActive ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {scenario.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {scenario.priority && (
                      <span className="text-[10px] text-muted-foreground">
                        {scenario.priority}
                      </span>
                    )}
                    {scenario.completeness && (
                      <span className="text-[10px] text-muted-foreground">
                        · {scenario.completeness}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              未找到匹配的场景
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export { priorityVariant, statusVariant };
