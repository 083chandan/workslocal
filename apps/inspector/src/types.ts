export interface CapturedRequest {
  requestId: string;
  tunnelId: string;
  method: string;
  path: string;
  query: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody: string; // base64
  responseStatusCode: number;
  responseHeaders: Record<string, string>;
  responseBody: string; // base64
  responseTimeMs: number;
  timestamp: string; // ISO string
}

export interface TunnelInfo {
  mode: 'http' | 'catch';
  publicUrl: string;
  subdomain: string;
  domain: string;
  localPort: number | null;
  isPersistent: boolean;
  email: string | null;
}

export interface Filters {
  methods: Set<string>;
  statusMin: number | null;
  statusMax: number | null;
  pathSearch: string;
}
