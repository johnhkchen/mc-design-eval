// SPDX-License-Identifier: AGPL-3.0-or-later
// Helpers from plan.md VOCABULARY (part P1/P2/P4/P5/P6 pieces): brickBlock, doubleDoor, handrail, stack, arcadeBay,
// grilleWindow, shrub. Every helper takes its own position (and facing) and writes only its own footprint.
// Returns { placed, refused } as h1 does, but all-or-nothing: if any cell of the footprint is out of bounds or not air
// (`{ over: true }` writes over non-air cells too), nothing is written, placed is 0 and refused lists the blocking cells.
// Throws only on bad arguments. Block ids and states are the plan's PALETTE, checked for 1.21.1.
import { B, DIRS, OPPOSITE, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const key = (x, y, z) => `${x},${y},${z}`;

/** Write [x, y, z, block, state] cells all-or-nothing. */
function place(g, cells, over = false) {
  const refused = cells
    .filter(([x, y, z]) => !g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z)))
    .map(([x, y, z]) => [x, y, z]);
  if (refused.length) return { placed: 0, refused };
  for (const [x, y, z, block, state] of cells) g.set(x, y, z, block, state);
  return { placed: cells.length, refused: [] };
}

/** Pane/bar connections: the listed horizontal directions are "true", the rest "false". */
function connect(open) {
  const s = { north: "false", east: "false", south: "false", west: "false" };
  for (const f of open) s[f] = "true";
  return s;
}

/**
 * A hollow brick shell: the ring of the box x0..x1, z0..z1 from y 1 up to the top course `y1` (9 or 4 in plan.md; the
 * spec's option key, so it is the TOP course, not the water table). y 1 is the polished_andesite water table, the rest
 * bricks. The floor bands at y 4 and 7 are the wall material, so they fall out of the ring. The interior is not touched.
 * `holes`: [x, y, z] cells the OPENINGS table leaves air (windows, doors, transoms); they are skipped, so a door or
 * window placed afterwards finds air there.
 */
export function brickBlock(g, x0, z0, x1, z1, { y1: top = 9, holes = [], over = false } = {}) {
  const [xa, xb] = [Math.min(x0, x1), Math.max(x0, x1)];
  const [za, zb] = [Math.min(z0, z1), Math.max(z0, z1)];
  const skip = new Set(holes.map(([x, y, z]) => key(x, y, z)));
  const cells = [];
  for (let y = 1; y <= top; y++)
    for (let x = xa; x <= xb; x++)
      for (let z = za; z <= zb; z++) {
        if (x !== xa && x !== xb && z !== za && z !== zb) continue;
        if (skip.has(key(x, y, z))) continue;
        cells.push([x, y, z, y === 1 ? "polished_andesite" : "bricks"]);
      }
  return place(g, cells, over);
}

/**
 * A pair of doors in one opening. The leaves are at (x, z) and one cell further along the wall (+x for a north or
 * south facing, +z for east or west): lower and upper halves at y 1..2, a glass_pane transom at y 3 in both cells.
 * `facing` is the way the doors face OUT (the outward normal, as a vanilla door placed from outside). Seen from
 * outside, the left leaf gets hinge "left" and the right leaf "right", so each swings from its outer edge.
 */
export function doubleDoor(g, x, z, facing, wood = "spruce", { over = false } = {}) {
  if (!DIRS[facing]) throw new Error(`doubleDoor: facing must be north, south, east or west, got ${facing}`);
  const pair = facing === "north" || facing === "south" ? [1, 0, 0] : [0, 0, 1];
  const left = DIRS[face.ccw(OPPOSITE[facing])];          // left hand of someone outside, looking in
  const leftIsFirst = left[0] * pair[0] + left[2] * pair[2] < 0;
  const hingeA = leftIsFirst ? "left" : "right";
  const hingeB = leftIsFirst ? "right" : "left";
  const transom = pair[0]
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const cells = [];
  for (const [lx, lz, hinge] of [[x, z, hingeA], [x + pair[0], z + pair[2], hingeB]]) {
    cells.push([lx, 1, lz, ...B.door(wood, facing, "lower", hinge)]);
    cells.push([lx, 2, lz, ...B.door(wood, facing, "upper", hinge)]);
    cells.push([lx, 3, lz, "glass_pane", transom]);
  }
  return place(g, cells, over);
}

/**
 * A black handrail run at column x from z0 to z1 (inclusive): polished_blackstone_wall two high (y 0..1), joined
 * along z to its neighbours in the run. Posts stand on the lawn at y 0; nothing is written under them.
 */
export function handrail(g, x, z0, z1, { over = false } = {}) {
  const [za, zb] = [Math.min(z0, z1), Math.max(z0, z1)];
  const cells = [];
  for (let z = za; z <= zb; z++)
    for (let y = 0; y <= 1; y++) {
      const state = {
        up: "true",
        north: z > za ? "low" : "none",
        south: z < zb ? "low" : "none",
        east: "none",
        west: "none",
      };
      cells.push([x, y, z, "polished_blackstone_wall", state]);
    }
  return place(g, cells, over);
}

/**
 * A cold brick stack, 2 x 2 at x..x+1, z..z+1, rising y 10..13: bricks at y 10..11, a stone_bricks band at y 12, and a
 * bottom brick_slab cap in y 13 (it sits on the band, so it is supported). Solid: no fire, no flue.
 */
export function stack(g, x, z, { over = false } = {}) {
  const cells = [];
  for (let dx = 0; dx <= 1; dx++)
    for (let dz = 0; dz <= 1; dz++) {
      cells.push([x + dx, 10, z + dz, "bricks"]);
      cells.push([x + dx, 11, z + dz, "bricks"]);
      cells.push([x + dx, 12, z + dz, "stone_bricks"]);
      cells.push([x + dx, 13, z + dz, ...B.slab("brick", "bottom")]);
    }
  return place(g, cells, over);
}

/**
 * One arcade bay in the wall plane z: white_concrete piers at xPier0 and xPier1 (y 1..3), a white_concrete beam at y 4
 * from pier to pier, and an arch of upside-down smooth_quartz_stairs at y 3 in the cells between. The first gap cell
 * faces the west pier and the last faces the east pier (the stairs' back springs from the pier). A one-cell gap gets a
 * flat white_concrete head; any middle cell of a wider gap gets one too. The openings at y 1..2 are left air.
 */
export function arcadeBay(g, xPier0, xPier1, z, { over = false } = {}) {
  if (xPier1 <= xPier0 + 1) throw new Error(`arcadeBay: piers ${xPier0} and ${xPier1} need at least one cell between them`);
  const cells = [];
  for (const px of [xPier0, xPier1]) for (let y = 1; y <= 3; y++) cells.push([px, y, z, "white_concrete"]);
  for (let x = xPier0; x <= xPier1; x++) cells.push([x, 4, z, "white_concrete"]);
  const width = xPier1 - xPier0 - 1;
  for (let i = 0; i < width; i++) {
    const x = xPier0 + 1 + i;
    if (width >= 2 && i === 0) cells.push([x, 3, z, ...B.stairs("smooth_quartz", "west", "top")]);
    else if (width >= 2 && i === width - 1) cells.push([x, 3, z, ...B.stairs("smooth_quartz", "east", "top")]);
    else cells.push([x, 3, z, "white_concrete"]);
  }
  return place(g, cells, over);
}

/**
 * A deep-set window with an iron grille, 1 wide x 2 tall at x, y..y+1: iron_bars in the outer cell (x, z) and a
 * gray_stained_glass_pane one cell further in. `depth` is the direction INTO the building from the outer cell
 * ("north", "south", "east" or "west"). Connections face the wall line, so the grille reads as set into it.
 */
export function grilleWindow(g, x, y, z, depth, { over = false } = {}) {
  if (!DIRS[depth]) throw new Error(`grilleWindow: depth must be north, south, east or west, got ${depth}`);
  const [ix, iz] = [x + DIRS[depth][0], z + DIRS[depth][2]];
  const along = [face.cw(depth), face.ccw(depth)];        // the two directions along the wall
  const bars = connect([...along, depth]);                 // bars join the walls and the pane inside them
  const pane = connect([...along, OPPOSITE[depth]]);       // the pane joins the bars outside it and the walls
  const cells = [];
  for (const yy of [y, y + 1]) {
    cells.push([x, yy, z, "iron_bars", bars]);
    cells.push([ix, yy, iz, "gray_stained_glass_pane", pane]);
  }
  return place(g, cells, over);
}

/**
 * A shrub on the lawn, 2 x 2 at x..x+1, z..z+1: an azalea/oak mix of persistent leaves at y 0, with one oak leaf
 * above the north-west cell at y 1. Nothing is written at y 0 outside the leaves; the ground is not touched.
 */
export function shrub(g, x, z, { over = false } = {}) {
  const leaf = (block) => [block, { persistent: "true", distance: "1", waterlogged: "false" }];
  const cells = [
    [x, 0, z, ...leaf("azalea_leaves")],
    [x + 1, 0, z, ...leaf("oak_leaves")],
    [x, 0, z + 1, ...leaf("oak_leaves")],
    [x + 1, 0, z + 1, ...leaf("azalea_leaves")],
    [x, 1, z, ...leaf("oak_leaves")],
  ];
  return place(g, cells, over);
}
