// President Hotel, Auckland CBD edge (way 292861410): 35 x 37 blocks, roof about 84 above y 0.
// Read as a 1980s concrete-frame hotel tower on a stone podium: the lidar roof per cell, median-smoothed and snapped
// to 4-block storey lines from a shared floor datum at y 6 (the podium top, above the highest ground). Each column
// stops at its own storey line, so the lidar's steps read as setbacks and every tier stands on the one below.
// Facades: white piers, light-grey spandrels, tinted glazing, a dark fascia and entrance canopy at street level,
// a 2-block parapet on the roof edge, plant on the top tier, and a warm glowstone in about one window in six.
// Interiors are not modelled: only floor slabs per storey and an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861410.cells.json`, "utf8"));
const W = 35, D = 37, H = 96;
const PODIUM = 6, STOREY = 4, MAX_STOREYS = 19;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// footprint cell -> { g: ground above y 0, r: lidar roof above y 0 }
const cellAt = new Map();
for (const [x, z, g, r] of cells) cellAt.set(`${x},${z}`, { g, r });
const cell = (x, z) => cellAt.get(`${x},${z}`);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// storeys per column: the 3x3 median of the lidar roof, snapped to a storey line
const storeys = new Map();
for (const key of cellAt.keys()) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell(x + dx, z + dz); if (c) near.push(c.r); }
  storeys.set(key, Math.min(MAX_STOREYS, Math.max(1, Math.round((median(near) - PODIUM) / STOREY))));
}
const n = (x, z) => storeys.get(`${x},${z}`) ?? 0;
const topOf = (x, z) => PODIUM + STOREY * n(x, z);
// the building fills a column from y 0 to its roof; a side is exposed at y when the neighbour there is empty
const filled = (x, z, y) => n(x, z) > 0 && (y < PODIUM || y < topOf(x, z));
const exposed = (x, z, y) => SIDES.filter(([dx, dz]) => !filled(x + dx, z + dz, y));
// roof edge: outside the footprint or against a lower neighbour
const edge = (x, z) => SIDES.filter(([dx, dz]) => n(x + dx, z + dz) < n(x, z));

// the street front: the exterior face (run of 3+ cells) with the lowest ground, its middle cell is the entrance
function entrance() {
  let best = null;
  for (const key of storeys.keys()) {
    const [x, z] = key.split(",").map(Number);
    for (const [dx, dz] of SIDES) {
      if (cell(x + dx, z + dz)) continue;
      const [ax, az] = dx ? [0, 1] : [1, 0];
      const ok = (k) => cell(x + ax * k, z + az * k) && !cell(x + ax * k + dx, z + az * k + dz);
      if (!ok(0)) continue;
      let lo = 0, hi = 0;
      while (ok(lo - 1)) lo--;
      while (ok(hi + 1)) hi++;
      if (hi - lo < 2) continue;
      const mid = Math.floor((lo + hi) / 2);
      const cx = x + ax * mid, cz = z + az * mid;
      const score = cell(cx, cz).g * 100 - (hi - lo);
      if (!best || score < best.score) best = { score, cx, cz, dx, dz, ax, az };
    }
  }
  return best;
}
const bay = entrance();
const bayCells = [-1, 0, 1].map((k) => [bay.cx + bay.ax * k, bay.cz + bay.az * k, k]);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const piers = (s, x, z) => {
  const sideX = s.some(([dx]) => dx), sideZ = s.some(([, dz]) => dz);
  return (sideX && sideZ) || (sideX && z % 3 === 0) || (sideZ && x % 3 === 0);
};

for (const key of storeys.keys()) {
  const [x, z] = key.split(",").map(Number);
  const ns = n(x, z), top = topOf(x, z);

  // podium: solid from y 0 to the datum, with a base course line
  for (let y = 0; y < PODIUM; y++) put(x, y, z, y === 3 ? "polished_andesite" : "stone_bricks");

  for (let i = 0; i < ns; i++) {
    const b = PODIUM + STOREY * i, first = i === 0, last = i === ns - 1;

    // floor slab of the storey (concrete band on the facade, smooth stone inside)
    const floorSides = exposed(x, z, b);
    put(x, b, z, floorSides.length ? (first ? "polished_andesite" : "white_concrete") : "smooth_stone");

    // glazing rows: piers, tinted glass, and a warm room behind some windows
    for (const y of [b + 1, b + 2]) {
      const s = exposed(x, z, y);
      if (!s.length) continue;
      if (piers(s, x, z)) { put(x, y, z, first ? "polished_andesite" : "smooth_quartz"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      if (y === b + 1 && !first && (x * 7 + z * 13 + i * 5) % 6 === 0) {
        const [dx, dz] = s[0], ix = x - dx, iz = z - dz;
        if (filled(ix, iz, y) && !exposed(ix, iz, y).length) put(ix, y, iz, "glowstone");
      }
    }

    // spandrel band over each window row; the top storey's band is the roof deck
    if (last) for (let y = b + 3; y <= b + 3; y++) put(x, y, z, "light_gray_concrete");
    else if (exposed(x, z, b + 3).length) put(x, b + 3, z, first ? "dark_oak_planks" : "light_gray_concrete");
  }

  // roof edge parapet with a cap, and plant boxes on the top tier's interior
  if (edge(x, z).length) {
    put(x, top, z, "white_concrete");
    put(x, top + 1, z, "smooth_stone_slab", { type: "bottom" });
  } else if (ns === MAX_STOREYS && x % 6 >= 2 && x % 6 <= 3 && z % 6 >= 2 && z % 6 <= 3) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
  }
}

// the entrance: a door in the street face's middle, pilasters beside it, a dark canopy over the bay, lanterns hung
const [dxE, dzE] = [bay.dx, bay.dz], facing = FACING[`${dxE},${dzE}`];
for (const [x, z, k] of bayCells) {
  put(x, 8, z, "dark_oak_planks");
  if (k === 0) {
    put(x, 6, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 7, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, 6, z, "polished_andesite");
    put(x, 7, z, "lantern", { hanging: "true" });
  }
}

const out = `${DIR}/way_292861410.nbt`;
const { blocks, palette } = g.save(out);
const hist = {};
for (const v of storeys.values()) hist[v] = (hist[v] ?? 0) + 1;
console.log(JSON.stringify({ out, blocks, palette, storeysHistogram: hist, entrance: { x: bay.cx, z: bay.cz, facing } }));
