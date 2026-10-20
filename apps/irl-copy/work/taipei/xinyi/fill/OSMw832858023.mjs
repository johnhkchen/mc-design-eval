import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858023";
const W = 19, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);

// Floor level of the building: the highest ground under it, so every
// storey sits on a level plinth and lower cells get a foundation.
const F = maxG;
const rel = (r) => F + r;

// Storey plan (relative to F):
//  0      stone plinth / ground slab
//  1-3    shopfront (ground storey)
//  4      storey line / floor slab
//  5-9    upper storey, windows 6-8
//  10     cornice
//  11     parapet / roof deck (building top ~11 above ground)
//  12-14  rooftop plant (only if it fits under H)
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const g = new Voxels([W, H, D]);

// Outward faces of a footprint cell (faces with no neighbour)
function outwardFaces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Wall material per storey level for a plain face or a pillar column
function wallBlock(r, pillar) {
  switch (r) {
    case 0: return "stone_bricks";
    case 1: case 2: case 3: return pillar ? "smooth_stone" : "tinted_glass";
    case 4: return "white_concrete";
    case 5: return "white_terracotta";
    case 6: case 7: case 8: return pillar ? "white_terracotta" : "glass";
    case 9: return "white_terracotta";
    case 10: return "smooth_stone";
    case 11: return "white_concrete";
    default: return null;
  }
}

// 1. Foundation, floor slabs and roof deck across the whole footprint
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of cellList) {
  const gr = ground.get(`${x},${z}`);
  // Solid from y 0 up to the cell's own ground, and to the floor level under the building
  for (let yy = 0; yy < Math.max(F, gr); yy++) g.set(x, yy, z, "stone");
  g.set(x, rel(0), z, "light_gray_concrete");
  g.set(x, rel(4), z, "light_gray_concrete");
  g.set(x, rel(10), z, "light_gray_concrete");
  g.set(x, rel(11), z, "gray_concrete");
}

// 2. Walls on the perimeter, with pillars at corners and every third column
const doorCandidates = [];
for (const [x, z] of cellList) {
  const faces = outwardFaces(x, z);
  if (faces.length === 0) continue;

  if (faces.length >= 2) {
    // Corner: solid pillar column the full height
    for (let r = 0; r <= 11; r++) g.set(x, rel(r), z, wallBlock(r, true));
    continue;
  }

  const face = faces[0];
  const t = face === "north" || face === "south" ? x : z;
  const pillar = t % 3 === 0;
  for (let r = 0; r <= 11; r++) g.set(x, rel(r), z, wallBlock(r, pillar));

  if (face === "south") doorCandidates.push({ x, z, t });
}

// 3. Entrance on the south (street) face, nearest the middle of the front
if (doorCandidates.length) {
  const avg = doorCandidates.reduce((s, c) => s + c.x, 0) / doorCandidates.length;
  const door = doorCandidates.reduce((best, c) =>
    Math.abs(c.x - avg) < Math.abs(best.x - avg) ? c : best
  );
  const { x, z } = door;
  g.set(x, rel(1), z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, rel(2), z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Warm hanging lantern above the door
  g.set(x, rel(3), z, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Warm light behind some upper-storey windows (glowstone inside the glass)
for (const [x, z] of cellList) {
  const faces = outwardFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const [dx, dz] = DIRS[face];
  const t = face === "north" || face === "south" ? x : z;
  if (t % 3 === 0) continue;               // pillar, not window
  if (t % 9 !== 1) continue;               // every third window
  const ix = x - dx, iz = z - dz;          // interior cell behind the glass
  if (has(ix, iz) && outwardFaces(ix, iz).length === 0) {
    g.set(ix, rel(7), iz, "glowstone");
  }
}

// 5. Rooftop plant: a central plant room with AC units around it
const interior = cellList.filter(([x, z]) => outwardFaces(x, z).length === 0);
if (interior.length) {
  const cx = Math.round(interior.reduce((s, [x]) => s + x, 0) / interior.length);
  const cz = Math.round(interior.reduce((s, [, z]) => s + z, 0) / interior.length);

  for (const [x, z] of interior) {
    const ddx = Math.abs(x - cx), ddz = Math.abs(z - cz);
    if (Math.max(ddx, ddz) > 2) continue;
    // AC units as a grid on the roof
    if (rel(12) < H && (x + z) % 4 === 0) {
      g.set(x, rel(12), z, "iron_block");
    } else if (rel(12) < H) {
      g.set(x, rel(12), z, "light_gray_concrete");
    }
    // Central plant core, taller
    if (ddx <= 1 && ddz <= 1 && rel(14) < H) {
      g.set(x, rel(13), z, "stone_bricks");
      g.set(x, rel(14), z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
