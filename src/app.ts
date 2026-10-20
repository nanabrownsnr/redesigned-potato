import express, { Request, Response, NextFunction } from "express";
import versionRouter from "./routes/version.js";
import healthRouter from "./routes/health.js";
import taskRouter from "./routes/tasks.js";
import { correlationIdMiddleware } from "./middleware/correlation.js";
import { APP_NAME, APP_VERSION, ENVIRONMENT, InfoResponse } from "./config.js";

const app = express();

app.use(express.json());

// Handle malformed JSON
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: { code: "invalid_json", message: "Malformed JSON in request body" },
      correlationId: (req as Request & { correlationId: string }).correlationId || "",
    });
  }
  next(err);
});

// Correlation ID middleware
app.use(correlationIdMiddleware);

// Routes
app.use("/api/v1", versionRouter);
app.use("/api/v1", healthRouter);
app.use("/api/v1/tasks", taskRouter);

// Info endpoint
app.get("/api/v1/info", (_req, res) => {
  const response: InfoResponse = {
    name: APP_NAME,
    version: APP_VERSION,
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: { code: "not_found", message: "The requested resource was not found" },
    correlationId: (
      _req as Request & { correlationId: string }
    ).correlationId || "",
  });
});

// Production error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const correlationId =
    (_req as Request & { correlationId: string }).correlationId || "";

  if (err instanceof SyntaxError) {
    res.status(400).json({
      error: { code: "bad_request", message: "An unexpected error occurred" },
      correlationId,
    });
    return;
  }

  console.error("[ERROR]", err.message);

  res.status(500).json({
    error: { code: "internal_error", message: "An unexpected error occurred" },
    correlationId,
  });
});

export default app;
