import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "@/app.js";
import { z } from "zod";

const InfoResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
  capabilities: z.array(z.string()),
});

describe("GET /api/v1/info", () => {
  it("should return a 200 status code", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.status).toBe(200);
  });

  it("should return JSON content type", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  it("should return the correct application name", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.body.name).toBe("backend-api");
  });

  it("should return a valid semantic version", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should return the expected version 1.0.0", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.body.version).toBe("1.0.0");
  });

  it("should return the environment", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.body.environment).toBeDefined();
    expect(typeof response.body.environment).toBe("string");
  });

  it("should return a numeric uptime", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(typeof response.body.uptime).toBe("number");
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return a valid ISO timestamp", async () => {
    const response = await request(app).get("/api/v1/info");
    const timestamp = new Date(response.body.timestamp).toISOString();
    expect(timestamp).toBe(response.body.timestamp);
  });

  it("should return an array of capabilities", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(Array.isArray(response.body.capabilities)).toBe(true);
    expect(response.body.capabilities.length).toBeGreaterThan(0);
  });

  it("should include expected capabilities", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.body.capabilities).toContain("health-check");
    expect(response.body.capabilities).toContain("version-info");
    expect(response.body.capabilities).toContain("service-metadata");
  });

  it("should have a valid correlation ID in response headers", async () => {
    const response = await request(app).get("/api/v1/info");
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(typeof response.headers["x-request-id"]).toBe("string");
  });

  it("should validate against InfoResponseSchema", async () => {
    const response = await request(app).get("/api/v1/info");
    const result = InfoResponseSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });

  it("should return exactly the expected fields", async () => {
    const response = await request(app).get("/api/v1/info");
    const keys = Object.keys(response.body);
    const expectedKeys = ["name", "version", "environment", "uptime", "timestamp", "capabilities"];
    expect(keys).toEqual(expectedKeys);
  });
});
