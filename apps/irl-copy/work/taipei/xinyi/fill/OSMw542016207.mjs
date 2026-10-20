import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542016207";
const W = 15, H = 23, D = 21;
const TOP = 10; // parapet / roof level, 10 blocks above lowest ground (roof ~11 with equipment base)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const r = Math.round(gr);
  ground.set(`${x},${z}`, r);
  if (r < minG) minG = r;
}
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function edges(x, z) {
  return {
    n: !has(x, z - 1), // z = 0 side: street-facing front
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Returns [id, props?] for one exterior wall block at absolute height y
function wallBlock(x, z, rel, e) {
  const alongX = e.n || e.s;
  const corner = (e.n || e.s) && (e.w || e.e);
  const idx = alongX ? x : z;
  const pillar = corner || idx % 3 === 0;
  const front = e.n && !corner;
  const pane = alongX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  if (rel === 0) return ["polished_andesite"];          // base course
  if (rel === 4) return ["gray_concrete"];              // shopfront fascia
  if (rel === 5) return ["smooth_stone"];               // storey line
  if (rel === 9) return ["white_concrete"];             // upper lintel band
  if (rel === TOP) return ["smooth_stone"];             // parapet cap

  if (rel >= 1 && rel <= 3) {
    if (front && idx === 7) {                           // central entrance bay
      if (rel === 1) return ["oak_door", { ...DOOR, half: "lower" }];
      if (rel === 2) return ["oak_door", { ...DOOR, half: "upper" }];
      return ["glass_pane", pane];
    }
    if (pillar) return ["light_gray_concrete"];
    return ["glass_pane", pane];
  }

  // rel 6..8: upper storey
  if (pillar) return ["light_gray_concrete"];
  if (rel === 7 && idx % 2 === 0) return ["glowstone"]; // warm lit window
  return ["glass_pane", pane];
}

// Build the shell
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const e = edges(x, z);
  const edge = e.n || e.s || e.w || e.e;

  // Walls / slabs from this cell's ground up to the common roof level
  for (let y = gr; y <= minG + TOP; y++) {
    const rel = y - minG;
    if (rel === TOP) {
      put(x, y, z, edge ? "smooth_stone" : "gray_concrete");
      continue;
    }
    if (!edge) {
      // interior: air gap behind glass, floor slabs only
      if (y === gr || rel === 5) put(x, y, z, "smooth_stone");
      continue;
    }
    const [id, props] = wallBlock(x, z, rel, e);
    put(x, y, z, id, props);
  }
}

// Roof plant: a modest mechanical box on interior roof cells
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (gr > minG + TOP) continue;
  const e = edges(x, z);
  if (e.n || e.s || e.w || e.e) continue;
  if (x >= 5 && x <= 9 && z >= 7 && z <= 13) {
    put(x, minG + TOP + 1, z, "light_gray_concrete");
    put(x, minG + TOP + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
