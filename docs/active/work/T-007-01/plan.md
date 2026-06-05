# Plan — T-007-01: ground-on-horyuji

Ordered, independently verifiable steps. Testing strategy is inline per step. The substantive
deliverable is the **judged A/B + the journal verdict**, not code; the only guaranteed code action is
the revert-to-champion. Steps 1–4 may already be executed by the time later artifacts are written
(the long live run is overlapped with artifact authoring); the causal order below is what matters.

## Step 1 — Restore the champion config
- `git checkout HEAD -- benchmarks/temple-facade/run.mjs` (drop S-010's un-promoted texture-grain WT
  edit; Decision A).
- **Verify:** `git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` → empty; `grep "Detail — NO
  LARGE FLAT FIELDS"` present (the 015 menu).

## Step 2 — Confirm tests green (pre-run gate)
- `npm test`.
- **Verify:** 133/133 pass. (Baseline guard before spending a metered run.)

## Step 3 — Run the Hōryū-ji generalization trial (LIVE, metered, ~15 min)
- `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/horyu_ji.JPG
  --note "Horyu-ji generalization (T-007-01): P12/P13 stress …"`.
- Runs 3 calls: reference-grounded doc → high-res build (`round-0.png`) → reference-compared 2nd pass
  (`render.png`); auto-judges `render.png` (median-of-3); writes `summary.json`; regenerates README.
- **Verify:** `runs/019-vRefRevise-designdoc/` contains `round-0.png`, `render.png`, `artifact.json`,
  `summary.json`; console prints `judge[...] overall=...`. (AC #4: outputs retained.)

## Step 4 — Judge round-0 (the A/B control)
- Copy `docs/active/work/T-006-01/judge-round0.mjs` → `docs/active/work/T-007-01/judge-round0.mjs`.
- `node docs/active/work/T-007-01/judge-round0.mjs benchmarks/temple-facade/runs/019-vRefRevise-designdoc/round-0.png`.
- **Verify:** prints median-of-3 per-dimension scores + notes for round-0. (AC #1: both rounds scored;
  P14: judge both, don't assume the 2nd pass is better.)

## Step 5 — Read P12 and P13 from the FINAL render (the verdict)
- Open `render.png`. Decide, grounded in what is visible (and cross-checked against judge `notes`):
  - **P12 — colorful?** Is the build a confident multi-hue scheme (the doc's vermilion/jade/gold), or
    did the timber palette leak it toward brown/grey/white monochrome? → **held / failed**.
  - **P13 — one connected plane?** Is it a single coherent elevation with surviving proportion under
    the vertical pagoda massing, or did tiers/a tower detach or float? → **held / failed**.
- Also inspect round-0 → render to attribute any proportion change to the build vs the 2nd pass
  (the known double-edge; P14).
- **Decision gate (Decision C):** does a pre-registered trigger fire?
  - P13 trigger: detached/floating masses, sky between tiers, stacked free boxes.
  - P12 trigger: render reads monochrome timber.
  - If **neither** → principles generalized; **no edit**; go to Step 7.
  - If **one fires** → Step 6.

## Step 6 — (CONDITIONAL) minimal generalizing edit + re-verify
- Only if Step 5 triggered. Make the *single minimal clause* edit (Decision C / Structure):
  P13 → generalize one-plane wording to "stacked tiers/tower = setbacks of one plane"; or
  P12 → name the timber monochrome failure mode.
- `npm test` → must stay **133/133 green** (AC #3).
- `git diff HEAD -- benchmarks/temple-facade/run.mjs` → capture the diff for the journal.
- **Note:** a single minimal edit is in-scope; a *re-run* to validate the edit is optional and only if
  time/budget allow — the AC require recording the diff + green tests, not a second metered run.

## Step 7 — Append the journal attempt-log entry (the deliverable — AC #2/#3)
- Append a dated entry to `docs/knowledge/design-learnings.md` "Attempt log":
  - run id, reference, champion config (015 menu, reverted), note on the inherited-champion decision.
  - **A/B table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **P12 held/failed** + scope-if-failed (the condition under which it holds).
  - **P13 held/failed** + scope-if-failed.
  - judge `notes` excerpts grounding both verdicts in the render.
  - the conditional diff (if Step 6 ran) + test-green confirmation.
- Refine the Principles section (P12/P13 wording, P15 caveat) **only as warranted** — generalize P13 if
  it held on a stacked-tier reference; scope it if it failed; leave detail caveats intact.
- **Verify:** entry present, dated, render-grounded; no rubric/brief edits sneaked in.

## Step 8 — progress.md + review.md
- Fill `progress.md` (tracker + final scoreboard). Write `review.md` (handoff: what changed, test
  coverage, open concerns, the inherited-champion decision, P12/P13 verdict summary). Then stop —
  Lisa handles phase transitions.

## Testing strategy (summary)
- **Automated:** `npm test` (133) is the only unit gate — guards artifact validation; run before the
  trial (Step 2) and after any conditional edit (Step 6). A prompt-string edit has no unit of its own.
- **Experimental (the real test):** the frozen categorical judge (median-of-3) on **both** renders,
  read for P12/P13 with the render as ground truth. Single generation (Decision D): P12/P13 are
  structural/low-variance reads; a single `detail` score is read with the P15 noise caveat, not
  over-credited.
- **Verification criteria = the AC:** both rounds scored; journal entry with A/B + explicit P12/P13
  held/failed (scoped if failed); diff + green tests if any edit; outputs retained under `runs/`.

## Rollback
- The revert *is* the safe state (clean HEAD). If a conditional edit proves wrong, `git checkout HEAD
  -- benchmarks/temple-facade/run.mjs` restores the champion. No data migration, no irreversible step.
