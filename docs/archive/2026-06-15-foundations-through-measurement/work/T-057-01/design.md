# T-057-01 Design — consolidation-scorecard-and-march

Decisions for turning `sweep-ablation.json` into one scorecard + one visual per subject + the journal
entry, grounded in the Research. Five decisions; each lists the rejected alternative and why.

## D1 — Scorecard is a PURE transform of the committed spine, mirroring `assembleAblation`

**Decision.** Add `assembleScorecard(spineJson)` → `{md, json}` to a new pure module
`src/form/scorecard.mjs`. It reads the *already-assembled* `sweep-ablation.json` (the `subjects[]`
with per-rung `formIoU/valueDeltaE/dFormIoU/dValueDeltaE/verdict`) and emits the scorecard markdown
+ a structured `scorecard/v1` JSON. No re-derivation of metrics from renders — it consumes the spine.

**Why.** The spine is the single source of truth (T-056-01 computed it once, on purpose). Re-deriving
risks drift between the scorecard and the record — the exact failure the spine was built to prevent.
A pure spine→view function is unit-testable under `src/**/*.test.mjs` with a tiny fixture, mirroring
the proven `assembleAblation` shape.

**Rejected.** (a) Re-render + re-score in the scorecard runner — duplicates GL work, can drift,
unnecessary. (b) Extend `assembleAblation` to also emit the AVG row — conflates the *collector's*
record (T-056-01, frozen) with the *presentation* layer (this ticket); keeps two tickets' outputs
entangled. A separate module is the cleaner seam.

## D2 — The AVG / Δ row attributes each technique by averaging its marginal column

**Decision.** The summary row the AC demands is computed per *technique column*, not per subject:

- **voxel (R1−R0)**: mean ΔformIoU and mean ΔvalueΔE across the 7 subjects → the form+value win of
  grounding geometry in the GLB voxelization.
- **material-clean (R2−R1)**: mean ΔformIoU (≈ 0) and mean ΔvalueΔE (the drop toward the canonical
  palette) → a *value* technique, not a form one.
- **surgical (R3−R2)**: mean ΔformIoU (≈ 0 / slightly negative) and mean ΔvalueΔE (0) → the honest
  "no net whole-object gain" beat.

Averages skip null cells (mean over present marginals only) and report **n** so a partial column is
never silently averaged as if complete. Each technique also gets a one-line **verdict gloss**
(won-form / won-value / wash) chosen from thresholds, plus the count of subjects it helped/held/hurt.

**Why.** "What did value / form (voxel) / material-clean / surgical buy on average" is literally the
AC #1 wording. Averaging the marginal column is the honest aggregate: it surfaces that voxel is the
decisive form lever (~+0.24 IoU), material-clean is a pure value lever (~−4.5 ΔE residual cleanup),
and surgical is a wash (~0, one −0.004 regression) — the legible whole-arc picture.

**Rejected.** Averaging the *absolute* rung metric (mean formIoU at R0 vs R1 …) — hides attribution
(you see levels rise but not which technique moved them) and mixes subjects of very different
baselines. The marginal-column mean is the attribution the ticket asks for.

## D3 — March image: pure RGBA row-montage + thin PNG I/O edge, written to the tracked bundle

**Decision.** Split the visual into (a) a **pure** pixel routine `montageRow(images, {gap, bg})` in
`src/form/montage.mjs` — takes N `{width,height,data}` RGBA8 panels of equal height, returns one wide
panel with `gap` px gutters of `bg` between them — unit-tested under the src glob; and (b) a thin
runner edge that PNG-decodes the four rung renders, calls `montageRow`, and PNG-encodes
`pr/assets/frames/march-<subject>.png`. Panels are placed left→right R0→R1→R2→R3.

**Why.** All four renders are 512×512 on the same `RENDER_BG`, so the composite is a buffer paste —
no resampling, deterministic, pure. Keeping the pixel math pure makes it testable (a 2×(2×2) paste
fixture) without GL or files; the only impure part is `pngjs` read/write, which is deterministic I/O,
not GL, but lives in the runner so the glob stays clean. Writing into `pr/assets/frames/` (tracked)
is mandatory: the source renders are gitignored, so the bundle must own the composites (Research,
`frames/README.md`).

**Rejected.** (a) Shell out to ImageMagick `montage` — adds a host-tool dependency to a build the
repo otherwise runs in pure Node; non-deterministic across IM versions; harder to test. (b) Burn rung
labels into the pixels with a bitmap font — no font lib in-repo, and the existing `triptych-*` /
`pair-*` frames keep labels in the docs, not the pixels. The march image stays a clean 4-panel strip;
the scorecard + README carry the R0→R3 legend. (c) A 2×2 grid — a left→right *march* reads the
progression as a timeline, which is the E-12 "climbing the ladder" beat.

## D4 — Scorecard + E-12 handoff co-locate in `pr/assets/sweep.md`

**Decision.** Write the scorecard to **`pr/assets/sweep.md`** (the AC's first option) and append the
**E-12 handoff** section to the *same* file (the "bringing it all together" beat: 7 subjects climbing
the ladder, the `march-*.png` index, and how it slots into the showcase sequence). Add one provenance
block to `pr/assets/frames/README.md` for the march frames.

**Why.** The handoff and the scorecard are the same story told to the same audience (the E-12 desk);
one file keeps the bundle self-contained and avoids a thin orphan doc. `pr/assets/` is already the
showcase home (`README.md`, `sculptures.md`, `sequence.md`) — `sweep.md` joins that set. Choosing
`pr/assets/sweep.md` over `benchmarks/sculpture/sweep-scorecard.md` puts the human-facing scorecard
next to the frames it references (relative links work) and inside the tracked bundle.

**Rejected.** Two files (`benchmarks/.../sweep-scorecard.md` for the table + a separate handoff doc) —
splits one narrative across two trees, and the table would live next to gitignored renders rather than
next to the tracked composites it points at.

## D5 — Journal entry mirrors the E-16 three-beat voice, numbers-first and honest

**Decision.** Append a **"Consolidation sweep (E-17)"** section to `docs/knowledge/design-learnings.md`
in the established voice: a one-table recap (per-technique attribution with the averaged numbers), an
explicit "where a rung didn't help" paragraph (material-clean buys no form; surgical is a net wash +
the bow-and-arrow −0.004 regression), and a one-sentence residual. Reuse the IoU bands already defined
in the E-16 entry (poor/fair/good/strong).

**Why.** AC #3 names this file and this content. The E-16 entry directly above is the template — same
reader, same honesty discipline (no re-run judge, zero/negative rungs shown). Consistency makes the
arc legible end-to-end: E-16 proved voxelization is the form lever on 2 subjects; E-17 generalizes it
to 7 and quantifies each technique's average contribution.

**Rejected.** A fresh standalone knowledge file — fragments the journal; the project's durable record
is explicitly this one file (root `.gitignore` calls it "the durable record").

## Honesty commitments (AC #5)

The scorecard's AVG row and the journal both state, in numbers: material-clean's form Δ is **+0.000**
(it is a value technique), surgical's form Δ is **−0.001** on average with **bow-and-arrow regressing
−0.004** and **0 subjects improved**, and R2/R3 valueΔE = 0 is a *snap-to-canonical* artifact (flag
the tautology, do not sell it as a free win). Nothing is dropped; n is reported on every average.
