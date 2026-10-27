// Way 1095572148: a two-storey brick commercial block with a stone band, a cornice and a stone coping, the kind of
// Edwardian/1920s shop-and-flat building that lines the streets of Newton and Eden Terrace. The lidar gives one flat
// roof at 9 blocks over ground at 0 for every cell, so there are no setbacks to step: the massing is one tier.
// Shell model: perimeter cells are the walls (solid from the plinth to the coping); interior cells are air except the
// floor slabs at the plinth, the storey band and the roof deck, so every window has an air gap behind its glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572148.cells.json", "utf8"));
const X = 9, Y = 22, Z = 10;
const g = new Voxels([X, Y, Z]);

const F = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => F.has(`${x},${z}`);
const roofOf = (x, z) => F.get(`${x},${z}`).roof;

// perimeter = a footprint cell with a neighbour outside the footprint
const wallSides = (x, z) => ({ e: !inF(x + 1, z), w: !inF(x - 1, z), n: !inF(x, z - 1), s: !inF(x, z + 1) });
const isWall = (x, z) => { const s = wallSides(x, z); return s.e || s.w || s.n || s.s; };
// corner = open on one horizontal and one vertical side (the convex corners and the tip)
const isCorner = (x, z) => { const s = wallSides(x, z); return (s.e || s.w) && (s.n || s.s); };

// A window cell: a plain wall cell on one face with air behind it (the inward neighbour is interior, not wall-only)
const facing = (x, z) => {
  const s = wallSides(x, z);
  if (isCorner(x, z)) return null;
  if (s.n || s.s) return { axis: "z", behind: s.s ? [x, z - 1] : [x, z + 1], open: s.s ? "s" : "n" };
  if (s.e || s.w) return { axis: "x", behind: s.e ? [x - 1, z] : [x + 1, z], open: s.e ? "e" : "w" };
  return null;
};
const windowAt = (x, z) => {
  const f = facing(x, z); if (!f) return false;
  if (!inF(...f.behind) || isWall(...f.behind)) return false;   // needs air behind the glass
  const along = f.axis === "z" ? x : z;
  return along % 2 === 1;                                       // every other cell: piers between panes
};

// Blocks to place, keyed "x,y,z"; a second pass sets the glass panes' connections from their neighbours.
const blk = new Map();
const put = (x, y, z, b, st) => { blk.set(`${x},${y},${z}`, { b, st }); };

const lightBehind = new Set();                             // window cells whose air gap holds a lamp
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (!isWall(x, z) || !windowAt(x, z)) continue;
  if ((x + z) % 3 === 0) lightBehind.add(facing(x, z).behind.join(","));
}

for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const wall = isWall(x, z);
  for (let y = 0; y < roof; y++) {
    if (!wall) {
      // interior: floor slabs at the plinth and the storey band, a tar roof deck, air between
      if (y === 0 || y === 4) put(x, y, z, "stone_bricks");
      else if (y === roof - 1) put(x, y, z, "smooth_stone");
      else if (y === 1 || y === 5) { if (lightBehind.has(`${x},${z}`)) put(x, y, z, "glowstone"); }
      continue;
    }
    if (y < ground) continue;
    if (y === 0) put(x, y, z, "polished_andesite");                       // plinth
    else if (y === 4 || y === 7 || y === 3) put(x, y, z, "stone_bricks");   // band and lintels
    else if (y === roof - 1) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });  // cornice
    else if (windowAt(x, z) && (y === 1 || y === 2 || y === 5 || y === 6)) put(x, y, z, "glass_pane");
    else put(x, y, z, "bricks");                                       // brick piers and spandrels
  }
  // coping on the rim, one course above the roof deck
  if (wall) put(x, roof, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping, not battlements
}

// The street door sits on the tip cell (2,0) in the north face: a dark oak door, two cells tall
for (const y of [1, 2]) put(2, y, 0, "dark_oak_door", { facing: "north", hinge: "left", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" });

// Roof plant: a 2x2 stair-core and cooling box on interior roof cells, standing on the roof deck
const plant = [];
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (isWall(x, z)) continue;
  if ([[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1], [x + 1, z + 1]].every(([a, b]) => inF(a, b) && !isWall(a, b))) plant.push([x, z]);
}
plant.sort((a, b) => Math.abs(a[0] - 4) + Math.abs(a[1] - 5) - (Math.abs(b[0] - 4) + Math.abs(b[1] - 5)));
if (plant.length) {
  const [px, pz] = plant[0];
  for (const [x, z] of [[px, pz], [px + 1, pz], [px, pz + 1], [px + 1, pz + 1]]) for (const y of [9, 10]) put(x, y, z, "stone_bricks");
  put(px, 11, pz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Glass pane connections: a pane joins a neighbour that is a block (not air), in the four horizontal directions
const solid = (x, y, z) => blk.has(`${x},${y},${z}`);
for (const [k, v] of blk) {
  if (v.b !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const st = {};
  for (const [name, [dx, dz]] of [["east", [1, 0]], ["west", [-1, 0]], ["north", [0, -1]], ["south", [0, 1]]]) {
    st[name] = solid(x + dx, y, z + dz) && blk.get(`${x + dx},${y},${z + dz}`).b !== "glowstone" ? "true" : "false";
  }
  v.st = { ...st, waterlogged: "false" };
}

for (const [k, { b, st }] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, st);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572148.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
