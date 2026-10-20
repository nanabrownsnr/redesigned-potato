import { Request, Response, NextFunction } from "express";

export const CORRELATION_ID_HEADER = "X-Request-ID";
const LOWERCASE_HEADER = "x-request-id";

function generateCorrelationId(): string {
  return crypto.randomUUID();
}

export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  let correlationId: string;

  const headerValue = req.headers[LOWERCASE_HEADER];

  if (headerValue && typeof headerValue === "string" && headerValue.length > 0) {
    correlationId = headerValue;
  } else if (
    Array.isArray(headerValue) &&
    headerValue.length > 0 &&
    typeof headerValue[0] === "string" &&
    headerValue[0].length > 0
  ) {
    correlationId = headerValue[0];
  } else {
    correlationId = generateCorrelationId();
  }

  (req as Request & { correlationId: string }).correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
