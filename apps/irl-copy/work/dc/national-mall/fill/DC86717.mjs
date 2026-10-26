// 1600 Rhode Island Ave NW: a 1920s brick hotel with stone trim, four storeys on a flat ground, a 14-block core on the
// west half (lidar roofs 13-14), 13 across the middle, 11-block wings on the east, and a 12-block entrance bay on the z=0
// (north) front. Hollow: a 1-block brick envelope with windows, floor slabs at each storey line, air between.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86717.cells.json", "utf8"));
const W = 12, D = 17;
const g = new Voxels([12, 26, 17]);

// footprint: ground under each cell and its roof, smoothed to clean tiers by a 3x3 mode (the cell's own value counts double)
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { ground, roof });
const roofMode = (x, z) => {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = raw.get(key(x + dx, z + dz)); if (!c) continue;
    const w = dx === 0 && dz === 0 ? 2 : 1;
    n.set(c.roof, (n.get(c.roof) || 0) + w);
  }
  let best = null, bn = -1;
  for (const [r, k] of n) if (k > bn || (k === bn && r > best)) { best = r; bn = k; }
  return best;
};
const cell = new Map();   // key -> { ground, top }
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  cell.set(k, { ground: c.ground, top: roofMode(x, z) });
}
const topOf = (x, z) => cell.get(key(x, z))?.top ?? -1;   // -1 = outside the footprint

// storey lines: slab at each (floor), window rows between, bands (sill/lintel) on the lines
const SLABS = [0, 4, 7, 10, 13];
const BANDS = new Set([0, 3, 4, 7, 10, 13]);             // 0 = plinth, 3 = shopfront lintel
const WINDOW_ROWS = new Set([1, 2, 5, 6, 8, 9, 11, 12]);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // outward: north (z-), south (z+), west (x-), east (x+)

// faces of a column at height y that look outside: no footprint cell beside it, or the neighbour's top is below y
const outFaces = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const t = topOf(x + dx, z + dz);
  return t < 0 || t <= y;
});

const DOOR_X = 5;
function facadeBlock(x, z, y, [dx, dz]) {
  const along = dz !== 0 ? x : z, last = dz !== 0 ? W - 1 : D - 1;
  const ground = y < 4;
  if (y === 0) return { block: "stone_bricks" };
  if (BANDS.has(y)) return { block: "smooth_stone" };
  if (ground && z === 0 && x === DOOR_X && (y === 1 || y === 2)) {
    return { block: "dark_oak_door", state: { facing: "north", hinge: "left", half: y === 1 ? "lower" : "upper", open: "false", powered: "false" } };
  }
  // the entrance bay (x 4..7 on the north front) gets stone jambs either side of the door
  if (ground && z === 0 && (x === DOOR_X - 1 || x === DOOR_X + 1)) return { block: "stone_bricks" };
  const pier = ground ? (along % 4 === 0 || along === last) : (along % 3 === 0 || along === last);
  if (pier) return { block: "bricks" };
  return { block: "glass_pane", state: { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } };
}

// the envelope and the floors, cell by cell
const glassCells = [];        // [x, y, z, outward normal] of each window, for the lights behind the glass
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const T = c.top;
  for (let y = 0; y < T; y++) {
    const faces = outFaces(x, z, y);
    if (y === T - 1) {                                     // roof membrane / cornice on the top
      g.set(x, y, z, faces.length ? "stone_bricks" : "stone");
      continue;
    }
    if (faces.length) {
      const f = facadeBlock(x, z, y, faces[0]);
      g.set(x, y, z, f.block, f.state);
      if (f.block === "glass_pane") glassCells.push([x, y, z, faces[0]]);
    } else if (SLABS.includes(y)) {
      g.set(x, y, z, "oak_planks");                         // interior floor slab
    }
  }
  // parapet on the perimeter, a slab stepping up from each roof edge
  if (outFaces(x, z, T).length) g.set(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// entrance: lantern under the lintel inside the bay, and the bay's crest
g.set(DOOR_X, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = 4; x <= 7; x++) if (topOf(x, 0) === 12) g.set(x, 12, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// roof plant: a penthouse on the 14-block core (x 1..3, z 7..9), solid brick with a glass band and a slab cap
for (let z = 7; z <= 9; z++) for (let x = 1; x <= 3; x++) {
  g.set(x, 14, z, "bricks");
  const edge = x === 1 || x === 3 || z === 7 || z === 9;
  g.set(x, 15, z, edge ? "glass_pane" : "bricks", edge ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
  g.set(x, 16, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light: glowstone and shroomlight in the air gap behind some windows (never in a wall cell)
for (const [x, y, z, [dx, dz]] of glassCells) {
  if (!WINDOW_ROWS.has(y)) continue;
  const ix = x - dx, iz = z - dz;
  if (topOf(ix, iz) <= y || g.get(ix, y, iz)) continue;
  if ((x * 7 + z * 3 + y) % 9 === 0) g.set(ix, y, iz, "glowstone");
}

// glass panes connect to any solid neighbour, so a run of windows reads as one band
const solid = (x, y, z) => { const b = g.get(x, y, z); return b && b.block !== "minecraft:air"; };
for (const [x, y, z] of glassCells) {
  const conn = (dx, dz) => (solid(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: conn(0, -1), south: conn(0, 1), west: conn(-1, 0), east: conn(1, 0), waterlogged: "false" });
}
// the penthouse glass joins the same way
for (let z = 7; z <= 9; z++) for (let x = 1; x <= 3; x++) {
  const edge = x === 1 || x === 3 || z === 7 || z === 9;
  if (!edge) continue;
  const conn = (dx, dz) => (solid(x + dx, 15, z + dz) ? "true" : "false");
  g.set(x, 15, z, "glass_pane", { north: conn(0, -1), south: conn(0, 1), west: conn(-1, 0), east: conn(1, 0), waterlogged: "false" });
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86717.nbt");
console.log(`DC86717.nbt: ${res.blocks} blocks, ${res.palette} palette entries`);
