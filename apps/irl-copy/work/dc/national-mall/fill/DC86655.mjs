import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86655: 1101 16th St NW. Mid-rise 1970s-80s office in cream precast with
// tinted glass bays, a stone base, a quartz cornice and a stepped rooftop penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 12, H = 26, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/DC86655.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Raw per-cell ground and lidar roof, clamped.
const raw = new Map();
for (const c of cells) {
  const [x, z, gr, rr] = c;
  const gy = Math.max(0, Math.min(H - 8, Math.round(gr)));
  const ry = Math.max(gy + 4, Math.min(H - 6, Math.round(rr)));
  raw.set(`${x},${z}`, { gy, ry });
}

// Smooth massing: one main roof level R (median), cells within 2 blocks of it
// snap to R, lower cells form wings at their own (rounded) roof.
const roofs = [...raw.values()].map(v => v.ry).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];
const cm = new Map();
for (const [k, v] of raw) {
  const ry = v.ry >= R - 2 ? R : v.ry;
  cm.set(k, { gy: v.gy, ry: Math.max(v.gy + 4, ry) });
}
const has = (x, z) => cm.has(`${x},${z}`);

const STOREY = 3;
const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const CORNICE = "smooth_quartz";
const CAP_SLAB = "smooth_quartz_slab";

for (const c of cells) {
  const [x, z] = c;
  const { gy, ry } = cm.get(`${x},${z}`);
  const edgeX = x === 0 || x === W - 1;
  const edgeZ = z === 0 || z === D - 1;
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;

  // Foundation to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, BASE);

  // Floor slabs at storey lines; base course at grade on the perimeter.
  for (let f = gy; f < ry - 1; f += STOREY) {
    if (perim) g.set(x, f, z, f === gy ? BASE : SPANDREL);
    else g.set(x, f, z, FLOOR);
  }

  // Solid roof deck and cornice course.
  g.set(x, ry - 1, z, CORNICE);

  if (perim) {
    const u = edgeZ ? x : z;
    const pier = corner || u % 3 === 0;
    for (let y = gy; y < ry - 1; y++) {
      const rel = (y - gy) % STOREY;
      if (rel === 0) continue;
      if (y === gy + 1 && z === 0 && (x === 5 || x === 6)) continue; // entrance
      g.set(x, y, z, pier ? PIER : GLASS);
    }
    // Parapet course on top of the cornice.
    g.set(x, ry, z, CAP_SLAB, { type: "bottom", waterlogged: "false" });

    // Warm light behind some windows, only where the inner cell shares the floor.
    const ix = x === 0 ? 1 : x === W - 1 ? W - 2 : x;
    const iz = z === 0 ? 1 : z === D - 1 ? D - 2 : z;
    if (!corner && u % 3 === 2 && has(ix, iz) && cm.get(`${ix},${iz}`).gy === gy) {
      for (let f = gy; f + 1 < ry - 1; f += STOREY) {
        if (((f - gy) / STOREY) % 2 === 0) g.set(ix, f + 1, iz, "glowstone");
      }
    }
  }
}

// Entrance on the z=0 face: dark oak door with glass vestibule and lintel.
if (has(5, 0) && has(6, 0)) {
  const { gy } = cm.get("5,0");
  const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(5, gy, 0, "dark_oak_door", { ...dp, half: "lower" });
  g.set(5, gy + 1, 0, "dark_oak_door", { ...dp, half: "upper" });
  g.set(5, gy + 2, 0, SPANDREL);
  g.set(6, gy + 1, 0, GLASS);
  g.set(6, gy + 2, 0, SPANDREL);
}

// Stepped rooftop penthouse on the main roof: a 4x3 glass-and-precast core,
// solid all round, with a full quartz cap. Sits on the solid roof deck at R-1.
for (let x = 4; x <= 7; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z)) continue;
    const c = cm.get(`${x},${z}`);
    if (c.ry !== R) continue;
    const ring = x === 4 || x === 7 || z === 3 || z === 5;
    for (let y = R; y <= R + 2; y++) {
      if (!ring) continue;
      const edge = (x === 4 || x === 7) && (z === 3 || z === 5);
      if (edge) g.set(x, y, z, PIER);
      else if (y === R + 1) g.set(x, y, z, GLASS);
      else g.set(x, y, z, SPANDREL);
    }
    g.set(x, R + 3, z, CORNICE);
  }
}

g.save(`${DIR}/DC86655.nbt`);
