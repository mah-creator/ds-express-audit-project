# Testing `ds-express-errors`

How to trigger every error path and check the library handles it right.

Commands use Windows `cmd.exe` with `curl.exe`. In PowerShell, `curl` is an alias for `Invoke-WebRequest`, so always type `curl.exe`.

---

## 1. Start the server

Open a `cmd.exe` window in the project root and run:

```cmd
set DATABASE_URL=postgres://invalid:invalid@127.0.0.1:1/none
set PORT=3737
set NODE_ENV=development
set DEBUG=true
npx tsx src/index.ts
```

What each variable does:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` unreachable | Prisma throws `P1001` on any DB call. No seed data needed. |
| `NODE_ENV=development` | Response includes `stack`, `method`, `url`. Production hides them. |
| `DEBUG=true` | Prints which mapper picked up the error. |
| `PORT=3737` | Free port. |

Important: if `NODE_ENV` is not set, the library treats it as production and hides stack traces.

Keep the server window open. Open a second `cmd.exe` window for the curl tests.

---

## 2. Run the tests

Each test hits a different error path. Copy-paste one at a time.

### Test 1 — Explicit `Errors.Unauthorized`

```cmd
curl.exe -si http://127.0.0.1:3737/api/appointments/patient
```

Expect: `401` with `{ "status": "fail", "message": "Missing Authorization header", ... }`.
Proves: your own `throw Errors.Unauthorized(...)` reaches the handler.

### Test 2 — JWT mapper

```cmd
curl.exe -si http://127.0.0.1:3737/api/appointments/patient ^
  -H "Authorization: Bearer garbage"
```

Expect: `401` with `"message": "[JsonWebTokenError]: jwt malformed"`.
Proves: `jsonwebtoken` errors auto-map to `401`.

### Test 3 — Zod mapper

```cmd
curl.exe -si -X POST http://127.0.0.1:3737/api/identity/register ^
  -H "Content-Type: application/json" ^
  -d "{}"
```

Expect: `400` with `"message": "[Validation error]: body.email: ...; body.password: ..."`.
Proves: `ZodError` from your `validate` middleware maps to `400`.
Warning: the `.issues` array is flattened into one string. If you need per-field errors in the response, write a `customMapper`.

### Test 4 — SyntaxError from bad JSON

```cmd
curl.exe -si -X POST http://127.0.0.1:3737/api/identity/register ^
  -H "Content-Type: application/json" ^
  -d "{oops"
```

Expect: `400` with a message about unexpected JSON tokens.
Proves: Express body-parser `SyntaxError` maps to `400`, not the default `500`.

### Test 5 — Prisma unreachable DB

```cmd
curl.exe -si http://127.0.0.1:3737/api/clinics
```

Expect: `503` with `"message": "Prisma P1001: ..."`.
Proves: Prisma codes map to HTTP codes per the README.

For other Prisma codes (`P2002`, `P2025`), see Section 5.

### Test 6 — Unmatched route

```cmd
curl.exe -si http://127.0.0.1:3737/api/nothing
```

Expect: `404` as HTML (`Cannot GET /api/nothing`).
Proves: **the library does not install a 404 catch-all.** If you want JSON here, add this before `app.use(errorHandler)`:

```ts
app.use((req, _res, next) => next(Errors.NotFound(`Route ${req.method} ${req.originalUrl} not found`)));
```

### Test 7 — `throw` inside an `asyncHandler`

```cmd
curl.exe -si http://127.0.0.1:3737/api/clinics/does-not-exist
```

Expect: `404` with `"message": "Clinic not found"`.
Proves: `asyncHandler` catches thrown errors without needing `next()`.

---

## 3. What a successful error trip looks like

Every error should show up in three places. Missing one means a bug.

| Place | Sign of success | If missing |
|---|---|---|
| Server stdout | Colored block with timestamp, method, URL, status, stack | Error never reached `errorHandler`. Check that `app.use(errorHandler)` is the last middleware. |
| HTTP response | JSON with `status` and `message` | A route sent `res.json(...)` before calling `next(err)`. |
| `DEBUG=true` log | Line saying which mapper matched | The error class was not recognized. |

---

## 4. Understanding the `status` field

The library returns `status: "fail"` or `status: "error"` based on `isOperational`, not the HTTP code:

| `isOperational` | `status` field |
|---|---|
| `true` (default for all presets except `InternalServerError`) | `"fail"` — even for a 503 |
| `false` | `"error"` |

Do not route on `status` alone. Always check the HTTP code too.

If you want strict JSend (`fail` = 4xx, `error` = 5xx), override `formatError`:

```ts
setConfig({
  formatError: (err, { req, isDev }) => ({
    status: (err as any).statusCode >= 500 ? "error" : "fail",
    message: err.message,
    ...(isDev ? { method: req.method, url: req.originalUrl, stack: err.stack } : {}),
  }),
});
```

---

## 5. Forcing specific Prisma codes without a real DB

An unreachable DB only produces `P1001`. To trigger other codes, add a temporary probe route:

```ts
import { Prisma } from "@prisma/client";

app.get("/__probe/prisma/:code", (req, _res, next) => {
  next(new Prisma.PrismaClientKnownRequestError("probe", {
    code: req.params.code.toUpperCase(),
    clientVersion: "7.x",
    meta: { modelName: "Probe" },
  }));
});
```

Then hit it:

```cmd
curl.exe -si http://127.0.0.1:3737/__probe/prisma/P2002
curl.exe -si http://127.0.0.1:3737/__probe/prisma/P2025
curl.exe -si http://127.0.0.1:3737/__probe/prisma/P2003
curl.exe -si http://127.0.0.1:3737/__probe/prisma/P2021
```

Expected codes: `409`, `404`, `400`, `500`.

Delete the route before shipping.

---

## 6. Checking `NODE_ENV` gating

Start the server twice and hit the same endpoint:

```cmd
set NODE_ENV=development
npx tsx src/index.ts
```
then:
```cmd
set NODE_ENV=production
npx tsx src/index.ts
```

Dev response has `stack`, `method`, `url`. Prod response has only `status` and `message`.

If the prod response still shows a stack, either `devEnvironments` includes `"production"` or `NODE_ENV` never reached the process.

---

## 7. Unit-testing controllers

Presets return real `AppError` instances, so you can assert without Express:

```ts
import { Errors, AppError } from "ds-express-errors";
import { getClinicById } from "../src/controllers/clinics.controller";

test("404 when clinic missing", async () => {
  const req: any = { params: { id: "missing" } };
  const res: any = { json: jest.fn() };
  const next: any = jest.fn();

  await getClinicById(req, res, next);

  const err = next.mock.calls[0][0];
  expect(err).toBeInstanceOf(AppError);
  expect(err.statusCode).toBe(404);
  expect(err.message).toBe("Clinic not found");
});
```

Caveat: `setConfig` and `initGlobalHandlers` are one-shot. If your test imports `src/index.ts`, they fire at import time. Move `setConfig(...)` to its own module so tests can skip it, or fork a child process per suite.

---

## 8. Two common bugs to watch for

**`errorHandler` not last.**
Symptom: some errors return HTML or hang.
Fix: `app.use(errorHandler)` must come after every `app.use('/api/...', router)`.
How to catch: throw a synthetic error in each route module. Confirm it lands as JSON.

**A route sends a response then calls `next(err)`.**
Symptom: `Error [ERR_HTTP_HEADERS_SENT]` in the log, truncated client body.
Fix: `return` after `res.json(...)`, or replace with `throw Errors.X(...)`.
How to catch: grep for `res.status(` followed by `next(` in the same handler.

---

## 9. Smoke script (Windows batch)

Save as `scripts\smoke.bat`. Runs all seven probes in one shot.

```bat
@echo off
setlocal
set BASE=http://127.0.0.1:3737

call :probe "unmatched route"      %BASE%/api/nothing
call :probe "missing auth"         %BASE%/api/appointments/patient
call :probe "garbage jwt"          %BASE%/api/appointments/patient -H "Authorization: Bearer garbage"
call :probe "zod empty body"       %BASE%/api/identity/register -X POST -H "Content-Type: application/json" -d "{}"
call :probe "bad json"             %BASE%/api/identity/register -X POST -H "Content-Type: application/json" -d "{oops"
call :probe "prisma unreachable"   %BASE%/api/clinics
call :probe "explicit NotFound"    %BASE%/api/clinics/does-not-exist
exit /b

:probe
set LABEL=%~1
shift
curl.exe -s -o NUL -w "%%{http_code} %%{content_type}\n" %*
echo    ^-^-^> %LABEL%
exit /b
```

Expected output in this project:

```
unmatched route        -> 404 text/html            (library does not cover this)
missing auth           -> 401 application/json     (Errors.Unauthorized)
garbage jwt            -> 401 application/json     (jwtMapper)
zod empty body         -> 400 application/json     (zodMapper)
bad json               -> 400 application/json     (nameMapper)
prisma unreachable     -> 503 application/json     (prismaMapper)
explicit NotFound      -> 404 application/json     (Errors.NotFound)
```

Any row that flips to `text/html` (other than the unmatched route) means a handler-order bug or an unmapped error class.
