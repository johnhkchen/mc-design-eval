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
- [~] **Step 6 — the building** (in flight): `recognize:barn:saltcrag` accepted ask 1
  (10117 cells, 6 elements, conformance PASS under saltcrag, grep clean);
  `patternbook:barn:saltcrag` workshop loop running (round 2/6 at last check).
- [ ] **Step 7 — frozen gate**: `gate:patternbook:barn:saltcrag` (the epic's only judge call).
- [ ] **Step 8 — receipts** composer + run.
- [ ] **Step 9 — design-learnings (E-32) + E-12 handoff**.
- [ ] **Step 10 — review.md**.

## Deviations from plan

1. (Step 2½ above) Substitution at recognition, not compile — one extra live ask; the
   architecture is cleaner (the program contract "speaks one pack" stays intact).
