import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Taipei office block: granite-look podium with shopfronts,
// concrete-framed glass curtain wall, a setback tier at storey 8, and a
// penthouse with roof plant. Floor pitch 5 blocks; roof at lowest ground + 54.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385940762";
const W = 32, H = 66, D = 26;
const FLOOR = 5;
const ROOF = 50;      // top of the main stack (storeys 0..9)
const PENT = 54;      // top of penthouse / parapet

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, g] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, Math.round(g));
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const inside = (x, z) => cells.has(key(x, z));
const B = Math.min(...cells.values());   // datum: lowest ground under footprint

// Distance from the outside edge (perimeter cells = 1).
const dist = new Map();
const q = [];
for (const k of cells.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(k, 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (cells.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      q.push([x + dx, z + dz]);
    }
  }
}

// Setback threshold per relative height r (blocks above datum):
// full footprint below storey 8, inset 3 for storeys 8-9, inset 7 for penthouse.
const thr = (r) => (r < 40 ? 1 : r < ROOF ? 4 : 8);

const g = new Voxels([W, H, D]);

// Centre of footprint in x, used for the entrance.
let sx = 0, n = 0;
for (const k of cells.keys()) { sx += Number(k.split(",")[0]); n++; }
const cx = Math.floor(sx / n);

for (const [k, ground] of cells) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground && y < H; y++) g.set(x, y, z, "stone");

  for (let r = 0; r <= PENT; r++) {
    const y = B + r;
    if (y >= H) break;
    if (y < ground) continue;

    const inc = d >= thr(r);
    const prevInc = r > 0 && d >= thr(r - 1);

    // Roof cap where this column stops.
    if (!inc) {
      if (prevInc) {
        if (r === PENT && d === 8 && (x + z) % 5 === 0) g.set(x, y, z, "sea_lantern");
        else g.set(x, y, z, "smooth_stone");
      }
      continue;
    }

    const t = thr(r);
    const k2 = Math.floor(r / FLOOR);
    const rel = r % FLOOR;

    // Interior: floor slab only, air otherwise (no interiors).
    if (d > t) {
      if (rel === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Shell (outer edge of the current tier).
    const outward = DIRS.find(([dx, dz]) => !inside(x + dx, z + dz));
    const mull = (x + z) % 4 === 0;
    const isEntrance = k2 === 0 && outward && outward[0] === 0 && outward[1] === 1 && Math.abs(x - cx) <= 2;

    let block;
    if (k2 === 0) {
      if (rel === 0) block = "polished_andesite";
      else if (rel === 4) block = "smooth_stone";
      else if (isEntrance && rel === 1 && x === cx) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      } else if (isEntrance && rel === 2 && x === cx) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      } else if (isEntrance && rel === 3) {
        // Stone canopy band over the entrance bay.
        block = "stone_brick_slab";
      } else if (isEntrance) {
        // Entrance bay: clear glass, no mullions, so the opening reads.
        block = "light_blue_stained_glass";
      } else if (mull) block = "white_concrete";
      else block = "light_blue_stained_glass";
    } else {
      if (rel === 0) block = "light_gray_concrete";
      else if (rel === 4) block = "white_concrete";
      else if (mull) block = "white_concrete";
      else block = ((x * 3 + z * 5 + k2) % 7 === 0) ? "gray_stained_glass" : "light_blue_stained_glass";
    }
    g.set(x, y, z, block);

    // Warm light just inside the entrance door.
    if (isEntrance && rel === 1 && x === cx) {
      const inner = [x, z - 1];
      if (inside(inner[0], inner[1]) && dist.get(key(inner[0], inner[1])) > d) {
        g.set(inner[0], y, inner[1], "glowstone");
      }
    }

    // Warm light behind some windows: glowstone one cell inside.
    if (rel >= 1 && rel <= 3 && !mull && !isEntrance && ((x * 5 + z * 7 + r) % 13 === 0)) {
      const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => inside(nx, nz) && dist.get(key(nx, nz)) > d);
      if (inward) g.set(inward[0], y, inward[1], "glowstone");
    }
  }
}

// Roof plant on the tier-B roof (cells inset 4..7).
for (const [k, ground] of cells) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);
  if (d >= 4 && d < 8 && (x % 6 === 1) && (z % 6 === 1)) {
    for (const r of [ROOF + 1, ROOF + 2]) {
      const y = B + r;
      if (y < H && y >= ground) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Mast on the highest (central) penthouse cell.
let best = null;
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);
  if (!best || d > best.d) best = { x, z, d };
}
if (best) {
  for (let r = PENT + 1; r <= PENT + 4; r++) {
    const y = B + r;
    if (y < H) g.set(best.x, y, best.z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
