// DC76312: a Neoclassical federal office block on the Mall's north side. Limestone walls (calcite) on a stone-brick plinth,
// three storeys of framed glass bays with smooth-stone floor bands, and a fourth attic tier over the core. The footprint
// is lidar-shaped, so the roof is read as three tiers (12 wings, 14 middle, 15 core), median-smoothed to clean steps.
// Each column stands from y 0 on its own ground: plinth below the ground line, a solid shell, and a hollow interior
// (air behind the glass, floor slabs per storey, a roof deck at the top). No rooms are modelled.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76312.cells.json", "utf8"));

const X = 21, Y = 27, Z = 30;
const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const inside = (x, z) => at.has(`${x},${z}`);

// lidar roofs under 8 are noise (a 0, 2 or 3 among 12-15s): they take the mean of their real neighbours
const real = (c) => c && c.r >= 8;
for (const c of at.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = at.get(`${c.x + dx},${c.z + dz}`); if (real(k)) { sum += k.r; n++; }
  }
  const m = n ? sum / n : c.r;
  // three flat tiers: 12 (wings, three storeys and a cornice), 14 (middle), 15 (core)
  c.roof = m < 13.5 ? 12 : m < 14.5 ? 14 : 15;
}

// which outward faces a footprint cell has (N = z-1, S = z+1, W = x-1, E = x+1)
const exposed = (x, z) => {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const BANDS = new Set([4, 8, 12]);          // floor lines: smooth-stone string courses, and the interior floor slabs
const GLASS_ROWS = new Set([1, 2, 5, 6, 9, 10, 13, 14]);  // two glass rows per storey, the head above them is wall

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the entrance: the north-face pier at x 12 is the door, with a lintel over it
const DOOR_X = 12, DOOR_Z = 0;

// a bay on an outer face: piers every third column, glass between; corners are always solid
const isWindow = (c, face) => {
  if (exposed(c.x, c.z).length > 1) return false;
  const bay = face === "N" || face === "S" ? c.x : c.z;
  return bay % 3 !== 0;
};

// glass panes join their neighbours and the piers along the wall
const paneState = (face) => (face === "N" || face === "S" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });

for (const c of at.values()) {
  const { x, z, g: gr } = c;
  const top = c.roof - 1;                         // the top solid row: parapet on the shell, deck inside
  const faces = exposed(x, z);
  const outer = faces.length > 0;
  for (let y = 0; y <= top; y++) {
    if (y < gr) { set(x, y, z, "stone_bricks"); continue; }                     // plinth below the ground line
    if (!outer) {                                                              // interior: hollow, with floor slabs and a deck
      if (y === top) set(x, y, z, "stone");
      else if (BANDS.has(y)) set(x, y, z, "smooth_stone");
      continue;
    }
    if (x === DOOR_X && z === DOOR_Z && faces.includes("N")) {                 // entrance
      if (y === gr) { set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 1) { set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { set(x, y, z, "polished_andesite"); continue; }
    }
    if (y === top) { set(x, y, z, "smooth_stone"); continue; }                 // cornice cap
    if (y === gr) { set(x, y, z, "polished_andesite"); continue; }            // base course
    if (BANDS.has(y)) { set(x, y, z, "smooth_stone"); continue; }             // storey string course
    if (GLASS_ROWS.has(y) && y < top && y > gr && isWindow(c, faces[0])) {
      set(x, y, z, "glass_pane", paneState(faces[0]));
      continue;
    }
    set(x, y, z, "calcite");                                                    // piers and walls
  }
  // a warm light in the room behind some glass: glowstone on the inside cell, at the glass row
  if (outer && isWindow(c, faces[0])) {
    for (const y of GLASS_ROWS) {
      if (y >= top || y <= gr) continue;
      if ((x * 31 + z * 17 + y * 7) % 9 !== 0) continue;
      const [dx, dz] = INWARD[faces[0]];
      if (!inside(x + dx, z + dz)) continue;
      set(x + dx, y, z + dz, "glowstone");
    }
  }
  // roof plant: small boxes on the deck of the higher tiers, set in from the edge
  if (!outer && x % 4 === 1 && z % 4 === 1) {
    set(x, top + 1, z, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76312.nbt");
