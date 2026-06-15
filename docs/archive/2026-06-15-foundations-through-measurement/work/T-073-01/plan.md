# T-073-01 — concept-refine-pass · Plan

Ordered, atomically-committable steps. Steps 1–4 are pure and `npm test`-verifiable with NO GL and NO
metered call. Steps 5–6 are the live wiring + the gatehouse proof (GL + `claude -p`, run on demand). The
testing strategy is the project idiom: pure cores unit-tested in the suite; the metered `.mts` bridge +
the runner's live branch exercised only by the committed run + `--offline` re-verify.

## Step 1 — palette policy (pure foundation)
**Create** `src/form/material-policy.mjs`: `POLICY_SCHEMA`, `allowedPalette`, `gateAddition`,
`classifySwap`, `applyCorrection`. Imports only `material-map.mjs` (`normalizeBlock`, `isKnownBlock`) and
`form-edit.mjs` (`applyFormEdit`) — all pure, no GL/SDK.
**Create** `src/form/material-policy.test.mjs` (Step 2's tests; co-developed).
**Verify:** `node --test src/form/material-policy.test.mjs` green.
**Commit:** `feat(E-21 T-073-01): material palette policy + concept-justified additions (pure)`.

## Step 2 — palette-policy tests
Cases (CI-safe): `allowedPalette` union/normalize/dedup; `gateAddition` accept (real+distinct+justified),
reject (unknown / already-present / no conceptMaterial / no where), and the AC#2 **near-tone accept**
(cobblestone with stone_bricks already present → ok, because distinct block id = distinct role);
`classifySwap` three branches; `applyCorrection` in-palette/needs-addition/off-palette + geometry-
immutability (positions byte-identical) + additions log. (Committed with Step 1.)

## Step 3 — material accept metric (pure kernel + GL seam)
**Create** `src/form/material-target.mjs`: `colorAgreement` (pure kernel), `regionColorClusters`,
`conceptMaterialTarget`, `resolveMaterialTarget`, `liveMaterialScore`. Color math reuses
`cielab`/`palette-extract` — no new formulas. `_decode` injectable so the adapter is tested without a PNG.
**Create** `src/form/material-target.test.mjs`: `colorAgreement` identity→1 / far→~0 / coverage weight /
ΔEmax clamp; `regionColorClusters` on a synthetic RGBA; `conceptMaterialTarget.scoreRender` via `_decode`
stubs; `resolveMaterialTarget` pass-through + throw. Assert NO top-level GL import (static scan, the
loop.test.mjs idiom) so the suite loads no render stack.
**Verify:** `node --test src/form/material-target.test.mjs` green.
**Commit:** `feat(E-21 T-073-01): deterministic concept material-agreement metric`.

## Step 4 — the material editor (analogue of form-edit)
**Create** `src/revise/material-edit.mjs`: `MATERIAL_EDIT_ROUTE`, `makeMaterialEditor`,
`defaultProposeCorrection` (lazy live leaf). Reuses `applyRegionEdit` (lock) + `assertArtifact` (AJV) +
`applyCorrection` (policy). The async-propose/sync-replay stash crux copied from `makeFormEditor`.
**Create** `src/revise/material-edit.test.mjs`: injected `propose` (no model) → swaps stashed → `tweakFor`
replays; out-of-policy swap → unstashed identity no-op; additions surfaced; AJV-revalidation path; no
top-level SDK/GL import.
**Verify:** `node --test src/revise/material-edit.test.mjs` green; then full `npm test` green.
**Commit:** `feat(E-21 T-073-01): swap-only material editor behind the E-15 accept-gate`.

## Step 5 — the proposer transport (BAML + bridge)
**Create** `baml_src/materialcorrect.baml` (`CorrectRegion`, two images, recolor-only prompt) and
**create** `src/revise/baml-material-correct.mts` (clone of `baml-revise.mts`, two images, parses
`CorrectRegion`). Run `npm run baml:gen` (regenerates the gitignored `baml_client/`) so the bridge
imports resolve.
**Verify:** `npm run baml:gen` succeeds; `npx tsx --check`-style import of the bridge resolves (the
metered call itself is exercised in Step 6, not here). `npm test` still green (no new pure surface).
**Commit:** `feat(E-21 T-073-01): CorrectRegion BAML fn + live material-correct bridge`.

## Step 6 — the runner + the gatehouse proof
**Create** `benchmarks/sculpture/material-correct.mjs` (live + `--offline`). **Edit** `package.json`
(`material:correct` script) and `.gitignore` (render PNGs).
- **Offline-first dev:** seed a deterministic fake-propose path so `--offline` and the wiring are
  exercised with no model (the `material-assign.mjs --offline` idiom), then run live.
- **Live:** `node benchmarks/sculpture/material-correct.mjs` — needs the gatehouse GLB-derived artifact
  (committed by T-072), `concept.png` (run-local), GL, and `claude -p`. Records corrections kept/
  rolled-back, the additions log, whole-object material agreement before→after, P14 report, verdict.
  Writes `material-correct/gatehouse.json` + `gatehouse/artifact.json` + `.md`.
- If `concept.png` or the GLB artifact is absent → skip (not an error), the runner idiom.
**Verify:** `node …/material-correct.mjs --offline` re-derives the verdict from committed numbers and
re-validates the corrected artifact (AJV) with no GL; `npm test` green.
**Commit:** `feat(E-21 T-073-01): gatehouse concept material-correction run + offline re-verify` (and a
follow-up `docs` commit if the live JSON/MD lands separately).

## Testing strategy (what is covered where)
- **Unit (`npm test`, CI-safe):** the palette policy (Step 2), the agreement metric kernel + adapter
  (Step 3), the editor's stash/replay/policy/AJV contract with an injected proposer (Step 4). The pure
  core — every accept/reject branch, the geometry-immutability invariant, the additions log — is fully
  exercised offline.
- **Live (manual, GL + metered):** the gatehouse run proves AC#1 (a real render→concept→correct→accept/
  rollback cycle) and AC#5 (agreement before/after). Re-checkable by `--offline`.
- **Coverage gaps (by design):** `baml-material-correct.mts` and the runner's live branch are NOT
  unit-tested — they pull `claude -p` + a render, which the suite must never depend on (matches
  `baml-revise.mts` / `material-assign.mjs`).

## AC traceability
- **AC#1** (render→LLM sees render+concept→bounded recolor-only→lock→accept-if-closer→roll back→bounded
  rounds→lock) — Steps 3 (metric/gate), 4 (recolor-only editor + lock + AJV), 6 (the live cycle); the
  loop's structural termination + `locked` give bounded rounds + P14.
- **AC#2** (right to ADD a missing concept material, gated by justification, distinct role, logged; not a
  cap, not full-table snap) — Step 1 `gateAddition` + the additions log; Step 2 the near-tone-accept test.
- **AC#3** (palette = doc manifest ∪ ≤2 secondary ∪ additions; off-palette vs this augmented set) — Step 1
  `allowedPalette`/`classifySwap`; Step 6 feeds mapPalette + secondary from the real inputs.
- **AC#4** (reuses the E-15 loop, not a new loop) — Step 6 wires the UNCHANGED `reviseLoop` (loop.mjs
  untouched), the E-16 seam proof.
- **AC#5** (gatehouse: corrections kept/rolled-back + agreement before/after, improves or honestly holds)
  — Step 6 record + verdict.
- **AC#6** (pure logic unit-tested; live call metered/GL; `npm test` green) — Steps 2/3/4 + the green
  suite; live exercised by Step 6 only.

## Risks & mitigations
- **Metric too weak on near-tone** → the gate may `held` rather than `improved`. Acceptable per AC#5
  ("improves or honestly holds"); documented in the honesty ledger; the proposer still records the
  semantic corrections it WOULD make even when the gate rolls back (observability via `proposals`).
- **Concept/render scale mismatch** (the build render vs a stylized concept) → use cluster-level
  agreement (robust to exact pixel layout), not per-pixel; whole-object for the verdict.
- **baml_client regen** → documented (Step 5), the existing convention for every BAML fn.
