import type {
  GlobalStatsResponse,
  MonitorAgentsResponse,
  MonitorAgentSearchResponse,
  MonitorAgentItem,
} from './types.ts';

const DEFAULT_TIMEOUT_MS = 45_000;

export interface ApiClientOptions {
  baseUrl: string;
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class MonitorApi {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private async request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new ApiError(
          `HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`,
          res.status,
          url.toString(),
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${this.timeoutMs}ms`, undefined, url.toString());
      }
      const msg = err instanceof Error ? err.message : String(err);
      throw new ApiError(`Network error: ${msg}`, undefined, url.toString());
    } finally {
      clearTimeout(timer);
    }
  }

  getGlobalStats(): Promise<GlobalStatsResponse> {
    return this.request<GlobalStatsResponse>('/v1/monitor/global-stats');
  }

  getAgents(page = 1, pageSize = 20): Promise<MonitorAgentsResponse> {
    return this.request<MonitorAgentsResponse>('/v1/monitor/agents', {
      page,
      page_size: pageSize,
    });
  }

  getAgent(agentId: string): Promise<MonitorAgentItem> {
    return this.request<MonitorAgentItem>(`/v1/monitor/agents/${encodeURIComponent(agentId)}`);
  }

  searchAgents(wallet: string): Promise<MonitorAgentSearchResponse> {
    return this.request<MonitorAgentSearchResponse>('/v1/monitor/agents/search', { wallet });
  }
}
