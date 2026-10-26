import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC86605.cells.json`, "utf8"));

const W = 10, H = 29, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup
const raw = new Map();
for (const c of cells) {
  const ground = Math.max(0, Math.min(H - 2, Math.round(c[2])));
  raw.set(`${c[0]},${c[1]}`, { ground, roof: Math.round(c[3]) });
}
const has = (x, z) => raw.has(`${x},${z}`);

// Smooth lidar roof into clean 4-block tiers, then remove single-cell spikes
const roofQ = new Map();
for (const [k, v] of raw) {
  let r = v.ground + 4 * Math.round((v.roof - v.ground) / 4);
  r = Math.max(v.ground + 8, Math.min(H - 1, r));
  roofQ.set(k, r);
}
const smoothed = new Map();
for (const [k, r] of roofQ) {
  const [x, z] = k.split(",").map(Number);
  const nb = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .filter(([a, b]) => has(a, b))
    .map(([a, b]) => roofQ.get(`${a},${b}`))
    .sort((a, b) => a - b);
  let out = r;
  if (nb.length >= 2) {
    const med = nb[Math.floor(nb.length / 2)];
    if (Math.abs(r - med) > 4) out = med;
  }
  smoothed.set(k, out);
}

const meta = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  const mz = !has(x, z - 1) || !has(x, z + 1);
  const mx = !has(x - 1, z) || !has(x + 1, z);
  const perim = mz || mx;
  const corner = mz && mx;
  const bayIdx = corner ? 0 : (mz ? x : (mx ? z : 0));
  const wb = perim && !corner && bayIdx % 2 === 1;
  const door = perim && !corner && !has(x, z - 1) && x === 5;
  // outward facing for stairs
  let out = null;
  if (!has(x, z - 1)) out = "north";
  else if (!has(x, z + 1)) out = "south";
  else if (!has(x - 1, z)) out = "west";
  else if (!has(x + 1, z)) out = "east";
  meta.set(k, { x, z, ground: v.ground, roof: smoothed.get(k), perim, corner, bayIdx, wb, door, out });
}
const info = (x, z) => meta.get(`${x},${z}`);

const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const BAND = "stone_bricks";
const WALL = "bricks";
const PIER = "stone_bricks";
const CORNICE = "smooth_sandstone";
const PARAPET = "stone_brick_slab";
const SHOP = "glass";
const UPPER_GLASS = "glass_pane";
const SPANDREL = "polished_andesite";
const PIERSHOP = "polished_andesite";

for (const m of meta.values()) {
  const { x, z, ground, roof, perim, corner, wb, door, out, bayIdx } = m;

  for (let y = 0; y < roof; y++) {
    if (y < ground) {
      g.set(x, y, z, FOUND);
      continue;
    }
    const rel = y - ground;

    if (!perim) {
      if (y === roof - 1) g.set(x, y, z, FLOOR);
      else if (rel > 0 && rel % 4 === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    if (corner) {
      g.set(x, y, z, PIER);
      continue;
    }

    // Roof parapet: stone slab cap on brick
    if (y === roof - 1) {
      g.set(x, y, z, WALL);
      continue;
    }
    // Corbel course: outward stairs under the cap, cornice stripe elsewhere
    if (y === roof - 2) {
      if (bayIdx % 2 === 0 && out) {
        g.set(x, y, z, "smooth_sandstone_stairs", {
          facing: out, half: "bottom", shape: "straight", waterlogged: "false",
        });
      } else {
        g.set(x, y, z, CORNICE);
      }
      continue;
    }

    if (rel === 0) {
      g.set(x, y, z, BAND);
      continue;
    }

    if (rel < 4) {
      // Ground floor: shopfronts and theatre entrance
      if (door && (rel === 1 || rel === 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (rel === 3) {
        if (door) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        else g.set(x, y, z, PIERSHOP);
      } else {
        g.set(x, y, z, wb ? SHOP : PIERSHOP);
      }
      continue;
    }

    // Upper storeys: string course, two-high glass or pier, spandrel
    const local = rel % 4;
    if (local === 0) {
      g.set(x, y, z, BAND);
    } else if (local === 1 || local === 2) {
      if (wb) g.set(x, y, z, UPPER_GLASS);
      else g.set(x, y, z, PIER); // stone piers read as pilasters between bays
    } else {
      g.set(x, y, z, wb ? SPANDREL : WALL);
    }
  }
}

// Warm lights just inside some window bays
for (const m of meta.values()) {
  if (!m.wb || m.bayIdx % 3 !== 0) continue;
  const { x, z, ground, roof } = m;
  const dx = !has(x - 1, z) ? 1 : (!has(x + 1, z) ? -1 : 0);
  const dz = !has(x, z - 1) ? 1 : (!has(x, z + 1) ? -1 : 0);
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const inner = info(ix, iz);
  for (let y = ground + 1; y < roof - 2; y++) {
    const rel = y - ground;
    if (rel % 4 !== 1) continue;
    if (y < inner.ground || y >= inner.roof - 1) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${dir}/DC86605.nbt`);
