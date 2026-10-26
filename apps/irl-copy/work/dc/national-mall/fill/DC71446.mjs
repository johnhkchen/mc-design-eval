// 1315 16th St NW (Hotel-Large): a 1920s-30s brick hotel block on a limestone plinth. The street face is the 16-long
// east facade (x = 8) with a glazed entrance bay; the lidar roof (12-14 above y 0) is smoothed into a 12-block main
// body, a 13 shoulder and a 14 core set back from the street, read as storeys on slabs at y 4 and y 8.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC71446.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 9, Z = 16, Y = 26;
const g = new Voxels([X, Y, Z]);

const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, raw: roof });
const has = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. smooth the lidar roof: 3x3 mean, then three flat tiers (12 body, 13 shoulder, 14 core)
const tierOf = new Map();
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!has(x + dx, z + dz)) continue;
    sum += fp.get(`${x + dx},${z + dz}`).raw; n++;
  }
  tierOf.set(key, sum / n);
}
// the smoothed lidar reads a raised mass on the north-east half (x 3-7, z 2-10) with its peak at z 8-10; it is
// drawn as two clean setbacks: a 14 tower on the peak, a 13 shoulder round it, the 12 body everywhere else
const tierAt = (x, z) => {
  const m = tierOf.get(`${x},${z}`);
  if (x >= 3 && x <= 6 && z >= 8 && z <= 10 && m >= 12.9) return 14;
  if ((x >= 4 && x <= 6 && z >= 2 && z <= 7) || (x >= 3 && x <= 7 && z >= 7 && z <= 10)) return 13;
  return 12;
};
for (const key of tierOf.keys()) {
  const [x, z] = key.split(",").map(Number);
  tierOf.set(key, tierAt(x, z));
}
const top = (x, z) => tierOf.get(`${x},${z}`) - 1;         // top layer index of the column (solid y <= top)

// 2. classify faces: a horizontal neighbour outside the footprint or on another tier exposes the wall
const exposedFaces = (x, z, t) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !has(nx, nz) || top(nx, nz) !== t;
});
const isFacade = (x, z, t) => exposedFaces(x, z, t).some(([dx, dz]) => !has(x + dx, z + dz));
// a cell is open interior air if every neighbour is on the same tier (no wall between it and them)
const interior = (x, y, z) => {
  const t = top(x, z);
  if (y < 1 || y >= t) return false;
  if (y === 4 || y === 8) return false;                    // floor slabs
  return DIRS.every(([dx, dz]) => has(x + dx, z + dz) && top(x + dx, z + dz) === t);
};

// 3. shell: plinth, storey slabs, roof cap, walls with windows on the facade bays
// glass bays two wide with a calcite pier every third cell on the street side; the back faces take the opposite
// phase, so no glass lines up with glass across the air gap (no see-through holes to the sky)
const WIN = (s, back) => (back ? s % 3 === 0 : s % 3 !== 0);
const DOOR_Z = [7, 8];
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  const facade = isFacade(x, z, t);
  const exposed = exposedFaces(x, z, t);
  // the facade index runs along the face: z for east/west faces, x for north/south
  const along = exposed.some(([dx]) => dx !== 0) ? z : x;
  const back = exposed.some(([dx, dz]) => dx === -1 || dz === 1);   // west and south faces
  for (let y = 0; y <= t; y++) {
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                         // plinth
    if (y === 4 || y === 8) { g.set(x, y, z, facade ? "calcite" : "smooth_stone"); continue; }  // storey lines
    if (y === t) { g.set(x, y, z, facade ? "calcite" : "smooth_stone"); continue; }    // cornice / roof cap
    if (interior(x, y, z)) continue;                                                     // air gap, no interiors
    if (!facade) { g.set(x, y, z, "bricks"); continue; }                                 // party wall of a tier
    if (y === 1) { g.set(x, y, z, "stone_bricks"); continue; }                           // base course
    if (y === 3) { g.set(x, y, z, "calcite"); continue; }                                // shopfront lintel
    if (y === 2) {                                                                       // shopfront / door bay
      if (x === 8 && DOOR_Z.includes(z)) continue;                                      // door cells set below
      g.set(x, y, z, WIN(along, back) ? "glass_pane" : "calcite"); continue;
    }
    // upper storeys: windows in the bands, brick spandrels elsewhere
    if (y >= 5 && y <= t - 1) {
      g.set(x, y, z, WIN(along, back) ? "glass_pane" : "calcite");
      continue;
    }
    g.set(x, y, z, "bricks");
  }
}

// 4. street entrance: two doors on the east facade, a dark canopy over them, a lantern inside
const door = (y, half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });
for (const z of DOOR_Z) {
  g.set(8, 1, z, "dark_oak_door", door(1, "lower"));
  g.set(8, 2, z, "dark_oak_door", door(2, "upper"));
}
for (let z = 6; z <= 9; z++) g.set(8, 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });   // canopy
g.set(7, 3, 7, "lantern", { hanging: "true", waterlogged: "false" });

// 5. warm light behind some windows (air gap, glowstone on the interior side) and a few roof units
const lights = [[1, 6, 2], [1, 6, 11], [7, 6, 4], [4, 6, 14], [1, 10, 5], [7, 10, 10]];
for (const [x, y, z] of lights) if (interior(x, y, z)) g.set(x, y, z, y === 10 ? "shroomlight" : "glowstone");
for (const x of [2, 6]) for (const z of [4, 9, 13]) {
  if (top(x, z) === 11 && !isFacade(x, z, 11)) g.set(x, 12, z, "iron_block");   // AC units standing on the roof
}

g.save(`${FILL}/DC71446.nbt`);
const tiers = {};
for (const v of tierOf.values()) tiers[v] = (tiers[v] || 0) + 1;
console.log("cells", fp.size, "tiers", JSON.stringify(tiers), "blocks", g.count());
