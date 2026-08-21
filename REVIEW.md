# DX review of `ds-express-errors@1.9.2` — from a real integration

Thanks for building this — I dropped it into a live Express 5 + Prisma 7 (adapter-pg) + Zod 4 project, refactored ~12 controllers to use `asyncHandler` + `Errors.*`, wired `initGlobalHandlers`/`gracefulHttpClose`, and exercised the JWT / Zod / SyntaxError / Prisma paths. The end-to-end wins are real, but there are some sharp edges. Below is what I ran into, unvarnished.

## What was easy and reasonable

- **The 60-second `app.use(errorHandler)` win.** Even before touching controllers, moving the middleware to the end of the chain immediately unified 500s. That's a great first-run experience.
- **`asyncHandler` + `Errors.NotFound(...)` collapses controller noise.** Every `try { ... } catch (e) { next(e) }` block deleted itself. `throw Errors.NotFound('Doctor not found')` inside an `asyncHandler` is exactly what I want to write.
- **The Prisma mapper is the killer feature.** Killing the DB and hitting `/api/clinics` gave me a clean `503 { status: 'fail', message: 'Prisma P1001: ...' }` with zero code from me. P2002 → 409, P2025 → 404 etc. is genuinely useful.
- **JWT auto-mapping.** In my `authenticateJWT`, I just do `return next(err)` on a raw `jsonwebtoken` error and get a 401 back. Perfect.
- **`initGlobalHandlers({ closeServer: gracefulHttpClose(server), onShutdown, onCrash })`.** Nice, small, focused API. Table-in-README of the options is exactly the right level of documentation.
- **`setConfig({ errorClasses: { Prisma, Zod: z } })` for strict mode.** Once I found it (see below), swapping duck-typing for real `instanceof` checks was a two-line change.

## What was indirect / hard to come by

- **The README is a teaser, not a reference.** Almost every non-trivial detail is "visit ds-express-errors.dev/docs". `formatError`, `errorClasses`, `needMappers`, `devEnvironments`, `customMappers` all get one-line demos and then a link. I want a full API reference in the README so I can read it offline in `node_modules`. Right now `README.md` + `index.d.ts` don't tell the whole story.
- **The default `NODE_ENV` behavior is the opposite of what Node devs expect.** If `NODE_ENV` is unset, the lib behaves as production. Every other Node tool defaults *unset* to development. This is a footgun — I lost stack traces in local dev until I set `NODE_ENV=development` explicitly. Either flip the default, or make the warning much louder (it's currently a `[!IMPORTANT]` blockquote a third of the way down the README).
- **`setConfig` and `initGlobalHandlers` are one-shot singletons that throw on the second call.** This is a real pain for testing — you can't `beforeEach` reset. `initGlobalHandlers` throwing `GlobalHandlerAlreadySet` is fine as a footgun guard, but `setConfig` should at least support merging or an explicit `{ override: true }`. Right now the recommended pattern is "call it exactly once at the top of `src/index.ts`", which fights any test harness that reimports the module.
- **404 for unknown routes is not covered.** `GET /api/nothing` returns Express's default HTML `Cannot GET /api/nothing`. If the pitch is "one middleware catches all errors and formats them into a unified JSON response," a catch-all `Errors.NotFound` for unmatched routes should either be included or explicitly documented as "add your own `app.use((req,res,next) => next(Errors.NotFound()))` before `errorHandler`". Right now new users get an inconsistent response shape for the most common error path.
- **How the pieces compose isn't spelled out.** `errorClasses` (strict check), `needMappers` (allowlist), `customMappers` (user-first), `formatError` (final shape) — the ordering and precedence between them is only implicit. A single flowchart of "error enters `errorHandler` → precedence" would save a lot of guessing.
- **`asyncHandler` isn't generic.** It's typed as `(req, res, next) => any`. In a TS codebase you lose `Request<Params, ResBody, ReqBody, Query>` inference the moment you wrap. An `asyncHandler<P, ResBody, ReqBody, Q>(...)` overload would be a big DX win with zero runtime cost.
- **`throw` vs `next(err)` inside `asyncHandler` is never clarified.** README shows `next(Errors.NotFound(...))` even inside `asyncHandler`, where `throw Errors.NotFound(...)` is cleaner and works identically. Pick one and recommend it.

## What felt inconsistent

These are the ones I'd genuinely push back on as a user:

1. **`Errors.InternalServerError(message, isOperational)` is the only preset that takes `isOperational`.** All the others are `(message?)` only. If I want a non-operational 400 or 404 (say, to distinguish "programmer error that returned a 400 status" from "expected user input error"), I'm forced to drop down to `new AppError(msg, 400, false)`, which then bypasses the ergonomic surface entirely. Either every preset should accept `isOperational`, or none should.

2. **`status: 'fail' | 'error'` is derived from `isOperational`, not from HTTP class — and it produces confusing labels.** In my run, a 503 from Prisma P1001 came back as `status: 'fail'` because the mapper set `isOperational: true`. Semantically that's a *server* failure, not a client fault, so calling it `'fail'` (the JSend-ish "client did something wrong" bucket) is misleading. The JSend spec that this borrows from ties `'fail'` to 4xx and `'error'` to 5xx. This split-brain (JSend labels but `isOperational` semantics) will bite anyone who tries to route on `status`.

3. **`errorClasses` supports Zod, Joi, Sequelize, Prisma — but not Mongoose or express-validator**, even though both are advertised as first-class in the "Third-Party Error Mapping" section. So half of the supported integrations get strict `instanceof` checks and half are stuck on duck-typing forever. That's an inconsistent contract.

4. **`ErrorConfig.needMappers` is typed as a *single string* union, but the README example passes an array.** Look at `src/config/config.d.ts` line 62:
   ```ts
   needMappers?: 'zod' | 'joi' | 'expressValidator' | 'mongoose' | 'prisma' | 'sequelize'
   ```
   vs. README:
   ```js
   needMappers: ['zod', 'joi', 'prisma']
   ```
   Runtime clearly accepts an array (that's the whole point). The type should be `Array<'zod' | 'joi' | ...>`. Right now TS users either get a compile error or silently cast `as any`.

5. **The Zod mapper flattens `ZodError.issues` into a single `message` string, and that's what `formatError` receives.** Example from my run:
   ```
   "message": "[Validation error]: body.email: Invalid input: expected string, received undefined; body.password: Invalid input: expected string, received undefined"
   ```
   By the time `formatError` fires, the original `.issues` array is gone. If I want to emit a JSON:API `errors[]` payload with one entry per field, I can't — the structured data has already been serialized into a semicolon-joined string. Either the mapper should attach the raw issues to the AppError (`err.details`), or `formatError` should receive both the original and the mapped error.

6. **Message strings leak internal type tags.** JWT errors come out as `"[JsonWebTokenError]: jwt malformed"`. Prisma dev messages include `{ modelName: Post }; { driverAdapterError: DriverAdapterError: DatabaseNotReachable }`. In dev that's arguably fine, but the bracketed class-name prefix is ugly and non-standard, and there's no config to turn it off short of a full `formatError` override.

7. **Two surfaces for the same presets.** `presets.d.ts` exports `BadRequest`, `NotFound`, etc. as free functions *and* README/`index.d.ts` documents them under `Errors.NotFound(...)`. Both work. Pick one — the parallel surface just adds cognitive load and makes IDE autocomplete noisier.

8. **`customMappers must be synchronous` is a single-line `[!IMPORTANT]` note.** Given how tempting it is to reach for async when integrating with, say, a remote error-classification service, this deserves either a runtime warning when a Promise is returned, or a typed `ErrorMapper` signature that literally forbids `Promise<AppError | Error | null>`. Currently the type is `(err, req) => AppError | Error | undefined | null`, which does prevent it, so at least remove the doc note about it being "ignored" — the type already enforces this.

## Small polish suggestions

- Publish `.d.ts` for `initGlobalHandlers`/`gracefulHttpClose` at the top-level `index.d.ts` (currently they're only reachable via `src/middleware/errorHandler.d.ts` reexport).
- Add a real "Migrating from bare try/catch" section — 90% of adopters are doing this exact refactor.
- README's "Default Config Format" says `devEnvironments: ['dev', 'development']` but text elsewhere says the default when `NODE_ENV` is unset behaves as prod. Both are true, but the interaction (`NODE_ENV=undefined` doesn't match `devEnvironments`) should be spelled out in one sentence.
- Consider a first-class `notFoundHandler` middleware users can drop in before `errorHandler` — solves point 4 with one line of user code.

## Bottom line

Once wired, the payoff is real — deleting 40+ try/catch blocks and getting Prisma/JWT/Zod mapping for free is a genuinely nice DX. The friction is all at the edges: opaque defaults (`NODE_ENV`), a README that outsources the interesting parts to a hosted docs site, a typing gap on `needMappers`, the `isOperational`-only-on-500 inconsistency, and the `'fail'/'error'` labels not tracking HTTP class. Fix those and this becomes a genuinely easy recommendation for any Express + ORM project.
