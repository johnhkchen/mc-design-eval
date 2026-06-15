# T-151-01 Design — instrument-only-pin-guard

Decide *how* to replace "tracked-in-git ⇒ pin" with an instrument allowlist, where the predicate
lives, and how the four ACs are satisfied with minimum blast radius.

## The core decision: `frozen = isInstrumentPath(rel) ∧ isTracked(rel)`

The freeze signal becomes the **conjunction** of two facts:
1. the path matches a curated **instrument allowlist** (it is a measurement or input-of-record), and
2. the path is **git-tracked** (it has actually been committed = measured/ratified).

Why the conjunction (not allowlist alone)?
- It preserves "first derivations are never blocked": a brand-new instrument record (the first
  multi-angle verdict for a new subject) is untracked ⇒ not frozen ⇒ writes freely; once committed,
  it freezes. This keeps `decidePinWrite`'s entire existing matrix intact — only the *meaning* of
  the boolean it receives changes.
- It honors the dividing line verbatim: "frozen once MEASURED" = on the allowlist **and** committed.
- Drafts (`generated/*`) never match the allowlist ⇒ never frozen, even when committed. This is the
  whole bug fix.

The freeze is strictly *narrowed*: old predicate `tracked`; new predicate `tracked ∧ instrument`.
We only ever AND in a condition — the frozen set can only shrink (E-36 Rule 1, provably surgical).

## Where the predicate lives — Option A vs B

**Option A — push instrument-awareness into callers.** Each runner computes
`tracked: isInstrumentPath(rel) && isTracked(...)` before calling `preflightPins`. ~22 files edited.
Rejected: large blast radius, easy to miss a site, violates Rule 2 (friction). Conformance test
would need to police it.

**Option B — concentrate all logic in `pin-guard.mjs` (chosen).** `guardedWriteRecord` already
computes `tracked` internally; `preflightPins` already receives `tracked` per pin. Add one pure
predicate `isInstrumentPath(rel)` and AND it in at exactly those two places:
- `guardedWriteRecord`: `const frozen = isInstrumentPath(rel) && isTracked(set, rel)`.
- `preflightPins`: `pins.filter((p) => p.tracked && isInstrumentPath(p.rel))`.

Callers keep passing `tracked: isTracked(...)` verbatim — **zero caller edits**. All behavior change
is in one 153-line module. This is the surgical choice and is what the call-site survey in Research
shows is possible.

## The allowlist — "one named, documented place" (AC1)

A single exported, frozen array in `pin-guard.mjs`, each entry carrying a human reason:

```js
export const INSTRUMENT_ALLOWLIST = Object.freeze([
  { reason: "judge verdict records — the frozen measurement (E-28/E-31)",
    match: (rel) => rel.startsWith("benchmarks/sculpture/multi-angle/") },
  { reason: "ratified packs of record",
    match: (rel) => rel.startsWith("packs/") && !rel.startsWith("packs/drafts/") && rel.endsWith(".json") },
  { reason: "committed baseline / milestone measurements",
    match: (rel) => /(?:^|\/)[^/]*-(?:baseline|baselines|milestone)\.(?:json|md)$/.test(rel) },
  { reason: "the rotation registry",
    match: (rel) => rel === "benchmarks/sculpture/retired-pins.json" },
  { reason: "the ratified building-block kit — input-of-record to every committed verdict; " +
            "load-bearing for reproducibility-by-replay (E-36 honesty clause, line 124)",
    match: (rel) => rel.startsWith("benchmarks/sculpture/kit/") },
]);
export function isInstrumentPath(rel) {
  return INSTRUMENT_ALLOWLIST.some((e) => e.match(rel));
}
```

Design choices inside the list:
- **Prefix matchers** for whole families (`multi-angle/`, `kit/`) — covers `.json` + `.md`
  companions in one rule.
- **`packs/` minus `packs/drafts/`** — `ratify-pack.mjs` writes `packs/<style>.json`; drafts are
  "structurally NOT a pack." Restricting to `.json` excludes `packs/README.md`.
- **Suffix regex for baselines/milestones** — matches `*-baseline.json`, `*-baselines.json`,
  `*-milestone.json` (and `.md`) by basename. This is *collision-free*: every draft is named by
  subject (`barn.json`, `artifact.json`, `base-artifact.json`, `component-plan.json`) — none end in
  `-baseline(s)`/`-milestone`. Inclusive on the measurement side (also catches
  `cleanliness-baseline.json`, `form-baseline.json`) which is the *safe* direction: freeing a real
  measurement is the worse error (Rule 3 reproducibility) than freezing one extra committed
  measurement.
- **Exact match** for `retired-pins.json`.

### The kit decision (recorded, per the honesty clause)

The epic's headline four families do not name the kit, but E-36 line 124 mandates that a draft which
is "load-bearing for a committed measurement joins the allowlist with the reason recorded — the line
is 'measured or not,' applied case by case." The kit qualifies on three independent grounds:
1. **Input-of-record.** Every committed styled/challenge/generated verdict was measured against the
   kit vocabulary; the kit is an *input to* a committed verdict (dividing-line clause "or input to").
2. **Reproducibility-by-replay (Rule 3).** `--repro` re-derives a committed verdict from its inputs;
   a freely-overwritten kit would silently change that basis. Replay must be stable.
3. **The founding incident.** T-119 was born from the swallowed-`--` kit sweep; `pin-guard.test.mjs`
   fixture C1 *is* a kit overwrite. Keeping the kit frozen keeps that regression meaningful and
   keeps C1-C4 green with no test rewrite — independent evidence the call is correct.

The kit is never re-extracted in a normal creation loop (the friction the epic targets is
`generated/*`), so freezing it costs the creation loop nothing.

## Naming honesty in the pure core

`decidePinWrite`'s parameter `tracked` becomes a misnomer once it receives `frozen`. Rename
`tracked` → `frozen` in its signature, body, and reasons ("unpinned (not git-tracked)" →
"unpinned (draft — not a frozen instrument)"; "committed pin" stays). Update the 8 in-module unit
call sites (A1-A6, E1). This is within-module, ~8 trivial edits, and makes the matrix read honestly
("given this is a frozen pin, decide"). `isTracked`/`loadTrackedSet` keep their names — git-tracked
status is still a real, separately-consumed fact (e.g. `visibility-witness.mjs` reads it to decide
whether to *load* a committed plan).

## How each AC is met

- **AC1 (allowlist, not git-tracked).** `isInstrumentPath` + the documented `INSTRUMENT_ALLOWLIST`
  array is the one named place; `guardedWriteRecord`/`preflightPins`/`decidePinWrite` decide via
  `frozen = instrument ∧ tracked`.
- **AC2 (drafts need no flag).** `generated/*` is not on the allowlist ⇒ `frozen=false` even when
  tracked ⇒ `decidePinWrite` returns `write`. `generated:barn --skip-gate` persists fresh artifacts
  with no pin error. New unit + behavior tests assert this.
- **AC3 (frozen set still refuses).** multi-angle, a ratified `packs/*.json`, a baseline/milestone,
  and `retired-pins.json` are all on the allowlist; tracked ⇒ `frozen=true` ⇒ differing write
  refuses without `--rotate-pins`. Regression tests for each. Reproducibility-by-replay unchanged
  (byte-identical still `skip-identical`).
- **AC4 (un-swallow the mask).** Restructure the `generated-milestone.mjs` catch block: **log the
  original cause first**, set exit code, then attempt the failure-record writes inside a *nested*
  try/catch that, on its own failure, logs a secondary note without replacing `e`. With AC2 the
  draft write no longer throws anyway, but the defensive wrap is the load-bearing guarantee that a
  guard refusal can never again mask the real chain behavior.

## Rejected alternatives

- **Env-var / flag escape hatch to "force draft".** Adds ceremony (Rule 2) and a footgun; the
  allowlist already encodes the intent declaratively.
- **A separate on-disk manifest of pinned paths.** More state to maintain; the policy doc already
  says "there is no separate manifest." A code-level allowlist with reasons is the lighter, citable
  artifact.
- **Freeing the kit (allowlist = literally the four families).** Breaks C1-C4, re-opens the founding
  sweep incident, and undermines replay. Rejected on Rule 3 + the explicit honesty clause.
- **Renaming the `preflightPins` `tracked` field in the caller contract.** Would touch ~22 files for
  cosmetics; the field still carries git-tracked truth and is narrowed internally. Keep it.

## Risk

- Over-freezing a draft that happens to match a suffix: mitigated — drafts are subject-named, no
  collisions (verified against the committed `generated/`, `styled/`, `challenge/` names).
- Under-freezing a real measurement: mitigated by inclusive baseline/milestone suffix matching and
  the kit add; the AC3 regression suite locks the four named families.
</content>
