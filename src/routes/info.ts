import { Router, Response } from "express";
import {
  APP_NAME,
  APP_VERSION,
  InfoResponse,
  InfoResponseSchema,
} from "../config.js";

const router = Router();

router.get("/info", (_req, res: Response) => {
  const response: InfoResponse = {
    name: APP_NAME,
    version: APP_VERSION,
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    capabilities: [
      "health-check",
      "version-info",
      "service-metadata",
    ],
  };

  const validated = InfoResponseSchema.parse(response);
  res.json(validated);
});

export default router;
