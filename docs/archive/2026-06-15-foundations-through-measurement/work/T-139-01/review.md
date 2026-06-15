# T-139-01 Review — skirt-aware eave detection

Handoff for a human reviewer. The work fixes the bent-ruler instrument defect named in the
T-138-02 review (finding 4): `maskProportions` mistook the E-33 cottage's plinth band for the eave.

## What changed (commit `37804cf`)

| file | change |
|------|--------|
| `src/form/silhouette-proportion.mjs` | `skirtBandFrac: 0.2` added to `PROPORTION_DEFAULTS`; new module-private pure helper `eaveReference(...)`; `maskProportions` captures `firstFg`/`lastFg` and changes ONLY the eave test to `!isSkirt(i) && e >= eaveFrac × refExtent`. Ridge/ground/return-shape unchanged. File-top DETECTION RULES comment updated. |
| `src/form/silhouette-proportion.test.mjs` | SP13–SP16 added (SP1–SP12 untouched): `maskFromExtents` + pinned real cottage elevation extents + `plinthHouse` fixture. |
| `packs/README.md` | eave bullet rewritten to declare the skirt-exclusion op parameter; removed the now-false "the cottage's squat read measured honestly" line. |
| `docs/active/work/T-139-01/*.md` | the six RDSPI artifacts. |

The fix in one line: **the eave anchors on the dominant wall band, not the global-max row.** A
bottom-`skirtBandFrac` (0.2) row strictly wider than the body above it — beyond that body's own
eave-tolerance band (`bodyMax / eaveWidthFrac`, reusing the existing 0.98, so **one new constant
total**) — is a *skirt* and is excluded from eave candidacy. `refExtent === maxExtent` whenever no
skirt qualifies.

## Acceptance criteria — evidence

1. **The skirt never reads as the eave** ✓ — eave detection excludes bottom-anchored over-wide
   bands. The chosen mechanism (dominant-wall-band reference via a bottom-region position prior) is
   a frozen, declared op parameter (`skirtBandFrac`), documented in `packs/README.md`, justified in
   `design.md`. **No subject-conditional code, no per-building constants** (the param is a
   width-vs-height prior applied uniformly, same class as `eaveWidthFrac`). Rejected alternatives
   (raise `eaveWidthFrac`; subtract a fixed plinth height; structural run-count; program-seam
   detection) recorded in `design.md` — the run-count is rejected **on measured evidence**: the
   barn's eave is a legitimate 1-row overhang that a run-count would demote.
2. **Identity-class discipline / monotone proof** ✓ — `refExtent === maxExtent` for every
   skirt-free mask ⇒ byte-identical eave line by construction; ridge stays on the global max ⇒
   ridge line byte-identical for ALL masks including the cottage. Mechanized as a test: SP14/SP16
   use `{skirtBandFrac: 0}` to reproduce the legacy ruler **side by side** with the corrected
   default. The committed E-33 masks were swept (prototyped against the real artifacts): **barn &
   barn--saltcrag unchanged** (2.1667 / 0.5385 / 1.7143); only the cottage differs. Where they
   differ, both rulers are reported (the witness/record layer keeps the old numbers; the new ruler
   is the live default). Committed records untouched; judge contract / azimuths / thresholds
   unmoved.
3. **Cottage regression fixture** ✓ — the real T-138-02 cottage elevation masks pinned as
   `COTTAGE_X_EXTENTS` / `COTTAGE_Z_EXTENTS` (pure, no `benchmarks/` read). SP13 proves the
   corrected eave line — assembled **ridge:eave 1.8333, roofShare 0.4545** (the ≈1.7/0.45 family),
   explicitly asserting *not* 5.5. SP15 proves a skirt-free mask (barn-shaped, high overhang)
   unchanged. Degenerate-mask behavior (null/empty/single-row → null constituents / recorded
   fallback) preserved and re-tested (SP15).
4. **No judge runs, no pin rotations** ✓ — `benchmarks/sculpture/proportion/*.json` untouched
   (git clean); the terminal re-verdict is T-143's. Workshop↔judge isolation unchanged; no
   judge/loop/conformance code touched. **`npm test` green (2013 pass, 0 fail).** `design.md` names
   the rejected alternatives.

## Test coverage

- **SP13** skirt correction (cottage masks → corrected family, ridge/maxExtent unchanged).
- **SP14** both-rulers monotone knob (`skirtBandFrac 0` = legacy `eaveH 4`; default 21/12).
- **SP15** skirt-free byte-identity (high overhang kept) + degenerate-mask preservation.
- **SP16** assembly through `proportionRatios` (plinthHouse 2/0.5 corrected vs 10/0.9 legacy;
  plinth-free house byte-identical to `gableHouse`).
- All pure (`src/**/*.test.mjs`); SP1–SP12 unmodified and green.

**Gap:** no test exercises the *concept-side* substrate through a skirted concept mask. In practice
the only skirted subject (cottage) has an unsegmentable concept (coverage 0.97 → sketch fallback),
so its targets are sketch-sourced and unaffected; a synthetic skirted concept mask would add
belt-and-braces coverage of the "one rule, two substrates" path but is not required by the ACs.

## Open concerns / known limitations

1. **Continuous bottom taper (ziggurat) edge case.** A silhouette that widens monotonically to the
   base (no committed instance) trips the skirt test on its bottom `skirtBandFrac` rows (measured:
   eaveH 0→1). The bounded region caps the shift; the realistic house space (eave course ≥ wall
   width) is provably safe (barn/gableHouse/triangle identical). Documented, not repaired —
   out of scope. Flag if a future subject is genuinely ziggurat-shaped.
2. **`skirtBandFrac = 0.2` is a declared prior, not a derived optimum.** Justified as "plinths live
   in the lowest fifth of an elevation." The cottage plinth sits at 16%. If a future build carries a
   water-table course above 20% of total height, it would not be stripped. Re-derive if that
   surfaces (the same posture as `eaveWidthFrac 0.98`).
3. **Shared-file concurrency (process note, needs human awareness).** A sibling thread **T-140-01**
   (ruler-calibration, same E-34 epic) was editing `src/form/silhouette-proportion.mjs` AND its
   test file *concurrently* — both tickets touch this module, which is a **missing dependency edge
   in the DAG** (T-139 ⊥ T-140 was assumed but they share the file). My commit `37804cf` therefore
   swept T-140-01's in-progress lens/tolerance/pitch additions along (191/189 insertions vs my ~70;
   the snapshot was green — 2013 tests pass — so it is consistent, not a mid-write break). T-140-01's
   remaining work + its own work-dir artifacts land in its own later serialized commit; no data
   loss, but **history attribution is blurred** between the two tickets. Recommend the epic add an
   explicit edge (or merge the two tickets' module edits) to avoid this on the next wave.

## Verdict

All four ACs met; `npm test` green; diff scoped to the module, its test, and the frozen prose; no
records/pins/judge touched. The corrected cottage ratio (≈1.7/0.45) is now what the live ruler
reports, ready for T-142/T-143 to re-verdict on a straight ruler. The single process flag worth a
human glance is concern 3 (the shared-file DAG edge).
