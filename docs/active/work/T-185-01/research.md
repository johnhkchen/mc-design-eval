# T-185-01 — Research

**Ticket:** the terminal act of the E-46 measurement arc. Read the T-184-01 GO/NO-GO verdict and do the
matching thing: **PROMOTE** (guarded freeze of the recalibrated style-distance term into `measurements/`, behind
human sign-off) or **DO-NOT-PROMOTE** (write the concept-image-conditioning localization + a follow-on stub,
touching nothing under `measurements/`). Descriptive only — what exists, where, and the seams the act plugs into.

## The verdict this ticket consumes — T-184-01 (story S-184)

T-184-01 built the GO/NO-GO instrument (committed: pure core `3463500`, pairs `9e6cf73`, instrument `277be74`,
harness `f416804`). It is **mid-run**: the metered evidence run
`VOTES=6 node experiments/eval-alignment/style-agreement-run.mjs` is live (PID-tracked; log at
`docs/active/work/T-184-01/run-votes6.log`, currently scoring state 1 of 12, `gh-match`). It writes the verdict
to **`experiments/eval-alignment/results/style-agreement.json`** and prints a console verdict block. The run
has **NOT** produced its results JSON or T-184-01's `FINDINGS.md` yet — **T-185-01's branch selection blocks on
that file existing.** ([[lisa-same-ticket-concurrency]]: a sibling thread owns the run; do not race it — read
its output, do not regenerate it.)

The results JSON shape (from `style-agreement-run.mjs:192`): `{ schema, tier, votes, labelSource, licensing,
scoredStates[12], decomposition, agreement, interLabel, concordance, recommendation, pairAudit }`.

### The decisive structural fact — autonomous runs cannot PROMOTE

The run has **no `labels.human.json`** (the human gate file is absent in an autonomous loop), so it falls back
to the LLM-proxy labeler and stamps `labelSource:"llm-proxy"`, `licensing:false`. The pure
`recommendation()` (`src/workshop/style-agreement.mjs:218`) then **cannot return `go:true`**:

- `packDriven | illPosed | onlyEasy` → `go:false`, `DO-NOT-PROMOTE`.
- `pictureDriven && hardClears && licensing===false` → **`go:null`, `GO-LEANING (recommend-only)`**.
- otherwise → `go: licensing===false ? null : false`, `INCONCLUSIVE`.

So the autonomous verdict is one of `{false, null}`. The ticket independently says PROMOTE "**executes only on
human sign-off**" and the freeze is "**never autonomous**" ([[pin-guard-is-structural]]). Therefore **this
ticket, run autonomously, never executes the freeze.** Its two real terminal acts are:
1. **GO-LEANING (`go:null`)** → **stage** the exact guarded PROMOTE package (the pin + PinGuard allowlist diff +
   gate-evidence summary) for a human to review and sign off — **without touching `measurements/`**.
2. **`go:false`** → write the concept-image-conditioning localization + a follow-on ticket stub. The sharp
   publishable negative.

Either way `git status --porcelain measurements/` stays EMPTY in this loop.

## The freeze surface (the PROMOTE branch's target) — what an ADD would copy

The term being promoted is the recalibrated (E-45/T-181/T-182) style-distance scorer in
`src/workshop/bakeoff-score.mjs` (PURE, in `npm test`). The ticket names the exact surface:
- **constants** `PENALTY = {major:20, minor:8}` (`:26`), `WRONG_STYLE = {cap:40, distance:12}` (`:43`);
- `styleFidelityScore(critique)` (`:187`) — severity-weighted wrong-style penalty + `WRONG_STYLE.distance`,
  whole score capped by `gradedCapFor(breadth) = max(40, 100−12·breadth)` (`:165`, breadth = distinct
  wrong-style departments — the binary-cap collapse fixed in E-40/E-41);
- `itemStyleClass(item)` (`:69`) — typed `kind` (replace⇒wrong-style, add⇒absent, remove⇒match) over the
  structural present/missing fallback;
- the **concept-conditional `DiagnoseBuild`** golden (the live BAML prompt that lets a matched build earn
  `add`/absent against its OWN concept instead of `replace`).

A PROMOTE = a **frozen COPY** of these under **`measurements/style-distance/`** (the term is *not yet* in
`measurements/` — it lives in `src/`; promotion is an ADD, not a rotation) + a **PinGuard allowlist** entry.

### PinGuard / the freeze mechanism — `src/form/pin-guard.mjs`

- A path is a **frozen pin** iff it is on the `INSTRUMENT_ALLOWLIST` **AND** git-tracked
  ([[location-encodes-status]]). The allowlist is **prefix-based**: `MEASUREMENTS_PREFIX = "measurements/"`
  (`:56`) is entry #1 — *anything* under `measurements/` is frozen once committed. So an ADD under
  `measurements/style-distance/` is **automatically** on the allowlist (no code edit needed to freeze it); a new
  untracked instrument record "writes freely the first time" (`decidePinWrite`: `!frozen ⇒ write`) and freezes
  the moment it is committed.
- `guardedWriteRecord` / `preflightPins` (`:131`, `:178`) are the write/spend guards; `--rotate-pins` is the
  only override; refusal is the default (fail-closed). `GATE_RECORD_NAMESPACES = ["measurements/multi-angle/"]`
  is the workshop-isolation boundary — irrelevant here (style-distance is not a multi-angle gate record).
- **`measurements/` current contents** (the neighbours a new sub-dir joins): `README.md`,
  `cleanliness-baseline.*`, `form-baseline.*`, `retired-pins.json`, and dirs `milestones/`, `multi-angle/`,
  `pattern-book/`, `reconstructed/`, `visibility/`. There is **no `style-distance/`** yet — the ADD is genuinely
  new. Each frozen record is a `.json` + a human-readable `.md` twin (the house style).

### Byte-reproducible replay (the AC's "post-pin replay verified")

The AC requires the applied pin to **replay byte-identically**. The relevant precedent
([[repro-is-determinism-not-vs-committed-draft]]): `--repro` proves *two-fresh-runs determinism*, not
vs-committed-draft equality. The pure scorer (`bakeoff-score.mjs`) is deterministic by construction (no
GL/IO/model/Date/random); a frozen copy + a re-derivation from the same committed critique inputs must produce
identical bytes. The `DiagnoseBuild` golden is a *recorded* model output (the prompt is deterministic; the reply
is pinned), replayed by re-rendering the prompt and diffing the committed text — not re-calling the model.

## The localization surface (the DO-NOT-PROMOTE branch's target)

If `go:false` with verdict `PACK-DRIVEN`, the residual is named precisely: the term **conditions on the
recognized pack/material agreement, not on the rendered-build-vs-concept-image match**. The localization writes
where that conditioning lives:
- `experiments/eval-alignment/.../DiagnoseBuild` prompt path — `src/workshop/diagnose.mjs::diagnoseRenderArgs`
  feeds `style` from `program.style ?? pack.style` and `styleProfileBlock(pack)` selects the expected grammar
  **from the pack**, while `concept` + `renders` are passed as images. The confound: the *style spec* the judge
  grades against is pack-derived; the picture is only evidence. The concept-image-conditioning fix makes the
  build-vs-image match the conditioning signal.
- This branch is a **design note + a follow-on ticket stub** (a localization, not a full re-implementation —
  the fix is the next epic's work; T-185-01 names it sharply, per the ticket's "a sharp, publishable negative —
  not a soft partial").

## The decomposition precedent the verdict generalizes — T-182-01

T-182 (E-45, DONE): the recalibrated term @VOTES=6 moved matched 13→41 and `replaceContrast` −0.20→+0.245, but
`A−B=22` (2 short of the 24 bar) and rode the **PACK** (packEffect ≫ conceptImageEffect) → "PROMOTE-LEANING, DO
NOT freeze; gate on a labeled population corpus." E-46 is that gate. The open question E-46/T-184 answers:
does `conceptImageEffect` dominate (PICTURE-DRIVEN) at population scale, with the hard middle labelable?
([[e45-recalibrate-style-distance-term]], [[e44-faithful-integration-promote]].)

## Conventions & constraints to mirror

- **Never autonomous freeze** ([[pin-guard-is-structural]]): the ADD to `measurements/` happens only behind the
  corpus gate AND human sign-off. PREPARE the pin; the reviewer applies it. A DO-NOT-PROMOTE is a complete,
  valuable result — do not soften it into a promotion ([[calibrated-honesty-not-hype-or-brutality]]).
- **Pin record house style**: `.json` + `.md` twin under `measurements/`; `guardedWriteRecord` is the writer.
- **No equivocal promotion**: the AC fails if "magnitude clears but agreement marginal, or vice-versa." A split
  → DO-NOT-PROMOTE; never promote on a tie ([[anti-hedge-falsifiable-commitment]]).
- **`npm test` green** at the end (2302 currently, with the T-184 SA tests).
- **No-flag-swallow** ([[npm-run-flag-swallowing]]): any new script reads `process.argv`/env via direct `node`.
</content>
</invoke>
