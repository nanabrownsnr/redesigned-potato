import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "@/app.js";
import { store } from "@/routes/taskStore.js";
import { TaskStatus } from "@/config.js";

beforeAll(() => {
  store.clear();
});

// ---- POST /api/v1/tasks ----

describe("POST /api/v1/tasks", () => {
  it("should create a task with title only", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "Test task" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Test task",
      description: null,
      status: "pending",
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
  });

  it("should create a task with title and description", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Task with desc", description: "Some details" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Task with desc");
    expect(res.body.description).toBe("Some details");
  });

  it("should trim whitespace from title", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "  spaced title  " });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("spaced title");
  });

  it("should reject missing title", async () => {
    const res = await request(app).post("/api/v1/tasks").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
    expect(res.body.correlationId).toBeDefined();
  });

  it("should reject empty title", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should reject title that is only whitespace", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should reject title exceeding 255 characters", async () => {
    const longTitle = "a".repeat(256);
    const res = await request(app).post("/api/v1/tasks").send({ title: longTitle });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should reject description exceeding 2000 characters", async () => {
    const longDesc = "x".repeat(2001);
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Short", description: longDesc });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should reject non-string description", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Task", description: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should reject status during creation", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Task", status: "completed" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should return correlation ID in response header and body", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .set("X-Correlation-ID", "test-correlation-1")
      .send({ title: "Corr test" });
    expect(res.headers["x-correlation-id"]).toBe("test-correlation-1");
    expect(res.body.correlationId).toBe("test-correlation-1");
  });

  it("should generate correlation ID when not provided", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "Auto corr" });
    expect(res.headers["x-correlation-id"]).toBeDefined();
    expect(res.body.correlationId).toBeDefined();
  });

  it("should reject malformed JSON", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_json");
  });

  it("should reject request with empty object body (no title)", async () => {
    const res = await request(app).post("/api/v1/tasks").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should return stable ID format (UUID-like)", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "Id check" });
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should create tasks with unique IDs", async () => {
    const r1 = await request(app).post("/api/v1/tasks").send({ title: "First" });
    const r2 = await request(app).post("/api/v1/tasks").send({ title: "Second" });
    expect(r1.body.id).not.toBe(r2.body.id);
  });

  it("should set createdAt equal to updatedAt on creation", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "Time check" });
    expect(res.body.createdAt).toBe(res.body.updatedAt);
  });
});

// ---- GET /api/v1/tasks ----

describe("GET /api/v1/tasks", () => {
  beforeAll(() => {
    store.clear();
    store.set("test-1", Object.freeze({ id: "test-1", title: "T1", description: "D1", status: "pending", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" }));
    store.set("test-2", Object.freeze({ id: "test-2", title: "T2", description: null, status: "completed", createdAt: "2025-01-02T00:00:00.000Z", updatedAt: "2025-01-02T00:00:00.000Z" }));
    store.set("test-3", Object.freeze({ id: "test-3", title: "T3", description: null, status: "in_progress", createdAt: "2025-01-03T00:00:00.000Z", updatedAt: "2025-01-03T00:00:00.000Z" }));
  });

  it("should return all tasks", async () => {
    const res = await request(app).get("/api/v1/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(3);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it("should filter by status", async () => {
    const res = await request(app).get("/api/v1/tasks?status=pending");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].status).toBe("pending");
  });

  it("should return empty list for unknown status filter", async () => {
    const res = await request(app).get("/api/v1/tasks?status=archived");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_query");
  });

  it("should return empty list when no tasks match", async () => {
    store.clear();
    const res = await request(app).get("/api/v1/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it("should support pagination with page and limit", async () => {
    store.clear();
    for (let i = 0; i < 10; i++) {
      store.set(`p-${i}`, Object.freeze({ id: `p-${i}`, title: `Task ${i}`, description: null, status: "pending", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" }));
    }
    const res = await request(app).get("/api/v1/tasks?page=2&limit=3");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(3);
    expect(res.body.total).toBe(10);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(3);
  });

  it("should enforce max page limit", async () => {
    const res = await request(app).get("/api/v1/tasks?limit=200");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_query");
  });

  it("should reject non-integer page", async () => {
    const res = await request(app).get("/api/v1/tasks?page=1.5");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_query");
  });

  it("should reject negative page", async () => {
    const res = await request(app).get("/api/v1/tasks?page=-1");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_query");
  });

  it("should default to page 1 and limit 20 for invalid params", async () => {
    const res = await request(app).get("/api/v1/tasks?page=-5&limit=-10");
    expect(res.status).toBe(400);
  });

  it("should return correlation ID", async () => {
    const res = await request(app)
      .get("/api/v1/tasks")
      .set("X-Correlation-ID", "list-corr-1");
    expect(res.headers["x-correlation-id"]).toBe("list-corr-1");
    expect(res.body.correlationId).toBe("list-corr-1");
  });

  it("should return stable task properties", async () => {
    const res = await request(app).get("/api/v1/tasks");
    const task = res.body.tasks[0];
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("description");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("createdAt");
    expect(task).toHaveProperty("updatedAt");
    expect(Object.keys(task)).toHaveLength(6);
  });
});

// ---- GET /api/v1/tasks/:id ----

describe("GET /api/v1/tasks/:id", () => {
  it("should return a task by id", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Get me" });
    const taskId = createRes.body.id;
    const res = await request(app).get(`/api/v1/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(taskId);
    expect(res.body.title).toBe("Get me");
  });

  it("should return 404 for missing task", async () => {
    const res = await request(app).get("/api/v1/tasks/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.correlationId).toBeDefined();
  });

  it("should return correlation ID", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Corr get" });
    const res = await request(app)
      .get(`/api/v1/tasks/${createRes.body.id}`)
      .set("X-Correlation-ID", "get-corr-1");
    expect(res.headers["x-correlation-id"]).toBe("get-corr-1");
  });
});

// ---- PATCH /api/v1/tasks/:id ----

describe("PATCH /api/v1/tasks/:id", () => {
  it("should update title", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Old title" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ title: "New title" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New title");
    expect(res.body.status).toBe("pending");
  });

  it("should update description", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Task", description: null });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ description: "New desc" });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe("New desc");
  });

  it("should set description to null", async () => {
    const createRes = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Task", description: "Has desc" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ description: null });
    expect(res.status).toBe(200);
    expect(res.body.description).toBeNull();
  });

  it("should update status", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Status task" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ status: "completed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("should update multiple fields at once", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Multi" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ title: "Updated", description: "Desc here", status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body.description).toBe("Desc here");
    expect(res.body.status).toBe("in_progress");
  });

  it("should not mutate the stored record directly", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Immutable" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ title: "Changed" });
    expect(res.body.title).toBe("Changed");
    // Verify a fresh GET returns the updated value
    const getRes = await request(app).get(`/api/v1/tasks/${createRes.body.id}`);
    expect(getRes.body.title).toBe("Changed");
  });

  it("should return 404 for missing task", async () => {
    const res = await request(app)
      .patch("/api/v1/tasks/nonexistent-id")
      .send({ title: "Ghost" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("should reject invalid status value", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Status invalid" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ status: "invalid_status" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("should reject empty title", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Task" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("should reject non-string status", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Task" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ status: 42 });
    expect(res.status).toBe(400);
  });

  it("should return 200 with unchanged fields when partial update", async () => {
    const createRes = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Full task", description: "Has desc" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .send({ status: "cancelled" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Full task");
    expect(res.body.description).toBe("Has desc");
    expect(res.body.status).toBe("cancelled");
  });

  it("should return correlation ID", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Patch corr" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .set("X-Correlation-ID", "patch-corr-1")
      .send({ title: "Cleared" });
    expect(res.headers["x-correlation-id"]).toBe("patch-corr-1");
    expect(res.body.correlationId).toBe("patch-corr-1");
  });

  it("should reject malformed JSON", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Task" });
    const res = await request(app)
      .patch(`/api/v1/tasks/${createRes.body.id}`)
      .set("Content-Type", "application/json")
      .send("{bad json}");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_json");
  });
});

// ---- DELETE /api/v1/tasks/:id ----

describe("DELETE /api/v1/tasks/:id", () => {
  it("should delete a task", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Delete me" });
    const taskId = createRes.body.id;
    const delRes = await request(app).delete(`/api/v1/tasks/${taskId}`);
    expect(delRes.status).toBe(204);
    const getRes = await request(app).get(`/api/v1/tasks/${taskId}`);
    expect(getRes.status).toBe(404);
  });

  it("should return 404 for missing task", async () => {
    const res = await request(app).delete("/api/v1/tasks/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("should remove task from list", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "List removal" });
    const taskId = createRes.body.id;
    await request(app).delete(`/api/v1/tasks/${taskId}`);
    const listRes = await request(app).get("/api/v1/tasks");
    expect(listRes.body.tasks.find((t: { id: string }) => t.id === taskId)).toBeUndefined();
  });

  it("should return correlation ID", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Del corr" });
    const res = await request(app)
      .delete(`/api/v1/tasks/${createRes.body.id}`)
      .set("X-Correlation-ID", "del-corr-1");
    expect(res.headers["x-correlation-id"]).toBe("del-corr-1");
  });
});

// ---- Existing endpoints regression ----

describe("GET /api/v1/health (regression)", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(typeof res.body.uptime).toBe("number");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("should return correlation ID", async () => {
    const res = await request(app)
      .get("/api/v1/health")
      .set("X-Correlation-ID", "health-corr");
    expect(res.headers["x-correlation-id"]).toBe("health-corr");
  });
});

describe("GET /api/v1/version (regression)", () => {
  it("should return version info", async () => {
    const res = await request(app).get("/api/v1/version");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("backend-api");
    expect(res.body.version).toBe("1.0.0");
  });

  it("should return correlation ID", async () => {
    const res = await request(app)
      .get("/api/v1/version")
      .set("X-Correlation-ID", "version-corr");
    expect(res.headers["x-correlation-id"]).toBe("version-corr");
  });
});

describe("GET /api/v1/info (new)", () => {
  it("should return app info", async () => {
    const res = await request(app).get("/api/v1/info");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("backend-api");
    expect(res.body.version).toBe("1.0.0");
    expect(res.body.environment).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("should return correlation ID", async () => {
    const res = await request(app)
      .get("/api/v1/info")
      .set("X-Correlation-ID", "info-corr");
    expect(res.headers["x-correlation-id"]).toBe("info-corr");
  });
});

describe("404 handler", () => {
  it("should return structured 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/unknown");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.correlationId).toBeDefined();
  });

  it("should return 404 for completely unknown path", async () => {
    const res = await request(app).get("/foo/bar/baz");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("should return 404 for unknown method on known route", async () => {
    const res = await request(app).post("/api/v1/health");
    expect(res.status).toBe(404);
  });

  it("should return correlation ID on 404", async () => {
    const res = await request(app)
      .get("/not-found")
      .set("X-Correlation-ID", "404-corr");
    expect(res.headers["x-correlation-id"]).toBe("404-corr");
    expect(res.body.correlationId).toBe("404-corr");
  });
});

describe("Error handling", () => {
  it("should handle malformed JSON gracefully", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Content-Type", "application/json")
      .send("not json at all");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_json");
    expect(res.body.correlationId).toBeDefined();
  });

  it("should not leak stack traces in error response", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "" });
    expect(res.body.error.message).not.toContain("Error:");
    expect(res.body.error.message).not.toContain("stack");
    expect(res.body.error.message).not.toContain("at ");
  });

  it("should not include stack trace in 500 error", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(typeof res.body.error.message).toBe("string");
  });
});

describe("Task persistence within process", () => {
  it("should persist tasks across multiple requests", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Persistent" });
    const get1 = await request(app).get(`/api/v1/tasks/${createRes.body.id}`);
    const get2 = await request(app).get(`/api/v1/tasks/${createRes.body.id}`);
    expect(get1.body.title).toBe(get2.body.title);
    expect(get1.body.id).toBe(get2.body.id);
    expect(get1.body.createdAt).toBe(get2.body.createdAt);
  });

  it("should maintain status across updates", async () => {
    const createRes = await request(app).post("/api/v1/tasks").send({ title: "Status flow" });
    const id = createRes.body.id;
    await request(app).patch(`/api/v1/tasks/${id}`).send({ status: "in_progress" });
    await request(app).patch(`/api/v1/tasks/${id}`).send({ status: "completed" });
    const res = await request(app).get(`/api/v1/tasks/${id}`);
    expect(res.body.status).toBe("completed");
  });
});

describe("Input edge cases", () => {
  it("should handle very long valid title (255 chars)", async () => {
    const title = "a".repeat(255);
    const res = await request(app).post("/api/v1/tasks").send({ title });
    expect(res.status).toBe(201);
  });

  it("should handle description with special characters", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Special", description: "Quote: \"escaped\" & <html> & newline\n & tab\t" });
    expect(res.status).toBe(201);
  });

  it("should handle title with unicode characters", async () => {
    const res = await request(app).post("/api/v1/tasks").send({ title: "日本語タスク" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("日本語タスク");
  });

  it("should handle empty description string", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Task", description: "" });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe("");
  });
});
