// Way 332241904, Eden Terrace side of Mt Eden: a 1910s brick-and-plaster commercial block, three storeys on a basalt-stone
// plinth, parapet and cornice in cream terracotta. The lidar roof (1-18 above y 0) snaps to four flat tiers (18, 14, 10
// and a plinth-level terrace at 6) so each setback steps in cleanly. The plinth runs to the high-side grade (y 6) so one
// set of floor lines serves the whole block, and the low side shows the extra storey as a basement. Only the outer ring
// is built: the facade is one block thick with an air gap behind the glass; interiors are air except one floor slab per
// storey. Every slab, tier and parapet stands on the course below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241904.cells.json`, "utf8"));
const X = 38, Z = 24, H = 31;
const g = new Voxels([X, H, Z]);

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFp = (x, z) => byXZ.has(key(x, z));

// the lidar roof snapped to a flat tier: the absolute top of the cell's parapet (or terrace at 6)
const tierTop = (roof) => (roof >= 17 ? 18 : roof >= 13 ? 14 : roof >= 9 ? 10 : 6);
const tops = new Map([...byXZ].map(([k, c]) => [k, tierTop(c.roof)]));
const topAt = (x, z) => tops.get(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const FACING = { N: "north", S: "south", E: "east", W: "west" };

// the directions a footprint cell shows outward: off the footprint, or down a step to a lower tier
function faces(x, z) {
  const t = topAt(x, z), out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || topAt(nx, nz) < t) out.push(d);
  }
  return out;
}
function faceKind(fs) {
  const ns = fs.some((d) => d === "N" || d === "S"), ew = fs.some((d) => d === "E" || d === "W");
  return ns && ew ? "corner" : ns ? "ns" : ew ? "ew" : null;
}
// facade bays: a pier every third cell along each face, the rest windows; corners are piers
const isWindow = (x, z, fs) => {
  const k = faceKind(fs);
  return k === "ns" ? x % 3 !== 0 : k === "ew" ? z % 3 !== 0 : false;
};
const paneState = (fs) => {
  const ns = faceKind(fs) === "ns";
  return { east: String(ns), west: String(ns), north: String(!ns), south: String(!ns), waterlogged: "false" };
};

// the entrance: a street-level bay on the south or east face, on the highest grade, nearest the block's middle
let entry = null;
for (const [k, c] of byXZ) {
  const [x, z] = k.split(",").map(Number), fs = faces(x, z), kind = faceKind(fs);
  if (topAt(x, z) < 10 || (kind !== "ns" && kind !== "ew")) continue;
  const out = fs.find((d) => (d === "S" || d === "E") && !inFp(x + DIRS[d][0], z + DIRS[d][1]));
  if (!out) continue;
  const score = c.ground * 10 - Math.abs(x - 19);
  if (!entry || score > entry.score) entry = { x, z, out, score };
}

for (const [k, c] of byXZ) {
  const [x, z] = k.split(",").map(Number), t = topAt(x, z), fs = faces(x, z), ring = fs.length > 0;

  // plinth: solid from y 0 to the ground-floor line, so nothing floats over the slope
  for (let y = 0; y < 6; y++) g.set(x, y, z, (x + z + y) % 5 === 0 ? "mossy_stone_bricks" : "stone_bricks");

  if (t === 6) {                                    // low wing: plinth roof as a terrace with a low balustrade
    g.set(x, 6, z, "white_terracotta");
    if (ring) g.set(x, 7, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  if (!ring) {                                      // interior: air, one slab per storey line and the roof
    g.set(x, 6, z, "smooth_stone");
    for (const L of [10, 14, 18]) if (t >= L) g.set(x, L, z, "smooth_stone");
    if (t === 18 && (x * 5 + z * 7) % 13 === 0) g.set(x, 19, z, "iron_block");     // roof plant on the top tier
    if (t === 14 && (x * 3 + z * 5) % 11 === 0) g.set(x, 15, z, "iron_block");
    continue;
  }

  // the facade ring
  const win = isWindow(x, z, fs), door = entry && entry.x === x && entry.z === z;
  for (let r = 6; r <= t; r++) {
    let b = "bricks", s;
    if (r === t) b = "stone_bricks";                                              // parapet
    else if (r === t - 1) b = "white_terracotta";                                 // cornice
    else if (r === 6 || r === 10 || r === 14) b = "white_terracotta";             // string courses and sills
    else if (r === 7 || r === 8) { if (win) b = "glass"; }                        // shopfront glass
    else if (r === 11 || r === 12 || r === 15 || r === 16) { if (win) { b = "glass_pane"; s = paneState(fs); } }
    if (door && (r === 7 || r === 8)) {
      g.set(x, r, z, "dark_oak_door", { facing: FACING[entry.out], half: r === 7 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && r === 9) { g.set(x, r, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); continue; }
    g.set(x, r, z, b, s);
  }

  // warm light: glowstone on the inside of some ground and upper windows, in the air gap behind the glass
  if (win && !door) {
    const inward = OPP[fs.find((d) => "NSEW".includes(d))];
    const [dx, dz] = DIRS[inward], ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && faces(ix, iz).length === 0) {
      for (const r of [7, 8, 11, 12, 15, 16]) {
        if (r > t - 2) continue;
        if ((x + z + r) % 4 === 0) g.set(ix, r, iz, "glowstone");
      }
    }
  }
}

// a lantern on the wall above the door, under the canopy's lip
if (entry) {
  const [dx, dz] = DIRS[entry.out];
  const beside = [entry.x - dz, entry.z + dx];   // one cell along the facade
  if (inFp(...beside) && faces(...beside).length > 0) g.set(beside[0], 9, beside[1], "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/way_332241904.nbt`);
console.log(`way_332241904: ${g.count()} blocks, entrance ${entry ? `${entry.x},${entry.z} facing ${entry.out}` : "none"}`);
