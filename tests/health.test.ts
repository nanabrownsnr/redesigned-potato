import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "@/app.js";

describe("GET /api/v1/health", () => {
  it("should return a 200 status code", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
  });

  it("should return healthy status", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.body.status).toBe("healthy");
  });

  it("should return a numeric uptime", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(typeof response.body.uptime).toBe("number");
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return an ISO timestamp", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(new Date(response.body.timestamp).toISOString()).toBe(
      response.body.timestamp,
    );
  });
});
