// Science Centre 305, Auckland: a 1970s institutional concrete block. Basalt-stone plinth, a precast-concrete frame
// (light-grey piers and floor bands, white spandrels), tinted blue glass between the piers, a flat roof with a coping
// and parapet. The lidar roof is smoothed (5x5 median) and quantised into four flat setback tiers (22, 30, 42, 52).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_918249419.cells.json", "utf8"));
const X = 52, Y = 65, Z = 49;

// the lidar roof per footprint cell, then a 5x5 median so the tiers come out flat, not stair-stepped noise
const lidar = new Map();
for (const [x, z, , r] of cells) lidar.set(`${x},${z}`, r);
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const tierOf = (s) => (s <= 26 ? 22 : s <= 35 ? 30 : s <= 44 ? 42 : 52);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = lidar.get(`${x + dx},${z + dz}`); if (r !== undefined) near.push(r); }
  top.set(`${x},${z}`, tierOf(median(near)));
}
const T = (x, z) => top.get(`${x},${z}`);                      // undefined outside the footprint
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                 // outward normals: +x, -x, +z, -z
// the faces of cell (x,z) that look out at height y: outside the footprint, or beside a neighbour that stops below y
const exposure = (x, z, y) => DIRS.flatMap(([dx, dz], d) => { const n = T(x + dx, z + dz); return n === undefined || n <= y ? [d] : []; });
// interior cells whose 5x5 neighbourhood is all footprint and no lower tier beside them: structure can stand here
const deep = (x, z, t) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = T(x + dx, z + dz); if (n === undefined || n < t) return false; } return true; };

const v = new Voxels([X, Y, Z]);
const glow = [];

for (const [x, z] of cells) {
  const t = T(x, z);
  // plinth: solid from y 0 to the ground floor (covers each cell's own ground), with a chiseled base course at y 5
  for (let y = 0; y < 6; y++) v.set(x, y, z, y === 5 ? "chiseled_stone_bricks" : "stone_bricks");
  for (let y = 6; y < t; y++) {
    const E = exposure(x, z, y);
    if (y === t - 1) { v.set(x, y, z, E.length ? "smooth_stone" : "stone"); continue; }   // coping on the wall, roof membrane inside (mid grey, not the near-black of gray_concrete)
    if (!E.length) {
      if ((y - 6) % 4 === 0) v.set(x, y, z, "light_gray_concrete");                               // a floor slab per storey
      else if (x % 4 === 2 && z % 4 === 2 && deep(x, z, t)) v.set(x, y, z, "light_gray_concrete"); // structural bays
      continue;
    }
    // facade: floor band, glass bands with piers every third bay, spandrel under each sill line
    const axisX = E.some((d) => d < 2), axisZ = E.some((d) => d >= 2);
    const corner = axisX && axisZ, u = axisX ? z : x, rel = (y - 6) % 4;
    if (rel === 0) v.set(x, y, z, "light_gray_concrete");
    else if (rel === 3) v.set(x, y, z, "white_concrete");
    else if (corner || u % 3 === 0) v.set(x, y, z, "light_gray_concrete");
    else {
      const state = axisX ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
      v.set(x, y, z, "light_blue_stained_glass_pane", state);
      // a few lit windows: a glowstone just inside the glass (only on single-face cells, where the inside is clear)
      if (rel === 2 && E.length === 1 && (u * 3 + y) % 11 === 0) {
        const [dx, dz] = DIRS[E[0]];
        glow.push([x - dx, y, z - dz]);
      }
    }
  }
  // parapet on the outer edge of the roof
  if (DIRS.some(([dx, dz]) => T(x + dx, z + dz) === undefined)) v.set(x, t, z, "white_concrete");
  // roof plant: a few boxes on the open roof of each tier
  if (x % 7 === 3 && z % 7 === 3 && deep(x, z, t)) { v.set(x, t, z, "light_gray_concrete"); v.set(x, t + 1, z, "light_gray_concrete"); }
}

for (const [x, y, z] of glow) if (T(x, z) !== undefined && !v.get(x, y, z)) v.set(x, y, z, "glowstone");

// main entrance: the +z face with the largest z, middle of its run; a door at the podium level and a canopy over it
const front = cells.filter(([x, z]) => T(x, z + 1) === undefined);
const zFront = Math.max(...front.map(([, z]) => z));
const atFront = front.filter(([, z]) => z === zFront).map(([x]) => x).sort((a, b) => a - b);
const ex = atFront[atFront.length >> 1], ez = zFront;
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
v.set(ex, 6, ez, "iron_door", { ...door, half: "lower" });
v.set(ex, 7, ez, "iron_door", { ...door, half: "upper" });
for (let dx = -1; dx <= 1; dx++) for (let dz = 1; dz <= 2; dz++) v.set(ex + dx, 8, ez + dz, "smooth_stone_slab", { type: "bottom" });

const saved = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_918249419.nbt");
console.log(JSON.stringify({ cells: cells.length, tiers: [22, 30, 42, 52].map((t) => [t, [...top.values()].filter((v) => v === t).length]), ...saved }));
