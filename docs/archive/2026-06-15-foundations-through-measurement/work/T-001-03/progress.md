# Progress — T-001-03 structured-output-binding

Implementation log. Plan followed step by step; one in-flight improvement noted.

## Status: complete — all 5 plan steps landed, `npm test` green (44 tests)

| Step | Commit | State |
|---|---|---|
| 1. Pure core `src/artifact.mjs` | `31995ef` | ✅ done |
| 2. Core test suite `src/artifact.test.mjs` | `5642cc9` | ✅ done |
| 3. SDK edge `src/sdk-binding.mjs` | `36c78bc` | ✅ done |
| 4. SDK edge test suite `src/sdk-binding.test.mjs` | `af94d93` | ✅ done |
| 5. Optional dep + docs (+ live-wrapper refinement) | `e74aef0` | ✅ done |

## What was built

- **`src/artifact.mjs`** — the SDK-free validation gate. `loadSchema`,
  `compileValidator`, memoized `getValidator`, `formatErrors` (ported verbatim from
  T-001-01 so error text is identical), `parseArtifact` (string|object →
  `{ok,artifact}` | `{ok,code,errors}`), `assertArtifact` (fail-fast), and
  `toModelSchema` (model-facing projection). Full JSDoc typedefs
  (`DesignArtifact`, `Metadata`, `Style`, `Palette`, `Placement`, `Coordinate`…)
  are the "typed artifact."
- **`src/sdk-binding.mjs`** — the SDK edge. `designArtifactOutputFormat()`
  (`{type:"json_schema", schema: toModelSchema()}`), `extractArtifact(result)`
  (tolerant `payloadOf` + `parseArtifact`), and the lone live/metered
  `requestDesignArtifact()` behind a dynamic import.
- **Two `node:test` suites** (24 new cases: 17 core + 7 edge) over the committed
  `schema/examples/*` fixtures. No live SDK call.
- **`package.json`** — `@anthropic-ai/claude-agent-sdk` as `optionalDependencies`.
  `test:unit`'s `src/**/*.test.mjs` glob picked up both new suites with no script
  change.
- **`src/README.md`** — "Validation & SDK binding" section.

## Deviations from the plan

1. **SDK actually installed and API verified (planned as best-effort).** The plan
   allowed for install to fail and the manifest entry to stand alone. It succeeded
   (95 packages, 0 vulns; npm pinned `^0.3.162`). I used the opportunity to verify
   my doc-derived assumptions against the installed `sdk.d.ts`:
   - `OutputFormat` includes `JsonSchemaOutputFormat = { type:'json_schema';
     schema: Record<string,unknown> }` — `designArtifactOutputFormat()` matches
     exactly.
   - `SDKResultSuccess` carries `result: string` and `structured_output?: unknown`;
     `extractArtifact`'s `structured_output ?? result` order is correct.
   - The error terminal `SDKResultError` includes
     `subtype: 'error_max_structured_output_retries'` (and friends).
   This retired the "SDK identifier drift" risk for v0.3.162 (still flagged in
   review for future SDK versions).

2. **Live-wrapper refinement (added during step 5).** Having confirmed the error
   subtypes, `requestDesignArtifact` now checks `result.subtype !== "success"` and
   throws a clear "ended without a valid artifact (subtype: …)" error (surfacing
   `result.errors`) instead of falling through to the generic "no payload" path.
   Behaviorally invisible to the offline suite (the live wrapper is untested) but
   correct against the verified type.

## Verification run

- `npm run test:unit` → 44 pass (20 expand + 17 artifact + 7 sdk-binding), 0 fail.
- `npm test` → schema self-test + good/bad fixture gate + 44 unit tests, exit 0.
- Manual smoke (during dev): `parseArtifact` good/bad/malformed; `toModelSchema`
  discriminator stripped (structural key scan, not substring); projected schema
  compiles and validates standalone without the discriminator option.

## Not done (by design — see review/open concerns)

- No live `requestDesignArtifact` run (metered; needs credentials). Documented as
  a follow-up integration check.
- `scripts/validate-artifact.mjs` not refactored to import the shared core
  (Decision 6 — kept ticket file-set disjoint; flagged as optional future DRY).
