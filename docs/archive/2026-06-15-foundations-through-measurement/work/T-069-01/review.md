# T-069-01 — surgical-refine-to-standard · Review

Handoff. E-20's quality-bar probe ran: the high-res building (T-068-01, `building/best`, 57,202 blocks) was
re-run through the E-15 surgical loop with the building's **GLB as the form target**, bounded rounds, toward
the categorical judge's **Strong+**. The honest outcome — **it topped out at `weak`** and the loop could not
move it — is recorded with the measured root cause. All four ACs are met (AC#3 is met by the topping-out
measurement, which the ticket Context explicitly endorses as a result, not a failure). `npm test` **786 green**
(was 767; +19 pure cases). 3 commits, all additive — **zero edits to `reviseLoop`, `glbFormTarget`, the
editors, or the judge** (the E-16 seam invariant).

## What changed (files)

**Created**
- `src/form/surgical-standard.mjs` — PURE analyzer (the only new reviewable logic). Verdict trajectory,
  form-IoU trajectory, edit-trace classification (procedural vs LLM, kept/rolled-back), the **P14-safety
  check** (`checkP14`: kept-non-improving / accepted-overlap / altered-after-lock), the topping-out detail
  pick, the Strong+-vs-topping-out `assessOutcome`, and `assembleSurgicalStandard → {md,json}`. No
  GL/I/O/Date/random; inlined `boxesIntersect` to stay import-light. Mirrors `building-build.mjs`.
- `src/form/surgical-standard.test.mjs` — 19 unit cases (every export; the three P14 violations; the three
  outcome shapes; the findings section).
- `benchmarks/sculpture/surgical-standard.mjs` — IMPURE runner. Composes `reviseLoop` +
  `liveFormScore({formTarget: glbFormTarget(...)})` + `makeFormEditor` + `judgeRender` over the building;
  bounded rounds, P14 across rounds (drop accepted regions), resilient judge, `--offline` re-derivation.
- `benchmarks/sculpture/surgical-standard.{json,md}` — the trajectory + edit-trace + P14 + outcome + findings.
- `benchmarks/sculpture/building/round-{0,1}/summary.json` — per-round cell + trace + edit proposals.
- `pr/assets/frames/building-refined.png` — the final render (E-12 nicety).
- `docs/active/work/T-069-01/{research,design,structure,plan,progress,review}.md`.

**Modified (additive only)** — `package.json` (`surgical:standard` script); `.gitignore` (refined artifact +
round renders ignored; round summaries + report committed).

**Untouched (zero regression surface)** — `src/revise/{loop,region,form-edit,tweak,material-edit}.mjs`,
`src/form/form-target.mjs`, `baml_src/judge.baml`, `benchmarks/temple-facade/*`, the schema, every existing
runner. This ticket is composition + measurement.

## Results (AC#3 — honest)

| round | overall | whole-object IoU | accepted |
| ----- | ------- | ---------------- | -------- |
| 0 (baseline) | **weak** | 0.929 | 0 |
| 1 | **weak** | 0.929 | 0/4 |

**Topped out at `weak`.** Did NOT reach Strong+. All four fine-detail regions (roof/cornice, gable+arch,
both side window reveals) rolled back; net form-IoU gain 0; P14-safety **SAFE** (0 accepted, nothing altered).
Per-region GLB IoU at the regions: top 0.596, front 0.723, left 0.635, right 0.750 (the accept signal — none
improved because no edit was proposed).

**Why (measured, two compounding causes):**
1. **The per-region LLM block-edit route cannot run on the high-res build.** All 4 proposals failed — the
   `baml-revise` subprocess exited non-zero with a "prompt too long" BamlError (**~1.25M tokens vs the 1M
   limit**). A high-res region's placement list (tens of thousands of blocks at scale 64) overflows the model
   context. The E-15 path was validated on ~32-block sculptures (hundreds of placements); it **does not scale**
   to the high-res building's region density. No proposal → nothing to accept → the cage holds.
2. **The GLB form target lost the defining detail upstream (T-067).** TRELLIS dropped the arch ring, the
   gable ridge, and the slit windows, so even a working editor has no per-region signal toward them.

## AC verification

- **AC#1** `reviseLoop` on the building with `formTarget: glbFormTarget({ glbPath })`, region-by-region,
  bounded rounds — ✅ ran (the runner; loop + target reused verbatim). It did not reach Strong+ because the
  edit route could not propose (cause #1) — recorded, not hidden.
- **AC#2** per-round judge verdict trajectory + per-region edit trace (procedural vs LLM, kept/rolled-back) +
  form-IoU trajectory; P14-safety holds — ✅ all four recorded in `surgical-standard.{json,md}`; P14 SAFE
  (verified by `checkP14`, unit-tested).
- **AC#3** outcome stated honestly — ✅ **topped out at `weak`**, with the best verdict + the specific detail
  the loop couldn't fix (top region, IoU 0.596) + the measured root cause. The ticket Context explicitly
  endorses this ("if it tops out below Strong, measure and explain where/why; that is a result").
- **AC#4** final refined `DesignArtifact` + render saved; `npm test` green — ✅ refined saved to
  `building/refined/artifact.json` (byte-identical to `best` — the cage held; gitignored to avoid a 7.6 MB
  duplicate, equality documented) + `building-refined.png`; **786 pass, 0 fail**.

## Test coverage

- **Unit (`npm test`, CI-safe):** the entire pure analyzer — rank/standard, both trajectories, edit-trace
  classification, all three P14 violation types + a clean trace, topping-out pick, all three outcome shapes,
  the assemble shape/tables/findings/throws. Deterministic, no GL/model. 19 cases.
- **Live (manual, GL + claude -p):** the loop/render/judge branch — exercised by the committed run;
  re-checkable via `node benchmarks/sculpture/surgical-standard.mjs --offline` (re-derives the report from the
  committed round summaries, no GL/model — verified).
- **Coverage gaps (by design):** the runner's render/judge/loop-with-live-model branch is not unit-tested (the
  suite must never pull GL or a metered subprocess) — the project's standard untested surface, matching
  `glb-formtarget-ab.mjs` and `building-build.mjs`.

## Open concerns / flags for a human reviewer

1. **The render-lens confound on the `weak` verdict (HIGH — read before trusting "weak").** The judge's core
   complaint is that the roof/crown "dissolves into a chaotic grey jumble / noise." Per the E-22 finding
   (*render aliasing ≠ material speckle*), the scale-64 grey static is **texture-minification aliasing — the
   render lens, not the build geometry**. So the `weak` detail/fidelity verdict is **confounded by the
   rendering pipeline**: the build's blocks are clean (T-068: off-palette 0, speckle ~0), but the 3/4 render
   at this resolution aliases the texture into noise. The honest reading is "weak **as rendered by the current
   lens**"; E-22 fixes the lens and moves the gate to reference resemblance, which may lift this materially.
   This ticket measured the verdict faithfully but the verdict is not purely a property of the build.
2. **The surgical LLM-edit path does not scale to high-res builds (the headline finding).** "Prompt too long"
   on every region is an architectural limit, not a flake: the per-region placement list is the model input
   and it grows with scale. Future work to actually *refine* a high-res build needs either (a) far smaller
   regions (a few hundred placements — but then a "window reveal" at scale 64 spans many such tiles), (b) a
   compressed region representation (run-length / op-merged placements) fed to the editor, or (c) a procedural
   form pass that does not round-trip placements through the model. Recorded; out of this ticket's scope
   (measurement).
3. **The GLB reconstruction caps what any form refinement can target (T-067).** The form target has no signal
   toward the arch/gable/slits because the mesh lost them. A genuinely refinable high-res building likely
   needs a better upstream mesh (or a concept-grounded E-21 target), not a better loop.
4. **Judge prompt frames a temple facade head-on; the subject is a gatehouse at 3/4 (MED).** The enum + dims
   transfer and the notes are clearly about the gatehouse, but "let alone a grand temple" appears in the
   baseline notes — the temple framing slightly penalizes a non-temple. Recorded in the report note; a
   gatehouse-specific brief variant would be a cleaner judge for E-20 buildings.
5. **Single 3/4 view + GLB↔build origin/scale normalization residual** (inherited from E-16): rotation/axis
   mismatch uncorrected; absolute IoU bounded by the reconstruction. The relative trajectory (here: flat at
   0.929) is the kept signal.
6. **Judge flakiness (LOW, mitigated).** The metered `claude -p` judge crashed two full runs on a transient
   3-sample failure; `judgeWhole` now retries → single-sample → degrades to `unknown`. The committed run
   succeeded with 3 samples both rounds.

## Verification commands
- `npm test` → 786 pass.
- `node benchmarks/sculpture/surgical-standard.mjs --offline` → re-derive the report from the committed round
  summaries (no GL/model).
- `npm run surgical:standard -- --rounds 1 --samples 3 --per-region 1` → live (GL + claude -p; needs
  `glb/stone-gatehouse.glb` + `building/best/artifact.json`).
