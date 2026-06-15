# T-138-02 proportion-milestone-resumption — Design

## Shape of the decision space

No new code: every seam this ticket exercises was committed and tested under T-138-01. The
design decisions are operational — how to resume safely (inherited dirty state, pin rotations,
spend risk), under whose authority the records run, and where evidence lands. Each decision
below names the alternatives and why one wins.

## D1 — The dirty cottage seed: restore, then regenerate (chosen)

Options:
- **(a) `git restore` the committed `workshop/cottage/program.json`, then run the chain.** The
  chain's stage 3 re-derives the seed deterministically from committed inputs (recognition
  record + sketch + T-135 declarations) and writes through `guardedWriteRecord`. Starting from
  the committed state proves the regeneration claim — the run's seed sha is attributable
  entirely to the chain, with zero contamination from the interrupted session.
- (b) Leave the dirty file; the chain overwrites it anyway. Functionally likely identical, but
  the T-119 pin preflight compares tracked pins before spend — a dirty tracked pin risks a
  preflight refusal mid-resume (pin-guard disagreement = stop-the-line per the inherited plan),
  and if the chain dies pre-write we're left unable to distinguish residue from output.
- (c) Adopt the working-tree file by hand. Forbidden by the ticket, explicitly.

Chosen: **(a)**. The ticket's own wording ("supersedes the uncommitted working-tree state,
which is then committed or discarded as the chain's output dictates") is satisfied cleanly:
discard first (it is superseded by construction), then the chain's output is what gets
committed. Rejected (b) for the preflight risk and the forensic ambiguity; (c) is forbidden.

## D2 — Run authority: `--ticket T-138-02` (chosen)

The chain embeds the run's authority in the record (`ticketId`); repro must be invoked with the
same ticket (T-138-01 step-7 lesson). Options: carry T-138-01 (continuity with the barn
records) or T-138-02 (the actual owning ticket). Chosen: **T-138-02** — the record should name
the authority that actually ran it; the interruption is a fact the story review narrates, not
one the records should paper over. The milestone composer reads `ticket` fields verbatim and
reconciles nothing, so mixed tickets across the three records are honest, not inconsistent.
Consequence: every cottage repro invocation in scripts/verification must pass
`--ticket T-138-02` explicitly (the `patternbook:repro`/`:offline` npm scripts pass no ticket —
they byte-compare records whose embedded ticket is data, so they are unaffected; only a
re-derivation that REBUILDS the record embeds the flag. Verified in implement: if the cottage
repro leg fails on a ticket-field mismatch, the invocation needs the flag, exactly as
`measured:barn:saltcrag` bakes in `--ticket T-138-01`).

## D3 — Invocation style: direct `node` for the chain, npm + `--` for the gate

`patternbook:cottage` bakes in neither `--ticket` nor `--rotate-pins`. Per the
flag-swallowing precedent (a dropped flag once live-swept and overwrote kit pins), flags ride
either behind `--` or on direct node. Chain: direct node (matches T-138-01's barn invocations):
`node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-138-02 --rotate-pins`.
Gate: the named script IS the run's name — `npm run gate:patternbook:cottage -- --rotate-pins`.
Rejected: editing package.json to add a baked-in cottage variant — T-138-01 added scripts only
where the plan named them; a one-shot rotation flag must NOT be baked into a reusable script
(rotation belongs to an owning ticket, T-119 rule).

## D4 — Spend discipline: probe before every spend block; honest-partial contingency

Before the chain and again before the gate: minimal `claude -p` probe asserting a non-empty
token-bearing reply (`spend-limit-reply-failure-mode` — a zero-token limit notice would
otherwise burn the bounded T-114 re-ask budget mid-run). If a probe fails: write progress.md
naming the block reached, commit the honest partial (anything already verified), and stop —
exactly T-138-01's precedent. No retry loops against a spend wall.

## D5 — Execution: chain in background with liveness monitoring

The barn chain ran ~25 wall-minutes for 3 rounds; the cottage may run 6. Run the chain as a
background task and monitor liveness (T-138-01 used the same pattern). The gate is shorter
(4 renders + ≤4 judge calls) but also backgrounded for the same reason. Verification
(repro/offline) runs foreground after each completes — exit codes are the contract.

## D6 — Never re-bank baselines

`proportion-baselines.json` is the committed "before" — pre-rotation quotes including the
cottage's 0-judged/4-coverage-refused state. Re-running `--baselines` after rotation would
quote the wrong side of the movement claim (and the runner refuses without `--rotate-pins`
anyway). The composer reads baselines as committed. Rejected: any "refresh" of baselines to
make numbers line up (`challenge-repro-drift-preexisting`: never regenerate pins to green a
compare).

## D7 — Compose order and the witness SKIPs

Order: cottage chain+gate committed FIRST, then `milestone:proportion` (it reads committed
records; composing before the cottage rotation would quote a stale chain record beside a
baseline that says coverage-refused — a milestone that contradicts itself). Then
`milestone:proportion:repro` (byte-identical), then `pattern-book-compare.mjs --rotate-pins`
(head-to-head + pattern-book-milestone.md re-composed on the new verdicts), then the witness
degradation checks: `proportion:repro` and `visibility:repro` must exit 0 **with named
pin-mismatch SKIP lines** — the committed witness records reference now-retired shas; a SKIP is
the designed degradation, a FAIL is a stop-and-record. Assert the skip lines appear (grep), not
merely exit 0.

## D8 — Evidence placement

- The four modified barn `workshop-*-{before,after}.png` frames are outputs of the already-
  committed barn runs (mtimes match the run windows). They land in the compose commit — the
  glance page (`pr/assets/proportion-milestone.md`) is what cites them, so they belong beside
  it, not orphaned in a fixup. The cottage's frames regenerate during its chain run and land in
  the cottage commit (they ride the same per-subject commit shape as T-138-01's, where the
  multi-angle frame rode the subject commit).
- The committed sheet copy is the `pr/assets/frames/multi-angle-cottage-patternbook.png`
  (multi-angle/'s own sheet is gitignored) — same as the barn commits.

## D9 — Docs and review scope

- design-learnings gains ONE new section ("E-33 — the proportion loop") appended after E-32,
  content per the inherited step-10 list, written from record evidence (ledger lever citations,
  ratio movements, the T-133 measured-vs-estimated numbers, the steep-unlock usage question
  answered from ledgers either way, the flagged ≤2 budget with both arithmetics quoted). The
  E-12 handoff is a pointer to the pr/assets page, in that section.
- review.md (this work dir) is the S-138 story review covering BOTH tickets: T-138-01's landed
  half cited by commit sha, the interruption named, this ticket's half with its verification
  ledger. RDSPI's reviewer reads one file.
- `docs/active/work/T-138-01/` (untracked artifacts) is committed with the docs commit —
  precedent `0c19430`; the story review cites them.

## D10 — What this ticket does NOT touch

T-136's `benchmarks/sculpture/levers/` + work dir (their session; the known input-ref drift on
their records after our rotation is recorded, not repaired); Lisa infra files; the ticket
frontmatter (Lisa's); the stray HEIF and `challenge/cottage/*` untracked files (other sessions';
surfaced in review.md as observations). No per-building constants anywhere (AC) — nothing in
this ticket writes code, so the existing self-greps continue to enforce it.

## Failure-mode table (designed responses)

| Failure | Response |
|---|---|
| Spend probe fails | Honest partial commit + progress.md + stop (D4) |
| Workshop `exchange-refused` | Commit honest partial, record, stop (inherited contingency) |
| Cottage gate coverage-refusal on NEW build | STOP: T-137 unblock failed on new geometry — investigate, never weaken |
| Judge `unparsed` views | `npm run gate:rejudge -- --subject cottage --label patternbook` (completes only unparsed, T-114) |
| Witness checks FAIL (not SKIP) | Stop and record (D7) |
| `guardedWriteRecord` refuses a preflighted write | Stop-the-line (pin-guard disagreement, inherited rule) |
| GL/render failure | Loud pipeline failure; rerun the stage |
