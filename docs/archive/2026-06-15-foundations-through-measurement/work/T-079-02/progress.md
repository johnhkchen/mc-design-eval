# T-079-02 — Progress

Status: **all steps complete.** Implemented per `plan.md`, no material deviations except one documented
addition (the off-zone plaster strip, Step 4).

## Completed

- [x] **Step 1 — `structuralZones`** (`src/view/structural-read.mjs`). Pure classifier
      `zoneOf(voxel) → base|upper|roof` from `roofRegion` membership + `floorLines[1]` (storeyDivide),
      with a `baseHeight` fallback. +2 unit tests (`structural-read.test.mjs`): base/upper/roof on a
      synthetic stone-base+upper+flat-roof build (floorLines `[0,3,7]`, divide=3); explicit-divide path.
- [x] **Step 2 — `paintFace` zone gate** (`src/view/face-paint.mjs`). `{zoneOf, allowedByZone}` optional
      args + `zoneRejected` counter + a `allowedByZone instanceof Map` guard. Backward compatible. +2
      unit tests (`face-paint.test.mjs`): plaster painted only in upper, base/roof reject it; Map guard.
- [x] **Step 3 — full suite green.** `npm test` → **980 pass / 0 fail** (was 976; +4 new).
- [x] **Step 4 — `spray-paint.mjs`** seal-first + zone mask + proof. Inline `sealRoof`/`sealWalls`;
      `ZONE_MATERIALS` policy; zone-masked front+side paint; **dual paint** (masked vs unmasked) →
      per-zone surface-plaster histogram; **off-zone plaster strip** (see deviation); base/roof=0 THROW;
      extended record + `renderMd` + `--offline`. Live run: plaster 7→139, histogram masked
      `{base:0, upper:134, roof:0}` vs unmasked `{base:96, upper:134, roof:80}`. `--offline` CONFIRMED.
- [x] **Step 5 — `hollow-cottage-milestone.mjs`** reorder seal→paint + zone mask + THROW; hollow/
      floorplan now consume the painted skin. Live `npm run milestone:cottage`: plaster 8→139, histogram
      `{base:0, upper:134, roof:0}`, hollow exteriorHeld=true, floorplan gate PASS, fill exteriorHeld=true.
      Refreshed `pr/assets/cottage-face-after.png` + `cottage-multi-angle.png` (three clean bands).
- [x] **Step 6 — visual proof** saved to the work dir: `view-front-before/after.png`,
      `view-side-before/after.png`. The after renders show plaster confined to the upper storey (stone
      base, wood roof, no pink smear, no floating strays).
- [x] **Step 7 — journal correction** (`design-learnings.md` E-23): the color-only splat was more
      sophisticated but worse; splat must be ∩ structural-zone; links `twodee-interaction-sector`.

## Deviation from plan (documented)

- **Off-zone plaster strip (Step 4/5).** The first run THROWN on `base=1`: a *pre-existing* plaster
  stray on an unpainted rear face (sealing leaves it; not introduced by paint) made the literal AC-#2
  "0 plaster below the storey line" false. Rather than a blanket off-zone strip (which would grey-out
  the spruce gable — that classifies `upper`), I added a **plaster-specific** base/roof strip
  (`stripOffZonePlaster`): recolor any base/roof *surface* plaster voxel to its zone's primary material.
  Narrowly scoped to the defect material (plaster only belongs to `upper`), so it can never touch a
  legit off-primary block. Result: `base:0, roof:0` literally. 1 stray stripped on the cottage.

## Verification snapshot

| Check | Result |
|---|---|
| `npm test` | 980 pass / 0 fail |
| `spray-paint.mjs` masked histogram | `{base:0, upper:134, roof:0}` |
| `spray-paint.mjs` unmasked (the smear) | `{base:96, upper:134, roof:80}` |
| `spray-paint.mjs --offline` | reversal CONFIRMED, base/roof=0 OK |
| `milestone:cottage` | plaster 8→139, zone clean, both gates pass, exteriorHeld true |
| front +z after-render | three bands, no smear, no floating strays |

## Commits

1. `feat(E-23 T-079-02): structuralZones + paintFace zone gate — splat ∩ structural-zone`
2. `fix(E-23 T-079-02): spray-paint seals before painting, masks splat by structural zone`
3. `fix(E-23 T-079-02): milestone seals before paint + zone-masked skin; refresh PR assets`
4. `docs(E-23 T-079-02): design-learnings correction + work-dir artifacts` (this docs commit)

## Notes

- The ticket frontmatter was left untouched (Lisa advances phases).
- `white_terracotta` renders as a warm salmon in prismarine-viewer — the known
  `concept-image-not-color-value-preview` value-drift, a *separate* issue; the zoning (what this ticket
  fixes) is correct.
</content>
