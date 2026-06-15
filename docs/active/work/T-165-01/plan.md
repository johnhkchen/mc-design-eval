# T-165-01 — Plan

Ordered, independently-verifiable steps. Each step is a commit. Tests named per step. Maps to the Structure
ordering; each step ends green.

## Step 1 — Optional `style` on the schema; keep recognition pinned

- `schema/building-program.schema.json`: add optional `style` property (string, slug pattern); not in
  `required`.
- `src/recognition/prompt.mjs`: `baseRecognitionSchema` also `delete s.properties?.style;`.
- `src/recognition/prompt.test.mjs`: extend the facade-strip test (or add a sibling) to assert
  `baseRecognitionSchema().properties.style === undefined`, committed schema keeps `style`, and
  `recognitionRenderArgs(...).schema_json` contains no `"style"`.
- **Verify:** `node --test src/recognition/prompt.test.mjs` green; FX-R1 in `fixtures.test.mjs` still
  byte-identical (recognition prompt sha unchanged). Committed barn/cottage programs still validate
  (`assertBuildingProgram`).
- **Commit:** `feat(T-165-01): optional program.style + base-prompt strip (FX-R1 pinned)`.

## Step 2 — Recognition declares the style (stamp from pack)

- `benchmarks/sculpture/recognize.mjs`: after each `parseProgramReply(...)` (live `:152`, repro `:228`),
  set `program.style = pack.style` before write/use. Idempotent.
- **Verify:** unit suite green; the stamp is `pack.style` (a string). A quick `--repro`-shaped read shows
  the stamped program still validates. (No metered live run — the stamp is deterministic; smoke is Step 7.)
- **Commit:** `feat(T-165-01): recognition stamps declared style from the conditioning pack`.

## Step 3 — `styleProfileBlock` + declared-style selection (pure)

- `src/workshop/diagnose.mjs`: add `styleProfileBlock({ pack })` (roof/wall/opening grammar from
  `pack.idioms` + `pack.palette` + `pack.proportions.pitchClasses`); change `style` to `program?.style ??
  pack.style`; add `style_profile: styleProfileBlock({ pack })` to `diagnoseRenderArgs`.
- `src/workshop/diagnose.test.mjs`:
  - **DG5** — `styleProfileBlock(rustic)` ≠ `styleProfileBlock(saltcrag)`; rustic mentions
    `spruce`/`timber-frame`, saltcrag mentions `dark_oak`/`limewash` (and ridge tile); no subject string;
    deterministic across two calls.
  - **DG6** — `diagnoseRenderArgs` `style` = `program.style` when set, = `pack.style` when program omits it.
  - Update DG1–DG4 for the additive `style_profile` key and the `style` source (program-first).
- **Verify:** `node --test src/workshop/diagnose.test.mjs` green (this is the AC2 gradient, proven offline).
- **Commit:** `feat(T-165-01): per-style style_profile + declared-style selection (DG5/DG6)`.

## Step 4 — Wire `style_profile` into the BAML function

- `baml_src/department.baml`: add `style_profile: string` input + the "CONSTRUCTION GRAMMAR" prompt section.
- `src/baml/bridge.mts`: pass `a.style_profile` in the correct position.
- `npm run baml:gen` to regenerate `baml_client`.
- **Verify:** `npm run baml:gen` clean; `node --test src/baml/transport-guard.test.mjs` green (TG3 importer
  set unchanged; TG5 finds no gate vocabulary in the new text).
- **Commit:** `feat(T-165-01): DiagnoseBuild consumes style_profile (bridge + baml_client)`.

## Step 5 — Regenerate the diagnose golden; pin it

- Regenerate `src/baml/fixtures/diagnose/inputs.json` (add `style_profile`; `style` stays `rustic` via the
  committed barn program's pack-id fallback) and `prompt.golden.txt` (render `inputs.json` through the
  bridge). Use the production serializer over the committed barn program + rustic pack (mirror
  `diagnose-smoke.mjs`'s input construction) so the golden is production-faithful, not hand-typed.
  `reply.txt` / `expected.json` untouched.
- `src/baml/fixtures.test.mjs`: FX-DB1 — add an assert for the new grammar section header so the new block
  is pinned by intent.
- **Verify:** `node --test src/baml/fixtures.test.mjs` green (FX-DB1 byte-identical to the new golden,
  FX-DB2 unchanged).
- **Commit:** `test(T-165-01): regen diagnose golden with style_profile; FX-DB1 grammar assert`.

## Step 6 — Full suite + isolation

- **Verify:** `npm test` green (target ≥ 2212 + new); `npm run workshop:replay` / `workshop:offline`
  byte-identical (fused path untouched); frozen instrument + FX-R1 untouched.
- **Commit:** none if Steps 1–5 each committed green; otherwise a fixup commit.

## Step 7 — Live witness (optional, judge-free, metered)

- `npm run diagnose:smoke` (barn) to witness the actual `expected` now references the style grammar; and a
  saltcrag pass (`--pack packs/saltcrag.json` if the smoke supports it, else the DG5 profile diff stands as
  the offline proof). Spend-limit caution: ONE un-retried call per style; commit the JSON as evidence only,
  not a gating test. If not run, DG5's deterministic profile-diff is the AC2 witness and the review says so.

## Testing strategy

- **Unit (in `npm test`):** DG5 (the AC2 gradient — *same build, two styles → different profile*), DG6
  (declared-style selection + fallback), DG1–DG4 (serializer content/determinism/single-source), the
  recognition strip guard (FX-R1 protection), FX-DB1 (golden byte-identity + grammar assert), FX-DB2
  (parse), TG3/TG5 (transport/gate isolation).
- **Determinism:** FX-R1 byte-identity proves recognition prompt unchanged; FX-C1/replay/offline prove the
  fused path unchanged.
- **Manual/metered (not gating):** `diagnose:smoke` — committed output as evidence only.

## Risks & mitigations

- **FX-R1 drift** if the schema `style` leaks into the base prompt → mitigated by the
  `baseRecognitionSchema` strip + the explicit Step 1 guard test.
- **baml_client regen churn** → isolated to Step 4; TG3 importer-set guard confirms no new `baml_client`
  surface beyond the bridge.
- **Profiles near-identical (reskin escape hatch)** → DG5 asserts concrete divergent tokens; if it could
  only pass trivially, the review records it and points at T-165-02. Evidence (the pack table) says it
  won't fire.
