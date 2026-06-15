# T-138-02 proportion-milestone-resumption — Structure

No source files are created, modified, or deleted. Every change is a record, an evidence PNG,
or a documentation file, produced by committed runners. This section is the blueprint of which
files move, who writes them, and in what order — the "shape of the code" here is the shape of
the record graph.

## §1 Restored (pre-run hygiene)

| File | Action | Writer |
|---|---|---|
| `benchmarks/sculpture/workshop/cottage/program.json` | `git restore` to HEAD | me (D1) — immediately superseded by the chain's stage-3 write |

## §2 The cottage chain run (writer: `pattern-book.mjs --subject cottage --ticket T-138-02 --rotate-pins`)

Rotated in place (tracked, pin-guarded, `--rotate-pins` authorizes):

| File | Content |
|---|---|
| `benchmarks/sculpture/workshop/cottage/program.json` | measured+armed seed (stage 3; T-135 declarations merged, proportion gate armed) |
| `benchmarks/sculpture/workshop/cottage/component-plan.json` | realization plan for the seed |
| `benchmarks/sculpture/workshop/cottage/final-artifact.json` | the workshop loop's final build |
| `benchmarks/sculpture/workshop/cottage.json` | the ledger — rounds, lever aims/verdicts, proportion checks per round |
| `benchmarks/sculpture/workshop/cottage.md` | ledger summary |
| `benchmarks/sculpture/pattern-book/cottage.json` | chain record (`ticket: T-138-02`, seed sha, ledger sha, final conformance) |
| `benchmarks/sculpture/pattern-book/cottage.md` | chain summary |
| `pr/assets/frames/workshop-cottage-{before,after}.png` | the workshop's evidence frames |

Also refreshed by the run, gitignored (not committed): `workshop/cottage/round-*/`,
`workshop/cottage/final/` render intermediates — only if the runner regenerates them; whatever
appears under gitignore stays uncommitted, same as the barn runs.

## §3 The cottage gate run (writer: `multi-angle-gate.mjs` via `gate:patternbook:cottage -- --rotate-pins`)

| File | Content |
|---|---|
| `benchmarks/sculpture/multi-angle/cottage-patternbook.json` | gate record: visibility-aware census, 4 views, per-view verdicts (T-114), both arithmetics |
| `benchmarks/sculpture/multi-angle/cottage-patternbook.md` | gate summary |
| `benchmarks/sculpture/multi-angle/cottage-patternbook-sheet.png` | gitignored; the committed copy is below |
| `pr/assets/frames/multi-angle-cottage-patternbook.png` | committed sheet copy (barn-commit precedent) |

## §4 The milestone compose (writer: `proportion-milestone.mjs`, default mode)

| File | Content |
|---|---|
| `benchmarks/sculpture/pattern-book/proportion-milestone.json` | NEW — milestone record: 3 subjects, baselines (pre-rotation) vs re-run ratios/verdicts, both arithmetics beside every verdict, lever citations, retired pins named |
| `pr/assets/proportion-milestone.md` | NEW — the glance page: concept beside sheet per subject, before/after/target ratio rows, ≤2 budget flagged-not-decided |

## §5 The compare rotation (writer: `pattern-book-compare.mjs --rotate-pins`)

| File | Content |
|---|---|
| `benchmarks/sculpture/pattern-book/head-to-head.json` | rotated — re-composed on the new verdicts |
| `benchmarks/sculpture/pattern-book/head-to-head.md` | rotated |
| `pr/assets/pattern-book-milestone.md` | rotated — the E-31 milestone page re-composed |

(Exact output set is the runner's own; whatever it rotates under pin-guard is what commits.)

## §6 Evidence adopted from T-138-01's interrupted session (writers: the committed barn runs)

| File | Why it lands here |
|---|---|
| `pr/assets/frames/workshop-barn-{before,after}.png` | output of committed run `5db9a86`, never committed; cited by the glance page |
| `pr/assets/frames/workshop-barn--saltcrag-{before,after}.png` | output of committed run `f2e0553`, same |

## §7 Documentation (writer: me)

| File | Action |
|---|---|
| `docs/knowledge/design-learnings.md` | append section `## Measured proportion loop (E-33) … · 2026-06-12` after the E-32 section; subsections per inherited step 10: the three answers (measured-vs-estimated quantity, steep-unlock usage from ledger evidence, eyes-to-hands), the T-137 fourth-identity-class census fix, honest over/under-reach (TRELLIS flattening → no measured demand >45°, tolerance 0.15 uncalibrated, ≤2 budget FLAGGED with both arithmetics), E-12 handoff = link to `pr/assets/proportion-milestone.md` |
| `docs/active/work/T-138-01/*` | commit as-is (5 artifacts; precedent `0c19430`) |
| `docs/active/work/T-138-02/*` | research/design/structure/plan committed with docs; progress.md updated during implement; review.md last |

## §8 Untouched (boundaries)

- All `src/` and `benchmarks/sculpture/*.mjs` source — no code change; isolation scan,
  self-greps, pin-guard all stand as committed.
- `package.json` — no new scripts (D3: rotation flags must not be baked in; every needed entry
  point exists).
- `pattern-book/proportion-baselines.json` — frozen "before" (D6).
- T-136's files, Lisa infra, ticket frontmatter, stray untracked files (D10).

## §9 Ordering (dependencies between movements)

1. §1 restore → §2 chain (stage-3 write needs a clean tracked pin to preflight against).
2. §2 chain verified (`--repro`/`--offline` exit 0, status not `pipeline-failed`, proportion
   check armed every round) → commit A → §3 gate (judges the chain's final artifact; runs only
   against a committed chain per the per-subject commit shape… the gate reads the artifact from
   disk, but committing first keeps the stop-the-line forensics clean and matches T-138-01's
   barn shape where chain+gate landed in ONE commit — final shape: chain+gate verified, then
   one commit A per the barn precedent `5db9a86`).
3. Commit A (cottage chain + gate + frames) → §4 compose (reads committed records only) → §4
   repro → §5 compare → witness SKIP checks → commit B (compose + compare + barn frames §6).
4. Commit B → §7 docs (`design-learnings` cites the milestone record) + `npm test` → commit C.
5. review.md → (Lisa handles the rest; no commit ordering constraint, ride commit C or its own).

## §10 Verification artifacts produced along the way (not committed)

Exit codes from: chain `--repro`, chain `--offline`, gate `--offline`, `milestone:proportion:
repro`, `proportion:repro` + `visibility:repro` (with grepped SKIP lines), full `npm test`.
Each is quoted in progress.md/review.md with its invocation, never paraphrased.
