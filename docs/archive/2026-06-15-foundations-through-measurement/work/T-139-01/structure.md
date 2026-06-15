# T-139-01 Structure — file-level blueprint

Four files touched. One pure module, its test, the frozen prose, and (no) records. No new files in
`src/`; the fixture lives inside the existing test file as pinned data.

## 1. `src/form/silhouette-proportion.mjs` — MODIFY (the only logic change)

### 1a. `PROPORTION_DEFAULTS` (~line 41) — add one frozen param
Add a single key, documented inline in the same voice as the neighbours:

```js
skirtBandFrac: 0.2, // a bottom-anchored band within this fraction of the silhouette height that is
//                     wider than the body above it is a plinth/skirt, not the eave (T-139-01); the
//                     protrusion threshold reuses eaveWidthFrac (a skirt pokes beyond the body's
//                     own eave-tolerance band). skirtBandFrac 0 ⇒ the legacy ruler exactly.
```
No other default changes. `eaveWidthFrac`, `ridgeMinWidthFrac`, `maxExtent` semantics untouched.

### 1b. `maskProportions(mask, opts)` (~line 125) — skirt-aware eave reference
The single edit site. Module-internal, signature **unchanged** (callers untouched). Steps:

1. Keep the existing `extents[]` / `maxExtent` pass verbatim (ridge and reporting keep the global
   `maxExtent`).
2. Read `eaveFrac`, `ridgeFrac` (existing) and the new `skirtBandFrac = opts.skirtBandFrac ??
   PROPORTION_DEFAULTS.skirtBandFrac`.
3. Derive the eave **reference extent** and a `skirt` predicate, in a small pure helper (below):
   - `firstFg` / `lastFg` = first/last index with `extents > 0` (note: `lastFg` equals the loop's
     `groundRow`; reuse the same scan rather than re-finding it).
   - `H = lastFg − firstFg + 1`; `bandRows = Math.floor(skirtBandFrac × H)`;
     `bottomStart = lastFg − bandRows + 1`.
   - `bodyMax` = max `extents[y]` for `y ∈ [firstFg, bottomStart)` (the body above the region; `0`
     when the region covers everything).
   - `skirtThresh = bodyMax / eaveFrac`.
   - `isSkirt(y) = bottomStart > firstFg && y ≥ bottomStart && extents[y] > bodyMax && extents[y] ≥
     skirtThresh`.
   - `anySkirt` = `isSkirt(y)` for any `y` in the bottom region; `refExtent = anySkirt ? bodyMax :
     maxExtent`.
4. In the existing downward assignment loop, change the eave test only:
   `if (eaveRow < 0 && !isSkirt(y) && e >= eaveFrac × refExtent) eaveRow = y;`
   Ridge and ground tests **unchanged** (`ridgeFrac × maxExtent`).
5. Return shape **unchanged** (`{ridgeRow, eaveRow, groundRow, totalH, eaveH, maxExtent}`). Do NOT
   add `refExtent`/`skirt` to the return — keeps every downstream record byte-stable; the witness
   and conformance serializers iterate the existing shape. (If a future ticket wants to surface the
   skirt, that is its call; here we minimize the blast radius.)

**Factor a tiny pure helper** `eaveReference(extents, maxExtent, {firstFg, lastFg, eaveFrac,
skirtBandFrac})` returning `{refExtent, isSkirt}` (a closure or `{refExtent, skirtRows:Set}`), so the
detection is unit-testable in isolation and the main loop stays readable. Keep it module-private
(not exported) unless a test needs it — prefer testing through `maskProportions`.

Comment the DETECTION RULES block at the top of the file (~lines 15–21) to describe the skirt
exclusion in the same frozen-op-parameter voice.

### 1c. Everything else in the module — NO CHANGE
`elevationMask`, `planMask`, `ratiosFromMask`, `proportionRatios`/`ratiosOver` (min-eave/max-total
assembly already consumes the corrected per-view `eaveH`), `deriveProportionDeclarations`,
`compareRatios`, `assertProportionDeclarations` all unchanged. The concept side automatically
inherits the skirt rule (one rule, two substrates) with no edit.

## 2. `src/form/silhouette-proportion.test.mjs` — MODIFY (add coverage; keep SP1–SP12)

SP1–SP12 stay **untouched and green** (no skirt in their fixtures — proven). Append a new section
`// --- skirt-aware eave (T-139-01) ---` with:

- **`COTTAGE_X_EXTENTS` / `COTTAGE_Z_EXTENTS`** — the real pinned row-extent arrays of the committed
  cottage final artifact (row 0 = top), with a `maskFromExtents(extents, w)` helper (centered fill,
  image-style bbox — mirrors `triangleOnBoxMask`). This is the "elevation masks pinned as a fixture"
  the AC allows, kept pure (no `benchmarks/` read).
- **`plinthHouse({ plinth })`** occupancy fixture — `gableHouse` plus a 1-block-wider course at the
  base (the general, non-subject skirt). Built with `occupancyFromCells` like `gableHouse`.

New tests (names indicative):
- **SP13 — skirt never reads as the eave (cottage masks):** `maskProportions(cottageX)` ⇒
  `eaveRow` at the wall top (`eaveH 21`, not 4), `ridgeRow`/`maxExtent` unchanged; same for
  `cottageZ` (`eaveH 12`). Assert the hand-assembled family `min(eaveH)=12, max(totalH)=22 ⇒
  ridge:eave ≈1.833, roofShare ≈0.4545` — the corrected family, explicitly NOT 5.5/0.818.
- **SP14 — both rulers, side by side (monotone knob):** `maskProportions(cottageX, {skirtBandFrac:
  0})` reproduces the **legacy** line byte-for-byte (`eaveH 4`); the default corrects it. This is
  the AC #2 "both rulers reported" mechanism in a test.
- **SP15 — skirt-free mask unchanged (barn-shape) & degenerate preserved:** a synthetic mask with a
  high 1-row eave overhang above wider-spanning walls (the barn shape) derives identical lines under
  default and `{skirtBandFrac:0}`; `maskProportions(null)`, empty, and single-row masks still return
  `null`/null-constituents (AC #3 degenerate clause).
- **SP16 — assembly corrects through `proportionRatios`:** `plinthHouse()` corrects to the
  wall-anchored family while the same house without the plinth is byte-identical to `gableHouse`.

## 3. `packs/README.md` — MODIFY (frozen prose, AC #1)

In §"Proportion conformance", extend the **eave** bullet (lines ~28–30) with the skirt exclusion as
a declared op parameter: "…a *plinth/water-table course* in the bottom `skirtBandFrac` (0.2) of the
silhouette that is wider than the body above it is **not** the eave — the eave anchors on the
dominant wall band, never on a sub-wall skirt (T-139-01). The protrusion threshold reuses
`eaveWidthFrac`." One or two sentences; matches the existing frozen-rule voice. Ridge bullet
unchanged.

## 4. `benchmarks/sculpture/proportion/*.json` — NO CHANGE (explicit)

Committed witness records keep their old numbers (pin-guard protected; T-143 owns the re-verdict).
Not part of `npm test`. The monotone proof in design.md/review.md *states* the sweep result rather
than rotating any record.

## Ordering of changes

1. `PROPORTION_DEFAULTS` + `maskProportions` (1a, 1b) — the logic.
2. Tests (2) — SP13–SP16; run `npm run test:unit` green (SP1–SP12 must also stay green).
3. `packs/README.md` (3) — the frozen prose.
4. `npm test` full — the AC gate.

Each step is independently committable; step 1+2 is the atomic core, 3 is docs, 4 is verification.

## Interfaces & boundaries (unchanged)

- `maskProportions` public signature and return shape: **unchanged.**
- `proportionRatios`, `compareRatios`, `deriveProportionDeclarations`: **unchanged** — they consume
  the corrected `eaveH` transparently.
- No new exports required. The fix is one internal helper + one threshold swap, fully contained in
  the pure module. Workshop loop, conformance gate, witness runner, judge seam: **not touched.**
