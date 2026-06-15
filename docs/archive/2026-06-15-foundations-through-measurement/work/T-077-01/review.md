# T-077-01 Review — resemblance-consolidation

Handoff for a human reviewer. Terminal ticket of **E-22** (Story **S-077**). E-22 *photographs + judges*;
it does not edit form or materials. This ticket applied the delivered fixed render lens (T-075-01) + the
resemblance gate (T-076-01) to the four headline builds and reported honestly.

## Summary

The fixed lens + resemblance gate run across **gatehouse + cottage** (buildings) and **moai + pineapple**
(the two sculpture form-type poles — angular fine-relief vs organic textured). Each gets a triptych
(`concept | mesh | minecraft`, the verdict a human inspects — Rule 2), a metered categorical verdict + one
**named** residual gap (Rule 7), and diagnostic perceptual numbers. A consolidation report aggregates them;
material-attributed gaps are **routed to E-21 as findings**, not edited here (Rule 3). The gatehouse
before/after proves the scale-64 static was the **lens, not the build** (same artifact, HF energy −71.4%).

**Verdicts (live, fixed lens, metered judge):**

| subject | verdict | named gap | meshIoU | routes to E-21 |
| ------- | ------- | --------- | ------- | -------------- |
| gatehouse | `drifted` | form @ upper roof / gable | 0.929 | no (form) |
| cottage | `drifted` | material zoning @ upper-story walls | 0.929 | **yes → E-21** |
| moai | `different object` | form @ body (fused masses + rails) | 0.417 | no (form) |
| pineapple | `drifted` | palette @ fruit body | 0.908 | **yes → E-21** |

Tally: **3 drifted / 1 different object**; **2 material findings routed to E-21**. The fixed lens made
nothing look *better* than it is — the gatehouse static cleared but its real form drift stayed, and the moai
got an *honest worse* verdict the green metrics had masked (Rule 7 — kept, not hidden).

## Files changed

**Created**
- `benchmarks/sculpture/resemblance-consolidation.mjs` — the S-077 impure driver: iterate SUBJECTS →
  `runResemblanceGate` → pure `consolidateResemblance` → write reports + before/after + E-21 findings + copy
  E-12 assets. Not unit-tested (pulls GL + the metered model — the T-076 pattern); verified by `--offline`.
- `benchmarks/sculpture/resemblance/{cottage,moai,pineapple}-{triptych,minecraft}.png` +
  `-{perceptual,verdict}.json` + `-resemblance.md`; `resemblance-consolidation.{md,json}`.
- `pr/assets/gatehouse-lens-{before,after}.png` (AC#3) + `{gatehouse,cottage,moai,pineapple}-triptych.png`
  (AC#6 E-12 handoff).
- `docs/active/work/T-077-01/e21-material-findings.md` (AC#4) + the RDSPI artifacts.

**Modified**
- `src/form/resemblance.mjs` — pure `consolidateResemblance` + `RESEMBLANCE_CONSOLIDATION_SCHEMA` +
  `MATERIAL_GAP_ATTRS`. The only pure-core addition; makes no measurement decisions.
- `src/form/resemblance.test.mjs` — 4 aggregator/routing unit tests.
- `benchmarks/sculpture/resemblance.mjs` — generalized `SUBJECTS` (cottage + moai + pineapple, explicit
  paths) + `resolveSubject()`; `main()` simplified.
- `render/src/render-tool.mjs` — `renderArtifact` forwards `supersample` (guarded against the undefined-
  clobbers-default trap). Additive, backward-compatible.
- `package.json` — `resemblance:consolidate` script.
- `docs/knowledge/design-learnings.md` — the E-22 methodology section (AC#5).
- `benchmarks/sculpture/resemblance/gatehouse-{verdict.json,resemblance.md}` — re-run live (consistency).

**Not touched (immutable — Rule 1):** every concept image, GLB mesh, and build artifact. No form or material
edited (Rule 3). The pure scorer thresholds + judge prompt are frozen (Rule 5) — only the aggregator is new.

## Test coverage

- **Unit (root `npm test`, GL-/model-free): 816 pass / 0 fail** (was 812). The 4 new cases cover
  `consolidateResemblance`: verdict tally, the E-21 routing rule **both ways** (material → routed; form/
  massing/same-object → not routed), unknown-verdict counted-but-not-routed (no throw on a missing row), and
  empty/determinism. This is the durable regression surface for the routing charter (AC#4).
- **Driver verification (not unit-tested, by design):** `--offline` proves the GL-/model-free wiring + path
  resolution + report writers + before/after render + asset copy; the **live** run proves the end-to-end
  gate (Rule 6). The before/after HF number (−71.4%) reproduces T-075 exactly through the fresh ss=1/ss=3
  renders, independently confirming the supersample passthrough.

### Gaps
- No golden-image test for the triptychs / renders (GL/driver-variant + node-canvas text flakiness — the
  documented T-076 gap). Covered by the pure compose-math tests + the committed PNGs + human inspection.
- The metered judge is exercised only by the live run (cost), never by `npm test` — the §4 contract.

## Open concerns / known limitations

1. **Form gaps are reported, not fixed — by charter.** gatehouse (roof) and moai (body) drift are honest
   build verdicts owned by the build pipeline (E-19/E-20), not material findings. E-22 does not edit form;
   they are *not* routed to E-21. A reviewer wanting them closed should open build-pipeline work, not E-21.
2. **moai `different object` (meshIoU 0.417)** is the genuine worse case — the e19 moai form collapsed (fused
   masses, horizontal rails). The gate surfaced what the green metrics masked; it is reported, not softened.
3. **Concept camera mismatch** (T-076 concern #1) depresses `conceptIoU` + zone ΔE on every subject — they
   are diagnostic. `meshIoU` (exact build view) is the trustworthy form number; the triptych + judge are the
   verdict (Rule 2). Not "fixed" — it is a property of using an approximate-3/4-view concept as a reference.
4. **Single judge sample** (T-076 concern #3). `samples` is reserved on `runResemblanceGate`; a future
   comparison can raise it to an N-median. Thresholds/prompt stay frozen within the set (Rule 5).
5. **GLBs gitignored.** All four present in this env; on a clean checkout the runner warns + degrades to a
   placeholder mesh panel + null meshIoU (the triptych + perceptual row + verdict still produced).
6. **The committed verdicts are a snapshot** of one live run (the metered judge is non-deterministic across
   runs). Re-running may shift a borderline verdict or a gap's wording; the *methodology* + the *named-gap
   integrity* are the durable contract, not the exact sentence. Rule 6 (reproduce) is satisfied by the
   re-runnable driver, not by bit-identical model text.

## Reviewer fast path
1. Open `pr/assets/gatehouse-lens-before.png` vs `-after.png` — same build; the roof static clears (AC#3).
2. Open the four `benchmarks/sculpture/resemblance/*-triptych.png` — read each like a human (Rule 2).
3. Read `benchmarks/sculpture/resemblance/resemblance-consolidation.md` (verdict table + before/after +
   re-photographing honesty + E-21 routing) and `docs/active/work/T-077-01/e21-material-findings.md`.
4. `npm test` → 816 green. `npm run resemblance:consolidate -- --offline` reproduces GL-/model-free.

## E-22 closure
E-22 is complete: the lens is fixed (T-075), the gate exists (T-076), and the four headline builds are
photographed + judged honestly with the residual gaps quantified, named, and routed (T-077). Two material
findings (cottage zoning, pineapple palette) await E-21; two form gaps (gatehouse roof, moai body) are the
build pipeline's honest verdicts.
