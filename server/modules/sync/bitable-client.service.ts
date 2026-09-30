import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConnectionsService } from '@lark-apaas/miaoda-connections-sdk';

export interface BitableRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

interface ListRecordsResponse {
  code: number;
  msg: string;
  data: {
    items: BitableRecord[];
    page_token?: string;
    has_more?: boolean;
    total?: number;
  };
}

const CONNECTION_NAME = 'lark-bitable-sync';

const DEFAULT_TABLE_MAP: Record<string, string> = {
  functions: '',
  industries: '',
  roles: '',
  scenarios: '',
  steps: '',
  skills: '',
  materials: '',
  cases: '',
  customers: '',
  mcp: '',
  quizCards: '',
  samePromptRuns: '',
  seedBank: '',
};

const REQUIRED_TABLE_KEYS = Object.keys(DEFAULT_TABLE_MAP);

const LARK_OPEN_API_BASE = 'https://open.feishu.cn/open-apis';

export type ConnectionState =
  | 'not_created'
  | 'incomplete_fields'
  | 'invalid_table_map'
  | 'not_connected'
  | 'connected';

interface BitableAuthData {
  app_id?: string;
  app_secret?: string;
  bitable_app_token?: string;
  table_map?: string;
}

@Injectable()
export class BitableClientService implements OnModuleInit {
  private readonly logger = new Logger(BitableClientService.name);

  private appId = '';
  private appSecret = '';
  private appToken = '';
  private tableMap: Record<string, string> = { ...DEFAULT_TABLE_MAP };
  private connectionState: ConnectionState = 'not_created';
  private connectionMessage = '尚未配置飞书多维表格凭证';
  private lastLoadError: string | null = null;

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly connections: ConnectionsService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.loadCredentials();
    } catch (err) {
      this.logger.warn(`初始化凭证加载失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async loadCredentials(): Promise<void> {
    try {
      const connection = await this.connections.getConnection({
        connectionName: CONNECTION_NAME,
      });

      if (connection.state !== 'connected') {
        this.connectionState = 'not_connected';
        this.connectionMessage =
          connection.recoveryHint || '飞书多维表格凭证未连接或已失效';
        this.lastLoadError = connection.recoveryHint || null;
        this.clearSecrets();
        return;
      }

      const value = connection.value;
      if (!value || value.type !== 'custom') {
        this.connectionState = 'incomplete_fields';
        this.connectionMessage = '凭证类型不正确，需为「自定义」类型';
        this.lastLoadError = 'expected custom connection type';
        this.clearSecrets();
        return;
      }

      const authData = (value.authData ?? {}) as BitableAuthData;
      const appId = authData.app_id?.trim() ?? '';
      const appSecret = authData.app_secret?.trim() ?? '';
      const bitableAppToken = authData.bitable_app_token?.trim() ?? '';
      const tableMapRaw = authData.table_map?.trim() ?? '';

      const missing: string[] = [];
      if (!appId) missing.push('app_id');
      if (!appSecret) missing.push('app_secret');
      if (!bitableAppToken) missing.push('bitable_app_token');

      if (missing.length > 0) {
        this.connectionState = 'incomplete_fields';
        this.connectionMessage = `凭证字段不完整，缺少：${missing.join('、')}`;
        this.lastLoadError = `missing fields: ${missing.join(',')}`;
        this.clearSecrets();
        return;
      }

      const parseResult = this.parseTableMap(tableMapRaw);
      if (!parseResult.ok) {
        this.connectionState = 'invalid_table_map';
        this.connectionMessage = parseResult.message;
        this.lastLoadError = parseResult.message;
        this.clearSecrets();
        return;
      }

      this.appId = appId;
      this.appSecret = appSecret;
      this.appToken = bitableAppToken;
      this.tableMap = { ...DEFAULT_TABLE_MAP, ...parseResult.map };
      this.connectionState = 'connected';
      this.connectionMessage = '飞书多维表格凭证已配置';
      this.lastLoadError = null;
      this.logger.log('飞书多维表格凭证加载成功');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('not found') || msg.includes('不存在') || msg.includes('404')) {
        this.connectionState = 'not_created';
        this.connectionMessage = '尚未创建飞书多维表格凭证';
      } else {
        this.connectionState = 'not_connected';
        this.connectionMessage = '凭证读取失败，请检查配置';
      }
      this.lastLoadError = msg;
      this.clearSecrets();
      this.logger.warn(`加载凭证失败: ${msg}`);
    }
  }

  private clearSecrets(): void {
    this.appId = '';
    this.appSecret = '';
    this.appToken = '';
    this.tableMap = { ...DEFAULT_TABLE_MAP };
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  private parseTableMap(
    raw: string,
  ): { ok: true; map: Record<string, string>; message?: never } | { ok: false; message: string; map?: never } {
    if (!raw) {
      return { ok: false, message: 'table_map 字段为空' };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, message: 'table_map 字段不是合法 JSON' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, message: 'table_map 字段必须是 JSON 对象' };
    }
    const obj = parsed as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        result[key] = val;
      }
    }
    const hasAny = REQUIRED_TABLE_KEYS.some((k: string) => Boolean(result[k]));
    if (!hasAny) {
      return { ok: false, message: 'table_map 未包含任何已配置的表映射' };
    }
    return { ok: true, map: result };
  }

  async reloadCredentials(): Promise<{ state: ConnectionState; message: string }> {
    await this.loadCredentials();
    return { state: this.connectionState, message: this.connectionMessage };
  }

  isConfigured(): boolean {
    return this.connectionState === 'connected';
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getConnectionMessage(): string {
    return this.connectionMessage;
  }

  getTableId(key: string): string {
    return this.tableMap[key] ?? '';
  }

  getAllTableKeys(): string[] {
    return Object.keys(this.tableMap);
  }

  getConfiguredTableCount(): number {
    return Object.values(this.tableMap).filter((v: string) => Boolean(v)).length;
  }

  async getTenantAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60_000) {
      return this.cachedToken;
    }

    const url = `${LARK_OPEN_API_BASE}/auth/v3/tenant_access_token/internal`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret,
      }),
    });

    if (!res.ok) {
      throw new Error(`获取 tenant_access_token 失败: HTTP ${res.status}`);
    }

    const data: { code: number; msg: string; tenant_access_token?: string; expire?: number } =
      await res.json();
    if (data.code !== 0 || !data.tenant_access_token) {
      throw new Error(
        `获取 tenant_access_token 失败: code=${data.code} msg=${data.msg}`,
      );
    }

    this.cachedToken = data.tenant_access_token;
    this.tokenExpiresAt = now + (data.expire ?? 7200) * 1000;
    this.logger.debug('tenant_access_token 刷新成功');
    return this.cachedToken;
  }

  async testConnection(): Promise<{ key: string; tableId: string; found: boolean }[]> {
    const results: { key: string; tableId: string; found: boolean }[] = [];
    const token = await this.getTenantAccessToken();

    for (const key of Object.keys(this.tableMap)) {
      const tableId = this.tableMap[key];
      if (!tableId) {
        results.push({ key, tableId: '', found: false });
        continue;
      }
      try {
        const url =
          `${LARK_OPEN_API_BASE}/bitable/v1/apps/${encodeURIComponent(this.appToken)}/tables/${encodeURIComponent(tableId)}/records/search`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ page_size: 1 }),
        });
        results.push({ key, tableId, found: res.ok });
      } catch (err) {
        this.logger.warn(`测试表 ${key} 连接失败: ${String(err)}`);
        results.push({ key, tableId, found: false });
      }
    }

    return results;
  }

  async *listRecords(
    tableId: string,
    pageSize = 100,
  ): AsyncGenerator<BitableRecord[], void, unknown> {
    if (!tableId) {
      this.logger.warn('listRecords 收到空 tableId，跳过');
      return;
    }

    let pageToken: string | undefined;
    let hasMore = true;
    const safePageSize = Math.min(Math.max(pageSize, 1), 500);

    while (hasMore) {
      const token = await this.getTenantAccessToken();
      const url =
        `${LARK_OPEN_API_BASE}/bitable/v1/apps/${encodeURIComponent(this.appToken)}/tables/${encodeURIComponent(tableId)}/records/search`;

      const body: Record<string, unknown> = { page_size: safePageSize };
      if (pageToken) {
        body.page_token = pageToken;
      }

      const data: ListRecordsResponse['data'] = await this.requestWithRetry<
        ListRecordsResponse['data']
      >(url, body, token);

      const items: BitableRecord[] = data.items ?? [];
      if (items.length > 0) {
        yield items;
      }

      hasMore = Boolean(data.has_more);
      pageToken = data.page_token;

      if (!hasMore) {
        break;
      }
    }
  }

  private async requestWithRetry<T>(
    url: string,
    body: Record<string, unknown>,
    token: string,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (res.status === 429 || res.status >= 500) {
          const delayMs = 1000 * Math.pow(2, attempt);
          this.logger.warn(
            `飞书 API 限流/服务错误 (HTTP ${res.status})，第 ${attempt + 1} 次重试，等待 ${delayMs}ms`,
          );
          await this.sleep(delayMs);
          continue;
        }

        if (!res.ok) {
          throw new Error(`飞书 API 请求失败: HTTP ${res.status}`);
        }

        const json: ListRecordsResponse = await res.json();
        if (json.code !== 0) {
          throw new Error(`飞书 API 返回错误: code=${json.code} msg=${json.msg}`);
        }

        return json.data as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          const delayMs = 1000 * Math.pow(2, attempt);
          this.logger.warn(
            `飞书 API 请求失败 (第 ${attempt + 1} 次): ${lastError.message}，${delayMs}ms 后重试`,
          );
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError ?? new Error('未知错误');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
      setTimeout(resolve, ms);
    });
  }
}
