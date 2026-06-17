# T-180-01 — Design

The work is a **classification decision**, not a build. The design question is: *what is the principled,
defensible rule that assigns each matched `replace` tag to R or S, and what artifact form makes the call
auditable?* Grounded in Research, not assumed.

## The classification rule (the core decision)

The ticket gives two loci with different fixes:

- **R — the reading.** Layer A tags `replace`/wrong-style on an element whose material **matches** the
  concept → a mis-read; fix is the **judge contract** (concept-conditional tag).
- **S — the scoring.** Layer A's content is **right** (genuine divergence, correctly named) but `kind`/
  `itemStyleClass` mis-buckets it and/or the single-`replace` **hard cap** floors an otherwise-faithful
  build → fix is the **scalar** (graded distance).

The discriminator that separates them is a single question per element, answerable from the build census +
program/pack (Research):

> **Is the build's actual material at this element in the *same style family* as the concept calls for?**
> - **YES** (faithful material, only a within-style *detail* missing) → calling it `replace`/wrong-style is
>   a **mis-read** → **R**. (A correct judge would emit `add` for the missing detail; the cap never needed
>   to fire.)
> - **NO** (genuinely wrong material vs the concept) → the `replace` read is **correct** → **S**. (The tag
>   is right; the defect is that one correct `replace` *floors* an otherwise-faithful build.)

Two refinements, stated up front (anti-hedge — the failure mode the ticket names is "ambiguous tags"):

1. **Entanglement is real and must be reported, not hidden.** A single tag can carry *both* a wrong
   `styleClass` (R-component) *and* a present-but-additive divergence that shouldn't cap (S-component). When
   that happens, assign the **primary** class by the *minimal fix that corrects the tag*: if reading it
   right alone yields `add` (no cap), it's R-primary; if the divergence is genuine and only the cap/bucket is
   wrong, it's S-primary. Note the aggravator explicitly.
2. **The dark-oak roof is the calibration anchor.** It is *known-legitimate* S (build genuinely brown
   dark_oak; concept genuinely grey). Any rule that classes the roof as anything but S is mis-calibrated —
   use it to check the rule.

## Why this rule (vs alternatives considered)

- **Alt A — pure keyword/string heuristic on present/missing.** Rejected: bakeoff-score.mjs explicitly
  forbids brittle keyword matching, and the text alone ("uniform stone_bricks") doesn't say whether stone is
  faithful — you need the program/pack to know stone_bricks *is* the field material. The census+program join
  is what makes the call defensible.
- **Alt B — trust `styleClass` as ground truth.** Rejected: `styleClass` is *derived from* `kind` (the
  thing under suspicion). Using it to classify the defect would be circular.
- **Alt C — re-run the judge with new votes to probe.** Rejected: the ticket forbids new metered votes, and
  the committed evidence is sufficient. Replay only.
- **Chosen — census-grounded same-family test, per the rule above.** It is the only option that (a) uses no
  new votes, (b) avoids keyword brittleness, (c) is reproducible from on-disk artifacts, and (d) the roof
  anchor can validate.

## Applying the rule (the decision, evidence in Implement)

| Department (votes) | Build material vs concept | Same family? | Primary | Aggravator |
|---|---|---|---|---|
| **WALL** (replace 6/6) | stone_bricks field = program field material; only cobble quoin *contrast* absent | **YES** (grey stone both) | **R** | S (missing quoins is additive, yet forced to replace+cap) |
| **OPENING gable** (replace 6/6) | opening present in stone; arch + dark_oak frame + spruce_door **genuinely absent** | opening right-material, dressing absent | **S** | R (`wrong-style` overstates an *undressed* — not wrong-style — opening) |
| **ROOF** (replace 3/6) | dark_oak (brown) vs concept grey-stepped | **NO** (brown≠grey) | **S** (legitimate) | — anchor case |
| **OPENING slits** (mostly `add`; replace 1/6 in v6) | bare slits, infill/shutter absent | right-material, additive | correctly `add` (not a defect); v6 lone `replace` = S/noise | — |

**Result: BOTH loci are active** — the epic's leading hypothesis, now confirmed on evidence. Not all-R
(WALL alone is R; refuting "scalar won't help" is itself refuted), not all-S (WALL is a genuine mis-read).

## Why the fork resolves to BOTH (the load-bearing argument)

The dark-oak roof proves **concept-conditioning (R) alone cannot lift matched**: even a perfectly
concept-conditional judge *must* tag ROOF:replace (brown vs grey is genuinely wrong material). Under the
binary cap, that one legitimate `replace` still floors the build (and contributes −32). So the **graded cap
(S) is required**. And the cap (S) alone is insufficient: WALL is a genuine mis-read (faithful stone tagged
wrong-style) — without concept-conditioning, WALL keeps emitting `replace` and keeps costing −32. So **R is
required too**. S-181 must do both; this is the decision T-180-01 hands forward.

## Deliverable form

A single `AUDIT.md`: (1) the per-vote, per-item table with `kind/styleClass/present/missing` quoted and the
R/S call + reasoning per element; (2) R/S counts per department; (3) the locus decision (BOTH) with the
roof-anchor argument; (4) the honest caveats (entanglement; `expected` not persisted; one-subject breadth).
Plus a small reproducible extraction note so the table can be regenerated from the JSON. No code change.
</content>
