# Backend API

Production-quality backend API service built with Express and TypeScript.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose (for containerized deployment)

### Installation

```bash
npm ci
```

### Development

```bash
npm run dev
```

The server will start on port 3000 (or the port specified by `PORT` environment variable).

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker compose up --build
```

The API will be available on port 3001 (mapped to container port 3000).

## API Documentation

All API endpoints are versioned under `/api/v1`.

### Base URL

```
http://localhost:3000/api/v1
```

### Request Correlation IDs

Every request returns a `X-Request-ID` header for tracing and debugging:

- **Provided by client**: Send `X-Request-ID` header to include a custom correlation ID
- **Auto-generated**: If not provided, the server generates a UUID v4
- The same ID is returned in all error responses for traceability

### Endpoints

#### GET /api/v1/health

Returns the health status of the service.

**Response (200 OK)**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

| Field      | Type     | Description                  |
|------------|----------|------------------------------|
| status     | string   | Always `"healthy"`           |
| uptime     | number   | Process uptime in seconds    |
| timestamp  | string   | ISO 8601 timestamp           |

---

#### GET /api/v1/version

Returns the application version information.

**Response (200 OK)**

```json
{
  "name": "backend-api",
  "version": "1.0.0"
}
```

| Field   | Type   | Description        |
|---------|--------|--------------------|
| name    | string | Application name   |
| version | string | Semantic version   |

---

#### GET /api/v1/info

Returns detailed service metadata including capabilities.

**Response (200 OK)**

```json
{
  "name": "backend-api",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "capabilities": [
    "health-check",
    "version-info",
    "service-metadata"
  ]
}
```

| Field        | Type     | Description                             |
|--------------|----------|-----------------------------------------|
| name         | string   | Application name                        |
| version      | string   | Semantic version                        |
| environment  | string   | Current environment (e.g. `production`) |
| uptime       | number   | Process uptime in seconds               |
| timestamp    | string   | ISO 8601 timestamp                      |
| capabilities | string[] | Array of available API capabilities     |

---

### Error Responses

All error responses include a `X-Request-ID` header and follow a consistent structure:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "correlationId": "uuid-v4-here",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

| Field         | Type   | Description                                  |
|---------------|--------|----------------------------------------------|
| message       | string | Human-readable error description             |
| code          | string | Machine-readable error code                  |
| correlationId | string | Request correlation ID for tracing           |
| timestamp     | string | ISO 8601 timestamp of the error              |

#### 404 Not Found

Returned for unknown routes.

**Example**: `GET /api/v1/nonexistent`

```json
{
  "error": {
    "message": "Not found",
    "code": "NOT_FOUND",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 400 Bad Request (Malformed JSON)

Returned when the request body contains invalid JSON.

**Example**: `POST /api/v1/health` with body `{invalid json}`

```json
{
  "error": {
    "message": "Malformed JSON in request body",
    "code": "INVALID_JSON",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 500 Internal Server Error

Returned for unexpected server errors. In production, stack traces are omitted from the response.

```json
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Configuration

| Variable   | Default     | Description                      |
|------------|-------------|----------------------------------|
| PORT       | `3000`      | HTTP server port                 |
| NODE_ENV   | `development` | Runtime environment            |

## Project Structure

```
src/
  app.ts                  # Express app setup and middleware wiring
  config.ts               # Constants, types, and Zod schemas
  index.ts                # Server entry point
  middleware/
    correlation.ts        # Request correlation ID middleware
    errorHandler.ts       # Centralized error handling
  routes/
    health.ts             # Health check endpoint
    info.ts               # Service metadata endpoint
    version.ts            # Version info endpoint
tests/
  correlation.test.ts     # Correlation middleware tests
  error-handling.test.ts  # Error handling tests
  health.test.ts          # Health endpoint tests
  info.test.ts            # Info endpoint tests
  version.test.ts         # Version endpoint tests
```

## Development

### Scripts

| Script       | Description                       |
|-------------|-----------------------------------|
| `npm run build`   | Compile TypeScript to JavaScript |
| `npm run dev`     | Start server with hot reload     |
| `npm start`       | Start production server          |
| `npm test`        | Run test suite                   |
| `npm run lint`    | Run ESLint                       |
| `npm run lint:fix`| Run ESLint with auto-fix         |

### Testing

```bash
npm test
```

Tests use Vitest for the test runner and Supertest for HTTP integration testing.
