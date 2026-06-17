# T-178-01 — FINDINGS

**The crater did NOT confirm — it COLLAPSED at VOTES=6. The bet failed in its named failure branch: the
gate is the MEASURE (the term's `replace`→cap mechanic is not concept-conditional), not the build.**
T-173-01's 28-point separation was a VOTES=2 sampling artifact. On the fully-faithful S-177 build at
**VOTES=6**, matched scores **A=13±12** and its wrong-style twin **B=0±0** — spread **A−B=13, *inside* the
±12 noise band** and far below the 2·NOISE=24 crater bar. Recommendation moves from T-173-01's
**PROMOTE-PENDING-CONFIRMATION** to **DO-NOT-PROMOTE / RE-CALIBRATE**.

## The spread table (the headline, AC #2)

| build / run | A-matched | B-arc | B2-chapelle | C-control | A−B | crater? |
|---|---|---|---|---|---|---|
| E-40 baseline (old build, VOTES=2) | 2 | 0 | 2 | 0 | 2 | collapsed (both floored) |
| T-170-02 (old build, typed kind, VOTES=2) | 8 | 14 | 18 | 46 | −6 | no (matched < wrong) |
| **T-173-01 PRIMARY** (material-faithful, prism roof, **VOTES=2**) | **28** | **0** | 20 | 8 | **+28** | CRATERED (fragile) |
| **T-178-01** (fully-faithful covering roof, **VOTES=6**) | **13±12** | **0±0** | **0±0** | **5±7** | **+13** | **DID NOT CRATER** |

`NOISE=12`; crater bar `A−B > 24`. **A−B=13 is inside the ±12 noise**; at `mean−std` (13−12=1) it is
effectively zero. Not a separation.

### Per-vote scores (why the 28 was an artifact)

- **A-matched:** `[0, 4, 20, 28, 28, 0]` → mean **13**, std **12**.
- **B-arc:** `[0, 0, 0, 0, 0, 0]` → mean **0**, std **0** (floored every vote).
- **B2-chapelle:** `[0, 0, 0, 0, 0, 0]` → mean **0**, std 0.
- **C-control:** `[8, 20, 0, 4, 0, 0]` → mean **5**, std **7**.

T-173-01's A=28 was the mean of just `{40, 16}` — a 2-sample draw from this same `[0..28]` distribution that
happened to miss the four low votes. **The VOTES=2 crater was substantially a sampling artifact**, exactly
the fragility T-173-01 flagged ("VOTES=2 variance is large… a 1-`replace`-tag coin-flip"). Tightening the
mean did not confirm the crater — it dissolved it.

## What actually drives it — the per-item `kind`/`styleClass` audit (AC #2)

The decisive evidence. Against its **own rustic concept**, the fully-faithful build earns:

- **WALL : replace / wrong-style — 6/6 votes** (every vote)
- **OPENING : replace / wrong-style — 6/6 votes** (every vote)
- **ROOF : replace / wrong-style — 3/6 votes** (v1, v2, v6); ROOF : add / absent on v3, v4, v5

Against the **classical wrong-style concept (B-arc)** the build earns the **identical department pattern**:
ROOF + WALL + OPENING all `replace`, every vote. **The matched and wrong-style conditions tag ALIKE.**
`kindReliability.replaceContrast = −0.20` → verdict **NO CONTRAST** (the typed `kind` does not separate the
classes; the wrong-style twin does not skew `replace` *more* than matched — it skews the same).

This is the **collapse signature** the harness names: `styleFidelityScore` caps the score whenever
`itemStyleClass` returns `wrong-style` for any item, and the judge (Layer A) emits `replace/wrong-style`
for the matched build's WALL and OPENING **against its own concept** — so the cap floors both conditions and
the score cannot separate the correct pairing from the wrong one. (A=13 just clears the `≤NOISE` collapse
sentinel because two votes briefly scored 28; the harness reports it as "DID NOT CRATER," which is the same
non-separation read.)

## Localization: term-scale (the measure), not the build (AC #3)

The ticket's falsifiable claim listed two failure branches. The evidence lands **squarely in the
"separation collapses at higher votes → gate = term distance scale, not build → re-calibrate"** branch, with
a partial, secondary build caveat:

1. **PRIMARY — the measure is the gate.** A and B produce the *same* WALL+OPENING+ROOF `replace` pattern on
   the *same* physical renders; only the concept image and pack differ. A correctly-scaled, concept-conditional
   judge would read the rustic stone build's WALL as **faithful against the rustic concept** and wrong only
   against the classical one. Instead it reads WALL:`replace` against **both**. The discriminator is broken:
   Layer A fires `replace/wrong-style` on present-but-imperfect elements **without conditioning on whether the
   element matches the concept**, and the `itemStyleClass` cap then floors everything. This is a *measure*
   defect, robust across 6 votes (B std=0), not a build defect.

2. **SECONDARY — a real roof-material divergence (named honestly).** The beside-concept glance shows the
   concept's roof is **grey stone** stepped while the build's roof is **brown dark_oak** (the recognition
   program's material — the build is faithful to the *program*, not to the concept's roof color). So
   ROOF:`replace` on 3/6 votes is **arguably correct**. But this explains only the *roof's* flicker; it does
   **not** explain WALL:`replace` 6/6 (grey stone in both concept and build) or OPENING:`replace` 6/6 (the
   arched gate is present and stone in both). The dominant, consistent caps are the measure over-firing.

**The T-173-01 hypothesis is refuted.** It predicted "a fully faithful build would clean those residual
`replace` tags, lift matched, and separate more robustly." Removing the prism roof (S-177) did **not** lift
matched — WALL+OPENING `replace` stayed 6/6 and the roof's improvement (replace 3/6, down from the prism's
near-constant replace) was not the binding constraint. **The residual gate was never the build; it is the
measure.** Raising votes did not confirm the crater — it exposed the non-separation.

## Renders (AC #2)

- `docs/active/work/T-178-01/crater-matched.png` — concept (L: grey stone gatehouse, grey stepped roof,
  arched gate) vs build (R: grey stone walls, **brown dark_oak roof**, arched gate). The wall + gate match;
  the roof color diverges.
- `crater-wrongstyle.png` (B-arc, classical), `crater-wrongstyle-2.png` (B2-chapelle, gothic) — same build,
  wrong-style concepts.
- The build's four azimuths: `builds/gatehouse/faithful-covered/view-{±x±z}.png`; T-177-01's
  `beside-concept.png` mirrored at `docs/active/work/T-177-01/beside-concept.png`.

## Recommendation — DO-NOT-PROMOTE (re-calibrate the measure) (AC #4)

- **NOT PROMOTE.** The style-distance term does **not** separate the matched pairing from the wrong-style
  pairing on a fully-faithful build at tightened votes (A−B=13 inside ±12; replaceContrast −0.20). Promoting
  it into the frozen instrument now would freeze a term that cannot tell a right pairing from a wrong one.
  **No freeze step is spelled out — promotion is correctly blocked.** `measurements/` untouched.
- **RE-CALIBRATE the measure, not the build** — the localization the ticket asked to "localize precisely":
  - **Root cause:** Layer A (`DiagnoseBuild`) emits `kind:"replace"` / present+missing for elements that are
    *present and roughly right* but not pixel-identical to the concept, **without conditioning the
    `wrong-style` judgement on concept match**. `styleFidelityScore`'s hard cap on any one `replace` item then
    floors the score, so completeness/faithfulness cannot buy it back and matched ≈ wrong.
  - **Re-calibration targets (for a future owned ticket, not here):** (a) make the `replace`/`wrong-style`
    determination concept-conditional so a faithful element scores `add/absent` (recoverable) rather than
    `replace` (capping) when it *matches* the concept's material; and/or (b) soften the single-`replace`
    hard cap to a graded distance so one borderline tag does not floor a faithful build. The current binary
    cap + a non-discriminating tag is the mechanism that collapses the separation.
- **Secondary build follow-up (optional, lower priority):** the roof-color divergence (dark_oak vs the
  concept's grey roof) is a *recognition/material-map* fidelity gap, not a S-177 construction defect — the
  covering roof is structurally correct. If pursued, it belongs to the recognition stage's material
  assignment, not the crater term. It is **not** the reason the crater failed.

## Anti-hedge note

This is the bet's **embarrassing branch, reported in full** ([[anti-hedge-falsifiable-commitment]]). The
E-40→E-44 arc's working hypothesis — *a fully-faithful build + more votes → a robust crater* — is **refuted**:
the fully-faithful build did not lift matched, and more votes dissolved the prior crater rather than
confirming it. The gate was the measure all along. I did not soften this into a partial win: A−B=13 is inside
the noise, the per-item caps are identical for matched and wrong (replaceContrast −0.20, std 0 on B), and the
prior 28 is shown to be a 2-sample artifact. The single genuine build-vs-concept divergence (roof color) is
named, but it is secondary and does not rescue the separation. The honest, valuable localization: **the
style-distance term must be re-calibrated to be concept-conditional before it can be promoted; the build
side (S-177) is done.**
