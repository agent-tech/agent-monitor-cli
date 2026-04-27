export type GlobalStatsHistoryEntry = Record<string, string>;

export interface GlobalStatsResponse {
  total_volume: number;
  total_transactions: number;
  active_agents_count: number;
  total_volume_history: GlobalStatsHistoryEntry[];
  total_transactions_history: GlobalStatsHistoryEntry[];
  active_agents_count_history: GlobalStatsHistoryEntry[];
  volume_7d_change: number;
  transactions_7d_change: number;
  active_agents_7d_change: number;
  updated_at: string;
}

export type MonitorAgentTrendEntry = Record<string, string>;

/** Single agent row from GET /v1/monitor/agents (list). */
export interface MonitorAgentItem {
  claimable?: boolean;
  ranking: number;
  agent_id: string;
  agent_number?: string;
  agent_name?: string;
  wallet_address?: string;
  status: string;
  inbound_volume: number;
  outbound_volume: number;
  inbound_tx_count: number;
  outbound_tx_count: number;
  last_active_at?: string;

  description?: string;
  skills?: string[];
  certs?: string[];
  certs_details?: unknown[];
  reputation?: string;
  agent_created_at?: string;

  inbound_volume_pr?: number;
  outbound_volume_pr?: number;
  inbound_count_pr?: number;
  outbound_count_pr?: number;
  total_volume_pr?: number;
  total_count_pr?: number;

  inbound_repeat_rate?: number;
  outbound_repeat_rate?: number;
  total_repeat_rate?: number;
  inbound_repeat_count?: number;
  inbound_total_count?: number;
  outbound_repeat_count?: number;
  outbound_total_count?: number;

  payment_volume_percent?: number;
  payment_count_percent?: number;
  trend_7d_growth?: number;
  trend_history?: MonitorAgentTrendEntry[];
  facilitator?: string;
}

export interface MonitorAgentsResponse {
  agents: MonitorAgentItem[];
  total: number;
  page: number;
  page_size: number;
}

/** Full response from GET /v1/monitor/agents/:agentId (detail view). */
export interface MonitorAgentDetailResponse extends MonitorAgentItem {
  /** ERC-8004 identity address; empty/absent means no ERC-8004 section. */
  ecr8004_address?: string;
  linkedin?: string;
  github?: string;
  x?: string;
  score_trust?: number;
  score_financial?: number;
  inbound_unique_count?: number;
  outbound_unique_count?: number;
}

/**
 * Single row from GET /v1/monitor/agents/search.
 * Looser than list/detail: ID, status, and volume/count totals may all be absent.
 */
export interface MonitorAgentSearchItem
  extends Omit<
    MonitorAgentDetailResponse,
    | 'agent_id'
    | 'status'
    | 'inbound_volume'
    | 'outbound_volume'
    | 'inbound_tx_count'
    | 'outbound_tx_count'
  > {
  agent_id?: string;
  status?: string;
  inbound_volume?: number;
  outbound_volume?: number;
  inbound_tx_count?: number;
  outbound_tx_count?: number;
}

export interface MonitorAgentSearchResponse {
  agents: MonitorAgentSearchItem[];
  total: number;
  size?: number;
  /** When present, web promotes this onto the first agent's ranking. */
  ranking?: number;
}

/** Single row from GET /v1/monitor/agents/:agentId/transactions. */
export interface MonitorAgentTransactionApiItem {
  tx_hash: string;
  amount: string;
  type: string;
  counterparty: string;
  time: string;
  status: string;
  payer_chain: string;
}

export interface MonitorAgentTransactionsResponse {
  transactions: MonitorAgentTransactionApiItem[];
  total: number;
  page: number;
  page_size: number;
}

export type TxSortBy = 'time' | 'amount';
export type TxSortOrder = 'asc' | 'desc';

export interface MonitorAgentTransactionsParams {
  page?: number;
  page_size?: number;
  sort_by?: TxSortBy;
  sort_order?: TxSortOrder;
  tx_hash?: string;
}

export interface MonitorAgentSearchParams {
  wallet?: string;
  number?: string;
  name?: string;
  skills?: string[];
}

/** Server-enforced limits surfaced as CLI guards. */
export const SEARCH_NAME_MIN_LENGTH = 2;
export const SKILLS_MAX_COUNT = 3;
