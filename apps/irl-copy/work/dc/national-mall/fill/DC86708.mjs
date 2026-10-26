// 1201 16th St NW (Commercial-Office-Large): a late-century limestone-clad office block on a 2-block storey rhythm.
// The lidar roof (3x3 median, then snapped to 5 / 10 / 12 / 14 tiers) gives a low podium, a mid body and a tower core.
// The envelope is a one-cell ring of facade (piers, glass bands, spandrels, cornice) with an air gap behind it and a
// floor slab per storey; a shopfront and a canopied double door front the west (16th St) side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC86708.cells.json`, "utf8"));

const X = 22, Z = 33, Y = 27;
const TIERS = [5, 10, 12, 14];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // west (16th St), east, north, south
const key = (x, z) => `${x},${z}`;

const cell = new Map();   // "x,z" -> { g: ground, t: top (exclusive) }
const raw = new Map();
for (const [x, z, g, r] of cells) { cell.set(key(x, z), { g }); raw.set(key(x, z), r); }
const inFp = (x, z) => cell.has(key(x, z));

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - med) <= Math.abs(best - med)) best = t;
  c.t = best;
}
const topOf = (x, z) => cell.get(key(x, z)).t;
const gndOf = (x, z) => cell.get(key(x, z)).g;
// a block is solid at (x, y, z) when it is inside the footprint and under that column's top (foundations count)
const solid = (x, y, z) => inFp(x, z) && y >= 0 && y < topOf(x, z);

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const pane = (dx) => (dx !== 0 ? PANE_NS : PANE_EW);

const v = new Voxels([X, Y, Z]);
const lit = [];

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const g = c.g, t = c.t;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");   // foundation under the lower ground
  for (let y = g; y < t; y++) {
    const faces = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
    if (!faces.length) {
      // interior: a slab per floor, a roof deck over the top, air between
      if (y === g) v.set(x, y, z, "smooth_stone");
      else if (y === t - 1) v.set(x, y, z, "gray_concrete");
      else if (y >= 4 && y % 2 === 0 && y < t - 1) v.set(x, y, z, "smooth_stone");
      continue;
    }
    const [dx, dz] = faces[0];
    const u = dx !== 0 ? z : x;                 // position along the face
    const pier = u % 3 === 0;
    if (y === t - 1) v.set(x, y, z, "smooth_quartz");                                   // parapet coping
    else if (y === t - 2) v.set(x, y, z, "calcite");                                    // cornice band
    else if (y === g) v.set(x, y, z, "stone_bricks");                                   // base course
    else if (y === 3) {                                                                  // ground-storey lintel / canopy
      if (dx === -1 && x === 0 && z >= 18 && z <= 21) v.set(x, y, z, "black_concrete");
      else v.set(x, y, z, "calcite");
    }
    else if (y < 3) {                                                                    // ground storey: shopfront
      if (dx === -1 && x === 0 && (z === 19 || z === 20)) {
        v.set(x, y, z, "dark_oak_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: z === 19 ? "left" : "right", open: "false", powered: "false" });
      } else if (pier) v.set(x, y, z, "black_concrete");
      else v.set(x, y, z, "light_blue_stained_glass_pane", pane(dx));
    }
    else if (y % 2 === 0) v.set(x, y, z, "calcite");                                    // spandrel / floor line
    else if (pier) v.set(x, y, z, "smooth_quartz");                                      // window mullion
    else {
      v.set(x, y, z, "light_blue_stained_glass_pane", pane(dx));
      if ((x * 5 + z * 3 + y) % 11 === 0) lit.push([x - dx, y, z - dz]);                 // warm light behind this pane
    }
  }
}

// warm lights in the air gap behind some windows (only where the cell behind is not itself facade)
for (const [x, y, z] of lit) {
  if (!inFp(x, z) || y >= topOf(x, z) - 2 || y < 5) continue;
  if (DIRS.every(([dx, dz]) => solid(x + dx, y, z + dz))) continue;
  v.set(x, y, z, "glowstone");
}

// roof plant on the mid tier: small units inset from the edge
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.t !== 10 || x % 4 !== 1 || z % 4 !== 2) continue;
  if (!DIRS.every(([dx, dz]) => inFp(x + dx, z + dz) && topOf(x + dx, z + dz) === 10)) continue;
  v.set(x, 10, z, "iron_block");
}

// tower-core penthouse: an inset rectangle of tower roof, a machine room with a coping
const tower = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => topOf(x, z) === 14);
const pent = new Set(tower.filter(([x, z]) => DIRS.every(([dx, dz]) => inFp(x + dx, z + dz) && topOf(x + dx, z + dz) === 14)).map(([x, z]) => key(x, z)));
for (const k of pent) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => !pent.has(key(x + dx, z + dz)));
  v.set(x, 14, z, edge ? "calcite" : "light_gray_concrete");
  v.set(x, 15, z, edge ? "smooth_quartz" : "gray_concrete");
}

const info = v.save(`${FILL}/DC86708.nbt`);
console.log("DC86708.nbt", info, "tiers:", Object.fromEntries(TIERS.map((t) => [t, [...cell.values()].filter((c) => c.t === t).length])), "penthouse cells:", pent.size);
