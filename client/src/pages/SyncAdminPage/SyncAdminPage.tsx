import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { fetchSyncStatus } from '@client/src/api';
import type {
  SyncStatusResponse,
  DataSourceTableItem,
} from '@shared/api.interface';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Loader2,
} from 'lucide-react';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  } catch {
    return value;
  }
}

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString();
}

interface TableStatusMeta {
  label: string;
  color: string;
  bg: string;
  dotColor: string;
}

function getTableStatusMeta(
  status: DataSourceTableItem['status'],
): TableStatusMeta {
  switch (status) {
    case 'healthy':
      return {
        label: '正常',
        color: '#35bd4b',
        bg: 'rgba(53,189,75,0.08)',
        dotColor: '#35bd4b',
      };
    case 'warning':
      return {
        label: '异常',
        color: '#ff811a',
        bg: 'rgba(255,129,26,0.08)',
        dotColor: '#ff811a',
      };
    case 'empty':
    default:
      return {
        label: '空表',
        color: '#8f959e',
        bg: 'rgba(143,149,158,0.08)',
        dotColor: '#8f959e',
      };
  }
}

interface HealthStatusMeta {
  label: string;
  color: string;
  bg: string;
  dotColor: string;
}

function getHealthStatusMeta(
  status: SyncStatusResponse['healthStatus'],
): HealthStatusMeta {
  switch (status) {
    case 'healthy':
      return {
        label: '健康',
        color: '#35bd4b',
        bg: 'rgba(53,189,75,0.08)',
        dotColor: '#35bd4b',
      };
    case 'degraded':
      return {
        label: '降级',
        color: '#ff811a',
        bg: 'rgba(255,129,26,0.08)',
        dotColor: '#ff811a',
      };
    case 'unknown':
    default:
      return {
        label: '未知',
        color: '#8f959e',
        bg: 'rgba(143,149,158,0.08)',
        dotColor: '#8f959e',
      };
  }
}

interface StatusBadgeProps {
  status: DataSourceTableItem['status'];
}

const TableStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = getTableStatusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        color: style.color,
        backgroundColor: style.bg,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: style.dotColor }}
      />
      {style.label}
    </span>
  );
};

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  icon,
  iconColor,
  iconBg,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-md flex-shrink-0"
        style={{ width: '40px', height: '40px', backgroundColor: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div
          className="text-xs mb-0.5"
          style={{ color: 'var(--placeholder)' }}
        >
          {label}
        </div>
        <div
          className="text-sm font-medium truncate"
          style={{ color: 'var(--title)' }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

const SyncAdminPage: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchSyncStatus();
      setStatus(data);
    } catch (error) {
      logger.error('获取数据源状态失败', error);
      toast.error('获取数据源状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const healthMeta = status
    ? getHealthStatusMeta(status.healthStatus)
    : getHealthStatusMeta('unknown');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2
          className="animate-spin"
          size={24}
          style={{ color: 'var(--primary)' }}
        />
        <span className="ml-2 text-sm" style={{ color: 'var(--caption)' }}>
          加载中…
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1
          className="text-xl font-semibold leading-7"
          style={{ color: 'var(--title)' }}
        >
          数据源状态
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--caption)' }}>
          查看 Base 数据库同步表 00–12 的健康状态与记录数
        </p>
      </div>

      {status?.syncDisabled && (
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: 'rgba(20,86,240,0.06)',
            border: '1px solid rgba(20,86,240,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <Info
              size={18}
              style={{
                color: 'var(--primary)',
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--title)' }}
              >
                同步功能已停用
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--caption)' }}
              >
                {status.syncDisabledReason ||
                  '应用直接读取数据库同步表，数据随 Base 自动同步。'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-lg bg-white p-5"
        style={{ border: '1px solid var(--line-card)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoItem
            label="数据源类型"
            value={
              <div className="flex items-center gap-2">
                <span>{status?.sourceLabel || 'Base 数据库同步表'}</span>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    color: healthMeta.color,
                    backgroundColor: healthMeta.bg,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: healthMeta.dotColor }}
                  />
                  {healthMeta.label}
                </span>
              </div>
            }
            icon={<Database size={18} />}
            iconColor="#1456f0"
            iconBg="rgba(20,86,240,0.08)"
          />

          <InfoItem
            label="总表数"
            value={`${status?.totalTables ?? 0} / 13`}
            icon={<Database size={18} />}
            iconColor="#1456f0"
            iconBg="rgba(20,86,240,0.08)"
          />

          <InfoItem
            label="总记录数"
            value={formatNum(status?.totalRecords)}
            icon={<CheckCircle2 size={18} />}
            iconColor="#35bd4b"
            iconBg="rgba(53,189,75,0.08)"
          />

          <InfoItem
            label="最近更新"
            value={formatDateTime(status?.lastSyncAt)}
            icon={<Clock size={18} />}
            iconColor="#1456f0"
            iconBg="rgba(20,86,240,0.08)"
          />
        </div>
      </div>

      <div
        className="rounded-lg bg-white overflow-hidden"
        style={{ border: '1px solid var(--line-card)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--divider)' }}
        >
          <div className="flex items-center gap-2">
            <Database size={16} style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--title)' }}>
              数据表列表
            </span>
            <span className="text-xs" style={{ color: 'var(--placeholder)' }}>
              共 {status?.tables?.length || 0} 张表
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '720px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th
                  className="text-left font-medium px-5 py-2.5 text-xs w-16"
                  style={{ color: 'var(--caption)', whiteSpace: 'nowrap' }}
                >
                  序号
                </th>
                <th
                  className="text-left font-medium px-3 py-2.5 text-xs"
                  style={{ color: 'var(--caption)', whiteSpace: 'nowrap' }}
                >
                  表名
                </th>
                <th
                  className="text-left font-medium px-3 py-2.5 text-xs"
                  style={{ color: 'var(--caption)', whiteSpace: 'nowrap' }}
                >
                  状态
                </th>
                <th
                  className="text-right font-medium px-3 py-2.5 text-xs"
                  style={{ color: 'var(--caption)', whiteSpace: 'nowrap' }}
                >
                  记录数
                </th>
                <th
                  className="text-left font-medium px-5 py-2.5 text-xs"
                  style={{ color: 'var(--caption)', whiteSpace: 'nowrap' }}
                >
                  最后更新时间
                </th>
              </tr>
            </thead>
            <tbody>
              {status?.tables && status.tables.length > 0 ? (
                status.tables.map(
                  (table: DataSourceTableItem, idx: number) => (
                    <tr
                      key={table.tableName}
                      style={{
                        borderTop:
                          idx === 0 ? 'none' : '1px solid var(--divider)',
                      }}
                    >
                      <td
                        className="px-5 py-3 text-sm"
                        style={{
                          color: 'var(--placeholder)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {String(idx).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-3">
                        <div
                          className="text-sm font-medium"
                          style={{ color: 'var(--title)' }}
                        >
                          {table.displayName || table.tableName}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{
                            color: 'var(--placeholder)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {table.tableName}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <TableStatusBadge status={table.status} />
                      </td>
                      <td
                        className="px-3 py-3 text-right text-sm"
                        style={{ color: 'var(--title)' }}
                      >
                        {formatNum(table.recordCount)}
                      </td>
                      <td
                        className="px-5 py-3 text-sm"
                        style={{
                          color: 'var(--caption)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(table.lastUpdated)}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-sm"
                    style={{ color: 'var(--placeholder)' }}
                  >
                    <AlertCircle
                      size={24}
                      className="mx-auto mb-2"
                      style={{ opacity: 0.5 }}
                    />
                    暂无数据表
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SyncAdminPage;
