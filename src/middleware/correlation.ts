import { Request, Response, NextFunction } from "express";
import { CORRELATION_ID_HEADER } from "../config.js";

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const headerName = CORRELATION_ID_HEADER.toLowerCase();
  const existingId = req.headers[headerName];
  const id = typeof existingId === "string" ? existingId : crypto.randomUUID();

  res.setHeader(CORRELATION_ID_HEADER, id);
  (req as Request & { correlationId: string }).correlationId = id;
  next();
}
