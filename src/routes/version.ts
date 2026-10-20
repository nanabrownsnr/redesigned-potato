import { Router } from "express";
import { APP_NAME, APP_VERSION, VersionResponse } from "../config.js";

const router = Router();

router.get("/version", (_req, res) => {
  const response: VersionResponse = {
    name: APP_NAME,
    version: APP_VERSION,
  };
  res.json(response);
});

export default router;
