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
  reputation?: string;
  agent_created_at?: string;
  inbound_repeat_rate?: number;
  outbound_repeat_rate?: number;
  total_repeat_rate?: number;
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

export interface MonitorAgentSearchItem extends MonitorAgentItem {
  score_trust?: number;
  score_financial?: number;
  inbound_unique_count?: number;
  outbound_unique_count?: number;
}

export interface MonitorAgentSearchResponse {
  agents: MonitorAgentSearchItem[];
  total: number;
}
