import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833520.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833520.nbt";

const W = 18, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint cells with ground level normalised so the lowest ground is y 0.
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const gmin = Math.min(...raw.map((c) => c[2]));
const foot = new Map();
for (const [x, z, gr] of raw) {
  foot.set(`${x},${z}`, Math.min(2, Math.max(0, gr - gmin)));
}

const inF = (x, z) => foot.has(`${x},${z}`);
const base = (x, z) => foot.get(`${x},${z}`);
const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
// true when the facade runs east-west (exposed on a north or south side)
const alongX = (x, z) => !inF(x, z - 1) || !inF(x, z + 1);

const pane = (x, z) => {
  const ax = alongX(x, z);
  return {
    north: ax ? "false" : "true",
    south: ax ? "false" : "true",
    east: ax ? "true" : "false",
    west: ax ? "true" : "false",
    waterlogged: "false",
  };
};

const ROOF = 10;   // roof slab level, parapet sits on top at 11
const FLOOR2 = 5;  // second storey floor line

// Foundation, storeys, roof, parapet
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const b = base(x, z);

  // foundation down to the local ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const ax = alongX(x, z);
    const col = ax ? x : z;
    const pil = col % 3 === 0;

    // base course
    g.set(x, b, z, "polished_andesite");

    // ground storey: shopfront glass, sign band, storey line
    for (let y = b + 1; y <= 4; y++) {
      const k = y - b;
      if (k === 1 || k === 2) {
        g.set(x, y, z, pil ? "smooth_quartz" : "light_blue_stained_glass_pane", pil ? undefined : pane(x, z));
      } else if (k === 3) {
        g.set(x, y, z, pil ? "smooth_quartz" : "black_concrete");
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
    }

    // second storey floor line
    g.set(x, FLOOR2, z, "light_gray_concrete");

    // second storey: window grid 6..8, spandrel at 9
    for (let y = FLOOR2 + 1; y <= 8; y++) {
      g.set(x, y, z, pil ? "smooth_quartz" : "light_blue_stained_glass_pane", pil ? undefined : pane(x, z));
    }
    g.set(x, 9, z, pil ? "smooth_quartz" : "light_gray_concrete");

    // cornice and parapet
    g.set(x, ROOF, z, "smooth_quartz");
    g.set(x, ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior: air, with floor slabs and roof deck
    g.set(x, b, z, "smooth_stone");
    g.set(x, FLOOR2, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Warm light behind some upper windows: shroomlight on the inward cell
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const col = alongX(x, z) ? x : z;
  if (col % 6 !== 1) continue;
  let ix = null, iz = null;
  if (inF(x - 1, z)) { ix = x - 1; iz = z; }
  else if (inF(x + 1, z)) { ix = x + 1; iz = z; }
  else if (inF(x, z - 1)) { ix = x; iz = z - 1; }
  else if (inF(x, z + 1)) { ix = x; iz = z + 1; }
  if (ix === null || isEdge(ix, iz)) continue;
  g.set(ix, 7, iz, "shroomlight");
}

// Rooftop plant: a few AC/mechanical boxes on interior roof cells
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x % 5 === 2 && z % 4 === 1) g.set(x, ROOF + 1, z, "iron_block");
}

// Entrance: south-facing door on the edge nearest the middle, with transom
let door = null;
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (inF(x, z + 1)) continue; // needs an exposed south face
  if (!isEdge(x, z)) continue;
  if (door === null || Math.abs(x - 9) < Math.abs(door[0] - 9)) door = [x, z];
}
if (door) {
  const [dx, dz] = door;
  const b = base(dx, dz);
  g.set(dx, b + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, b + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, b + 3, dz, "black_concrete");
}

g.save(OUT);
