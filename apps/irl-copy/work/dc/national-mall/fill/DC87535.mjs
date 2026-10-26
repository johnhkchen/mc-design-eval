import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87535";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 26, D = 21;
const g = new Voxels([W, H, D]);

// ---- footprint and lidar record -------------------------------------------
const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));

const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];

const exteriorFaces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isExterior = (x, z) => has(x, z) && exteriorFaces(x, z).length > 0;

// Flatten lidar noise into clean tiers: snap near-median roofs to the median.
const roofs = [...map.values()].map((c) => c.r).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
for (const c of map.values()) {
  if (Math.abs(c.r - med) <= 1) c.r = med;
}

// Remove stray single-cell stubs: a cell that differs by 2+ from the median of
// itself and its footprint neighbours, and has no same-height neighbour, takes
// the neighbour median so no lone column pokes above the massing.
{
  const snap = new Map();
  for (const c of map.values()) {
    const nb = DIRS.map(([dx, dz]) => map.get(key(c.x + dx, c.z + dz))).filter(Boolean);
    const same = nb.filter((n) => n.r === c.r).length;
    if (nb.length >= 2 && same === 0) {
      const vals = nb.map((n) => n.r).sort((a, b) => a - b);
      const nmed = vals[Math.floor(vals.length / 2)];
      if (Math.abs(c.r - nmed) >= 2) snap.set(key(c.x, c.z), nmed);
    }
  }
  for (const [k, v] of snap) map.get(k).r = v;
}

for (const c of map.values()) {
  c.g = Math.min(Math.max(c.g, 0), H - 8);
  c.r = Math.min(Math.max(c.r, c.g + 4), H - 3);
}

// ---- entrance: on the north (street) face, nearest the middle -------------
let doorCell = null;
{
  const xs = [...map.values()].filter((c) => !has(c.x, c.z - 1)).map((c) => c.x);
  const meanX = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : W / 2;
  let best = Infinity;
  for (const c of map.values()) {
    if (has(c.x, c.z - 1)) continue;
    const d = Math.abs(c.x - meanX);
    if (d < best) {
      best = d;
      doorCell = c;
    }
  }
}

// ---- window pattern: every 3rd block along a face is a pier ---------------
const isWindowCol = (x, z, dx, dz) => {
  const u = dx !== 0 ? z : x;
  return u % 3 === 1;
};

// ---- build every footprint cell -------------------------------------------
for (const c of map.values()) {
  const { x, z } = c;
  const gr = c.g;
  const roof = c.r;
  const top = roof - 1;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);

  if (faces.length === 0) {
    // Interior: floor slabs per storey and roof deck; air between.
    for (let y = gr; y <= top; y++) {
      const rel = y - gr;
      if (rel % 3 === 0 || y === top) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  const allWindow = faces.every(([dx, dz]) => isWindowCol(x, z, dx, dz));

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;

    // Entrance door, two blocks tall, with a glass transom above.
    if (doorCell && doorCell.x === x && doorCell.z === z) {
      if (rel === 0 || rel === 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: rel === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (rel === 2) {
        g.set(x, y, z, "light_blue_stained_glass_pane");
        continue;
      }
    }

    // Roof cap and cornice.
    if (y === top) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top - 1) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Base course at ground storey.
    if (rel === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Storey string courses.
    if (rel % 3 === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Window rows: tinted glass in stone-brick reveals so they read as openings.
    if (rel % 3 === 1) {
      if (allWindow) {
        g.set(x, y, z, "light_blue_stained_glass_pane");
        const [dx, dz] = faces[0];
        const ix = x - dx, iz = z - dz;
        const u = dx !== 0 ? z : x;
        const storey = Math.floor(rel / 3);
        if (((u + storey) % 4 === 0) && has(ix, iz) && !isExterior(ix, iz)) {
          const inner = map.get(key(ix, iz));
          if (y >= inner.g && y <= inner.r - 2) g.set(ix, y, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }

    // Spandrel / head course.
    g.set(x, y, z, "bricks");
  }
}

// ---- rooftop elevator penthouse (3x3 at the interior centroid) -------------
{
  const interior = [...map.values()].filter((c) => !isExterior(c.x, c.z));
  const pool = interior.length ? interior : [...map.values()];
  const cx = pool.reduce((a, c) => a + c.x, 0) / pool.length;
  const cz = pool.reduce((a, c) => a + c.z, 0) / pool.length;
  let centre = null;
  let bestD = Infinity;
  for (const c of pool) {
    const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
    if (d < bestD) {
      bestD = d;
      centre = c;
    }
  }
  if (centre) {
    const roof = centre.r;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const x = centre.x + dx, z = centre.z + dz;
        if (!has(x, z) || isExterior(x, z)) continue;
        const c = map.get(key(x, z));
        if (c.r !== roof) continue;
        if (roof + 1 > H - 1) continue;
        g.set(x, roof, z, "bricks");
        g.set(x, roof + 1, z, "stone_bricks");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
