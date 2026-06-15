# Plan — T-030-01 (pr-research-desk)

Ordered steps to produce `pr/research/audience-message-brief.md`, plus how each is verified. This
is a comms artifact, so "verification" = does the receipt back the claim, and does the AC hold —
not unit tests.

## Verification strategy (what "done" means here)

- **AC-driven.** Three acceptance criteria; each maps to a concrete check (below). The brief is
  done when all three pass.
- **Receipt audit, not test suite.** The decisive check is: every number/claim in the brief traces
  to a run `summary.json`, the journal, or a named artifact path that exists. No code runs.
- **Handoff check.** Read the brief as if I were S-031: can I answer the six interface questions
  from `structure.md` using the brief alone? If yes, AC #3 holds.

### AC → check map
- **AC #1** (brief exists with audience / hook / framing+two threads / trust beats / CTA) → §1–§7
  present and non-empty after Step 5; verified by a section-presence read in Step 7.
- **AC #2** (claims tied to real receipts, no fabricated numbers) → the §9 receipts table + inline
  citations; verified by the Step 6 receipt audit (each row's source path/run actually exists).
- **AC #3** (tight enough to brief S-031) → the six-question handoff check in Step 7.

## Steps (each small enough to be a single commit)

### Step 1 — Confirm the receipts are real (pre-flight, already largely done in Research)
- Re-verify the load-bearing citations exist before writing them into a "no fabrication" brief:
  - run 014 `summary.json` shows `overall: strong`, `perSample: [strong,strong,strong]`,
    `detail: competent`, blocks 10013, cost ~$1.64, seed 11 — **confirmed in Research**.
  - run 005 cost/time ($5.34, ~29 min) and run 007 regression (4.0→3.33) — from the journal log.
  - the 333-block box vs 8,018-block temple — journal P1 / attempt log.
  - five references + concept PNGs exist on disk — confirmed via `ls` in Research.
- **Verify:** spot-check one `summary.json` field I'm about to quote (run 014) — already read; if
  any other hard number is needed at write time, open that run's `summary.json` first.
- **Commit:** none (research already committed-equivalent as work artifacts).

### Step 2 — Draft §1–§3 (audience, hook, lead framing)
- Write the audience couplet (reward/punish), the cold-open + its two receipts + the "do NOT open
  on" guards, and the single lead-framing paragraph with the demoted-not-dropped list.
- **Verify:** §2's caption claims ("same model") are literally true (the gray box and run 014 are
  the *same* `claude-opus-4-8` path — journal P1 says "same model/path"). 

### Step 3 — Draft §4 (the two threads) with the Thread-A ladder table
- Build the rung → technique → score → run-ID table for Thread A from the attempt log (gray box →
  v2 design-doc → vRef reference grounding → 014 one-plane = strong 3/3). Write Thread B (velocity,
  transfer 019→022, pivot, explosion, rotation proof).
- **Verify:** every run ID in the table resolves to a `runs/NNN-*` directory; every score word
  ("strong"/"competent") matches that run's `summary.json` or the journal's stated band.

### Step 4 — Draft §5–§7 (trust beats, vision, CTA)
- Three trust beats with receipts; the sculptor/Golden-Gate end-frame; the follow+discuss CTA.
- **Verify:** each trust-beat number (best-of-N $5.34/29min; v5 4.0→3.33; detail competent) is
  quoted exactly as the journal states it; no rounding that changes meaning.

### Step 5 — Draft §8–§10 (honesty guards, receipts table, handoff)
- Write the concept≠real-build rule, v1-sequencing caveat, no-invented-metrics guard; the
  consolidated §9 receipts table; the §10 S-031 handoff block + the `pr/script/README.md` pointer.
- **Verify:** §9 table is a *superset* of every number used in §1–§7 (nothing claimed upstream is
  missing a source row).

### Step 6 — Receipt audit pass (the AC #2 gate)
- Read the finished brief end-to-end with one question: "is there any number or strong claim
  without a citation?" Fix or cut any orphan claim. Confirm each cited path exists on disk.
- **Verify:** zero uncited numbers; all paths/run-IDs resolve. This is the hard gate.

### Step 7 — Handoff + AC presence check (AC #1 + AC #3 gate)
- Section-presence read: §1–§7 all present and non-empty (AC #1).
- Six-question handoff read (audience / first frame+words / caption spine / trust-beat placement /
  claimable numbers / ending+ask) — all answerable from the brief alone (AC #3).
- **Verify:** all three ACs check; write `progress.md` noting any deviation.

### Step 8 — Commit
- Single commit: `docs(E-12/S-030): audience+message brief for evolution-showcase` adding
  `pr/research/audience-message-brief.md` and the T-030-01 work artifacts.
- **Verify:** `git status` clean afterward except intended files; brief renders as valid markdown
  (tables well-formed).

## Testing strategy (explicit, per RDSPI)

- **Unit tests:** none applicable — no code path. The project's `npm test` suite is untouched
  (this ticket adds no `.mjs`); I will *not* claim a test run that didn't happen.
- **Integration check:** the "integration" here is the handoff to S-031 — covered by the Step 7
  six-question read. If a future session runs the script desk and finds a gap, that's the real
  integration signal.
- **Regression guard:** the receipt audit (Step 6) is the regression guard against the project's
  one cardinal sin for comms — fabricating a metric. The journal itself models this discipline.

## Risks & mitigations

- **Risk:** quoting a score from memory that the `summary.json` contradicts. *Mitigation:* Step 1/3
  verify against the files; the §9 table forces a source for each.
- **Risk:** the brief drifts into writing the *post* (S-034's job). *Mitigation:* §10 explicitly
  scopes this as an internal brief; post copy is downstream.
- **Risk:** over-promising the realness payoff that doesn't exist yet (real-AND-gorgeous build).
  *Mitigation:* the v1-sequencing honesty guard (§8) is mandatory, not optional.

## Out of scope (deferred to sibling/downstream tickets)

- The actual beats/captions/storyboard → S-031 (`pr/script/`).
- The turntable render that produces the rotation proof → S-032 (`pr/`-adjacent engineering).
- Curated frame sequence + scores overlay → S-033 (`pr/assets/`).
- Output spec + rough cut + LinkedIn post copy + Golden-Gate end-frame gen → S-034 (`pr/production/`).
