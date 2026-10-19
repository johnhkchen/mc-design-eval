// NYC1022710: Executive Plaza Apts, 76179 7 Avenue (1927), mixed residential and commercial.
// A 1920s setback block in buff brick with limestone trim: a shop-fronted ground storey on a granite base, a
// calcite string course every 3-block storey, glazed bays between brick piers, a brick parapet with a limestone
// cap, and a copper-capped penthouse crown on the tallest (7 Avenue) tower. Roof heights come from the lidar,
// median-smoothed and snapped to storeys. Shell only: the interior is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022710.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 13, D = 27, H = 78;

const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inFp = (x, z) => at.has(`${x},${z}`);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// Roof tier per cell: 3x3 median of the lidar roof, snapped to a storey (3 blocks).
const tierOf = new Map();
for (const [k] of at) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at.get(`${x + dx},${z + dz}`); if (c) vals.push(c.r); }
  tierOf.set(k, 3 * Math.round(median(vals) / 3));
}

// Which sides of a cell face outside the footprint (W = 7 Avenue side at x = 0).
const faces = (x, z) => {
  const f = [];
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  return f;
};

const g = new Voxels([W, H, D]);
const lights = [];                                   // warm lamps on the floor behind some windows
const DOOR = { x: 0, z: 12 };                        // lobby door on the 7 Avenue face

for (const [k, { g: base }] of at) {
  const [x, z] = k.split(",").map(Number);
  const R = tierOf.get(k), f = faces(x, z), bnd = f.length > 0, corner = f.length > 1;
  const alongZ = f.includes("W") || f.includes("E");   // the face runs north-south, so bays count along z
  const idx = alongZ ? z : x;
  if (base === 1) g.set(x, 0, z, "stone_bricks");     // foundation under the ground-1 cells
  for (let y = base; y < R; y++) {
    if (y === R - 1) { if (bnd) g.set(x, y, z, "calcite"); continue; }        // limestone coping
    if (y === R - 2) { g.set(x, y, z, bnd ? "bricks" : "smooth_stone"); continue; }   // parapet / roof slab
    if (!bnd) { if ((y - base) % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }  // interior: floor per storey
    const r = (y - base) % 3, s = Math.floor((y - base) / 3);
    if (x === DOOR.x && z === DOOR.z && s === 0 && r <= 1) {                // lobby door, two blocks high
      g.set(x, y, z, "oak_door", { facing: "east", half: r === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      if (r === 1) lights.push([1, y, z, "lantern", { hanging: "false", waterlogged: "false" }]);
      continue;
    }
    if (r === 0) { g.set(x, y, z, s === 0 ? "polished_granite" : "calcite"); continue; }  // bulkhead / string course
    if (corner) { g.set(x, y, z, "calcite"); continue; }                     // limestone quoins
    if (idx % 3 === 0) { g.set(x, y, z, s === 0 ? "polished_granite" : "bricks"); continue; }  // brick piers
    if (s === 0) { g.set(x, y, z, "glass"); continue; }                     // shop windows
    const side = alongZ ? { north: "true", south: "true", east: "false", west: "false" }
                        : { east: "true", west: "true", north: "false", south: "false" };
    g.set(x, y, z, "glass_pane", { ...side, waterlogged: "false" });
    // A lamp on the floor behind every twelfth upper window of alternate storeys, if the room behind is interior.
    if (s % 2 === 1 && r === 1 && idx % 12 === 4) {
      const [ix, iz] = f.includes("W") ? [x + 1, z] : f.includes("E") ? [x - 1, z] : f.includes("N") ? [x, z + 1] : [x, z - 1];
      if (inFp(ix, iz) && faces(ix, iz).length === 0)
        lights.push([ix, y, iz, (s + idx) % 4 === 0 ? "shroomlight" : "lantern", { hanging: "false", waterlogged: "false" }]);
    }
  }
}

// Penthouse crown on the 66-block tower (7 Avenue side), stepped back, copper cap.
for (const [k, { }] of at) {
  const [x, z] = k.split(",").map(Number), R = tierOf.get(k);
  if (R !== 66 || x > 2 || z < 9 || z > 16) continue;
  for (let y = R - 2; y <= R + 1; y++) g.set(x, y, z, "bricks");
  if (z >= 11 && z <= 14) {
    for (let y = R + 2; y <= R + 3; y++) g.set(x, y, z, "bricks");
    g.set(x, R + 4, z, "copper_block");
  } else {
    g.set(x, R + 2, z, "calcite");
  }
}

// Rooftop water tank on the low north-east wing.
for (const [x, z] of [[10, 0], [11, 0], [10, 1], [11, 1]]) {
  const R = tierOf.get(`${x},${z}`);
  for (let y = R - 2; y <= R + 2; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, R + 3, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

for (const [x, y, z, b, s] of lights) g.set(x, y, z, b, s);

const out = g.save(`${DIR}/NYC1022710.nbt`);
const tiers = {};
for (const v of tierOf.values()) tiers[v] = (tiers[v] || 0) + 1;
console.log("tiers (roof height: cells)", JSON.stringify(tiers));
console.log("saved", out, "lamps", lights.length);
