# workshop — barn (T-126-01)

The workshop loop's committed record: every round's critique, action, conformance both sides,
and raw replies live in `barn--saltcrag.json`. Replay: `npm run workshop:replay` (byte-identical,
no model calls); offline re-assert: `npm run workshop:offline`.

- budget: 6 rounds (used 3)
- outcome: **done**
- final conformance: 7/7 checks, 0 findings
- tier: strong (op `workshop-critique`); instrument: +x+z, +x-z, -x-z, -x+z @ 512×512

| round | critique | action | gate (checks✓/findings) | verdict |
| --- | --- | --- | --- | --- |
| 1 | major: roof vs walls (overall silhouette) — ridge:eave is 2.4 against the declared 2.1 target — the gable rides too tall over short walls<br>minor: roof mass share — roof occupies 0.5833 of the elevation vs target 0.5238 — slightly top-heavy versus the concept<br>minor: gable-roof voxel edges — stepped stair courses on the pitch read as terracing rather than a smooth slope, inherent to voxel geometry | `{"action":"adjust-params","elementId":"hall","massId":"hall","params":{"eaveHeight":12}}` | 7✓/0f → 7✓/0f | ACCEPTED |
| 2 | minor: overall footprint — Aspect ratio is 2.0 against the concept's 1.846 target — the barn reads slightly too long-and-narrow versus the picture; depth can be widened to nail the proportion exactly (48/26 = 1.846).<br>minor: gable roof slopes — Dark_oak field has visible voxel stair-stepping on the pitch, but it matches the concept's steep gable form and palette and is inherent to voxel geometry.<br>minor: +z wagon doors — Both spruce wagon doors and the stone-brick quoin rhythm read correctly against the concept; no divergence. | `{"action":"adjust-params","elementId":"hall","massId":"hall","params":{"depth":26}}` | 7✓/0f → 7✓/0f | ACCEPTED |
| 3 | minor: gable roof eave/ridge — voxel stepping along the pitched eave and ridge is visible, slightly coarser than the concept's clean rake line — inherent to the gable idiom at this scale<br>minor: +z wagon doors — the two spruce doors read a touch narrow/recessed versus the concept's broad wagon openings, but rhythm and lintels match | done | 7✓/0f → — | ACCEPTED |

Render evidence (gitignored, regen via the live runner): `workshop/barn--saltcrag/round-N/`;
before/after frames: `pr/assets/frames/workshop-barn--saltcrag-{before,after}.png`.
