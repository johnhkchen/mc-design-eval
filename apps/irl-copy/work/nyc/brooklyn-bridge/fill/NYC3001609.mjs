import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 67 Cranberry Street, Brooklyn Heights, 1840: a two-family brick rowhouse with a
// brownstone base course, smooth stone string courses and cornice, flat tar roof and a chimney.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001609.cells.json`, "utf8"));

const W = 5, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
const raw = [];
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.round(gr));
  raw.push({ x, z, ground, roofRaw: Math.round(rf) });
}
// one storey grid for the whole building: anchored to the lowest ground
const G0 = Math.min(...raw.map(c => c.ground));
// one flat roof: median of the lidar heights, so no stray towers
const roofs = raw.map(c => c.roofRaw).sort((a, b) => a - b);
const R = Math.min(H - 4, Math.max(G0 + 8, roofs[Math.floor(roofs.length / 2)]));
for (const c of raw) map.set(key(c.x, c.z), { x: c.x, z: c.z, ground: c.ground });

const has = (x, z) => map.has(key(x, z));
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const WIN_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const WIN_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of map.values()) {
  const { x, z, ground: Gc } = c;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < Gc; y++) put(x, y, z, "stone_bricks");

  const front = !has(x, z - 1);   // street side (low z, faces north)
  const back = !has(x, z + 1);
  const sideW = !has(x - 1, z);
  const sideE = !has(x + 1, z);
  const exterior = front || back || sideW || sideE;

  if (!exterior) {
    // interior: floor at the cell's ground, floor slabs at storey lines, roof deck on top
    put(x, Gc, z, "oak_planks");
    for (let y = G0 + 1; y < R - 1; y += 3) {
      if (y > Gc) put(x, y, z, "oak_planks");
    }
    if (R - 1 > Gc) put(x, R - 1, z, "gray_concrete");
    continue;
  }

  const sideWin = (sideW || sideE) && !front && !back && (z === 2 || z === 5 || z === 8 || z === 11);
  const frontWin = (front || back) && (x === 1 || x === 3);
  const doorCell = front && x === 2 && Gc === G0;

  for (let y = Gc; y <= R - 1; y++) {
    const rel = y - G0;
    let id = "bricks", p;

    if (y === Gc || rel === 0) {
      id = "brown_terracotta";                    // brownstone base course
    } else if (y === R - 1) {
      id = "smooth_stone";                        // cornice band under the parapet
    } else if ((rel - 1) % 3 === 0) {
      id = "smooth_stone";                        // string course / floor line
    } else if (doorCell && x === 2 && (rel === 1 || rel === 2)) {
      id = "oak_door";
      p = { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    } else if (doorCell && x === 2 && rel === 3) {
      id = "lantern";
      p = { hanging: "true", waterlogged: "false" };
    } else if (frontWin) {
      id = "glass_pane";
      p = WIN_EW;
    } else if (sideWin) {
      id = "glass_pane";
      p = WIN_NS;
    }

    put(x, y, z, id, p);
  }

  // door surround: stone slab hood over the entrance
  if (doorCell) put(x, G0 + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // cornice cap above the wall
  put(x, R, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // warm light behind some lit windows (inside cell, air side of the glass)
  for (let y = Math.max(Gc, G0) + 1; y <= R - 2; y++) {
    const rel = y - G0;
    if (rel <= 0 || (rel - 1) % 3 === 0) continue;
    if (!(frontWin || sideWin)) continue;
    const lit = ((x * 3 + Math.floor(rel / 3) + z) % 3) === 0;
    if (!lit) continue;
    if (front && has(x, z + 1)) put(x, y, z + 1, "glowstone");
    else if (back && has(x, z - 1)) put(x, y, z - 1, "glowstone");
    else if (sideW && has(x + 1, z)) put(x + 1, y, z, "glowstone");
    else if (sideE && has(x - 1, z)) put(x - 1, y, z, "glowstone");
  }
}

// chimney stack on the flat roof, standing on the interior deck
for (const c of map.values()) {
  const { x, z } = c;
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (interior && x === 1 && z === Math.floor(D / 2)) {
    put(x, R, z, "bricks");
    put(x, R + 1, z, "bricks");
    put(x, R + 2, z, "bricks");
    put(x, R + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    break;
  }
}

g.save(`${DIR}/NYC3001609.nbt`);
