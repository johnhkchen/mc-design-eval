# T-147-01 Plan — ordered, atomically-committable steps

Five commits, each green (`npm test`) on its own. Verification criteria per step. Byte-identity is
re-checked from Step 3 on (the first step that touches the program path).

## Step 1 — The four brushes + tests  (commit: `feat(T-147-01): articulation brushes — pilaster/quoin/infill-panel/eave-overhang on the relief op`)

**Do:**
- Create `src/view/facade-articulation.mjs` with `pilaster`, `quoin`, `infillPanel`, `eaveOverhang`,
  `applyArticulation`, `ARTICULATION_DEFAULTS`, `FACADE_ARTICULATION_SCHEMA`. Each brush delegates to
  `surfaceRelief`; fail-loud validation; pure.
- Create `src/view/facade-articulation.test.mjs` (FA1–FA9, structure §S1).

**Verify:** `node --test src/view/facade-articulation.test.mjs` green; each brush's `reliefNoRegress`
asserts `inPlanePreserved && ratiosPreserved`; idempotence (2nd run ∅); placements byte-stable across
two calls. No registry coupling yet (applier imports `getBrush` but is unexercised until Step 2).

**Unit tests:** all brush behavior (placement, rhythm, idempotence, silhouette no-regress).

## Step 2 — Register through the door + conformance + count  (commit: `feat(T-147-01): register 4 articulation passes; brush door + count 24→28`)

**Do:**
- `idiom-registry.mjs`: import the four fns; add four `kind:"pass"` entries (`pilaster`, `quoin`,
  `infill-panel`, `eave-overhang`) mirroring `surface.relief` — `composition`, `tests`, `preview`
  (shell substrate + `realize` via `overlayCells`), closed `paramsSchema`.
- `brush-door.conformance.test.mjs`: `TECHNIQUES += "facade-articulation"`;
  `ALLOWED["src/view/facade-articulation.mjs"] = {modules:["surface-relief"], reason}`.
- `brush-contract.test.mjs`: 24 → 28 (title + assertion).
- `idiom-registry.test.mjs`: extend the pass test to cover the four new names.

**Verify:** `npm test` green. Specifically: `brush-door.conformance.test.mjs` (no violations, allowlist
real), `brush-contract.test.mjs` (28 brushes clean), `brush-catalog.test.mjs` (every brush plotted —
the four pass previews realize ≥1 cell), `idiom-registry.test.mjs`. Confirm `npm run brush:catalog`
self-asserts and the count line reads 28.

**Integration:** the catalog realizes each new pass preview end-to-end (substrate → `surfaceRelief`).

## Step 3 — Compile the articulation plan + jetty refine  (commit: `feat(T-147-01): compile facade grammar → articulation plan; jetty depth from grammar`)

**Do:**
- `compile.mjs`: add `facadeArticulationPlan(m, pack, rect)` (roles via `roleBlock`); accumulate
  `articulation`; refine jetty `spec.overhang` from `face.jettyDepth`; return `{workshopProgram,
  articulation}`.
- `compile.test.mjs`: no-facade → `articulation:[]` AND `workshopProgram` deep-equals the pre-edit
  snapshot for a committed program (byte-identity guard); facade program → expected plan (brush names,
  resolved blocks, jetty overhang).

**Verify:** `npm test` green. **Byte-identity gate (first checkpoint):**
`npm run patternbook:offline` and `npm run recognize:offline` byte-identical (committed programs have
no facade → `articulation:[]` → `workshopProgram` unchanged). `npm run facade:offline` unchanged.

**Unit tests:** plan mapping + role resolution + jetty refinement + the no-facade invariance.

## Step 4 — Integration fixture: the grammar builds  (commit: `test(T-147-01): facade program builds end-to-end — constructs + articulation, no-regress`)

**Do:**
- Create `src/recognition/fixtures/facade/articulated-program.json` (rustic vocab; mass with `jetty`,
  `roof.dormers`, `facade`).
- Create `src/recognition/facade-build.test.mjs`: program validates; `compileProgram` →
  `realizeProgram` → dormer+jetty cells; `applyArticulation` → proud articulation cells; jetty
  `overhang == jettyDepth`; `reliefNoRegress` holds for the articulation placements.

**Verify:** `node --test src/recognition/facade-build.test.mjs` green; `npm test` green. This is the
AC#2 evidence ("the recognised grammar actually builds").

**Integration:** the whole program path (compile→realize→articulate) on a facade-bearing program.

## Step 5 — Live program-path hook (guarded)  (commit: `feat(T-147-01): pattern-book applies the articulation plan (no-op when absent)`)

**Do:**
- `pattern-book.mjs`: capture `articulation`; after `realizeProgram`, if non-empty, overlay
  `applyArticulation(artifactOccupancy(artifact), articulation)` before the grammar stage. Guarded.
  Comment-clean of subject keys (self-grep). Reach brushes only via `applyArticulation` (door).

**Verify:** `npm test` green; `npm run patternbook:repro` + `patternbook:offline` byte-identical;
`npm run recognize:offline`, `facade:offline` unchanged; spot-check a `styled:*` offline if present.

**Fallback (documented in review):** if Step 5 perturbs any pin or trips `generalizationGrep`, revert
the `pattern-book.mjs` edit; Step 4 stands as the AC#2 proof and the live hook is recorded as a named
S-148-adjacent follow-on. The pure plan+applier are the durable deliverable either way.

## Testing strategy (rollup)

- **Unit:** `facade-articulation.test.mjs` (brush mechanics + no-regress), `compile.test.mjs`
  additions (plan + invariance), registry/contract/conformance assertions.
- **Integration:** `facade-build.test.mjs` (end-to-end build), `brush-catalog` (preview realization).
- **Byte-identity (the AC#4 gate):** `patternbook:offline`/`repro`, `recognize:offline`,
  `facade:offline` after Steps 3 and 5.
- **Acceptance mapping:** AC#1 → Steps 1+2; AC#2 → Steps 3+4(+5); AC#3 → `roleBlock` resolution
  (Step 3) + conformance sweep (Step 2); AC#4 → tests green + byte-identity gates.

## Risks & mitigations

- **Pinned chain (`pattern-book`)** — isolate the risk to Step 5; guard hard on empty plan; fallback
  ready.
- **FX-R1-style prompt-sha drift** — we touch no prompt/schema text; additive compile field only.
  Re-run `facade:offline`/`recognize:offline` to confirm.
- **quoin corner detection** — keep it a pure read of the skin's along-axis extrema; unit-test both
  axes and both faces.
- **Brush count drift** — Step 2 updates the single assertion; `brush-catalog` count line is computed,
  not hard-coded.
