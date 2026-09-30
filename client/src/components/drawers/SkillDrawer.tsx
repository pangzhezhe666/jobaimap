import { useEffect, useState } from 'react';
import { Sparkles, ExternalLink, Paperclip, FileText } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchSkillDetail } from '@client/src/api';
import type { SkillDetail } from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import DrawerShell from './DrawerShell';
import DescriptionList from './DescriptionList';
import LinkList, { scenarioToLinkItem, materialToLinkItem } from './LinkList';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

interface SkillDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillId: string | null;
  onScenarioClick?: (scenarioId: string) => void;
  onMaterialClick?: (materialId: string) => void;
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="text-sm font-medium text-[var(--caption)] mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  return (
    <div
      className="bg-[var(--bg-base)] rounded-md p-3 font-mono text-xs leading-[18px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto border border-[var(--line-component)]"
    >
      {content}
    </div>
  );
}

function formatPct(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  return `${value.toFixed(1)}%`;
}

function formatNum(value: number | string | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export default function SkillDrawer({
  open,
  onOpenChange,
  skillId,
  onScenarioClick,
  onMaterialClick,
}: SkillDrawerProps) {
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !skillId) return;
    let cancelled = false;
    setLoading(true);
    setSkill(null);
    fetchSkillDetail(skillId)
      .then((data: SkillDetail) => {
        if (!cancelled) setSkill(data);
      })
      .catch((err) => {
        logger.error('获取 Skill 详情失败', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, skillId]);

  const headerIcon = (
    <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--primary-soft)] text-primary flex items-center justify-center">
      <Sparkles size={20} strokeWidth={1.8} />
    </div>
  );

  const titleContent = (
    <div className="flex items-start gap-3">
      {headerIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold leading-7">
            {loading ? '加载中…' : skill?.name || 'Skill 详情'}
          </span>
          {skill?.version && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0 font-normal">
              v{skill.version}
            </Badge>
          )}
        </div>
        {skill?.description && (
          <p className="m-0 mt-1 text-sm text-[var(--caption)] whitespace-pre-wrap break-words">
            {skill.description}
          </p>
        )}
      </div>
    </div>
  );

  const footer = skill?.url ? (
    <div className="flex items-center gap-2">
      <Button asChild variant="default" size="default">
        <UniversalLink
          to={skill.url}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline inline-flex items-center gap-2"
        >
          <ExternalLink size={16} strokeWidth={1.8} />
          打开 Skill 地址
        </UniversalLink>
      </Button>
    </div>
  ) : null;

  const dlItems = skill
    ? [
        { label: '触发条件', value: skill.trigger },
        { label: '输入', value: skill.input },
        { label: '输出产物', value: skill.output },
        { label: '判断标准', value: skill.criteria, multiline: true },
        { label: '准确率', value: formatPct(skill.accuracy) },
        { label: '返工率', value: formatPct(skill.reworkRate) },
        { label: '耗时', value: formatNum(skill.duration) },
        { label: '闭环时效', value: skill.closureMinutes ? `${skill.closureMinutes} 分钟` : null },
        { label: '异常升级', value: skill.escalation },
      ]
    : [];

  const packageList = skill?.packages && skill.packages.length > 0 ? skill.packages : [];

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      kicker="Skill 业务方法"
      title={titleContent}
      footer={footer}
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          加载中…
        </div>
      ) : skill ? (
        <>
          <DrawerSection title="基本信息">
            <DescriptionList items={dlItems} />
          </DrawerSection>

          {skill.skillMd && (
            <DrawerSection title="SKILL.md">
              <CodeBlock content={skill.skillMd} />
            </DrawerSection>
          )}

          {skill.scripts && (
            <DrawerSection title="scripts">
              <CodeBlock content={skill.scripts} />
            </DrawerSection>
          )}

          {skill.referenceDocs && (
            <DrawerSection title="references">
              <CodeBlock content={skill.referenceDocs} />
            </DrawerSection>
          )}

          {packageList.length > 0 && (
            <DrawerSection title={`Skill 包附件（${packageList.length}）`}>
              <div className="space-y-2">
                {packageList.map((pkg, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-md bg-[var(--bg-content)] border border-[var(--line-card)]"
                  >
                    <Paperclip size={16} className="shrink-0 text-[var(--caption)]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {pkg.name}
                      </div>
                      <div className="text-xs text-[var(--placeholder)]">
                        {pkg.size ? `${(pkg.size / 1024).toFixed(1)} KB` : '\u00A0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--placeholder)] mt-2">
                附件需在多维表格该 Skill 记录中下载（见底部按钮）。
              </p>
            </DrawerSection>
          )}

          {skill.materials?.length > 0 && (
            <DrawerSection title={`来源与证据（${skill.materials.length}）`}>
              <LinkList
                items={skill.materials.map(materialToLinkItem)}
                icon="material"
                onItemClick={onMaterialClick}
                emptyText="暂无来源证据"
              />
            </DrawerSection>
          )}

          <DrawerSection title={`关联场景 (${skill.scenarios?.length ?? 0})`}>
            <LinkList
              items={skill.scenarios?.map(scenarioToLinkItem)}
              icon="scenario"
              onItemClick={onScenarioClick}
              emptyText="暂无关联场景"
            />
          </DrawerSection>
        </>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--placeholder)]">
          未找到 Skill 信息
        </div>
      )}
    </DrawerShell>
  );
}
