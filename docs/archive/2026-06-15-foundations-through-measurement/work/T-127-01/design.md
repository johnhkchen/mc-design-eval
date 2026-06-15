# T-127-01 styled-house-milestone — Design

Phase artifact 2/6. Decisions for the E-31 terminal: how the pattern-book end-to-end composes,
how the judge is convened exactly once per subject, and how the head-to-head is recorded.

## D1 — Chain composition: a new runner that SPAWNS the workshop CLI

**Options**
a) *Two manual commands per subject* (commit a program, then `workshop:<key>`): no single named
   `npm run`, no chain record, seam verification left to the operator. Fails the AC's wording.
b) *In-process chain*: new runner imports `runWorkshopLoop` and re-implements renders/exchange/
   record writes. Duplicates ~100 lines of workshop.mjs's impure composition (two places to keep
   the domain-guarded writes correct). Rejected — one live-loop implementation must stay THE one.
c) **Chosen: `benchmarks/sculpture/pattern-book.mjs` spawns `workshop.mjs --subject <key>` as a
   child process** (the generated-milestone precedent of composing via a runner's own CLI —
   pointed at the workshop, never the gate). The chain runner owns: seam verification (committed
   sketch + recognition records re-asserted), compile + budget + committing
   `workshop/<key>/program.json`, spawning the workshop, then the chain record
   `pattern-book/<key>.{json,md}` with stage receipts (sha256 of every consumed committed input).

The chain stages and their sources:
1. **sketch** — verify committed `form-sketch/<key>.json` + `<key>-sheet.png` exist; record shas.
   (T-123's stage; not re-run — the committed conditioned read is the input recognition saw.)
2. **program** — verify committed `recognition/<key>.program.json` re-derives its committed
   artifact byte-identically (the same assert `recognize:offline` makes, in-process); record
   shas + the T-125 reply-ledger summary (askCount/budget). The model-recognized program is
   CONSUMED, not re-sampled: re-running recognition live would re-roll committed T-125 records
   (a pin rotation belonging to an owning ticket — T-119 policy), and the AC's chain names
   T-125's program as the stage, not a fresh sample.
3. **realize** — compile → workshop-program/v1, override `budget` (D3), `assertWorkshopProgram`,
   realize + conformance (must PASS — it did in T-125; a fail here is `pipeline-failed`, honest
   record, exit 1). First write of `workshop/<key>/program.json` via `guardedWriteRecord`
   (domain "workshop").
4. **workshop** — spawn `node benchmarks/sculpture/workshop.mjs --subject <key>` (inherit
   stdio; non-zero exit = `pipeline-failed`). The workshop commits its own ledger/digest/final
   under its own pin preflight.
5. **record** — read back the workshop ledger/final (shas, outcome, rounds, rollbacks,
   conformance trajectory), embed the self-grep (no subject keys in the runner source), write
   `pattern-book/<key>.{json,md}`.

**Modes**: live (above) · `--repro` — no model, no GL, no child spawn: re-assert stages 1–3
byte-identically (program → compile+budget → committed workshop program), `replayLedger` →
byte-compare the committed final artifact, re-derive final conformance; exit-coded ·
`--offline` — alias-strict variant that additionally runs `offlineAssert` on the committed
workshop ledger (reply-policy bounds, cage arithmetic). Both satisfy the AC's
"replay byte-identical (`--repro`/`--offline`)".

## D2 — Workshop subjects become registry-derived data

workshop.mjs's `SUBJECTS` table gains cottage/barn by **derivation from the durable-skin
registry**, not by hardcoded rows: every durable-skin subject with `glb && generated?.scale`
(the same predicate recognize.mjs uses) gets
`{ program: workshop/<key>/program.json, concept: benchmarks/sculpture/<def.concept>, pack:
packs/rustic.json }`; `fixture` stays the explicit synthetic row. No subject names enter the
source (E-25 Rule 3 / E-31 Rule 2); the live mode still fails loudly if the program file is
absent (chain stage 3 is what writes it). Rejected: hardcoded rows — legal as data (fixture
precedent) but the derivation is the stronger, already-proven pattern.

## D3 — The declared budget: 6 rounds, set by the chain, recorded

`compileProgram` hardcodes `budget: {rounds: 1}` (T-125's commit-the-draft posture). The chain
overrides to **`{rounds: 6}`** — the fixture proof-run's declared budget, the only calibrated
value the project has (N=1, noted honestly). One named constant in the chain runner, identical
for both subjects (no per-subject tuning), recorded in program + chain record. Rejected:
rounds 1 (no revision — the AC's "workshop revision" stage would be vacuous); >6 (uncalibrated
spend; T-126 showed late rounds fixate on cage-forbidden upgrades).

## D4 — The judge is convened from OUTSIDE anything that touches the workshop

The AC requires the T-126 isolation receipt to still hold. generated-milestone spawns the gate
from its chain — that precedent is NOT followed here, because this chain composes the workshop:
- The gate runs as its own command, once per subject, fresh label **`patternbook`**:
  `gate:multi -- --subject <key> --label patternbook --artifact
  workshop/<key>/final-artifact.json --reference recognition/<key>.artifact.json`.
  Wrapped as npm scripts `gate:patternbook:cottage|barn` (encodes the flags; avoids the
  `npm run` flag-swallowing failure class).
- `--reference` = the realized recognition draft: the chain's RAW input build, the T-115
  semantics for the aperture fixpoint (the final build is post-revision; def.build is the
  styled-path artifact — both are the wrong raw input).
- **Pins**: `multi-angle/<key>-patternbook.{json,md}` are first writes — untracked, no rotation,
  **no pins retired** (recorded explicitly in the journal; the AC's "pins rotated … with retired
  pins named" is satisfied vacuously and said so — the generated-label records are NOT re-rolled,
  they are the comparison baseline). T-114 policy applies to malformed replies only
  (`gate:rejudge` with the patternbook label if a view exhausts to unparsed).
- `src/workshop/isolation.test.mjs` gains `pattern-book.mjs` in its scanned-runner list: the
  chain is workshop-domain and must prove it never references a judge seam. This is why the
  head-to-head composer (D5) is a separate file — it must read `multi-angle/` records, a token
  the isolation scan refuses.

## D5 — Head-to-head: a separate pure composer

New `benchmarks/sculpture/pattern-book-compare.mjs` (`patternbook:compare`): reads the four
committed gate records (`{cottage,barn}-{patternbook,generated}.json`) + the two chain records +
conformance/census data; emits `pattern-book/head-to-head.{json,md}` — ONE table per the AC:
verdicts (gaps n/budget, same-object n/4), per-angle named causes (severity/attribute/region),
conformance results, cell census, kit presence — and a `pr/assets/pattern-book-milestone.md`
embedding the patternbook and generated sheets side by side per subject (the sheets already land
in `pr/assets/frames/` from the gate; no new image instrument — the E-12 handoff is curated md +
existing frames). Pure read/compose, deterministic, unit-testable (row composition from record
fixtures). Whichever way the verdicts fall, the table ships (E-29 honesty precedent).

## D6 — Honest-miss vocabulary (the AC's third bullet)

The compare record carries a `findings[]` block: for each missed angle, the named cause chain —
which attribute/region the judge named, what the workshop ledger shows it tried (or never saw),
and where the cause originates: `recognition` (the program mis-named a form → "a measured limit
of the model's visual judgement", first-class), `workshop-cage` (a legitimate revision rolled
back by static band declarations — T-126 concern #1), `workshop-blind` (model never raised it),
or `realization` (registry construct limits, e.g. full-cube roof fields). Attribution is
hand-written into the journal from the ledgers/verdicts, not auto-classified — no new detector
is built for a measurement epic's journal (2.5-D sector lesson: scoped detectors only when a
loop consumes them).

## D7 — design-learnings + tests

- `docs/knowledge/design-learnings.md` gains the **pattern-book builder (E-31)** section
  (appended after E-30): thesis (recognition-over-reconstruction), the mode split (workshop vs
  ruler), what the revision loop did/didn't catch (from the real ledgers), over/under-reach,
  the head-to-head table inline. Written last, from committed records only.
- Tests: pure helpers get units — the budget-override + program-commit composition (compile →
  override → assert → byte-stable serialize), compare-row composition from fixture records, and
  the workshop SUBJECTS derivation (predicate + path shapes). Runners stay untested per
  convention; `--repro`/`--offline` are the integration assertions. Isolation scan extended
  (D4). `npm test` green is an AC.

## Risks accepted

1. **Cage rollbacks of legitimate upgrades** (T-126 #1) will likely cap what revision can do —
   recorded as findings, not patched mid-milestone (a declarations-co-edit action is a named
   follow-up, not this ticket).
2. **Coverage/kit-presence vs pack vocabulary** (research §constraints 3): a pattern-book build
   can fail a view's coverage precondition on zone-dominant mismatch — the judge is then never
   called on that view and the aggregate records why. First-class outcome.
3. **Live-model variance**: recognition is fixed (committed programs); workshop critiques and
   judge verdicts are live and land as they land. Budgeted by T-114 bounds everywhere.
