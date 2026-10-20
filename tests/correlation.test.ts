import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "@/app.js";

describe("Request correlation middleware", () => {
  it("should return a generated X-Request-ID when not provided", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(typeof response.headers["x-request-id"]).toBe("string");
    expect(response.headers["x-request-id"].length).toBeGreaterThan(0);
  });

  it("should return the provided X-Request-ID when valid", async () => {
    const providedId = "test-correlation-id-12345";
    const response = await request(app)
      .get("/api/v1/version")
      .set("X-Request-ID", providedId);
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe(providedId);
  });

  it("should use client X-Request-ID with info endpoint", async () => {
    const providedId = "info-request-abc-99";
    const response = await request(app)
      .get("/api/v1/info")
      .set("X-Request-ID", providedId);
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe(providedId);
  });

  it("should generate unique IDs for separate requests", async () => {
    const response1 = await request(app).get("/api/v1/health");
    const response2 = await request(app).get("/api/v1/health");
    expect(response1.headers["x-request-id"]).not.toBe(
      response2.headers["x-request-id"],
    );
  });

  it("should return correlation ID on error responses", async () => {
    const providedId = "error-test-id-xyz";
    const response = await request(app)
      .post("/api/v1/nonexistent")
      .set("X-Request-ID", providedId);
    expect(response.status).toBe(404);
    expect(response.headers["x-request-id"]).toBe(providedId);
    expect(response.body.error.correlationId).toBe(providedId);
  });
});
