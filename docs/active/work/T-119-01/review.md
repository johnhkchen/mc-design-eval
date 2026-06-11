# T-119-01 pin-protection — Review (handoff)

## What this ticket did

Turned the two T-116 pin incidents from "vigilance" into structure. Committed records are now
guarded at every write site of the nine pin-writing runners (refuse-by-default, byte-identical
always passes, `--rotate-pins` explicit, refusals before any model/judge spend), the reskin
record rebuild is judge-free by construction (`component-skin.mjs --distill-only` over a pure
distiller), the rotation rules are a binding knowledge doc, and T-111 residual 4 is **decided**:
verdict pins retained as canonical, the three stale reskin summaries rotated judge-free with the
retired pins named.

## Commits (all on `main`, suite green at each)

| Commit | Content |
|---|---|
| `ff63d6a` | pin-guard core: pure decision matrix + preflight + guarded-write IO (fail-closed) |
| `cb59dea` | pure component-skin distiller + `--distill-only`; live path preflights before the chain |
| `7fcfe42` | guard integration across kit-extract, zone-map, gate, 4 milestone runners, durable-skin + conformance sweep |
| `63751e1` | `docs/knowledge/pin-rotation-policy.md` + design-learnings link |
| `0eb35c6` | rotation act (cottage/gatehouse/church reskin pins + repins, retired pins named) + F1 byte-match tripwire |

## Acceptance criteria status

1. **Read-only distillation mode — DONE.** `component-skin.mjs --distill-only` rebuilds from
   committed outputs only; assembly lives in pure `src/form/component-skin-distill.mjs` whose
   transitive import graph carries no `sdk-binding`/`judge-reply`/`child_process`
   (unit-asserted, E1), and the runner's `distillMain` is spawn-free (conformance-asserted).
   Byte-match: F1 re-distills every committed reskin pin byte-identically (all three legacy
   subjects + their `.reconstructed.json` repins) — standing tripwire, not a one-off check.
2. **Guarded pin writes — DONE.** `guardedWriteRecord` at every record write in the nine
   runners; preflight before spend (kit-extract before its first model call, the gate before any
   judge call — source-order-asserted). The missing-`--` sweep is the regression fixture (C1,
   pure) AND was replayed verbatim live: `npm run kit:extract --subject=barn` refuses naming all
   12 kit pins, diagnoses the swallowed flag, touches nothing. Synthetic-pin write tests (D)
   cover write/skip/refuse/rotate/sanction.
3. **Pin-rotation policy — DONE.** `docs/knowledge/pin-rotation-policy.md`: committed = pinned,
   renders never; rotations only inside an owning ticket with `--rotate-pins`, retired pin named;
   one judge run per view, T-114 = malformed-reply completion only; standing sanctions
   enumerated. Linked from design-learnings.
4. **T-111 residual 4 — CLOSED, decided.** Verdict pins (`styled/*`, `multi-angle/*-styled`)
   RETAINED as canonical (no verdict-owning rerun warranted; T-116 proved budget-edge flap).
   The stale records were the reskin SUMMARIES — and not church alone: distillation exposed all
   three as T-106-era snapshots of superseded milestone records. Rotated by an explicit,
   recorded, judge-free act (`0eb35c6` names each retired pin). Disposition recorded in the
   policy doc §6.
5. **No gate semantics changes; no subject constants; tests green — DONE.** The gate's judged
   contract (azimuths, lens, verdict composition, exit codes) untouched — additions are a
   preflight refusal and guarded writes. Guard input is git state + registry data. `npm test`
   1581/1581.

## Test coverage

- 14 pin-guard tests (decision matrix, refusal contents, regression fixture, fail-closed,
  synthetic-pin IO, repo smoke) + 5 conformance sweeps (closed pin-writer list, dynamic-only live
  seam, banned raw-write idioms, spawn-free distillMain, preflight-before-spend order).
- 13 distiller tests (exit contract, layer findings, repin diff, assembly shapes,
  judge-unreachability import walk, F1 byte-match vs committed pins).
- Live-shaped spend-free verifications (not in the suite, recorded in progress.md): zone:map
  byte-identical regeneration through the guard, gate/kit `--offline` untouched, the verbatim
  incident replay, and re-distill idempotence.
- **Gaps:** (a) no end-to-end test that a LIVE judge run with `--rotate-pins` forwards the flag
  through milestone→gate spawn seams — verified by source inspection only (a live test costs a
  judge run, which this ticket exists to prevent); (b) `guardedWriteRecord` uses cached
  `git ls-files` — files committed mid-process aren't re-read (irrelevant to runner lifetimes);
  (c) the conformance write-idiom ban is regex-shaped, like its T-113 precedent — a determined
  novel write idiom could evade it (the closed runner list + review is the backstop).

## Open concerns for a human reviewer

1. **The rotation re-states cottage/gatehouse summaries too** (`0eb35c6`). If you read T-111
   residual 4 as church-only, see the step-2 finding in progress.md: their milestone shas,
   reconstruction deltas, and wall-field censuses had all moved. Retaining them would have armed
   F1 against pins known stale; the alternative (skip F1 for them) hides the drift. The verdicts
   cited are unchanged committed records.
2. **Artifact-write friction is intended:** a future pipeline-change ticket re-running a chain
   will refuse at the first differing committed artifact byte without `--rotate-pins` (before the
   judge stage, so no spend). That ticket must own its records per the policy — surface, don't
   soften, if this annoys.
3. **`--rejudge` keeps a standing sanction** (no flag needed) under its own refusals
   (artifact-pin match, unparsed-only). If you want rejudge behind `--rotate-pins` too, it is a
   one-line change in `multi-angle-gate.mjs` — left sanctioned because T-114 defines it as
   completion, not rotation.
4. **`deriveChainExitCode` diverges from the `reconstructed --distill-only` precedent** (derives
   vs carries). reconstructed-milestone still carries its prior exit code — harmonizing it onto
   the distiller's contract is a small follow-up if wanted.
5. **The guard's pin definition is git-tracked-ness**, so a record committed by an unrelated
   ticket becomes a pin instantly. That is the policy's intent (committed = load-bearing), but it
   means scratch records should not be committed casually.
