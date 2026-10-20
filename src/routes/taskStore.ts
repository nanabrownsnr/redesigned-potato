import { randomUUID } from "node:crypto";
import { Task, TaskStatus } from "../config.js";

export type TaskStore = Map<string, Task>;

const store: TaskStore = new Map();

function createTask(
  title: string,
  description: string | null,
): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title,
    description,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.set(task.id, Object.freeze({ ...task }));
  return task;
}

function findTaskById(id: string): Task | undefined {
  return store.get(id);
}

function listTasks(
  statusFilter: TaskStatus | undefined,
  page: number,
  limit: number,
): { tasks: Task[]; total: number } {
  let filtered = Array.from(store.values());
  if (statusFilter) {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const tasks = filtered.slice(start, start + limit);
  return { tasks, total };
}

function updateTask(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
  },
): Task | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;

  const updated: Task = {
    ...existing,
    title: updates.title ?? existing.title,
    description:
      updates.description !== undefined
        ? updates.description
        : existing.description,
    status: updates.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, Object.freeze(updated));
  return updated;
}

function deleteTask(id: string): boolean {
  return store.delete(id);
}

export {
  createTask,
  findTaskById,
  listTasks,
  updateTask,
  deleteTask,
  store,
};
