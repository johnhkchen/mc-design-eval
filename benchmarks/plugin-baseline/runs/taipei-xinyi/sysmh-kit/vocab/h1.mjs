// Vocabulary helpers, part 1 (plan.md VOCABULARY): podium, column, roof_cell, corner_flick, glass_wall, chandelier,
// roof_light, topiary_cone. Coordinates are plot-local, y 0 = ground course.
//
// Every helper takes its position as arguments and writes only inside its own footprint, into air only: a cell that
// already holds a block is refused and listed, never overwritten. roof_light is the one exception (it replaces the
// roof tile it sits on). A position outside the helper's own footprint throws, since that is a caller error.
// Each helper returns { placed, refused }, where refused is a list of [x, y, z, block].
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROOF = { x0: 10, x1: 141, z0: 10, z1: 141 };
// Surface y for d = 0..21 (distance in from the nearest eave edge); d 22..29 is d + 11; d >= 30 is the top deck (41).
const SURF_NEAR_EDGE = [24, 24, 24, 25, 25, 25, 26, 26, 26, 27, 27, 27, 28, 28, 29, 29, 30, 30, 31, 31, 32, 32];
const TRANSOMS = [9, 15, 21, 27, 33];
const CORNERS = {
  nw: { x: 10, z: 10, dx: 1, dz: 1, facing: "north" },
  ne: { x: 141, z: 10, dx: -1, dz: 1, facing: "north" },
  sw: { x: 10, z: 141, dx: 1, dz: -1, facing: "south" },
  se: { x: 141, z: 141, dx: -1, dz: -1, facing: "south" },
};

function newResult() {
  return { placed: 0, refused: [] };
}

// Write one block into a cell that holds air (or one of `over`, given as bare ids). Anything else is refused.
function put(g, out, [x, y, z], block, state, over = []) {
  if (!g.inBounds(x, y, z)) { out.refused.push([x, y, z, block]); return; }
  const here = g.blockAt(x, y, z).replace(/^minecraft:/, "");
  if (!g.isAir(x, y, z) && !over.includes(here)) { out.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state);
  out.placed++;
}

function surfaceY(d) {
  if (d < SURF_NEAR_EDGE.length) return SURF_NEAR_EDGE[d];
  if (d < 30) return d + 11;
  return 41;
}

// Podium: a stone plinth over the box x0..x1, z0..z1, y 0..2. The y 0 course is stone_bricks, y 1 and the deck y 2
// polished_andesite, with a smooth_stone_slab (top) coping on the outer ring at y 2.
// groundOver: the y 0 course may replace the park ground under it (grass, dirt, coarse dirt, path). Off by default:
// the ground is an earlier part's cells and is refused.
export function podium(g, x0, z0, x1, z1, { groundOver = false } = {}) {
  if (x1 < x0 || z1 < z0) throw new RangeError(`podium: empty box ${x0},${z0}..${x1},${z1}`);
  const out = newResult();
  const ground = groundOver ? ["grass_block", "dirt", "coarse_dirt", "dirt_path"] : [];
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const ring = x === x0 || x === x1 || z === z0 || z === z1;
      put(g, out, [x, 0, z], "stone_bricks", undefined, ground);
      put(g, out, [x, 1, z], "polished_andesite");
      if (ring) put(g, out, [x, 2, z], ...B.slab("smooth_stone", "top"));
      else put(g, out, [x, 2, z], "polished_andesite");
    }
  }
  return out;
}

// Column: 3x3 centred on (cx, cz), y 3..top. Base polished_andesite at y 3, quartz_pillar shaft (axis y) to top-1,
// smooth_stone capital at y top. Short columns top at 19; the six portal columns use top = 36.
export function column(g, cx, cz, top = 19) {
  if (top < 4) throw new RangeError(`column: top ${top} is below the base at y 3`);
  const out = newResult();
  for (let x = cx - 1; x <= cx + 1; x++) {
    for (let z = cz - 1; z <= cz + 1; z++) {
      put(g, out, [x, 3, z], "polished_andesite");
      for (let y = 4; y < top; y++) put(g, out, [x, y, z], ...B.pillar("quartz_pillar", "y"));
      put(g, out, [x, top, z], "smooth_stone");
    }
  }
  return out;
}

// Roof cell at (x, z) of the great concave hip roof (x and z 10..141). The surface y comes from the d-table, and the
// column is filled from it down to one below the previous ring's surface, so the roof is a closed shell.
// Soffit (y <= 24, d <= 5) and the d = 0 fascia are smooth_stone; the tile is yellow_terracotta on every third band of
// three rings, else yellow_concrete. The d = 30 ring gets a smooth_stone rim at y 42, gold_block at its four corners.
export function roof_cell(g, x, z) {
  if (x < ROOF.x0 || x > ROOF.x1 || z < ROOF.z0 || z > ROOF.z1) {
    throw new RangeError(`roof_cell: ${x},${z} is outside the roof ${ROOF.x0}..${ROOF.x1}`);
  }
  const out = newResult();
  const d = Math.min(x - ROOF.x0, ROOF.x1 - x, z - ROOF.z0, ROOF.z1 - z);
  const top = surfaceY(d);
  const prev = d === 0 ? 24 : surfaceY(d - 1);
  const tile = Math.floor(d / 3) % 3 === 0 ? "yellow_terracotta" : "yellow_concrete";
  for (let y = prev - 1; y <= top; y++) {
    const soffit = d <= 5 && y <= 24;
    put(g, out, [x, y, z], soffit ? "smooth_stone" : tile);
  }
  if (d === 30) {
    const corner = (x === 40 || x === 111) && (z === 40 || z === 111);
    put(g, out, [x, 42, z], corner ? "gold_block" : "smooth_stone");
  }
  return out;
}

// Corner flick: the curl over one outer corner of the roof (corner = "nw" | "ne" | "sw" | "se"). Four diagonal cells in
// from the corner: stone_stairs rising from y 28 to y 30 toward the tip, then a gold_block tip at y 31 on the corner
// cell. Stairs face toward the corner's end of the building (north for the north corners, south for the south ones).
export function corner_flick(g, corner) {
  const c = CORNERS[corner];
  if (!c) throw new RangeError(`corner_flick: unknown corner "${corner}" (use nw, ne, sw or se)`);
  const out = newResult();
  for (let k = 0; k < 4; k++) {
    const x = c.x + k * c.dx;
    const z = c.z + k * c.dz;
    if (k === 0) put(g, out, [x, 31, z], "gold_block");
    else put(g, out, [x, 31 - k, z], ...B.stairs("stone", c.facing, "bottom"));
  }
  return out;
}

// Glass wall: a glass_pane wall on plane z over x0..x1, y0..y1. polished_deepslate mullions at x0, every third column
// after it, and at x1; deepslate transoms at y 9, 15, 21, 27, 33 (where in y0..y1). doors: [[xa, xb], ...] spans left
// open as air for y0..y0+2 (the four door pairs use y 3..5). Panes connect to their in-wall neighbours.
export function glass_wall(g, x0, x1, z, y0, y1, doors = []) {
  if (x1 < x0 || y1 < y0) throw new RangeError(`glass_wall: empty box x ${x0}..${x1}, y ${y0}..${y1}`);
  const out = newResult();
  const inDoor = (x, y) => doors.some(([a, b]) => x >= a && x <= b && y >= y0 && y <= y0 + 2);
  const inWall = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && !inDoor(x, y);
  const mullion = (x) => x === x1 || (x - x0) % 3 === 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (inDoor(x, y)) continue;
      if (mullion(x) || TRANSOMS.includes(y)) {
        put(g, out, [x, y, z], "polished_deepslate");
      } else {
        const state = { north: "false", south: "false", east: String(inWall(x + 1, y)), west: String(inWall(x - 1, y)) };
        put(g, out, [x, y, z], "glass_pane", state);
      }
    }
  }
  return out;
}

// Chandelier at (x, z) in a lit room, hung at `top` (default 36): a chain (axis y) from top down
// to top-6 with a hanging lantern at top-7, a quartz_slab ring (bottom) at top-9 around the open centre, and four
// hanging lanterns under the ring's corners at top-10. The lantern hangs from the chain above it, and the lanterns
// hang from the slab above them.
export function chandelier(g, x, z, top = 36) {
  if (top - 10 < 4) throw new RangeError(`chandelier: top ${top} hangs below the floor at y 3`);
  const out = newResult();
  for (let y = top - 6; y <= top; y++) put(g, out, [x, y, z], "chain", { axis: "y" });
  put(g, out, [x, top - 7, z], "lantern", { hanging: "true", waterlogged: "false" });
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      put(g, out, [x + dx, top - 9, z + dz], ...B.slab("quartz", "bottom"));
      if (dx !== 0 && dz !== 0) put(g, out, [x + dx, top - 10, z + dz], "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
  return out;
}

// Roof light at (x, z): replaces the topmost yellow roof tile in that column with ochre_froglight, so the light sits
// set into the surface (also where corner lift moves it). Refused if the column holds no roof tile.
export function roof_light(g, x, z) {
  if (x < ROOF.x0 || x > ROOF.x1 || z < ROOF.z0 || z > ROOF.z1) {
    throw new RangeError(`roof_light: ${x},${z} is outside the roof ${ROOF.x0}..${ROOF.x1}`);
  }
  const out = newResult();
  for (let y = 42; y >= 23; y--) {
    const here = g.blockAt(x, y, z).replace(/^minecraft:/, "");
    if (here === "yellow_concrete" || here === "yellow_terracotta") {
      put(g, out, [x, y, z], "ochre_froglight", { axis: "y" }, ["yellow_concrete", "yellow_terracotta"]);
      return out;
    }
  }
  out.refused.push([x, null, z, "ochre_froglight: no roof tile in this column"]);
  return out;
}

// Topiary cone centred on (x, z), standing on the ground course: a 3x3 base at y 1 tapering over four more layers to
// a single leaf at y 5. Leaves are persistent so they never decay.
export function topiary_cone(g, x, z) {
  const out = newResult();
  const full = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const plus = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]];
  const layers = [full, plus, [[0, 0]], [[0, 0]], [[0, 0]]];
  layers.forEach((cells, i) => {
    for (const [dx, dz] of cells) put(g, out, [x + dx, 1 + i, z + dz], "spruce_leaves", { persistent: "true" });
  });
  return out;
}
