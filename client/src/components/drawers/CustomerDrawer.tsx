import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchCustomerDetail } from '@client/src/api';
import type { CustomerDetail } from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import DrawerShell from './DrawerShell';
import DescriptionList from './DescriptionList';
import LinkList, {
  caseToLinkItem,
  materialToLinkItem,
} from './LinkList';

interface CustomerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onCaseClick?: (caseId: string) => void;
  onMaterialClick?: (materialId: string) => void;
}

export default function CustomerDrawer({
  open,
  onOpenChange,
  customerId,
  onCaseClick,
  onMaterialClick,
}: CustomerDrawerProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    setLoading(true);
    setCustomer(null);
    fetchCustomerDetail(customerId)
      .then((data: CustomerDetail) => {
        if (!cancelled) setCustomer(data);
      })
      .catch((err) => {
        logger.error('获取客户详情失败', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const headerIcon = (
    <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--primary-soft)] text-primary flex items-center justify-center">
      <Building2 size={20} strokeWidth={1.8} />
    </div>
  );

  const titleContent = (
    <div className="flex items-start gap-3">
      {headerIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold leading-7">
            {loading ? '加载中…' : customer?.name || '客户详情'}
          </span>
          {customer?.cooperation && (
            <Badge
              variant={customer.cooperation.includes('签约') || customer.cooperation.includes('已') ? 'default' : 'secondary'}
              className="text-[11px] px-2 py-0 font-normal"
            >
              {customer.cooperation}
            </Badge>
          )}
          {customer?.risk && customer.risk !== '低' && (
            <Badge
              variant={customer.risk === '高' ? 'destructive' : 'outline'}
              className="text-[11px] px-2 py-0 font-normal"
            >
              风险 {customer.risk}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={titleContent}
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          加载中…
        </div>
      ) : customer ? (
        <>
          {/* 基本信息 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              基本信息
            </h4>
            <DescriptionList
              variant="two-col"
              items={[
                { label: '合作状态', value: customer.cooperation },
                { label: '风险等级', value: customer.risk },
              ]}
            />
          </div>

          {/* 最新进展 */}
          {customer.latestProgress && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
                最新进展
              </h4>
              <p className="m-0 text-sm whitespace-pre-wrap break-words">
                {customer.latestProgress}
              </p>
            </div>
          )}

          {/* 机会窗口 */}
          {customer.opportunityWindow && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
                机会窗口
              </h4>
              <p className="m-0 text-sm whitespace-pre-wrap break-words">
                {customer.opportunityWindow}
              </p>
            </div>
          )}

          {/* 关联行业 */}
          {customer.industries && customer.industries.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
                关联行业 ({customer.industries.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {customer.industries.map((ind) => (
                  <Badge
                    key={ind.id}
                    variant="secondary"
                    className="text-[12px] px-3 py-1 font-normal"
                  >
                    {ind.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 关联案例 */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联案例 ({customer.cases?.length ?? 0})
            </h4>
            <LinkList
              items={customer.cases?.map(caseToLinkItem)}
              icon="case"
              onItemClick={onCaseClick}
              emptyText="暂无关联案例"
            />
          </div>

          {/* 关联资料 */}
          <div className="mt-5">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联资料 ({customer.materials?.length ?? 0})
            </h4>
            <LinkList
              items={customer.materials?.map(materialToLinkItem)}
              icon="material"
              onItemClick={onMaterialClick}
              emptyText="暂无关联资料"
            />
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          未找到客户信息
        </div>
      )}
    </DrawerShell>
  );
}
