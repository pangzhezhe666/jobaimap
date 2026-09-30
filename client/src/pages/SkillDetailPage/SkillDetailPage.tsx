import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchSkillDetail } from '@client/src/api';
import type { SkillDetail } from '@shared/api.interface';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Markdown } from '@client/src/components/ui/markdown';
import {
  ArrowLeft,
  RefreshCw,
  Brain,
  Zap,
  FileText,
  Package,
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Link as LinkIcon,
  List,
} from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: SkillDetail = await fetchSkillDetail(id);
      setSkill(data);
    } catch (err) {
      logger.error('加载 Skill 详情失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            返回
          </Button>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive">{error || 'Skill 不存在'}</div>
        <Button onClick={loadDetail} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  const infoFields: { label: string; value: string | null; icon: React.ReactNode }[] = [
    { label: '版本', value: skill.version, icon: <Package size={16} /> },
    { label: '触发词', value: skill.trigger, icon: <Zap size={16} /> },
  ];

  const detailSections: { key: string; label: string; value: string | null; icon: React.ReactNode }[] = [
    { key: 'input', label: '输入', value: skill.input, icon: <List size={16} /> },
    { key: 'output', label: '输出', value: skill.output, icon: <Target size={16} /> },
    { key: 'criteria', label: '评估标准', value: skill.criteria, icon: <CheckCircle2 size={16} /> },
    { key: 'escalation', label: '升级路径', value: skill.escalation, icon: <AlertTriangle size={16} /> },
    { key: 'scripts', label: '提示词脚本', value: skill.scripts, icon: <FileText size={16} /> },
    { key: 'referenceDocs', label: '参考文档', value: skill.referenceDocs, icon: <BookOpen size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          返回
        </Button>
      </div>

      {/* 头部信息 */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-semibold text-foreground truncate">
              {skill.name}
            </h1>
            {skill.version && (
              <Badge variant="outline" className="font-mono">
                v{skill.version}
              </Badge>
            )}
          </div>
          {skill.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {skill.description}
            </p>
          )}
          {skill.trigger && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">触发词：</span>
              <Badge variant="secondary">{skill.trigger}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* 信息概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-ai-section-type="card-stat">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(220_14%_96%)] flex items-center justify-center">
                <Zap size={18} className="text-[hsl(220_14%_40%)]" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">关联场景</div>
                <div className="text-xl font-semibold">{skill.scenarios.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(220_14%_96%)] flex items-center justify-center">
                <FileText size={18} className="text-[hsl(220_14%_40%)]" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">关联资料</div>
                <div className="text-xl font-semibold">{skill.materials.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(220_14%_96%)] flex items-center justify-center">
                <Package size={18} className="text-[hsl(220_14%_40%)]" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">依赖包</div>
                <div className="text-xl font-semibold">{skill.packages?.length ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">详细信息</CardTitle>
          <CardDescription>Skill 的核心配置与能力说明</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {detailSections.map(section =>
            section.value ? (
              <div key={section.key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {section.icon}
                  <span>{section.label}</span>
                </div>
                <div className="pl-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {section.value}
                </div>
              </div>
            ) : null
          )}
          {!detailSections.some(s => s.value) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无详细信息
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill MD 文档 */}
      {skill.skillMd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen size={18} />
              Skill 文档
            </CardTitle>
            <CardDescription>完整的 Skill 说明文档</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <Markdown>{skill.skillMd}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 外部链接 */}
      {skill.url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon size={18} />
              外部链接
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UniversalLink
              to={skill.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {skill.url}
              <LinkIcon size={14} />
            </UniversalLink>
          </CardContent>
        </Card>
      )}

      {/* 依赖包列表 */}
      {skill.packages && skill.packages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={18} />
              依赖包
            </CardTitle>
            <CardDescription>Skill 运行所需的依赖包</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skill.packages.map((pkg, index) => (
                <Badge key={index} variant="outline" className="gap-1.5">
                  <span className="font-mono">{pkg.name}</span>
                  <span className="text-muted-foreground">
                    {pkg.token}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关联场景 */}
      {skill.scenarios.length > 0 && (
        <Card data-ai-section-type="card-list">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={18} />
              关联业务场景
            </CardTitle>
            <CardDescription>
              共 {skill.scenarios.length} 个场景使用此 Skill
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skill.scenarios.map(scenario => (
                <Link
                  key={scenario.id}
                  to={`/scenarios/${scenario.id}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {scenario.name}
                      </div>
                      {scenario.brief && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {scenario.brief}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {scenario.status && (
                        <Badge variant="secondary" className="text-[10px]">
                          {scenario.status}
                        </Badge>
                      )}
                      {scenario.priority && (
                        <Badge variant="outline" className="text-[10px]">
                          {scenario.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关联资料 */}
      {skill.materials.length > 0 && (
        <Card data-ai-section-type="card-list">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={18} />
              关联资料
            </CardTitle>
            <CardDescription>
              共 {skill.materials.length} 份相关资料
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skill.materials.map(material => (
                <UniversalLink
                  key={material.id}
                  to={material.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-[hsl(220_14%_96%)] flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[hsl(220_14%_40%)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {material.name}
                      </div>
                      {material.updatedAt && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          更新于 {new Date(material.updatedAt).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                    </div>
                  </div>
                </UniversalLink>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
