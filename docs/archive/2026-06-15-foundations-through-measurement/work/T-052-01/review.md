# T-052-01 — Review (handoff): the E-16 synthesis

## What this ticket delivers

The capability the whole E-16 arc pointed at: **the voxelizer supplies the 3-D form; surgical region
tweaks polish it against its own 3-D source.** Two finished pieces composed, zero new `src/`:

- **Input** = the T-051-01 GLB-voxel builds (`glb-voxel/{koi,heart}/artifact.json`).
- **Accept signal** = the T-049-01 `glbFormTarget`, pointed at the **same GLB each build was voxelized
  from** — for the first time the build and its form target share one file.
- **Loop** = the unchanged E-15 `reviseLoop` (the seam invariant: only the input + the target are new).

**Headline finding (honest):** the surgical loop *can* clean a targeted voxelization artifact against the
3-D source — on koi the LLM fin edit cleared the per-region accept-gate (IoU 0.513→0.528, accepted +
locked). But that per-region clean **did not transfer to the whole object** (whole IoU 0.622→0.614), and on
heart nothing beat the already-near-perfect build (0.877, held 0/2). So the synthesis works *mechanically*
and *safely*, but a single-view per-region accept signal does not guarantee whole-object fidelity gain on
an already-close start. That divergence is the real result, reported plainly — not a number chased upward.

## Files changed

| File | Δ | Summary |
|---|---|---|
| `benchmarks/sculpture/glb-voxel-surgical.mjs` | **new (~210)** | The synthesis harness. Reads glb-voxel artifacts; per subject runs 2 regions (LLM `curve` + procedural `relief`) through the unchanged loop with `glbFormTarget({glbPath})`; renders before/after/proposed/crop; emits the `.json`/`.md`; `p14Report` audits P14 from the loop's own `locked`+`trace`; `--offline` regen. Local `VERDICT_GLOSS`; reused `formVerdictOf`. |
| `benchmarks/sculpture/glb-formtarget-ab.mjs` | **modify (+5)** | Added a standard **main-guard** so its `export`ed `formVerdictOf` imports side-effect-free. Behavior when run directly is unchanged; its committed numbers/output are untouched. |
| `.gitignore` | **+3** | Ignore `glb-voxel-surgical/**/*.png` (renders derived/heavy; the `.json`/`.md` is the record). |
| `benchmarks/sculpture/glb-voxel-surgical/glb-voxel-surgical.{json,md}` | **new (committed)** | The durable record from the live run (PNGs gitignored). |

**Not touched:** `loop.mjs`, `region.mjs`, `form-target.mjs`, `form-edit.mjs`, `tweak.mjs`,
`glb-voxel-build.mjs` — all consumed unchanged. That is the seam invariant, by construction.

## Acceptance criteria — status

- **AC #1 — `reviseLoop` on the T-051-01 glb-voxel koi+heart builds with `glbFormTarget({glbPath})`:** ✅
  Both subjects ran live (no skips). Input from `glb-voxel/<subj>/artifact.json`; target = the build's own
  GLB; `score: liveFormScore({ formTarget: glbFormTarget(...) })` — one line, no loop change.
- **AC #2 — per-region tweak trace (regions, procedural vs LLM-edit, kept vs rolled-back) + before/after
  form IoU vs the GLB + judge categorical, saved under `glb-voxel-surgical/<subj>/` + an A/B summary:** ✅
  Two regions per subject exercise **both** routes (`curve`→`llm-edit`, `relief`→`relief`); each trace row
  has `scoreBefore→scoreAfter` (true per-region GLB IoU), `accepted`, `reason`. Whole-object before/after +
  categorical `verdict` per subject. Renders under `glb-voxel-surgical/<subj>/`; summary at
  `glb-voxel-surgical/glb-voxel-surgical.{json,md}`.
- **AC #3 — P14-safety (no accepted region later altered; non-improving tweaks rolled back):** ✅
  `p14Report` → `ok: true` for both, zero violations. koi's accepted curve region is in `locked` and was
  never re-edited; every non-improving tweak (koi relief; both heart regions) rolled back, leaving the
  build unchanged.
- **AC #4 — honest (did tweaks clean artifacts / raise fidelity, and where not; kept-vs-rolled-back shown);
  `npm test` green:** ✅ The md headline + per-subject prose state plainly: koi cleaned the fin region but
  did not lift whole-object IoU; heart held 0/2 (the arch artifact was not cleaned at this view/scale).
  kept/rolled counts in the table (koi 1/1, heart 0/2). `npm test` **514/514**.

## Test coverage assessment

- **In `npm test` (514, unchanged):** the loop's P14 cage (`loop.test.mjs`), the form-target math incl.
  `mapVoxelRegionToMesh`/`glbSilhouetteScore`/`glbFormTarget` (`form-target.test.mjs`), the procedural
  passes (`tweak`/`form-edit` tests) — all the *logic* this harness composes is already unit-tested.
- **This harness is GL + metered → out of the suite by design** (every sibling A/B is the same; the only
  test glob is `src/**/*.test.mjs`). Its numbers are committed as a record, regenerable `--offline`.
- **Gap (intentional):** `p14Report` and `makeRegionCritic` are harness-local pure helpers with no unit
  test (they'd live outside the glob). They are simple reads over the loop's outputs; `p14Report` cross-
  checks the loop's own guarantee rather than re-implementing it. If desired, a future move is to lift
  `p14Report` into `src/revise/` with a unit test — but that widens `src` for a benchmark concern.

## Open concerns / known limitations

1. **Per-region accept-gate ≠ whole-object verdict (the koi `regressed`).** The loop hill-climbs the
   *per-region* single-view IoU; the verdict reports *whole-object* IoU. koi shows these can diverge: a
   kept per-region clean lowered whole IoU by 0.008. **This is not a gate bug** (P14 holds; the local edit
   genuinely improved its region) — it is a *signal* limitation. A reviewer extending this should NOT
   "fix" it by gating on whole-object IoU (that would defeat surgical locality); the honest read is that a
   single 3/4 view per-region IoU is a *necessary-not-sufficient* proxy for whole-object form. (My
   `VERDICT_GLOSS` is local precisely to say this — do not copy the sibling's "regressed = impossible"
   text back in.)
2. **n=2, single view, no orientation calibration** — the inherited E-13→T-049-01 honesty ledger. Absolute
   IoU is depressed by coordinate-space mismatch; the loop reads relative Δ. build⊂its-own-GLB makes
   alignment as good as it gets here, but rotation/axis mismatch is still uncorrected in general.
3. **Already-close start caps the upside.** Both builds start at 0.62/0.88 whole IoU; a *local* edit
   improving an already-good global form is intrinsically hard. The "held"/"cleaned-but-no-transfer"
   outcomes are the expected base case, not an under-performance of the loop.
4. **Region choice is curated** (from the occupancy histogram), not auto-discovered — the same scoping
   convention as every prior surgical run. A model-driven region proposer is out of scope (and a future
   epic's concern).

## Reviewer flag (a divergence I caught + handled pre-commit)

The first emit labeled koi **`regressed`** using the sibling's imported gloss ("impossible — an alarm").
Per plan.md's risk register I stopped and traced it: it is **not** a target/baseline mix (the T-049-01
trap) — the verdict is GLB-after vs GLB-before throughout. It is a genuine whole-object drop following a
per-region-accepted edit. Fix: a **local** gloss that frames `regressed` correctly for this harness (where
gate-measure ≠ verdict-measure) and a headline that separates "cleared the per-region gate" from
"transferred to the whole object." The numbers are untouched; only the interpretation was corrected.

## Verdict

All four ACs met. The synthesis runs end-to-end on both builds with the build's own GLB as target, the seam
invariant holds (zero `src/` change), P14 is verified from the loop's own record, and the result is
reported honestly — including the nuanced koi finding that a per-region clean need not raise whole-object
fidelity. `npm test` green (514). Two commits on `main`. Ready for review.
