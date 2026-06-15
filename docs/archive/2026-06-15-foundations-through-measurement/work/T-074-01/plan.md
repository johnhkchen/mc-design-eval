# T-074-01 — concept-materials-consolidation · Plan

Ordered, independently-verifiable steps. Pure contract first (keeps `npm test` green), then the runner wired
against committed data, then the live sweep, then learnings + handoff. Each step commits atomically.

## Step 1 — Pure assembler + tests (`src/form/concept-materials-ab.mjs` + `.test.mjs`)

- Write `nearToneRestoration`, `paletteGrowth`, `judgeSubject`, `abRow`, `assembleConceptMaterialsAb` +
  `render*Md`. Mirror `e19-cleanup.mjs` (schema const, null-tolerant, pure).
- Write 12–14 unit cases (Structure §test). Cover every `judgeSubject` branch + null tolerance + the md
  containing both tables.
- **Verify:** `npm test` → 742 + new cases, 0 fail. The assembler is fully exercised offline.
- **Commit:** `feat(E-21 T-074-01): pure concept-materials A/B assembler + judge`.
- AC: #2/#4 logic (the durable contract).

## Step 2 — The runner skeleton + `--offline`, wired against committed gatehouse data

- Write `benchmarks/sculpture/concept-materials-ab.mjs`: `SUBJECTS`, the import wiring, `cellFor`,
  `nearTone`/`growth`/`trueByFeature` extraction, `buildConceptGrounded` (reusing the T-072 assign path),
  `buildColorimetric` (sculpture branch = read e19 artifact), `emit`, `verifyOffline`.
- For Step 2 the live build can be a stub that no-ops if artifacts are absent; the **`--offline` path** must
  work against the already-committed `material-assign/gatehouse/artifact.json` (as a stand-in "after") to
  prove the assembler wiring end-to-end with no GL.
- Add `package.json` `"concept:ab"` + `.gitignore` render glob.
- **Verify:** `node benchmarks/sculpture/concept-materials-ab.mjs --offline` re-derives a (partial) report
  without GL/model and writes valid `concept-materials-ab.{md,json}`; `npm test` still 742+.
- **Commit:** `feat(E-21 T-074-01): concept-materials A/B runner skeleton + offline re-verify`.
- AC: #2 (the record path).

## Step 3 — Live headline build: gatehouse + cottage (GL only, no metered)

- Implement `buildColorimetric` (architectural: `segmentMaterials` on the GLB → before artifact + render)
  and `buildConceptGrounded` (map → `classifyFeatures` → `assignFeatureBlocks` → after artifact + render +
  matrix) for the two architectural subjects. Both maps are committed → **no metered call**.
- Render before/after per subject; compute cells; assemble rows.
- **Verify:** `node benchmarks/sculpture/concept-materials-ab.mjs` builds gatehouse + cottage; the gatehouse
  near-tone pair (stone_bricks/cobblestone) is **collapsed in before, restored+separated in after**; renders
  exist; `concept-materials-ab.{md,json}` written; AJV-valid both sides.
- **Commit:** `feat(E-21 T-074-01): live colorimetric→concept-grounded A/B on gatehouse + cottage`.
- AC: #1 (headline), #2, #4 (architectural growth).

## Step 4 — Frames + E-12 handoff visual (AC#3)

- `copyFrames()`: copy gatehouse (and cottage) before/after renders to
  `pr/assets/frames/concept-<subj>-{before,after}.png`.
- Write `pr/assets/concept-materials.md`: the before/after narrative (grey-blob walls → brick-walls-with-
  cobble-corners), the A/B table, the palette-growth story, the honesty ledger; link the frames.
- **Verify:** frames exist; the handoff renders as valid markdown referencing them.
- **Commit:** `docs(E-21 T-074-01): E-12 handoff — concept-materials before/after + frames`.
- AC: #3, #6 (handoff half).

## Step 5 — Sculptures: moai + pineapple (metered map gen, gated)

- `ensureMap`: for moai/pineapple, if `material-map/<subj>.json` absent, generate via the metered
  `material:map` bridge (concept + design-doc), validate, commit `<subj>.{json,raw.json}`. **Gated:** on
  failure, mark the subject `deferred` and continue.
- Build the concept-grounded sculpture "after" (feature-assign over the organic GLB); the "before" is the
  committed `e19-build/<subj>/artifact.json`. Compute cells + judge.
- **Verify:** if maps generate — moai judged `no-distinction` (no near-tone pair; growth flat = bloat
  control), pineapple judged by its body/crown story or `over-reach` (honest, recorded). If a metered call
  fails — the subject is `deferred` in the report, the sweep still completes. `--offline` re-derives all.
- **Commit:** `feat(E-21 T-074-01): sculpture A/B (moai + pineapple) + concept-justified maps` (or
  `…: sculptures deferred — metered map gen unavailable` with the honest record).
- AC: #1 (the 2 sculptures), #4, #5 (over-reach honesty).

## Step 6 — design-learnings.md section (AC#5)

- Append `## Concept-grounded materials (E-21)`: the mean-colour collapse failure (brick/cobble), the
  map (T-071) + feature-assign (T-072) + refine (T-073) fix, the LLM's right to add missing concept materials
  back (justified growth vs full-table bloat), and where it helps (architectural near-tone zoning, the
  gatehouse restoration) vs over-reaches (organic sculptures; near-tone invisibility to a render → why
  geometry, not colour, carries the distinction). Use the real A/B numbers.
- **Verify:** the section reads against the committed `concept-materials-ab.json`.
- **Commit:** `docs(E-21 T-074-01): design-learnings — concept-grounded materials section`.
- AC: #5.

## Step 7 — Final verification

- `npm test` → green (742 + Step-1 cases). `node … --offline` → re-derives the full report from committed
  artifacts, AJV-valid. Confirm every committed artifact validates and the frames + handoff + learnings + the
  npm script are present.
- **Commit:** any cleanup; write `review.md`.

## Testing strategy

- **Unit (`npm test`, CI-safe):** the entire assembler — `nearToneRestoration`, `paletteGrowth`,
  `judgeSubject` (every branch), `abRow` (deltas + null tolerance), `assembleConceptMaterialsAb` (tallies,
  headline, both tables, empty-rows degeneracy). Pure, deterministic, no GL/model.
- **Live (manual, GL + metered):** the runner's build branch — exercised by the committed sweep; re-checkable
  via `--offline` (re-derives the verdict + re-validates artifacts, no GL/model). The metered map-gen branch
  is the project's standard untested edge (matches `material-map.mjs` / `baml-*.mts`).
- **Verification criteria:** AC#1 four subjects (or honest `deferred`) with committed artifacts+renders;
  AC#2/#4 `concept-materials-ab.{md,json}` with near-tone restoration + clean/true + judge + growth; AC#3 the
  gatehouse before/after frames in `pr/assets/`; AC#5 the design-learnings section; AC#6 the handoff +
  `npm test` green.

## Risk register

- **Metered map gen flaky/slow (Step 5).** Mitigation: gated + graceful `deferred` (D5); headline (Steps 3–4)
  needs no metered call, so the core AC ships regardless.
- **Feature classifier ill-fit on organic GLBs (Step 5).** Expected (D2); recorded as `over-reach` — this is
  AC#5 evidence, not a failure. The judge captures it deterministically.
- **Colorimetric architectural build differs from any prior (Step 3).** None exists to drift from; the before
  is defined by `segmentMaterials` on the GLB, deterministic given the GLB+palette.
- **GLB/concept absent on a fresh checkout (gitignored GLBs).** The runner skips a subject with a clear
  message (the predecessor idiom); `--offline` works off committed artifacts.
- **`baml_client/` not generated.** `npm run baml:gen` before Step 5's metered branch (documented).
