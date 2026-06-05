# Plan — T-008-01: ground-on-sainte-chapelle

Ordered, independently verifiable steps. Testing strategy inline per step. The substantive deliverable is
the **judged A/B + the P12 scoping verdict**, not code; there is **no guaranteed code action** (tree
already clean). Steps 1–3 are overlapped with artifact authoring (the long live run runs while artifacts
are written); the causal order below is what matters.

## Step 1 — Confirm the champion config (no revert needed)
- `git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` → **empty** (tree already clean; HEAD is the
  015-menu champion). No `git checkout` required, unlike T-007-01.
- **Verify:** empty diff; `grep "NO LARGE FLAT FIELDS"` present (015 menu); P12 color-hold (L433–436) and
  P13 one-plane (L419–423) blocks present. ✅ done.

## Step 2 — Confirm tests green (pre-run gate)
- `npm test`.
- **Verify:** 133/133 pass. ✅ done — baseline guard before spending a metered run.

## Step 3 — Run the Sainte-Chapelle generalization trial (LIVE, metered, ~15 min)
- `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/St_Chapelle.png
  --note "Sainte-Chapelle generalization (T-008-01): inverse P12 test …"`.
- Runs 3 calls: reference-grounded doc → high-res build (`round-0.png`) → reference-compared 2nd pass
  (`render.png`); auto-judges `render.png` (median-of-3); writes `summary.json`; regenerates README.
- **Verify:** `runs/020-vRefRevise-designdoc/` contains `round-0.png`, `render.png`, `artifact.json`,
  `summary.json`; console prints `judge[...] overall=...`. (AC: outputs retained.) 🔄 launched; in flight.
- **Already observed (stage 1):** `design-doc.md` ("Temple of the Sevenfold Dawn") states *"The reference
  is pale honey limestone … I take its structure, not its pallor"* and commits to red sandstone / blue
  terracotta / gold / stained-glass → the model read the image as **pale** (Path 2, Design C) and the P12
  split **fired**. This pre-classifies the condition: **conflict, not agreement.**

## Step 4 — Judge round-0 (the A/B control)
- Copy `docs/active/work/T-006-01/judge-round0.mjs` → `docs/active/work/T-008-01/judge-round0.mjs`.
- `node docs/active/work/T-008-01/judge-round0.mjs benchmarks/temple-facade/runs/020-vRefRevise-designdoc/round-0.png`.
- **Verify:** prints median-of-3 per-dimension scores + notes for round-0. (AC #1: both rounds scored;
  P14: judge both, don't assume the 2nd pass is better.)

## Step 5 — Read the verdict from the FINAL render
- Open `render.png`. Decide, grounded in what is visible (cross-checked against judge `notes`):
  - **Color (the load-bearing P12 read):** did the build land a confident multi-hue scheme (the doc's
    amber/blue/gold/jewel-glass), or did the pale-stone exterior leak it toward grey/monochrome? →
    `color` strong vs competent/weak.
  - **Proportion (P13 / verticality):** did the 1.6:1 soaring Gothic massing + pinnacles hold a coherent
    **one connected plane**, or did the crown/pinnacles detach or the silhouette go top-heavy?
  - **Detail (S-006 transfer):** did the tracery (rose medallion, crockets, lancets) read as dense relief,
    or did fields stay flat? (Read with the P15 noise caveat — single generation.)
- Also inspect round-0 → render to attribute any change to the build vs the 2nd pass (the known
  double-edge; P14). For color specifically: round-0 strong + render strong ⇒ the color-hold clause did
  nothing measurable this run.
- **Decision gate (Design D):** does a pre-registered trigger fire?
  - Color trigger: render reads monochrome/grey stone.
  - Proportion trigger: pinnacles/crown detached or verticality broke proportion.
  - If **neither** → principles generalized; **no edit**; go to Step 7.
  - If **one fires** → Step 6.

## Step 6 — (CONDITIONAL) minimal generalizing edit + re-verify
- Only if Step 5 triggered. Make the *single minimal clause* edit (Design D / Structure):
  color-hold → name the grey-stone capture mode; or one-plane → name pinnacles/spirelets/buttresses.
- `npm test` → must stay **133/133 green** (AC).
- `git diff HEAD -- benchmarks/temple-facade/run.mjs` → capture the diff for the journal.
- **Note:** a single minimal edit is in-scope; a *re-run* to validate it is optional (AC require recording
  the diff + green tests, not a second metered run).

## Step 7 — Append the journal attempt-log entry (the deliverable — AC #2/#3)
- Append a dated entry to `docs/knowledge/design-learnings.md` "Attempt log" (EOF):
  - run id, reference, champion config (015 menu, tree clean — no revert).
  - **The premise discrepancy up front:** ticket assumed colorful (agreement); the image is grey-stone
    EXTERIOR; the stage-1 doc confirms the model read it as pale → this is a **second conflict-condition**
    run, not the agreement case.
  - **A/B table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **P12 verdict:** *neutral vs additive*, scoped. Expected: **NOT neutral** — load-bearing because the
    image is pale; ticket hypothesis **refuted on its premise**; mechanism (color from brief) **confirmed
    robust** across a third pale reference. (Render must confirm `color` landed strong.)
  - **Secondary:** proportion under verticality (P13); detail on tracery (S-006).
  - judge `notes` excerpts grounding each verdict in the render.
  - the conditional diff (if Step 6 ran) + test-green confirmation.
- **Scope the Principles section** as warranted — most likely scope P12's condition to "any pale reference
  (white / timber / stone)", and note the genuine *agreement* case (a polychrome reference IMAGE) remains
  **untested** because this image was an exterior. Leave the rubric/brief untouched.
- **Verify:** entry present, dated, render-grounded; no rubric/brief edits sneaked in.

## Step 8 — progress.md + review.md
- Fill `progress.md` (tracker + final scoreboard). Write `review.md` (handoff: what changed, test
  coverage, open concerns, the premise discrepancy, the P12 scoping verdict). Then stop — Lisa handles
  phase transitions.

## Testing strategy (summary)
- **Automated:** `npm test` (133) is the only unit gate — guards artifact validation; run before the trial
  (Step 2, done) and after any conditional edit (Step 6). A prompt-string edit has no unit of its own.
- **Experimental (the real test):** the frozen categorical judge (median-of-3) on **both** renders, read
  for color (P12) + proportion (P13) + detail (S-006) with the render as ground truth. Single generation
  (Design E): color/proportion are structural/low-variance; the single `detail` score carries the P15
  noise caveat.
- **Verification criteria = the AC:** both rounds scored; journal entry with A/B + explicit P12 scoping
  verdict (neutral vs additive) + secondary notes; diff + green tests if any edit; outputs retained.

## Rollback
- Tree is already the safe state (clean HEAD). If a conditional edit proves wrong, `git checkout HEAD --
  benchmarks/temple-facade/run.mjs` restores the champion. No data migration, no irreversible step.
