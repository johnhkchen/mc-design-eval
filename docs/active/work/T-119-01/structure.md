# T-119-01 pin-protection — Structure

File-level blueprint. Two new pure modules + tests under `src/form/`, mechanical integration in
nine runners, one policy doc, one rotation act. PURE/LIVE split throughout: every decision is
unit-testable; runners keep the IO.

## New files

### `src/form/pin-guard.mjs` (NEW — the policy core, ~120 lines)

```js
export const ROTATE_FLAG = "--rotate-pins";
export class PinGuardError extends Error {}          // carries .pins = [{rel, reason}]

// PURE decisions
export function decidePinWrite({ tracked, exists, currentContent, nextContent, rotate })
  // → { action: "write" | "skip-identical" | "refuse", reason }
  // untracked → write; tracked && nextContent === currentContent → skip-identical;
  // tracked && rotate → write (rotation); tracked && !rotate → refuse.
export function refusalMessage({ rel, intent })       // names the pin, why, the remedy + policy doc
export function preflightPins({ pins, rotate, intent })
  // pins: [{ rel, tracked }] — throws ONE PinGuardError listing every committed pin the live
  // run would overwrite. Called BEFORE any metered call / judge spawn. rotate=true passes.

// THIN IO (the kit.mjs disk-reading precedent; fail-closed)
export function loadTrackedSet(root)                  // one spawnSync `git ls-files -z`, cached per
                                                      // root; on git error → null (= treat all as
                                                      // tracked: refuse-by-default)
export function isTracked(trackedSet, rel)            // null set → true (fail closed)
export async function guardedWriteRecord({ root, rel, content, rotate, sanction, trackedSet })
  // decide → refuse: throw PinGuardError; rotation/sanction: console.error names the pin;
  // skip-identical: skip the disk write; write: writeFile.
```

Path convention: `rel` is repo-root-relative (`benchmarks/sculpture/kit/cottage.json`) — matches
`git ls-files` output directly. Guard applies to `.json`/`.md` records only by call-site choice
(PNG/sheet writes are never routed through it — GL bytes are not pins).

### `src/form/pin-guard.test.mjs` (NEW)

Decision matrix; refusal message contents (pin name + reason + `--rotate-pins` + policy-doc
citation); **kit-sweep regression fixture** (all four subjects' kit pins tracked, no subject
filter, no rotate → preflight throws naming every pin — the verbatim swallowed-`--` shape);
flag-swallow fail-closed; `guardedWriteRecord` against a tmpdir with an injected tracked set
(synthetic pin — no real git); `loadTrackedSet` smoke on the repo itself.

### `src/form/component-skin-distill.mjs` (NEW — pure distiller, ~150 lines)

Imports: `node:crypto` (sha256) ONLY. **No sdk-binding, no judge-reply, no child_process,
transitively** — the judge seam is absent by construction.

```js
export function componentLayerFrom({ inputs, contents })
  // contents: { regularized: string|null, component, roof, shaped: object|null }
  // → { inputs, pins, findings }  — the EXISTING layer semantics (sha pins, *-record-missing,
  //   *-pin-stale, roof-program-<status>), moved verbatim from component-skin.mjs:54–88.
export function deriveChainExitCode({ status, gate })
  // pipeline-failed → 1; else gate.outcome via the frozen contract: decided ? (passed?0:1) : 2.
export function zoneMapRepinFrom({ key, committedZoneMap, zoneMapRecordRel, skinZoneMap, shellSha })
  // → { shifted, record, bands, repin: {rel, content}|null } — the inline diff from
  //   component-skin.mjs:204–245 moved verbatim (incl. the repinnedBy/note strings).
export function distillComponentSkin({ key, runner, milestoneRecRel, milestone, exitCode, layer,
                                       committedZoneMap, zoneMapRecordRel })
  // → { record, repin }  — the WHOLE record assembly (component-skin.mjs:181–245 today).
  //   Live path passes the real child exit code; distill path passes deriveChainExitCode(...).
```

Header documents the one divergence from the `reconstructed --distill-only` precedent: exitCode
is DERIVED from the frozen exit contract, not carried, so a rebuilt status cannot sit beside a
stale code.

### `src/form/component-skin-distill.test.mjs` (NEW)

Synthetic fixtures: exit-code matrix (gated PASS/FAIL, REFUSAL, pipeline-failed); layer findings
(missing/stale/roof-status); repin diff (added/shifted/removed/identical). **Byte-match
tripwire:** for each legacy subject with a committed `component-skin/<k>.json`, read the
committed inputs from disk (registry def via `import { SUBJECTS } from
benchmarks/sculpture/durable-skin.mjs` — top-level imports verified pure), distill, assert
`JSON.stringify(record, null, 2) + "\n"` equals the committed pin bytes, and the recomputed repin
equals the committed `zone-map/<k>.reconstructed.json` where one exists. **Judge-unreachability:**
walk the distiller's transitive relative-import graph (read source, resolve `./`/`../` imports,
recurse) and assert no `sdk-binding.mjs`, `judge-reply.mjs`, `node:child_process`.
*Lands enabled for all legacy subjects in the rotation commit (the church pin is stale until
then; plan.md sequences this).*

### `src/form/pin-guard.conformance.test.mjs` (NEW — T-113-shaped source sweep)

Closed over `benchmarks/sculpture/*.mjs` (readdir): (1) no runner top-level-imports
`sdk-binding.mjs` — the live seam stays a named dynamic import; (2) the enumerated record-writing
runners (the nine below) import `pin-guard.mjs`; (3) `component-skin.mjs`'s `distillMain`
function source contains no `spawn` token; (4) record-write sites in the enumerated runners go
through `guardedWriteRecord` (regex: no `writeFile(recPath` / `writeFile(join(OUT_DIR, \`${...}.json`
escapes — pinned expressions per runner, the `VOCAB_FED` idiom).

### `docs/knowledge/pin-rotation-policy.md` (NEW — short, binding, citable)

Sections: (1) What is a pin (committed record; renders never). (2) The rotation rule — canonical
verdicts/records change only inside a ticket that explicitly owns them; one judge run per view;
T-114 governs malformed-reply completion only; `--rotate-pins` required; the retired pin named in
the commit. (3) What is always sanctioned — byte-identical rewrites, judge-free distillation
(`--distill-only`), `--rejudge` completion. (4) Enforcement — pin-guard, preflight-before-spend,
the conformance sweep. (5) The residual-4 disposition record (verdict pins retained; reskin
records rotated; dated, with the T-116 incident citations).

## Modified files (ordering matters)

1. **`benchmarks/sculpture/component-skin.mjs`** — `componentLayer(key, def)` becomes a thin IO
   wrapper over `componentLayerFrom` (export name/signature unchanged —
   reconstructed-milestone.mjs:44 keeps working). Record assembly + repin logic replaced by
   `distillComponentSkin` (live passes the child's real exit code). New `--distill-only` branch
   as a separate `distillMain()` called before any spawn-capable code: reads committed milestone
   record + layer inputs + committed zone-map, distills, writes via `guardedWriteRecord`.
   Live mode: preflight `component-skin/<k>.{json,md}` + milestone + gate record paths before
   `spawnMilestone`; forward `--rotate-pins` through `spawnMilestone`.
2. **`benchmarks/sculpture/kit-extract.mjs`** — live mode: `preflightPins` over the SELECTED
   subjects' `kit/<k>.{json,raw.json,md}` before the first `callModel` (the regression fixture's
   live counterpart: the verbatim swept invocation now refuses before any spend). All three
   record writes → `guardedWriteRecord`.
3. **`benchmarks/sculpture/multi-angle-gate.mjs`** — live mode: preflight `multi-angle/<slug>.{json,md}`
   at entry (before render/judge — this alone protects every chain runner's verdict pins).
   Record writes (:511–512) → guarded. Rejudge writes (:650–651) → guarded with
   `sanction: "rejudge (T-114 reply completion)"`. Parse `ROTATE_FLAG`.
4. **`benchmarks/sculpture/zone-map.mjs`** — `<k>.{json,md}` writes → guarded (byte-identical
   legacy regeneration passes untouched; a differing derivation now refuses without the flag).
5. **`benchmarks/sculpture/styled-milestone.mjs`** — record/md + artifact-JSON writes → guarded;
   `spawnGate` forwards `ROTATE_FLAG` via existing `extraArgs`; parse flag.
6. **`benchmarks/sculpture/challenge-milestone.mjs`** — same; its `spawnGate` copy gains an
   `extraArgs` param.
7. **`benchmarks/sculpture/generated-milestone.mjs`** — record/md + base/fit/plan/artifact JSON
   writes → guarded; forwards flag through styled's `spawnGate`.
8. **`benchmarks/sculpture/reconstructed-milestone.mjs`** — record/md writes → guarded; forward
   flag through its `spawnMilestone` extraArgs.
9. **`benchmarks/sculpture/durable-skin.mjs`** — artifact (:762) + record/md (:878–879) writes →
   guarded.
10. **`docs/knowledge/design-learnings.md`** — one short E-30 paragraph: pins are now structurally
    protected; link `pin-rotation-policy.md`; residual 4 closed (retained verdicts, rotated
    reskin records).

## Data changes (the rotation act)

- `component-skin/church.json` + `church.md` — ROTATED via
  `npm run reskin:church -- --distill-only --rotate-pins` (status `pipeline-failed` → `gated`,
  gate REFUSAL, derived exit 2; cites current committed milestone shas). Possibly
  `zone-map/church.reconstructed.json` appears (new file — first repin on the rebuilt geometry).
- `component-skin/{cottage,gatehouse}.json` — expected byte-identical under distillation
  (verified by the run + the tripwire test); rotated the same way ONLY if the byte-match reveals
  drift, named in the commit either way.

## Boundaries

- The gate's judged contract (azimuths, lens, verdict composition, exit codes) is untouched —
  additions are a preflight refusal before spend and guarded writes.
- No `SUBJECTS`/registry schema change; no subject-specific constants anywhere new.
- `npm test` glob unchanged (`src/**/*.test.mjs` picks up the three new test files).
- Sibling T-118-01 material in the working tree (`src/view/roof-region-diff.*`, ticket edits) is
  NOT touched; commits add only T-119-01 paths.
