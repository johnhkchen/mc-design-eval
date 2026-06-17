# T-180-01 — Research

Diagnostic spike on **already-committed evidence** (no new metered votes). Goal: map the data and code
needed to classify every matched-build `replace` tag as **R** (reading mis-read) or **S** (scoring
mis-bucket/cap), so S-181 knows which locus to fix. Descriptive only — no fix, no decision here.

## The evidence on disk

- **`experiments/eval-alignment/results/corpus-referee-faithful-covered.json`** — the VOTES=6 crater run.
  Shape: `crater.conditions["0".."3"]`, each `{key,tier,pack,concept,note,scoreMean,scoreStd,votes[6]}`.
  Each vote = `{score,nWrongStyle,wrongStyleCapped,items[]}`; each item = the Layer-A CritiqueItem
  `{department, severity, present, missing, kind, styleClass}` (no `expected` string is persisted in this
  file — only present/missing/kind/styleClass; see "constraint" below). Condition 0 = **A-matched** (the
  target of this audit), 1/2 = WRONG twins (B-arc classical, B2-chapelle gothic), 3 = C-control.
- **`docs/active/work/T-178-01/run-votes6.log`** — per-vote score line + final verdict
  (`A=13±12 B=0±0 B2=0±0 C=5±7 ... DID NOT CRATER`, `contrast=-0.20`).
- **`builds/gatehouse/faithful-covered/artifact.json`** — the build under test. Block census (1339
  placements): **1106 `stone_bricks`**, **210 `dark_oak_stairs`** + **15 `dark_oak_planks`** (roof),
  **4 `dark_oak_log`**, **4 `cobblestone`**. No `spruce_door`, no spruce roof, no arch course.
- **`packs/rustic.json`** — the style pack. Defines `wall.field.ground=cobblestone`,
  `wall.dressing=stone_bricks`, `roof.field=spruce_planks`, `roof.trim=dark_oak_planks`,
  `frame.timber=dark_oak_log`, `door.main=spruce_door`, `window.shutter=dark_oak_trapdoor`,
  `window.infill=spruce_fence`, `arch` idiom block `stone_bricks`.
- **`benchmarks/sculpture/recognition/gatehouse.program.json`** — the recognized building program (per-mass
  intent the judge is "grounded on"). Decisive: walls `ground/upper.role = wall.dressing` (→ stone_bricks
  **field**), `dressing.role = wall.field.ground` (→ cobblestone **quoins/corners**) — i.e. the concept
  **inverts** the pack default (coursed stone field, rubble quoins). Opening on `-x`: `kind:door, w:4, h:8,
  head:arch, headRole:frame.timber` (dark_oak_log) + a `spruce_door`. `±z` walls: 2 slit windows each,
  `h:3`, flat head. Roof `fieldRole:roof.trim` (dark_oak_planks — "whole-roof darkened toward oak"),
  trim/gable `wall.dressing`.
- **Concept**: `benchmarks/.../015-vBuilding-a-stone-gatehouse-.../concept.png` (run name literally
  "...peaked gable roof and an **arched gate**"). Beside-concept render at
  `docs/active/work/T-178-01/crater-matched.png` (L concept grey/grey/arched, R build grey walls/**brown
  dark_oak roof**/square opening).

## What the build actually is (census vs program)

| Element | Program/concept calls for | Build actually has | Same style family? |
|---|---|---|---|
| Wall field | stone_bricks (coursed) | 1106 stone_bricks | **YES — exact** |
| Wall quoins | cobblestone (rubble corners) | 4 cobblestone (≈none) | grey stone, contrast absent |
| Opening (gable) | arched door, dark_oak_log frame, spruce_door | bare square hole, 4 dark_oak_log, **no door** | opening present, dressing absent |
| Roof | dark_oak (trim) / but concept reads grey-stepped + grey eave course | 210 dark_oak_stairs + 15 dark_oak_planks (brown) | **NO — brown vs grey** (genuine) |
| Slit windows | shutters (dark_oak_trapdoor) + infill (spruce_fence) | bare slits | infill absent |

Note the cross-talk: the **program** says roof = dark_oak (so the build is faithful *to the program*), but
the **concept image** reads grey-stepped (T-178-01 FINDINGS). The judge compares renders to the *concept*,
so ROOF:replace (dark_oak-build vs grey-concept) is a **genuine, legitimate** divergence — the epic's named
"known-legitimate S reference."

## The scoring mechanism (`src/workshop/bakeoff-score.mjs`)

- `itemStyleClass(item)`: `kind:"replace"` → **"wrong-style"**; `kind:"add"` → "absent"; else structural
  read of present/missing emptiness. (`kind` wins when present — and it is present in every item here.)
- `styleFidelityScore(critique)`: each **wrong-style** item adds `PENALTY.major(20) + WRONG_STYLE.distance(12)
  = 32` to penalty (forced major, severity-blind); all others add their severity penalty (major 20 / minor
  8). `score = clamp(100 − penalty)`, then **if any wrong-style item: `score = min(score, cap=40)`**.
- **Reconstruction check (this ticket):** feeding the 6 votes' `kind`/`severity` into this exact math
  reproduces `[0,4,20,28,28,0]` byte-for-byte. The cap=40 is *secondary*; the binding floor is the
  **32-per-`replace`** forced penalty (2 replaces = −64; 3 = −96 → 0).

## The judge contract (`baml_src/department.baml`, `DiagnoseBuild`)

CritiqueItem fields `expected/present/missing` + `kind "add"|"replace"|"remove"`. The `kind` description:
`replace = present but WRONG style/material`; `add = element absent`. The prompt grounds on the program and
the pack's material vocabulary and asks per department what the style calls for vs what is present. **It does
NOT instruct: "if the base material matches the concept but a detail/dressing is missing, prefer `add`."**
The known-boundary comment in bakeoff-score.mjs (lines 53–56) already names this exact failure: right base
material + missing detail is "structurally indistinguishable from wrong-material replace."

## Constraints / assumptions surfaced

- **`expected` is not persisted** in the results JSON (only present/missing/kind/styleClass). The R/S call
  must be made from `present`/`missing` text + `kind` + the build census + the program/pack — which is
  sufficient (present says what the build has; missing says the gap; the program/pack say what's faithful).
  AC asks to quote `expected` "where available"; note its absence honestly.
- This is **diagnosis, not fix**: nothing under `measurements/` is touched; no code changes; `npm test`
  must stay green (baseline: 0 fail).
- The corpus is **one subject, one matched concept, two wrong twins** — narrow. Any conclusion is a
  localization, not a population claim (the standing E-40 breadth caveat).
</content>
</invoke>
