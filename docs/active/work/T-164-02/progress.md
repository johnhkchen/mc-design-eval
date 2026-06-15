# T-164-02 — Progress

- [x] Step 1 — RouteCritique contract + bridge row — commit `feat(T-164-02): RouteCritique BAML contract + bridge row`
- [x] Step 2 — route.mjs pure core + unit tests (RT1–RT4) — commit `feat(T-164-02): route.mjs — serializer, membership gate, verdict adapter`
- [x] Step 3 — route fixtures + fixtures.test (FX-RT1/2) + TG5 — commit `test(T-164-02): RouteCritique fixtures + parse pins + TG5 scope`
- [x] Step 4 — workshop --split wiring (fused default, byte-identical replay/offline) — commit `feat(T-164-02): workshop --split runs diagnose->route, fused default retained`
- [x] Step 5 — route:smoke witness + LIVE barn run (evidence committed) — commit `feat(T-164-02): route:smoke live witness + barn dispatch evidence`
- [x] Step 6 — full suite 2212/2212 green; review.md

## Log
- Step 1: `baml:gen` regenerated baml_client (14 files); offline bridge render+parse of RouteCritique
  verified (prompt 1.3KB, 0 images, typed Dispatch parses).
- Step 2: route.mjs — critiqueBlock / departmentIdiomsBlock / routeRenderArgs / resolveDispatch /
  dispatchToVerdict. 4/4 unit pins green.
- Step 3: fixtures minted from the committed barn Critique (inputs+golden offline via bridge); reply.txt /
  expected.json / reply-bad-idiom.txt hand-authored. fixtures.test R[18]–R[20]; TG5 now scans
  department.baml. 20/20 baml tests green.
- Step 4: `--split` swaps the exchange to diagnose→route (async reply policy, two layers); dispatch trace
  written to the gitignored round dir + console. Fused stays default; isolation 4/4, replay byte-identical,
  offline clean.
- Step 5: LIVE barn route:smoke — diagnosed 4 items (ROOF/WALL/WALL/OPENING), routed every one to a real
  idiom (ROOF→roof.gable.steep, WALL→surface.fill ×2, OPENING→opening-dressing); resolveDispatch passed;
  beside-concept render (5 panels) + JSON trace committed as evidence.
- Step 6: `npm test` 2212/2212 (baseline 2206 + 6).

## Deviations from plan
- None material. The verdict adapter declares `decision:"done"` after logging the dispatch (Decision 3) —
  applying a routed idiom is the named generator-epic gap, so the loop does not climb via idioms this
  ticket; the dispatch trace is the scorable deliverable (S-166 referees).
