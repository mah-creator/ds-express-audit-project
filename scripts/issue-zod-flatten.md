### Where

`src/presets/mappers/zodMapper.js`, line 23:

```js
return BadRequest(`[Validation error]: ${formattedMessages}`)
```

`AppError` (`src/errors/AppError.js`) currently exposes only `message` / `statusCode` / `isOperational`, so the raw `ZodError` has nowhere to ride along.

### Problem

`zodMapper` serializes `ZodError.issues[]` into a semicolon-joined string and constructs a fresh `BadRequest`. The original `ZodError` is discarded before `formatError` runs. Consequences:

- `issue.code` and `issue.path` are unreachable — no per-field `errors[]` response possible without re-detecting Zod upstream via `customMappers`.
- Splitting `err.message` on `"; "` to recover fields is fragile: any user input containing `"; "` corrupts the parse.
- Localization keyed on `issue.code` is not possible.

Repro — Express 5, `setConfig({ errorClasses: { Zod: z } })`, empty POST against a schema requiring `body.email` + `body.password`:

```json
{
  "status": "fail",
  "message": "[Validation error]: body.email: Invalid input: expected string, received undefined; body.password: Invalid input: expected string, received undefined"
}
```

### Suggestion

Keep the raw `ZodError` around instead of throwing it away. If `AppError` gained an optional `details` (or `cause`) field, `zodMapper` could just set `err.details = zodError.issues`. That gives `formatError` real structured data to work with — per-field responses, localization, whatever — while the default message string stays exactly as it is now, so nothing breaks for anyone who isn't overriding `formatError`.

### Package version

`ds-express-errors@1.9.2`
