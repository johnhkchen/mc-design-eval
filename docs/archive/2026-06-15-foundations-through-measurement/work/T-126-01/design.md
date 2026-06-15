# T-126-01 workshop-loop — Design

Phase artifact 2/6. Options weighed against the research; decisions with rationale.

## D1 — The revisable object: a minimal workshop program over an injectable contract

**Options.**
(a) *Artifact-only revision* (edit placements directly): cannot exercise "adjust idiom parameters /
re-realize" — those are program-level actions; rejected.
(b) *Adopt/define the S-125 program schema now*: S-126 is declared parallel with S-125 with
**disjoint seams** (S-126.md:48); authoring the recognition program schema here is exactly the
parallel-roots collision the project has been burned by before; rejected.
(c) **Chosen**: the loop core is generic over a small contract — `{program, realize(program)→artifact,
declarations}` — and this ticket ships a **fixture program** (`workshop-program/v1`, local to the
workshop) built only from landed T-124 seams: an ordered element list where each element is either a
generic hollow `shell` (data-driven: footprint, height, openings — per the generated-chain contract:
true holes, floorless) or a registry idiom `{idiom, spec}` realized via `getIdiom(name).generate(spec)`.
When S-125 lands, its validated program plugs into the same contract; nothing here names the
recognition prompt/schema.

**Fixture proof subject.** A rustic-cottage shell (pack `rustic`) judged against the committed cottage
concept (`benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png`), seeded with two visible,
action-matched defects: (1) an off-pack/mixed band on one wall (fixable by spray-paint; trips
`palette-in-pack`/`courses-even` → conformance improvement is *measurable*), and (2) a wrong roof
parameter (fixable by adjust-params + re-realize). No per-building code: the fixture is data
(committed JSON program), the shell composer is generic.

## D2 — Sanctioned actions: a registry with injectable appliers

Action vocabulary (the model picks from it; schema-validated; bounded re-asks):

- `adjust-params` `{elementId, params}` — merge partial spec into the element; the round re-realizes
  the whole program (re-realize is implicit every round, not a separate action).
- `spray-paint` `{dir, toBlock, fromBlock?, bounds?}` — E-23 path: `projectSurface(occ, dir)` over the
  current build, repaint matching surface cells within optional bounds, pack-vocabulary enforced
  (`paintFace`-style filters). Resulting placements are recorded in the ledger (deterministic replay
  re-applies the recorded placements; the applier is also deterministic given the artifact).
- `re-recognize` `{elementId}` — **declared but unwired**: its applier seam is injectable and absent
  until S-125 lands; if selected, the round records `action-unavailable` and continues (no crash).
  The prompt tells the model which actions are live. This keeps the AC's vocabulary without crossing
  the S-125 seam. Documented deviation, revisit at T-127.
- `done` — the model declares done with rationale; loop stops, recorded.

One action per round. Multiple actions per round were rejected: rollback semantics and the
conformance no-regress cage stay attributable only if a round is one atomic change (the E-15 cage
lesson; the E-26 settle trail is per-delta for the same reason).

## D3 — The round and its cage

Per round: realize → render 4 gate azimuths (evidence only) → **one** strong-tier exchange
(images: concept + 4 renders; reply = structured `{critique:{issues:[{region, issue, severity}]},
decision:"revise"|"done", action?}`) → apply action deterministically → `runConformance` on the
candidate → accept or roll back → ledger the round.

- **Single exchange** (critique + action in one reply) over two calls: halves metered spend, keeps
  the ledger entry atomic; the prompt carries the current program, the action vocabulary, and the
  pack palette so the model can ground both halves. Rejected two-call variant adds no information.
- **Reply policy**: `runReplyPolicy` from `judge-reply.mjs` with a workshop parser —
  bounded same-prompt re-asks (MAX 3), full raw-reply ledger entries. This is the committed pattern
  for malformed replies (never the prompt-mutating artifact retry).
- **Tier**: strong (`ROUTING_RUBRIC`: cross-view judgement). Additive row
  `{op:"workshop-critique", tier:"strong", ...}` in the model-tier routing table. No new light
  detectors in this ticket.
- **The conformance cage**: score a conformance report lexicographically as
  `(passedChecks, -totalFindings)`. A candidate that scores **strictly worse** than the current
  build is rolled back (recorded with both reports); equal-or-better is accepted. Pass→fail on any
  check is automatically a regression under this metric (passedChecks drops). Chosen over
  per-check-only comparison because findings-count lets a still-failing check *improve* measurably —
  which is also the ticket's "measurable improvement" evidence. GL renders are excluded from the
  gate entirely (reproducibility rule: renders are evidence, decisions gate on deterministic data).
- **Budget**: `budget.rounds` declared in the program, recorded in the ledger header; loop stops on
  `done` or exhaustion (`budgetExhausted` recorded). Structural termination, the E-15 property.

## D4 — The ledger and replay (Rule 5)

One committed run record `benchmarks/sculpture/workshop/<subject>.json` (+ `.md` digest) plus the
final artifact `workshop/<subject>/final-artifact.json` — all through `guardedWriteRecord` with
`preflightPins` before any metered call (T-119: preflight-before-spend). Render PNGs are evidence
(gitignored work dir + `pr/assets/frames/` copies), referenced by relative path in round entries.

Ledger shape (`workshop-ledger/v1`): header `{subject, pack, packSha, program (seed, inline),
budget, modelTier, instrument:{azimuths, width, height}}`; `rounds[]` each
`{round, renders[], replies[] (raw, judge-reply pattern), critique, decision, action,
applied:{programAfter? | placements?}, conformance:{before, after, score, accepted, reason}}`;
`final:{outcome:"done"|"budget-exhausted", rounds, conformance, artifactBytes:sha256?}` — byte
identity itself is asserted by JSON string equality (house convention), the sha is a convenience.

**Replay** (`--replay`): no model calls, no GL. Load the committed ledger, start from the seed
program, re-apply each **accepted** round's recorded action (adjust-params → merge + re-realize;
spray-paint → recorded placements), realize, serialize, byte-compare to the committed
`final-artifact.json`; also re-run conformance and compare to the recorded final report. `--offline`
re-asserts the committed ledger's internal consistency (schema, budget bounds, reply-policy
invariants, accepted-rounds ↔ final-artifact byte agreement) without re-realizing renders — the
multi-angle `--offline` precedent. Exit codes 0/1.

## D5 — Judge isolation, structural (the T-119 way)

Two independent enforcements, both unit-tested:

1. **Source-scan absence** (the house DENY pattern, form-edit/loop precedents):
   `src/workshop/isolation.test.mjs` reads the source of every `src/workshop/*.mjs` **and** the
   runner `benchmarks/sculpture/workshop.mjs`, asserting no match for the judge seam patterns —
   `multi-angle-gate`, `gate-instrument`, `spawnGate`, `judgeThroughPolicy`,
   `aggregateMultiAngle`, `parseMultiAngleVerdict` — and that no workshop file mentions the gate
   record namespace as a write target. (`judge-reply.mjs` is explicitly allowed: it is the reply
   *policy*, not the judge.) The deny list is precise strings, not `/judge/`, to avoid the
   self-grep-matches-comments failure mode.
2. **Pin-guard refusal**: extend `src/form/pin-guard.mjs` with a small additive seam —
   `GATE_RECORD_NAMESPACES` (frozen: `benchmarks/sculpture/multi-angle/`) and an optional
   `domain` param on `guardedWriteRecord`/`preflightPins`; `domain:"workshop"` writes whose `rel`
   falls inside a gate namespace **throw PinGuardError regardless of rotate/sanction**. The
   workshop runner passes `domain:"workshop"` on every write. Unit tests: the refusal fires even
   with `rotate:true`; non-workshop domains unaffected (additive, no behavior change for the nine
   existing writers). Chosen over a workshop-local wrapper because the AC says "the **pin-guard**
   refuses" — the enforcement lives in the guard, not in code the workshop could bypass by calling
   the guard directly.

The frozen judge is reached today only by spawning `benchmarks/sculpture/multi-angle-gate.mjs`;
the workshop has no spawn of it, no import of it, and cannot write its records. S-127 convenes the
gate from *outside* the workshop.

## D6 — Module placement

Pure core under `src/workshop/` (test discovery is `src/**/*.test.mjs`; benchmarks are not
discovered): `program.mjs` (schema + load/validate + realize), `actions.mjs` (registry + appliers),
`critique.mjs` (prompt builder + reply parser), `loop.mjs` (the round state machine over injectable
seams: `exchange`, `render`, `conform` — pure-testable with synthetic seams, no GL/model imports at
top level), `replay.mjs` (replay + offline assertions). Impure composition in
`benchmarks/sculpture/workshop.mjs` (CLI, GL renders, shim exchange via `runTieredOp`, pin-guard
writes). Fixture program: committed JSON at `benchmarks/sculpture/workshop/fixture/program.json`
(authored data, like `packs/rustic.json`), loaded + validated by `program.mjs`.

## Rejected along the way

- **Reusing E-15 `reviseLoop`**: its objects are artifact regions and an IoU score seam; the
  workshop's objects are program elements and a conformance cage. The *shape* (trace, accept/rollback,
  structural termination, injectable seams) is reused as a pattern, not the code.
- **Judge-isolation by convention** (just don't call it): ticket forbids; T-119 showed only
  structural guards hold under pressure.
- **Gating rounds on render-derived metrics** (IoU vs concept): reintroduces the metrology trap the
  E-31 pivot retired, and GL is excluded from decisions by the reproducibility rule.
- **Per-round committed pins** (one file per round): nine-writer precedent is one record + one md
  per run; per-round files multiply pin surface with no review benefit; rounds nest in the ledger.
- **Hashing renders into the cage**: renders differ across GL stacks; evidence only.
