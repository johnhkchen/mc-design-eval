# T-047-01 — plan: ordered, verifiable steps

Five steps, each committable atomically. Testing strategy: the interface is unit-tested **pure** (in
`npm test`); the loop wiring is covered by the unchanged GL-gated live tests; the demo/docs are verified by
regenerating committed artifacts offline (no model, no GL) and eyeballing the numbers against the baseline.

---

## Step 1 — the form-target interface (`src/form/form-target.mjs` + test)

**Do:**
- Write `src/form/form-target.mjs`: `FORM_TARGET_SCHEMA`, `FormTargetNotImplementedError`,
  `conceptFormTarget`, `glbFormTarget` (throws, with the documented GLB-adapter doc block),
  `resolveFormTarget`.
- Write `src/form/form-target.test.mjs`: groups A–E (concept delegation w/ injected `_fidelity`,
  GLB throw + message, resolve default/pass-through/throw, swap-invariance, schema tag).

**Verify:** `node --test src/form/form-target.test.mjs` green. No GL, no model, no PNG decode (all via
injected `_fidelity`).

**Commit:** `feat(E-15 T-047-01): form-target interface — concept impl + documented GLB adapter point`

---

## Step 2 — wire `liveFormScore` to the interface (`src/revise/loop.mjs`)

**Do:**
- In `liveFormScore`'s returned closure, lazy-import `resolveFormTarget`; build `target = resolveFormTarget(cfg)`;
  replace the `formFidelityFromPair(...) ; return cfg.region ? regionIoU : iou` tail with
  `return target.scoreRender(outPath, R)`. Drop the now-redundant `cfg.conceptPath` throw (moved into
  `resolveFormTarget`).
- Update the `@param cfg` JSDoc (+ `formTarget?` and the GLB-swap note).

**Verify:**
- `npm test` green (pure loop tests inject `score`; the no-top-level-GL scan, loop.test group LE, still
  passes — `form-target.mjs` is lazy-imported and GL-free).
- Where GL is up: `node --test render/test/revise-loop.live.test.mjs` and `render/test/form-edit.live.test.mjs`
  still pass (they pass `conceptPath` → resolved to a concept target). If GL is unavailable they self-skip;
  record that in progress.md.

**Commit:** `feat(E-15 T-047-01): reviseLoop accept consults the form-target seam (concept default)`

---

## Step 3 — demo consults the interface + categorical verdict (`form-revise-ab.mjs` + regenerate committed)

**Do:**
- `form-revise-ab.mjs`: import `conceptFormTarget`; change `score` to
  `liveFormScore({ formTarget: conceptFormTarget({ conceptPath }) })`.
- Add pure exports `formVerdictOf(baseline, after, accepted, eps)` + `VERDICT_GLOSS`; read
  `form-baseline.json`; attach `e13Baseline` + `verdict` per subject; add the verdict column + gloss to the
  md.
- Add an `--offline` branch to `main()`: load committed `form-revise-ab.json`, recompute `e13Baseline` +
  `verdict`, rewrite `.json` + `.md` — no GL, no model.
- Run `node benchmarks/sculpture/form-revise-ab.mjs --offline` to regenerate the committed `.json/.md`
  (preserving the measured IoUs; koi/heart → `held`).

**Verify:** `git diff` shows only `e13Baseline`/`verdict`/verdict-column added; the measured IoU numbers are
byte-identical. Verdicts read `held` for both (no regression slipped through).

**Commit:** `feat(E-15 T-047-01): form-revise demo consults the target seam + E-13-baseline verdict`

---

## Step 4 — the E-12 handoff (`pr/assets/`)

**Do:**
- Copy `benchmarks/sculpture/form-revise-ab/{koi,heart}/{before,proposed}.png` →
  `pr/assets/frames/form-{koi,heart}-{before,proposed}.png`.
- Write `pr/assets/form-revise.md` mirroring `value-true.md`: number table (E-13 IoU → after, verdict), the
  hero pair (before → proposed = *what the cage refused*), honest caveat block (whole-object signal,
  single-view ceiling, the GLB lever), a "Suggested E-12 beat."

**Verify:** frames exist; links in `form-revise.md` resolve; the table numbers match `form-revise-ab.json`.

**Commit:** `docs(E-15 T-047-01): E-12 handoff — form-revise before/after beat in pr/assets`

---

## Step 5 — the learnings section (`docs/knowledge/design-learnings.md`)

**Do:** Append `## E-15 surgical form revision …` after §E-14: intro, before/after IoU table, "The honest
read (the headline)", "Honest notes — where surgical revision *didn't* help, and what it cost", one-sentence
summary. Numbers from `form-revise-ab.json` + `form-baseline.json`.

**Verify:** numbers match the committed json; the section names the residual (both held) and the GLB lever;
honesty matches the E-14 template.

**Commit:** `docs(E-15 T-047-01): design-learnings E-15 form-revision section (honest before/after)`

---

## Testing strategy summary

| Surface | How verified | In `npm test`? |
|---|---|:--:|
| `form-target.mjs` interface | `form-target.test.mjs` (pure, injected `_fidelity`) | ✅ |
| `liveFormScore` wiring | existing GL-gated live tests (`conceptPath` path) | ❌ (GL-gated) |
| demo verdict logic | `--offline` regen + `git diff` (numbers preserved) | ❌ (on-demand) |
| docs / handoff | numbers cross-checked vs committed json | n/a |

## Risks / mitigations

- **GL unavailable for live tests** → they self-skip (already designed so); the pure interface test + the
  offline regen carry the verification. Record the skip in progress.md.
- **Accidentally changing a loop seam signature** → mitigated structurally: the only loop edit is inside
  `liveFormScore`'s closure tail; `reviseLoop` and the accept gate are not touched. `npm test` (loop.test)
  guards it.
- **Dishonest spin** → the verdict function emits `held` (not "win") for rolled-back subjects, and a
  `regressed` alarm if any after-IoU drops below baseline; the docs lead with the residual.
