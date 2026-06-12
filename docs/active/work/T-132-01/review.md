# T-132-01 factory-milestone — Review

Phase artifact 6/6, the E-32 terminal handoff. The end-to-end run is committed: one new style
(`saltcrag`) through formation → ratification → backlog → three factory-specified brushes →
one building via the E-31 workshop → one frozen-gate run → the compounding receipts. Suite
**1924/1924** green; every replay byte-identical.

## What shipped (10 commits on main this session)

1. `a840934` **pack-as-data seam** — `--pack` on pattern-book + workshop; `DEFAULT_PACK_REL`/
   `packNs`/`chainRels` in seed.mjs (ONE path derivation; rustic's committed records keep
   their unsuffixed paths — relocating committed pins is a re-roll); SEED9–11.
2. `3cf878c` **substitution seam at recognition** — a live dry-run refuted compile-time
   substitution (programs are pack-stamped; role vocabularies are per-pack); recognize.mjs
   gains `--pack`/`--ticket`, records namespace via `recognitionRels`, the chain consumes the
   invocation pack's own recognition record; SEED12.
3. `9266f22` **saltcrag backlog** — accepted ask 1: 3 new-brush items + 15 parametrization
   notes, 0 demotions; `--offline` 4/4 byte-identical.
4. `e1b20f1` **promotion** — three drafts stamped (planner sanction via the ticket AC,
   in-ticket execution, no lisa dispatch).
5. `4173674` **replay-vs-growing-registry fix** — replays derive against the registry AS
   RECORDED (`ownedNamesFromRegistryDigest` from the committed decompose inputs); the live
   table's first growth had drifted every formation replay.
6. `437d0e7` **the gap brushes, 19 → 22** — roof.thatch (construct + card + synth spec),
   surface.clinker, surface.limewash; 20 unit tests off the drafts' test plans; rework
   recorded (4 minor interface notes, 0 spec-wrong); door conformance extended; catalog
   regenerated.
7. `f130e0a` + receipts fixes — **the receipts composer** (pure half R1–R5 + runner; style
   via argv, run key discovered, BEFORE snapshot pinned as data at `d679644`).
8. (building) **barn--saltcrag chain** — recognition accepted ask 1 (conformance PASS);
   workshop done 4/6 (1 accepted revision, 2 cage rollbacks incl. a 964-finding wall swap);
   `patternbook:saltcrag:repro`/`:offline` byte-identical; rustic chains unmoved.
9. (gate) **the epic's one judge call** — same-object 4/4, 8 gaps all minor; aggregate FAIL
   on the 2-gap budget; replies 1/1/1/1; offline re-assert clean; all first writes.
10. (receipts + journal) — `factory/receipts.{json,md}` (19→22 · reuse 11/14 = 79% · 13
    model calls · instrument frozen `diffs: []`), design-learnings `## Brush factory (E-32)`
    + E-12 handoff.

## Acceptance criteria — verdicts

All five ✅ — the full trace with evidence paths is in progress.md. Headline: **the new-style
building did not grade worse than rustic's best — it matched it exactly** (4/4 same-object,
8 minors, same budget-FAIL arithmetic), with materials the diegetic story chose.

## Test coverage

- New units: SEED9–12 (path namespacing), TH1–7 / CL1–7 / LW1–6 (the three brushes, off the
  promoted drafts' test plans verbatim), R1–R5 (receipts arithmetic + honesty + determinism).
- Structural guards extended, none weakened: brush-door TECHNIQUES covers the three new
  technique modules; the 19-brush baseline meta-test updated to 22 with the growth named;
  formation replay now sweeps the saltcrag draft (recorded-registry semantics).
- Integration (exit-coded, convention — not in `npm test`): rustic `patternbook:repro`/
  `:offline` re-verified after every seam change; saltcrag repro/offline; recognition
  offline; gate offline; receipts byte-identical re-run. All green this session.
- NOT covered (convention): live shim behavior, GL bytes — the committed ledgers + raws are
  the evidence.

## Open concerns for a human reviewer (ranked)

1. **The ratification taste pass is pending.** `packs/saltcrag.json` is stamped provisional
   (autonomous, ticket-sanctioned — T-130 step-7 posture). The E-32 Rule 4 gate keeps its
   meaning only if a human reads `packs/drafts/saltcrag/README.md` and either confirms or
   amends. Same for the promotion stamps on the three drafts.
2. **The three new brushes are forward-compounding only** — the saltcrag pack predates them,
   so this building never used them. The compounding claim's *second* data point (a style or
   re-formation that seats roof.thatch/clinker/limewash, expected cheaper) is the natural
   next epic rung; the receipts table names the timing honestly.
3. **Kit-presence semantics on program builds** — skip→FAIL noise beside an all-minor
   resemblance read, now measured twice (T-127 #5, here again). A presence contract for
   program builds is an open seam; nothing here weakened the styled path's contract.
4. **Gap-budget arithmetic under-credits all-minor profiles** — both styles' bests read FAIL
   at 8/2 while reading as the building at a glance (4/4). Two data points now; a gate-policy
   question for a future epic, not this ticket (the glance-vs-gate principle says the glance
   wins — but the gate is frozen and was honored).
5. **rustic's four backlog drafts remain unpromoted** — T-131's open human pass, untouched
   here by design (this ticket promoted only the saltcrag items its AC names).
6. **Minor**: `workshop --replay`/`--offline` npm conveniences still target the fixture
   subject only; namespaced runs replay through the pattern-book sweep (which is what the AC
   names). Receipts BEFORE snapshot is committed data in the runner — if the baseline ever
   needs re-deriving, it must come from `git show d679644`, not the live table.

## How to verify quickly

```
npm run factory:receipts && open benchmarks/sculpture/factory/receipts.md   # the one table
npm run patternbook:saltcrag:repro && npm run patternbook:saltcrag:offline  # the building, byte-identical
node benchmarks/sculpture/multi-angle-gate.mjs --subject barn --label patternbook-saltcrag --offline
open pr/assets/frames/multi-angle-barn-patternbook-saltcrag.png             # the sheet (4/4, judge's gaps labeled)
npm test                                                                    # 1924/1924
```
