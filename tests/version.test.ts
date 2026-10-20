import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "@/app.js";

describe("GET /api/v1/version", () => {
  it("should return a 200 status code", async () => {
    const response = await request(app).get("/api/v1/version");
    expect(response.status).toBe(200);
  });

  it("should return JSON content type", async () => {
    const response = await request(app).get("/api/v1/version");
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  it("should return the correct application name", async () => {
    const response = await request(app).get("/api/v1/version");
    expect(response.body.name).toBe("backend-api");
  });

  it("should return a valid semantic version", async () => {
    const response = await request(app).get("/api/v1/version");
    expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should return the expected version 1.0.0", async () => {
    const response = await request(app).get("/api/v1/version");
    expect(response.body.version).toBe("1.0.0");
  });

  it("should return exactly the fields name and version", async () => {
    const response = await request(app).get("/api/v1/version");
    const keys = Object.keys(response.body);
    expect(keys).toEqual(["name", "version"]);
  });
});
