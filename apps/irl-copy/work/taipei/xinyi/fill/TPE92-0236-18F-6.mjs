import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0236-18F-6";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 100, D = 23;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const GROUND = new Map();
let minX = Infinity, maxX = -Infinity;
for (const [x, z, gr] of cells) {
  GROUND.set(key(x, z), gr);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const inside = (x, z) => GROUND.has(key(x, z));

// Outward directions: W(-x), E(+x), N(-z), S(+z)
const DIRS = [
  { n: "W", dx: -1, dz: 0 },
  { n: "E", dx: 1, dz: 0 },
  { n: "N", dx: 0, dz: -1 },
  { n: "S", dx: 0, dz: 1 },
];

// ---- distance-to-edge field (1 = perimeter) ----------------------------------
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  const edge = DIRS.some(d => !inside(x + d.dx, z + d.dz));
  if (edge) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(key(x, z));
  for (const dd of DIRS) {
    const nx = x + dd.dx, nz = z + dd.dz;
    if (inside(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 0;

// ---- tiers --------------------------------------------------------------------
// y 0..59   : full footprint (storeys 1-12)
// y 60..84  : setback, cells at least 2 in from the edge (storeys 13-17)
// y 85..87  : parapet on the setback edge, mechanical penthouse at depth >= 5
const TIER_A_TOP = 60;
const TIER_B_TOP = 85;
const ROOF_TOP = 88;

function presentAt(x, z, y) {
  if (!inside(x, z)) return false;
  if (y < TIER_A_TOP) return true;
  return distOf(x, z) >= 2;
}

function facadeDirs(x, z, y) {
  return DIRS.filter(d => !presentAt(x + d.dx, z + d.dz, y));
}

// ---- entrance: centred on the ground-level single-face cells --------------------
// Prefer the south face; otherwise the first face that has ground cells.
let entrance = null; // { x, z, face }
{
  const order = ["S", "N", "W", "E"];
  for (const face of order) {
    const list = [];
    for (const [x, z] of cells) {
      const dirs = facadeDirs(x, z, 0);
      if (dirs.length === 1 && dirs[0].n === face) list.push([x, z]);
    }
    if (list.length === 0) continue;
    const coord = ([x, z]) => (face === "W" || face === "E") ? z : x;
    const lo = Math.min(...list.map(coord));
    const hi = Math.max(...list.map(coord));
    const mid = (lo + hi) / 2;
    list.sort((a, b) => Math.abs(coord(a) - mid) - Math.abs(coord(b) - mid));
    entrance = { x: list[0][0], z: list[0][1], face };
    break;
  }
}
const isEntrance = (x, z) => entrance && entrance.x === x && entrance.z === z;

// ---- foundation: solid from y 0 up to each cell's ground -----------------------
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// ---- main massing -------------------------------------------------------------
for (const [x, z, gr] of cells) {
  const d = distOf(x, z);

  // terrace paving on the perimeter ring that stops at the setback
  if (d === 1) g.set(x, TIER_A_TOP, z, "smooth_stone");

  for (let y = gr; y < ROOF_TOP; y++) {
    if (!presentAt(x, z, y)) continue;

    const dirs = facadeDirs(x, z, y);
    const k = Math.floor(y / 5);
    const r = y % 5;

    // --- crown: penthouse and parapet ---
    if (y >= TIER_B_TOP) {
      if (d >= 5) {
        g.set(x, y, z, y === ROOF_TOP - 1 ? "smooth_stone" : "light_gray_concrete");
        continue;
      }
      if (dirs.length > 0) {
        g.set(x, y, z, y === ROOF_TOP - 1 ? "light_gray_concrete" : "white_concrete");
        continue;
      }
      if (y === TIER_B_TOP) g.set(x, y, z, "light_gray_concrete"); // roof slab
      continue;
    }

    // --- interior: floor slabs only, air behind the glass ---
    if (dirs.length === 0) {
      if (r === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // --- facade ---
    // ground-level base course
    if (k === 0 && y === 0) {
      g.set(x, y, z, "polished_granite");
      continue;
    }
    // floor line
    if (r === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // spandrel band under each storey's head
    if (r === 4) {
      if (k === 0 && dirs.length === 1 && isEntrance(x, z)) {
        // entrance canopy: half slab on top of the transom
        g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    // corner columns: vertical quartz pillars
    if (dirs.length >= 2) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    const face = dirs[0].n;
    const i = (face === "W" || face === "E") ? z : x;

    // entrance opening, ground storey, with a lobby lamp
    if (k === 0 && isEntrance(x, z)) {
      if (r === 1 || r === 2) continue; // air: the doorway
      if (r === 3) {
        g.set(x, y, z, "quartz_block"); // transom
        continue;
      }
    }

    // piers: vertical quartz pillars every third bay
    if (i % 3 === 0) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    // window reveals: quartz slab sill and head frame the glass
    if (r === 1) {
      g.set(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (r === 3) {
      g.set(x, y, z, "quartz_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    // glass at r === 2
    g.set(x, y, z, "cyan_stained_glass");

    // warm light behind some panes, in the interior air
    if (k > 0 && ((x * 31 + z * 17 + y * 7) % 13 === 0)) {
      const ix = x - dirs[0].dx, iz = z - dirs[0].dz;
      if (inside(ix, iz) && distOf(ix, iz) >= 2 && presentAt(ix, iz, y)) {
        g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
