# T-160-02 Progress

## Step 1+2 — pure wall-skin brush + WS unit tests ✅

- `src/view/wall-skin.mjs` — `wallSkinPlan` (roles→`{brush,params}[]`), `wallSkin` (occ→occ via
  `applyArticulation` + injected dressing seam), `packTreatments`, `isBoardFamily`, local `overlay`.
- `src/view/wall-skin.test.mjs` — WS1–WS12 (12 tests). `npm run test:unit` **2184/2184 green**.

### Deviations from plan/structure (documented)
1. **Plinth via `eave-overhang`, not `surface.relief`** (structure.md said surface.relief). `eaveOverhang`
   is exactly "a proud course at a named row" — cleaner than wiring a one-row `surface.relief` rhythm. Same
   geometry (a proud base belt-course), one fewer param. Both are registry passes through the door.
2. **Opening-dressing is a DEPENDENCY-INJECTED seam, not an in-brush import.** The brush-door conformance
   tripwire forbids a `src/view` brush importing the `opening-dressing` technique directly (register/door
   only). `extractApertures`/`dressOpenings` can't ride `applyArticulation` (3-arg signature) and
   `extractApertures` isn't a registered brush — so `wallSkin` takes them as injected params; the runner
   (experiments/, unswept) passes the real fns. Absent injection ⇒ relief skin only (still construction).
   The relief brushes (fill/clinker/quoin/limewash/eave-overhang) all reach through the door via
   `applyArticulation`, so no technique import is needed for them. Conformance: **3/3 green**.
3. **Relief capped to the wall band** (`floor ≤ y ≤ eaveY`): `limewashAspect`/`zoneFill` have no y-gate, so
   a whole-aspect coat / "upper" zone would climb a gable slope on the weather face. Filter once in
   `wallSkin` — guarantees the roof is never skinned (WS10), keeping the roof-prism strictly T-160-03's.
4. **WS9 idempotence scoped to the relief skin.** `dressOpenings` legitimately differs on re-run (a
   re-dressed jamb changes a lantern's free cell), so the construction-idempotence claim excludes the
   joinery overlay; full-skin **determinism** still asserted.

### Smoke evidence (real packs/programs)
- `wallSkinPlan(barn--saltcrag, saltcrag)` → quoin + limewash + plinth (no fill: ground==upper stone; no
  clinker: stone upper). `wallSkinPlan(cottage, rustic)` → per-storey fill (stone/plaster) + quoin + plinth.
  These are the right recipes: the cottage gets its **stone base + plaster upper** (the T-160-01 monotone
  PALETTE fix) + dressed quoins; the saltcrag barn gets quoins + limewash + plinth over a stone field.
- `packTreatments(saltcrag)` → door/shutter/glazing/lintel/lantern; `(rustic)` → door/shutter/fence(infill).

## Step 3 — wire into autonomy-loop.mjs ✅

`construct_walls` = envelope (`constructWalls`) → `wallSkin` (relief + injected dressing); `loadPack`;
dropped hardcoded `wallField` (now the pack ground role); added `barn--saltcrag` witness subject + batch
queue; MENU updated. `node --check` + dry-run on the witness clean. Commit `ddf4b33`.

## Step 4–5 — volume batch + beside renders ✅

GL confirmed (`render/src/headless-canvas.mjs` GL_AVAILABLE:true). Batch (4 subjects): cottage −2, barn
+33, gatehouse +21, barn--saltcrag −37; mean +3.8, 2/4. `skin-beside.mjs` rendered all four beside concept.
Renders read: cottage skin = stone base + plaster upper + quoins (no longer monotone); barn = base+quoins
under a dominant roof; gatehouse = bare envelope (no skin); barn--saltcrag = gappy colonnade (sparse shell).
Commit `2ac0286`.

## Step 6 — review ✅

`review.md` written. Verdict: skin reads as construction on a closed envelope (cottage render proves it),
but the eval is roof-capped + blind to wall relief (→ S-161), and the skin is wasted on a sparse shell
(the envelope gap, T-160-01 follow-up #2). Honest mixed result; both named failure modes landed.
