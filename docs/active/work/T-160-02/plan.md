# T-160-02 Plan — ordered, verifiable steps

*Grounded in structure.md. Each step is independently verifiable; commit at the marked points.*

## Step 1 — `src/view/wall-skin.mjs` (the pure brush)

Write `packTreatments`, `wallSkinPlan`, `wallSkin`, helpers (`isBoardFamily`, `overlay`).
- `packTreatments(pack)`: walk `pack.palette`; map `door.main`→door, `window.shutter`→shutter,
  `window.infill`|`window.glazing`→infill, `opening.lintel`→frame (also `walls.dressing` as a frame
  fallback at call site); each slot present only if its role resolves. Returns `{slots}`.
- `wallSkinPlan(program, pack, {floor, eaveY})`: resolve ground/upper/dressing/plinth blocks via
  `roleBlock`; storeyLine = `floor + mass.storeyHeight`; emit the 5 plan entries per design.md §recipe,
  each gated by role-presence / board-family / two-material. zoneOf closures inline.
- `wallSkin(occ, {program, pack, floor, eaveY})`: guard (no program|pack ⇒ occ); plan → `applyArticulation`
  → `overlay` → `extractApertures` → `dressOpenings` → `overlay`. Return occ.

**Verify:** `node -e` smoke — build a small shell occ, call `wallSkinPlan` with a saltcrag-like and a
rustic-like program, assert the brush list + resolved blocks; call `wallSkin`, assert it returns an occ
with >1 distinct wall block and the roof band untouched.

## Step 2 — `src/view/wall-skin.test.mjs` (WS unit tests)

| Test | Asserts |
|---|---|
| **WS1** plan: two-material | ground≠upper roles ⇒ a `surface.fill` entry with both `dominant`s resolved. |
| **WS2** plan: one-material | ground==upper ⇒ NO `surface.fill` (no needless recolor). |
| **WS3** plan: quoin | dressing role ⇒ a `quoin` entry, all four faces, material = dressing block. |
| **WS4** plan: clinker gate | board-family upper ⇒ `surface.clinker`; stone upper ⇒ none. |
| **WS5** plan: limewash gate | pack with `wall.finish.limewash` ⇒ `surface.limewash`; pack without ⇒ none. |
| **WS6** plan: plinth | `mass.plinth` ⇒ a `surface.relief` base-row entry; no plinth ⇒ none. |
| **WS7** treatments | `packTreatments(saltcrag)` fills door/shutter/infill/frame slots from roles. |
| **WS8** wallSkin no-op | `wallSkin(occ, {program:null})` and `{pack:null}` return occ unchanged (gatehouse). |
| **WS9** wallSkin determinism | two runs byte-identical placements; idempotent (skin∘skin ≈ skin's blocks). |
| **WS10** wallSkin roof untouched | cells with `y>eaveY` identical before/after. |
| **WS11** wallSkin not-drowned | resulting wall band has ≥2 distinct blocks AND no single block >80% (anti-flood). |

**Verify:** `npm run test:unit` green (new file included by the glob).

**→ COMMIT 1:** `feat(T-160-02): pure wall-skin brush (roles→relief) + WS unit tests`

## Step 3 — wire into `autonomy-loop.mjs`

- import `wallSkin`; add `loadPack(program)`.
- `SUBJECTS`: drop `wallField`; add `barn--saltcrag` witness entry.
- `construct_walls(occ)`: `constructWalls` (envelope) → `wallSkin` (skin); derive `groundFill` from the
  pack ground role; pass `program`+`pack`.
- `MENU` text updated; default queue gains `barn--saltcrag`.

**Verify:** `npm test` full suite green (no regressions from the loop edit — the loop isn't in CI but the
import must resolve and the brush is pure; run `node --check` on the loop + a `node -e` dry call of
`construct_walls` on a tiny occ with a stub program/pack).

**→ COMMIT 2:** `feat(T-160-02): construct_walls applies the construction skin; drop hardcoded wallField`

## Step 4 — run the volume batch (measurement leg)

- Confirm GL available (`render/src` probe — the `gl-probe-nested-render-project` lesson; GL was confirmed
  present this session).
- Run `node experiments/eval-alignment/autonomy-loop.mjs` (queue: cottage, barn, gatehouse, barn--saltcrag)
  in the background; capture `batch.log`.
- This is LLM+GL and slow (minutes/subject). Poll to completion.

**Verify:** `results/volume-ledger.json` + `results/autonomy-*.json` written; per-subject trajectory
captured.

## Step 5 — render each final build beside its concept (judge-free witness)

- Reuse `experiments/eval-alignment/walls-beside.mjs` (T-160-01's trajectory-replay → beside-concept) or
  `src/view/render-beside.mjs`; produce `docs/active/work/T-160-02/<subject>-skin-beside.png` for all four.
- **Eye-read each** (the ticket's real judge): does the wall read as **construction** (quoins / courses /
  dressed openings / per-storey material visible), or still a recolor? Especially the **saltcrag barn
  witness** (rich vocabulary) and the **cottage** (the regressed subject).

**Verify:** four PNGs on disk; an honest written read of each.

**→ COMMIT 3:** `docs(T-160-02): volume batch + beside renders + honest skin report`

## Step 6 — Review

Write `review.md`: verdict on the falsifiable claim (did the wall read as construction? did the eval move?
which of (a)/(b)/(c) landed?); files changed; test coverage + gaps; localize any remaining gap to skin vs
eval-blindness (→ S-161); open concerns. The render is the evidence.

## Testing strategy summary

- **Pure unit (CI):** WS1–WS11 in `wall-skin.test.mjs` — plan derivation per role-set, brush determinism /
  idempotence / roof-untouched / not-drowned / no-program no-op.
- **Integration (not CI, evidenced by artifacts):** the volume batch (GL+LLM) → ledger + beside renders.
- **Verification criteria:** `npm test` green; no per-building constants in the brush; `defect-eval.mjs`
  untouched; renders produced and read honestly; per-subject climb recorded with the render as the judge.

## Risks / contingencies

- **GL unavailable** → land Steps 1–3 (the wirable, testable deliverable) + smoke-only evidence; record
  the batch as deferred with the reason (the T-160-01 contingency precedent).
- **dressOpenings finds no apertures** (envelope holes too small) → report; the relief skin still applies
  (quoins/clinker/fill) — dressing is one component, not the whole skin.
- **Witness re-skin double-counts** (workshop barn--saltcrag already has 140 quoins) → `quoin` is
  idempotent (proud-ray stops at first occupied; relief never re-emitted), so re-skin overlays cleanly;
  note it in the report.
- **eval flat / blind to relief** → that is finding (a); route to S-161; the render is the verdict.
