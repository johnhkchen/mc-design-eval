# Research — T-143-01 straight-ruler-reverdict (E-34 / S-143, terminal)

Descriptive map only. What exists, where, how it connects. No solutions.

## 1. What this ticket is

E-33 (the measured proportion loop) ended with a known-bent ruler: the cottage hill-climbed a
plinth-misread eave, the barns passed the glance but the ≤2 budget recorded FAIL, and the
witnesses degraded after pin rotation without naming retirement. E-34 straightened the
instrument in five upstream tickets and this terminal ticket **re-asks E-33's question with the
straightened ruler** by re-running the three pattern-book subjects through the full chain and
recording the verdict movement. It is the only ticket of the epic that spends judge budget.

Upstream (all landed, all pure code/data — none ran a judge):
- **T-139-01** skirt-aware eave detection in `maskProportions` (the plinth-latch fix; the cottage's
  inverted-gradient root cause).
- **T-140-01** named lens on every ratio row + calibrated tolerance + **concept-precedence pitch**
  (`ruler-calibration.mjs`, `pr/assets/ruler-calibration.md`).
- **T-141-01** rustic envelope opened: `packs/rustic.json` `storeyHeight.max 4→5`,
  `pitchClasses [1]→[1,2]` (the wall-raise + class-2 pitch the cottage/barn aims needed).
- **T-142-01** witnesses made rotation-proof: SKIP-vs-FAIL guard (`src/form/witness-repro.mjs`) +
  `benchmarks/sculpture/retired-pins.json` sanctioned-rotation registry.
- **T-144-01** glance-true budget **v2** (`budgetVerdict` in `src/form/multi-angle-gate.mjs`):
  identity-first, severity-aware, `minorBudget=10` frozen, legacy ≤2 reported beside.

## 2. The chain (no single orchestrator — manual npm-script sequence)

Per subject, the live loop is (npm scripts in `package.json`):
1. `recognize:<subject>` → `recognize.mjs` — **live VLM** reads concept+sketch, emits program;
   writes `recognition/{key}{packNs}.{program,artifact,replies,record}.json`.
2. `patternbook:<subject> [--pack …] --ticket T-143-01` → `pattern-book.mjs` — re-parses committed
   recognition program (byte-compare), **measured re-seed under declared proportions** (T-135 arm),
   then `spawnSync` **`workshop.mjs`** which runs the loop with **hands engaged** (geometry levers +
   re-recognize, conditional on source+sketch existing — they do). Writes
   `workshop/{runKey}/program.json` (seed), `workshop/{runKey}.json` (ledger),
   `workshop/{runKey}/final-artifact.json`, `pattern-book/{runKey}.{json,md}`. **No judge here.**
3. `gate:patternbook:<subject>` → `multi-angle-gate.mjs` — **live VLM judge**, 4 config azimuths
   (45/135/225/315° @30°, 512², frozen — no flag changes them), T-088 coverage precondition per
   view, T-114 bounded re-asks, **budget v2 + legacy** in the aggregate. Writes
   `multi-angle/{slug}.json` + `pr/assets/frames/multi-angle-{slug}.png`.
4. Witnesses (judge-free re-derivations): `proportion:<subject>` (`proportion-witness.mjs`),
   `visibility:<subject>` (`visibility-witness.mjs`).
5. `milestone:proportion` (`proportion-milestone.mjs`) — pure I/O compose over committed records.

`workshop.mjs` and `geometry-levers.mjs` both make live model calls (strong tier via the
`claude -p` subscription shim) and GL renders every round. `pattern-book` itself is pure except
for the workshop spawn.

The three runKeys / slugs / packs:
| subject | pack | runKey | gate slug |
|---|---|---|---|
| cottage | rustic (default) | `cottage` | `cottage-patternbook` |
| barn (rustic) | rustic (default) | `barn` | `barn-patternbook` |
| barn (saltcrag) | `packs/saltcrag.json` `--ticket T-132-01` | `barn--saltcrag` | `barn-patternbook-saltcrag` |

Note: `pattern-book.mjs --ticket` defaults to **T-127-01** — must override with `T-143-01`.

## 3. Environment feasibility (probed this session)

- `claude -p` is **authenticated** (haiku probe returned `ok`). The subscription shim is live.
- GL renders **work**: `render/src/render.mjs` `GL_AVAILABLE: true` (headless-gl + node-canvas-webgl
  in the `render/` subpackage; no Playwright needed for these renders).
- All committed baseline records present and are the **T-138 baseline** bytes (not yet re-run):
  `pattern-book/{cottage,barn,barn--saltcrag}.json`, `workshop/…`, `multi-angle/…`.

## 4. Pin rotation & the safety machinery (T-119 + T-142)

- `src/form/pin-guard.mjs`: `preflightPins()` runs **before any spend**; `guardedWriteRecord()`
  refuses to overwrite a committed (git-tracked) record unless `--rotate-pins` is passed or a
  sanction matches. Domain `workshop` may **never** write into `multi-angle/` (judge isolation).
- `benchmarks/sculpture/retired-pins.json` (owner T-142-01) currently holds `proportion[]` entries
  for cottage (T-138-02 sha `e1abd583…`) and barn (T-138-01 sha `11ec20dd…`), and `visibility[]`
  entries for the three patternbook slugs. **`measured[]` is empty.** Keyed on `retiredSourceSha`:
  a witness SKIPs (named) when its pinned source matches a registry entry; a *further* undeclared
  change still FAILs. **T-143's bar:** each pin it rotates adds its own entry here as part of the
  rotation (the registry's note says so explicitly: "A future sanctioned rotation (T-143's bar)
  adds its entry here").
- The witnesses' tripwires (from the E-33 learnings, §2.4): rotated **gate records** make
  `visibility:repro` DIVERGE; geometry-bearing **ledgers** make `proportion:repro` throw
  (`replayLedger` wants the pack). T-142 SKIP guard covers these for *registered* rotations only.

## 5. The baselines this ticket re-verdicts (frozen, never re-banked)

`pattern-book/proportion-baselines.json` (schema `proportion-baselines/v1`, ticket T-138-01) and
`proportion-milestone.json` quote, **pre-rotation, legacy arithmetic**:
- **cottage** (rustic): final ratios ridge:eave 2.25 / roofShare 0.5556 / aspect 1.0769 (the
  bent-ruler read; corrected-by-hand ≈1.7/0.45). Gate: gapCount **11**, gapBudget 2 → **FAIL**,
  same-object **2/4**, 7 minor + 4 major. Two drifted views independently named roof-heaviness
  (residual "part-real").
- **barn (rustic)**: final 2.4444/0.5909/2 (occupancy lens). Gate: gapCount **8**, **4/4**
  same-object, 8 minor, **FAIL** on ≤2. Last proportion-flavored gap = class-1 pitch ceiling.
- **barn--saltcrag**: identical arithmetic (8/2 FAIL, 4/4 same-object, 8 minor).

The committed gate records carry **only legacy** `gapBudget` fields (they predate T-144's runner).
The T-144 `budget-calibration.json` evidence already showed, by re-derivation: **barn-patternbook
PASSES v2** (all-minor), **cottage-patternbook FAILS v2** (on majors/identity, not budget overflow).

## 6. The three honest questions (AC3)

1. **Cottage residual** — with T-139's skirt-aware eave, does the 4-major / 2-of-4 profile
   collapse to *real-only*, or does roof-heaviness persist as a true defect?
2. **Barn pitch** — does the class-2 pitch (T-141) close the last proportion gap, **or does
   concept-measured pitch stay within class 1** (the sketches are TRELLIS-flattened ≤45°;
   T-140 concept-precedence pitch decides this — recorded, not forced)?
3. **Barn verdict** — do the barns finally **record** the pass the glance already gives them,
   under v2?

## 7. Witnesses, milestone, glance, learnings (the recording surface)

- `proportion-witness.mjs` → `proportion/{runKey}.json` (per-round ratios under the corrected
  ruler, both lenses where they differ). `--repro` SKIP-guarded via `retired-pins.json` `proportion[]`.
- `visibility-witness.mjs` → `visibility/{slug}.json`. `--repro` SKIP-guarded via `visibility[]`.
- `proportion-milestone.mjs`: `--baselines` quotes pre-rotation (already committed); default
  recomposes milestone over re-run records; `--repro` byte-compares. Emits
  `pattern-book/proportion-milestone.{json,md}` + `pr/assets/proportion-milestone.md`.
- Glance: sheets beside concepts in `pr/assets/`; head-to-head `pr/assets/pattern-book-milestone.md`.
- `docs/knowledge/design-learnings.md` ends at the E-33 section (line ~2750); needs a new
  **straight ruler (E-34)** section + E-12 handoff. File is 2824 lines.

## 8. Constraints / assumptions surfaced

- **No per-building constants** (AC5; the generalization self-grep in every runner forbids subject
  keys in source — they live in `retired-pins.json` data only).
- **Replay must be byte-identical** (`--repro`/`--offline`) after rotation — the Rule-5 anchor.
- **Judge runs are singular** (AC2): one per view, fresh renders, T-114 for malformed, pins rotated
  under T-119 with retired pins named. The T-142 witnesses must be **green-or-named-SKIP before and
  after**, both recorded.
- **Open question — does `recognize` re-run?** T-141 widened the pack, which changes the recognition
  *prompt* (proportion rows are embedded). The committed recognition programs were produced under
  the old pack. The chain's `verifyRecognition` byte-compares the *committed* program; T-140's
  pitch precedence is applied at the **seed** stage (`stageSeed`/measured-proportions), not
  recognition. Whether to re-ask recognition under the widened pack is a Design decision (§ next).
- **Cost/irreversibility**: this is real subscription spend across recognize + multi-round workshop
  (×3) + 4-azimuth judge (×3), and it rotates committed gate/ledger/chain pins. The ticket's ACs
  are the durable authorization for exactly these runs; the run must be incremental and reproducible.
