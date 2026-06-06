# T-018-01 · Plan — ordered, verifiable steps

Synthesis ticket: the plan is short and verification-heavy (confirm before asserting). Each step is
independently checkable.

## Step 1 — Confirm the locked artifacts (verify, do not change)

- `git status --short baml_src/conceptart.baml benchmarks/temple-facade/conceptart.mjs` → expect empty
  (clean working tree against the committed locks).
- `git log -1 --oneline -- baml_src/conceptart.baml` → expect 33de8c8 (T-017-01 hardening).
- `git log -1 --oneline -- benchmarks/temple-facade/conceptart.mjs` → expect 565f32f (T-016-01 lock).
- `grep -n 'arg("variant"' benchmarks/temple-facade/conceptart.mjs` → expect default `"C"`.
- Eyeball `baml_src/conceptart.baml` for the 3 T-017 clauses (figures-override-doc, named text
  offenders + frieze, pure-black bg + bright outermost edges).
- **Verification:** all four checks match. **DONE in research/plan — confirmed.** If any had failed,
  STOP synthesis and pivot to a corrective edit (+ `npm run baml:gen` + recommit) per design Decision 4.

## Step 2 — Confirm the test gate is green (baseline)

- `npm test` → expect `# pass 133 / # fail 0`.
- **Verification:** 133/133. **DONE — confirmed green before any edit.**

## Step 3 — Decide on re-generation (design Decision 1)

- Decision: **do NOT regenerate.** The T-017-01 final audit (all-5 PASS table, identical locked
  prompt) is the freshest evidence and is already journaled; a fresh single draw adds non-determinism
  risk without confidence gain. Record this choice explicitly in the section and in progress.md.
- **Verification:** no Nano Banana call made; `concepts/` untouched.

## Step 4 — Append the consolidation section to `design-learnings.md`

- Append the `## Stage-1 concept-art · CONSOLIDATION + stage-2 handoff (E-09, T-018-01 …)` section at
  EOF, in the 8-block order from structure.md. Append-only — no existing line edited.
- Content sourced from verified facts only: variant decision (T-015-01), lock (T-016-01), hardening +
  5/5 audit (T-017-01), and the locked `conceptart.baml` clauses (read this session).
- Must satisfy all four acceptance criteria in one section: (1) lock confirmed, (2) best variant +
  voxel-ready criteria + load-bearing rules + caveat, (3) one-paragraph stage-2 handoff, and set up
  (4) the test re-confirmation.
- **Verification:** `grep -n 'T-018-01' docs/knowledge/design-learnings.md` shows the new heading;
  section contains a "stage 1 is DONE" line, the four voxel-ready criteria, and a "Handoff to stage 2"
  paragraph.

## Step 5 — Re-confirm the test gate after the edit

- `npm test` → expect 133/133 (markdown-only change cannot affect tests; the criterion is explicit, so
  re-run rather than assume).
- **Verification:** still 133/133.

## Step 6 — Write `progress.md`

- Record steps executed, the no-regeneration decision, the confirmation results, and any deviation.

## Step 7 — Write `review.md`

- Handoff doc: what changed (one doc section), acceptance-criteria status, test coverage + the
  deliberate no-new-tests gap, residual caveats carried forward, and the stage-2 handoff statement.

## Testing strategy (whole ticket)

- **Unit/integration tests:** none added — by design and consistent with the entire stage-1 chain
  (concept quality is eyeball-only; a string/constant assertion adds no behavioral coverage). The
  acceptance test for a *knowledge* deliverable is human review of the journal section.
- **Regression gate:** `npm test` 133/133, run before (step 2) and after (step 5) the edit.
- **Confirm-not-change discipline:** step 1 is a hard gate — the synthesis only asserts facts it has
  verified this session; a failed confirmation would have rerouted the ticket to a corrective edit.

## Commit

Left to the operator / Lisa per the chain's convention. The durable record (journal section + work
artifacts) is in the working tree; no source/client changes to stage or regenerate.

## Rollback

Trivial: the only product change is an append to one markdown file. Reverting = deleting the appended
section. No source, schema, client, or image state is touched.
