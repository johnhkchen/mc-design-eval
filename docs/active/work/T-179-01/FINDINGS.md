# T-179-01 — FINDINGS: the two E-43 leaks close with one *profile* primitive (the glance call)

**The render is the judge.** Two witnesses in this dir:
- `verge-voussoir-beside.png` — the faithful gatehouse beside the concept (4 gate azimuths). The headline.
- `arch-head-synthetic-beside.png` — a synthetic arched passage, **bare void (left)** vs **voussoir-dressed
  (right)**, through the same compositor. The head mechanism witness.

## The claim, and how it could have failed

The falsifiable claim warned: *fails if the sloped-line / arc derivation needs element-local geometry the
footprint model can't supply — then the **edge classifier**, not the brush, is the sub-problem.* **That is
exactly what we found, and it is closable.** The wall/roof classifier vocabulary is `{corner column, top row,
bottom row}` — all flat. The missing piece is a **surface profile**: *the extreme cell along one axis, per
coordinate of a perpendicular axis.* One primitive names both leaks, and a flat row is its degenerate.

## 1. Raking verge — reads on the real gatehouse (AC1, AC2)

`deriveRakingVerge(occ, {ridgeAxis, eaveY, ridgeY})` walks the **top cell per across-coordinate** of each
gable-end slice → the sloped rake line. `composeRoofTreatment` now keys `surface.relief` to those 3-D rake
cells on the gable-end faces (was the 2-D column set).

Measured on the faithful gatehouse: **the old column-keyed course emitted 198 proud cells** (the whole
triangular gable-end face — the T-176 "heavy end band", which matched its recorded `verge=198`). **The rake
emits 34** — the sloped top board, `curve=true`. **~6× fewer cells, following the pitch.** On the render the
roof edges read as a lighter-stone course banding the dark roof along the slope — the concept's "lighter stone
eave/verge course banding the edges", as a crisp rake, not a heavy band. Closure ok (1.0000 → 1.0000).

## 2. Voussoir arch head — derivation + compositor proven; reads on synthetic arch (AC1, AC2, AC3)

`deriveArchHead(aperture)` walks the **crown air cell per opening column** (toward the lintel) → the voussoir
wedge stones tracing the curve. As columns move the crown varies for an arch (`curve=true`) and is constant
for a flat lintel (`curve=false`) — the **unification**: the flat head is the same primitive's degenerate.
`composeTreatment.edges.opening.voussoir` recolors those stones through the **injected** dressing seam (no air
op; recolor of existing wall-plane solids). On the synthetic arched passage the render shows the bare stone
void become a **dark-timber voussoir curve** over the opening (right vs left). `curve=true`, 6 voussoirs,
closure ok.

**Orientation was a real sub-bug, found and fixed:** real ±z apertures carry `av = world-y` increasing
**upward** (lintel at max av), opposite the simple synthetic case. `deriveArchHead` now reads the head
direction from the **lintel band**, not an assumption — so both orientations dress correctly (proven by TG24
synthetic + the live ±z synthetic render).

## 3. The honest negative — the faithful gatehouse gate is NOT an arch (the build gap, not the grammar gap)

`extractApertures` on the faithful build finds **4 rectangular ±z window slits and no arched aperture at all**
— the −x gate is not even detected as an opening (it is a passage, not a through-hole wall opening the
structural read recognizes). So the voussoir head **no-ops on the faithful build**: there is nothing arched to
dress. This is a **BUILD faithfulness gap** — squarely S-177's "one fully-faithful gatehouse / kill residual
prism" territory — **not** a treatment-grammar gap. The grammar gained the edge; the build doesn't yet carry
an arch to put it on. Recorded, not hidden, not faked: the head is witnessed on synthetic arch geometry and
proven by unit tests, and the gatehouse render honestly shows the verge (which the build *does* carry) but not
the head.

## 4. Did it read busy / regress closure? (AC4)

- **Closure**: not regressed on any build (wall, roof, synth-arch all `ok=true`, before==after==1.0000). The
  rake and the voussoir recolor are additive/replace — holds by construction, and the guard is asserted.
- **Busy?** The rake reads *crisper* than the T-176 band (198→34 cells), so the verge moves AWAY from busy.
  The voussoir curve is a single ring of stones — restrained, the curve the flat row could not name.

## Verdict against the falsifiable claim

- **The grammar gains a raking-verge edge and a voussoir head via the same vocabulary** — held. Both flow
  through `composeRoofTreatment` / `composeTreatment` and the existing `surface.relief` + injected seam; no new
  registry door, no air op.
- **Do they read on the render as crisp element edges?** The verge: **yes, on the real gatehouse**. The head:
  **yes, on synthetic arch geometry** (the faithful gate is square — a build gap named, not a grammar gap).
- **Edge classifier or brush?** The AC's open question, answered: **the edge classifier was the sub-problem**
  (the flat row/column/corner vocabulary genuinely cannot name a sloped line or a curve), and **one profile
  primitive — top-cell-per-across — closes both and generalizes** (a row is its degenerate). The E-43 "hard
  geometry" risk is made concrete and discharged.
