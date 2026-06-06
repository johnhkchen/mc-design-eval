# Scoping rationale — T-082-01 (generated from `src/model-tier.mjs`)

Per-op model tier + why. Generated from the single-sourced `OP_ROUTING` table so this record cannot
drift from the code. The metered API key never enters any of these paths — a lighter tier is the
subscription shim with a smaller `--model`.

## Rubric

- **light** — a NARROW detector / classification scoped to ONE view, over a bounded candidate set the geometric read already surfaced (the model triages, it does not scan 57k voxels).
- **strong** — CROSS-VIEW judgement, AUTHORING a generator, or MATERIAL ZONING — anything that must reason across views or produce new structure, not just label cells on one view.

## Per-op routing

| op | tier | rationale |
| --- | --- | --- |
| `roof-patch-detector` | **light** | Classifies which roof cells read wrong on ONE top view, over a bounded candidate set (the strays and holes the pure roof read already isolated). Narrow + single-view → light. |
| `hollowable-mass-detector` | **light** | Confirms the safe-to-carve interior mass + flags skin-hole blockers, scoped to footprint + storey bands + a single 3/4 view. Bounded geometric classification → light. (Feeds T-080-01.) |
| `seal-authoring` | **strong** | AUTHORING a watertight seal over the holes the detector flagged is generative and must reconcile multiple faces — cross-view + new structure → strong (S-084, seal-before-hollow). |
| `material-zoning` | **strong** | Assigning materials to geometric zones across the whole build is the rubric's named strong case — material zoning across views, not a single-view label. |

## Tier ids (single-sourced in `config.mjs`)

- **light** → `claude-haiku-4-5`
- **strong** → `claude-opus-4-8` (the pinned Phase-1 default)
