import { useEffect, useState } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchCaseDetail } from '@client/src/api';
import type { CaseDetail, CaseOwner } from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import DrawerShell from './DrawerShell';
import CollapsiblePanel from './CollapsiblePanel';
import DescriptionList from './DescriptionList';
import LinkList, {
  scenarioToLinkItem,
  materialToLinkItem,
  customerToLinkItem,
} from './LinkList';

interface CaseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string | null;
  onCustomerClick?: (customerId: string) => void;
  onScenarioClick?: (scenarioId: string) => void;
  onMaterialClick?: (materialId: string) => void;
}

function OwnerList({ owners }: { owners: CaseOwner[] | null | undefined }) {
  if (!owners || owners.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {owners.map((owner) => (
        <div
          key={owner.id}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-base)] rounded-full text-sm"
        >
          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
            {owner.name?.charAt(0) || '?'}
          </div>
          <span>{owner.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function CaseDrawer({
  open,
  onOpenChange,
  caseId,
  onCustomerClick,
  onScenarioClick,
  onMaterialClick,
}: CaseDrawerProps) {
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !caseId) return;
    let cancelled = false;
    setLoading(true);
    setCaseData(null);
    fetchCaseDetail(caseId)
      .then((data: CaseDetail) => {
        if (!cancelled) setCaseData(data);
      })
      .catch((err) => {
        logger.error('获取案例详情失败', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, caseId]);

  const headerIcon = (
    <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--primary-soft)] text-primary flex items-center justify-center">
      <BookOpen size={20} strokeWidth={1.8} />
    </div>
  );

  const titleContent = (
    <div className="flex items-start gap-3">
      {headerIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold leading-7">
            {loading ? '加载中…' : caseData?.deptName || '案例详情'}
          </span>
          {caseData?.maturity && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0 font-normal">
              {caseData.maturity}
            </Badge>
          )}
          {caseData?.externalLevel && (
            <Badge variant="outline" className="text-[11px] px-2 py-0 font-normal">
              {caseData.externalLevel}
            </Badge>
          )}
        </div>
        {caseData?.info && (
          <p className="m-0 mt-1 text-sm text-[var(--caption)] whitespace-pre-wrap break-words line-clamp-2">
            {caseData.info}
          </p>
        )}
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
      ) : caseData ? (
        <>
          {/* 概要信息 */}
          {caseData.info && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
                概要
              </h4>
              <p className="m-0 text-sm whitespace-pre-wrap break-words">
                {caseData.info}
              </p>
            </div>
          )}

          {/* 基本信息 */}
          <CollapsiblePanel title="基本信息" defaultOpen>
            <DescriptionList
              variant="two-col"
              items={[
                { label: '复杂度', value: caseData.complexity },
                { label: '商用价值分', value: caseData.commercialScore?.toString() || null },
                { label: '评估分', value: caseData.evalScore?.toString() || null },
                { label: '域', value: caseData.domainL1 },
                { label: '价值层级', value: caseData.valueLevel },
                { label: '是否量化', value: caseData.hasQuantResult },
              ]}
            />
          </CollapsiblePanel>

          {/* 质量 */}
          <CollapsiblePanel title="质量信息">
            <DescriptionList
              variant="two-col"
              items={[
                { label: '完整度', value: caseData.completeness },
                { label: '成熟度', value: caseData.maturity },
                { label: '审核状态', value: caseData.auditStatus },
                { label: '外部级别', value: caseData.externalLevel },
              ]}
            />
          </CollapsiblePanel>

          {/* 负责人 */}
          {caseData.owners && caseData.owners.length > 0 && (
            <CollapsiblePanel title="负责人" defaultOpen>
              <OwnerList owners={caseData.owners} />
            </CollapsiblePanel>
          )}

          {/* 业务信息 */}
          {caseData.info && (
            <CollapsiblePanel title="业务信息">
              <div className="text-sm whitespace-pre-wrap break-words">
                {caseData.info}
              </div>
            </CollapsiblePanel>
          )}

          {/* 关联客户 */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联客户 ({caseData.customers?.length ?? 0})
            </h4>
            <LinkList
              items={caseData.customers?.map(customerToLinkItem)}
              icon="customer"
              onItemClick={onCustomerClick}
              emptyText="暂无关联客户"
            />
          </div>

          {/* 关联场景 */}
          <div className="mt-5">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联场景 ({caseData.scenarios?.length ?? 0})
            </h4>
            <LinkList
              items={caseData.scenarios?.map(scenarioToLinkItem)}
              icon="scenario"
              onItemClick={onScenarioClick}
              emptyText="暂无关联场景"
            />
          </div>

          {/* 关联资料 */}
          <div className="mt-5">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联资料 ({caseData.materials?.length ?? 0})
            </h4>
            <LinkList
              items={caseData.materials?.map(materialToLinkItem)}
              icon="material"
              onItemClick={onMaterialClick}
              emptyText="暂无关联资料"
            />
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          未找到案例信息
        </div>
      )}
    </DrawerShell>
  );
}
