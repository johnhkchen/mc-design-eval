# T-119-01 pin-protection — Design

Five decisions, each grounded in research.md. The shape: a pure pin-guard policy module
(refuse-by-default writes), a pure component-skin distiller (judge absent by construction), thin
mechanical integration at the runners' record-write sites, a binding policy doc, and the
residual-4 disposition executed through the new machinery.

## D1 — "Committed pin" = git-tracked record file (json/md), byte-identical writes always allowed

**Chosen.** The guard asks git (`git ls-files`, one cached call) whether the target is tracked.
A write to a tracked record that would change its bytes REFUSES without the rotation flag; a
byte-identical rewrite is always allowed; an untracked/new path writes freely.

- *Why git:* the ticket's own language is literal — "overwrite a **committed** pin record". Git is
  the single existing source of truth for committedness; every pin family in research §1 is
  tracked. Zero-maintenance: new records become pins the moment they are committed.
- *Why byte-identical passes:* the repo's determinism flows (`zone:map` regenerating legacy maps
  byte-identically, `kit-extract --offline`, `--repro` double-runs) rewrite committed bytes on
  purpose. Refusing them would break the reproducibility contracts; allowing them destroys no
  information.
- *Scope: `.json`/`.md` records only, never PNGs* — renders are GL-nondeterministic across
  machines and the repo already excludes GL bytes from decisions (E-24/E-28 principle). Sheets
  and triptychs are evidence, not pins.
- *Fail-closed:* if git itself errors, treat the path as tracked (refuse). A swallowed rotation
  flag (`npm run … --rotate-pins` without `--`) simply never reaches argv → the run refuses —
  the missing-`--` failure mode now fails SAFE instead of sweeping pins.

**Rejected:** a declared pin manifest or registry-derived list (a second source of truth that can
drift — the exact disease T-113 cured at the vocabulary seam); env-var rotation (invisible in
command history, and the policy wants the rotation visible in the invocation); guarding all
writes via an fs wrapper (over-broad; runs/, PNGs, scratch outputs are not pins).

## D2 — Two guard layers: preflight-before-spend + write-time backstop

**Chosen.** New `src/form/pin-guard.mjs` (PURE decisions + thin IO, the `kit.mjs` precedent):

- `decidePinWrite({tracked, exists, currentContent, nextContent, rotate})` →
  `{action: 'write'|'skip-identical'|'refuse', reason}` — the unit-tested policy core.
  (`skip-identical` still means "write is permitted"; the IO helper may skip the disk write or
  rewrite identical bytes — behaviorally equivalent.)
- `preflightPins({pins: [{rel, tracked}], rotate, intent})` → throws one `PinGuardError` listing
  EVERY committed pin the run would overwrite, why it refused, and the remedy
  (`--rotate-pins` inside a verdict-owning ticket, citing `docs/knowledge/pin-rotation-policy.md`).
- IO: `loadTrackedSet(root)` (one `git ls-files` spawnSync, cached), `guardedWriteRecord({root,
  rel, content, rotate, sanction})` — the drop-in replacement for record `writeFile`s. A rotation
  or sanction is LOGGED naming the pin (AC: "says which pin and why").
- `ROTATE_FLAG = "--rotate-pins"` — one spelling, exported.

**Placement.** Preflight runs before any *spend* (metered model call or judge): kit-extract live
mode preflights the selected subjects' `kit/*.{json,raw.json,md}` before the first `callModel`;
multi-angle-gate live mode preflights its record paths at entry — before rendering or judging —
which protects ALL chain runners, since every judge path goes through the gate child (research
§2). Write-time guard is the backstop at every record-write site (the milestone runners'
deterministic artifacts hit it only when bytes actually change — which IS a rotation event, and
it fires before the gate/judge stage by pipeline order). `--rejudge` writes carry an explicit
`sanction: 'rejudge (T-114 reply completion)'` — the one in-place record completion the policy
already governs; it keeps its own artifact-pin refusals.

**Integrated runners (closed list, conformance-swept):** kit-extract, zone-map, multi-angle-gate,
styled-, challenge-, generated-, reconstructed-milestone, component-skin, durable-skin.
Spawn seams forward `--rotate-pins` to children (styled `spawnGate` extraArgs already exists;
challenge's copy gains passthrough; component-skin/reconstructed forward to milestones).

**Rejected:** preflighting every artifact path per runner (invasive path-plumbing for no extra
spend-protection — the write-time guard plus pipeline order already stops the judge); guard only
at the gate (leaves kit sweep, the actual second incident, unguarded).

## D3 — Distillation: `component-skin.mjs --distill-only` backed by a pure distiller module

**Chosen.** New PURE module `src/form/component-skin-distill.mjs`:

- `distillComponentSkin({key, def, layer, milestone, committedZoneMap})` → `{record, repin}` —
  the ENTIRE record assembly (including the zone-map repin diff currently inline at
  component-skin.mjs:204–245) moves here, so the live path and the distill path share one
  assembly and cannot drift. Imports: nothing but `node:crypto`-free pure JS (layer shas are
  computed by the caller-fed `componentLayer`, which stays in the runner — see structure).
  **No `sdk-binding`, no `judge-reply`, no `node:child_process` anywhere in its transitive import
  graph — the judge seam is ABSENT by construction**, not stubbed.
- `deriveChainExitCode({status, gate})` — `pipeline-failed → 1`, else gate
  `decided ? (passed ? 0 : 1) : 2` (the documented gate/milestone exit contract, research §5;
  matches all three committed records).

Runner: `--distill-only` (name follows the `reconstructed-milestone` precedent) reads ONLY
committed inputs (milestone record, component/roof/shaped/regularize files, committed zone-map),
calls the distiller, writes through the pin-guard. The branch is a separate early function —
no code path from it reaches `spawnMilestone`.

- *Why derive exitCode rather than carry it* (where the `--distill-only` precedent carries):
  carrying would freeze church's stale `exitCode: 1` beside a rebuilt `status: "gated"` —
  internally inconsistent. Deriving from the frozen exit contract keeps the rebuilt record
  self-consistent and still byte-matches the in-sync cottage/gatehouse pins. The divergence from
  the precedent is documented in the module header.
- *Why component-skin is the scope:* it is the runner that caused incident (1) — the only
  "record rebuild" that today forces a chain+judge run. The gate/kit/reconstructed runners
  already have judge-free modes; they are brought under the same TESTED umbrella by the
  conformance sweep (D4) rather than rewritten.

**Rejected:** overloading `--offline` (it is an assert-only mode with its own contract);
injecting a throwing judge stub into the spawned milestone (still spawns the chain; "absent"
dominates "stubbed" for impossibility-by-construction); distilling from the gate record instead
of the milestone record (the milestone record is the chain's single committed summary — the
record contract stays unchanged: `chain.gate` mirrors `mile.gate`, and T-114 rejudge completions
live on the gate record, as today).

## D4 — Tests: decision matrix, regression fixture, byte-match, judge-unreachability sweep

1. `src/form/pin-guard.test.mjs` — decision matrix (tracked×exists×identical×rotate); refusal
   message names pin + reason + flag; **the kit-sweep regression fixture**: preflight with
   `ONLY=null` (the verbatim swallowed-flag invocation → all four subjects), all kit pins
   tracked, no rotate → throws naming every kit pin; flag-swallow fail-closed (rotate absent =
   refuse); synthetic-pin write tests with injected tracked-set (no real git in unit tests).
2. `src/form/component-skin-distill.test.mjs` — synthetic distill fixtures (status/gate/exit
   matrix, repin diff cases); **byte-match: distilled record equals the committed
   `component-skin/<k>.json` bytes for all legacy subjects** (reads committed records from disk —
   the conformance-test precedent); **judge-unreachability: walk the distiller's transitive
   relative-import graph and assert no `sdk-binding.mjs`, `judge-reply.mjs`, or
   `node:child_process`**.
3. `src/form/pin-guard.conformance.test.mjs` — the T-113-shaped source sweep, closed over
   `benchmarks/sculpture/*.mjs`: (a) no pipeline runner top-level-imports `sdk-binding.mjs` (the
   live seam stays a named dynamic import); (b) every enumerated record-writing runner imports
   the pin-guard and contains no raw `writeFile(recPath…)` at its record sites; (c)
   component-skin's distill branch contains no `spawnMilestone` token.

## D5 — Policy + residual-4 disposition

`docs/knowledge/pin-rotation-policy.md` (short, binding, citable; linked from design-learnings):
canonical verdict/record pins change ONLY inside a ticket that explicitly owns verdicts; one
judge run per view (T-114 governs malformed replies only — completion, never re-roll); rotations
pass `--rotate-pins` and the commit names the retired pin; byte-identical rewrites and judge-free
distillation are always sanctioned; renders are never pins.

**Residual 4, decided:** the verdict pins (`styled/*`, `multi-angle/*-styled`) are **RETAINED** —
they are the canonical, once-judged verdicts; no verdict-owning run is warranted now (the T-116
re-cut proved fresh runs flap at the budget edge, and E-30 owns generalization, not verdicts).
The stale records are the **distilled reskin summaries** (`component-skin/church.json` provably;
cottage/gatehouse checked by the byte-match): **ROTATED by an explicit, recorded act** — the new
judge-free `--distill-only --rotate-pins`, retired pin named in the commit. No judge spend, no
re-roll, nothing silent. This is the AC's "explicit, recorded act" executed through the very
machinery the ticket builds.

## Constraint check

No gate semantics change (the gate gains a preflight refusal before spend and guarded writes —
the judged contract, azimuths, verdict composition untouched). No subject-specific constants
(guard input is git state; distiller input is registry data). `npm test` stays green: new tests
under `src/`, all live/GL paths remain out of the suite.
