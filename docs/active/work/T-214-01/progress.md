# T-214-01 — Progress

**Run-and-judge ticket: no source change.** All steps executed per `plan.md`. Subscription shim only; frozen
instrument untouched.

## Steps

- **Step 0 — pre-flight (done).** `npm test` 2446/2446 green (the T-213 count). `git status -- src measurements
  benchmarks experiments` empty.
- **Step 1 — GUARD_ONLY (done).** `GUARD_ONLY=1 …trimmedMean…improving…BATCH_SIZE=4…MAX_ROUNDS=8` exits clean:
  "assets present; GL available", round-0 + beside sheet written, both new knobs parsed, **zero spend**.
- **Step 2 — metered re-climb run 1 (done).** `…trajectory.json … 2> climb.log`, background + monitored. Exit 0
  (clean, not an abort). Trend `14→14→14→14→22→22→22`, stalled. 12 diagnoses, 0 timeouts.
- **Step 3 — trajectory read (done).** Only `apply_gable_roof` kept (r3, `[36,0,8]`→trimmedMean 22, +8). Both
  form-closers rolled back: `close_shell` (r1) by the no-new-major guard, `construct_walls` (r2) for no closure
  gain; `close_shell` re-pick (r4) no-op'd (gable diluted coverage 0.27 < 0.5). Form never closed
  (closure 0.667 throughout). Kept build = high-water (arch never reached).
- **Step 4 — glance (done).** Read `round-3/beside-concept.png`: brown gable on an open colonnade. **M1 not
  met** on all four criteria — see `verdict.md`.
- **Step 5 — reproducibility / run 2 (done; tier-2 triggered).** Run 1 hinged on the close_shell rollback, so a
  second run was warranted. `trajectory-2.json`: trend `16→16→16→16` (agent-done), **nothing kept** — close_shell
  rolled back identically (r1), construct_walls rolled back (r2), agent quit. The form-never-closes verdict
  reproduced **2/2**. The aggregator's one KEEP (run 1 gable) cleared by +4 slack — robust to vote noise.
- **Step 6 — adversarial checks + boundary + close-out (done).** Default-OFF rule → `npm test` 2446/2446;
  `git status -- src measurements benchmarks experiments` empty; `builds/` is gitignored. Cost: 7 scored builds,
  21 metered diagnoses, 0 timeouts. `verdict.md` written.

## Deviation from plan

- **Ran the second climb (plan Step 5 tier-2).** Planned as conditional; triggered because run 1's outcome
  hinged on a single noisy form-move rollback. The second run confirmed the rollback is structural (2/2), which
  is the load-bearing evidence that the *form gate*, not the aggregator's variance, is the ceiling. Worth the
  spend (9 diagnoses) — without it the verdict would rest on one run.

## Outcome

**M1 not landed; architecture ceiling named (form-move closure gate), accept-rule removed as the confound.**
The trimmedMean aggregator fixed the median-discards-minority defect live (run 1 r3), but the climb stalls at
the FORM phase before the detail phase (the +48 arch) is reached. E-55 closes with the reviewer decision in
`verdict.md` (form-phase fix / seed-from-closed-shell → successor epic). The E-54 stop-line stands; no
gatehouse-specific fix made.
