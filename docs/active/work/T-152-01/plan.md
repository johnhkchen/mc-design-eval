# T-152-01 — Plan: render-every-loop

Ordered, independently-verifiable steps. Each commits atomically. No judge run anywhere; `npm test`
green at every commit boundary.

## Step 1 — Pure core + unit tests (`src/view/render-beside.mjs` + `.test.mjs`)

- Write `src/view/render-beside.mjs`:
  - `GlUnavailableError` (named, remedy in message, `cause`).
  - `assertGlAvailable(flags = { GL_AVAILABLE, GL_LOAD_ERROR })`.
  - `composeBesideConcept({ conceptPanel, renderPanels, gutter })` — pure, prepends concept.
  - `renderBesideConcept(artifact, conceptPath, outPath, { label, gutter, renderSeam, glFlags,
    panel })` — assert (using `glFlags`) → seam (default lazy `renderViews`) → decode+resample →
    compose → encode → write; returns `{ outPath, panels, conceptPath }`.
- Write `src/view/render-beside.test.mjs` (5 cases from Structure):
  1. assert throws `GlUnavailableError` on `{GL_AVAILABLE:false}` w/ remedy + cause text;
  2. assert returns true on `{GL_AVAILABLE:true}`;
  3. `composeBesideConcept` → width `5P+4g`, concept leftmost;
  4. mismatched dims throws;
  5. `renderBesideConcept` with fake seam + `glFlags:{GL_AVAILABLE:true}` writes a sheet, touches no
     GPU (use tmp PNGs via `encodeRgbaToPng`).
- **Verify:** `npm test` green (new tests included; nothing else perturbed).
- **Commit:** `feat(T-152-01): render-beside-concept pure core + GL-assert (judge-free)`.

## Step 2 — package.json script

- Add `"render:beside": "node benchmarks/sculpture/render-beside.mjs"`.
- **Verify:** `node -e "require('./package.json').scripts['render:beside']"` non-empty;
  `npm test` still green (no code path changed).
- Fold into Step 3's commit (a script alone is inert until the runner exists).

## Step 3 — CLI runner (`benchmarks/sculpture/render-beside.mjs`)

- Implement per Structure: `--subject`/`--out`, resolve `SUBJECTS` build + concept, `assertGlAvailable()`,
  `renderBesideConcept`, log path + honest note. Read the committed artifact
  (`generated/<key>/artifact.json` if present, else `def.build`).
- **Verify:** `node --check benchmarks/sculpture/render-beside.mjs`;
  `node benchmarks/sculpture/render-beside.mjs` with no `--subject` exits with a clear usage error.
- **Commit:** `feat(T-152-01): render:beside CLI — judge-free textured render beside concept`.

## Step 4 — The barn proof (AC4)

- Run `npm run render:beside -- --subject barn` (GL live in this env).
- Inspect the output `pr/assets/frames/beside-concept-barn.png` with the Read tool (it is an image):
  confirm 5 columns (concept + 4 azimuths), the stone gable end + overhanging roof read (T-150-01),
  and note honestly what still reads wrong.
- **Verify:** file exists, non-trivial size, visually correct columns.
- **Commit:** `feat(T-152-01): barn proof — render beside concept (T-150-01 gable/overhang live)`
  including the committed PNG. Commit message carries the honest caption.

## Step 5 — Auto-wire the judge-free chain paths

- `generated-milestone.mjs`: import the two helpers; in `--skip-gate` branch call `assertGlAvailable()`
  + `renderBesideConcept(r1.styled, def.concept, FRAMES/beside-concept-<key>.png, {label})` before
  the early return; log. Replace the gated `try/catch` swallow so GL failure throws the named error
  (keep sheet recording on success).
- `challenge-milestone.mjs`: `assertGlAvailable()` at the top of the render block.
- **Verify:** `node --check` both files; `npm test` green. Do **not** run a full live chain on a
  pinned subject (would hit the pin-guard / spend) — the wire is verified by syntax + the Step-4
  proof that `renderBesideConcept` works end-to-end. Note the pin-guard interaction in `progress.md`.
- **Commit:** `feat(T-152-01): auto render-beside-concept on judge-free chain paths; GL fails loud`.

## Step 6 — Review + memory

- Write `review.md` (changes, coverage, open concerns: the skip-gate↔pin-guard ordering deferred to
  S-151).
- If a durable lesson emerged (the nested-`render/` GL false-negative), record one memory file +
  MEMORY.md pointer.
- **Commit:** `docs(T-152-01): review + render-every-loop learnings`.

## Testing strategy summary

- **Unit (`npm test`, GL-free):** `assertGlAvailable` both branches; `composeBesideConcept`
  geometry + validation; `renderBesideConcept` via fake seam. All in `src/view/render-beside.test.mjs`.
- **Live (manual, GL-gated):** Step 4 barn render — the real proof. Skipped automatically anywhere
  GL is absent (the assert throws loudly — which is the *intended* behavior, AC2).
- **No judge, no billed run, no chain on pinned subjects.** Renders reuse `renderViews`; nothing
  spawns the gate.

## Verification checklist (maps to ACs)

- [ ] AC1 — judge-free textured render beside concept emitted automatically on a creation run
  (`--skip-gate` wire + `render:beside` CLI), written to `pr/assets/`.
- [ ] AC2 — `assertGlAvailable` throws a named `GlUnavailableError` with remedy at the top of every
  render-bearing run; swallows replaced.
- [ ] AC3 — root cause recorded (nested-`render/` `gl`; root probe = false negative; authoritative
  probe = render module's `GL_AVAILABLE`); fix = single consultation point.
- [ ] AC4 — `pr/assets/frames/beside-concept-barn.png` committed, T-150-01 fix visible, honest caption.
- [ ] AC5 — no judge anywhere; `npm test` green; no new ceremony.
</content>
