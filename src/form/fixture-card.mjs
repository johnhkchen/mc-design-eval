// Fixture test-card (T-097-01, story S-097, epic E-26) — the PROVEN state vocabulary.
//
// No generator has ever emitted a non-cube block (repo-wide grep at ticket time: zero trapdoor/fence
// usage), so the artifact→render fixture path was unproven and the kit could not ship dressed
// openings. This module is the proof artifact: one placement per (block, state) row the kit grammar
// (S-099) will use — trapdoor shutters at all four facings, fence infill with EXPLICIT connection
// booleans (the in-memory world has no neighbor updates: an unstated fence renders as a lone post),
// stairs, slabs, and the door/lantern fixtures the live kits already recognized (cottage:
// spruce_trapdoor/spruce_door/lantern; gatehouse: stone_brick_stairs).
//
// CARD_ROWS is the single source of the vocabulary: the grammar imports it rather than restating
// states, and the regression runner (benchmarks/sculpture/fixture-card.mjs) verifies every row
// end-to-end (AJV gate → world build with empty `unmapped` → state-id read-back → render reference).
//
// State values are STRINGS throughout ("true"/"false" for booleans) — the schema's blockState form,
// which render/src/version.mjs valueIndex accepts verbatim.
//
// PURE — no GL, no I/O, no model, no Date/random — runs under the `src/**/*.test.mjs` glob.
// Does NOT validate its own output: callers run assertArtifact (the round-trip pattern).

import { PHASE1_MODEL_ID } from "../config.mjs";

/** Schema tag the runner stamps on the committed verification record. */
export const CARD_SCHEMA = "fixture-card/v1";

/** Baseplate block — a full cube present in the E-10 block→Lab table (asserted in tests), so the
 *  card's occupancy classifies it `cube` and only the fixture rows land in the third class. */
export const CARD_BASEPLATE_BLOCK = "smooth_stone";

/** Grid pitch between fixtures: each sits visually isolated at all four gate azimuths. */
export const CARD_PITCH = 3;

/**
 * The closed row vocabulary: every fixture type the kit grammar will place, at every orientation /
 * state it will use. `state: null` = place in default state (a lone fence post). Door rows pair a
 * `lower` and `upper` half sharing one column (`pairUp` marks the upper row, laid out at y+1 over
 * the previous row's cell).
 * @type {readonly {id:string, family:string, block:string, state:Record<string,string>|null, pairUp?:boolean}[]}
 */
export const CARD_ROWS = Object.freeze([
  // trapdoor shutters — the open pose against each wall facing, plus both closed halves
  { id: "trapdoor-north-open", family: "trapdoor", block: "spruce_trapdoor", state: { facing: "north", half: "bottom", open: "true" } },
  { id: "trapdoor-south-open", family: "trapdoor", block: "spruce_trapdoor", state: { facing: "south", half: "bottom", open: "true" } },
  { id: "trapdoor-west-open", family: "trapdoor", block: "spruce_trapdoor", state: { facing: "west", half: "bottom", open: "true" } },
  { id: "trapdoor-east-open", family: "trapdoor", block: "spruce_trapdoor", state: { facing: "east", half: "bottom", open: "true" } },
  { id: "trapdoor-closed-bottom", family: "trapdoor", block: "spruce_trapdoor", state: { facing: "north", half: "bottom", open: "false" } },
  { id: "trapdoor-closed-top", family: "trapdoor", block: "spruce_trapdoor", state: { facing: "north", half: "top", open: "false" } },
  // fence infill — connections are explicit state (no neighbor updates in the in-memory world)
  { id: "fence-post", family: "fence", block: "oak_fence", state: null },
  { id: "fence-ew", family: "fence", block: "oak_fence", state: { east: "true", west: "true" } },
  { id: "fence-ns", family: "fence", block: "oak_fence", state: { north: "true", south: "true" } },
  { id: "fence-corner-ne", family: "fence", block: "oak_fence", state: { north: "true", east: "true" } },
  { id: "fence-tee-new", family: "fence", block: "oak_fence", state: { north: "true", east: "true", west: "true" } },
  // stairs — all four facings at half=bottom, plus the inverted (half=top) pose
  { id: "stairs-north", family: "stairs", block: "stone_brick_stairs", state: { facing: "north", half: "bottom", shape: "straight" } },
  { id: "stairs-south", family: "stairs", block: "stone_brick_stairs", state: { facing: "south", half: "bottom", shape: "straight" } },
  { id: "stairs-west", family: "stairs", block: "stone_brick_stairs", state: { facing: "west", half: "bottom", shape: "straight" } },
  { id: "stairs-east", family: "stairs", block: "stone_brick_stairs", state: { facing: "east", half: "bottom", shape: "straight" } },
  { id: "stairs-east-top", family: "stairs", block: "stone_brick_stairs", state: { facing: "east", half: "top", shape: "straight" } },
  // slab — all three types (double is the full-cube degenerate, kept to pin the whole enum)
  { id: "slab-bottom", family: "slab", block: "oak_slab", state: { type: "bottom" } },
  { id: "slab-top", family: "slab", block: "oak_slab", state: { type: "top" } },
  { id: "slab-double", family: "slab", block: "oak_slab", state: { type: "double" } },
  // door — a closed pair and an open pair (upper half rides at y+1 over the lower's cell)
  { id: "door-closed-lower", family: "door", block: "spruce_door", state: { facing: "east", half: "lower", hinge: "left", open: "false" } },
  { id: "door-closed-upper", family: "door", block: "spruce_door", state: { facing: "east", half: "upper", hinge: "left", open: "false" }, pairUp: true },
  { id: "door-open-lower", family: "door", block: "spruce_door", state: { facing: "east", half: "lower", hinge: "left", open: "true" } },
  { id: "door-open-upper", family: "door", block: "spruce_door", state: { facing: "east", half: "upper", hinge: "left", open: "true" }, pairUp: true },
  // lantern — standing and hanging (no support physics in the in-memory world; renders fine)
  { id: "lantern-standing", family: "lantern", block: "lantern", state: { hanging: "false" } },
  { id: "lantern-hanging", family: "lantern", block: "lantern", state: { hanging: "true" } },
]);

/** Namespace a bare id for placement (the schema's blockId pattern requires a namespace). */
function namespaced(id) {
  return id.includes(":") ? id : `minecraft:${id}`;
}

/**
 * Pure deterministic layout: one z-line per family (in first-appearance order), CARD_PITCH apart;
 * within a family, rows advance x by CARD_PITCH — except a `pairUp` row, which stacks at y+1 over
 * the PREVIOUS row's cell (the door's upper half). Fixtures sit at y=1 on a y=0 baseplate that
 * extends one cell beyond the grid on every side.
 * @param {typeof CARD_ROWS} [rows]
 * @returns {{cells:{id:string, family:string, pos:[number,number,number], block:string,
 *            state:Record<string,string>|null}[], baseplate:{from:[number,number,number],
 *            to:[number,number,number], block:string}}}
 */
export function cardLayout(rows = CARD_ROWS) {
  const familyZ = new Map();
  const nextX = new Map();
  const cells = [];
  let prev = null;
  for (const row of rows) {
    if (!familyZ.has(row.family)) {
      familyZ.set(row.family, familyZ.size * CARD_PITCH);
      nextX.set(row.family, 0);
    }
    let pos;
    if (row.pairUp) {
      if (!prev || prev.family !== row.family) {
        throw new Error(`cardLayout: pairUp row "${row.id}" has no preceding row in family "${row.family}"`);
      }
      pos = [prev.pos[0], prev.pos[1] + 1, prev.pos[2]];
    } else {
      const x = nextX.get(row.family);
      nextX.set(row.family, x + CARD_PITCH);
      pos = [x, 1, familyZ.get(row.family)];
    }
    const cell = { id: row.id, family: row.family, pos, block: row.block, state: row.state };
    cells.push(cell);
    prev = cell;
  }
  let maxX = 0;
  let maxZ = 0;
  for (const c of cells) {
    if (c.pos[0] > maxX) maxX = c.pos[0];
    if (c.pos[2] > maxZ) maxZ = c.pos[2];
  }
  return {
    cells,
    baseplate: { from: [-1, 0, -1], to: [maxX + 1, 0, maxZ + 1], block: CARD_BASEPLATE_BLOCK },
  };
}

/**
 * Assemble the full, schema-valid fixture test-card artifact: the baseplate fill plus one
 * `{op:"voxel"}` per row, in CARD_ROWS order. Deterministic — the same rows always produce a
 * byte-identical artifact (the committed card.json is reproducible). Callers run assertArtifact.
 * @param {{rows?: typeof CARD_ROWS}} [opts]
 * @returns {object} a design artifact (not yet validated, not frozen)
 */
export function fixtureCard(opts = {}) {
  const { cells, baseplate } = cardLayout(opts.rows ?? CARD_ROWS);
  const placements = [
    { op: "fill", from: baseplate.from, to: baseplate.to, block: namespaced(baseplate.block) },
    ...cells.map((c) =>
      c.state === null
        ? { op: "voxel", pos: c.pos, block: namespaced(c.block) }
        : { op: "voxel", pos: c.pos, block: namespaced(c.block), state: { ...c.state } }
    ),
  ];
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  return {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "fixture-card",
      prompting_method_id: "procedural/fixture-card@1",
      model_id: PHASE1_MODEL_ID,
      seed: 0,
      server_state_id: "in-memory",
    },
    style: {
      name: "test-card",
      rationale:
        "Not a design: the S-097 fixture regression card — every kit fixture state at a known cell, rendered and verified.",
    },
    palette: { manifest },
    placements,
  };
}
