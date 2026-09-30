import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@client/src/lib/utils';

interface CollapsiblePanelProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number | string;
  className?: string;
}

export default function CollapsiblePanel({
  title,
  defaultOpen = true,
  children,
  count,
  className,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'border border-[var(--line-card)] rounded-lg bg-[var(--bg-body)] mb-4 last:mb-0',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-[18px] py-[14px] list-none text-left"
      >
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className={cn(
            'shrink-0 text-[var(--placeholder)] transition-transform duration-180',
            open && 'rotate-180',
          )}
        />
        <h3 className="m-0 text-[15px] font-medium flex-1">{title}</h3>
        {count !== undefined && (
          <span className="text-xs text-[var(--placeholder)]">{count}</span>
        )}
      </button>
      {open && (
        <div className="px-[18px] pb-4 pt-0">{children}</div>
      )}
    </div>
  );
}
