# Epics

Epics are the top of the work hierarchy: **Epic → Story → Ticket**. Each epic is a large, spec-grounded body of work that will be broken into stories (`docs/active/stories/`), which in turn break into RDSPI tickets (`docs/active/tickets/`).

Epics are planning artifacts. Unlike tickets, they are **not** scheduled or phase-advanced by Lisa (the `.lisa.toml` `[dirs]` only scans tickets/stories/work). They exist to scope and sequence the work and to anchor stories to the spec.

Source of truth: [`docs/specification.md`](../../specification.md).

## Epic map

| ID   | Title                              | Priority | Depends on        | Spec        |
|------|------------------------------------|----------|-------------------|-------------|
| E-01 | artifact-contract-and-export       | high     | —                 | §5, §6      |
| E-02 | render-harness                     | high     | E-01              | §3, §4      |
| E-03 | experiment-harness                 | high     | E-01, E-02        | §4, §7      |
| E-04 | evaluation-and-scoring             | high     | E-01, E-02        | §9          |
| E-05 | feedback-and-rating-system         | medium   | E-02, E-04        | §10         |
| E-06 | phase-1-study                      | high     | E-03, E-04, E-05  | §8, §11     |
| E-07 | phase-2-model-sweep                | low      | E-06              | §1, §11     |
| E-08 | autonomous-experiment-loop         | high     | E-03, E-04        | §7, §9, §11 |
| E-09 | image-to-3d-voxel-pipeline         | high     | E-01, E-02, E-04  | §1,§5,§6,§7,§9 |
| E-10 | block-palette-and-cielab-matching  | high     | E-01              | §5, §6, §9    |
| E-11 | staged-sculptor-framework          | high     | E-01,E-02,E-04,E-10 | §1, §5, §9  |
| E-12 | evolution-showcase                 | medium   | —                 | (comms)     |
| E-13 | concept-grounded-best-of-sequence  | high     | E-03, E-04        | §7, §8, §9  |
| E-14 | concept-build-palette-codesign     | high     | E-10, E-13        | §5, §6, §9  |
| E-15 | surgical-revision-loop             | high     | E-02,E-04,E-11,E-13 | §1, §5, §9 |
| E-16 | glb-grounded-form-and-revision     | high     | E-09,E-10,E-11,E-15 | §1,§5,§6,§9 |
| E-17 | consolidation-sweep                | high     | E-13,E-14,E-15,E-16 | §1,§5,§6,§9 |

## Dependency graph

```
E-01 ──┬──> E-02 ──┬──> E-03 ──┬──> E-06 ──> E-07
       │           │           │
       └──> E-04 <─┘           ├──> E-08 (E-03, E-04) ──> E-06
                   E-05 <──────┘ (E-04, E-02)
            E-05 ───────────────> E-06
```

E-01 is the foundation (the artifact contract is the spine, §5). E-02–E-05 build the four instrument layers around it. E-06 runs the Phase-1 3×3 matrix once those layers exist. E-07 is the deferred Phase-2 model sweep. E-08 is the autonomous optimization loop: it *discovers* improved prompting techniques (on top of E-03's runner, judged by E-04) and feeds the promoted champions into E-06's fair comparison. E-09 swaps the geometry engine — LLM design reasoning → concept art → 3D mesh → voxel → the same DesignArtifact (§5) — keeping the instrument (E-02 render, E-04 rubric, §6 validators) while retiring text-JSON's geometry ceiling; its voxelizer core is built portable so other repos (e.g. plant-model-studio) can reuse it. E-10 is the real-block color layer: a CIE-Lab nearest-block engine + a block→Lab table that extracts the canonical block palette from a concept image and maps colors to real blocks — grounding concepts (imaginary blocks → real, detail → resolution-capped) before image-to-model, and serving as E-09's portable voxelizer color core. E-11 is the keystone: the **staged sculptor** — block out gray massing, lock it, then add material/relief/curves/detail as pluggable passes over a locked substrate, framed by massing-first and render-review-iterate. It is the input-agnostic toolkit that makes the final build good whatever the form source (concept image now, GLB/scan later); the craft-pass library and the E-09 voxelizer plug into it. E-13 demonstrates breadth — the `vConcept` archetype (term → concept → build) turned loose on sculptural subjects — and *measures* the concept→build fidelity frontier. E-14 acts on what E-13 measured: it activates E-10's CIE-Lab engine in the live path as the **shared value-true palette contract** between the concept and build stages, closing the *value* drift (the moai's faithful-form/too-dark-block gap) from both ends at once — the color half of the gap, leaving the form half to E-11/E-15. E-15 closes the **iterate** bookend E-11 left open: a **region-scoped observe→tweak→re-observe→accept-if-improved** loop over the compiled `DesignArtifact` (input-agnostic — facade or 3-D sculpture), driven first by deterministic scoped passes (the proven cage) then an LLM form-edit lever behind the same accept-gate, scored by a silhouette-IoU form metric. It attacks the **form** half (organic line-loss: the koi S-curve, the heart aortic loop) the way E-14 attacked color, and exposes a per-region **form-target interface** where a future GLB hint (E-09) plugs in unchanged. E-16 supplies that GLB: real TRELLIS image→3D meshes (made from our concept images) used three ways — as a **form target** that plugs into E-15's seam (does a 3-D target unlock the loop the flat concept couldn't?), as a **geometry source** voxelized into a `DesignArtifact` (is the voxelizer's form better than text→JSON?), and — the synthesis — a **GLB-voxel build refined by surgical region tweaks against the GLB itself**. It is the overnight chain that closes the image→3D arc and tests "GLB voxel set + surgical regions" as the capable configuration, head-to-head vs text→JSON. E-17 brings the whole arc together: an **ablation sweep** taking all 8 sculptural subjects up one canonical technique ladder (text→JSON → glb-voxel → +material-clean → +surgical), scored identically at every rung, so the **marginal contribution of each improvement** (value, form, material, polish) is finally legible in one scorecard + a per-subject march-of-progress. It also adds the one new lever the sweep needs — a **material-clean pass** that fixes E-16's per-voxel color speckle (form was solved by voxelization, material was not).

## Epic frontmatter

```yaml
---
id: E-01
title: kebab-case-name
type: epic
status: open          # open | in-progress | done | deferred
priority: critical | high | medium | low
depends_on: [E-00]    # other epics
spec: "§5, §6"        # relevant specification sections
stories: []           # story IDs, filled in as stories are created
---
```
