import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326016";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 22, D = 10;
const g = new Voxels([W, H, D]);

// Materials: 1899 brick rowhouse with stone trim
const WALL = "bricks";
const TRIM = "smooth_stone";
const QUOIN = "stone_bricks";
const BASE = "stone_bricks";
const ROOF = "stone";
const FLOOR = "oak_planks";

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minG = Infinity, maxG = -Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  map.set(key(x, z), { gr: ground });
  minG = Math.min(minG, ground);
  maxG = Math.max(maxG, ground);
}
// One flat roof: lowest ground + 10 blocks (lidar roof record), never below the highest ground + 4
const ROOF_Y = Math.min(H - 1, Math.max(minG + 10, maxG + 4));

const has = (x, z) => map.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const lenX = maxX - minX + 1;
const lenZ = maxZ - minZ + 1;

// Entrance on the north (low z) street face, centred on the width
const doorX = minX + Math.floor(lenX / 2);
let doorCell = null;
for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ && x === doorX) doorCell = { x, z, gr: v.gr };
}
if (!doorCell) {
  for (const [k, v] of map) {
    const [x, z] = k.split(",").map(Number);
    if (z === minZ && !doorCell) doorCell = { x, z, gr: v.gr };
  }
}

for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  const gr = v.gr;
  const Rk = ROOF_Y - gr; // wall column height; roof cap at Rk-1

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  const ex = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);

  for (let k2 = 0; k2 < Rk; k2++) {
    const y = gr + k2;

    // Roof cap / cornice
    if (k2 === Rk - 1) {
      g.set(x, y, z, ex ? TRIM : ROOF);
      continue;
    }

    if (!ex) {
      // Interior: storey floors and top ceiling, air otherwise (no interiors)
      if (k2 % 2 === 0 || k2 === Rk - 2) g.set(x, y, z, FLOOR);
      continue;
    }

    // Exterior shell: storey belt courses on even offsets
    if (k2 % 2 === 0) {
      g.set(x, y, z, TRIM);
      continue;
    }

    if (corner) {
      g.set(x, y, z, QUOIN);
      continue;
    }

    // Window band: glass in alternating bays, brick piers between
    let win = false, idx = 0, inward = null, alongX = false;
    if (N || S) {
      alongX = true;
      idx = x - minX;
      win = idx % 2 === 1 && idx < lenX - 1;
      inward = N ? [x, z + 1] : [x, z - 1];
    } else {
      idx = z - minZ;
      win = idx % 2 === 1 && idx < lenZ - 1;
      inward = Wf ? [x + 1, z] : [x - 1, z];
    }

    if (win) {
      g.set(x, y, z, "glass_pane", {
        north: alongX ? "true" : "false",
        south: alongX ? "true" : "false",
        east: alongX ? "false" : "true",
        west: alongX ? "false" : "true",
        waterlogged: "false",
      });
      // Warm light inside some windows
      const [ix, iz] = inward;
      if (has(ix, iz) && k2 < Rk - 2 && idx % 4 === 1) {
        const interior = has(ix, iz - 1) && has(ix, iz + 1) && has(ix - 1, iz) && has(ix + 1, iz);
        if (interior) g.set(ix, y, iz, "shroomlight");
      }
    } else {
      g.set(x, y, z, WALL);
    }
  }
}

// Entrance: stone-trimmed door bay on the street face, 2 blocks high
if (doorCell) {
  const { x, z, gr } = doorCell;
  g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
