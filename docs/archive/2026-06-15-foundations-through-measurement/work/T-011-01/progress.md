# Progress — T-011-01: ground-on-arc

Live tracker. **Scoreboard + verdicts are filled ONLY from actual judge output — no placeholder scores.**

## Step status

| # | step | status |
|---|------|--------|
| 1 | Confirm champion (tree clean vs HEAD — no revert) | ✅ done — `git diff --stat HEAD` empty; 015 menu + P12/P13 blocks present |
| 2 | `npm test` pre-run gate | ✅ done — 133/133 pass |
| 3 | Live Arc run (`021-vRefRevise-designdoc`) | ✅ done — 12,696 blocks, $2.13, 1006s; render auto-judged overall=strong (3/3) |
| 4 | Judge round-0 (helper, median-of-3) | ✅ done — round-0 overall=strong (perSample strong/competent/strong) |
| 5 | Read color/proportion/detail from renders; trigger check | ✅ done — **no trigger fired** (color strong; proportion strong; nothing detached) |
| 6 | Conditional minimal edit | ✅ N/A — no edit (no trigger); tree clean, zero source diff |
| 7 | Journal attempt-log entry | ✅ done — run-021 entry appended; P12 4th-pale point + P15 attic/spandrel note added |
| 8 | progress.md + review.md | ✅ done |

## Run facts (`021-vRefRevise-designdoc`)
- Reference: `references/arc_de_triomph.JPG` — **Arc de Triomphe de l'Étoile**: a single rectangular
  pier-block pierced by ONE colossal round arch; **pale cream/grey limestone** (near-monochrome); broad
  flat attic band (rondel/shield reliefs) + tall spandrel panels (concentrated high-relief groups) over
  otherwise plain ashlar. No towers/minarets/pagoda — the antithesis of every prior reference's massing.
- **Massing framing (Design C):** the Arc has **no freestanding parts**, so the P13 *detachment* failure
  mode is **un-exercised** here by construction. The proportion read is "coherent silhouette + readable
  pier-to-void on a single-arch massing," as the ticket frames it — not a detachment test.
- Config: **champion** (committed HEAD, 015 "NO LARGE FLAT FIELDS" menu). Tree clean — **no revert
  needed** (like T-008-01; unlike T-007-01). Zero source diff this ticket.
- **Pale-reference pre-classification (stage-1 doc):** `design-doc.md` ("Temple of the Solar Triumph")
  states *"No white wall: the reference's pale stone is translated into warm desert stone."* The model read
  the image as **pale** → **conflict** condition (pale ref vs colorful brief), the P12 split **fired** at
  the doc stage. Committed scheme: **Smooth Red Sandstone** dominant, **Polished Granite** supporting,
  **Gold** accent, **Lapis Lazuli** cold-strike (arch vault + attic recesses) — a complementary-accented
  analogous harmony. The doc also *plans* relief for the attic rondels + spandrel Victories — the detail
  read is whether the build delivered it.

## A/B scoreboard (median-of-3, rubric `v2-categorical-baml`)

| dimension | round-0 (build) | render (2nd pass) |
|-----------|:---------------:|:-----------------:|
| proportion | **strong** | **strong** |
| color | **strong** | **strong** |
| detail | competent | **strong** |
| fidelity | **strong** | **strong** |
| **overall** | **strong** | **strong (3/3)** |

round-0 perSample: [strong, competent, strong] (overall median strong; detail competent).
render perSample: [strong, strong, strong]. 12,696 blocks, 0 unmapped, 30,973/71,671 tok, $2.13, 1006s.

## Verdict (grounded in `render.png` + `round-0.png` + judge notes)

- **P12 (color) — HELD, load-bearing, NOT neutral. Fourth pale-reference confirmation.** `color = strong`
  in **both** rounds off a *pale cream-limestone* reference. The model took "structure, not pallor" and
  built a warm red-sandstone/granite + gold + deep-blue scheme; both judges call it "disciplined,
  committed, non-monochrome." The Arc adds a **fourth** pale palette point to P12 (white Taj / dark-timber
  Hōryū-ji / pale-stone Sainte-Chapelle / **cream-limestone Arc**). The genuine *agreement* case (a truly
  polychrome reference IMAGE) still **untested** — this was again conflict, not agreement.

- **P13 (proportion on one giant arch) — HELD strong, both rounds; detachment mode un-exercised.** The
  single-opening massing got a coherent, legible silhouette (base→middle→crown: plinth, great arch between
  framed side bays, coffer band + dentil/crenellated cornice). `proportion = strong` in **both** rounds.
  Crucially the **2nd pass did NOT regress proportion** here (unlike 013/017/020) — it held strong even
  while it *oversized the central arch* (judge: "side bays feel squeezed against the oversized arch"), a
  sub-categorical blemish, not a failure. Note: the Arc has no standalone parts, so the P13 *detachment*
  hazard was never presented — this run lightly tests the headline detachment claim and squarely tests
  proportion-on-a-novel-massing (which held).

- **Detail / attic + spandrel flat fields (the headline AC #2 read) — MIXED: the NAMED fields resolved,
  but the flat-field CLASS migrated.**
  - **Attic band — RESOLVED.** Both rounds render the attic as an **articulated row of gold-framed
    coffer/rondel panels** (the doc's "rondel shields"), not a blank wall. The detail clause filled the
    specific field the ticket named.
  - **Spandrels — RESOLVED.** Gold archivolt + spandrel ornament flank the arch crown in both rounds;
    not blank.
  - **But a large flat field PERSISTS, relocated.** Both judges flag it: round-0 — "the large blue infill
    panels are unbroken flat fields … side bays … flat"; render — "the enormous central tympanum is one
    large flat lattice field, the brick side fields are fairly plain." The 2nd pass **enlarged the central
    arch** (echoing run 020's enlarge-a-feature-into-a-flat-field move), so the dominant flat field became
    the giant blue arch void itself + plain brick flanks.
  - **Category:** `detail` went **competent → strong** across the 2nd pass — the **first time the revision
    LIFTED detail**. Read with the **P15 noise caveat**: detail is boundary-noisy (competent in run 014 vs
    strong in 015, identical config); render perSample was unanimous [strong×3] but the persistent flat
    field in the notes shows the strong is driven by the *dense gold ornament around every opening*, not by
    the broad fields being filled. So: **the lever resolved the attic/spandrel fields specifically, did not
    eliminate the flat-field class (it migrated to the arch void), and the categorical strong is partly the
    known detail noise** — consistent with P15, not a refutation of it.

- **P14 (2nd-pass double-edge) — a HOLD/LIFT case (like 014/019), not a regression (unlike 013/017/020).**
  The revision held proportion/color/fidelity strong and lifted detail competent→strong; the only cost was
  the oversized arch / squeezed side bays (no categorical hit). Running tally: helped/held 014, 019, **021**;
  regressed 013, 017, 020. Still reference-dependent (~coin-flip), but this is a clean "2nd pass earned its
  keep" data point on a brand-new massing.

## Trigger check (Design E) — none fired
- **Color trigger (monochrome/cream capture):** NO — color strong, committed warm scheme.
- **Proportion trigger (top-heavy / hollow / detached attic cap):** NO — proportion strong both rounds;
  the oversized-arch blemish is sub-categorical, not a failure mode the one-plane clause addresses.
- **Detail:** fenced out by design (expected P15 holdout, not a trigger).
→ **No prompt edit.** Clean generalization; zero source diff; `npm test` 133/133 green before and after.

## Deviations from plan
- Step 1 found the tree **already clean** (no revert), as anticipated (like T-008-01).
- Steps 1–4 overlapped with artifact authoring (to gate + overlap the metered run; the live run wrote
  stage-1's `design-doc.md` before Design/Structure/Plan were finished, enabling the pale pre-classification).
- The detail result is **more favorable than expected** (category lifted to strong, not the usual
  competent holdout) — but the qualitative flat-field migration means the headline answer is "named fields
  resolved, class migrated," recorded honestly rather than reported as a clean detail win.
