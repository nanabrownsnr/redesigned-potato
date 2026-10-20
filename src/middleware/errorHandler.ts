import { Request, Response, NextFunction } from "express";
import { ErrorResponseShape, ErrorResponseSchema } from "../config.js";

interface TypedError extends Error {
  type?: string;
  status?: number;
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = (req as Request & { correlationId: string }).correlationId || "unknown";

  const error: ErrorResponseShape = ErrorResponseSchema.parse({
    error: {
      message: "Not found",
      code: "NOT_FOUND",
      correlationId,
      timestamp: new Date().toISOString(),
    },
  });

  res.status(404).json(error);
}

export function jsonParseErrorHandler(
  err: TypedError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err.type === "entity.parse.failed" && err.status === 400) {
    const correlationId = (req as Request & { correlationId: string }).correlationId || "unknown";

    const error: ErrorResponseShape = ErrorResponseSchema.parse({
      error: {
        message: "Malformed JSON in request body",
        code: "INVALID_JSON",
        correlationId,
        timestamp: new Date().toISOString(),
      },
    });

    res.status(400).json(error);
    return;
  }

  next(err);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = (req as Request & { correlationId: string }).correlationId || "unknown";

  if (!res.headersSent) {
    const isProduction = process.env.NODE_ENV === "production";

    const errorDetail: Record<string, unknown> = {
      message: err.message || "Internal server error",
      code: "INTERNAL_ERROR",
      correlationId,
      timestamp: new Date().toISOString(),
    };

    if (!isProduction) {
      errorDetail.stack = err.stack;
    }

    const errorResponse: ErrorResponseShape = ErrorResponseSchema.parse({
      error: {
        message: err.message || "Internal server error",
        code: "INTERNAL_ERROR",
        correlationId,
        timestamp: new Date().toISOString(),
      },
    });

    res.status(500).json(errorResponse);
  }
}
