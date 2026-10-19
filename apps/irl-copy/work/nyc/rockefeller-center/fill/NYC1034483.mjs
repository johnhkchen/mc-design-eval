// 15 West 47th Street, 1926 commercial and office building: a setback brick office tower of the 1916-zoning era, 23 storeys
// (69 blocks, the lidar's 70) on a two-storey granite-and-glass base. Footprint 26 x 27; low z is the 47th Street frontage
// (streets run along x). The lidar's stepped terraces rise from the street to a tower core at z 8-16 and fall again to the
// rear. The lidar is read as clean 3-block tiers (3x3 median, rounded to storeys), with lidar misses inside the footprint
// closed. Each storey is a cream terracotta floor line and a red-brick wall of piers and 2-high glass panes, with a
// terracotta cornice band under the roof cap. Glass sits in the outer skin with air behind it (no interiors) and a floor
// slab per storey; some panes have glowstone behind them. The street has a granite base, a shopfront and a two-leaf
// entrance under a granite lintel and canopy. A mechanical box stands on the rear terrace. Open lidar-0 ground is paving.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034483.cells.json`, "utf8"));
const X = 26, Y = 82, Z = 27;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const nb8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const at = (m, x, z) => m.get(`${x},${z}`) ?? 0;

// 1. A lidar miss inside the building (a zero with most neighbours built) takes its neighbours' median; the rest is open ground.
const roof = new Map();
for (const [key, r] of lidar) {
  if (r > 0) { roof.set(key, r); continue; }
  const [x, z] = key.split(",").map(Number);
  const around = nb8.map(([dx, dz]) => at(lidar, x + dx, z + dz)).filter((v) => v > 0);
  if (around.length >= 5) roof.set(key, median(around));
}

// 2. Clean tiers: 3x3 median of the lidar, rounded to whole storeys, 6 to 69 blocks. A 3-storey box stands on the rear
// terrace at x 11-14, z 21-22 (mechanical equipment on the roof).
const top = new Map();
for (const key of roof.keys()) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const v = at(roof, x + dx, z + dz); if (v > 0) near.push(v); }
  let t = Math.min(69, Math.max(6, 3 * Math.round(median(near) / 3)));
  top.set(key, t);
}
// A second pass takes the median of the rounded tiers around each cell, so one-cell steps merge into their terraces.
const tiers = new Map(top);
for (const key of tiers.keys()) {
  const [x, z] = key.split(",").map(Number);
  const near = [[0, 0], ...nb8].map(([dx, dz]) => at(tiers, x + dx, z + dz)).filter((v) => v > 0);
  top.set(key, 3 * Math.round(median(near) / 3));
}
// Roof equipment: a 3-storey box on the rear terrace.
for (const key of top.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (x >= 11 && x <= 14 && z >= 21 && z <= 22) top.set(key, top.get(key) + 3);
}

const T = (x, z) => top.get(`${x},${z}`) ?? 0;
const open = (x, y, z) => T(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};

// Glass states: a pane joins its neighbours along the face it sits on.
const ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const door = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;

// The skin of one exposed cell: granite base, shopfront and entrance on 47th Street, then the storey pattern.
const skin = (x, y, z, face, t) => {
  if (y === 0) return ["polished_granite"];
  const u = face === "N" || face === "S" ? x : z;
  const street = face === "N" && z === 0;
  if (street && y <= 2) {
    if (x === 12 || x === 13) return ["dark_oak_door", door(y === 1 ? "lower" : "upper", x === 12 ? "left" : "right")];
    if (x === 11 || x === 14) return ["glass_pane", ALONG_X];
    if (x >= 10 && x <= 15) return ["polished_granite"];
    return u % 3 === 0 ? ["polished_granite"] : ["glass_pane", ALONG_X];
  }
  if (street && y === 3 && x >= 10 && x <= 15) return ["polished_granite"];                      // entrance lintel
  if (street && y === 4 && x >= 10 && x <= 15) return ["polished_granite_slab", { type: "bottom", waterlogged: "false" }]; // canopy
  if (y % 3 === 0) return ["white_terracotta"];                                                    // floor line
  if (t >= 12 && y === t - 2) return ["white_terracotta"];                                         // cornice band
  if (u % 3 === 0) return ["bricks"];                                                              // red-brick pier
  return ["glass_pane", face === "N" || face === "S" ? ALONG_X : ALONG_Z];
};

// 3. The plan: every built cell is a solid column from y 0 to its top; exposed cells get the skin, the rest the brick core.
const plan = new Map();
const behind = [];  // glass cells and their inward neighbour, carved to air (or glowstone) below
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, spec) => plan.set(key(x, y, z), spec);
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  const ground = cells.find(([cx, cz]) => cx === x && cz === z)[2];
  for (let y = 0; y < ground; y++) put(x, y, z, ["stone_bricks"]);   // foundation under the ground (none on this flat lot)
  for (let y = ground; y < t; y++) {
    const face = faceOf(x, y, z);
    if (y === t - 1) put(x, y, z, ["smooth_stone"]);                  // roof covering and cornice cap
    else if (!face) put(x, y, z, ["bricks"]);                         // solid core
    else {
      const spec = skin(x, y, z, face, t);
      put(x, y, z, spec);
      if (spec[0] === "glass_pane" || spec[0] === "dark_oak_door") {
        const [dx, dz] = DIRS[face];
        behind.push([x - dx, y, z - dz, key(x, y, z)]);
      }
    }
  }
}
// Open lidar-0 ground inside the footprint is paving.
for (const [k] of lidar) if (!top.has(k)) { const [x, z] = k.split(",").map(Number); put(x, 0, z, ["smooth_stone"]); }

// 4. Air behind every glass cell (no interiors); a warm glowstone behind some panes.
for (const [bx, by, bz] of behind) {
  const k = key(bx, by, bz);
  if (plan.get(k)?.[0] !== "bricks" || faceOf(bx, by, bz)) continue;                  // only the solid core is carved
  if (by % 3 === 0) continue;                                                           // never through a floor slab
  plan.set(k, lit(bx, by, bz) ? ["glowstone"] : null);
}

// 5. Write the voxels.
const g = new Voxels([X, Y, Z]);
for (const [k, spec] of plan) {
  if (!spec) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, spec[0], spec[1]);
}
const out = g.save(`${DIR}/NYC1034483.nbt`);
console.log(JSON.stringify({ footprint: lidar.size, built: top.size, tallest: Math.max(...top.values()), ...out }));
