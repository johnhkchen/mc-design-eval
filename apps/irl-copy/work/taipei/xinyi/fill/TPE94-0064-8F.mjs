import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 環泥國際名邸 (2005): mid-rise residential block in Xinyi, 8 storeys of 5 blocks
// to a flat roof 40 blocks above the lowest ground. Cream tiled walls, light-blue
// glazing in mullioned bays, heavier pilaster bays every 8, quartz storey lines,
// a recessed entrance portico with a dark canopy, and a light plant room on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0064-8F";
const W = 86, H = 52, D = 24;
const ROOF = 40;          // roof height above lowest ground (lidar)
const STOREY = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => {
  if (Array.isArray(c)) return { x: c[0], z: c[1], g: Math.round(c[2]) };
  return { x: c.x, z: c.z, g: Math.round(c.ground ?? c.g ?? c[2] ?? 0) };
});

const gridG = new Map();
for (const c of cells) gridG.set(`${c.x},${c.z}`, c.g);
const has = (x, z) => gridG.has(`${x},${z}`);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exteriorDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const minZ = Math.min(...cells.map((c) => c.z));
const minX = Math.min(...cells.map((c) => c.x));
const maxX = Math.max(...cells.map((c) => c.x));
const midX = (minX + maxX) / 2;
const frontRow = cells.filter((c) => c.z === minZ);
const entrance = frontRow.reduce((best, c) =>
  Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best, frontRow[0]);
const EX = entrance.x;
const EG = entrance.g;

const g = new Voxels([W, H, D]);

for (const c of cells) {
  const { x, z } = c;
  const gr = c.g;
  const exts = exteriorDirs(x, z);
  const perimeter = exts.length > 0;
  const corner = exts.some(([dx]) => dx !== 0) && exts.some(([, dz]) => dz !== 0);
  const xFacing = exts.some(([dx]) => dx !== 0);
  const along = xFacing ? z : x;
  const pilaster = along % 8 === 0;   // heavier column every 8 bays

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const n = Math.max(1, Math.floor((ROOF - gr) / STOREY));
  const top = gr + n * STOREY;

  for (let k = 0; k < n; k++) {
    const b = gr + k * STOREY;
    // Floor slab / storey line across the whole footprint.
    g.set(x, b, z, "smooth_quartz");

    if (!perimeter) continue;

    for (let y = b + 1; y <= b + 4; y++) {
      if (corner) {
        g.set(x, y, z, "smooth_quartz");                       // corner pilaster
      } else if (y === b + 4) {
        g.set(x, y, z, pilaster ? "smooth_quartz" : "white_concrete"); // spandrel band
      } else if (pilaster) {
        g.set(x, y, z, "smooth_quartz");                       // full-height pilaster
      } else if (along % 4 === 0) {
        g.set(x, y, z, "light_gray_concrete");                 // mullion
      } else {
        g.set(x, y, z, k === 0 ? "gray_stained_glass" : "light_blue_stained_glass");
      }
    }

    // Warm light behind some windows (interior cell one step inward).
    if (!corner && !pilaster && along % 4 !== 0) {
      const [odx, odz] = exts[0];
      const ix = x - odx, iz = z - odz;
      const innerIsPerim = exteriorDirs(ix, iz).length > 0 || !has(ix, iz);
      if (!innerIsPerim && ((along * 7 + k * 5) % 9 === 0)) {
        g.set(ix, b + 2, iz, "glowstone");
      }
    }
  }

  // Roof slab on top of the storeys.
  g.set(x, top, z, "light_gray_concrete");

  // Parapet and cap on the perimeter.
  if (perimeter) {
    g.set(x, top + 1, z, corner || pilaster ? "smooth_quartz" : "white_concrete");
    g.set(x, top + 2, z, corner || pilaster ? "smooth_quartz" : "white_concrete");
    g.set(x, top + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof plant room in the middle, light-coloured with a clear roof cap.
  const inMech = x >= 26 && x <= 59 && z >= 8 && z <= 15;
  if (inMech) {
    const louver = (x % 4 === 0) && (z === 8 || z === 15);
    g.set(x, top + 1, z, louver ? "iron_bars" : "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
    g.set(x, top + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Recessed entrance on the street face: clear glazed bay, dark canopy, double door,
// flanking lanterns, and a step at the threshold.
for (let x = EX - 1; x <= EX + 1; x++) {
  if (has(x, minZ)) {
    g.set(x, EG + 1, minZ, "glass_pane");
    g.set(x, EG + 2, minZ, "glass_pane");
    g.set(x, EG + 3, minZ, "glass_pane");
  }
}
g.set(EX, EG + 1, minZ, "iron_door", {
  facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
});
g.set(EX, EG + 2, minZ, "iron_door", {
  facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
});
// Dark canopy soffit over the portico, wider than the door.
for (let x = EX - 2; x <= EX + 2; x++) {
  if (has(x, minZ)) {
    g.set(x, EG + 4, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
// Hanging lantern under the canopy, plus two lanterns on the frontage either side.
g.set(EX, EG + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });
for (const dx of [-3, 3]) {
  if (has(EX + dx, minZ)) {
    g.set(EX + dx, EG + 1, minZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}
// Threshold step on the street face, as a bottom slab over the pavement row.
for (let x = EX - 1; x <= EX + 1; x++) {
  if (has(x, minZ)) {
    g.set(x, EG, minZ, "smooth_quartz");
  }
}

// Base course on the street face at ground level.
for (let x = minX; x <= maxX; x++) {
  if (has(x, minZ) && !(x >= EX - 1 && x <= EX + 1)) {
    g.set(x, EG, minZ, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
