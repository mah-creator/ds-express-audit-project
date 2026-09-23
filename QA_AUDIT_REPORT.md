# ds-express-errors v1.9.2 — QA Audit Report

**Package:** `ds-express-errors@1.9.2`
**Auditor:** Mahmoud Tahrawi
**Stack:** Node.js 22.17 · Express 5.2.1 · Prisma 7.9.1 (adapter-pg) · Zod 4.4.3 · jsonwebtoken 9.0.3 · TypeScript strict · Windows 11
**Experience level:** Mid-level
**Overall rating:** 7/10
**Related GitHub issues:** [#113](https://github.com/Dianka05/ds-express-errors/issues/113) (closed) · [#116](https://github.com/Dianka05/ds-express-errors/issues/116) (open)

> **Disclosure:** This report was produced for a paid QA engagement. Payment was not dependent on whether findings were positive or negative.

---

## What I built

A clinic booking API using a live Express 5 + Prisma stack to exercise `asyncHandler`, `Errors.*`, `initGlobalHandlers`, and `gracefulHttpClose`. I exercised the JWT, Zod, SyntaxError, Prisma, and unmatched-route error paths — covering every built-in mapper except `joi`, `sequelize`, and `expressValidator`.

---

## Findings Index

| # | Finding | Type | Severity | Status |
|---|---|---|---|---|
| 1 | `NODE_ENV` unset behaves as production — stack traces hidden silently | Documentation | Medium | Open |
| 2 | Unmatched routes return HTML 404, not JSON | Bug / Missing feature | High | Open |
| 3 | `zodMapper` flattens `.issues[]` — structured data lost before `formatError` | Bug | High | Open — [#116](https://github.com/Dianka05/ds-express-errors/issues/116) |
| 4 | `status: 'fail'` on 5xx errors — does not track HTTP class | Limitation | Medium | Open |
| 5 | Only `InternalServerError` accepts `isOperational` as a second argument | Inconsistency | Low | Open |
| 6 | `needMappers` type is a single string union; README and runtime accept an array | Bug (types/docs drift) | Medium | Open |
| 7 | `asyncHandler` is not generic — loses route type inference | Improvement | Medium | Open |
| 8 | Mapper composition order and precedence are not documented | Documentation | Low | Open |
| 9 | `throw Errors.*` vs `next(err)` idiom used inconsistently in docs | Documentation | Low | Open |
| 10 | Async `customMappers` note in README is out of date | Documentation | Low | Closed — [#113](https://github.com/Dianka05/ds-express-errors/issues/113) ✅ |

---

## What worked

- **Wiring is one line.** Dropping `app.use(errorHandler)` at the end of the chain unified every uncaught 500 before I touched a controller.
- **`asyncHandler` + `throw Errors.*` deleted every `try/catch` block.**
- **Prisma mapping works out of the box.** P1001 (unreachable DB) mapped to 503 with zero mapping code.
- **JWT mapping is free.** `return next(err)` on a raw `jsonwebtoken` error becomes a 401.
- **`initGlobalHandlers` API is small and readable.**
- **Strict `errorClasses` is a two-line change.** `setConfig({ errorClasses: { Prisma, Zod: z } })` swapped duck-typing for real `instanceof` checks.

---

## Findings — Detail

### Finding 1 — `NODE_ENV` unset acts like production
**Type:** Documentation · **Severity:** Medium

Running `npx tsx src/index.ts` with no `NODE_ENV` silently hides stack traces. The behavior is documented — the README covers it in an `[!IMPORTANT]` block near the Configuration section (line 231: *"If `NODE_ENV` is not defined, you will receive sanitised error messages, as the library behaves as if the environment were set to production."*) — but the placement is easy to miss. The "Default Config Format" table shows `devEnvironments: ['dev', 'development']` with no inline note that unset `NODE_ENV` matches neither entry and silently falls to production mode. I lost stack traces on first boot and only found the explanation after digging.

**What would help:** one sentence inline in the `devEnvironments` defaults table — right next to the value — stating that an unset `NODE_ENV` matches nothing and behaves as production. The current note is buried a few sections away from where a developer is looking when configuring the library.

---

### Finding 2 — Unmatched routes return HTML, not JSON
**Type:** Bug / Missing feature · **Severity:** High

`GET /api/nothing` returned Express's default HTML `Cannot GET /api/nothing` with `Content-Type: text/html`. This breaks the JSON-only contract the library advertises.

I ended up adding:
```ts
app.use((req, _res, next) => next(Errors.NotFound(`Route ${req.originalUrl} not found`)));
```
This is not mentioned in the README. First-time integrators will ship a mixed-format API where some 404s are JSON and some are HTML.

**What would help:** a built-in 404 catch-all option, or at minimum a documented `app.use(...)` snippet placed prominently in the setup guide.

---

### Finding 3 — `zodMapper` flattens `.issues[]` before `formatError` — data loss
**Type:** Bug · **Severity:** High · **Filed as:** [#116](https://github.com/Dianka05/ds-express-errors/issues/116)

`zodMapper` serializes `ZodError.issues[]` into a semicolon-joined string and discards the original `ZodError` before `formatError` runs.

**Repro — empty POST body against a schema requiring `body.email` + `body.password`:**
```json
{
  "status": "fail",
  "message": "[Validation error]: body.email: Invalid input: expected string, received undefined; body.password: Invalid input: expected string, received undefined"
}
```

Consequences:
1. `issue.code` and `issue.path` are unreachable — no per-field `errors[]` response is possible without re-detecting Zod via `customMappers`.
2. Splitting `err.message` on `"; "` to recover fields is fragile: any user input containing `"; "` corrupts the parse.

**What would help:** an optional `details` (or `cause`) field on `AppError` so `zodMapper` can set `err.details = zodError.issues`. This preserves the default message string (no breaking change) while giving `formatError` real structured data.

---

### Finding 4 — `status: 'fail'` on 5xx errors — doesn't track HTTP class
**Type:** Limitation · **Severity:** Medium

A Prisma-mapped 503 came back as `status: 'fail'`. JSend (which this response shape resembles) uses `fail` for 4xx and `error` for 5xx. The library sets `status` from `isOperational`, and every built-in mapper marks its errors as `isOperational: true`, so all mapped errors — including genuine server failures — get `'fail'`.

Clients that route on `status` could label a server failure as a client failure.

**Workaround (via `formatError`):**
```ts
setConfig({
  formatError: (err, { req, isDev }) => ({
    status: (err as any).statusCode >= 500 ? "error" : "fail",
    message: err.message,
    ...(isDev ? { method: req.method, url: req.originalUrl, stack: err.stack } : {}),
  }),
});
```
**What would help:** document clearly that `status` reflects `isOperational`, not the HTTP class — or provide a documented way to get JSend-strict labels without a full `formatError` override.

---

### Finding 5 — Only `InternalServerError` accepts `isOperational`
**Type:** Inconsistency · **Severity:** Low

Reviewing the type definitions: `Errors.InternalServerError(message, isOperational)` is the only preset that exposes `isOperational` as a second argument. Every other preset accepts `message?` only. A developer needing a non-operational 400 has to bypass the preset API entirely and drop down to `new AppError(msg, 400, false)`.

**What would help:** either every preset takes `isOperational` as a second argument, or the docs note explicitly that `new AppError(msg, statusCode, false)` is the intended escape hatch.

---

### Finding 6 — `needMappers` type mismatch: single string vs. array
**Type:** Bug (types/docs drift) · **Severity:** Medium

`src/config/config.d.ts:62`:
```ts
needMappers?: 'zod' | 'joi' | 'expressValidator' | 'mongoose' | 'prisma' | 'sequelize'
```

The README example passes an array. The runtime accepts an array. The TypeScript declaration does not — spotted while reading the `.d.ts`, confirmed with `tsc --noEmit`: `Type 'string[]' is not assignable to type '"expressValidator" | "joi" | ...`.

**What would help:** update the `.d.ts` to `needMappers?: Array<'zod' | 'joi' | ...>` to match the README and the runtime.

---

### Finding 7 — `asyncHandler` is not generic
**Type:** Improvement · **Severity:** Medium

`asyncHandler` is typed as:
```
fn: (req: Request<ParamsDictionary, any, any, ParsedQs, ...>, res, next) => any
```

`ParamsDictionary` is `{ [key: string]: string }` — the widest possible params type. There is no generic parameter on `asyncHandler`, so there is no way to narrow it.

Tested with `tsc --noEmit` in [`doctors.controller.ts`](src/controllers/doctors.controller.ts):

- **With `req: Request` (base):** `req.params.idd` — no error. Typo goes undetected.
- **With `req: Request<{ id: string }>` (narrow):** TypeScript rejects the annotation itself —
  ```
  TS2345: Argument of type '(req: Request<{ id: string }>, ...) => ...'
  is not assignable to parameter of type '(req: Request<ParamsDictionary, ...>, ...) => any'
  Property 'id' is missing in type 'ParamsDictionary' but required in type '{ id: string; }'.
  ```

Due to function parameter contravariance, the narrower type is incompatible with what `asyncHandler` expects. There is no annotation workaround — the only options are `req: Request` (no param safety) or a manual `as` cast inside the body.

**What would help:** a generic overload:
```ts
function asyncHandler<P = ParamsDictionary, ResBody = any, ReqBody = any, Q = ParsedQs>(
  fn: (req: Request<P, ResBody, ReqBody, Q>, res: Response, next: NextFunction) => Promise<any>
): RequestHandler<P, ResBody, ReqBody, Q>
```

---

### Finding 8 — Mapper composition order not fully documented
**Type:** Documentation · **Severity:** Low

There are four config hooks that affect error handling: `errorClasses`, `needMappers`, `customMappers`, `formatError`. The README mentions in a code comment that `customMappers` run first (*"ds-express-errors would use them first"* — line 287), but the complete execution order is never laid out as a sequence anywhere.

Verified by testing:

1. **`customMappers` before built-ins** — adding a `customMapper` for `ZodError` took precedence over `zodMapper`.
2. **`needMappers` blocks built-ins** — excluding `'zod'` from `needMappers` caused the `ZodError` to fall through to `InternalServerError` (500). The raw `ZodError.issues` array was JSON-stringified into the message by the catch-all.

The full order is: `errorClasses` check → `customMappers` → built-in mappers (filtered by `needMappers`) → `formatError` → response. None of this is spelled out as a complete flow in the docs.

**What would help:** a short flow diagram or one-paragraph section in the README — *"error → customMappers → built-in mappers (filtered by needMappers) → formatError → response"*.

---

### Finding 9 — `throw Errors.*` not documented as an option inside `asyncHandler`
**Type:** Documentation · **Severity:** Low

The README consistently uses `next(Errors.*)` inside `asyncHandler`-wrapped routes (lines 94, 99, 115). It never mentions that `throw Errors.*` is a valid and equivalent alternative — something a developer would only know by reading the `asyncHandler` source or by testing.

Verified with two identical temp routes:

```ts
app.get('/test/throw', asyncHandler(async (_req, _res) => {
  throw Errors.NotFound('test not found');
}));

app.get('/test/next', asyncHandler(async (_req, _res, next) => {
  return next(Errors.NotFound('test not found'));
}));
```

Both returned identical responses — same HTTP status, same JSON shape, same message. The only difference was the line number in the stack trace.

`throw` is more idiomatic inside `asyncHandler` — it removes the need to declare `next` as a parameter at all.

**What would help:** a comment or note at the first appearance of `next(Errors.*)` inside an `asyncHandler` example (line 94) — something like *"you can also `throw Errors.*` directly; `asyncHandler` will catch it"* — so developers see both options at the point where they first encounter the pattern.

---

### Finding 10 — Async `customMappers` note is out of date ✅ Closed
**Type:** Documentation · **Severity:** Low · **Filed as:** [#113](https://github.com/Dianka05/ds-express-errors/issues/113) — resolved

The `[!IMPORTANT]` note in the README said async functions "will be ignored." The actual behavior: `setConfig()` throws `ConfigInvalid` immediately via the `fn.constructor.name === 'AsyncFunction'` check. The TypeScript `ErrorMapper` interface also prevents returning a `Promise` at compile time. The note described runtime behavior that can't happen unless you cast around the type.

**Resolution:** maintainer acknowledged and committed to update the wording. Issue closed Sep 3, 2026.

---

## Test Methodology

### Environment

```
Node.js 22.17.0 · Windows 11
Express 5.2.1
Prisma 7.9.1 with @prisma/adapter-pg
Zod 4.4.3
jsonwebtoken 9.0.3
NODE_ENV=development
DATABASE_URL=postgres://invalid:invalid@127.0.0.1:1/none (swapped in deliberately to force Prisma P1001 for Test 5; real DB available and used for other tests)
```

### Config used

```ts
setConfig({
  errorClasses: { Prisma, Zod: z },
});
```
No custom logger, mappers, or `formatError`. All results are against defaults with strict class checks for Prisma and Zod.

### How I ran tests

I ran the server locally with `npx tsx src/index.ts` and exercised each error path by sending `curl.exe` requests from a second terminal. Tests were run in `NODE_ENV=development` so responses included the full stack trace — this made it easier to confirm which mapper handled each error and trace the exact call path. For tests that needed an unreachable database (Test 5 — Prisma P1001), I swapped the `DATABASE_URL` to a fake host before starting the server. For anything that needed a real DB query to complete (e.g., Testing Finding 9), I switched back to the live connection.

Each test was run in isolation — one error path at a time, fresh `curl.exe` call, observed response recorded before moving on.

### How I decided if something is broken

| Check | Question |
|---|---|
| HTTP status | Does the code match the type of failure? |
| Content-Type | Is it `application/json`? A JSON error library returning HTML is a contract breach. |
| Response shape | Does the JSON match the documented shape? |
| Message content | Safe to show a user? Does it leak internal names? |
| Structured data | Is the raw error data still recoverable, or was it discarded? |

- **Bug / Misbehavior** = breaks a documented promise, drops data the caller might need, or produces output a JSON API cannot parse.
- **Rough edge** = ugly but not incorrect (verbose messages, inconsistent prefixes).

---

## Test Results

### Quick summary

| # | Test | Result | Verdict |
|---|---|---|---|
| 1 | Explicit `Errors.Unauthorized` | 401, exact message | ✅ Correct |
| 2 | JWT malformed | 401, message prefixed `[JsonWebTokenError]:` in dev; clean string in prod | ✅ Correct (dev-only prefix, by design) |
| 3 | Zod empty body | 400, `.issues` array flattened to a string | ❌ Bug — data loss |
| 4 | Bad JSON body | 400, plain message | ✅ Correct |
| 5 | Prisma unreachable (`P1001`) | 503, `status: "fail"` + verbose message | ⚠️ Rough edge — wrong status label |
| 6 | Unmatched route | 404 HTML | ❌ Bug — breaks the JSON contract |
| 7 | `throw Errors.NotFound` in `asyncHandler` | 404, exact message | ✅ Correct |

Score: 4 correct · 1 rough edge · 2 real misbehaviors.

---

### Test 1 — Own `Errors.Unauthorized`

**Request:** `GET /api/appointments/patient` (no Authorization header)

**Got:**
```json
{
  "status": "fail",
  "message": "Missing Authorization header",
  "method": "GET",
  "url": "/api/appointments/patient",
  "stack": "..."
}
```
**Verdict:** ✅ Correct. `status: "fail"` because `isOperational: true` (default for every preset except `InternalServerError`).

---

### Test 2 — JWT auto-mapping

**Request:** `GET /api/appointments/patient` with `Authorization: Bearer garbage`

**Got:**
```json
{
  "status": "fail",
  "message": "[JsonWebTokenError]: jwt malformed"
}
```
**Note:** captured in `NODE_ENV=development`. In production, `jwtMapper` returns `'Session expired. Please log in again.'` — the class name is not exposed.

---

### Test 3 — Zod validation

**Request:** `POST /api/identity/register` with body `{}`

**Got:**
```json
{
  "status": "fail",
  "message": "[Validation error]: body.email: Invalid input: expected string, received undefined; body.password: Invalid input: expected string, received undefined"
}
```
**Problem:** `zodMapper` flattens `ZodError.issues[]` into one semicolon-joined string. `issue.code` and `issue.path` are gone. Per-field responses and safe message recovery are all impossible.

**Verdict:** ❌ Bug — data loss. See Finding 3 and [#116](https://github.com/Dianka05/ds-express-errors/issues/116).

---

### Test 4 — Malformed JSON body

**Request:** `POST /api/identity/register` with body `{oops`

**Got:**
```json
{
  "status": "fail",
  "message": "Expected property name or '}' in JSON at position 1 (line 1 column 2)"
}
```
**Verdict:** ✅ Correct.

---

### Test 5 — Prisma unreachable DB (`P1001`)

**Request:** `GET /api/clinics`

**Got (dev):**
```json
{
  "status": "fail",
  "message": "Prisma P1001: [PrismaClientKnownRequestError] Cannot reach database: { modelName: Clinic }; { driverAdapterError: DriverAdapterError: DatabaseNotReachable }\nOperation: `prisma.clinic.findMany()`"
}
```
Production mode collapses this to `"Service unavailable"` — sanitized as promised.

**Two problems:**
1. **Wrong `status` label.** A 503 (server fault) returns `"fail"` — which JSend reserves for client faults (4xx). See Finding 4.
2. **Unstable message format.** The `{ modelName: Clinic }` and `{ driverAdapterError: ... }` fragments are produced by `Object.entries(err.meta).map(([key, value]) => \`{ ${key}: ${value} }\`).join("; ")` (verified in `prismaMapper.js` line 72). If Prisma's `err.meta` schema changes, this message changes too — no versioning contract.

**Verdict:** ⚠️ Rough edge on both counts.

---

### Test 6 — Unmatched route

**Request:** `GET /api/nothing`

**Got:**
```html
<!DOCTYPE html>
<html lang="en">
<head><title>Error</title></head>
<body><pre>Cannot GET /api/nothing</pre></body>
</html>
```
Content-Type: `text/html`. HTTP 404.

**Problem:** the library's pitch is "one middleware catches all errors and formats them into unified JSON." The most common HTTP error — a wrong URL — is not covered. First-time integrators will ship a mixed-format API where some 404s are JSON and some are HTML.

**Workaround:**
```ts
app.use((req, _res, next) => next(Errors.NotFound(`Route ${req.originalUrl} not found`)));
app.use(errorHandler);
```

**Verdict:** ❌ Bug against the library's own promise. See Finding 2.

---

### Test 7 — `throw Errors.NotFound` inside `asyncHandler`

**Request:** `GET /api/clinics/does-not-exist`

**Got:**
```json
{
  "status": "fail",
  "message": "Clinic not found"
}
```
**Verdict:** ✅ Correct. This is the pattern that makes the library worth adopting.

---

## Cross-Cutting Observations

### Envelope consistency

Six of seven tests returned the same shape: `{ status, message, method?, url?, stack? }`. Only the unmatched-route case broke shape. Inside the library's coverage, consistency is real.

### `status` label vs HTTP code

| Test | HTTP | Actual label | JSend-correct label |
|---|---|---|---|
| Missing auth | 401 | `fail` | `fail` ✅ |
| Bad JWT | 401 | `fail` | `fail` ✅ |
| Zod | 400 | `fail` | `fail` ✅ |
| Bad JSON | 400 | `fail` | `fail` ✅ |
| Explicit NotFound | 404 | `fail` | `fail` ✅ |
| Prisma unreachable | 503 | `fail` | **`error` ❌** |

Five out of six match by coincidence (all common 4xx are operational). The 5xx case is where the mislabel surfaces. Any future 5xx marked `isOperational: true` will have the same issue.

### Information loss

Only one case dropped data: Zod issues. Prisma meta is preserved (stringified, but recoverable in dev). JWT class name is preserved in dev only (unhelpfully, in the prefix) — stripped in production. SyntaxError has nothing structured to lose.

### Type/docs drift found during setup

- `needMappers` in `config.d.ts:62` is a single-string union; README shows an array; runtime accepts array. TS users must cast. (Finding 6)
- `NODE_ENV` unset behaves as production — it is documented, but the note lives in an `[!IMPORTANT]` block several sections away from the defaults table where you'd actually look. (Finding 1)

---

## Bottom Line

The library delivers on its central promise: one middleware, unified JSON. Prisma + JWT + Zod mapping is easy to configure — installing the package pays for itself in the first controller, and `asyncHandler` + presets remove boilerplate you'd otherwise write every time.

The current shape is safe only if you:
1. Always set `NODE_ENV` explicitly.
2. Add your own 404 catch-all.
3. Do not need structured Zod errors.
4. Do not route on the `status` field.

Every one of those is a library-side fix, not a user-side fix.

**New project:** yes, without hesitation.
**Production today:** with the four caveats above documented and mitigated at the application level.

---

## Attached Artifacts

- `TESTING_GUIDE.md` — full repro commands for every test path, `NODE_ENV` gating, Prisma probe routes, unit-testing patterns, and a Windows smoke script
- `TEST_RESULTS.md` — per-test observed vs. expected behavior with detailed analysis
- `REVIEW.md` — developer narrative review (the version posted to Discussion #101)
