import { cn } from '@client/src/lib/utils';

interface DlItem {
  label: string;
  value: React.ReactNode;
}

interface DescriptionListProps {
  items: DlItem[];
  variant?: 'two-col' | 'one-col';
  className?: string;
}

export default function DescriptionList({
  items,
  variant = 'two-col',
  className,
}: DescriptionListProps) {
  const validItems = items.filter(
    (it) =>
      it.value !== null &&
      it.value !== undefined &&
      it.value !== '' &&
      (!Array.isArray(it.value) || it.value.length > 0),
  );

  if (validItems.length === 0) return null;

  return (
    <dl
      className={cn(
        'grid gap-0 border border-[var(--line-card)] rounded-lg overflow-hidden',
        variant === 'two-col'
          ? 'grid-cols-2 max-[640px]:grid-cols-1'
          : 'grid-cols-1',
        className,
      )}
    >
      {validItems.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            'px-4 py-[13px] border-b border-[var(--divider)] min-w-0',
            variant === 'two-col' &&
              'max-[640px]:border-r-0 odd:border-r odd:border-r-[var(--divider)]',
          )}
          style={{
            borderBottom:
              idx >= validItems.length - (variant === 'two-col' ? 2 : 1)
                ? 'none'
                : undefined,
            borderRight:
              variant === 'two-col' && idx % 2 === 0
                ? '0.5px solid var(--divider)'
                : undefined,
          }}
        >
          <dt className="text-xs text-[var(--placeholder)] mb-[3px]">
            {item.label}
          </dt>
          <dd className="m-0 text-sm whitespace-pre-wrap break-words">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
