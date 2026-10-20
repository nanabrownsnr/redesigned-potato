import { z } from "zod";

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

export interface InfoResponse {
  name: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  capabilities: string[];
}

export const InfoResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
  capabilities: z.array(z.string()),
});

export type InfoResponseShape = z.infer<typeof InfoResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    correlationId: z.string(),
    timestamp: z.string(),
  }),
});

export type ErrorResponseShape = z.infer<typeof ErrorResponseSchema>;
