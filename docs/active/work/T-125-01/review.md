# T-125-01 idiom-recognition — Review

Phase artifact 6/6. The handoff: what changed, how it is covered, what to watch.

## What shipped (5 commits on main)

1. `feat: building-program contract` — `schema/building-program.schema.json` (new),
   `src/recognition/program.mjs` + tests: AJV 2020 strict gate + pack-vocabulary validation
   (roles, roof idioms, pitch classes, proportions, opening/dormer feasibility, mass
   connectivity). `PROGRAM_REPLY_BUDGET = 3` (the declared T-114 bound).
2. `feat: recognition prompt + reply parser` — `src/recognition/prompt.mjs` + tests: pack digest
   (roles with diegetic rationales, MATERIAL_PRECEDENCE taught), sketch digest, embedded schema,
   strict bare-JSON rules; `parseProgramReply` = the runReplyPolicy parse (throws ⇒ malformed ⇒
   same-prompt re-ask; never a corrective addendum).
3. `feat: program compiler` — `src/recognition/compile.mjs` + tests: deterministic lowering to
   `workshop-program/v1` (the T-126 contract), roles resolve once, rhythm-spread layout,
   declarations (bands/openings) authored from what was assigned. Integration tests realize
   through the REAL registry and pass the REAL conformance gate.
4. `fix: joint opening lanes` — first live run refused 3/3 on an invented rule; vertically-
   overlapping same-wall entries now form one evenly-spread lane (door flanked by windows);
   prompt teaches the layout rules.
5. `feat: recognize runner + first drafts` — `benchmarks/sculpture/recognize.mjs`, npm
   `recognize:cottage|barn|offline`; committed records under `benchmarks/sculpture/recognition/`
   (program, replies+full raw texts, prompt, artifact, record, md, 4 renders × 2 subjects).

Files touched outside `src/recognition/` + runner: `package.json` (3 scripts). Nothing in the
sibling-owned `src/workshop/`, nothing in T-124's pack/registry, no pack data edits.

## Acceptance criteria — verdicts

- **Recognition seam** ✓ — `claude -p` shim via `requestTextWithImage`, `MODEL_TIERS.strong`
  (claude-opus-4-8); concept PNG + sketch sheet PNG in; schema+pack-validated program out;
  off-vocabulary rejected and re-asked within budget 3; ledgers + FULL raw replies committed
  (barn's ledger shows the loop earning its keep: off-band → malformed → accepted).
- **Realization wiring** ✓ — program → compile → `realizeProgram` (registry constructs +
  boxShell only): zero mesh cells, no fit tolerances (compile consumes only program + pack —
  the sketch never reaches realization). Pure composition unit-tested with synthetic programs,
  including conformance-all-pass integration legs.
- **Cottage + barn first drafts** ✓ — programs committed with raw replies and the exact
  prompt/schema; realized; rendered at the 4 gate azimuths (sha256 receipts); both pass all six
  pack conformance checks. Zero judge calls (renderViews is the only GL touch; evidence only).
- **Replayable** ✓ — `npm run recognize:offline`: committed program → byte-identical artifact,
  verified in two fresh processes; conformance re-verdicts PASS.
- **No per-building code** ✓ — runner is registry-driven with the self-grep recorded in each
  record.json (`generalization.clean: true`); `src/recognition/` greps clean for all four
  subject names (comments included). `npm test` 1818/1818 green.

## Test coverage

31 tests in `src/recognition/` (14 program, 7 prompt, 10 compile incl. 3 integration legs).
Covered: schema/pack gates and every rejection class, lane partition/merge/centering, layout
determinism, role resolution, declarations content, realize+conformance on gable/hip/pyramid/
multi-mass/joint-lane synthetics. NOT covered (accepted): the runner itself (impure, live —
project convention), renderViews output, actual model behavior (ledgers are the evidence).

## Open concerns for a human reviewer

1. **Dormer construct quirks are compensated in compile, not fixed in T-124's construct**: the
   default 1×2 face aperture orphans the dormer ridge row (single-component fail) and an
   eave-seated dormer is floodable (stair roofs never seal). Compile passes a 1×1 light and
   seats the front on the wall plane. If another consumer cards dormers into closure-checked
   builds, consider fixing upstream (a T-124 follow-up, not done here — sibling files).
2. **Conformance courses-even is weakened where it must be**: bands with >1 assigned block get
   `mixed: true` (vocabulary-only check). Single-material bands keep the strict per-course rule.
   The honest alternative (per-course declarations) belongs to the workshop's tightening.
3. **Recorded-but-not-realized program fields**: `walls.treatment` (timber-frame), `roof.trimRole`,
   `roof.gableRole`, decoration — surface dressing is the workshop/E-32 brush territory (passes
   need full build context). The cottage program already declares timber-frame; S-126's settle/
   dressing passes can consume it. Schema keeps them so programs don't lose the reading.
4. **Symmetry is never declared to the gate** (`declarations.symmetry: null`): the model's claim
   is recorded in `reading.symmetryClaim` only — compiled geometry (chimney atEnd, lanes) cannot
   yet guarantee cell-perfect mirroring. Tightening = make compile center everything when
   claimed, then pass the plane through.
5. **Roof family no-derivation trade-off**: an off-family field role (the barn's dark roof)
   realizes full-cube — chunky steps, value-correct. If packs want stair members for more roof
   fields, that is pack data (declare more roof families), not name derivation.
6. **The re-recognize workshop action stays unwired** (T-126 left the applier seam open for
   S-125 "later") — deliberately not wired here: this ticket commits the accepted draft; wiring
   re-sampling into the loop is a follow-up ticket's scope.
7. **First refusal records were superseded in place** (untracked at the time — no pin rotation);
   the surviving barn ledger preserves a real refusal→accept trace for audit.

## Suggested follow-ups (not blocking)

- S-127 milestone: judge the two committed drafts once each (the frozen gate).
- Wire `re-recognize` applier into `src/workshop/actions.mjs` from this seam.
- T-124 follow-up on the dormer construct (aperture default + sealing posture).
- Pack curation: consider `pitchClasses: [1, 2]` if steep reads should be expressible in rustic.
