import { Router } from "express";
import { HealthResponse } from "../config.js";

const router = Router();

router.get("/health", (_req, res) => {
  const response: HealthResponse = {
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

export default router;
