# Plan — T-011-01: ground-on-arc

Ordered, independently verifiable steps. Testing strategy inline per step. The substantive deliverable is
the **judged A/B + the three render-grounded verdicts (P12 / P13 / detail-on-flat-fields)**, not code;
there is **no guaranteed code action** (tree already clean). Steps 1–3 overlap with artifact authoring (the
long live run runs while artifacts are written); the causal order below is what matters.

## Step 1 — Confirm the champion config (no revert needed)
- `git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` → **empty** (tree already clean; HEAD is the
  015-menu champion). No `git checkout` required, unlike T-007-01.
- **Verify:** empty diff; `grep "NO LARGE FLAT FIELDS"` present (015 menu); P12 color-hold (L433–436) and
  P13 one-plane (L419–423) blocks present. ✅ done.

## Step 2 — Confirm tests green (pre-run gate)
- `npm test`.
- **Verify:** 133/133 pass. ✅ done — baseline guard before spending a metered run.

## Step 3 — Run the Arc de Triomphe generalization trial (LIVE, metered, ~10–15 min)
- `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/arc_de_triomph.JPG
  --note "Arc de Triomphe generalization (T-011-01): single colossal opening; P12 on a 4th pale ref, P13
  proportion on arch massing, detail lever on attic/spandrel flat fields."`.
- Runs 3 calls: reference-grounded doc → high-res build (`round-0.png`) → reference-compared 2nd pass
  (`render.png`); auto-judges `render.png` (median-of-3); writes `summary.json`; regenerates README.
- **Verify:** `runs/021-vRefRevise-designdoc/` contains `round-0.png`, `render.png`, `artifact.json`,
  `summary.json`; console prints `judge[...] overall=...`. (AC: outputs retained.) 🔄 launched; in flight.
- **Already observed (stage 1):** `design-doc.md` ("Temple of the Solar Triumph") states *"No white wall:
  the reference's pale stone is translated into warm desert stone"* and commits to red sandstone / granite
  / gold / lapis → the model read the image as **pale** (conflict, not agreement) and the P12 split
  **fired**. The doc *plans* relief for the attic rondels + spandrel Victories — the detail read is whether
  the build/render actually delivered that articulation.

## Step 4 — Judge round-0 (the A/B control)
- Copy `docs/active/work/T-006-01/judge-round0.mjs` → `docs/active/work/T-011-01/judge-round0.mjs`.
- `node docs/active/work/T-011-01/judge-round0.mjs benchmarks/temple-facade/runs/021-vRefRevise-designdoc/round-0.png`.
- **Verify:** prints median-of-3 per-dimension scores + notes for round-0. (AC #1: both rounds scored;
  P14: judge both, don't assume the 2nd pass is better.)

## Step 5 — Read the three verdicts from the renders
- Open `render.png` AND `round-0.png`. Decide, grounded in what is visible (cross-checked vs judge
  `notes`):
  - **P13 / proportion on one giant arch (ticket's first read):** is the single opening proportioned
    (pier-to-void readable, attic not top-heavy, springs/imposts sensible)? Did the 2nd pass hold or
    regress it? Note explicitly that the *detachment* mode is un-exercised (no standalone parts).
  - **P12 / color (load-bearing):** did the build land the doc's red-sandstone/granite/gold/lapis scheme,
    or did the cream limestone leak it toward monochrome? → `color` strong vs competent/weak.
  - **Detail / attic + spandrel flat fields (the headline):** do the broad attic band and spandrel panels
    carry layered relief (rondels, framed Victory groups, banding), or do they read as inert blank walls?
    Give a confident yes/no on visible articulation; report the `detail` category with the P15 caveat.
- Attribute any round-0→render change to the build vs the 2nd pass (the known double-edge; P14). For
  detail specifically: did the revision's NO-LARGE-FLAT-FIELDS clause *add* relief to the attic/spandrels
  between rounds, or leave them flat?
- **Decision gate (Design E):** does a pre-registered trigger fire?
  - Color trigger: render reads monochrome/cream stone.
  - Proportion trigger: top-heavy attic / hollow void / 2nd pass detached the attic-cornice cap.
  - Detail is **NOT** a trigger (expected P15 holdout).
  - If **neither** color/proportion trigger → principles generalized; **no edit**; go to Step 7.
  - If **one fires** → Step 6.

## Step 6 — (CONDITIONAL) minimal generalizing edit + re-verify
- Only if Step 5 triggered. Make the *single minimal clause* edit (Design E / Structure):
  color-hold → name the cream/limestone capture mode; or one-plane → name the heavy attic/cornice as
  engaged relief, not a detached cap.
- `npm test` → must stay **133/133 green** (AC).
- `git diff HEAD -- benchmarks/temple-facade/run.mjs` → capture the diff for the journal.
- **Note:** a single minimal edit is in-scope; a *re-run* to validate it is optional (AC require recording
  the diff + green tests, not a second metered run).

## Step 7 — Append the journal attempt-log entry (the deliverable — AC #2/#3)
- Append a dated entry to `docs/knowledge/design-learnings.md` "Attempt log" (EOF):
  - run id, reference, champion config (015 menu, tree clean — no revert).
  - **The massing framing up front:** single colossal opening, no standalone parts → P13 detachment mode
    un-exercised; proportion read is coherent-silhouette-on-one-arch.
  - **A/B table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **P12 verdict:** held/failed; the Arc is a **fourth pale reference** (cream limestone) — another
    conflict point (model read it pale, committed to color at the doc stage). Render must confirm color
    landed strong.
  - **P13 verdict:** held/failed for proportion on the one-arch massing; detachment mode noted un-exercised.
  - **Detail verdict (headline):** **did the lever resolve the attic/spandrel flat fields** — yes/no on
    visible articulation + the `detail` category with the P15 caveat. This is the sharpest flat-field
    probe in the chain (the Arc's correct surface is mostly smooth ashlar with concentrated relief).
  - judge `notes` excerpts grounding each verdict in the render.
  - the conditional diff (if Step 6 ran) + test-green confirmation.
- **Scope the Principles section** as warranted — most likely add the Arc as a *fourth* pale-reference
  point under P12, and record the attic/spandrel outcome under P15. Leave the rubric/brief untouched.
- **Verify:** entry present, dated, render-grounded; no rubric/brief edits sneaked in.

## Step 8 — progress.md + review.md
- Fill `progress.md` (tracker + final scoreboard). Write `review.md` (handoff: what changed, test
  coverage, open concerns, the three verdicts, the headline detail read). Then stop — Lisa handles phase
  transitions.

## Testing strategy (summary)
- **Automated:** `npm test` (133) is the only unit gate — guards artifact validation; run before the trial
  (Step 2, done) and after any conditional edit (Step 6). A prompt-string edit has no unit of its own.
- **Experimental (the real test):** the frozen categorical judge (median-of-3) on **both** renders, read
  for color (P12) + proportion (P13) + detail/flat-fields (P15) with the render as ground truth. Single
  generation (Design D): color/proportion are structural/low-variance; the single `detail` score carries
  the P15 noise caveat, but the *attic/spandrel articulation* is a single-render-answerable structural fact.
- **Verification criteria = the AC:** both rounds scored; journal entry with A/B + P12/P13 held/failed +
  explicit attic/spandrel detail verdict; diff + green tests if any edit; outputs retained.

## Rollback
- Tree is already the safe state (clean HEAD). If a conditional edit proves wrong, `git checkout HEAD --
  benchmarks/temple-facade/run.mjs` restores the champion. No data migration, no irreversible step.
