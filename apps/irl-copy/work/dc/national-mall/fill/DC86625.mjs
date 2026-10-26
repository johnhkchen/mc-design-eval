import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86625";
const W = 10, D = 27, H = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(`${x},${z}`, { ground: gr, roof: rf });
const has = (x, z) => fp.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const STOREY = 4;
const PLINTH = "stone_bricks";
const PIER = "light_gray_concrete";
const PIER_ALT = "smooth_quartz";
const SPANDREL = "white_concrete";
const FLOOR = "light_gray_concrete";
const CORNICE = "smooth_quartz";
const ROOF = "stone";
const EQUIP = "stone_bricks";
const GLASS = "gray_stained_glass";
const SHOP_GLASS = "light_blue_stained_glass";
const WARM = "glowstone";

let zMin = Infinity, zMax = -Infinity, xMin = Infinity, xMax = -Infinity;
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
  xMin = Math.min(xMin, x); xMax = Math.max(xMax, x);
}

function isEdge(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

// Entrance: min-z edge cell nearest the middle of the width
let entranceX = null;
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === zMin && (entranceX === null || Math.abs(x - 4.5) < Math.abs(entranceX - 4.5))) entranceX = x;
}

let maxRoof = 0;
for (const { roof } of fp.values()) maxRoof = Math.max(maxRoof, roof);

for (const [x, z, groundRaw, roofRaw] of cells) {
  const gr = Math.max(0, Math.round(groundRaw));
  const roof = Math.min(H - 6, Math.max(Math.round(roofRaw), gr + STOREY));
  const edge = isEdge(x, z);
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const along = edgeX && !edgeZ ? z : edgeZ && !edgeX ? x : null;
  const corner = edgeX && edgeZ;

  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  for (let y = gr; y < roof; y++) {
    const rel = y - gr;

    if (y === roof - 1) {
      put(x, y, z, edge ? CORNICE : ROOF);
      continue;
    }
    if (y === roof - 2 && edge) {
      put(x, y, z, SPANDREL);
      continue;
    }

    if (rel % STOREY === 0) {
      put(x, y, z, FLOOR);
      continue;
    }

    if (!edge) continue;

    if (rel % STOREY === 3) {
      put(x, y, z, SPANDREL);
      continue;
    }

    const isPier = corner || along === null || along % 3 === 0;
    if (isPier) {
      // alternate pier stone so the facade reads as bays, not a flat sheet
      const alt = along !== null && (Math.floor(along / 3) % 2 === 1);
      put(x, y, z, alt ? PIER_ALT : PIER);
      continue;
    }

    const ground = rel < STOREY;
    // Sparse warm lights in upper storeys only
    if (!ground && (along * 5 + y * 3) % 13 === 0) {
      put(x, y, z, WARM);
      continue;
    }
    put(x, y, z, ground ? SHOP_GLASS : GLASS);
  }
}

// One consolidated plant room on the roof of the inner core (not a comb of posts)
for (let x = xMin + 2; x <= xMax - 2; x++) {
  for (let z = zMin + 6; z <= zMax - 6; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    const roof = Math.min(H - 6, Math.max(Math.round(fp.get(`${x},${z}`).roof), 1));
    if (roof < maxRoof - 1) continue;
    for (let y = roof; y < roof + 2; y++) {
      // glass screen on the openings, solid stone elsewhere
      put(x, y, z, (x === xMin + 2 || x === xMax - 2) ? GLASS : EQUIP);
    }
  }
}

// Entrance: recessed doorway with flanking piers and a canopy slab
if (entranceX !== null) {
  const ex = entranceX, ez = zMin;
  const gr = Math.max(0, Math.round(fp.get(`${ex},${ez}`).ground));
  put(ex, gr + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  for (const dx of [-1, 1]) {
    const nx = ex + dx;
    if (!has(nx, ez)) continue;
    const gg = Math.max(0, Math.round(fp.get(`${nx},${ez}`).ground));
    put(nx, gg + 1, ez, PIER_ALT);
    put(nx, gg + 2, ez, PIER_ALT);
    put(nx, gg + 3, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
