// DC62313 — 301 Rhode Island Ave NW: a two-to-three-storey brick office with a stone base, a stone cornice and a
// taller central core. The lidar roof heights (2/3/4 blocks) are median-smoothed over each cell's footprint neighbours
// so the massing steps in clean tiers: wings at 2, the ring at 3, the core at 4. The street face is the z=max side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62313.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 21, D = 17, H = 6;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, gr, ro]) => [key(x, z), { gr, ro }]));
const inF = (x, z) => raw.has(key(x, z));
const OUT = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smooth the roof: the median of each cell's footprint neighbourhood (itself included), so lidar speckle drops out.
const roof = new Map();
for (const [k, { ro }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)).ro);
  vals.sort((a, b) => a - b);
  roof.set(k, vals[Math.floor(vals.length / 2)]);
}

const cellsOut = (x, z) => OUT.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isRing = (x, z) => cellsOut(x, z).length > 0;

// Gap cells: the 1-block air behind each window (inside the ring), so the glass sits recessed with air behind it.
const gaps = new Set();
const windowAt = (x, z, y, R) => {
  if (y > R - 2) return false;                              // the top course is the cornice
  const outs = cellsOut(x, z);
  if (outs.length !== 1) return false;                      // corners and ring-less cells are piers
  const [ox, oz] = outs[0];
  const p = ox !== 0 ? z : x;                               // position along the facade
  return p % 2 === 1;                                       // odd bays glaze, even bays are brick piers
};

// The entrance: a double door on the street face (z = 15, the cells whose z+1 is outside the footprint), stone jambs,
// a stone lintel over, and a lit lobby behind.
const ENTRY_Z = 15, ENTRY_X = [8, 9], JAMBS = [7, 10];
const isEntry = (x, z) => z === ENTRY_Z && ENTRY_X.includes(x);
const isJamb = (x, z) => z === ENTRY_Z && JAMBS.includes(x);

for (const [k, { ro }] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (!isRing(x, z)) continue;
  const R = Math.max(2, roof.get(k));
  for (let y = 1; y <= R - 2; y++) {
    if (!windowAt(x, z, y, R) && !isEntry(x, z)) continue;
    const [ox, oz] = cellsOut(x, z)[0];
    const bx = x - ox, bz = z - oz;                         // the cell just inside
    if (!inF(bx, bz) || isRing(bx, bz)) continue;
    gaps.add(`${bx},${bz},${y}`);
  }
}
// The lobby behind the doors: the inner cell at y 1 is air with a lantern in it.
for (const x of ENTRY_X) gaps.add(`${x},${ENTRY_Z - 1},1`);

const g = new Voxels([W, H, D]);
const DOOR = (half, x, facing, hinge) => ({ facing, half, hinge, open: "false", powered: "false" });

for (const [k, { gr }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const R = Math.max(2, roof.get(k));
  // Foundation: solid from y 0 up to this cell's own ground (all zero here, so nothing fills).
  for (let y = 0; y < raw.get(k).gr; y++) g.set(x, y, z, "stone_bricks");
  const ring = isRing(x, z);
  const outs = cellsOut(x, z);
  const top = R - 1;
  for (let y = 0; y < R; y++) {
    if (!ring) {                                            // interior: floor, a 1-block shell around the gaps, and a roof
      if (y === 0) g.set(x, y, z, "stone_bricks");
      else if (y === top) g.set(x, y, z, "stone");
      else if (gaps.has(`${x},${z},${y}`)) {
        // a warm light in some gaps (glowstone behind glass), shroomlight in a few upper ones
        if (y === 1 && ENTRY_X.includes(x) && z === ENTRY_Z - 1) g.set(x, y, z, "lantern");
        else if (y === 1 && (x + z) % 3 === 0) g.set(x, y, z, "glowstone");
        else if (y === 2 && (x + 2 * z) % 4 === 0) g.set(x, y, z, "shroomlight");
      }
      else g.set(x, y, z, "bricks");
      continue;
    }
    // ring: the street face and facades
    if (y === 0) { g.set(x, y, z, "stone_bricks"); }
    if (y === top) { g.set(x, y, z, "stone_bricks"); continue; }
    if (outs.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; }   // corner piers
    if (isEntry(x, z)) {
      if (y === 0 || y === 1) {
        const [ox, oz] = outs[0];
        const facing = oz === 1 ? "south" : oz === -1 ? "north" : ox === 1 ? "east" : "west";
        const hinge = x === ENTRY_X[0] ? "left" : "right";
        g.set(x, y, z, "dark_oak_door", DOOR(y === 0 ? "lower" : "upper", x, facing, hinge));
      } else g.set(x, y, z, "stone_bricks");                // lintel
      continue;
    }
    if (isJamb(x, z)) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y >= 1 && gaps.has(`${x},${z},${y}`)) continue;     // (ring cells are never gaps; kept for clarity)
    if (windowAt(x, z, y, R) && (y >= 1 || (y === 0))) {
      const [ox] = outs[0];
      const run = ox !== 0 ? "north" : "east";              // a pane joins its neighbours along the wall
      const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
      if (run === "east") { st.east = "true"; st.west = "true"; } else { st.north = "true"; st.south = "true"; }
      g.set(x, y, z, "light_blue_stained_glass_pane", st);
    } else if (y === 0) {
      g.set(x, y, z, "stone_bricks");                        // base course
    } else {
      g.set(x, y, z, "bricks");                              // piers
    }
  }
  // Roof plant on the core: two boxes standing on the roof.
  if (R === 4 && !ring && x >= 10 && x <= 11 && z >= 5 && z <= 6) g.set(x, R, z, "white_concrete");
}

const out = `${DIR}/DC62313.nbt`;
const r = g.save(out);
console.log("saved", out, r);
