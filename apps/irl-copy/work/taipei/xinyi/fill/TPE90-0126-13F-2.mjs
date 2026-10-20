import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0126-13F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 21 x 52 footprint, 13 storeys of 5 blocks (roof slab at y 65), parapet 66-67,
// rooftop plant room 66-70, lightning rod to 74. Build height 76.
const W = 21, H = 76, D = 52;
const TOP = 65;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// outward normals [dx, dz, faceName]
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const outward = (x, z) => NORMALS.filter(([dx, dz]) => !has(x + dx, z + dz));

// pane connections run along the face
const paneProps = (dx, dz) =>
  dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// mullion on every 3rd bay, and at any footprint end or corner
function isMullion(x, z, dx, dz, nOut) {
  const alongIdx = dz !== 0 ? x : z;
  const endA = dz !== 0 ? has(x - 1, z) : has(x, z - 1);
  const endB = dz !== 0 ? has(x + 1, z) : has(x, z + 1);
  return nOut > 1 || alongIdx % 3 === 0 || !endA || !endB;
}

// ---- foundation, walls, floor plates, windows ----
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const ring = out.length > 0;

  for (let y = gr; y <= TOP; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;

    // storey line / floor plate across the whole footprint
    if (r === 0) {
      if (ring && y === gr && gr > 0) g.set(x, y, z, "polished_andesite");
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!ring) continue; // interior left as air: no interiors

    if (y === gr && gr > 0) {
      g.set(x, y, z, "polished_andesite"); // base course
      continue;
    }
    if (r === 4) {
      g.set(x, y, z, "white_concrete"); // spandrel
      continue;
    }

    // r = 1..3: window band
    const [dx, dz] = out[0];
    if (isMullion(x, z, dx, dz, out.length)) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(dx, dz));

    // warm light behind some glass, two blocks inside the facade
    if (r === 2 && ((k * 3 + (dz !== 0 ? x : z)) % 5 === 2)) {
      g.set(x - 2 * dx, y, z - 2 * dz, "glowstone");
    }
  }
}

// ---- main entrance on the north (min z) face, centred ----
{
  const zmin = Math.min(...cells.map((c) => c[1]));
  const xs = cells.filter(([, z]) => z === zmin).map((c) => c[0]).sort((a, b) => a - b);
  const xm = xs[Math.floor(xs.length / 2)];
  const gd = gnd(xm, zmin);

  // entrance surround and lintel
  for (let dxm = -1; dxm <= 1; dxm++) {
    if (has(xm + dxm, zmin)) g.set(xm + dxm, gd + 3, zmin, "smooth_stone");
  }
  // double door (lower + upper), facing outward (north)
  g.set(xm, gd, zmin, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(xm, gd + 1, zmin, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// ---- parapet on the perimeter ----
for (const [x, z] of cells) {
  if (outward(x, z).length > 0) {
    g.set(x, 66, z, "white_concrete");
    g.set(x, 67, z, "white_concrete");
  }
}

// ---- rooftop plant room (inset from the edges), louvred band, top slab ----
const PX0 = 6, PX1 = 14, PZ0 = 15, PZ1 = 36;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const perim = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    g.set(x, 70, z, "light_gray_concrete"); // roof slab
    if (!perim) continue;
    for (let y = 66; y <= 69; y++) {
      if (y === 67 || y === 68) {
        // louvres
        let dx = 0, dz = 0;
        if (x === PX0) dx = -1; else if (x === PX1) dx = 1;
        else if (z === PZ0) dz = -1; else dz = 1;
        const corner = (x === PX0 || x === PX1) && (z === PZ0 || z === PZ1);
        if (corner) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "gray_stained_glass_pane", paneProps(dx, dz));
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }
}

// lightning rod on the plant room roof
g.set(10, 71, 26, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(10, 72, 26, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(10, 73, 26, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(10, 74, 26, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// ---- roof mechanical units on the main roof ----
for (let x = 2; x <= 4; x++) {
  for (let z = 40; z <= 43; z++) {
    if (!has(x, z)) continue;
    g.set(x, 66, z, "gray_concrete");
    g.set(x, 67, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
