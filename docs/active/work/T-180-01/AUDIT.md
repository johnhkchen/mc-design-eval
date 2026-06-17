# T-180-01 — AUDIT: matched-build `replace` tags, R vs S

**Decision: BOTH loci are active.** WALL is a genuine **reading** mis-read (R); OPENING-gable and ROOF are
genuine divergences the binary **scoring** cap floors (S). The dark-oak roof is the anchor proving
concept-conditioning (R) *alone* cannot lift matched while the cap is binary. S-181 must fix **both**:
concept-conditional `replace` tagging **AND** a graded style-distance (replace the single-`replace` hard
cap). Frozen instrument untouched; no fix in this ticket.

Regenerate the table inputs: `node docs/active/work/T-180-01/extract-audit.mjs`.

## Method

For each `replace`/`wrong-style` item across the 6 matched-build votes, apply the **same-family test**: *is
the build's actual material at this element in the same style family the concept calls for?*
- **YES** (faithful material, only a within-style detail missing) → `replace`/wrong-style is a **mis-read**;
  a correct judge would emit `add`; the cap never needed to fire → **R**.
- **NO** (genuinely wrong material vs the concept) → the `replace` read is **correct**; the defect is the
  binary cap flooring an otherwise-faithful build → **S**.

`expected` strings are **not persisted** in the results JSON, so the "faithful target" column is sourced from
the recognition program (`gatehouse.program.json`) + pack (`rustic.json`) roles, and the "build has" column
from the artifact census. Where a tag carries *both* a wrong `styleClass` and an additive divergence, the
**primary** class is the minimal fix that corrects the tag; the aggravator is noted.

## Ground truth (the join every call cites)

| Element | Faithful target (program role → pack block) | Build actually has (census) | Same family? |
|---|---|---|---|
| Wall field | `wall.dressing` → **stone_bricks** | **1106 stone_bricks** | **YES — exact match** |
| Wall quoins | `wall.field.ground` → cobblestone | 4 cobblestone (≈none) | grey stone; contrast absent (detail) |
| Opening (gable) | arch + `frame.timber`(dark_oak_log) + `door.main`(spruce_door) | bare hole, 4 dark_oak_log, **no door**, no arch course | opening present in stone; dressing **absent** (additive) |
| Roof | concept image reads **grey** stepped + grey eave course | 210 dark_oak_stairs + 15 dark_oak_planks (**brown**) | **NO — brown ≠ grey (genuine wrong material)** |
| Slit windows | `window.shutter`(dark_oak_trapdoor) + `window.infill`(spruce_fence) | bare slits | right-material; infill absent (additive) |

> The roof is *faithful to the program* (program `roof.fieldRole = roof.trim` = dark_oak) but **not** to the
> concept image (grey). The judge compares renders to the **concept**, so ROOF:replace is **legitimately
> correct** — the epic's named "known-legitimate S reference."

## Per-item classification (16 `replace` items across 6 votes)

| Vote | Dept | kind | present ⇢ missing (abbrev.) | Build vs faithful | **Call** | Reasoning |
|---|---|---|---|---|---|---|
| 1 | OPENING | replace | plain rect opening, no surround ⇢ arch, dark_oak_log frame, door | opening present (stone); arch+frame+door genuinely absent | **S** (R-agg) | divergence is **real & additive**; right-material opening tagged wrong-style overstates, but the binding defect is replace+cap on a recoverable gap |
| 1 | WALL | replace | uniform stone_bricks, no cobble field ⇢ cobblestone field, field/dressing contrast | stone_bricks **= program field material**; only quoin contrast missing | **R** | build material **matches concept** (grey stone); `wrong-style` is a mis-read — should be `add` (missing quoins) |
| 1 | ROOF | replace | brown plank roof ⇢ spruce field, grey courses, dark trim | dark_oak (brown) vs grey concept | **S** (anchor) | genuine wrong material; `replace` is **correct**; only the binary cap is wrong |
| 2 | OPENING | replace | flat square doorway, bare reveals ⇢ arch, dark_oak_log dressing, door, lantern | same as v1 | **S** (R-agg) | as v1 |
| 2 | WALL | replace | uniform stone_bricks, no contrast ⇢ cobblestone field, quoin reads | same as v1 | **R** | as v1 |
| 2 | ROOF | replace | flat brown field, stepped verge ⇢ spruce_stairs courses, dark_oak trim | dark_oak vs grey | **S** (anchor) | as v1 |
| 3 | OPENING | replace | square-cut hole, no door ⇢ arched head, dark_oak_log frame, door | same as v1 | **S** (R-agg) | as v1 |
| 3 | WALL | replace | uniform stone-brick coursing ⇢ cobblestone field, stone_brick quoins | same as v1 | **R** | as v1 |
| 4 | OPENING | replace | rect notch, no door/frame/arch ⇢ arch, dark_oak_log jambs, door, lantern | same as v1 | **S** (R-agg) | as v1 |
| 4 | WALL | replace | uniform stone_bricks ⇢ cobblestone field (wall.field.ground), quoin contrast | same as v1 — judge **names the program role** | **R** | as v1; judge even cites `wall.field.ground`, confirming it knows the field is stone yet still tags replace |
| 5 | OPENING | replace | plain doorway, no head/surround ⇢ arch head, dark_oak_log jamb, door, lantern | same as v1 | **S** (R-agg) | as v1 |
| 5 | WALL | replace | uniform stone_bricks, no quoins ⇢ cobblestone field, quoin/dressing contrast | same as v1 | **R** | as v1 |
| 6 | OPENING | replace | rect void, no head/frame/door ⇢ arch, dark_oak_log frame, door | same as v1 (gable) | **S** (R-agg) | as v1 |
| 6 | WALL | replace | uniform stone_bricks as dressing ⇢ cobblestone field, rubble/cut-stone contrast | same as v1 | **R** | as v1 |
| 6 | ROOF | replace | correct stepping, brown plank field ⇢ spruce palette, dark_oak trim band | dark_oak vs grey | **S** (anchor) | as v1 |
| 6 | OPENING (slit) | replace | bare slit windows, no infill ⇢ spruce_fence infill, dark_oak_trapdoor shutter | bare slits; infill **additive** | **S** (R-agg) | additive gap mis-bucketed replace; in v1/v3 the *same* slit element is correctly `add` — the kind is **unstable across votes** |

### The 5 `add` items (NOT capping — included for contrast, correctly read)

v1 OPENING(slit), v3 OPENING(slit), v3 ROOF, v4 ROOF, v5 ROOF — all `add`/absent, additive gaps correctly
tagged. Note ROOF flips **replace (v1,v2,v6) ↔ add (v3,v4,v5)** for the *same* dark_oak-vs-grey divergence:
the judge's `kind` for one element is **non-deterministic across votes**, independent corroboration that the
tag is a weak discriminator (consistent with `replaceContrast = −0.20`).

## Counts

| Department | `replace` total | **R** | **S** | note |
|---|---|---|---|---|
| WALL | 6 | **6** | 0 | material matches concept → pure mis-read |
| OPENING (gable) | 6 | 0 | **6** | genuine missing arch/frame/door; R-aggravated styleClass |
| OPENING (slit) | 1 | 0 | **1** | additive gap mis-bucketed (v6); `add` in other votes |
| ROOF | 3 | 0 | **3** | legitimate dark_oak-vs-grey; the anchor |
| **TOTAL** | **16** | **6** | **10** | |

R/S split ≈ **6 / 10**. Not all-R, not all-S → both loci, with S the more frequent and R the more
*decisive-for-WALL* (WALL is 6/6 every vote, the most consistent cap contributor besides OPENING-gable).

## The locus decision — BOTH (with the load-bearing argument)

1. **R is required.** WALL (6/6) is a genuine mis-read: the build's wall is `stone_bricks`, which **is** the
   concept's field material (program `wall.dressing`); both concept and build are grey stone. A
   concept-conditional judge would tag the missing cobble quoins as `add` (recoverable), not `replace`
   (capping). Without this fix, WALL keeps emitting `replace` and keeps costing −32/vote. The cap fix alone
   leaves WALL mis-read.
2. **S is required.** The dark-oak roof is genuinely brown vs the concept's grey — a *correct* `replace`. So
   even a perfectly concept-conditional judge **must** tag ROOF:replace. Under the binary cap, that one
   legitimate `replace` (and the genuine missing-arch OPENING) still floors the build (−32 each; `score =
   min(score, 40)`). Concept-conditioning alone cannot lift matched while the cap is binary. The cap must
   become a **graded distance** so an otherwise-faithful build with one or two genuine divergences ranks well
   above a build wrong in every department.

**Mechanism confirmed in code (read-only):** feeding the 6 votes' `kind`/`severity` into
`styleFidelityScore` reproduces `[0,4,20,28,28,0]` exactly. The binding floor is the **forced 32-per-
`replace`** (`PENALTY.major 20 + WRONG_STYLE.distance 12`), severity-blind; the `cap=40` is secondary. So
S-181's graded term must soften the **per-replace forced-major penalty**, not only the cap.

## Falsifiable-claim outcome (anti-hedge)

The claim: *"the matched `replace` tags split cleanly R vs S, naming the locus."* **Outcome: they split, and
the split is BOTH** — WALL→R, OPENING/ROOF→S — exactly the epic's leading hypothesis, now on evidence. It is
**not** all-R (which would refute S-181's scoring path) and **not** all-S (which would mean the judge reads
fine). The named "ambiguous" failure mode is *partially* present and reported honestly: OPENING-gable and the
v6 slit carry **both** a wrong `styleClass` (R-component) and an additive divergence (S-component); they are
classed S-primary because the divergence is genuine and the cap is the binding defect, with the R aggravator
recorded. The judge contract **does** under-specify (no "right-base-material + missing-detail → `add`" rule),
which is itself a finding feeding S-181's R fix.

## Caveats

- **`expected` not persisted** — faithful targets sourced from program+pack roles; calls do not depend on
  the missing field.
- **Entanglement** — WALL/OPENING tags mix R and S signal; the primary+aggravator scheme reports this rather
  than forcing a false-clean split.
- **Breadth** — one subject, one matched concept, two wrong twins. This localizes the defect; it is **not** a
  population claim. A labeled multi-state corpus remains the real promotion bar (standing E-40 item; S-182
  must name it).
- **No fix here** — `measurements/` untouched; no `src/`/`baml_src/` change; `npm test` green.
</content>
