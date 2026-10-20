// 浩然大廈 (OSM w331650855), Xinyi district, Taipei.
// Late-1980s/early-1990s mid-rise: about 11 storeys of 5 blocks, cream-white
// tiled facade, red ceramic accent bands, tinted blue glass bays, red cornice,
// quartz coping on the parapet, and a central mechanical penthouse.
// The street face is the north (minimum z) side: a glazed shopfront with a
// centred entrance under a red lintel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw331650855";
const W = 32, H = 71, D = 50;

const PARAPET_TOP = 58;   // highest block index, inside lidar roof (~59)
const FLOOR_H = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint: "x,z" -> ground y
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  const xi = Math.round(x), zi = Math.round(z);
  if (xi < 0 || xi >= W || zi < 0 || zi >= D) continue;
  ground.set(`${xi},${zi}`, Math.max(0, Math.round(gr)));
}

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const isPerim = (x, z) => facesOf(x, z).length > 0;

function inwardOf(x, z, faces) {
  switch (faces[0]) {
    case "N": return [x, z + 1];
    case "S": return [x, z - 1];
    case "W": return [x + 1, z];
    case "E": return [x - 1, z];
    default: return null;
  }
}

// Street face = minimum z. Entrance centred on it.
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
let sumX = 0, nN = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ) { sumX += x; nN++; }
}
const entranceX = nN ? Math.round(sumX / nN) : 16;

const CX = 16, CZ = 25;   // penthouse / rod centre

const g = new Voxels([W, H, D]);

// Bay logic: pilaster on corners and every third bay.
function isPillarBay(x, z, faces) {
  const alongNS = faces.includes("N") || faces.includes("S");
  const bay = alongNS ? x : z;
  return faces.length > 1 || bay % 3 === 0;
}

// Facade block for a perimeter cell at relative height rel (0..4) above floor F of storey k.
function facade(k, rel, x, z, faces) {
  if (rel === 0) {
    // ground: dark stone plinth course; upper floors: white floor-line band
    return k === 0 ? ["stone_bricks"] : ["white_concrete"];
  }
  if (rel === 4) return [k === 0 ? "red_terracotta" : "smooth_quartz"];
  if (isPillarBay(x, z, faces)) return ["quartz_pillar", { axis: "y" }];
  if (k === 0) return ["light_blue_stained_glass"];   // shopfront glazing
  if (rel === 1) return ["light_gray_concrete"];      // spandrel
  return ["light_blue_stained_glass"];                // upper window band
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const g0 = gr;

  // Foundation.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  const n = Math.max(1, Math.floor((PARAPET_TOP - 3 - g0) / FLOOR_H));
  const top = g0 + FLOOR_H * n;
  const faces = facesOf(x, z);
  const perim = faces.length > 0;

  for (let s = 0; s < n; s++) {
    const F = g0 + FLOOR_H * s;
    g.set(x, F, z, "light_gray_concrete");   // floor slab
    if (!perim) continue;

    for (let rel = 0; rel <= 4; rel++) {
      const [id, props] = facade(s, rel, x, z, faces);
      g.set(x, F + rel, z, id, props);
    }

    // Warm lights behind some window cells (never on pillars).
    if (!isPillarBay(x, z, faces) && ((x * 7 + z * 3 + s * 5) % 7 === 0)) {
      const inw = inwardOf(x, z, faces);
      if (inw && has(inw[0], inw[1]) && !isPerim(inw[0], inw[1])) {
        g.set(inw[0], F + 2, inw[1], "glowstone");
      }
    }
  }

  // Roof slab, red cornice band, parapet with quartz coping.
  g.set(x, top, z, "light_gray_concrete");
  if (perim) {
    g.set(x, top, z, "smooth_quartz");
    g.set(x, top + 1, z, "red_terracotta");
    g.set(x, top + 2, z, "smooth_quartz");
    g.set(x, top + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (x >= 9 && x <= 22 && z >= 16 && z <= 33) {
    // Mechanical penthouse on the roof.
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
  }
}

// Entrance on the street face: three-cell glazed bay, centre door, stone surround, red lintel.
for (const dx of [-1, 0, 1]) {
  const x = entranceX + dx;
  if (!has(x, minZ)) continue;
  const g0 = gOf(x, minZ);
  if (dx === 0) {
    g.set(x, g0 + 1, minZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, g0 + 2, minZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    g.set(x, g0 + 1, minZ, "stone_bricks");
    g.set(x, g0 + 2, minZ, "light_blue_stained_glass");
  }
  g.set(x, g0 + 3, minZ, "light_blue_stained_glass");
  g.set(x, g0 + 4, minZ, "red_terracotta");
}

// Lightning rod on the penthouse centre.
if (has(CX, CZ) && !isPerim(CX, CZ)) {
  const g0 = gOf(CX, CZ);
  const n = Math.max(1, Math.floor((PARAPET_TOP - 3 - g0) / FLOOR_H));
  const top = g0 + FLOOR_H * n;
  for (let y = top + 1; y <= top + 3 && y <= PARAPET_TOP; y++) {
    g.set(CX, y, CZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
