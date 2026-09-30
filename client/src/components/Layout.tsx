import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Search, Building2, BarChart3, Users, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { globalSearch, fetchSyncStatus } from '@client/src/api';
import type { GlobalSearchResult, SyncStatusResponse } from '@shared/api.interface';

const Layout = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [dataUpdatedText, setDataUpdatedText] = useState<string>('数据更新时间加载中...');
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    setSearching(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await globalSearch(value, 6);
        setSearchResults(results);
      } catch (error) {
        logger.error('全局搜索失败', error);
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);
  };

  const loadDataUpdateTime = async () => {
    try {
      const status: SyncStatusResponse = await fetchSyncStatus();
      const timeIso = status.latestDataAt || status.lastSyncAt;
      if (timeIso) {
        const date = new Date(timeIso);
        const formatter = new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value ?? '';
        const dateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
        const timeStr = `${getPart('hour')}:${getPart('minute')}`;
        setDataUpdatedText(
          `数据更新于 ${dateStr} ${timeStr}（${status.sourceLabel}）`,
        );
      } else {
        setDataUpdatedText('数据更新时间暂不可用');
      }
    } catch (err) {
      logger.error('获取数据更新时间失败', err);
      setDataUpdatedText('数据更新时间暂不可用');
    }
  };

  useEffect(() => {
    loadDataUpdateTime();
  }, []);

  const navigateTo = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const resultGroups = [
    { label: '行业', key: 'industries' as const, pathPrefix: '/industries', icon: Building2, subtitle: (item: { roleCount: number }) => `${item.roleCount} 岗位` },
    { label: '岗位', key: 'roles' as const, pathPrefix: '/roles', icon: Users, subtitle: (item: { scenarioCount: number }) => `${item.scenarioCount} 场景` },
    { label: '业务场景', key: 'scenarios' as const, pathPrefix: '/scenarios', icon: Zap, subtitle: (item: { stepCount: number }) => `${item.stepCount} 子步骤` },
  ];

  const hasResults = searchResults && resultGroups.some(g => searchResults[g.key]?.length > 0);

  return (
    <div className="min-h-screen bg-white text-[color:var(--title)] font-[family-name:var(--font-sans)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: '0.5px solid var(--divider)' }}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 px-8" style={{ height: '60px' }}>
          {/* Brand */}
          <div
            className="flex items-baseline gap-2 cursor-pointer justify-self-start"
            onClick={() => navigate('/')}
          >
            <div
              className="relative mr-0.5"
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                background: 'var(--primary)',
                top: '5px',
              }}
            >
              <div
                className="absolute"
                style={{
                  inset: '6px',
                  border: '1.5px solid #fff',
                  borderRadius: '2px',
                  borderTop: 0,
                  borderRight: 0,
                }}
              />
            </div>
            <span className="text-base font-semibold leading-6" style={{ color: 'var(--title)' }}>
              岗位 AI 地图
            </span>
            <span style={{ fontSize: '11px', color: 'var(--placeholder)', letterSpacing: '0.4px' }}>
              Job AI Map
            </span>
          </div>

          {/* Main Nav */}
          <nav className="flex gap-1 justify-self-center">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-[7px] px-[14px] rounded-md text-sm transition-colors ${
                  isActive
                    ? 'font-medium'
                    : 'hover:bg-[color:var(--side-hover)]'
                }`
              }
              style={(isActive) => ({
                height: '34px',
                background: isActive.isActive ? 'var(--side-selected)' : undefined,
                color: isActive.isActive ? 'var(--title)' : 'var(--caption)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Building2
                    size={16}
                    style={{ color: isActive ? 'var(--primary)' : 'currentColor' }}
                  />
                  <span>行业浏览</span>
                </>
              )}
            </NavLink>
            <NavLink
              to="/insights"
              className={({ isActive }) =>
                `flex items-center gap-[7px] px-[14px] rounded-md text-sm transition-colors ${
                  isActive
                    ? 'font-medium'
                    : 'hover:bg-[color:var(--side-hover)]'
                }`
              }
              style={({ isActive }) => ({
                height: '34px',
                background: isActive ? 'var(--side-selected)' : undefined,
                color: isActive ? 'var(--title)' : 'var(--caption)',
              })}
            >
              {({ isActive }) => (
                <>
                  <BarChart3
                    size={16}
                    style={{ color: isActive ? 'var(--primary)' : 'currentColor' }}
                  />
                  <span>全局洞察</span>
                </>
              )}
            </NavLink>
          </nav>

          {/* Right Tools */}
          <div className="flex items-center gap-[14px] justify-self-end">
            <div className="relative" ref={searchRef}>
              <div className="relative flex items-center">
                <Search
                  size={14}
                  className="absolute pointer-events-none"
                  style={{ left: '10px', color: 'var(--placeholder)' }}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="搜索行业 / 岗位 / 业务场景…"
                  className="outline-none transition-all text-sm"
                  style={{
                    width: '264px',
                    height: '34px',
                    padding: '0 12px 0 34px',
                    border: '0.5px solid var(--line-component)',
                    borderRadius: '6px',
                    background: '#fff',
                    color: 'var(--title)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-soft)';
                    if (searchQuery) setSearchOpen(true);
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--line-component)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Search Panel */}
              {searchOpen && (
                <div
                  className="absolute right-0 overflow-auto z-60"
                  style={{
                    top: '40px',
                    width: '420px',
                    maxHeight: '440px',
                    background: '#fff',
                    border: '0.5px solid var(--line-card)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 28px rgba(31,35,41,0.14)',
                    padding: '6px',
                  }}
                >
                  {searching && (
                    <div
                      className="text-center"
                      style={{ padding: '22px 12px', color: 'var(--placeholder)', fontSize: '13px' }}
                    >
                      搜索中…
                    </div>
                  )}
                  {!searching && hasResults && (
                    <>
                      {resultGroups.map(group => {
                        const items = searchResults?.[group.key];
                        if (!items || items.length === 0) return null;
                        const IconComp = group.icon;
                        return (
                          <div key={group.key}>
                            <div
                              style={{
                                padding: '7px 10px 3px',
                                fontSize: '11px',
                                color: 'var(--placeholder)',
                                fontWeight: 500,
                              }}
                            >
                              {group.label}
                            </div>
                            {items.map(item => (
                              <div
                                key={item.id}
                                onClick={() => navigateTo(`${group.pathPrefix}/${item.id}`)}
                                className="flex items-center gap-[9px] rounded-md cursor-pointer"
                                style={{
                                  padding: '8px 10px',
                                  color: 'var(--title)',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--side-hover)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = '';
                                }}
                              >
                                <IconComp size={14} style={{ color: 'var(--placeholder)' }} />
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                                  <span style={{ fontSize: '12px', color: 'var(--placeholder)' }}>
                                    {group.subtitle(item)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  )}
                  {!searching && !hasResults && searchQuery && (
                    <div
                      className="text-center"
                      style={{ padding: '22px 12px', color: 'var(--placeholder)', fontSize: '13px' }}
                    >
                      没有找到「{searchQuery}」相关的行业 / 岗位 / 场景
                    </div>
                  )}
                </div>
              )}
            </div>


          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ minHeight: 'calc(100vh - 60px - 46px)' }}>
        <div
          className="mx-auto"
          style={{
            maxWidth: '1240px',
            padding: '28px 32px 56px',
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="flex items-center justify-between"
        style={{
          height: '46px',
          borderTop: '0.5px solid var(--divider)',
          padding: '0 32px',
          fontSize: '12px',
          color: 'var(--placeholder)',
        }}
      >
        <span>岗位 AI 地图 · Job AI Map</span>
        <span>{dataUpdatedText}</span>
      </footer>
    </div>
  );
};

export default Layout;
