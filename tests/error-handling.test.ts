import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "@/app.js";
import { z } from "zod";

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    correlationId: z.string(),
    timestamp: z.string(),
  }),
});

describe("Unknown routes", () => {
  it("should return 404 for unknown GET route", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.status).toBe(404);
  });

  it("should return 404 for completely unknown route", async () => {
    const response = await request(app).get("/completely/unknown/path");
    expect(response.status).toBe(404);
  });

  it("should return error object with required fields", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toHaveProperty("message");
    expect(response.body.error).toHaveProperty("code");
    expect(response.body.error).toHaveProperty("correlationId");
    expect(response.body.error).toHaveProperty("timestamp");
  });

  it("should include NOT_FOUND error code", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should include correlation ID in error response", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.body.error.correlationId).toBeDefined();
    expect(typeof response.body.error.correlationId).toBe("string");
    expect(response.body.error.correlationId.length).toBeGreaterThan(0);
  });

  it("should return correlation ID header on 404", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.headers["x-request-id"]).toBe(response.body.error.correlationId);
  });

  it("should validate error response against schema", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    const result = ErrorResponseSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });

  it("should return ISO timestamp in error response", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    const timestamp = new Date(response.body.error.timestamp).toISOString();
    expect(timestamp).toBe(response.body.error.timestamp);
  });
});

describe("Malformed JSON", () => {
  it("should return 400 for malformed JSON body", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(response.status).toBe(400);
  });

  it("should return error message about malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(response.body.error.message).toBe("Malformed JSON in request body");
  });

  it("should include INVALID_JSON error code", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("should include correlation ID in malformed JSON error", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(response.body.error.correlationId).toBeDefined();
    expect(typeof response.body.error.correlationId).toBe("string");
  });

  it("should return correlation ID header with malformed JSON error", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.headers["x-request-id"]).toBe(response.body.error.correlationId);
  });

  it("should validate malformed JSON error response against schema", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    const result = ErrorResponseSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });

  it("should return ISO timestamp in malformed JSON error", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    const timestamp = new Date(response.body.error.timestamp).toISOString();
    expect(timestamp).toBe(response.body.error.timestamp);
  });

  it("should return JSON content type on malformed JSON error", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(response.headers["content-type"]).toMatch(/json/);
  });
});

describe("Error response correlation", () => {
  it("should use client-provided correlation ID on 404", async () => {
    const providedId = "custom-404-id-001";
    const response = await request(app)
      .get("/api/v1/nonexistent")
      .set("X-Request-ID", providedId);
    expect(response.status).toBe(404);
    expect(response.body.error.correlationId).toBe(providedId);
    expect(response.headers["x-request-id"]).toBe(providedId);
  });

  it("should use client-provided correlation ID on malformed JSON", async () => {
    const providedId = "custom-malformed-id-002";
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .set("X-Request-ID", providedId)
      .send("{invalid}");
    expect(response.status).toBe(400);
    expect(response.body.error.correlationId).toBe(providedId);
    expect(response.headers["x-request-id"]).toBe(providedId);
  });

  it("should generate correlation ID when not provided on 404", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.status).toBe(404);
    expect(response.body.error.correlationId).toBeDefined();
    expect(typeof response.body.error.correlationId).toBe("string");
    expect(response.headers["x-request-id"]).toBe(response.body.error.correlationId);
  });

  it("should generate correlation ID when not provided on malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{invalid}");
    expect(response.status).toBe(400);
    expect(response.body.error.correlationId).toBeDefined();
    expect(typeof response.body.error.correlationId).toBe("string");
    expect(response.headers["x-request-id"]).toBe(response.body.error.correlationId);
  });
});
