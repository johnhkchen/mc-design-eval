// Staged-sculptor compile — build state → DesignArtifact (T-024-01, epic E-11 / story S-024).
//
// The spine's exit: turn the rich intermediate (occupancy + material + relief, with locks) into the
// flat `DesignArtifact` that render/judge/export already consume — so NOTHING downstream changes.
// Each occupied cell becomes one `voxel` placement at `[x, y, relief]` (Z carried from relief —
// inset -1, pop +1 are legal negatives/positives; "builds use a local origin"). One placement per
// cell means each cell is written exactly once, sidestepping the schema's last-writer-wins overlap
// rule. The palette manifest is derived from the blocks actually placed (so it's intrinsically
// unique and non-empty whenever the facade has ≥1 occupied cell).
//
// BOUNDARIES: pure construction. This module imports build-state.mjs (occupiedCells) and config.mjs
// (the pinned model id) — and DOES NOT validate. The AJV gate (src/artifact.mjs) is a consumer-side
// check: tests compile here, then assert the output passes the real validator (the round-trip AC).
// Keeping ajv out of compile keeps the spine free of the schema and the validation a separate seam.

import { occupiedCells } from "./build-state.mjs";
import { PHASE1_MODEL_ID } from "../config.mjs";

/** Compile-time defaults for the non-geometry artifact wrapper (the build state has no trial
 *  identity). Downstream bookends (massing T-025, etc.) override via `opts`. */
export const COMPILE_DEFAULTS = Object.freeze({
  schemaVersion: "1.0.0",
  defaultBlock: "minecraft:stone",
  metadata: Object.freeze({
    trial_id: "sculptor-compile",
    prompting_method_id: "staged-sculptor.v1",
    model_id: PHASE1_MODEL_ID,
    seed: 0,
    server_state_id: "in-memory",
  }),
  style: Object.freeze({
    name: "massing",
    rationale: "Compiled from a staged build state; geometry only — overridden by the producing stage.",
  }),
});

/**
 * Compile a build state to a schema-valid DesignArtifact. Pure — does not validate (callers run it
 * through src/artifact.mjs). Throws if the state has no occupied cells (the schema requires ≥1
 * placement).
 * @param {import("./build-state.mjs").BuildState} state
 * @param {Object} [opts]
 * @param {Partial<import("../artifact.mjs").Metadata>} [opts.metadata]  merged over the defaults
 * @param {{name: string, rationale: string}} [opts.style]
 * @param {string} [opts.palette_id]  optional palette whitelist reference
 * @param {string} [opts.defaultBlock]  block for an occupied cell with no material yet
 * @param {string} [opts.schemaVersion]
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function toDesignArtifact(state, opts = {}) {
  const defaultBlock = opts.defaultBlock ?? COMPILE_DEFAULTS.defaultBlock;
  const cells = occupiedCells(state);
  if (cells.length === 0) {
    throw new Error("toDesignArtifact: build state has no occupied cells (artifact requires ≥1 placement)");
  }

  const placements = cells.map(({ x, y, cell }) => ({
    op: "voxel",
    pos: [x, y, cell.relief ?? 0],
    block: cell.material ?? defaultBlock,
  }));

  const manifest = [...new Set(placements.map((p) => p.block))].sort();

  const metadata = { ...COMPILE_DEFAULTS.metadata, ...(opts.metadata ?? {}) };
  const palette = opts.palette_id ? { palette_id: opts.palette_id, manifest } : { manifest };

  return {
    schema_version: opts.schemaVersion ?? COMPILE_DEFAULTS.schemaVersion,
    metadata,
    style: opts.style ?? { ...COMPILE_DEFAULTS.style },
    palette,
    placements,
  };
}
