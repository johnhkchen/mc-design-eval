# T-177-01 — Progress

## Status: implementation complete; runner ran, glance passes, closure held.

## Step 1 — runner — DONE
`experiments/eval-alignment/faithful-roof.mjs` created. Program-driven (eaveY/ridgeAxis/pitch),
material-detected (roof field + gable-end block), post-realize carve+cover. No `SUBJECTS` map; defaults are
flag fallbacks, every build-shaping value is derived.

Run output (`node experiments/eval-alignment/faithful-roof.mjs`):
```
derived: eaveY=19 ridge=x pitch=1 | footprint x[0,14] z[0,14]
detected: roof field=minecraft:dark_oak_planks (stairs/slab dark_oak) | gable-end wall=minecraft:stone_bricks
kept 1072 wall cells; carved 1215 roof cells
covering: 323 roof cells | ridge@26 (perpSpan 14)
census: faithful prism 53.1% (1215/2287) -> covering 16.8% (225/1339)
closureOf(eave ring) = 1.000
```
The eaveY=19 derivation (4·5−1) matched the measured wall top **exactly**; ridge=x matched the measured
prism narrowing axis. Material detection picked up `dark_oak_planks` (the build's own faithful roof
material) — covering inherits it, no hardcoded constant.

## Step 2 — glance — PASS
4 azimuths + beside-concept inspected. The roof reads as a **covered dark-oak gable** with **stone
gable-end triangles** (envelope-then-covering: gable ends in wall material, slopes in roof field) and
stair-stepped slope courses. Walls read stone. The **arched gate** (-x) and slit windows (±z) are
preserved (kept walls with forms/states). **No `unmapped`/magenta blocks**; `dark_oak_stairs`/`_slab`
render. No roof holes. The solid 53 %-of-build prism mass is gone (16.8 % covering).

*Honest note:* at the pure external silhouette the covering and the prism are similar (both pitch-1
stepped gables) — the covering's win is **structural + material** (hollow interior, stone gable ends in
place of oak, stair/slab courses), not a dramatic silhouette change. Whether the VLM judge now reads the
roof as less of a `replace` is S-178's measurement; this ticket delivers the *constructed* roof and the
honest glance.

## Step 3 — closure — PASS
`closureOf(eave ring y=19)` = **1.000** for both the faithful input and the covered build (same kept ring;
the carve keeps `y ≤ eaveY` verbatim, covering authors only `y > eaveY`). **No regression.**

## Step 4 — witnesses + provenance — DONE
`builds/gatehouse/faithful-covered/{artifact.json, view-{az}.png, beside-concept.png, SOURCE.md}` written;
witnesses copied to the work dir; `results/faithful-roof-gatehouse.json` written.

## Step 5 — regression guard — pending `npm test` (no `src/` change, so a guard against accidental edits)

## Deviations from plan
- None of substance. `registerRect` was skipped (single near-square mass, ambiguous per T-172-01) in favor
  of a single-bbox gable from the eave footprint + program `ridgeAxis` — exactly as `design.md` planned.
