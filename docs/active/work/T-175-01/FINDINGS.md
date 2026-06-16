# T-175-01 — FINDINGS: the compositional treatment grammar on the gatehouse (the glance call)

**The render is the judge.** Two panels in this dir, each the 4 gate azimuths beside the concept:
`baseline-beside.png` (the token E-42 "before") and `treated-beside.png` (candidate A at readable amplitude).

## What the render shows

| layer | brush | cells | reads? |
|---|---|---|---|
| base (water-table) | surface.relief @ floor | 60 | yes — a cobblestone ground-line course on all four faces |
| field | (recess by exclusion) | 0 | yes — the `stone_bricks` field sits visibly back between the proud dressing |
| corners (quoins) | quoin, full-height hd2 | 120 | **yes — the loudest read**: serrated rubble quoins up every corner |
| top (cornice) | surface.relief @ eaveY, corner-excluded | 52 | yes — a cobblestone eave band, crisp against the dark roof, not colliding with the quoin tops |
| opening (arch reveal) | dress-openings (injected) | 24 | yes — dark timber frame + door + lantern in the gate/windows |

Base 2287 → treated 2515 cells (+228). **Closure: ok, 1.0000 → 1.0000, 0 columns dropped** — the recess
did NOT reopen holes (AC met). `reliefNoRegress`: every face's perpendicular extent *widens* (honest visible
relief — proud quoins on every corner); `ratiosPreserved=false` is the same widening read through the
height-ratio lens — **evidence, not the gate** (the closure guard is the gate, and it holds).

## The busy-vs-rich call (the AC's honest record)

**Richer, clearly — a dramatic step up from the token box, not busy.** Side by side: the baseline is the
plain grey box the epic names (token quoin nubs only at the base corners); the treated build reads as a
*rusticated stone gatehouse* — full-height rubble quoins, a plinth, an eave band, dressed openings, a
recessed dressed-stone field. This validates E-43's decision #1 (**amplitude is first-class**): the jump is
token → amplified, exactly as the T-174-01 spike predicted.

**Where it sits near the busy edge — localized (amplitude, not composition):** the quoins' alternating
stretcher/header schedule (`headerDepth:2`) makes a *serrated* corner (a zigzag) that is the single boldest
element. It reads as deliberate heavy rustication, not noise — but it is the one knob a reviewer might pull
back (hd2 → a flusher hd1, or the spike's B explored hd3 louder). **Composition is restrained on purpose:**
no mid-field string course (B's busy tell), so the field stays calm and the recess reads. So the residual
busy-risk is *amplitude on one layer*, not *too many layers*.

**The one taste call the reviewer owns** (the epic says the glance owns it): is A's serrated hd2 quoin right,
or should it be flusher (hd1) / bolder (hd3)? My read: hd2 is the right rustic amplitude for this concept —
bold enough to read at the glance, coherent enough not to be noisy. The spec exposes `headerDepth` so this is
a one-line change + re-render, no code.

## Material note (a real lesson, recorded)

The wall band is entirely `stone_bricks`. `surfaceRelief` skips a source cell already carrying the relief
material (the clinker no-re-emit rule), so a **same-material** base/cornice course emits *nothing*. The fix
is grammar, not a hack: the **rubble dressing (`cobblestone`) treats every edge** (corners, base, cornice)
against the **dressed-stone field (`stone_bricks`)** — which both READS (geometry + the rubble texture
contrast) and is concept-faithful (the concept's quoins are rubble). A treatment whose edge material equals
the field material is a silent no-op; sourcing (S-176) must pick an edge material distinct from the field.

## Generalization (named, not hidden — for S-176)

- `deriveEdges` is unit-tested on **square, rectangle, and with-opening** synthetic geometries (TG1–TG3) —
  the edge derivation is genuinely geometric (corners from footprint extrema, not an assumption of squareness).
- **Untested: two-mass / L-mass plans and gable rakes.** The gatehouse is one clean box. The cottage's two
  perpendicular masses and any L-corner are where "edge-derivation breaks on hard geometry" (the epic's named
  risk) would show — **deferred to S-176**, which must retest `deriveEdges` on the cottage before trusting
  generality. The footprint-bbox corner model gives 4 corners for a rectangle; an L-mass has 6 — that is the
  first thing S-176 must confirm or fix.
- **Roof + opening generalization** (eave/verge overhangs, ridge trim; opening reveal/arch as the same edge
  vocabulary) is **S-176** by the epic's plan — not attempted here. The opening reveal is already proven via
  the injected `dressOpenings`; extending the *same* `edges`-from-geometry engine to the roof is the open work.

## Verdict against the falsifiable claim

The claim: the chosen approach at readable amplitude makes quoins, trim band, recessed field, and the arched
reveal **read**, a clear step up from token relief, without regressing closure. **Held:** all four read on
the render; closure 1.0→1.0 (no regression); it did **not** read busy (restraint kept; the one near-edge is
quoin amplitude, a tunable knob). The named residual risk (generalization past this geometry) is real and
routed to S-176.
