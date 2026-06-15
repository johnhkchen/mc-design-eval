# T-079-02 — Review: spray-paint structural-mask fix

Handoff for a human reviewer. What changed, how it's tested, and what to watch.

## The fix in one line

Paint with **splat ∩ structural-zone**, on the **sealed** surface — color chooses which block within a
zone, the structural read chooses which zone allows it. Plaster (`white_terracotta`) is now confined to
the upper storey; the base stays stone and the roof stays wood.

## Files changed

**Pure cores (unit-tested, run under `npm test`):**
- `src/view/structural-read.mjs` — **+`structuralZones(occ, opts)`**: a pure classifier
  `zoneOf(voxel) → "base"|"upper"|"roof"` derived from `roofRegion` membership (top-exposed shell) +
  `floorLines[1]` (the base/upper divide), with a `baseHeight` fallback. Geometry, not current dominant
  blocks — so it survives the material collapse.
- `src/view/face-paint.mjs` — **`paintFace` zone gate**: optional `{zoneOf, allowedByZone}` + a
  `zoneRejected` counter + a `allowedByZone instanceof Map` guard. A target disallowed in its cell's
  zone is rejected, not painted. Fully backward compatible (absent `zoneOf` ⇒ prior behaviour).

**Runners (impure; GL + metered, run on demand):**
- `benchmarks/sculpture/spray-paint.mjs` — seal-first (inline `sealRoof`/`sealWalls`); `ZONE_MATERIALS`
  policy; zone-masked front+side paint; **dual paint** (masked vs unmasked) → per-zone surface-plaster
  histogram (the proof); `stripOffZonePlaster` (clears pre-existing base/roof plaster strays); a
  base/roof=0 **THROW**; extended record + `renderMd` + `--offline`.
- `benchmarks/sculpture/hollow-cottage-milestone.mjs` — chain reordered **seal → spray-paint** (was
  paint → seal); zone-masked paint on the sealed build + the same strip + THROW; hollow/floorplan now
  consume the painted skin; report gains a `zones` histogram. Refreshes `pr/assets`.

**Tests:** `src/view/structural-read.test.mjs` (+2), `src/view/face-paint.test.mjs` (+2).

**Docs:** `docs/knowledge/design-learnings.md` (E-23 correction note); the RDSPI artifacts +
before/after renders in `docs/active/work/T-079-02/`.

## Acceptance criteria — status

| AC | Status | Evidence |
|---|---|---|
| #1 Zone-masked paint, pure + unit-tested (base rejects plaster, upper accepts, roof rejects) | ✅ | `structuralZones` + `paintFace` zone gate; 4 new unit tests |
| #2 Plaster confined to upper; 0 below storey line, 0 in roof; per-band histogram before/after | ✅ | masked `{base:0, upper:134, roof:0}` vs unmasked `{base:96, upper:134, roof:80}` (surface) |
| #3 Seal before paint (no stray voxels painted) | ✅ | both runners seal first; `stripOffZonePlaster` clears residual strays |
| #4 Refine not silently skipped / gate not fooled | ✅ | zone mask makes off-zone paint impossible by construction + a hard base/roof=0 THROW (the guard is structural, not the marginal resemblance number) |
| #5 Visual proof + refreshed `pr/assets` (three clean bands) | ✅ | work-dir front/side before-after PNGs; `milestone:cottage` refreshed `cottage-face-after.png` + `cottage-multi-angle.png` |
| #6 `npm test` green + honest journal correction | ✅ | 980 pass / 0 fail; design-learnings E-23 correction note |

## Test coverage

- **Well covered (pure):** zone classification (base/upper/roof, storeyDivide derivation, membership-not-
  threshold for the roof), the zone gate (only upper voxels painted, `zoneRejected` tally, roof rejects
  plaster entirely, Map guard), and the unchanged geometry-safety of paint (positions identical).
- **Covered by runner + recorded artifact (not `npm test`):** seal-before-paint ordering, the per-zone
  histogram, the off-zone strip, and the THROW guard. These live in the GL/metered runners; the
  deterministic measurable (histogram in `spray-paint/cottage.json` + the milestone report) and
  `--offline` provide a reproducible check without GL.

### Gaps / not covered by automated tests
- The **runner glue** (`surfacePlasterByZone`, `stripOffZonePlaster`, the seal-first ordering) is
  duplicated across the two runners and exercised only by running them. A reviewer wanting CI coverage
  could promote these into a small pure `src/view/*` helper with unit tests — deliberately deferred to
  keep this fix scoped.
- The **THROW guard** firing path was verified manually (it fired on the pre-strip `base=1`); there is no
  automated negative test that asserts the runner throws on a zone-violating paint.

## Open concerns / known limitations

1. **`white_terracotta` renders salmon, not cream.** This is the separate, pre-existing
   `concept-image-not-color-value-preview` value drift (named-block hue/value ≠ concept preview), **not**
   this ticket. The *zoning* is correct (plaster only in the upper storey); the *tone* is a downstream
   issue. Flagging so the salmon in the renders isn't mistaken for a new defect.
2. **`ZONE_MATERIALS` is cottage-specific** and duplicated in both runners. It's derived from
   `material-map/cottage.json` roles but hand-transcribed. A second subject would want this generated
   from the material map + the design-doc's band plan, not copied.
3. **`storeyDivide = floorLines[1]`** assumes the second floor line separates base from upper (true for
   the cottage: `[0,7,14]` → 7). A build whose storeys don't produce a clean second floor line falls back
   to `minY + baseHeight` (default 6) — fine for the cottage, untested on other massings.
4. **Pre-existing interior plaster strays (5 voxels)** are untouched (not on any face, not the visible
   defect) and reported separately. The measurable is honestly the *surface* skin, not all voxels.
5. **The milestone floorplan author is non-deterministic** (2×2 / 2×3 / 3×3 across runs) — unchanged by
   this ticket, but it means the refreshed `pr/assets` interior varies run-to-run. The exterior skin (what
   this ticket fixes) is deterministic given the seal+paint+strip path.

## Recommendation

The fix is complete and verified end-to-end: the pure cores are unit-tested, both runners produce a
clean per-zone histogram (`base:0, roof:0`), the milestone passes both gates with `exteriorHeld` true,
and the PR assets read as three clean bands with no smear or floating strays. The structural THROW means
a future regression cannot silently ship a zone-wrong skin. Concerns 1–5 are scoping/genericity notes,
not blockers.
</content>
