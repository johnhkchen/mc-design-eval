# workshop — barn (T-126-01)

The workshop loop's committed record: every round's critique, action, conformance both sides,
and raw replies live in `barn--saltcrag.json`. Replay: `npm run workshop:replay` (byte-identical,
no model calls); offline re-assert: `npm run workshop:offline`.

- budget: 6 rounds (used 2)
- outcome: **done**
- final conformance: 7/7 checks, 0 findings
- tier: strong (op `workshop-critique`); instrument: +x+z, +x-z, -x-z, -x+z @ 512×512

| round | critique | action | gate (checks✓/findings) | verdict |
| --- | --- | --- | --- | --- |
| 1 | major: gable roof — roof rides too tall/steep — ridge:eave is 2.4 vs declared 2.1 and roof share 0.583 vs 0.524, both beyond the 0.15 tolerance; the concept's eave sits higher relative to the ridge<br>minor: long +z wall openings — two spruce doors read correctly but the surrounding stone-brick pier rhythm is slightly tighter than the concept's wider quoined bays<br>minor: gable end window — single -x gable window present and placed, but reads a touch high vs the concept's mid-gable slit | `{"action":"adjust-params","elementId":"hall","massId":"hall","params":{"eaveHeight":11}}` | 7✓/0f → 7✓/0f | ACCEPTED |
| 2 | minor: overall silhouette — footprint aspect 2.0 vs declared 1.846 — body reads marginally longer than the concept, but within the gate's proportion-vs-concept PASS<br>minor: roof surface — dark_oak_planks field reads a touch darker/flatter than the concept's roof tone, though correct material<br>minor: front (+z) wall windows — cobble bays between quoins read as plain panels; concept's mid-bay glazing/shutter detail is faint | done | 7✓/0f → — | ACCEPTED |

Render evidence (gitignored, regen via the live runner): `workshop/barn--saltcrag/round-N/`;
before/after frames: `pr/assets/frames/workshop-barn--saltcrag-{before,after}.png`.
