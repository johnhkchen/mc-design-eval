# T-042-01 — Review: codesign-ab-and-consolidate

Handoff for a human reviewer. Story S-042, epic E-14 — the **terminal link** of the concept-build palette
co-design loop. Runs the loop's measurement over the E-13 sculptural subjects, adds the concept↔render
**Δvalue feedback gate**, measures gap closure vs the E-13 baseline, journals it, and hands the before/after
beat to E-12. Gated on both ends (`depends_on: [T-040-01, T-041-01]`, both done).

## What changed (3 commits, on `main`)

**Commit 1 — `feat(E-14 T-042-01): valueGate — concept↔render Δvalue feedback gate`**
- `src/color/value-gate.mjs` (NEW, ~210 lines) — the deliverable. Pure/GL-free/network-free.
  `valueGate(realized, reference, {threshold})` = the gate (mean ΔE + flag + `comparePalettes` partition);
  `realizedPaletteFromArtifact` = the segmentation-free render proxy (placed manifest at value-true Lab);
  `toReferenceClusters`; `gapClosure`. Reuses cielab `nearestLab`/`deltaE`, value-palette
  `resolveValueTruePalette`, image-grid `comparePalettes` — **zero new color math**.
- `src/color/value-gate.test.mjs` (NEW) — 21 tests, groups A–G.

**Commit 2 — `feat(E-14 T-042-01): codesign A/B — measured concept↔render gap closure`**
- `benchmarks/sculpture/codesign-ab.mjs` (NEW) — offline consolidation over moai/sword/pineapple (no model,
  no GL; renders pre-exist). Per subject: concept palette → v1/v2 realized palettes → two gate runs →
  closure → categorical verdict vs E-13 → corrective-re-place note.
- `benchmarks/sculpture/codesign-ab.{md,json}` (NEW, generated) — the A/B report + machine record.

**Commit 3 — `docs(E-14 T-042-01): value-true journal + E-12 before/after handoff`**
- `docs/knowledge/design-learnings.md` (M, append-only) — "E-14 value-true co-design" section.
- `pr/assets/value-true.md` (NEW) + `pr/assets/frames/value-{moai,sword,pineapple}-v{1,2}.png` (NEW, copied).

## The result (the point of the ticket)

| subject | E-13 verdict | ΔE before (`.v1`) | ΔE after (`.v2`) | closure | gate after | E-14 verdict |
|---|---|---|---|---|---|---|
| **moai** (angular) | Competent — drifted value | 6.97 ⚠ | 2.31 ✓ | **4.66 (66.9%)** | cleared | **closed** |
| **sword** (angular) | Recognizable — near-true | 3.98 ✓ | 2.65 ✓ | 1.33 (33.4%) | clear | already-near-true |
| **pineapple** (organic) | Organic — line softens | 10.34 ⚠ | 8.55 ⚠ | 1.79 (17.3%) | flagged | narrowed |

The headline moai value drift is **measured (6.97, over the gate) then killed (2.31, cleared)**:
`gray_concrete` L24.3 → `deepslate_bricks` L29.8, +5.5. The three outcomes (closed / already-true /
narrowed) are exactly the honest spread the ticket asked for.

## Acceptance criteria — status

- **AC1 — loop on ≥3 subjects; per-subject concept↔render ΔE before/after + judge categorical verdict vs
  E-13** ✔. `codesign-ab.md` covers moai + sword + pineapple, each with before/after mean ΔE, closure %, and
  a categorical verdict (`closed`/`already-near-true`/`narrowed`) against the recorded E-13 baseline. The
  live full-loop *re-run* is documented as metered/deferred (command given); the committed `.v1`/`.v2`
  artifacts already exercise both loop ends.
- **AC2 — Δvalue gate exists (`comparePalettes`: realized vs target → ΔE + threshold flag; corrective
  re-place documented whether or not it fired)** ✔. `valueGate` imports `comparePalettes` for the
  categorical partition and layers the ΔE; `flagged = meanDeltaE > 6`. The re-place is *recommended* on the
  flagged subject (pineapple) and recorded **fired: false** with rationale (idempotent vs the same palette).
- **AC3 — `design-learnings.md` value-true (E-14) section: before/after evidence, the moai resolution, honest
  notes where it didn't help / cost segmentation** ✔. Section appended with the table, the moai close, and
  four honest notes (by-construction caveat, sword near-true, segmentation cost, collapse residual).
- **AC4 — E-12 handoff: improved value-true renders + before/after value beat under `pr/assets/`** ✔.
  `pr/assets/value-true.md` + 6 before/after frames in `pr/assets/frames/`.
- **AC5 — honest (gaps/regressions shown); `.v1` reproducibility intact; `npm test` green** ✔. The pineapple
  residual and the gate's by-construction caveat are stated, not hidden. `git status`: only additions + the
  one append + Lisa-owned ticket frontmatter — no `.v1` artifact, frozen prompt, or existing module changed.
  `npm test` → **369/369** (348 baseline + 21 new).

## Test coverage

- **Unit (the gate core, 21 tests):** A `realizedPaletteFromArtifact` (counts/weights, first-seen order,
  non-cube resolution, namespace normalize, manifest fallback, throws); B `toReferenceClusters`
  (extractor-shape + array-shape, weight defaulting, throws); C `valueGate` ΔE math (identity→0, far→flagged,
  max≥mean, weighting, artifact-proxy input); D `comparePalettes` passthrough; E `gapClosure` (improve,
  equality, before:0 guard); F purity/determinism (deep-equal repeat, **inputs not mutated**); G threshold
  knob flips the flag at the boundary.
- **Integration (offline, executed):** `codesign-ab.mjs` ran the full extract→gate→closure chain on three
  real committed runs; numbers cross-checked against `value-match-ab.md` swap shifts.
- **Gaps (intentional):** (a) the **live** full-loop re-run is metered and not executed (the offline
  consolidation exercises the same measurement path; both loop ends are committed). (b) The extractor is
  reused but not re-unit-tested here (E-10 code with its own suite; this ticket adds no math to it).

## Open concerns / known limitations (for a human)

1. **`.v2` ΔE is partly tautological — by design, and flagged in-text.** The T-041 snap targeted the same
   realized palette the gate scores against, so a low `.v2` ΔE is partly built-in. The gate's enduring value
   is as a **regression/threshold detector** and a **residual record** — the pineapple *staying flagged*
   (8.55 > 6) is the evidence it discriminates. Reviewers should read the gate as "did the build deliver the
   concept's values, and where didn't it", not "is the build surprise-free".
2. **The realized palette is coverage-blind to the 2-D layout.** The placed-manifest proxy weights by
   placement *count*, not on-screen *area*. A block covering many small hidden placements is weighted like a
   block forming the visible face. A pixel-accurate read needs sculpture/background segmentation (the
   render PNG is ~79% viewer `glass`) — deferred, and called out as the segmentation cost.
3. **Threshold = 6 ΔE is a judgement call.** Chosen just above the extractor's own residual (~3–7) and near
   "noticeable at a glance"; it cleanly separates moai-after (2.31) and sword (2.65/3.98) from pineapple
   (8.55) and moai-before (6.97), but it is a single tunable constant, not a validated perceptual cut.
4. **Many-to-one collapse persists (inherited from T-041).** The gate makes it *visible* (`chiseled_nether_
   bricks` still 10.5 ΔE on the moai) rather than fixing it; the real lever (wider extractor `k` / a new
   palette-aware concept) is named but not exercised.

## Handoff

E-12 (`pr/assets/value-true.md`) gets the "measured the drift, then killed it" beat: the moai hero pair
(6.97 → 2.31) + the three-row honesty sweep. The gate (`valueGate`) is reusable on any single build via the
live runner for a future automated value-regression check. No follow-up ticket required by the ACs.
