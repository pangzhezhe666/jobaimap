import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@client/src/components/ui/drawer';
import { cn } from '@client/src/lib/utils';

interface DrawerShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  kicker?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export default function DrawerShell({
  open,
  onOpenChange,
  title,
  kicker,
  children,
  footer,
  maxWidth = '560px',
}: DrawerShellProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className={cn(
          'h-full border-l border-border shadow-[-8px_0_28px_rgba(31_35_41_.16)]',
        )}
        style={{ width: 'min(560px, 92vw)', maxWidth }}
      >
        {/* Header */}
        <div
          data-slot="drawer-head"
          className="flex items-start gap-3 px-[22px] py-5 border-b border-[var(--divider)]"
        >
          <div className="flex-1 min-w-0">
            {kicker && (
              <div className="text-xs text-[var(--placeholder)]">{kicker}</div>
            )}
            <DrawerTitle className="text-lg font-semibold leading-7 mt-[3px]">
              {title}
            </DrawerTitle>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[var(--caption)] hover:bg-[var(--side-hover)] hover:text-[var(--title)] transition-colors"
            aria-label="关闭"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div
          data-slot="drawer-body"
          className="flex-1 overflow-y-auto px-[22px] py-5"
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            data-slot="drawer-foot"
            className="shrink-0 px-[22px] py-[14px] border-t border-[var(--divider)] bg-[var(--bg-content)] flex gap-2.5 justify-end"
          >
            {footer}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
