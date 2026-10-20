export const APP_NAME = "backend-api";

export const APP_VERSION = "1.0.0";

export interface VersionResponse {
  name: string;
  version: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
}
