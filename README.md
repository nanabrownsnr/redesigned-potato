# backend-api

Production-quality backend API service built with TypeScript and Express.

## Quick Start

### Local Development

```bash
npm ci
npm run build
npm start
```

The server runs on port 3000 by default (configurable via `PORT` environment variable).

### Docker

```bash
docker compose build
docker compose up
```

The API is accessible at `http://localhost:3001` (container port 3000 mapped to host 3001).

## API Reference

All API endpoints return structured JSON responses with a `correlationId` field for request tracing.

### Common Response Headers

| Header              | Description                          |
|---------------------|--------------------------------------|
| `X-Correlation-ID`  | Unique request identifier (generated or from `X-Correlation-ID` request header) |

### Common Error Response Format

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error description"
  },
  "correlationId": "uuid-here"
}
```

---

## Health & Info

### GET /api/v1/health

Returns the health status of the service.

**Response:**

```json
{
  "status": "healthy",
  "uptime": 42,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/v1/version

Returns application version information.

**Response:**

```json
{
  "name": "backend-api",
  "version": "1.0.0"
}
```

### GET /api/v1/info

Returns detailed application info including environment.

**Response:**

```json
{
  "name": "backend-api",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Task Management

### Task Statuses

Valid task statuses: `pending`, `in_progress`, `completed`, `cancelled`

### Task Object

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My task",
  "description": "Optional description",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/v1/tasks

Create a new task.

**Request Body:**

```json
{
  "title": "Implement feature X",
  "description": "Add the feature to the application"
}
```

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Implement feature X",
  "description": "Add the feature to the application",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Validation errors (400):**

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Title is required and must be a non-empty string"
  },
  "correlationId": "uuid-here"
}
```

### GET /api/v1/tasks

List all tasks with optional status filtering and pagination.

**Query Parameters:**

| Param     | Type   | Default | Description                              |
|-----------|--------|---------|------------------------------------------|
| `status`  | string |         | Filter by status: `pending`, `in_progress`, `completed`, `cancelled` |
| `page`    | number | 1       | Page number (positive integer)           |
| `limit`   | number | 20      | Items per page (1-100)                   |

**Response (200):**

```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "My task",
      "description": "Optional description",
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

**Example with filtering:**

```
GET /api/v1/tasks?status=completed&page=1&limit=10
```

### GET /api/v1/tasks/:id

Retrieve a single task by ID.

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My task",
  "description": "Optional description",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Not found (404):**

```json
{
  "error": {
    "code": "not_found",
    "message": "Task with id 'nonexistent' not found"
  },
  "correlationId": "uuid-here"
}
```

### PATCH /api/v1/tasks/:id

Update a task. Only provide the fields you want to update.

**Request Body:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress"
}
```

**Response (200):** Returns the updated task object.

### DELETE /api/v1/tasks/:id

Delete a task.

**Response (204):** No content.

---

## Error Codes

| Code             | HTTP Status | Description                            |
|------------------|-------------|----------------------------------------|
| `invalid_json`   | 400         | Malformed JSON in request body         |
| `invalid_payload`| 400         | Request body is not a JSON object      |
| `invalid_input`  | 400         | Invalid field value                    |
| `invalid_query`  | 400         | Invalid query parameter                |
| `invalid_id`     | 400         | Malformed task ID                      |
| `not_found`      | 404         | Resource not found                     |
| `internal_error` | 500         | Unexpected server error                |

## Configuration

| Variable        | Default     | Description                     |
|-----------------|-------------|---------------------------------|
| `PORT`          | `3000`      | HTTP server port                |
| `NODE_ENV`      | `development` | Environment (`production`, `development`, `test`) |

## Production Deployment

### Docker Compose

```bash
docker compose build
docker compose up -d
```

Health check endpoint: `http://localhost:3001/api/v1/health`

The container runs as a non-root user (`appuser`) and performs graceful shutdown on SIGTERM/SIGINT.

### Local Production

```bash
NODE_ENV=production PORT=3000 npm start
```

## Testing

```bash
npm test          # Run all tests
npm run lint      # Lint source code
npm run build     # Build TypeScript
```
