import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC86615.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 10, H = 32, D = 16;
const g = new Voxels([W, H, D]);

// Materials: 1980s precast/stone office block, bronze-tinted glazing, cream quartz facade.
const BASE = "polished_andesite";
const SPANDREL = "smooth_quartz";
const CORNICE = "chiseled_quartz_block";
const PARAPET = "smooth_quartz";
const MULLION = "quartz_pillar";
const GLASS = "gray_stained_glass_pane";
const FLOOR = "stone_bricks";
const ROOF = "smooth_stone";
const MECH = "light_gray_concrete";
const FOUND = "stone_bricks";

const y0 = Math.min(...list.map(c => c[2]));
const cellMap = new Map();
for (const [x, z, ground, roof] of list) {
  cellMap.set(`${x},${z}`, { x, z, gr: ground - y0, rawTop: roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

// Smooth lidar noise: average each cell's roof with its footprint neighbours,
// then snap to 3-block storey tiers.
for (const c of cellMap.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nb = cellMap.get(`${c.x + dx},${c.z + dz}`);
    if (nb) { sum += nb.rawTop; n++; }
  }
  const avg = sum / n;
  let top = Math.round(avg / 3) * 3;
  top = Math.max(c.gr + 9, top);
  c.top = Math.min(29, top);
}
const maxTop = Math.max(...[...cellMap.values()].map(c => c.top));

function exposure(x, z) {
  return {
    N: !has(x, z - 1), // low-z face
    S: !has(x, z + 1), // high-z face
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
}

// Entrance: centre bay of whichever long face is exposed (prefer low-z).
const DOOR_X = 4;
function doorFace(x, z) {
  const ex = exposure(x, z);
  if (x !== DOOR_X) return null;
  if (ex.N) return "N";
  if (ex.S) return "S";
  return null;
}

for (const c of cellMap.values()) {
  const { x, z, gr, top } = c;
  const ex = exposure(x, z);
  const exCount = Object.values(ex).filter(Boolean).length;
  const perim = exCount > 0;
  const corner = exCount >= 2;

  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const floorRow = rel % 3 === 0 && y <= top - 3;
    const roofRow = y === top - 1;

    if (!perim) {
      if (roofRow) g.set(x, y, z, ROOF);
      else if (floorRow) g.set(x, y, z, FLOOR);
      continue;
    }

    if (roofRow) { g.set(x, y, z, PARAPET); continue; }
    if (y === top - 2) { g.set(x, y, z, CORNICE); continue; }
    if (y === gr) { g.set(x, y, z, BASE); continue; }
    if (floorRow || y > top - 4) { g.set(x, y, z, SPANDREL); continue; }

    if (corner) { g.set(x, y, z, MULLION); continue; }

    // Entrance: two-high door in the centre bay of the street face
    const df = doorFace(x, z);
    if (df && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: df === "N" ? "north" : "south",
        half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    const along = (ex.N || ex.S) ? x : z;
    if (along % 2 === 0) { g.set(x, y, z, MULLION); continue; }

    const zFace = ex.N || ex.S;
    const props = zFace
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
    g.set(x, y, z, GLASS, props);
  }
}

// Warm lights in the air gap behind some panes
for (const c of cellMap.values()) {
  const { x, z, gr, top } = c;
  const ex = exposure(x, z);
  const exCount = Object.values(ex).filter(Boolean).length;
  if (exCount !== 1) continue;
  const along = (ex.N || ex.S) ? x : z;
  if (along % 2 === 0) continue;
  if ((x + z) % 3 !== 0) continue;
  let ix = x, iz = z;
  if (ex.N) iz = z + 1;
  else if (ex.S) iz = z - 1;
  else if (ex.W) ix = x + 1;
  else if (ex.E) ix = x - 1;
  if (!has(ix, iz)) continue;
  for (let s = 0; gr + 3 * s + 2 <= top - 4; s++) {
    const y = gr + 3 * s + 1;
    if (doorFace(x, z) && y <= gr + 2) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Rooftop mechanical penthouse on the tallest interior cells
for (const c of cellMap.values()) {
  const { x, z, top } = c;
  if (top !== maxTop) continue;
  if (x < 3 || x > 6 || z < 5 || z > 10) continue;
  const ex = exposure(x, z);
  if (Object.values(ex).some(Boolean)) continue;
  g.set(x, top, z, MECH);
  g.set(x, top + 1, z, MECH);
}

g.save(`${DIR}/DC86615.nbt`);
