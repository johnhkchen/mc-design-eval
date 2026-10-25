import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR2223059881.cells.json`, "utf8"));

const W = 40, D = 43, H = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup
const cell = new Map();
for (const [x, z, gr, rf] of cells) cell.set(`${x},${z}`, { x, z, gr, rf });
const has = (x, z) => cell.has(`${x},${z}`);
const at = (x, z) => cell.get(`${x},${z}`);

// Lidar roof is the ridge height: eave sits a few blocks below it, so walls carry the bulk of the height
const RISE = 3;
const raw = new Map();
for (const c of cell.values()) {
  raw.set(`${c.x},${c.z}`, Math.max(c.gr + 5, Math.round(c.rf) - RISE));
}

// Smooth eave heights over a 5x5 neighbourhood into flat tiers
const eaveOf = new Map();
for (const c of cell.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const k = `${c.x + dx},${c.z + dz}`;
    if (raw.has(k)) { sum += raw.get(k); n++; }
  }
  let e = Math.round(sum / n);
  e = Math.min(H - 2 - RISE, Math.max(c.gr + 5, e));
  eaveOf.set(`${c.x},${c.z}`, e);
}

// Gable ridge along z, centred on x = 19.5
const rise = (x) => Math.round(RISE * (1 - Math.abs(x - 19.5) / 20.5));

// 1) Foundation plinth, walls, cornice
for (const c of cell.values()) {
  const { x, z, gr } = c;
  const eave = eaveOf.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "stone_bricks");                       // plinth
  for (let y = gr + 1; y <= eave - 2; y++) g.set(x, y, z, "smooth_sandstone");
  // storey line halfway up the walls
  const mid = Math.floor((gr + eave) / 2);
  if (mid > gr + 1 && mid < eave - 1) g.set(x, mid, z, "chiseled_sandstone");
  g.set(x, eave - 1, z, "chiseled_sandstone");           // cornice under the eave
}

// 2) Gable roof: brick tile mass with stair edges where the slope steps outward
for (const c of cell.values()) {
  const { x, z } = c;
  const eave = eaveOf.get(`${x},${z}`);
  const r = rise(x);
  const westHalf = x < 19.5;
  const nx = westHalf ? x - 1 : x + 1;
  const outRise = has(nx, z) ? rise(nx) : -1;
  const lowerOut = outRise < r;
  for (let y = eave; y <= eave + r; y++) {
    if (y === eave + r && lowerOut) {
      g.set(x, y, z, "brick_stairs", {
        facing: westHalf ? "west" : "east",
        half: "bottom",
        shape: "straight",
        waterlogged: "false",
      });
    } else {
      g.set(x, y, z, "brick");
    }
  }
}

// 3) Windows on the long east and west walls: glass in sandstone frames, warm light behind some
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
for (const zc of [3, 9, 15, 21, 27, 33, 39]) {
  for (const edge of [0, 39]) {
    if (!has(edge, zc)) continue;
    const inner = edge === 0 ? 1 : 38;
    for (let dz = -1; dz <= 1; dz++) {
      const z = zc + dz;
      if (!has(edge, z)) continue;
      const gr2 = at(edge, z).gr;
      const eave = eaveOf.get(`${edge},${z}`);
      if (gr2 + 4 >= eave - 1) continue;
      g.set(edge, gr2 + 1, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
      g.set(edge, gr2 + 2, z, "glass_pane", paneNS);
      g.set(edge, gr2 + 3, z, "glass_pane", paneNS);
      g.set(edge, gr2 + 4, z, "chiseled_sandstone");
      if (dz === 0 && zc % 12 === 3 && has(inner, z)) {
        g.set(inner, gr2 + 2, z, "shroomlight");
      }
    }
  }
}

// 4) Main barn door on the z = 0 gable: stone jambs, framed timber leaves, warm lantern above
for (let x = 15; x <= 24; x++) {
  if (!has(x, 0)) continue;
  const c = at(x, 0);
  const eave = eaveOf.get(`${x},0`);
  const top = Math.min(c.gr + 5, eave - 2);
  const jamb = x === 15 || x === 24;
  const frame = x === 16 || x === 19 || x === 20 || x === 23;
  for (let y = c.gr + 1; y <= top; y++) {
    g.set(x, y, 0, jamb ? "stone_bricks" : frame ? "stripped_oak_log" : "dark_oak_planks");
  }
  // lintel
  g.set(x, top + 1, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// Lantern above the door
if (has(19, 0)) {
  const c = at(19, 0);
  const eave = eaveOf.get(`19,0`);
  const ly = Math.min(c.gr + 7, eave - 2);
  if (ly > c.gr + 6) g.set(19, ly, 0, "lantern", { hanging: "false", waterlogged: "false" });
}

// Hay-loft door above the barn door
for (let x = 18; x <= 21; x++) {
  if (!has(x, 0)) continue;
  const c = at(x, 0);
  const eave = eaveOf.get(`${x},0`);
  for (let y = eave - 4; y <= eave - 2; y++) {
    if (y <= c.gr + 5) continue;
    g.set(x, y, 0, x === 18 || x === 21 ? "stripped_oak_log" : "dark_oak_planks");
  }
}

g.save(`${DIR}/FR2223059881.nbt`);
