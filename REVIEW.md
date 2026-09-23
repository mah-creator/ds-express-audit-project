# ds-express-errors v1.9.2 — developer review

- **Library version tested:** ds-express-errors v1.9.2
- **Stack:** Node.js 22.17 · Express 5.2.1 · Prisma 7.9.1 (adapter-pg) · Zod 4.4.3 · jsonwebtoken 9.0.3 · TypeScript strict · Windows 11
- **Experience level:** Mid-level
- **Overall rating:** 7/10

## What I built

I build a clinic booking api in a live Express 5 + Prisma to use `asyncHandler` + `Errors.*`. Wired `initGlobalHandlers` and `gracefulHttpClose`. Exercised the JWT, Zod, SyntaxError, Prisma, and unmatched-route paths.

---

## What worked

- **Wiring is one line.** Dropping `app.use(errorHandler)` at the end of the chain unified every uncaught 500 before I touched a controller.
- **`asyncHandler` + `throw Errors.*` deleted every `try/catch` block.**
- **Prisma mapping is the best feature.** All prisma errors returned a clean mapping to HTTP codes with zero code from me. P2002 → 409, P2025 → 404 all worked out of the box.
- **JWT mapping is free.** `return next(err)` on a raw `jsonwebtoken` error becomes a 401. No mapping code needed.
- **`initGlobalHandlers` API is small and readable.**
- **Strict `errorClasses` is a two-line change.** `setConfig({ errorClasses: { Prisma, Zod: z } })` swapped duck-typing for real `instanceof` checks.

## Issues I ran into

### 1. Unset `NODE_ENV` acts like production

I ran `npx tsx src/index.ts` with no `NODE_ENV` and lost stack traces on my first error. Every other Node tool I use treats unset `NODE_ENV` as development. I only found the warning after digging through an `[!IMPORTANT]` box a third of the way down the README. The "Default Config Format" section shows `devEnvironments: ['dev', 'development']` but never mentions that unset matches nothing.

**What would help:** one sentence next to `devEnvironments` in the defaults table saying `NODE_ENV=undefined` matches nothing and behaves as production.

### 2. Unmatched routes return HTML, not JSON

`GET /api/nothing` returned Express's default HTML `Cannot GET /api/nothing`. Content-Type `text/html`, HTTP 404. This breaks the shape of an expected JSON response

I ended up adding:

```ts
app.use((req, _res, next) => next(Errors.NotFound(`Route ${req.originalUrl} not found`)));
```

### 3. Zod mapper flattens `.issues[]` into one string

E.g., empty POST body against a schema needing `email` and `password`:

```json
{
  "status": "fail",
  "message": "[Validation error]: body.email: Invalid input: expected string, received undefined; body.password: Invalid input: expected string, received undefined"
}
```

By the time my `formatError` could see the error, the `ZodError.issues[]` array was already a semicolon-joined string. I couldn't build a per-field `errors[]` response, couldn't translate anything (the `issue.code` and `issue.path` were gone), and splitting on `"; "` was fragile against user input.

**What would help:** a way to reach the original `ZodError` (or its `.issues[]`) from `formatError` or on the mapped `AppError`, so I can build a per-field response without reimplementing Zod detection.

### 4. `status: 'fail' | 'error'` doesn't track the HTTP code

A Prisma-mapped 503 came back as `status: 'fail'`. JSend (which this shape looks like) uses `fail` for 4xx and `error` for 5xx, so a client that routes on `status` will label a server failure as a client failure. All my 4xx tests happened to match by coincidence; the 5xx case was the one that broke.

**What would help:** either document clearly that `status` reflects `isOperational` and not the HTTP class (so nobody routes on it), or give a documented way to get JSend-strict labels without writing a full `formatError` override.

### 5. Message strings leak internal class names

JWT errors came back as `"[JsonWebTokenError]: jwt malformed"`. Prisma dev messages included `{ modelName: Clinic }; { driverAdapterError: DriverAdapterError: DatabaseNotReachable }`. But I noticed that these additional info are included under `dev` environment.

Across five entry points I saw four different message conventions:

| Mapper | Prefix |
|---|---|
| `jwtMapper` | `[JsonWebTokenError]: <message>` |
| `zodMapper` | `[Validation error]: <path>: <msg>; ...` |
| `nameMapper` (SyntaxError) | no prefix — raw V8 message |
| `prismaMapper` (dev) | `Prisma <code>: [<ClassName>] <message>: <meta>` |
| `Errors.*` presets | exactly what you passed |

**What would help:** a documented, consistent message shape across all mappers.

### 6. Only `InternalServerError` accepts `isOperational`

`Errors.InternalServerError(message, isOperational)` is the only preset with a second argument. Every other preset accepts `message?` only. When I wanted a non-operational 400 I had to drop down to `new AppError(msg, 400, false)`.

**What would help:** consistency — either every preset takes `isOperational` or none do.

### 7. `needMappers` type doesn't match the runtime

`src/config/config.d.ts:62`:

```ts
needMappers?: 'zod' | 'joi' | 'expressValidator' | 'mongoose' | 'prisma' | 'sequelize'
```

The README example passes an array. My TS build failed until I cast around it. This one bit me on the first configuration attempt.

**What would help:** an array type on `needMappers` that matches the README.

### 8. `asyncHandler` isn't generic

Typed as `(req, res, next) => any`. The moment I wrapped a route I lost `Request<Params, ResBody, ReqBody, Query>` inference and had to type params manually inside the handler.

**What would help:** a generic `asyncHandler<P, ResBody, ReqBody, Q>(...)` overload so wrapped handlers keep the same type inference as bare Express handlers.

### 9. Composition order isn't written down

There are four hooks: `errorClasses` (strict check), `needMappers` (allowlist), `customMappers` (user-first), `formatError` (final shape). Their order and precedence isn't spelled out anywhere I could find, so I built a mental model by testing.

**What would help:** a short "error → custom mapper → built-in mapper → formatError → response" section in the README.

### 10. `throw Errors.*` vs `next(err)` inside `asyncHandler`

The README shows `next(Errors.NotFound(...))` inside `asyncHandler`, where `throw Errors.NotFound(...)` is shorter and works the same. I couldn't tell if one was preferred or if they were interchangeable.

**What would help:** the docs pick one idiom and use it consistently in examples.

### 11. Doc note about async `customMappers` is out of date

The `[!IMPORTANT]` note says Promises returned from `customMappers` are "ignored." The type signature already blocks returning a Promise, so the note describes runtime behavior that can't happen unless you cast around the type.

**What would help:** remove the note, or reword it to match what the type already enforces.

## Documentation

- **README is a preview, not a reference.** Almost every real detail links to `ds-express-errors.dev/docs`. `formatError`, `errorClasses`, `needMappers`, `devEnvironments`, `customMappers` each get one demo then a link. When I read the code offline in `node_modules`, I had to guess.
- `.d.ts` for `initGlobalHandlers` / `gracefulHttpClose` doesn't come through the top-level `index.d.ts` — I had to reach through `src/middleware/errorHandler.d.ts` to import types.
- A "Migrating from bare try/catch" section would match what most new users are actually doing.
- The homepage leads with "type-safe" but Installation and Usage examples are JS only. One TypeScript snippet in either page would match the claim.

## Would I use it?

**New project:** yes, without hesitation. Prisma + JWT + Zod mapping for zero dependencies is a good trade, and `asyncHandler` + presets pay for themselves in the first controller.

**Production today:** with caveats. I ended up writing a 404 catch-all, planning around the flattened Zod message, and telling my frontend not to route on `status`. None of those are hard, but they were surprises. Once the docs address the `NODE_ENV` default, the Zod detail loss, the `status` labeling, and the missing 404, this becomes an easy recommendation for any Express + ORM project.
