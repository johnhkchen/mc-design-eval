# Style packs

A **style pack** is the per-STYLE bundle (E-31 Rule 2: per-style data is sanctioned; per-building
code stays forbidden): the diegetic material story (`provenance`), the human-curated palette that
derives from it role by role, the idiom set with style defaults, proportion rules, decoration
vocabulary, and the conformance checks the workshop runs every round.

- Contract: `schema/style-pack.schema.json` + `src/pack/style-pack.mjs` (loader, semantic
  validation, `packPolicy` → the T-113 vocabulary authority).
- Validate: `npm run pack:validate` (or `node scripts/validate-pack.mjs packs/<style>.json`).
- The `palette[].valueCheck` snapshots are authored once with the E-14/T-086 tooling and
  re-derived deterministically by the validator — a stale snapshot fails the pack.
- GLB textures are never read for materials (they are non-diegetic amalgam); precedence is
  concept evidence > pack assignment > vernacular default (`MATERIAL_PRECEDENCE`).
