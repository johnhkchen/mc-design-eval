# T-182-01 — FINDINGS

**The recalibration WORKED at the mechanism level — and the scalar lands in the honest middle.** On the
re-calibrated style-distance term (T-181-01: graded cap + concept-conditional `DiagnoseBuild`), the same crater
that COLLAPSED at VOTES=6 in T-178-01 now **separates two-sided directionally**: matched lifts **13→41** while
the wrong-style twins **stay low** (19, 20) and **do not** rise. The headline is the discriminator sign flip —
`replaceContrast` went from **−0.20 (NO CONTRAST)** to **+0.245 (DISCRIMINATES)**: the matched build now earns
**0 `replace` tags against its own concept** (was WALL 6/6 + OPENING 6/6), and only the wrong-style twins skew
`replace`. **But** A−B=22 sits **outside the ±12 noise yet just SHORT of the strict 2·NOISE=24 crater bar**, and
the C-control exposes that the separation **rides substantially on the pack, not the concept image**. So:
**PROMOTE-LEANING, not a clean unconditional crater — advance to the labeled multi-state corpus as the deciding
gate; do NOT freeze.** (Anti-hedge: I am not inflating A−B=22 into "cratered" — the harness itself flags neither
`cratered` nor `collapsed` — nor burying the pack confound; and I am not understating a real, robust mechanism win.)

## The spread table (AC #2)

| run | build | VOTES | A-matched | B-arc | B2-chapelle | C-control | A−B | replaceContrast | result |
|---|---|---|---|---|---|---|---|---|---|
| T-173-01 PRIMARY | faithful | 2 | 28 | 0 | 20 | 8 | +28 | — | cratered (2-sample artifact) |
| **T-178-01** | faithful-covered | 6 | **13±12** | 0±0 | 0±0 | 5±7 | +13 | **−0.20** (NO CONTRAST) | **collapsed — no separation** |
| **T-182-01 (this)** | faithful-covered | **6** | **41±7** | **19±9** | **20±0** | **48±10** | **+22** | **+0.245** (DISCRIMINATES) | **separates above noise, below 2·NOISE bar** |

`NOISE=12`; noise band ±12; strict crater bar `A−B > 24`. **A−B=22 is ≈1.8× the noise band — real, robust
separation — but 2 points under the doubled-noise crater threshold.** A−B2=21 (same read). At the pessimistic
edges (`mean−std` for A, `mean+std` for B): A floor **34** vs B ceiling **28** — matched **still clears** the
wrong twin even at the variance edges. The direction is robust; the magnitude is marginal.

### Per-vote arrays (the variance story)

- **A-matched:** `[44,44,24,44,44,44]` → mean **41**, std **7**. Five votes at 44, one dip to 24. **Tight.**
- **B-arc:** `[28,20,20,28,4,12]` → mean **19**, std **9**. Noisier but never reaches A's level.
- **B2-chapelle:** `[20,20,20,20,20,20]` → mean **20**, std **0**. Dead-flat low.
- **C-control:** `[52,44,32,64,44,52]` → mean **48**, std **10**. Rustic-pack, classical concept — scores **high**.

Unlike T-178-01 (A's `[0,4,20,28,28,0]` straddled the floor — the 28 was a 2-sample fluke), matched is now
**stable high**: the 41 is not a draw artifact, it is five of six votes at 44.

## What drives it — the per-item `kind` audit (AC #2, the mechanism)

The decisive evidence, and the direct refutation of T-178-01's collapse signature. Aggregated tag distribution
across all 6 votes (`kindReliability.perCondition`):

| condition | nItems | add | **replace** | replaceRate | vs T-178-01 |
|---|---|---|---|---|---|
| **A-matched** | 25 | 25 | **0** | **0.00** | was WALL 6/6 + OPENING 6/6 `replace` → **now 0** |
| B-arc (wrong) | 25 | 19 | **6** | 0.24 | wrong-style twin still skews `replace` |
| B2-chapelle (wrong) | 24 | 18 | **6** | 0.25 | same |
| C-control | 21 | 21 | **0** | 0.00 | rustic pack → reads matched-like |

`replaceContrast = WRONG.replaceRate − MATCHED.replaceRate = 0.245 − 0.000 = +0.245` → **DISCRIMINATES**. In
T-178-01 this was **−0.20** (matched and wrong tagged ALIKE). **The R fix flipped the sign.**

Concrete element-level proof — the matched build's `OPENING`/`WALL`/`ROOF` against its **own rustic concept**:
- **T-178-01:** OPENING `replace`/wrong-style 6/6, WALL `replace`/wrong-style 6/6 (capping → floored the score).
- **T-182-01 (v1, representative):** OPENING `add`/absent, WALL `add`/absent, ROOF `add`/absent — **every item
  `add` (recoverable, non-capping).** The judge now reads the faithful stone wall and arched gate as *present
  and right, missing only detail* rather than *wrong-style present+missing*. That is exactly the
  concept-conditional behavior T-181-01's R fix was written to produce — and it is the live, metered confirmation
  that T-181-01 review concern #1 left open.

So matched lifts because it carries **zero wrong-style departments** (breadth 0 → no cap, score = `100 −
Σmissing-penalties` = ~41, docked only for incompleteness). The wrong twins stay low because they carry **1
genuine wrong-style department** (the rustic stone roof against a classical/gothic concept → `ROOF:replace`)
**plus** heavier missing-element penalties. The mechanism is correct and interpretable end-to-end.

## The caveat that blocks a clean PROMOTE — the pack confound (AC #4 sensitivity)

`spreads`: **C−B (pack effect) = +29**, while **A−C (concept-image effect) = −7**.

- Swap the **pack** (rustic→guildhall) holding the classical concept fixed: C=48 → B=19, a **29-point** drop.
- Swap the **concept image** (rustic→classical) holding the rustic pack fixed: A=41 → C=48, a **−7** move
  (within noise).

**The term's discriminating signal is the PACK (the recognized style spec), not the concept IMAGE.** A rustic
build scores ~high against ANY concept *as long as the pack is rustic* (A=41, C=48), and ~low against ANY concept
*when the pack is guildhall* (B=19). So the A−B=22 separation is **substantially a pack-material effect**, not a
build-matches-the-picture effect. In production this is partly benign — the pack is *derived from* the concept by
recognition, so pack and concept normally co-vary — but this fixture deliberately decouples them, and the term
follows the pack. This is precisely the falsifiable claim's "separation rides on [an over-fit to this fixture] →
report sensitivity" branch. **Reported, not buried.**

## Renders (AC #2)

Beside-concept composites written by the harness (no GL, no model):
- `docs/active/work/T-182-01/crater-matched.png` — rustic concept ‖ build (grey stone walls, arched gate match;
  the roof is brown dark_oak vs the concept's grey stone — the one genuine, recognition-stage divergence).
- `crater-wrongstyle.png` (B-arc classical) ‖ build; `crater-wrongstyle-2.png` (B2-chapelle gothic) ‖ build.
- Build azimuths: `builds/gatehouse/faithful-covered/view-{±x±z}.png`.

## Localization (AC #3) — recorded honestly

**Not non-separation** (T-178-01's branch): matched separates above noise and the per-item mechanism is fixed
(replaceContrast +0.245). The E-44/E-45 hypothesis — *the gate was the MEASURE; make it concept-conditional and
matched lifts* — is **confirmed** at the mechanism level. **Not over-softened** (the TIGHTEN branch): the
wrong-style twins did **not** lift (B=19, B2=20; both keep `replace`/`cap` firing) — the graded cap did not buy
back wrong-in-style. **But** the scalar separation is **marginal** (A−B=22 < 24) and **pack-confounded** (the
signal is the pack, not the picture). The honest class: **two-sided directional separation with a marginal,
pack-driven magnitude** — necessary, not sufficient.

## Recommendation (AC #4) — PROMOTE-LEANING; gate on the labeled corpus; DO NOT FREEZE

1. **The recalibration is validated and should stand in the creation loop.** Matched 13→41, replaceContrast
   −0.20→+0.245, matched `replace` 12/12 → 0/25. The T-178-01 collapse is gone. T-181-01's S+R fixes are doing
   exactly what the AUDIT predicted. No revert; no further re-localization of the measure is warranted.
2. **Do NOT promote into the frozen instrument yet — two reasons, both pre-registered as "necessary not
   sufficient":**
   - **Magnitude:** A−B=22 clears the noise but misses the strict 2·NOISE=24 crater bar by 2 points. A
     promotion bet should not ride a 2-point margin on one subject.
   - **Pack confound:** the separation tracks the pack, not the concept image (C−B=29 vs A−C=−7). The term must
     be shown to discriminate on the **picture** across a population, not just on pack-material agreement.
3. **The deciding gate is the labeled multi-state corpus** — E-40's standing debt, restated in T-181-01 review
   concern #4 and the AUDIT. One subject + 2 wrong-style concepts is a sharp diagnostic, not a population test.
   The promotion bar is: the term agrees with human pairwise labels across the labeled corpus, with the
   concept-image (not just the pack) carrying the signal. **That corpus run — not another gatehouse re-run — is
   the next ticket.**
4. **Breadth caveat (mandatory):** this is one subject (gatehouse), ~2 wrong-style concepts (classical arc,
   gothic chapelle), one matched concept. It is **necessary, not sufficient**. A clean two-sided result here was
   the gate to *attempting* promotion; it does not itself license the freeze.

### The exact freeze step — IF a future corpus run confirms (spelled out, UNEXECUTED)

The style-distance term is **not yet in the frozen instrument** (`grep` over `measurements/` for
`styleFidelityScore`/`itemStyleClass`/`DiagnoseBuild` is empty — promotion would be an **ADD**, not an edit).
The guarded freeze, when licensed, is:
- **Files:** the recalibrated scorer `src/workshop/bakeoff-score.mjs` (constants `WRONG_STYLE = {cap:40,
  distance:12}`, `PENALTY = {major:20, minor:8}`, `styleFidelityScore`/`itemStyleClass`/`gradedCapFor`) and the
  concept-conditional `DiagnoseBuild` prompt in `baml_src/department.baml` (golden
  `src/baml/fixtures/diagnose/prompt.golden.txt`).
- **Pin:** wire a frozen copy under `measurements/` (a new `measurements/style-distance/` baseline + golden) and
  add it to the **PinGuard allowlist** so the instrument is byte-reproducible and guarded against drift.
- **Owner:** a dedicated promotion ticket that runs the labeled-corpus validation FIRST and only then executes
  the pin. **This ticket does not execute it; `measurements/` is untouched.**

## Anti-hedge note

This is **not** the embarrassing branch (T-178-01 was) — but I have not let that pull me into overclaiming. The
genuine win is the mechanism (replaceContrast sign flip, matched `replace`→`add`, 13→41 lift) and it is robust
across 6 votes. The genuine shortfall is honest too: A−B=22 misses the strict crater bar, and the C-control
proves the separation rides on the pack rather than the picture. Both are stated at full strength. The
recommendation follows the evidence to the middle register the project's calibrated-honesty directive asks for:
**the measure is fixed and discriminating; the promotion bar is the labeled corpus, not this fixture.**
