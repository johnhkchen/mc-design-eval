# Ruler calibration — ruler-calibration/v1 (T-140-01)

The straight ruler (E-34/S-140): name the lens, calibrate the tolerance, give pitch its source.
Deterministic over committed records — no model, no GL beyond PNG decode, no judge. Reproduce:
`npm run ruler:repro`.

## 1. The lens, named — program (parameters) vs occupancy (realized voxels)

| subject | per-ratio program→occupancy (×) | max divergence |
| --- | --- | --- |
| barn | ridgeToEave 2.1→2.4444 (1.164×)<br>roofShare 0.5238→0.5909 (1.1281×)<br>aspect 1.8462→1.8462 (1×) | 1.164× on ridgeToEave |
| cottage | ridgeToEave 1.4145→4.5 (3.1813×)<br>roofShare 0.293→0.7778 (2.6546×)<br>aspect 1.1852→1.0357 (0.8739×) | 3.1813× on ridgeToEave |

Two instruments, not a contradiction: the gap is large only where the build diverges from its
parameters (the realized plinth, T-139-01), ~1× otherwise.

## 2. Tolerance 0.15 — calibrated, survives

In-cluster max 0.1281 ≤ 0.15 < out-cluster min 0.164 (separates: true). survives — tightest value consistent with passing post-loop ~0.03 and flagging the barn seed 0.164 the loop chased; bimodal evidence under-determines it, 0.15 is not contradicted

## 3. Pitch precedence — concept wins when segmentable; the steep door

| subject | source | concept° / sketch° | snapped pitch | steep door demanded? |
| --- | --- | --- | --- | --- |
| cottage | sketch-fallback | concept —° / sketch 35.5382° | class 1 of [1] | no |
| barn | sketch-fallback | concept —° / sketch 45° | class 1 of [1] | no |
| barn--saltcrag | sketch-fallback | concept —° / sketch 45° | class 1 of [2, 1, 0.5] | no |

Both E-33 gabled concepts are full illustrated scenes (unsegmentable) → sketch-fallback; the
TRELLIS-flattened sketch never reaches a steep class even where saltcrag offers one. The lever
is concept segmentation + sketch flattening, not the pack vocabulary (S-141/S-143).
