# T-119-01 pin-protection — Research

Descriptive map of the pin landscape, the judge seam, the record-rebuilding runners, and the two
incidents this ticket structurally prevents. No solutions proposed here.

## 1. What a "pin" is, concretely

Committed verdict/record JSON under `benchmarks/sculpture/`, cited by instrument-diffs, epic
tables, and head-to-head baselines. Families on disk (all git-tracked):

| family | files | written by | contains verdicts? |
|---|---|---|---|
| `kit/` | `<subj>.{json,raw.json,md}` ×4 subjects | `kit-extract.mjs` | no (recognition + value evidence; `raw.json` is the pinned model reply) |
| `zone-map/` | `<subj>.{json,md}`, `<subj>.reconstructed.json` (cottage, gatehouse), `barn.prior-fallback.json` | `zone-map.mjs`; repins by `component-skin.mjs` | no (derived bands) |
| `multi-angle/` | `<subj>-<label>.{json,md}` + sheets (labels: baseline, current, challenge, styled, generated) | `multi-angle-gate.mjs` | **yes — the judge verdicts** |
| `styled/` | `<subj>.{json,md}` + `styled/<subj>/` artifacts | `styled-milestone.mjs` | embeds a gate summary |
| `challenge/` | `<subj>.{json,md}` + `challenge/<subj>/` artifacts | `challenge-milestone.mjs` | embeds a gate summary |
| `generated/`, `reconstructed/` | `<subj>.{json,md}` + artifacts | their milestone runners | embed gate summaries |
| `component-skin/` | `<subj>.{json,md}` ×3 legacy | `component-skin.mjs` | distilled chain+gate citation |
| `durable-skin/` | per-subject artifacts/records | `durable-skin.mjs` | no |

"Committed" is literal: `git ls-files` tracks every one of these. There is **no git usage anywhere
in `src/` or `scripts/`** today — no precedent for runners asking what is committed.

## 2. The judge seam

One seam: `requestTextWithImage` in `src/sdk-binding.mjs`, always **dynamically imported at the
call site**. Verdict-bearing call sites:

- `multi-angle-gate.mjs:203 judgeThroughPolicy()` — the ONLY judge. Wraps the T-114 bounded reply
  policy (`src/form/judge-reply.mjs`). Coverage-failed views short-circuit (`judge not called`,
  line ~440).
- `kit-extract.mjs:80 callModel()` — not a judge but a live STRONG-tier recognition call; same
  spend/pin character (the reply becomes the pinned `raw.json`).

Every chain runner reaches the judge **only by spawning** `multi-angle-gate.mjs` as a child
process (`spawnGate` in styled-milestone.mjs:178, exported and reused by generated-milestone;
challenge-milestone has its own copy at :325). `component-skin.mjs` and
`reconstructed-milestone.mjs` reach it one level deeper by spawning the milestone runners
(`spawnMilestone`). So "judge-spawning impossible by construction" decomposes into: no
`child_process` spawn of a runner, and no (transitive) import of `sdk-binding.mjs`.

## 3. Runner modes that already exist (prior art)

| runner | live | `--offline` | `--repro` | other |
|---|---|---|---|---|
| `multi-angle-gate.mjs` | render + judge, **writes** `multi-angle/<slug>.{json,md}` + sheet | re-asserts committed record, no GL/judge, writes nothing | — | `--rejudge` (T-114): completes a committed record's `unparsed` views ONLY; **refuses** on artifact-pin mismatch (line ~546) |
| `kit-extract.mjs` | model call per subject, writes `kit/*` (raw written **before** validation) | re-validates committed `raw.json` → rewrites `<subj>.{json,md}` byte-identically; no live call | — | `--subject=K` filter; **no preflight** |
| `styled-/challenge-milestone.mjs` | full chain, spawns gate, writes record + artifacts | asserts committed record | re-runs deterministic chain, compares sha256s, **no GL/judge** | exit mirrors gate: `decided ? (passed?0:1) : 2`; pipeline-fail → 1 |
| `component-skin.mjs` | verifies layer → **spawns milestone (chain+judge)** → distills → repins zone map | asserts shas match committed milestone record | — | **no judge-free rebuild path — the T-116 incident (1)** |
| `reconstructed-milestone.mjs` | spawns milestone | assert | re-proof | **`--distill-only`** (line 209): re-distills committed outputs, chain+judge NOT re-run; carries `instrument` and `chain.exitCode` from the previous committed record |
| `zone-map.mjs` | derives from concept, **unconditionally rewrites `zone-map/<k>.{json,md}` for every subject** | — | — | T-117 observed legacy regeneration is byte-identical |

`reconstructed-milestone --distill-only` is the naming/semantics precedent for the distillation
AC, but it is runner-internal, not unit-tested for judge-unreachability, and component-skin (the
runner that caused incident 1) has nothing like it.

## 4. Incident anatomy

**(1) Reskin re-cut (T-116 concern 6, commit `1baf955`, reverted).** `reskin:<subj>` was assumed a
"cheap record refresh", but component-skin's only rebuild path runs `spawnMilestone` →
styled-milestone → `spawnGate` → live judge. Three styled gate verdict sets re-rolled (cottage
135° same-object flipped — budget-edge flap), overwriting `multi-angle/*-styled.json` +
`styled/*.json` pins that T-111/T-115 instrument-diffs cite. E-28 Rule 4 forbids adopting
re-rolls; revert + byte-identical restore. **Residual ROUTED to this ticket.**

**(2) kit sweep.** `npm run kit:extract --subject=barn` — without `--`, npm swallows
`--subject=barn` (it never reaches `process.argv`), so `ONLY=null` and the runner live-swept ALL
subjects, overwriting three committed kit pins (`raw.json` is written at line 164 before any
validation). Caught, restored from HEAD. Note the flag-swallowing failure mode applies to ANY
flag: a guard whose *safety* depended on a flag being present would fail open; refusal-by-default
fails closed.

## 5. Load-bearing discovery: a pin is stale right now

`component-skin/church.json` records `chain: {status: "pipeline-failed", exitCode: 1}` (T-106 era:
settle never converged), but the committed `styled/church.json` it cites now says
`status: "gated"`, gate `REFUSAL (unparsed:-x-z)` — T-113 fixed settle and the chain was re-run in
T-110/T-113; T-114's `gate:rejudge` later completed `multi-angle/church-styled.json` to decided
verdicts (the milestone record's embedded gate summary intentionally still shows the original
REFUSAL; the rejudge block lives on the gate record). Cottage/gatehouse component-skin records
(`gated`/FAIL/exit 1, repin shifted) appear consistent with their milestone records — exact
byte-level agreement unverified until a distiller exists. **This is the concrete content of T-111
residual 4** ("stale reskin pins").

Derivability check for a committed-outputs-only rebuild of a component-skin record:
- `componentLayer` — sha256 pins over committed `regularize/roof/shaped/components` files ✓
- `chain.{runner,record,status,stage,error,gate}` — read from the committed milestone record ✓
- `chain.exitCode` — NOT stored in the milestone record; conventions are total though:
  pipeline-failed → 1, else gate `decided ? (passed?0:1) : 2` (styled-milestone:597 mirrors the
  gate child's code). Matches all three committed records. (`--distill-only` precedent instead
  carries it from the previous committed record.)
- `reconstruction/seamSources/conformance/wallField/kitPresence` — from the milestone record ✓
- `zoneMapRepin` — recomputable from milestone `skin.zoneMap` vs committed `zone-map/<k>.json`;
  the diff logic is currently inline in component-skin.mjs main (lines 204–245) ✓
- `reproducible.milestoneSha256` — from the milestone record ✓

## 6. Registry and contracts

`durable-skin.mjs` exports `SUBJECTS` (4 subjects; per-subject `zoneMapRecord`/`kitRecord` paths —
barn armed by T-117-01 this morning). Runner choice in component-skin/reconstructed is registry
data (`def.kitRecord` present+exists → styled). Existing refusal precedents with named reasons:
rejudge artifact-pin mismatch throw, durable-skin agrees-with-record assert (`zone map diverges
from the committed …`), kit.mjs `bandRefsFromZoneRecord` non-concept-source throw.

## 7. Test & docs infrastructure

- `npm test` = artifact self-test + `node --test "src/**/*.test.mjs"` — **unit tests live under
  `src/` only**; suite is 1526 green as of T-117/T-118 (this morning).
- Conformance-sweep idiom: `src/form/material-vocabulary.conformance.test.mjs` (T-113) reads
  CONSUMER SOURCE from disk, regex-bans composition primitives outside the authority, enumerated
  allowlists, closed over pipeline dirs. The T-107 lens-guard tripwire is the same shape.
- PURE/LIVE split idiom: decisions in `src/form/*.mjs` (unit-tested, may read disk e.g.
  `loadBlockVocab`), runners are impure leaves. `judge-reply.mjs` is the model for a small,
  policy-shaped pure module born from an incident.
- `docs/knowledge/`: `design-learnings.md` (has the T-111 residual ledger ¶ and the E-29 section
  that routed residual 4 here), `cielab-block-matching.md`, `rdspi-workflow.md`. The policy doc
  lands beside them, linked from design-learnings.

## 8. Constraints & environment

- E-28 Rule 4: verdicts are judged once; adopting re-rolled verdicts is forbidden. T-114 governs
  malformed-reply completion only. E-25 Rule 3: no subject-specific constants (AC 5 repeats this).
- No gate semantics changes allowed (AC 5); the gate's judged contract is frozen.
- Flag style is ad-hoc `process.argv.includes`/`indexOf` per runner; npm swallows un-`--`'d flags.
- Working tree carries sibling T-118-01 material (untracked `src/view/roof-region-diff.*`,
  modified tickets, work dirs) — commits from this ticket must add only T-119-01 paths.

## 9. Open questions for Design

1. What defines "committed pin" for the guard — git-tracked status (literal, zero-maintenance, new
   git dependency in runners) vs a declared pin manifest (explicit, but a second source of truth
   that can drift)?
2. Where does the write-guard sit — a shared guarded-write helper at each record-write site, vs
   per-runner preflights, vs both (preflight-before-spend + write-time backstop)?
3. Distillation scope: component-skin only (the incident runner), or also formalize/test the
   existing `--offline`/`--distill-only` modes under the same judge-unreachability property?
4. `chain.exitCode` in distilled records: derive from conventions vs carry from the prior record.
5. Residual-4 disposition: the verdict pins (`multi-angle/*`, `styled/*`) vs the distilled reskin
   records (`component-skin/*`) likely need different answers (retain vs rotate).
