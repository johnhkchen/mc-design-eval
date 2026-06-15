# Plan — T-012-01: ground-on-mausoleum

Ordered, independently verifiable steps. Testing strategy inline per step. The substantive deliverable is
the **judged A/B + the 008-vs-now cumulative-progress comparison + the P12/P13 verdicts**, not code; there
is **no guaranteed code action** (tree already clean). Steps 1–3 overlap with artifact authoring (the long
live run runs while artifacts are written); the causal order below is what matters.

## Step 1 — Confirm the champion config (no revert needed)
- `git diff --stat HEAD -- benchmarks/temple-facade/run.mjs` → **empty** (tree already clean; HEAD is the
  015-menu champion). No `git checkout` required, unlike T-007-01.
- **Verify:** empty diff; `grep "NO LARGE FLAT FIELDS"` present (015 menu); P12 color-hold and P13 one-plane
  blocks present. ✅ done.

## Step 2 — Confirm tests green (pre-run gate)
- `npm test`.
- **Verify:** 133/133 pass. ✅ done — baseline guard before spending a metered run.

## Step 3 — Run the Mausoleum cumulative-progress trial (LIVE, metered, ~10–15 min)
- `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/sys_mausoleum.JPG
  --note "Sun Yat-sen Mausoleum re-run (T-012-01): cumulative-progress on the reference that first proved
  grounding (run 008). P12 on a blue-white reference; P13 on double-eaved stacked roof + battered wings;
  detail lever vs 008's named blank base register + shallow portico."`.
- Runs 3 calls: reference-grounded doc → high-res build (`round-0.png`) → reference-compared 2nd pass
  (`render.png`); auto-judges `render.png` (median-of-3); writes `summary.json`; regenerates README.
- **Verify:** `runs/022-vRefRevise-designdoc/` contains `round-0.png`, `render.png`, `artifact.json`,
  `summary.json`; console prints `judge[...] overall=...`. (AC: outputs retained.) 🔄 launched; in flight.
- **Already observed (stage 1):** `design-doc.md` ("Temple of the Cobalt Ascendant") states *"The reference
  hands me one true color — that cobalt roof — and I commit to it boldly rather than collapsing to its
  white walls"* and commits to a **blue↔gold complementary scheme** (`blue_glazed_terracotta` dominant /
  `calcite` field / `gold_block` accent / `red_concrete` vermilion counter-accent) → the model read the
  reference as **mildly colorful** and the P12 split fired in the **keep-color** direction (seeded by the
  reference's one hue, structured from the brief). The doc *plans* relief for the entablature bracket
  course, arched spandrels, and stepped voussoir arches — the detail read is whether the build/render
  delivered that on the broad calcite wing-wall/base fields 008 flagged blank.

## Step 4 — Judge round-0 (the A/B control)
- Copy `docs/active/work/T-006-01/judge-round0.mjs` → `docs/active/work/T-012-01/judge-round0.mjs`.
- `node docs/active/work/T-012-01/judge-round0.mjs benchmarks/temple-facade/runs/022-vRefRevise-designdoc/round-0.png`.
- **Verify:** prints median-of-3 per-dimension scores + notes for round-0. (AC #1: both rounds scored; P14:
  judge both, don't assume the 2nd pass is better.)

## Step 5 — Read the verdicts from the renders
- Open `render.png` AND `round-0.png`. Decide, grounded in what is visible (cross-checked vs judge `notes`):
  - **008-vs-now (the headline) — Leg 1, failure-named:** does the 022 render fix run 008's two named
    defects — *"the columned portico is shallow"* (is the portal/arch zone now given real recessed depth?)
    and *"the wide blank base register feels under-detailed"* (do the calcite wing-walls / wall band now
    carry banding, dougong courses, framed panels — or read as inert ashlar like 008)?
  - **008-vs-now — Leg 2, categorical-on-its-own-terms:** report 022's categorical scores as the current
    instrument's reading; state explicitly they are **not** numerically comparable to 008's v1 4/5 (only to
    runs 010–021). Do not write "4/5 → strong."
  - **P12 / color (first mildly-colorful reference):** did the build land the doc's blue↔gold↔vermilion
    complementary scheme (strong, brief-driven harmony), or collapse toward the reference's blue+white / a
    single cool family? → `color` strong vs competent/weak; use judge `notes` to tell agreement-by-design
    from reference-capture.
  - **P13 / proportion (stacked roof + battered wings):** did the double-eaved roof stay a coherent bonded
    crown and the wing-walls stay engaged, or did a tier/wing float? Did the 2nd pass hold or regress it?
  - **Detail / wing-walls + base register (headline detail):** confident yes/no on visible articulation;
    report the `detail` category with the P15 caveat.
- Attribute any round-0→render change to the build vs the 2nd pass (the known double-edge; P14). 008 had no
  2nd pass, so note whether *adding* one was part of the cumulative gain or a wash/regression here.
- **Decision gate (Design E):** does a pre-registered trigger fire?
  - Color trigger: render reads monochrome/grey OR re-uses the reference's blue+white with no brief scheme.
  - Proportion trigger: a roof tier or wing-wall floated / 2nd pass detached the roof cap.
  - Detail is **NOT** a trigger (expected P15 holdout).
  - If **neither** color/proportion trigger → principles held; **no edit**; go to Step 7.
  - If **one fires** → Step 6.

## Step 6 — (CONDITIONAL) minimal generalizing edit + re-verify
- Only if Step 5 triggered. Make the *single minimal clause* edit (Design E / Structure): color-hold → name
  that an already-colorful reference is still a craft anchor, brief leads; or one-plane → name stacked roof
  tiers + engaged buttress-walls as bonded.
- `npm test` → must stay **133/133 green** (AC).
- `git diff HEAD -- benchmarks/temple-facade/run.mjs` → capture the diff for the journal.
- **Note:** a single minimal edit is in-scope; a *re-run* to validate it is optional (AC require recording
  the diff + green tests, not a second metered run).

## Step 7 — Append the journal attempt-log entry (the deliverable — AC #2/#3)
- Append a dated entry to `docs/knowledge/design-learnings.md` "Attempt log" (EOF):
  - run id, reference, champion config (015 menu, tree clean — no revert).
  - **The cumulative-progress framing up front:** the founding-grounding reference (run 008), re-run under
    everything invented since — same image/brief/seed, only the pipeline differs.
  - **A/B table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **The 008-vs-now comparison (headline):** Leg 1 (did it fix shallow portico + blank base register) +
    Leg 2 (categorical scores, explicitly not numerically comparable to 008's v1).
  - **P12 verdict:** held/failed; first mildly-colorful reference — the (partial) colorful-reference data
    point the chain has wanted since run 020; did color come from the brief's scheme (it kept color at the
    doc stage rather than collapsing to white).
  - **P13 verdict:** held/failed for proportion on the stacked-roof/battered-wing massing; 2nd-pass effect.
  - **Detail verdict (headline detail):** did the lever resolve 008's blank base register / calcite
    wing-walls — yes/no on visible articulation + the `detail` category with the P15 caveat.
  - judge `notes` excerpts grounding each verdict in the render.
  - the conditional diff (if Step 6 ran) + test-green confirmation.
- **Scope the Principles section** as warranted — most likely add the mausoleum as the **first
  mildly-colorful / partial-agreement** point under P12, and record the wing-wall/base-register outcome
  under P15. Leave the rubric/brief untouched.
- **Verify:** entry present, dated, render-grounded; no rubric/brief edits sneaked in.

## Step 8 — progress.md + review.md
- Fill `progress.md` (tracker + final scoreboard + 008-vs-now read). Write `review.md` (handoff: what
  changed, test coverage, open concerns, the verdicts, the headline cumulative read). Then stop — Lisa
  handles phase transitions.

## Testing strategy (summary)
- **Automated:** `npm test` (133) is the only unit gate — guards artifact validation; run before the trial
  (Step 2, done) and after any conditional edit (Step 6). A prompt-string edit has no unit of its own.
- **Experimental (the real test):** the frozen categorical judge (median-of-3) on **both** renders, read
  for the 008-vs-now comparison + color (P12) + proportion (P13) + detail/wing-walls (P15). Single
  generation (Design D): color/proportion are structural/low-variance; the single `detail` score carries
  the P15 noise caveat, but the wing-wall/base-register articulation is a single-render-answerable fact.
- **Verification criteria = the AC:** both rounds scored; journal entry with A/B + explicit 008-vs-now
  comparison + P12/P13 held/failed; diff + green tests if any edit; outputs retained.

## Rollback
- Tree is already the safe state (clean HEAD). If a conditional edit proves wrong, `git checkout HEAD --
  benchmarks/temple-facade/run.mjs` restores the champion. No data migration, no irreversible step.
