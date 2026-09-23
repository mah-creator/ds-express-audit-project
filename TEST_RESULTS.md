# `ds-express-errors@1.9.2` — test results

Companion to `TESTING_GUIDE.md`. That file shows how to test. This file shows what happened, what I expected, and what I flagged as a problem.

## Environment

- Express `5.2.1`
- Prisma `7.9.1` with `@prisma/adapter-pg`
- Zod `4.4.3`
- `jsonwebtoken` `9.0.3`
- Node `22.17.0`, Windows 11
- `NODE_ENV=development`
- `DATABASE_URL` set to an unreachable host so Prisma throws on any query

## Config

From `src/index.ts`:

```ts
setConfig({
  errorClasses: { Prisma, Zod: z },
});
```

No custom logger, mappers, or `formatError`. Every result below is against defaults with strict class checks for Prisma and Zod.

---

## How I decided if something is broken

For each test I checked five things:

| Check | Question |
|---|---|
| HTTP status | Does the code match the type of failure? |
| Content-Type | Is it `application/json`? A JSON error library returning HTML is a leak. |
| Response shape | Does the JSON match the shape the docs promise? |
| Message content | Safe to show a user? Does it leak internal names? |
| Structured data | Is the raw error data still recoverable, or was it thrown away? |

- **Misbehavior** = breaks a documented promise, drops data the caller might need, or produces output a JSON API cannot parse.
- **Rough edge** = ugly but not incorrect (e.g. verbose messages, weird prefixes).

---

## Quick summary

| # | Test | Result | Verdict |
|---|---|---|---|
| 1 | Explicit `Errors.Unauthorized` | 401, exact message | Correct |
| 2 | JWT malformed | 401, message prefixed `[JsonWebTokenError]:` | Rough edge — leaks class name |
| 3 | Zod empty body | 400, `.issues` array flattened to a string | **Misbehavior — data loss** |
| 4 | Bad JSON body | 400, plain message | Correct |
| 5 | Prisma unreachable | 503, `status: "fail"` + verbose message | Rough edge — wrong status label |
| 6 | Unmatched route | 404 HTML | **Misbehavior — breaks the JSON promise** |
| 7 | `throw Errors.NotFound` in `asyncHandler` | 404, exact message | Correct |

Score: 4 correct, 1 rough edge, 2 real misbehaviors.

---

## Test 1 — Own `Errors.Unauthorized`

Request:
```
GET /api/appointments/patient
```
No `Authorization` header. Middleware calls `next(Errors.Unauthorized("Missing Authorization header"))`.

Expected: `401` with the message I passed, unchanged.

Got:
```json
{
  "status": "fail",
  "message": "Missing Authorization header",
  "method": "GET",
  "url": "/api/appointments/patient",
  "stack": "..."
}
```

Verdict: correct. `status: "fail"` because `isOperational: true` (default for every preset except `InternalServerError`).

---

## Test 2 — JWT auto-mapping

Request:
```
GET /api/appointments/patient
Authorization: Bearer garbage
```

Expected: `401` with a clean message like `"Invalid token"` or `"jwt malformed"`.

Got:
```json
{
  "status": "fail",
  "message": "[JsonWebTokenError]: jwt malformed"
}
```

Problem: the class name `[JsonWebTokenError]:` leaks into the user-facing message. A mobile client showing this in a toast exposes an internal name. The library should strip that prefix by default and expose it only in dev or a debug field.

Verdict: rough edge, not a bug.

---

## Test 3 — Zod validation

Request:
```
POST /api/identity/register
{}
```
Schema needs `body.email` and `body.password`. Middleware calls `next(err)` with the raw `ZodError`.

Expected: `400` with either a structured `errors[]` array (one entry per field) or at least a message that keeps each field separate.

Got:
```json
{
  "status": "fail",
  "message": "[Validation error]: body.email: Invalid input: expected string, received undefined; body.password: Invalid input: expected string, received undefined"
}
```

Problem: `zodMapper` flattens `ZodError.issues[]` into one semicolon-joined string before `formatError` runs. Consequences:

1. No structured `errors[]` array is possible with the built-in mapper. You need a `customMapper`.
2. Localization is impossible — `issue.code` and `issue.path` are gone.
3. Splitting on `"; "` to recover fields is fragile. Any user input containing `"; "` corrupts the parse.

The README calls this "automatically formatted into readable messages" but "readable" and "lossy" got mixed up.

Verdict: **misbehavior — data loss**. Biggest gap I found.

---

## Test 4 — Malformed JSON body

Request:
```
POST /api/identity/register
{oops
```

Expected: `400`, not `500` or an HTML page.

Got:
```json
{
  "status": "fail",
  "message": "Expected property name or '}' in JSON at position 1 (line 1 column 2)"
}
```

Verdict: correct. Note: no class name prefix here, unlike JWT. Two mappers, two conventions.

---

## Test 5 — Prisma unreachable DB (`P1001`)

Request:
```
GET /api/clinics
```

Expected: `503` with a safe message like `"Database unreachable"`, and full detail only in dev.

Got:
```json
{
  "status": "fail",
  "message": "Prisma P1001: [PrismaClientKnownRequestError] Cannot reach database: { modelName: Clinic }; { driverAdapterError: DriverAdapterError: DatabaseNotReachable } \nOperation: `prisma.clinic.findMany()`"
}
```

Production mode (verified separately) collapses to `"Service unavailable"` — sanitized as promised.

Two problems:

1. **Wrong `status` label.** JSend says `fail` = client fault (4xx), `error` = server fault (5xx). The library sets `status` from `isOperational`, and its mappers set every mapped error to `isOperational: true`. So a genuine 5xx returns the same label as a 401. Clients that route on `status` will misclassify.
2. **Unstable message format.** The `{ modelName: Clinic }` and `{ driverAdapterError: ... }` fragments look like `Object.entries().join('; ')`, not a documented serializer. If Prisma's `err.meta` schema changes across versions, this message changes too — no versioning contract.

Verdict: rough edge on both counts. Real for anyone building tooling on top of it.

---

## Test 6 — Unmatched route

Request:
```
GET /api/nothing
```

Expected: `404` as JSON, same envelope as every other error.

Got:
```html
<!DOCTYPE html>
<html lang="en">
<head><title>Error</title></head>
<body><pre>Cannot GET /api/nothing</pre></body>
</html>
```

Content-Type: `text/html`. HTTP 404.

Problem: the library's pitch is "one middleware catches all errors and formats them into unified JSON." The most common HTTP error — a wrong URL — is not covered. The user has to add:

```ts
app.use((req, _res, next) => next(Errors.NotFound(`Route ${req.originalUrl} not found`)));
app.use(errorHandler);
```

This is not in the README. First-time integrators will ship a mixed-format API where some 404s are JSON and some are HTML.

Verdict: **misbehavior against the library's own promise**. Documentation gap that behaves like a bug.

---

## Test 7 — `throw Errors.NotFound` inside `asyncHandler`

Request:
```
GET /api/clinics/does-not-exist
```
Controller does `if (!clinic) throw Errors.NotFound("Clinic not found")`.

Expected: `404` with the message I passed. `asyncHandler` forwards the throw without me calling `next`.

Got:
```json
{
  "status": "fail",
  "message": "Clinic not found"
}
```

Verdict: correct. This is the pattern that makes the library worth adopting.

---

## Cross-cutting findings

### Envelope shape

Six of seven tests returned the same shape:

```
{ status, message, method?, url?, stack? }
```

Only the unmatched-route case broke shape (returned HTML). Inside the library's coverage, shape consistency is real.

### `status` label vs HTTP code

| Test | HTTP | Actual label | Strict-JSend label |
|---|---|---|---|
| Missing auth | 401 | `fail` | `fail` — correct |
| Bad JWT | 401 | `fail` | `fail` — correct |
| Zod | 400 | `fail` | `fail` — correct |
| Bad JSON | 400 | `fail` | `fail` — correct |
| Explicit NotFound | 404 | `fail` | `fail` — correct |
| Prisma unreachable | 503 | `fail` | **`error` — wrong** |

Five out of six match by accident (all common 4xx are operational). The 5xx case is where the mislabel shows up. Any future 5xx marked `isOperational: true` will leak the same way.

### Message prefixes — four conventions in one library

| Mapper | Prefix |
|---|---|
| `jwtMapper` | `[JsonWebTokenError]: <message>` |
| `zodMapper` | `[Validation error]: <path>: <msg>; ...` |
| `nameMapper` (SyntaxError) | no prefix — raw V8 message |
| `prismaMapper` (dev) | `Prisma <code>: [<ClassName>] <message>: <meta>` |
| `Errors.*` presets | exactly what you passed |

Five entry points, four conventions. A downstream logger or parser cannot rely on any single format. Picking one — say, always `<Class>: <msg>` or never prefix — would make tooling much easier.

### Information loss

Only one case dropped data: **Zod issues**.

- Prisma meta: preserved (stringified but recoverable in dev).
- JWT class name: preserved (in the message prefix, unhelpfully).
- SyntaxError: nothing structured to lose.

If you rely on structured field-level validation errors, write a Zod `customMapper` from day one.

### Doc vs code drift found during setup

- **`needMappers` type** in `src/config/config.d.ts:62` is a single-string union. README example passes an array. Runtime accepts array. TS users must skip the annotation or cast.
- **`NODE_ENV` unset behaves as production.** Not in "Default Config Format." Buried in an `[!IMPORTANT]` note further down. Cost me stack traces on first boot.

---

## Bottom line

The library delivers on its central promise: one middleware, unified JSON. But the current shape is safe only if you:

1. Always set `NODE_ENV` explicitly.
2. Add your own 404 catch-all.
3. Do not need structured Zod errors.
4. Do not route on the `status` field.

Every one of those is a library-side fix, not a user-side fix.
