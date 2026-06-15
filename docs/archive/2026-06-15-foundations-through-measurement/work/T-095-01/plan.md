# T-095-01 challenge-milestone — Plan

Six steps, each independently verifiable and atomically committable. No new `src/` code ⇒ no new
unit tests (repo seam: runners are impure wiring verified by live gates + `--offline`); `npm test`
must be green at every commit boundary. All commits path-scoped (sibling Lisa sessions own other
worktree noise).

## Step 1 — Church material map: filter + row + one-time pin
1. `material-map.mjs`: add generic `--subject <key>` filter to `run()`; add church row
   (`runs/016-vBuilding-a-village-church-with-a-square-bell-tower`). Header documents the filter
   as the regeneration guard.
2. Verify offline first: `node benchmarks/sculpture/material-map.mjs --offline` (church absent ⇒
   skipped gracefully; cottage/gatehouse re-validate from committed raws — proves the filter
   didn't break the sweep).
3. LIVE (metered, once): `node benchmarks/sculpture/material-map.mjs --subject church` →
   `material-map/church.{json,raw.json}`. Sanity-read the map: roles cover walls/roof (+the
   tower), palette is 1.20.1 blocks, near-tone stats present. This committed JSON is the pin for
   the only LLM-authored *input* on the church path.
4. `npm test` (untouched) → **commit 1**: map runner filter + church records.

## Step 2 — The challenge runner
1. Write `benchmarks/sculpture/challenge-milestone.mjs` per structure.md §Created: provisionBase
   (data-gated), shellStage (T-091 cores, no pins), runChain (uniform def transform, intermediates
   written before `buildSkin`), main with `--offline` AND `--repro` (re-run the deterministic
   chain GL/judge-free, compare sha256s to the committed record — the cheap AC4 fresh-run proof),
   gate spawn (`--label challenge --artifact challenge/<s>/artifact.json`), pipeline-failed
   recording (D6), record+md.
2. `package.json`: `challenge:{cottage,gatehouse,church}` scripts. `.gitignore`: challenge PNG
   stanza.
3. Verify without GL/meter: `node … challenge-milestone.mjs` (no --subject) → usage error names
   the three subjects; `--subject cottage --offline` → clean "no committed record yet" failure.
   Syntax/import smoke: `node --check` equivalent via the failed-arg run.
4. **Commit 2**: runner + scripts + gitignore.

## Step 3 — Live cottage + gatehouse milestones
1. `npm run challenge:cottage` then `npm run challenge:gatehouse` (GL + 4 judge calls each via the
   spawned gate). Expected per design D10: chain completes (shell closure, skin gates pass on the
   repaired base — if a terminal gate THROWS, the pipeline-failed record is the result and the gap
   is named); gate verdict may be FAIL with roof-form gaps (the honest T-093 baseline successor).
2. Inspect: `challenge/<s>.{json,md}` (strip/void/closure numbers; zone-map diff vs committed
   record; double-run byte-equality line), gate records `multi-angle/<s>-challenge.{json,md}`,
   sheets + `challenge-<s>-{before,after}.png` frames (eyeball: before = grey-roof/pink-patch
   witnessed state).
3. `--offline` + `--repro` re-asserts for both subjects (repro must sha-match).
4. `npm test` → **commit 3**: records, artifacts, frames for both subjects.

## Step 4 — Church: registry entry + first untuned run
1. Read the committed church map; transcribe `policy`/`legacy` 1:1 from its roles into
   `durable-skin.mjs SUBJECTS.church` (full entry per structure.md, incl. `provision: {scale: 48}`,
   nullable records, comment citing the map + the untuned contract). Choose `frontDir` from the
   concept's canonical view (checklist's 3/4 view ⇒ front face toward camera; verify against the
   provisioned render in 4.3 and the GLB silhouette).
2. `npm test` (registry data only — suite must stay green before the live run).
3. `npm run challenge:church` — provisions `base-artifact.json` (voxelize@48 + feature-assign),
   shell stage, skin, gate. EVERY divergence is a recorded finding: derivation fallback, coverage
   THROW (⇒ pipeline-failed record), judge FAIL/REFUSAL. Nothing gets tuned in response (Rule 6 /
   design D10); if the chain fails mechanically for a *generic* reason (e.g. a core assumes two
   storeys), fix the generic defect, never with a church key — document any such deviation.
4. Inspect renders/sheet; `--offline`/`--repro`; `npm test` → **commit 4**: registry entry + all
   church artifacts/records/frames in ONE commit (no roster-names-missing-file window).

## Step 5 — Generalization check + docs + handoff
1. AC3, recorded: `grep -rn "church" benchmarks/sculpture/*.mjs src/` → expected hits = registry
   entries only (durable-skin entry, material-map row, resemblance CHALLENGE_SUBJECTS + comments,
   provision-concept usage comment). Record the command + classified hits in the challenge
   handoff doc (and review.md).
2. Write `pr/assets/challenge-milestone.md`: per-subject chain table (provision/shell/skin
   numbers), gate verdicts with named gaps, the before/after frame pairs, the reproducibility
   statement (double-run + --repro + LLM pins: committed material maps/kits; judge = pinned model,
   single-sample, variance named), what-this-does-NOT-claim.
3. Append the E-25 section to `docs/knowledge/design-learnings.md` (D9 content, honest
   over/under-reach incl. the gate outcome per subject).
4. `npm test` → **commit 5**: docs + handoff.

## Step 6 — Review phase artifact
progress.md kept current throughout; write review.md (changes, coverage, AC-by-AC status incl.
the AC2 pass/fail reality and reviewer decision points), → **commit 6** (RDSPI artifacts).

## Verification matrix
| Concern | Proof |
|---|---|
| End-to-end, no hand edits (AC1) | one `npm run challenge:<s>` per subject; records generated only by runs |
| Gate verdicts (AC2) | `multi-angle/<s>-challenge.json` + committed sheets; gaps named per view |
| Generalization (AC3) | recorded grep, hits classified as registry-only |
| Reproducibility (AC4) | in-run double-run byte-equality; `--repro` fresh-process sha match; pins stated |
| Before/after (AC5) | `challenge-<s>-{before,after}.png` from the witnessed E-23/E-24 artifacts |
| Docs/tests (AC6) | design-learnings section; handoff md; `npm test` green at each commit |

## Risks / contingencies
- **Skin gate THROW on repaired base** (census shift): pipeline-failed record IS the result; named
  in review; no threshold moves.
- **Church concept unreadable by band-profile**: prior-fallback (transcribed map) recorded; run
  continues — that is itself a generalization finding.
- **Judge flap at the gap budget** (T-093): single-sample policy kept; flap risk named in the
  record; multi-sample voting stays a follow-on.
- **GLB/texture/dwebp absence**: provision throws early with a clear message (church GLB verified
  on disk in research).
- **Sibling sessions**: path-scoped commits only; re-check `git status` before each commit.
