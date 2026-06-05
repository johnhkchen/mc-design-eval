# Design Document — "Pineapple" Freestanding Block Sculpture

## 1. Read of the subject
A pineapple is two stacked masses: a **fat ovoid fruit body** below and a **spiky fan of stiff leaves** above. Instant recognition comes from (a) the crosshatched, pinecone-like diamond skin and (b) the radiating crown of pointed green fronds. Get those two and a viewer names it before anything else.

## 2. Form & proportion (in the round)
Total height ≈48. Split **~30 body : ~18 crown** (a touch under 2:1 — the crown must read tall, not a tuft). Body is a near-circular ovoid in plan, widest at mid-height (~22 blocks diameter), tapering to a rounded ~12-wide base and a narrower ~14 shoulder where the crown springs. Built radially symmetric so FRONT, SIDE, and 3/4 all show the same bulging barrel + spiky top — no "good side." The crown is a star of stepped leaf-blades pointing up and outward, longest in the center. Footing: the body sits flat on a 12-wide rounded base ring, low center of mass, stable — bottom-heavy fruit, not top-heavy.

## 3. Color palette (color theory)
**Analogous warm harmony** (yellow→orange→green), the natural pineapple ramp; warmth makes the fruit feel ripe.
- **Dominant — body:** `honey_block` (golden-amber, the ripe skin).
- **Supporting — diamond grid:** `orange_terracotta` (recessed crosshatch shadows, warm).
- **Supporting — crown:** `green_concrete` (saturated leaf field).
- **Accent — frond tips/highlights:** `lime_concrete`, used sparingly at leaf edges.
Analogous + one brighter accent = unified but not flat.

## 4. Surface & motifs
**Motif 1 — diamond crosshatch:** a bold lattice of `orange_terracotta` blocks set one-deep into the honey body on a 2–3 block diagonal grid, wrapping fully around — the signature texture, designed at whole-block scale so it survives. **Motif 2 — bladed crown:** alternating `green_concrete` / `lime_concrete` columns stepped to points, gaps between blades for a spiky silhouette.

## 5. Block-budget plan
~30 vertical on the ovoid body (widest band the crosshatch), ~18 on the crown blades. Footprint capped near 22×22 at the belly so it stays compact and reads cleanly on a turntable from every angle.
