import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1300 New York Ave NW (DC87209): late-20th-century speculative office block.
// Pale precast piers, light-blue tinted glass bands, stone base and cornice,
// a street-level entrance bay, and a rooftop mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87209";
const W = 13, H = 31, D = 17;
const STOREY = 4;
const MAX_ROOF = 22;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, ground, roof] of raw) cells.set(`${x},${z}`, { x, z, ground, roof });
const has = (x, z) => cells.has(`${x},${z}`);

const FACES = [
  { n: "n", dx: 0, dz: -1 },
  { n: "s", dx: 0, dz: 1 },
  { n: "w", dx: -1, dz: 0 },
  { n: "e", dx: 1, dz: 0 },
];

// Roof smoothing: average each cell's roof with its footprint neighbours (removes lidar
// speckle), then snap to flat tiers: near the median stays flat, larger differences
// step in whole storeys.
const roofVals = [...cells.values()].map(c => Math.round(c.roof)).sort((a, b) => a - b);
const medRoof = roofVals[Math.floor(roofVals.length / 2)];
const G0 = Math.min(...[...cells.values()].map(c => Math.round(c.ground)));

for (const c of cells.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nb = cells.get(`${c.x + dx},${c.z + dz}`);
    if (nb) { sum += nb.roof; n++; }
  }
  c.smooth = sum / n;
  c.g = Math.max(0, Math.round(c.ground));
  const diff = c.smooth - medRoof;
  const tier = Math.abs(diff) < 3 ? medRoof : medRoof + STOREY * Math.round(diff / STOREY);
  c.R = Math.min(Math.max(tier, c.g + STOREY), MAX_ROOF);
  c.exposed = FACES.filter(f => !has(c.x + f.dx, c.z + f.dz));
}

const g = new Voxels([W, H, D]);
const placed = new Set();
const key = (x, y, z) => `${x},${y},${z}`;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  placed.add(key(x, y, z));
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const windows = [];

// Massing pass: foundation, walls, floors, cornice and roof for each footprint cell.
for (const c of cells.values()) {
  const { x, z, g: gr, R, exposed } = c;
  const perim = exposed.length > 0;
  const corner = exposed.length >= 2;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < R; y++) {
    const rel = y - G0;
    const lvl = Math.floor(rel / STOREY);
    const s = ((rel % STOREY) + STOREY) % STOREY;

    if (y === R - 1) {
      put(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    if (!perim) {
      if (y === gr || s === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (s === 0) { put(x, y, z, "light_gray_concrete"); continue; }
    if (s === 3) { put(x, y, z, "smooth_stone"); continue; }

    const face = exposed[0];
    const along = face.dz !== 0 ? x : z;
    if (corner || along % 3 === 0) {
      put(x, y, z, "quartz_pillar");
      continue;
    }

    const horiz = face.dz !== 0 ? ["east", "west"] : ["north", "south"];
    const props = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    props[horiz[0]] = "true";
    props[horiz[1]] = "true";
    put(x, y, z, lvl === 0 ? "glass_pane" : "light_blue_stained_glass_pane", props);

    // Warm light only where the room behind is an interior cell, not another wall.
    const ix = x - face.dx, iz = z - face.dz;
    if (lvl >= 1 && (along + lvl) % 3 === 0 && has(ix, iz) && !has(ix + face.dx, iz + face.dz) === false) {
      windows.push({ x, y, z, ix, iz });
    }
  }
}

// Warm lights behind selected upper windows (air cells only).
for (const w of windows) {
  if (placed.has(key(w.ix, w.y, w.iz))) continue;
  put(w.ix, w.y, w.iz, "glowstone");
}

// Entrance bay on the +z face, centred on that face's cells.
const southCells = [...cells.values()].filter(c => !has(c.x, c.z + 1));
if (southCells.length) {
  const xs = southCells.map(c => c.x).sort((a, b) => a - b);
  const midX = xs[Math.floor(xs.length / 2)];
  const ec = southCells.reduce((best, c) =>
    Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best);

  // Stone piers flanking the door bay, so the entrance reads from the street.
  for (const dx of [-1, 1]) {
    const pc = cells.get(`${ec.x + dx},${ec.z}`);
    if (!pc || has(pc.x, pc.z + 1) === false) continue;
    for (let y = ec.g + 1; y <= ec.g + 3; y++) put(pc.x, y, pc.z, "quartz_pillar");
  }
  // Recessed portal: the door cell itself is set back, with a dark stone lintel above.
  put(ec.x, ec.g + 1, ec.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ec.x, ec.g + 2, ec.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ec.x, ec.g + 3, ec.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Lanterns on the lobby floor just inside the door.
  for (const dx of [-1, 1]) {
    const lx = ec.x + dx, lz = ec.z - 1;
    if (has(lx, lz) && !placed.has(key(lx, ec.g + 1, lz))) {
      put(lx, ec.g + 1, lz, "lantern", { hanging: "false" });
    }
  }
}

// Rooftop mechanical penthouse on the interior core, with louvred walls.
for (const c of cells.values()) {
  if (c.exposed.length) continue;
  if (c.x < 4 || c.x > 8 || c.z < 5 || c.z > 11) continue;
  const edge = c.x === 4 || c.x === 8 || c.z === 5 || c.z === 11;
  for (let y = c.R; y < c.R + 3; y++) {
    if (!edge) continue;
    if (y === c.R + 1 && !(c.x === 4 || c.x === 8)) put(c.x, y, c.z, "iron_bars");
    else put(c.x, y, c.z, "light_gray_concrete");
  }
  put(c.x, c.R + 3, c.z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
