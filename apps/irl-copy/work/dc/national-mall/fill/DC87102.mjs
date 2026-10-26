import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 38, H = 38, D = 43;

// Commercial-Planned Development, 1400 F St NW: a six-storey brick commercial block
// of the early-20th-century Penn Quarter type. Lidar roof heights are smoothed and
// quantised to storey steps, with a setback over the interior, so the massing reads
// as clean tiers rather than noise.

const cells = JSON.parse(readFileSync(`${DIR}/DC87102.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const raw = new Map();
for (const c of cells) {
  raw.set(c[0] + "," + c[1], { g: Math.round(c[2]), r: Math.round(c[3]) });
}
const has = (x, z) => raw.has(x + "," + z);
const ex = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const e = ex(x, z);
  return e.n || e.s || e.w || e.e;
};

// Ring distance from the perimeter (0 = facade cell), via BFS over footprint cells.
const dist = new Map();
{
  const q = [];
  for (const k of raw.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (isPerim(x, z)) { dist.set(k, 0); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    const d = dist.get(x + "," + z);
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nk = (x + dx) + "," + (z + dz);
      if (raw.has(nk) && !dist.has(nk)) {
        dist.set(nk, d + 1);
        q.push([x + dx, z + dz]);
      }
    }
  }
}

// Smooth roof heights over a 5x5 neighbourhood, then quantise to storey steps (4 blocks).
const map = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, cnt = 0;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const v = raw.get((x + dx) + "," + (z + dz));
      if (v) { sum += v.r; cnt++; }
    }
  }
  const rs = sum / cnt;
  let n = Math.round((rs - c.g) / 4);
  if (dist.get(k) >= 6) n -= 1; // setback over the interior
  n = Math.max(2, Math.min(6, n));
  const r = c.g + 4 * n + 1; // top coping sits at g+4n
  map.set(k, { g: c.g, r: Math.min(r, 33) });
}

// Entrance: a street-facing (north, low z) perimeter cell nearest the centre.
let doorKey = null;
{
  let best = Infinity;
  for (const [k] of map) {
    const [x, z] = k.split(",").map(Number);
    const e = ex(x, z);
    if (!e.n || e.e || e.w) continue;
    const d = Math.abs(x - 19);
    if (d < best && x % 3 !== 0) { best = d; doorKey = k; }
  }
  if (!doorKey) {
    for (const [k] of map) {
      const [x, z] = k.split(",").map(Number);
      if (isPerim(x, z) && !ex(x, z).e && !ex(x, z).w) { doorKey = k; break; }
    }
  }
}

const GLASS_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, { g: gr, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  const e = ex(x, z);
  const per = e.n || e.s || e.w || e.e;
  const alongX = e.n || e.s;
  const alongZ = e.e || e.w;
  const corner = alongX && alongZ;
  const bay = alongX ? x : z;
  const pier = corner || bay % 3 === 0;
  const outward = e.n ? "north" : e.s ? "south" : e.w ? "west" : "east";

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= r - 1; y++) {
    const rel = y - gr;
    const yy = rel % 4;

    // Roof / coping.
    if (y === r - 1) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    // Ground course.
    if (y === gr) {
      g.set(x, y, z, per ? "polished_andesite" : "smooth_stone");
      continue;
    }
    // Storey floor slabs (solid across the footprint, so nothing floats).
    if (yy === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!per) continue; // interior air behind the facade

    // Cornice zone.
    if (y >= r - 3) {
      if (y === r - 3 && !corner && bay % 2 === 0) {
        g.set(x, y, z, "stone_brick_stairs", { facing: outward, half: "bottom", shape: "straight", waterlogged: "false" });
      } else {
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }

    // Facade: piers, spandrels, windows and shopfronts.
    const isDoor = key === doorKey && rel >= 1 && rel <= 2;
    if (isDoor) {
      const half = rel === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (yy === 1 || yy === 2) {
      if (pier) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "glass_pane", alongX ? GLASS_X : GLASS_Z);
        // Warm light just inside selected windows (air gap behind the glass).
        if (yy === 1 && bay % 6 === 4) {
          const ix = x + (e.w ? 1 : e.e ? -1 : 0);
          const iz = z + (e.n ? 1 : e.s ? -1 : 0);
          if (map.has(ix + "," + iz) && !isPerim(ix, iz)) {
            g.set(ix, y, iz, "shroomlight");
          }
        }
      }
    } else {
      // yy === 3: head band / spandrel.
      g.set(x, y, z, pier ? "stone_bricks" : "bricks");
    }
  }
}

// Rooftop mechanical boxes on the roof of the central block.
for (const [xa, xb] of [[12, 15], [22, 25]]) {
  for (let x = xa; x <= xb; x++) {
    for (let z = 15; z <= 18; z++) {
      const c = map.get(x + "," + z);
      if (!c) continue;
      for (let y = c.r; y < c.r + 2 && y < H; y++) {
        g.set(x, y, z, "light_gray_concrete");
      }
      if (c.r + 2 < H) g.set(x, c.r + 2, z, "iron_bars");
    }
  }
}

g.save(`${DIR}/DC87102.nbt`);
