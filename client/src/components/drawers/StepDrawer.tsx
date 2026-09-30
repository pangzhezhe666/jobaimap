import { useEffect, useState } from 'react';
import { ListOrdered } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchStepDetail } from '@client/src/api';
import type { StepDetail } from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import DrawerShell from './DrawerShell';
import CollapsiblePanel from './CollapsiblePanel';
import DescriptionList from './DescriptionList';
import LinkList, { scenarioToLinkItem, materialToLinkItem } from './LinkList';

interface StepDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: string | null;
  onScenarioClick?: (scenarioId: string) => void;
  onMaterialClick?: (materialId: string) => void;
}

function AiRatioBar({
  aiRatio,
  humanRatio,
  collabRatio,
}: {
  aiRatio: number | null;
  humanRatio: number | null;
  collabRatio: number | null;
}) {
  const total = (aiRatio ?? 0) + (humanRatio ?? 0) + (collabRatio ?? 0) || 1;
  const aiPct = Math.round(((aiRatio ?? 0) / total) * 100);
  const coPct = Math.round(((collabRatio ?? 0) / total) * 100);
  const huPct = Math.round(((humanRatio ?? 0) / total) * 100);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-2.5 rounded-full bg-[#eef0f3] overflow-hidden flex">
          <div
            className="h-full bg-[#18b886]"
            style={{ width: `${aiPct}%` }}
          />
          <div
            className="h-full bg-[#f2a437]"
            style={{ width: `${coPct}%` }}
          />
          <div
            className="h-full bg-[#a8adb5]"
            style={{ width: `${huPct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-5 mt-2 text-[11px] text-[var(--placeholder)]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#18b886] inline-block" />
          AI {aiPct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f2a437] inline-block" />
          协同 {coPct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a8adb5] inline-block" />
          人工 {huPct}%
        </span>
      </div>
    </div>
  );
}

export default function StepDrawer({
  open,
  onOpenChange,
  stepId,
  onScenarioClick,
  onMaterialClick,
}: StepDrawerProps) {
  const [step, setStep] = useState<StepDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !stepId) return;
    let cancelled = false;
    setLoading(true);
    setStep(null);
    fetchStepDetail(stepId)
      .then((data: StepDetail) => {
        if (!cancelled) setStep(data);
      })
      .catch((err) => {
        logger.error('获取步骤详情失败', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, stepId]);

  const headerLeft = (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full border border-primary text-primary text-xs font-semibold flex items-center justify-center bg-white">
        {step?.orderNum ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold leading-7">
            {loading ? '加载中…' : step?.name || '步骤详情'}
          </span>
          {step?.taskType && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0 font-normal">
              {step.taskType}
            </Badge>
          )}
          {step?.isHiddenWork && step.isHiddenWork === '是' && (
            <Badge variant="outline" className="text-[11px] px-2 py-0 font-normal">
              隐性工作
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
      title={headerLeft}
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          加载中…
        </div>
      ) : step ? (
        <>
          {/* AI 三段占比 */}
          <div className="mb-5">
            <div className="text-xs font-medium text-[var(--caption)] mb-2">
              AI 三段占比
            </div>
            <AiRatioBar
              aiRatio={step.aiRatio}
              humanRatio={step.humanRatio}
              collabRatio={step.collabRatio}
            />
          </div>

          {/* 分组面板 */}
          <CollapsiblePanel title="基本信息" defaultOpen>
            <DescriptionList
              variant="two-col"
              items={[
                { label: '触发条件', value: step.trigger },
                { label: '前置条件', value: step.precondition },
                { label: '输入', value: step.input },
                { label: '输出', value: step.output },
              ]}
            />
          </CollapsiblePanel>

          <CollapsiblePanel title="执行动作">
            <div className="text-sm whitespace-pre-wrap break-words">
              {step.action || '—'}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="AI 能力">
            <DescriptionList
              variant="one-col"
              items={[
                { label: 'AI 能做什么', value: step.aiCanDo },
                { label: 'AI 不能做什么', value: step.aiNotDo },
                { label: 'AI 无法推理', value: step.aiCannotReason },
              ]}
            />
          </CollapsiblePanel>

          <CollapsiblePanel title="AI 准备">
            <div className="text-sm whitespace-pre-wrap break-words">
              {step.aiPrepare || '—'}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="人工参与">
            <div className="text-sm whitespace-pre-wrap break-words">
              {step.humanStillDo || '—'}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="专家方式">
            <div className="text-sm whitespace-pre-wrap break-words">
              {step.expertWay || '—'}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="确认机制">
            <DescriptionList
              variant="two-col"
              items={[
                { label: '谁来确认', value: step.confirmWho },
                { label: '在哪里确认', value: step.confirmWhere },
              ]}
            />
          </CollapsiblePanel>

          <CollapsiblePanel title="异常处理">
            <DescriptionList
              variant="two-col"
              items={[
                { label: '异常处理', value: step.exception },
                { label: '超时处理', value: step.timeout },
              ]}
            />
          </CollapsiblePanel>

          <CollapsiblePanel title="其他信息">
            <DescriptionList
              variant="two-col"
              items={[
                { label: '关键指标', value: step.keyMetrics },
                { label: '依赖项', value: step.dependencies },
                { label: '协作方', value: step.collaborators },
                { label: '难点说明', value: step.difficultyNote },
              ]}
            />
          </CollapsiblePanel>

          {/* 关联场景 */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联场景 ({step.scenarios?.length ?? 0})
            </h4>
            <LinkList
              items={step.scenarios?.map(scenarioToLinkItem)}
              icon="scenario"
              onItemClick={onScenarioClick}
              emptyText="暂无关联场景"
            />
          </div>

          {/* 关联资料 */}
          <div className="mt-5">
            <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
              关联资料 ({step.materials?.length ?? 0})
            </h4>
            <LinkList
              items={step.materials?.map(materialToLinkItem)}
              icon="material"
              onItemClick={onMaterialClick}
              emptyText="暂无关联资料"
            />
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          未找到步骤信息
        </div>
      )}
    </DrawerShell>
  );
}
