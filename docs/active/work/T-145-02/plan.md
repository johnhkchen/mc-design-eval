# T-145-02 Plan — ordered, verifiable steps

Each step is committable. Deterministic core (steps 1–7) first; environment-dependent producer (8–9)
last. Verification after every step; `npm test` is the global gate.

## Step 1 — Schema: optional `band` enum
- Add `band: {enum:["ground","upper","all"]}` to `facade.faces.items.properties` (structure §1).
- **Verify:** `npm test` green (schema still loads; additive). Existing fixture/programs unaffected
  (no band present).
- **Commit:** `feat(T-145-02): facade face carries an optional storey band (schema)`

## Step 2 — `bandYRange` helper + check-9 rule
- Add exported `bandYRange(m, band)` to `program.mjs` (ground/upper/all → {yLo,yHi}, null if no band).
- Add check-9 rule: `band:"upper"` needs `storeys ≥ 2`.
- **Unit tests** (`program.test.mjs`): mapping for 2×4 (upper→[4,7], all→[0,7], ground→[0,3]) and 3×3
  (all→[0,8]); `upper` on 1-storey mass → validation error; enum garbage rejected by schema.
- **Verify:** `npm test` green.
- **Commit:** `feat(T-145-02): bandYRange + band/storey validation`

## Step 3 — Compiler threads band as pure data
- Import `bandYRange`; in `facadeArticulationPlan` compute per-face band, add `band:{yLo,yHi}` to
  pilaster / infill-panel / quoin params when present (structure §4).
- **Unit tests** (`compile.test.mjs`): a band-bearing face → params carry `{yLo,yHi}`; a bandless face →
  byte-identical legacy params (snapshot/deep-equal guard for AC#4).
- **Verify:** `npm test` green; existing `facade-build.test.mjs` determinism test still passes.
- **Commit:** `feat(T-145-02): compiler threads the storey band into the brush plan`

## Step 4 — Brushes honor `band`
- Add `band` param + module-private `bandZone({yLo,yHi})` to `pilaster`/`infillPanel`/`quoin`
  (structure §5). Explicit `zoneOf` still wins; band derives `{zoneOf,zone}` when no explicit zone.
- **Unit tests** (`facade-articulation.test.mjs`): band-constrained brush emits **zero** placements with
  `pos[1]` outside `[yLo,yHi]`; bandless behavior unchanged; the no-regress (in-plane) property holds.
- **Verify:** `npm test` green.
- **Commit:** `feat(T-145-02): facade brushes restrict relief to the recognized storey band`

## Step 5 — End-to-end band integration test
- A test that takes a small program with a `band:"upper"` face → `compileProgram` → `applyArticulation`
  over a realized occupancy → assert all member placements sit in the upper y-band (the spike's
  "no plinth cover, no roof punch" property, structurally proven).
- **Verify:** `npm test` green.
- **Commit:** `test(T-145-02): end-to-end storey-band relief containment`

## Step 6 — Prompt clause + regen fixture prompt
- Append the band clause to `facadeDigest` (structure §3).
- Regenerate `fixtures/facade/prompt.txt` via the production fn (a tiny node one-liner that writes
  `facadeDigest(base,pack)+"\n"`), never by hand.
- Add an assertion to `facade-grammar.test.mjs` that the digest mentions the band vocabulary; confirm the
  prompt-pin (`facadeDigest+"\n"===prompt.txt`) still holds.
- **Verify:** `npm test` green (the regen makes the pin pass).
- **Commit:** `feat(T-145-02): recognition prompt teaches the storey band; regen fixture prompt`

## Step 7 — Fix the stray hand-authored barn grammar
- `relief/barn-grammar.json`: `memberRole → wall.dressing`, add `fields.role: wall.field.ground`,
  `band:"all"` on both faces. (Repo hygiene; off the compile path.)
- **Verify:** if any test reads it, green; otherwise a structural sanity check (valid against schema via
  a quick node assert).
- **Commit:** `fix(T-145-02): barn relief grammar — stone-pier roles + storey band (de-mis-roll)`

## Step 8 — Live recognition records (env-permitting: shim + GL)
- Probe the shim with a minimal `claude -p` call ([[spend-limit-reply-failure-mode]]) and GL via
  `assertGlAvailable` before spending.
- Run `facade-grammar.mjs --subject cottage --ticket T-145-02` and `--subject barn --ticket T-145-02`.
- Confirm the emitted grammar is storey-aware (cottage upper/timber, barn all/stone-pier) and
  diegetic-clean; commit the records.
- `--offline` replays byte-identically.
- **If the shim or GL is unavailable in-session:** do NOT fake a run. Hand-author the storey-aware
  cottage + barn grammars (correct roles + band) as offline-replay fixtures so the *shape* is proven and
  the live run is a one-command CI/human follow-up. Document in `progress.md`.
- **Commit (if run):** `feat(T-145-02): live storey-aware facade grammar — cottage + barn`

## Step 9 — Render proof (env-permitting: GL)
- `renderBesideConcept` over the articulated cottage (clean workshop build) → `pr/assets/frames/`.
- Barn proof rides S-159's watertight seed; until then best-effort (note the dependency).
- **If GL unavailable:** document; the spike already produced before/after cottage renders as evidence
  reference.
- **Commit (if rendered):** `docs(T-145-02): render proof — cottage half-timber (barn pending S-159)`

## Testing strategy summary

- **Unit (deterministic, always run):** `bandYRange` mapping + validation (step 2); compiler param
  threading + byte-identity guard (step 3); brush band containment (step 4); end-to-end containment
  (step 5); prompt pin + band mention (step 6).
- **Integration / producer (env-dependent):** live recognition byte-identical offline replay (step 8);
  render proof PNG (step 9).
- **Global gate:** `npm test` green after every deterministic step; the byte-identity guards are the
  AC#4 insurance.

## Risk register

- **Live shim/GL unavailable** → core still lands; producer steps deferred with honest docs (D7).
- **`facadeDigest` regen drift** beyond the fixture (other prompt-sha pins) → grep for `promptSha256`
  pins after step 6; only the facade fixture + (when run) the cottage/barn live prompts should move.
- **quoin band composition** subtlety (two predicates) → covered by the step-4 containment test on quoin
  specifically.
- **Barn watertightness** (S-159) is a sibling dependency for a *clean* barn render, not for the grammar
  itself — the grammar + cottage proof stand alone.
