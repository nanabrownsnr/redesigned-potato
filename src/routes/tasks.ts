import { Router, Request, Response, NextFunction } from "express";
import {
  UpdateTaskRequest,
  VALID_TASK_STATUSES,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  TaskStatus,
} from "../config.js";
import {
  createTask,
  findTaskById,
  listTasks,
  updateTask,
  deleteTask,
} from "./taskStore.js";

const router = Router();

function getTitleError(title: unknown): string | null {
  if (typeof title !== "string") return "Title is required and must be a non-empty string";
  if (title.trim().length === 0) return "Title is required and must be a non-empty string";
  if (title.length > 255) return "Title must not exceed 255 characters";
  return null;
}

function getTrimmedTitle(title: unknown): string {
  if (typeof title === "string") return title.trim();
  return "";
}

function getDescriptionError(description: unknown): string | null {
  if (description === undefined || description === null) return null;
  if (typeof description !== "string") return "Description must be a string";
  if (description.length > 2000) return "Description must not exceed 2000 characters";
  return null;
}

function getStatusError(status: unknown): string | null {
  if (status === undefined || status === null) return null;
  if (typeof status !== "string") return "Status must be a string";
  if (!VALID_TASK_STATUSES.includes(status as TaskStatus)) {
    return `Status must be one of: ${VALID_TASK_STATUSES.join(", ")}`;
  }
  return null;
}

function getValidStatus(status: unknown): TaskStatus | undefined {
  if (status === undefined || status === null) return undefined;
  if (typeof status !== "string" || !VALID_TASK_STATUSES.includes(status as TaskStatus)) {
    return undefined;
  }
  return status as TaskStatus;
}

function validatePagination(page: unknown, limit: unknown): {
  page: number;
  limit: number;
  error?: string;
} {
  const hasPage = page !== undefined && page !== null;
  const hasLimit = limit !== undefined && limit !== null;

  const parsedPage = hasPage ? Number(page) : 1;
  const parsedLimit = hasLimit ? Number(limit) : DEFAULT_PAGE_LIMIT;

  if (hasPage && (!Number.isFinite(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedPage))) {
    return { page: 1, limit: DEFAULT_PAGE_LIMIT, error: "Page must be a positive integer" };
  }
  if (hasLimit && (!Number.isFinite(parsedLimit) || parsedLimit < 1 || !Number.isInteger(parsedLimit))) {
    return { page: parsedPage, limit: DEFAULT_PAGE_LIMIT, error: "Limit must be a positive integer" };
  }
  if (hasLimit && parsedLimit > MAX_PAGE_LIMIT) {
    return { page: parsedPage, limit: MAX_PAGE_LIMIT, error: `Limit must not exceed ${MAX_PAGE_LIMIT}` };
  }
  return { page: parsedPage, limit: parsedLimit };
}

// POST /api/v1/tasks
router.post("/", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const body = req.body;

    if (body === null || body === undefined || typeof body !== "object") {
      res.status(400).json({
        error: { code: "invalid_payload", message: "Request body must be a JSON object" },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const titleError = getTitleError(body.title);
    if (titleError !== null) {
      res.status(400).json({
        error: { code: "invalid_input", message: titleError },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const descriptionError = getDescriptionError(body.description);
    if (descriptionError !== null) {
      res.status(400).json({
        error: { code: "invalid_input", message: descriptionError },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    if (body.status !== undefined && body.status !== null) {
      res.status(400).json({
        error: {
          code: "invalid_input",
          message: "Status cannot be set during task creation",
        },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const task = createTask(getTrimmedTitle(body.title), body.description ?? null);
    const corrId = (req as Request & { correlationId: string }).correlationId || "";
    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      correlationId: corrId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tasks
router.get("/", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const statusFilterRaw = req.query.status;
    const statusFilter = typeof statusFilterRaw === "string" ? statusFilterRaw : undefined;

    const statusErr = getStatusError(statusFilter);
    if (statusErr !== null) {
      res.status(400).json({
        error: { code: "invalid_query", message: statusErr },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const validStatus = getValidStatus(statusFilter);

    const { page, limit, error: paginationError } = validatePagination(
      req.query.page,
      req.query.limit,
    );

    if (paginationError) {
      res.status(400).json({
        error: { code: "invalid_query", message: paginationError },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const { tasks, total } = listTasks(validStatus, page, limit);
    const corrId = (req as Request & { correlationId: string }).correlationId || "";

    res.json({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total,
      page,
      limit,
      correlationId: corrId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tasks/:id
router.get("/:id", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || id.length === 0) {
      res.status(400).json({
        error: { code: "invalid_id", message: "Task ID must be a non-empty string" },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const task = findTaskById(id);
    if (!task) {
      res.status(404).json({
        error: { code: "not_found", message: `Task with id '${id}' not found` },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const corrId = (req as Request & { correlationId: string }).correlationId || "";
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      correlationId: corrId,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/tasks/:id
router.patch("/:id", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || id.length === 0) {
      res.status(400).json({
        error: { code: "invalid_id", message: "Task ID must be a non-empty string" },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const body = req.body;
    if (body === null || body === undefined || typeof body !== "object") {
      res.status(400).json({
        error: { code: "invalid_payload", message: "Request body must be a JSON object" },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const updates: UpdateTaskRequest = {};

    if (body.title !== undefined) {
      const titleErr = getTitleError(body.title);
      if (titleErr !== null) {
        res.status(400).json({
          error: { code: "invalid_input", message: titleErr },
          correlationId: (req as Request & { correlationId: string }).correlationId || "",
        });
        return;
      }
      updates.title = getTrimmedTitle(body.title);
    }

    if (body.description !== undefined) {
      const descErr = getDescriptionError(body.description);
      if (descErr !== null) {
        res.status(400).json({
          error: { code: "invalid_input", message: descErr },
          correlationId: (req as Request & { correlationId: string }).correlationId || "",
        });
        return;
      }
      updates.description = body.description;
    }

    if (body.status !== undefined) {
      const statusErr = getStatusError(body.status);
      if (statusErr !== null) {
        res.status(400).json({
          error: { code: "invalid_input", message: statusErr },
          correlationId: (req as Request & { correlationId: string }).correlationId || "",
        });
        return;
      }
      const valid = getValidStatus(body.status);
      if (valid !== undefined) {
        updates.status = valid;
      }
    }

    const task = updateTask(id, updates);
    if (!task) {
      res.status(404).json({
        error: { code: "not_found", message: `Task with id '${id}' not found` },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const corrId = (req as Request & { correlationId: string }).correlationId || "";
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      correlationId: corrId,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/tasks/:id
router.delete("/:id", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || id.length === 0) {
      res.status(400).json({
        error: { code: "invalid_id", message: "Task ID must be a non-empty string" },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    const task = findTaskById(id);
    if (!task) {
      res.status(404).json({
        error: { code: "not_found", message: `Task with id '${id}' not found` },
        correlationId: (req as Request & { correlationId: string }).correlationId || "",
      });
      return;
    }

    deleteTask(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
