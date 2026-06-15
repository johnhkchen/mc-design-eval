# T-136-01 geometry-levers — Progress

## Completed

- **Step 1** (bf27505): `src/workshop/geometry.mjs` + tests — applyGeometryAdjust (mass levers
  through recompile), substituteMass, prunePaint, resolveMass. 11/11.
- **Step 2** (e0510a8): actions.mjs dual grounding — element spec-merge unchanged; mass form
  carries massId + the lever vocabulary (parse-time, for precise re-asks); geometry applier
  joins DEFAULT_APPLIERS (pure); re-recognize grounds against masses; stale "S-125" applier
  message renamed to the runner-injection seam.
- **Step 5** (33ac5f1): rerecognize.mjs (renderArgs + parseMassReply), baml_src/rerecognize.baml
  (ReRecognizeMass), bridge row, OP_ROUTING `workshop-rerecognize` (strong).
- **Steps 3–4** (2ba7383): loop threads `source`; awaits appliers; geometry/recognize rounds
  advance program+source together, prune paint (recorded); ledger gains `source`. Replay
  re-derives geometry, re-applies ledgered fragments verbatim, refuses without pack/source;
  offlineAssert uses REPLAYED declarations + audits recognize rounds. RG1 = the AC integration
  case (byte-identical round-trip).
- **Step 6** (34eca56): critique source block (masses, levers, ratios vs declared targets),
  BAML param + bridge arg, golden re-minted (diff = exactly the 2 intended action lines; empty
  source_block inserts zero bytes — sourceless prompts byte-identical, S1 pins it).
- **Step 7** (a42d26e): geometry-levers.mjs runner (committed inputs read-only, T-135 targets
  declared on the seed, injected re-recognize applier, per-round ratio table via prefix replay,
  records under `benchmarks/sculpture/levers/`), ISO1/ISO4 extended, npm `levers:*` scripts.

`npm test`: **1993/1993 green**.

## Deviations from plan

1. **T-135 landed mid-implementation** (a42c756, while my Step 2 was in flight). The AC's
   preferred bound became available, so the planned interim `ratioGuard` was REMOVED before
   wiring in (G8 now proves the proportion declaration *rides through the recompile* instead —
   without that carry, the first geometry round would have silently disarmed T-135's gate).
   The levers runner arms the gate by declaring sketch targets on the seed.
2. **Concurrent-session protocol**: T-135's session edited loop.mjs/replay.mjs/loop.test.mjs in
   this shared working tree while I worked; I re-ordered steps (actions/rerecognize/critique
   first), committed only my own files, and merged onto their landed versions. Two transient
   pack-formation test failures observed mid-flight were theirs and are green at HEAD.
3. **applier ctx gained `critique`** (not in the original structure) — the AC's "critique
   attached as context" needs the round's issues at apply time.
4. **parseMassReply gained `proportions`** — same gate-disarm hazard as (1), at the fragment
   seam.

## Remaining

- **Step 8**: live cottage proof (`npm run levers:cottage`), then `--replay`/`--offline` green;
  commit records. Spend: ≤ 6 critique exchanges + bounded re-asks (+ fragment exchanges if the
  model reaches for re-recognize).
- **Step 9**: review.md.
