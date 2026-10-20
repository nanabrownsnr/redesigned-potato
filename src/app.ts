import express from "express";
import versionRouter from "./routes/version.js";
import healthRouter from "./routes/health.js";

const app = express();

app.use(express.json());

app.use("/api/v1", versionRouter);
app.use("/api/v1", healthRouter);

export default app;
