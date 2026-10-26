// A three-tier pavilion block: a c.1900 red-brick commercial building with a limestone base course, lintel band,
// and a stone parapet. The lidar reads 4 blocks on the flanks and 5 in the centre 3-wide bay; the column mode of the
// roof readings (per x, across the four rows) snaps the noise to two flat tiers. The centre rises one storey above the
// flanks, so the step is a pedimented bay, with a shopfront and a dark oak door on the street (north, z 0) face.
// Every column is solid from y 0 to its top, with a stone floor slab at y 2 and a roof deck over each tier, so nothing
// floats. The interior is an air gap behind every pane (a lit glowstone in a few), not a room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74870.cells.json`, "utf8"));

const W = 7, D = 4, H = 17;
const g = new Voxels([W, H, D]);

// ---- massing: per x column, the mode of the roof tiers across the rows; a tier is 5 blocks at 4.5 and up ----
const tierOf = (m) => (m >= 4.5 ? 5 : 4);
const top = [];
for (let x = 0; x < W; x++) {
  const counts = new Map();
  for (const [cx, , , roof] of cells) if (cx === x) { const t = tierOf(roof); counts.set(t, (counts.get(t) ?? 0) + 1); }
  top[x] = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}
const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D && top[x] !== undefined;
const perim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const BRICK = "bricks", LIMESTONE = "calcite", BASE = "polished_granite", COURSE = "stone_bricks", CORNICE = "smooth_stone";
const GLASS = "glass_pane", DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const filled = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); filled.add(key(x, y, z)); };

// ---- main pass: each column solid up to its top; face articulation on the perimeter ----
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const t = top[x], ext = perim(x, z);
  for (let y = 0; y < t; y++) {
    if (y === 0) { put(x, y, z, ext ? BASE : "stone"); continue; }                         // plinth; stone foundation
    if (y === t - 1) { put(x, y, z, ext ? CORNICE : "smooth_stone"); continue; }          // parapet / roof deck
    if (y === 2) { put(x, y, z, ext ? (corner(x, z) ? LIMESTONE : COURSE) : "stone"); continue; }  // lintel band, slab
    if (!ext) continue;                                                                     // interior: air behind glass
    if (corner(x, z)) { put(x, y, z, LIMESTONE); continue; }                               // quoins
    if (y === 1) {                                                                          // ground floor
      if (z === 0) { if (x === 3) continue; put(x, y, z, x === 1 || x === 2 || x === 4 || x === 5 ? GLASS : BRICK); continue; }
      if (z === D - 1) { put(x, y, z, x === 3 ? GLASS : BRICK); continue; }                // back: one window, no see-through
      put(x, y, z, z === 1 ? GLASS : BRICK); continue;                                      // ends: one bay, one pier
    }
    if (y === 3) {                                                                          // centre upper window row
      if (z === 0 || z === D - 1) put(x, y, z, x === 3 ? BRICK : GLASS);
    }
  }
}

// ---- entrance: dark oak door on the street face, lower half at y 1 and upper half at y 2 ----
put(3, 1, 0, "dark_oak_door", { ...DOOR, half: "lower" });
put(3, 2, 0, "dark_oak_door", { ...DOOR, half: "upper" });

// ---- glass panes connect to neighbouring solids and panes, so each window reads as a framed grid ----
const isFilled = (x, y, z) => filled.has(key(x, y, z));
for (const k of [...filled]) {
  const [x, y, z] = k.split(",").map(Number);
  const pane = g.get(x, y, z)?.block === GLASS;
  if (!pane) continue;
  g.set(x, y, z, GLASS, {
    north: String(isFilled(x, y, z - 1)), south: String(isFilled(x, y, z + 1)),
    east: String(isFilled(x + 1, y, z)), west: String(isFilled(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: glowstone set just inside a few windows, in the air gap ----
const lit = [[2, 1, 1], [4, 1, 2], [2, 3, 1], [4, 3, 2]];
for (const [x, y, z] of lit) if (!isFilled(x, y, z)) g.set(x, y, z, "glowstone");

// ---- roof: a brick chimney stack on the centre roof deck ----
for (const y of [5, 6]) g.set(3, y, 1, BRICK);

const counts = g.save(`${DIR}/DC74870.nbt`);
console.log("saved DC74870.nbt", counts, "tiers", top.join(","));
