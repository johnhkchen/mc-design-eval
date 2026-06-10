# E-24 durable skins — the pipeline reproduces the result, end-to-end (T-089-01)

The E-24 terminal handoff. The epic opened on an embarrassment: the good cottage skin (cream plaster band,
~77%) existed only as an agent's **inline hand-edit** — `npm run spray:paint` regenerated the bad 9%-splat
version. **A result the pipeline can't reproduce is not a result.** E-24 built the missing stages as pure,
unit-tested cores (zone-fill base coat T-085, value-true block selection T-086, coherent surface T-087,
coverage-aware gate T-088, full-shell exposure skin T-090), and this consolidation composes them into
**one named command per subject**:

```
npm run skin:cottage      # → benchmarks/sculpture/durable-skin/cottage.{json,md} + cottage/artifact.json
npm run skin:gatehouse
npm run skin:<s> -- --offline   # re-assert the committed record: sha256 + gates + AJV, no GL
```

Pipeline (all stages pure cores; the runner is wiring): **value-true selection** (concept-sampled, family-
bounded, prior kept absent clear margin; substitution renames build + zone policy once) → **seal** →
**full-shell zone-fill** (each zone's dominant on the 6-dir exposure shell; secondary runs kept) →
**secondaries splat** (concept on the front, GLB on the side, zone-gated, dominants excluded) →
**coherent surface** (roof-course basin-fill + stray-salt strip) → **coverage gate** (terminal THROW — a
failing skin cannot write a record).

Spine: `benchmarks/sculpture/durable-skin/{cottage,gatehouse}.{json,md}`; frames:
`pr/assets/frames/durable-{cottage,gatehouse}-{before,after,strip}.png` (before/after = splat-only vs
final at the oblique 225° the old fill failed on; strip = concept | splat-only | final, front);
refreshed triptychs: `benchmarks/sculpture/resemblance/{cottage,gatehouse}-triptych.png`.

## The two subjects — splat-only baseline → the durable skin

| subject | value-true switches (true ΔE) | dominant coverage: splat-only → final | courses | salt | gate | sha256 |
|---|---|---|---|---|---|---|
| cottage | `white_terracotta→sandstone`, `stone_bricks→tuff` (agrees with the committed T-086 record) | upper **5% → 88%** sandstone · roof 42% → 88% spruce · base 58% → 71% tuff | 0.784 → 0.827 (41 cols) | 262 stripped / 341 kept | splat-only **REJECT** → final **PASS** | `722af44b…` (9,707 pl) |
| gatehouse | `stone_bricks→polished_basalt` (9.49 → 4.9); deepslate/oak kept by margin/prior | roof **44% → 100%** deepslate · upper 69% → 77% · base 65% → 71% | 0.728 → 0.784 (91 cols) | 79 stripped / 726 kept | splat-only **REJECT** → final **PASS** | `8a30c191…` (10,598 pl) |

Bands (T-090 instrument, exposure shell): cottage roof materials **1.0**, upper stone residue **0**;
gatehouse roof **1.0** (upper residue n/a — base and upper share the wall dominant). Cottage plaster
invariant: base/roof = 0. `npm test` 1035/1035 green.

## Reproducibility — how determinism is achieved

**No LLM call is on the path.** The two LLM-authored inputs (the concept PNG, the E-21 material-map
roles) are committed artifacts — frozen data, not run-time calls; spray-paint's optional `--refine` stub
was not carried over. Every other stage is a pure function of those inputs. Each live run executes the
deterministic core **twice** and throws unless the artifacts are byte-identical; the artifact's sha256 is
recorded, and `--offline` re-verifies the committed artifact against it. A fresh re-run reproduces the
hash.

## What this does NOT claim (honest, Rule 5)

- **Resemblance did not jump.** Refreshed triptychs judge both subjects `drifted` (cottage gap: material
  zoning@roof; gatehouse: form@walls/roofline); front-face evidence cottage 0.35 → 0.30, gatehouse flat at
  0.344. E-24's deliverable is coverage + value-truth + coherence + reproducibility; closing the
  resemblance gap is form/zoning work (E-25/E-26). The numbers are recorded, not laundered.
- **Value-truth costs texture identity**: tuff is flatter than dressed ashlar, polished_basalt adds
  vertical striping — and renamed blocks read as misses to the *named-set* perceptual score (cottage set
  0.5). The hue axis the judge actually flagged (pink plaster) is gone.
- The salt strip still judges the **projection** skin while fill + census moved to the exposure shell;
  roof-course **bumps** remain (no-delete contract); **thin-sample roles** (gatehouse cobble 3 cells,
  door planks 11) keep their priors unvalidated; the gatehouse "E-23 baseline" is a **counterfactual**
  replay (no splat-only skin ever shipped for it).

**One sentence:** two subjects, one command each, skins with established dominants (88–100%), value-true
blocks, coherent courses, and a both-ways coverage-gate proof — reproducible to the byte, residuals named.
