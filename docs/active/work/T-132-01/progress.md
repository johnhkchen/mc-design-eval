# T-132-01 factory-milestone — Progress

Phase: Implement, tracking plan.md's ten steps.

## Baseline (Step 0)
- Suite green at start: **1895/1895** (now 1899 with SEED9–12). `patternbook:repro`/`:offline`
  byte-identical before and after every seam change.
- **Registry BEFORE snapshot (the receipts' baseline): 19 brushes** at ref `d679644` —
  arch, chimney, course.slab, course.stairs, dormer, floorplan, head.flat, hollow, jetty,
  opening-dressing, plinth, roof.gable, roof.hip, roof.pyramid, surface.fill, surface.paint,
  surface.roof-courses, surface.strip-salt, timber-frame.
- Sibling coordination: the T-130 session was live mid-formation at start; **consumed its
  outputs rather than racing** — `packs/saltcrag.json` ratified provisional at `74ea65e`,
  T-130 closed at `3f5a731`. No spend probe needed: the sibling's formation chain was
  actively succeeding on the shim at the time.

## Step status

- [x] **Step 1 — pack-as-data seam** (`a840934`): `--pack` on pattern-book + workshop;
  `DEFAULT_PACK_REL`/`packNs`/`chainRels` in seed.mjs (one derivation for all chain paths;
  rustic keeps its legacy unsuffixed paths — relocating committed pins would be a re-roll);
  npm scripts for the saltcrag run; SEED9–11.
- [x] **Step 2 — saltcrag pack verified** (sibling-delivered): schema + semantic VALID (2
  recorded valueCheck family gaps: hay_block, moss_block — formation findings, not blockers);
  `ratification` present (provisional, ticket-sanctioned); all 11 pack idioms ⊆ registry;
  formation-replay sweeps the draft byte-identically (suite green).
- [x] **Step 2½ (DEVIATION 1) — substitution seam moved to recognition** (`3cf878c`): the
  design assumed the committed rustic barn program could compile under saltcrag. A pure
  dry-run refuted it: `parseProgramReply` gates programs to ONE pack (`pack: "rustic"`
  stamp) and role vocabularies are per-pack (`wall.dressing`/`roof.trim` absent from
  saltcrag's palette). Fix: recognition is pack-conditioned — `recognize.mjs --pack`
  (+`--ticket`), records namespace via `recognitionRels`, the chain consumes the invocation
  pack's own recognition record; the planned seamPack/buildPack split collapsed (each pack's
  chain is self-consistent). Cost: ONE extra live model ask (barn recognized under
  saltcrag) — recorded in the cost-shape receipts. SEED12 pins the paths.
- [x] **Step 3 — saltcrag backlog** (`9266f22`): accepted on ask 1 — **3 new-brush work
  items** (roof.thatch, surface.clinker, surface.limewash) + 15 parametrization notes,
  0 demotions/warnings; `--offline` replay 4/4 byte-identical.
- [x] **Step 4 — promotion** (`e1b20f1`): the three drafts stamped (planner sanction via the
  ticket AC; in-ticket execution, no lisa dispatch — the double-dispatch lesson). Notes
  audit: the 15 mappings spot-checked against the registry; all name owned brushes with
  plausible parametrizations; none re-promoted.
- [x] **Step 5 — gap brushes** (`4173674` + `437d0e7`): registry **19 → 22** through the
  door. roof.thatch (construct, 7 tests + card + synth spec), surface.clinker (pass, 7
  tests), surface.limewash (pass, 6 tests). Rework recorded (T-131's metric): thatch none;
  clinker 2 minor; limewash 2 minor (interface reshapes to house conventions — zoneOf lens,
  direction array, preserve-by-block). Catalog regenerated (brushCount 22).
  **DEVIATION 2**: one commit for the three-brush wave (not one per brush) — the registry
  table is one frozen literal; splitting it into three commits would have left intermediate
  states failing the baseline-count meta-test.
  **DEVIATION 3 (found live)**: the formation replay + form-style --offline derived drafts
  against the LIVE registry — drifted the moment the brushes landed. Fixed (`4173674`):
  `ownedNamesFromRegistryDigest` recovers the registry AS RECORDED from the committed
  decompose inputs; replays are functions of committed records only.
- [x] **Step 6 — the building** (committed): `recognize:barn:saltcrag` accepted ask 1
  (10117 cells, 6 elements, conformance PASS under saltcrag, grep clean);
  `patternbook:barn:saltcrag` — workshop **done after 4/6 rounds** (1 accepted: plinth
  courses; 2 regressions rolled back by the cage: a +z respray 0→12 findings and a
  mossy-cobble wall swap 0→964 findings — the cage earned its keep twice); final
  conformance 6✓/0f. `patternbook:saltcrag:repro` AND `:offline` byte-identical; rustic
  chains unmoved.
- [x] **Step 7 — frozen gate** (committed): the epic's only judge call —
  **same-object 4/4, 8 gaps ALL MINOR** (aggregate FAIL on the 2-gap budget — the same
  arithmetic rustic's best carries). Replies 1/1/1/1 (T-114 idle), offline re-assert clean,
  every write a first write (nothing rotated). Kit presence skip→FAIL (no concept-declared
  apertures on a program build — the known T-127 strain, recorded beside resemblance).
- [x] **Step 8 — receipts** (committed): registry 19→22; reuse **11/14 (79%)**; rework 4
  minor/0 spec-wrong; cost shape 13 model calls; instrument receipt frozen `diffs: []`;
  re-run byte-identical. **DEVIATION 4**: reuse semantics corrected mid-step — demand =
  pack idioms + factory-built drafts (a naive pack-vs-pack set difference mislabeled four
  pre-existing surface.* brushes as "newly built").
- [x] **Step 9 — design-learnings**: `## Brush factory (E-32)` appended with the numbers,
  the found-live seams, and the E-12 handoff paths. `npm test` 1924/1924.
- [x] **Step 10 — review.md** (this work dir).

## Deviations from plan

1. (Step 2½) Substitution at recognition, not compile — one extra live ask; the program
   contract ("a program speaks one pack") stays intact.
2. (Step 5) One commit for the three-brush wave instead of one per brush — the registry
   table is one frozen literal; intermediate states would fail the count meta-test.
3. (Step 5) Replay-vs-growing-registry bug class found and fixed (`4173674`).
4. (Step 8) Reuse fraction measured against brush DEMAND, not pack-vs-pack set difference.

## Acceptance-criteria trace

1. **End-to-end run** ✅ — saltcrag formed (T-130 chain, sibling) → ratified provisional →
   backlog (T-131 runner, ask 1) → 3 promoted drafts → 3 brushes through the single door
   (19→22) → barn recognized + composed via the E-31 workshop under the saltcrag pack
   (program → realization → budgeted ledgered revision, replay-reproducible) → one
   frozen-gate run (fresh renders; instrument frozen `diffs: []`; T-119 preflights, all
   first writes; T-114 replies 1/1/1/1).
2. **Verdict + sheets recorded honestly** ✅ — FAIL at 8/2 recorded as it fell, beside
   conformance 6✓/0f; the new style did NOT grade worse than rustic's best (identical
   4/4 + 8-minor profile); the named findings: gap-budget arithmetic, kit-presence strain,
   forward-compounding timing.
3. **Compounding receipts, one table** ✅ — `benchmarks/sculpture/factory/receipts.{json,md}`.
4. **Replay** ✅ — `patternbook:saltcrag:repro`/`:offline` byte-identical; registry-only
   subject entry (barn is registry data; no subject key or style slug in any runner
   source — npm scripts carry the flags); generalization grep `clean: true` in the chain
   and recognition records.
5. **design-learnings + E-12 + tests** ✅ — E-32 section appended; handoff paths named;
   1924/1924 green.
