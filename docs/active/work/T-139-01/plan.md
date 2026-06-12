# T-139-01 Plan — ordered, verifiable steps

Each step compiles/tests independently and is committable atomically. Verification criteria are
concrete (exact numbers from the Design prototype).

## Step 0 — Baseline capture (no code change)
- Run `npm run test:unit` → confirm SP1–SP12 green before touching anything.
- Re-confirm the legacy numbers the fixture must reproduce: cottage masks give `eaveH 4` (both
  views) ⇒ assembled 5.5 / 0.8182; barn unchanged at 2.1667 / 0.5385.
- **Verify:** baseline test suite green; numbers match Research/Design tables.

## Step 1 — Frozen parameter + skirt-aware eave reference (the logic)
File: `src/form/silhouette-proportion.mjs`.
1. Add `skirtBandFrac: 0.2` to `PROPORTION_DEFAULTS` with the inline doc comment (Structure 1a).
2. Add a module-private pure helper that, given `extents`, `maxExtent`, `firstFg`, `lastFg`,
   `eaveFrac`, `skirtBandFrac`, returns `{ refExtent, isSkirt(y) }` per Design's algorithm.
3. In `maskProportions`: capture `firstFg`/`lastFg` from the existing extent scan; compute the
   reference via the helper; change ONLY the eave assignment to
   `!isSkirt(y) && e >= eaveFrac × refExtent`. Ridge/ground/return shape unchanged.
4. Update the file-top DETECTION RULES comment to describe the skirt exclusion.
- **Verify (scratch, deleted after):** a one-off node script over the three committed artifacts
  reproduces the Design table — cottage 5.5→1.8333/0.4545, barn & barn--saltcrag IDENTICAL. (Do
  NOT leave the scratch file; the durable proof is the unit tests in Step 2.)
- **Commit:** `fix(T-139-01): skirt-aware eave reference — plinth never reads as the eave`.

## Step 2 — Tests: fixture, correction, monotone proof, assembly (SP13–SP16)
File: `src/form/silhouette-proportion.test.mjs`.
1. Add `maskFromExtents(extents, w)` + pinned `COTTAGE_X_EXTENTS` / `COTTAGE_Z_EXTENTS` (the real
   committed arrays, row 0 = top) and a `plinthHouse({plinth})` occupancy.
2. **SP13** skirt-correction: cottage masks ⇒ `eaveH 21`(x)/`12`(z), `maxExtent` 29/28 unchanged,
   `ridgeRow` unchanged; hand-assembled ridge:eave ≈1.8333, roofShare ≈0.4545; assert NOT 5.5.
3. **SP14** both rulers: `{skirtBandFrac:0}` on the cottage masks reproduces the legacy `eaveH 4`
   (byte-for-byte legacy line); default corrects. The monotone knob.
4. **SP15** skirt-free + degenerate: barn-shaped mask (high 1-row overhang) identical under default
   and `{skirtBandFrac:0}`; `null`/empty/single-row still degenerate.
5. **SP16** assembly: `proportionRatios(plinthHouse())` corrects to the wall-anchored family; the
   same house without the plinth equals `gableHouse` ratios exactly.
- **Verify:** `npm run test:unit` green, SP1–SP16. SP1–SP12 unmodified.
- **Commit:** `test(T-139-01): cottage skirt fixture, both-rulers monotone proof, assembly`.

## Step 3 — Frozen prose (packs/README.md)
1. Extend the eave bullet with the skirt-exclusion op parameter (Structure §3). Ridge bullet,
   tolerance, rollback prose unchanged.
- **Verify:** prose names `skirtBandFrac (0.2)`, "dominant wall band", "never on a sub-wall skirt",
  and that the protrusion threshold reuses `eaveWidthFrac`; reads in the existing frozen voice.
- **Commit:** `docs(T-139-01): document skirt-aware eave rule as a frozen op parameter`.

## Step 4 — Full gate
1. `npm test` (validate-artifact self-tests + `test:unit`).
2. Confirm the witness records under `benchmarks/sculpture/proportion/` are **untouched** (`git
   status` clean for them) — the fix does not rotate pins.
3. Confirm no judge/pin code paths touched (`git diff --stat` is the module + its test +
   packs/README.md only).
- **Verify:** `npm test` green; diff scope = exactly three files; no record/pin/judge changes.

## Testing strategy

- **Unit (pure, synthetic):** the entire fix is covered by `src/**/*.test.mjs` — no GL, no IO. The
  cottage fixture is *pinned mask data*, not a `benchmarks/` read, preserving purity.
- **Monotone proof:** mechanized in SP14/SP15 via the `skirtBandFrac:0` legacy knob — "both rulers
  side by side" is an assertion, not prose. The skirt-free identity for barn/gableHouse/triangle is
  asserted (SP15/SP16) and was prototyped against the real committed artifacts (Design table).
- **No integration test needed:** `proportionRatios`/`compareRatios`/conformance consume the
  corrected `eaveH` transparently; assembly is covered by SP16. The witness/gate run is deferred to
  T-143 by design (committed records frozen here).
- **Regression guard for degenerate masks:** SP15 retains the null/empty/single-row clause (AC #3).

## Risks & mitigations
- *Risk:* the eave helper accidentally changes a skirt-free mask. *Mitigation:* `refExtent ===
  maxExtent` whenever `anySkirt` is false ⇒ identical by construction; SP15/SP16 + the prototyped
  barn/gableHouse/triangle identity catch any slip.
- *Risk:* serializer drift if `refExtent`/`skirt` leak into the return shape. *Mitigation:* return
  shape is explicitly unchanged (Structure 1b step 5).
- *Risk:* `skirtBandFrac` reads as subject-tuned. *Mitigation:* it is a width-vs-height prior of the
  same class as `eaveWidthFrac`, applied uniformly, documented in packs/README.md; design.md records
  why 0.2 and the rejected per-building alternatives.
