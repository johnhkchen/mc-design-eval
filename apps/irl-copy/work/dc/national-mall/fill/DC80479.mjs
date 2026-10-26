import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 770 P St NW: a 1920s-30s Washington commercial block, light limestone walls on a stone base, 3-block storeys
// (a floor band at every 3rd course), flat roofs with a stone cornice and parapet, stepped down to a lower wing
// and a light well (the courtyard is not footprint, so it stays open). Front (street) on the north face (z = 1).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80479.cells.json`, "utf8"));

const W = 29, Y = 27, D = 40;
const g = new Voxels([W, Y, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr: Math.max(0, Math.round(gr)), roof });

// ---- smooth the lidar roof over a 3x3 window, then quantise to 3-block storeys (min one storey) ----
const at = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(x + dx, z + dz)); if (o) { sum += o.roof; n++; }
  }
  const H = Math.max(3, Math.round(sum / n / 3) * 3);
  at.set(k, { g: c.gr, H });
}
const cell = (x, z) => at.get(key(x, z));

// horizontal sides of (x, y, z) that open to the outside: no footprint next door, or a neighbour that stops below y
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.H <= y; });

// ---- materials ----
const BASE = "stone_bricks", PIER = "calcite", BAND = "polished_diorite", GLASS = "light_blue_stained_glass";
const FLOOR = "smooth_stone", ROOF = "stone", CORNICE = "smooth_stone", PARAPET = "smooth_stone";

const pass = [];
// ---- shell and floors ----
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.H; y++) {
    if (y < c.g) { g.set(x, y, z, BASE); continue; }
    const ex = exposed(x, y, z);
    if (!ex.length) {
      // interior: a floor slab each storey and a roof cap on top; air between (no interiors)
      if (y === c.H - 1) g.set(x, y, z, ROOF);
      else if (y % 3 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    const top = y === c.H - 1;
    const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
    const along = ex[0][0] ? z : x;   // position along the face this cell stands on
    if (y === 0) { g.set(x, y, z, BASE); continue; }
    if (top) { g.set(x, y, z, CORNICE); continue; }
    if (y % 3 === 0) { g.set(x, y, z, BAND); continue; }
    if (corner || along % 3 === 0) { g.set(x, y, z, PIER); continue; }
    pass.push([x, y, z, ex]);
    g.set(x, y, z, GLASS);
  }
  // roof parapet on the outside top edge
  if (cell(x, z) && c) {
    const ex = exposed(x, c.H - 1, z);
    if (ex.length && c.H < Y) g.set(x, c.H, z, PARAPET);
  }
}

// ---- entrance on the street face (north, z = 1): door at x = 19, shopfront glass either side ----
const DOOR_X = 19, DOOR_Z = 1;
const doorCell = cell(DOOR_X, DOOR_Z);
if (doorCell) {
  g.set(DOOR_X, 0, DOOR_Z, FLOOR);          // threshold
  g.set(DOOR_X, 1, DOOR_Z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(DOOR_X, 2, DOOR_Z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // a flat hood over the door, on the band line above
  for (const dx of [-1, 0, 1]) g.set(DOOR_X + dx, 2, DOOR_Z, "stone_brick_slab", { type: "bottom" });
}

// ---- warm lights: glowstone behind some glazed bays (the air gap behind the glass) ----
for (const [x, y, z, ex] of pass) {
  if (ex.length !== 1 || y % 3 === 0 || y === 0) continue;
  if ((x * 7 + y * 3 + z * 5) % 11 !== 0) continue;
  const [dx, dz] = ex[0];
  const ix = x - dx, iz = z - dz;
  const ic = cell(ix, iz);
  if (!ic || ic.H <= y || exposed(ix, y, iz).length) continue;
  g.set(ix, y, iz, "glowstone");
}

// ---- roof equipment on the tall block: two AC boxes, sitting on the roof cap ----
for (const [x, z] of [[18, 8], [19, 8], [20, 8]]) {
  const c = cell(x, z); if (!c || c.H !== 15) continue;
  if (exposed(x, 14, z).length) continue;
  g.set(x, 15, z, "stone_bricks"); g.set(x, 16, z, "stone_brick_slab", { type: "bottom" });
}

const stats = g.save(`${DIR}/DC80479.nbt`);
console.log(JSON.stringify(stats));
