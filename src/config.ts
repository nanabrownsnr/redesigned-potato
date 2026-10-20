export const APP_NAME = "backend-api";

export const APP_VERSION = "1.0.0";

export const ENVIRONMENT = process.env.NODE_ENV || "development";

export const CORRELATION_ID_HEADER = "X-Correlation-ID";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export interface VersionResponse {
  name: string;
  version: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export const VALID_TASK_STATUSES: TaskStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTaskResponse {
  tasks: TaskResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  correlationId: string;
}

export interface InfoResponse {
  name: string;
  version: string;
  environment: string;
  timestamp: string;
}
