import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499371";
const W = 35, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> { gc: ground, rf: lidar roof height }
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { gc: Math.round(gr), rf });
const has = (x, z) => map.has(`${x},${z}`);

// Building-level ridge height from lidar, smoothed (about 11 blocks)
let sumRf = 0;
for (const c of map.values()) sumRf += c.rf;
const R = Math.min(13, Math.max(10, Math.round(sumRf / map.size)));

// Entrance on the south (z max) face, at the median x of that row
const southXs = cells.filter(([, z]) => z === D - 1).map(([x]) => x).sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : Math.floor(W / 2);

const glassNS = { north: "false", south: "false", east: "true", west: "true" };
const glassEW = { north: "true", south: "true", east: "false", west: "false" };

// Roof profile: three clean tiers rising toward the ridge (d = distance to nearest long edge)
const dOf = (z) => Math.min(z, D - 1 - z);
const topAt = (E, z) => {
  const d = dOf(z);
  const rise = Math.max(0, Math.min(2, Math.floor(d / 4)));
  return E + 1 + rise;
};

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gc = c.gc;
  const E = Math.max(R - 3, gc + 8);       // eaves / top of walls
  const ridge = Math.max(R, E + 2);        // ridge height

  // Foundation (granite plinth) up to this cell's ground, base course on top
  for (let y = 0; y < gc; y++) g.set(x, y, z, "granite");
  g.set(x, gc, z, "smooth_stone");

  const eN = !has(x, z - 1), eS = !has(x, z + 1);
  const eW = !has(x - 1, z), eE = !has(x + 1, z);
  const isEdge = eN || eS || eW || eE;
  const gableEnd = eW || eE;               // short ends of the building

  if (isEdge) {
    for (let y = gc + 1; y <= E; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, gc + 4, z, "smooth_stone");   // storey line

    const longFace = (eN || eS) && !gableEnd;
    const shortFace = gableEnd && !(eN || eS);
    let wcell = false;
    let paneProps = glassNS;
    if (longFace) { wcell = x % 3 === 1 && x > 0 && x < W - 1; paneProps = glassNS; }
    else if (shortFace) { wcell = z % 3 === 1 && z > 0 && z < D - 1; paneProps = glassEW; }

    const isDoor = eS && x === doorX && z === D - 1;
    if (isDoor) {
      // Entrance: oak door, stone lintel and a small slab canopy
      g.set(x, gc + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gc + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, gc + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      for (const dx of [-1, 1]) {
        if (has(x + dx, z)) g.set(x + dx, gc + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    } else if (wcell) {
      // Lower storey windows; only a few lit
      for (let y = gc + 1; y <= gc + 3 && y <= E - 1; y++) {
        const lit = y === gc + 2 && x % 12 === 1;
        g.set(x, y, z, lit ? "glowstone" : "glass_pane", lit ? undefined : paneProps);
      }
      // Upper storey windows; only a few lit
      for (let y = gc + 5; y <= gc + 7 && y <= E - 1; y++) {
        const lit = y === gc + 6 && x % 12 === 7;
        g.set(x, y, z, lit ? "glowstone" : "glass_pane", lit ? undefined : paneProps);
      }
    }
  } else {
    // Interior cell: no rooms, just floor slabs and an air gap
    g.set(x, gc, z, "spruce_planks");
    g.set(x, gc + 4, z, "spruce_planks");
  }

  // Ceiling/eaves line closing the top of the walls
  g.set(x, E, z, "stone_bricks");

  // Roof: low slate gable along x with tiered steps; gable ends are solid stone
  const d = dOf(z);
  const top = topAt(E, z);
  const fillMat = gableEnd ? "stone_bricks" : "deepslate_tiles";
  const stairMat = gableEnd ? "stone_brick_stairs" : "deepslate_tile_stairs";
  for (let y = E + 1; y < top; y++) g.set(x, y, z, fillMat);

  if (d >= 8) {
    g.set(x, top, z, fillMat);                       // ridge course, full block
  } else if (z <= 8) {
    const lowerNorth = z === 0 || topAt(E, z - 1) < top;
    if (lowerNorth) g.set(x, top, z, stairMat, { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
    else g.set(x, top, z, fillMat);
  } else {
    const lowerSouth = z === D - 1 || topAt(E, z + 1) < top;
    if (lowerSouth) g.set(x, top, z, stairMat, { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
    else g.set(x, top, z, fillMat);
  }
}

// Two chimney stacks, if the footprint allows
for (const [x, z] of [[6, 4], [28, 4], [6, 13], [28, 13]]) {
  if (!has(x, z)) continue;
  const gc = map.get(`${x},${z}`).gc;
  const E = Math.max(R - 3, gc + 8);
  const ridge = Math.max(R, E + 2);
  for (let y = E + 1; y <= ridge + 1 && y < H; y++) g.set(x, y, z, "stone_bricks");
  if (ridge + 2 < H) g.set(x, ridge + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
