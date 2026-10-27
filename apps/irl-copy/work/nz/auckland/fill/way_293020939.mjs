// A 1970s concrete-framed office block on the slope, the Newton and Eden Terrace kind: 13 storeys of 4 blocks on a stone
// base, a two-storey-low wing where the lidar drops at the tips, and a plant-room crown on the uphill core. The lidar's
// roofs are flattened into three tiers (53, 61, 65). Tinted glass between concrete piers, a shopfront and a door on the
// uphill street, warm lights behind some windows. The downhill side shows its base and extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020939.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([31, 79, 32]);

const FL0 = 9;   // the ground-floor slab: storeys of 4 above it (floors at 9, 13 ... 57), the crown's floor at 61
const key = (x, z) => `${x},${z}`;
const GROUND = new Map(), TOP = new Map();
for (const [x, z, ground, roof] of cells) {
  GROUND.set(key(x, z), ground);
  TOP.set(key(x, z), roof >= 63 ? 65 : roof <= 56 ? 53 : 61);   // crown, podium, low wing (the 62s are noise: podium)
}
const top = (x, z) => TOP.get(key(x, z)) ?? 0;
const ground = (x, z) => GROUND.get(key(x, z));
const cellsOf = [...TOP.keys()].map((s) => s.split(",").map(Number));

// The faces that look out: no footprint beside them, or a lower tier (a setback's shoulder).
const outward = (x, z) => {
  const t = top(x, z), o = [];
  if (top(x, z - 1) < t) o.push("N");
  if (top(x, z + 1) < t) o.push("S");
  if (top(x + 1, z) < t) o.push("E");
  if (top(x - 1, z) < t) o.push("W");
  return o;
};
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const interior = (x, z) => top(x, z) > 0 && outward(x, z).length === 0;

// The entrance: the middle of the uphill faces (north or west), where the street is at grade, not the buried downhill side.
const front = cellsOf.filter(([x, z]) => {
  const o = outward(x, z);
  return ground(x, z) >= 10 && (o.includes("N") || o.includes("W")) && !o.includes("S") && !o.includes("E");
}).sort(([ax, az], [bx, bz]) => az - bz || ax - bx);
if (!front.length) throw new Error("no uphill face at grade for the entrance");
const [dx, dz] = front[Math.floor(front.length / 2)];
const dFace = outward(dx, dz).includes("N") ? "N" : "W";

const glassFor = (along, k) => ((Math.floor(along / 3) + k) % 3 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

for (const [x, z] of cellsOf) {
  const t = top(x, z), G0 = ground(x, z), o = outward(x, z), edge = o.length > 0;
  const ns = o.includes("N") || o.includes("S"), ew = o.includes("E") || o.includes("W");
  const pier = (ns && ew) || (ns && x % 3 === 0) || (ew && z % 3 === 0);   // concrete piers every third bay, and at corners
  const along = ns ? x : z;

  for (let y = 0; y < t; y++) {
    // base: foundation under the ground, a stone plinth above it (the downhill side's extra height), a polished course on top
    if (y < FL0) { g.set(x, y, z, y < G0 ? "stone" : y === FL0 - 1 ? "polished_andesite" : "stone_bricks"); continue; }
    const rel = y - FL0, k = Math.floor(rel / 4), w = rel % 4;
    if (y === t - 1) { g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone"); continue; }   // parapet, or the roof slab
    if (!edge) {
      // floor slabs; the crown's slab on the podium's roof; nothing between: the air gap is the interior
      if (w === 0 || (y === 60 && t > 61)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (x === dx && z === dz && (y === G0 || y === G0 + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: FACING[dFace], half: y === G0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      const [ix, iz] = [x + INWARD[dFace][0], z + INWARD[dFace][1]];
      if (y === G0) g.set(ix, FL0 + 1, iz, "lantern");   // a lantern just inside the door, on the ground-floor slab
      continue;
    }
    if (y === t - 2 && t !== 65) { g.set(x, y, z, "polished_andesite"); continue; }   // cornice (not the crown's louvres)
    if (t === 65 && y >= 61) {   // the crown: a floor band, louvres of copper grate, and the parapet above
      if (w === 0) g.set(x, y, z, "white_concrete");
      else if (y < t - 1) g.set(x, y, z, "copper_grate");
      continue;
    }
    if (k === 0) {   // ground storey: a base course, shopfront glazing between piers, a fascia course
      g.set(x, y, z, w === 0 ? "polished_andesite" : w === 3 ? "stone_bricks" : pier ? "light_gray_concrete" : "glass");
      continue;
    }
    if (w === 0 || w === 3) { g.set(x, y, z, "white_concrete"); continue; }   // floor line and spandrel
    if (pier) { g.set(x, y, z, "light_gray_concrete"); continue; }
    g.set(x, y, z, glassFor(along, k));

    // a warm light just inside some windows, standing on the floor slab (lanterns on the ground floor's shop side)
    const inw = o.length === 1 ? [x + INWARD[o[0]][0], z + INWARD[o[0]][1]] : null;
    if (w === 1 && inw && interior(...inw) && (x * 7 + z * 11 + k * 5) % 4 === 0) {
      g.set(inw[0], y, inw[1], k === 0 ? "lantern" : "glowstone");
    }
  }
}

// Roof plant on the podium: a few air-handling boxes (concrete with a copper grille) standing on the roof slab.
for (const [x, z] of cellsOf) {
  if (!interior(x, z) || top(x, z) !== 61) continue;
  if ((x * 5 + z * 3) % 23 !== 0) continue;
  g.set(x, 61, z, "light_gray_concrete");
  g.set(x, 62, z, "copper_grate");
}

console.log(g.save(`${DIR}/way_293020939.nbt`), { door: [dx, dz, dFace], front: front.length });
