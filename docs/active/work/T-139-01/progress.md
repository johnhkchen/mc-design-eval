# T-139-01 Progress — Implement

## Status: COMPLETE — all plan steps executed, `npm test` green (2013 pass, 0 fail).

## Step 0 — Baseline ✓
SP1–SP12 green before any change. Confirmed legacy reads: cottage masks `eaveH 4` (both views) ⇒
5.5 / 0.8182; barn 2.1667 / 0.5385. (Prototyped against the real committed artifacts cottage,
barn, barn--saltcrag — Design table.)

## Step 1 — Skirt-aware eave reference ✓
`src/form/silhouette-proportion.mjs`:
- Added `skirtBandFrac: 0.2` to `PROPORTION_DEFAULTS` with inline doc.
- Added module-private pure helper `eaveReference(extents, maxExtent, firstFg, lastFg, eaveFrac,
  skirtBandFrac) → {refExtent, isSkirt}`. A skirt = a bottom-`skirtBandFrac` row strictly wider
  than the body above it, beyond the body's eave-tolerance band (`bodyMax / eaveFrac`, reusing
  `eaveWidthFrac` — no new protrusion constant). `refExtent === maxExtent` whenever no skirt
  qualifies.
- `maskProportions`: captured `firstFg`/`lastFg` in the existing extent scan; changed ONLY the eave
  test to `!isSkirt(i) && e >= eaveFrac × refExtent`. Ridge/ground/return-shape unchanged (ridge
  keeps the global `maxExtent`; the return object is byte-stable for downstream serializers).
- Updated the file-top DETECTION RULES comment.

**Verified (scratch, deleted):** cottage 5.5/0.8182 → **1.8333/0.4545**; barn & barn--saltcrag
**byte-identical** (skirt=false, refExtent=maxExtent); gableHouse/triangleOnBox identical.

## Step 2 — Tests SP13–SP16 ✓
`src/form/silhouette-proportion.test.mjs` (SP1–SP12 untouched):
- `maskFromExtents` + pinned **real** cottage elevation extents (`COTTAGE_X_EXTENTS` /
  `COTTAGE_Z_EXTENTS`) + `plinthHouse({plinth})` occupancy. All pure (no benchmarks/ read).
- **SP13** cottage masks → corrected family (eaveH 21/12; assembled 1.8333/0.4545; asserts not 5.5).
- **SP14** both rulers: `{skirtBandFrac:0}` reproduces legacy eaveH 4; default corrects.
- **SP15** skirt-free byte-identity (high eave overhang kept, eaveRow unchanged) + degenerate
  (null/empty/single-row) preserved.
- **SP16** assembly: `proportionRatios(plinthHouse())` 2/0.5 (corrected) vs `{skirtBandFrac:0}`
  10/0.9 (legacy); plinth-free house byte-identical to `gableHouse`.

## Step 3 — Frozen prose ✓
`packs/README.md` eave bullet rewritten: eave anchors on the dominant **wall band**, a bottom
`skirtBandFrac` (0.2) plinth is a **skirt** never the eave (T-139-01); protrusion reuses
`eaveWidthFrac`; `skirtBandFrac` 0 = legacy ruler ⇒ skirt-free masks byte-identical. Removed the now
-false "the cottage's squat read measured honestly" parenthetical (that read was the bug).

## Step 4 — Full gate ✓
- `npm test` → **2013 pass, 0 fail**.
- Witness records `benchmarks/sculpture/proportion/*.json` **untouched** (git clean) — no pin
  rotation; T-143 owns the terminal re-verdict.
- Diff scope = the module, its test, packs/README.md. No judge/pin/loop/conformance code touched.

## Deviations from plan
- **Single atomic commit instead of three.** A sibling thread (T-140-01, ruler-calibration) is
  concurrently editing the SAME module (`silhouette-proportion.mjs` — adding lens/tolerance/pitch
  surface). T-139 and T-140 share this file (a missing DAG edge — both are E-34 instrument fixes).
  Interactive hunk-staging is unavailable in this environment, and a test-without-source
  intermediate commit would be broken. So Steps 1–3 are committed together from the current
  all-green working tree (a consistent snapshot — 2013 tests pass, so the shared file is not in a
  mid-write break). The sibling's additive edits ride along; its remaining work lands in its own
  later serialized commit. No logic conflict: the two changes occupy disjoint regions
  (`eaveReference`/`maskProportions` eave test vs `PROPORTION_LENS`/`TOLERANCE_CALIBRATION`/pitch).

## Verification summary
| check | result |
|-------|--------|
| cottage corrected (not 5.5) | 1.8333 / 0.4545 ✓ |
| barn / barn--saltcrag identical | ✓ (skirt=false) |
| gableHouse / triangleOnBox identical | ✓ |
| both rulers (skirtBandFrac 0 = legacy) | ✓ SP14/SP16 |
| degenerate masks preserved | ✓ SP15 |
| witness records untouched | ✓ |
| `npm test` | 2013 pass / 0 fail ✓ |
