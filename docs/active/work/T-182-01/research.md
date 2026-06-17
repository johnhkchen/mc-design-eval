# T-182-01 — Research

The payoff ticket of **E-45 / S-182**: re-run the T-178-01 crater on the **re-calibrated** style-distance
term (landed by T-181-01) and check it separates **two-sided** — matched lifts clear of the noise band AND
the wrong-style twin stays capped — without re-opening E-40's under-penalty collapse. This is descriptive:
what exists, where, and the contract the re-run must honor.

## The arc this closes (state of evidence)

| run | build | VOTES | A-matched | B-arc | A−B | verdict |
|---|---|---|---|---|---|---|
| E-40 baseline | new-roof | 2 | 2 | 0 | 2 | collapsed (both floored) |
| T-170-02 (typed kind) | new-roof | 2 | 8 | 14 | −6 | no (matched < wrong) |
| T-173-01 PRIMARY | faithful | **2** | **28** | 0 | **+28** | cratered — but a 2-sample artifact |
| T-178-01 | faithful-covered | **6** | **13±12** | 0±0 | +13 | **DID NOT separate** (inside ±12) |

T-178-01 (`docs/active/work/T-178-01/FINDINGS.md`) is the immediate predecessor: at VOTES=6 the prior
"crater" dissolved. The decisive evidence was the per-item audit — against its **own rustic concept** the
fully-faithful build still earned `WALL:replace 6/6`, `OPENING:replace 6/6`, `ROOF:replace 3/6`, the
**identical** department pattern it earns against the *wrong-style* classical concept. `replaceContrast =
−0.20` → NO CONTRAST. Localization: **the measure, not the build**. The judge fired `replace/wrong-style` on
present-but-imperfect elements *without conditioning on whether the element matches the concept*, and the
binary `min(score,40)` cap then floored both conditions.

T-180-01 (`AUDIT.md`) split the defect: locus = **BOTH**. R = the judge (Layer A `DiagnoseBuild`) mis-reads a
material-matching element as wrong-style; S = the binary cap floors a faithful-except-one build. R/S split was
6:10 across the audited items.

T-181-01 landed the fix in **two commits**, creation-loop scoring / Layer A only (`measurements/` untouched):
- **S fix (`aef5ab0`)** — `src/workshop/bakeoff-score.mjs`: `styleFidelityScore` is now severity-respecting
  (`PENALTY[severity] ?? major + WRONG_STYLE.distance`, replacing the forced 32-per-replace) and the binary
  `min(score,40)` is replaced by a **breadth-graded cap** `gradedCapFor(b) = max(40, 100 − 12·b)`, b = distinct
  wrong-style departments → 88/76/64/52/40 for b=1..5. New `wrongStyleBreadth`/`gradedCapFor`; `critiqueEvidence`
  gains additive `wrongStyleBreadth` + `gradedCap`. +6 unit tests (BO14a–f).
- **R fix (`951c7bb`)** — `baml_src/department.baml`: one `CONCEPT-CONDITIONAL` sentence (same-style-family +
  missing-detail ⇒ `add`, not capping `replace`); `prompt.golden.txt` re-pinned. **The R fix is compiled into
  `baml_client/inlinedbaml.ts` and committed** (verified: grep hits the inlined client; `git status` clean).

## The harness — `experiments/eval-alignment/corpus-referee.mjs`

The re-run uses this **unchanged**. Relevant seams:

- **Env knobs** (no code edit needed): `VOTES` (default 2), `CRATER_ONLY=1` (Section A only — the matched-vs-
  wrong question; skips ~40 corpus calls), `CRATER_BUILD` (default `builds/gatehouse/new-roof`). The ticket
  pins `CRATER_BUILD=builds/gatehouse/faithful-covered`, `CRATER_ONLY=1`, `VOTES=6`.
- **`CRATER_CONDITIONS`** (lines 133–138): `A-matched` (rustic concept + rustic pack — build matches both),
  `B-arc` (classical arch + guildhall pack — wrong-style), `B2-chapelle` (gothic + guildhall — triangulates
  arc-A's palette confound), `C-control` (classical concept + RUSTIC pack — isolates pack vs concept-image).
- **`runCrater()`** (140–173): writes 3 beside-concept PNGs, then for each condition runs `VOTES` `diagnose()`
  calls, records `scoreMean`/`scoreStd` + per-vote `items` (the audit trail). Computes `spreads`, `kindReliability`,
  and the verdict: `cratered = (A−B) > 2·NOISE` (24), `collapsed = A≤12 AND B≤12`.
- **`diagnose()`** (118–124): `bamlRender(DiagnoseBuild)` → `runTieredOp(strong)` → `bamlParse` → returns
  `{ev: critiqueEvidence, items: itemsOf, score: styleFidelityScore}`. The score and evidence now flow through
  the **re-calibrated** scoring (S fix) and the prompt is the **concept-conditional** one (R fix).
- **Asset guard** (242–257): every build view + every concept must exist before any spend. GUARD_ONLY verified
  clean (7 assets present).
- **Output**: `experiments/eval-alignment/results/corpus-referee.json` by default; `REFEREE_RESULTS` +
  `REFEREE_OUT_DIR` env override the sink. T-178-01 wrote `corpus-referee-faithful-covered.json` — the file
  this re-run must NOT clobber (it is the no-separation baseline to compare against).

## Scoring contract (post-fix) — `src/workshop/bakeoff-score.mjs`

- `itemStyleClass(item)` (69–79): typed `kind` WINS if present (`replace`→wrong-style, `add`→absent,
  `remove`→match); else structural (present+missing⇒wrong-style). The R fix steers the judge to emit `add`
  for same-family missing-detail, which this function reads as `absent` (non-capping).
- `styleFidelityScore` (187–202): per-item severity-respecting penalty for wrong-style, then `score =
  min(100−Σpenalty, gradedCapFor(breadth))`. Breadth = distinct wrong-style **departments** (157–162).
- `critiqueEvidence` (209–228): additive `wrongStyleBreadth`, `gradedCap` — the new evidence fields the report
  must quote beside the score.
- `kindReliability(conditions)` (314+): per-tier `replace` rates and `replaceContrast` (MATCHED replace-rate −
  WRONG replace-rate). Positive ⇒ the typed kind separates classes; this is AC #2's required metric.

## What the re-run actually tests (the live unknown)

The S fix is unit-proven (BO14). The **R fix efficacy is the metered unknown** (T-181-01 review concern #1):
whether the concept-conditional prompt actually stops Layer A tagging faithful stone `WALL:replace` /
`OPENING:replace` against the matched concept. Two-sided separation requires BOTH: matched must drop those
spurious wrong-style departments (so breadth falls → cap lifts) AND the wrong-style twin must keep them (so it
stays capped). If R fails, matched keeps breadth 3 and stays floored — separation again collapses, and the
localization re-hands to the judge model (the reading, not the prompt).

## Constraints

- **Metered, not in `npm test`.** ~24 strong-tier image-diagnose calls (4 conditions × 6 votes). Auth via the
  Claude subscription shim. No re-ask on malformed (a zero-token notice reply only burns budget).
- **Recommend, do not freeze.** No edits under `measurements/`. If PROMOTE, *spell out* the guarded freeze step
  (which file, which pin) but do **not** execute it.
- **Breadth caveat is mandatory** — one subject, ~2 wrong-style concepts is necessary not sufficient; the
  labeled multi-state corpus (E-40's standing debt) is the real promotion bar.
- **Honesty over win.** Non-separation or under-penalty is a sharp localization; record it, don't soften it.
