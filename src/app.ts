import express from "express";
import versionRouter from "./routes/version.js";
import healthRouter from "./routes/health.js";
import infoRouter from "./routes/info.js";
import { correlationMiddleware } from "./middleware/correlation.js";
import {
  notFoundHandler,
  jsonParseErrorHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

const app = express();

app.use(correlationMiddleware);

app.use(express.json());

app.use("/api/v1", versionRouter);
app.use("/api/v1", healthRouter);
app.use("/api/v1", infoRouter);

app.use(notFoundHandler);

app.use(jsonParseErrorHandler);

app.use(errorHandler);

export default app;
