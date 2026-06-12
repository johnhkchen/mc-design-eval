# geometry levers — cottage (T-136-01)

The T-127 finding, closed or named: the model's critique can now AIM at geometry
(adjust-params on a mass; re-recognize a mass) and every revision is conformance- and
proportion-gated, ledgered, and replayed deterministically.

- outcome: **exchange-refused** after 3/6 rounds
- geometry-bearing rounds: 2 (round 1: geometry rolled back; round 2: geometry rolled back)
- ratio targets (sketch): ridge:eave 1.4145, roof share 0.293, aspect 1.1852
- replay: `node benchmarks/sculpture/geometry-levers.mjs --subject cottage --replay`;
  offline: `… --offline` (both exit-coded; no model, no GL)

| round | critique | action | gate (checks✓/findings) | verdict | ridge:eave / roofShare / aspect after |
| --- | --- | --- | --- | --- | --- |
| 0 (seed) | — | — | — | — | 2.25 / 0.5556 / 1.0769 |
| 1 | major: roof (both masses) — Roof is grossly over-tall and dominates the silhouette; conformance proportion-vs-concept FAILS (ridgeToEave 4.5 vs 1.4145, roofShare 0.7778 vs 0.293). The concept reads as tall two-storey timber-frame walls under a moderate gable, but the build is almost all roof.<br>major: main walls — Eave height (8) is too short relative to the ~9-block gable rise, so the walls read as a low base under a giant hood instead of the prominent timber-frame storeys in the concept.<br>minor: facade detail vs concept — Concept shows stone ground storey, white timber-frame upper with dark studs, shutters and lantern; build's wall articulation is present but buried under the oversized roof — defer until proportion is fixed. | `{"action":"adjust-params","elementId":"main","massId":"main","params":{"eaveHeight":16}}` | 6✓/2f → 6✓/2f | rolled back (regressed: passed 6→6, findings 2→2; ridgeToEave Δ 2.1813→3.5953 beyond tolerance) | 2.25 / 0.5556 / 1.0769 |
| 2 | major: main roof / overall silhouette — Roof is far too tall relative to the walls — it eats over half the height (roofShare 0.778 vs target 0.293); the concept reads as substantial walls under a moderate roof.<br>major: main + wing walls — Wall height is too short for the locked steep pitch, so ridgeToEave is 4.5 vs target 1.4145 — walls need to gain courses, not the roof lose pitch (pitch locked at class 1).<br>minor: eave course banding — Stone ground storey vs white-terracotta upper reads correctly, but with shallow walls the timber-frame upper band is cramped vs the concept's full upper storey. | `{"action":"adjust-params","elementId":"main","massId":"main","params":{"storeys":4}}` | 6✓/2f → 6✓/2f | rolled back (regressed: passed 6→6, findings 2→2; ridgeToEave Δ 2.1813→3.5953 beyond tolerance) | 2.25 / 0.5556 / 1.0769 |
| 3 | — | — | 6✓/2f → — | rolled back (exchange-refused) | 2.25 / 0.5556 / 1.0769 |
