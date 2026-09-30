import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, Users, Zap, ListChecks, ChevronRight, RefreshCw } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { fetchIndustries } from '@client/src/api';
import { Checkbox } from '@client/src/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import type {
  IndustrySummary,
  PaginatedResponse,
} from '@shared/api.interface';

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<IndustrySummary[]>([]);
  const [allIndustries, setAllIndustries] = useState<IndustrySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string>('');
  const [hasRoles, setHasRoles] = useState(false);

  const loadIndustries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: PaginatedResponse<IndustrySummary> = await fetchIndustries({
        page: 1,
        pageSize: 200,
        keyword: keyword.trim() || undefined,
        category: category || undefined,
        hasRoles,
        sortBy: 'roleCount',
        sortOrder: 'desc',
      });
      setIndustries(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('加载行业列表失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadAllIndustries = async () => {
    try {
      const data: PaginatedResponse<IndustrySummary> = await fetchIndustries({
        page: 1,
        pageSize: 200,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      setAllIndustries(data.items);
    } catch (err) {
      logger.error('加载全量行业列表失败', err);
    }
  };

  useEffect(() => {
    loadIndustries();
    loadAllIndustries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, category, hasRoles]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allIndustries.forEach((ind: IndustrySummary) => {
      if (ind.category) set.add(ind.category);
    });
    return Array.from(set).sort();
  }, [allIndustries]);

  const handleRetry = () => {
    loadIndustries();
  };

  if (error && industries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-md text-sm transition-colors"
          style={{
            height: '34px',
            padding: '0 14px',
            border: '0.5px solid var(--line-component)',
            color: 'var(--title)',
            background: '#fff',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--side-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fff';
          }}
        >
          <RefreshCw size={14} />
          重试
        </button>
      </div>
    );
  }

  return (
    <div data-ai-section-type="card-list">
      {/* Page Header */}
      <div
        className="flex items-end justify-between gap-5"
        style={{ marginBottom: '24px' }}
      >
        <div>
          <h1
            className="font-semibold m-0"
            style={{ fontSize: '24px', lineHeight: '36px', color: 'var(--title)' }}
          >
            行业浏览
          </h1>
          <p
            className="m-0"
            style={{
              marginTop: '6px',
              fontSize: '14px',
              color: 'var(--caption)',
            }}
          >
            从行业视角浏览 AI 岗位与业务场景
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="flex items-center gap-2.5 flex-wrap"
        style={{ marginBottom: '22px' }}
      >
        {/* Keyword Search */}
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute pointer-events-none"
            style={{ left: '9px', color: 'var(--placeholder)' }}
          />
          <input
            type="search"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索行业名称/范围定义"
            className="outline-none transition-all text-sm"
            style={{
              height: '34px',
              width: '260px',
              maxWidth: '100%',
              padding: '0 10px 0 32px',
              border: '0.5px solid var(--line-component)',
              borderRadius: '6px',
              background: '#fff',
              color: 'var(--title)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-soft)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--line-component)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Category Select */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            size="sm"
            style={{
              height: '34px',
              minWidth: '128px',
              border: '0.5px solid var(--line-component)',
              borderRadius: '6px',
              background: '#fff',
              fontSize: '13px',
            }}
          >
            <SelectValue placeholder="全部大类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部大类</SelectItem>
            {categories.map((cat: string) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Has Roles Checkbox */}
        <label
          className="flex items-center gap-2 cursor-pointer select-none"
          style={{ fontSize: '13px', color: 'var(--caption)' }}
        >
          <Checkbox
            checked={hasRoles}
            onCheckedChange={checked => setHasRoles(checked === true)}
          />
          仅看已梳理岗位
        </label>

        {/* Result Count */}
        <span
          className="ml-auto"
          style={{ fontSize: '12px', color: 'var(--placeholder)' }}
        >
          共 {total} 个行业
        </span>
      </div>

      {/* Industry Grid */}
      {loading && industries.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div style={{ color: 'var(--placeholder)', fontSize: '13px' }}>加载中…</div>
        </div>
      ) : industries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div style={{ color: 'var(--placeholder)', fontSize: '13px' }}>
            {keyword ? '没有找到匹配的行业' : '暂无行业数据'}
          </div>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {industries.map((industry: IndustrySummary) => {
            const hasRolesData = industry.roleCount > 0;
            return (
              <Link
                key={industry.id}
                to={`/industries/${industry.id}`}
                className="group flex flex-col rounded-lg bg-white"
                style={{
                  border: '0.5px solid var(--line-card)',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  minWidth: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(20,86,240,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--line-card)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Card Top: icon + name */}
                <div className="flex items-center gap-2.5" style={{ marginBottom: '10px' }}>
                  <div
                    className="flex items-center justify-center flex-none"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'var(--primary-soft)',
                      color: 'var(--primary)',
                    }}
                  >
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-medium truncate m-0"
                      style={{
                        fontSize: '15px',
                        lineHeight: '24px',
                        color: 'var(--title)',
                      }}
                    >
                      {industry.name}
                    </h3>
                  </div>
                </div>

                {/* Card Description (scope / range definition) */}
                <p
                  className="m-0 card-desc"
                  style={{
                    color: 'var(--caption)',
                    fontSize: '13px',
                    lineHeight: '20px',
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '40px',
                  }}
                >
                  {industry.scope || '暂无范围定义'}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: '12px' }}>
                  {industry.category && (
                    <span
                      className="inline-flex items-center"
                      style={{
                        fontSize: '11px',
                        padding: '1px 7px',
                        borderRadius: '4px',
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        lineHeight: '18px',
                      }}
                    >
                      {industry.category}
                    </span>
                  )}
                  {!hasRolesData && (
                    <span
                      className="inline-flex items-center"
                      style={{
                        fontSize: '11px',
                        padding: '1px 7px',
                        borderRadius: '4px',
                        background: 'var(--bg-base)',
                        color: 'var(--placeholder)',
                        lineHeight: '18px',
                      }}
                    >
                      待梳理
                    </span>
                  )}
                </div>

                {/* Card Stats */}
                <div
                  className="flex items-center gap-4 mt-auto pt-3 border-t"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--caption)' }}>
                    <b
                      className="block font-semibold"
                      style={{
                        fontSize: '18px',
                        color: 'var(--title)',
                        lineHeight: '26px',
                      }}
                    >
                      {industry.roleCount}
                    </b>
                    岗位
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--caption)' }}>
                    <b
                      className="block font-semibold"
                      style={{
                        fontSize: '18px',
                        color: 'var(--title)',
                        lineHeight: '26px',
                      }}
                    >
                      {industry.scenarioCount}
                    </b>
                    场景
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--caption)' }}>
                    <b
                      className="block font-semibold"
                      style={{
                        fontSize: '18px',
                        color: 'var(--title)',
                        lineHeight: '26px',
                      }}
                    >
                      {industry.stepCount}
                    </b>
                    子步骤
                  </div>
                  <div
                    className="ml-auto flex items-center transition-colors"
                    style={{ color: 'var(--placeholder)' }}
                  >
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
