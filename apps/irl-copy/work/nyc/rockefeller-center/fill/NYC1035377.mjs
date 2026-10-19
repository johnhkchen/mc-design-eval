// NYC1035377: 352 Madison Avenue, a 1922 commercial office tower read as a 1920s setback block. A granite base with
// shopfront glass and two entrances; brick piers and glass bays between calcite string courses (a storey is 4 blocks:
// belt, two window rows, spandrel); a brick parapet on every tier edge; copper and a lightning rod on the top roof.
// The lidar roof is median-smoothed and mode-filtered into flat tiers, one tier per storey count.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035377.cells.json`, "utf8"));
const W = 48, D = 31, Y = 95;

const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const list = cells.map(([x, z]) => [x, z]);
const has = (x, z) => roof.has(key(x, z));

// Lidar roof -> flat tiers: [roof height in blocks, storeys]. Storey n tops out at cap row 1 + 4n.
const TIERS = [[5, 1], [39, 10], [45, 11], [51, 13], [57, 14], [63, 16], [69, 17], [78, 19], [83, 20]];
const nearest = r => TIERS.reduce((b, t, i) => (Math.abs(t[0] - r) < Math.abs(TIERS[b][0] - r) ? i : b), 0);
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(x + dx, z + dz)) v.push(roof.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
let tier = new Map(list.map(([x, z]) => [key(x, z), nearest(med(x, z))]));
for (let pass = 0; pass < 2; pass++) {                       // mode filter: flat plates, not speckle
  const next = new Map();
  for (const [x, z] of list) {
    const count = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const t = tier.get(key(x + dx, z + dz)); if (t !== undefined) count.set(t, (count.get(t) || 0) + 1);
    }
    let best = tier.get(key(x, z)), n = count.get(best);
    for (const [t, c] of count) if (c > n) { best = t; n = c; }
    next.set(key(x, z), best);
  }
  tier = next;
}
const TOP = new Map([...tier].map(([k, t]) => [k, 1 + 4 * TIERS[t][1]]));   // cap row of each column
const top = (x, z) => TOP.get(key(x, z)) ?? -1;
const maxT = Math.max(...TOP.values());

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// The first side whose neighbour has no solid at height y: the column's wall faces that way (null = interior).
const faceOf = (x, z, y) => Object.keys(DIRS).find(d => top(x + DIRS[d][0], z + DIRS[d][1]) < y) ?? null;
const inward = (x, z, f) => ({ N: [x, z + 1], S: [x, z - 1], E: [x - 1, z], W: [x + 1, z] })[f];
const along = (x, z, f) => (f === "N" || f === "S" ? x : z);   // position along the facade: piers every 3rd

// Entrances: one on the north face at x=24, one on the south face at x=36.
const EN = 24, ES = 36;
const zS = Math.max(...list.filter(([x]) => x === ES).map(([, z]) => z));
const doors = [{ x: EN, z: 0, facing: "north" }, { x: ES, z: zS, facing: "south" }];
const doorAt = (x, y, z) => ((y === 2 || y === 3) ? doors.find(d => d.x === x && d.z === z) : undefined);

// Air gaps: the interior cell behind each window, enclosed by the belt below and the spandrel above.
const lit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 5 === 0;
const gaps = new Set();
for (const [x, z] of list) for (let y = 1; y < top(x, z); y++) {
  const f = faceOf(x, z, y), r = (y - 1) % 4;
  if (!f || r === 0 || r === 3) continue;
  const window = doorAt(x, y, z) || along(x, z, f) % 3 !== 0;
  if (!window) continue;
  const [ix, iz] = inward(x, z, f);
  if (has(ix, iz) && !faceOf(ix, iz, y)) gaps.add(`${ix},${y},${iz}`);
}

const g = new Voxels([W, Y, D]);
for (const [x, z] of list) {
  const T = top(x, z);
  for (let y = 0; y <= T + 1; y++) {
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                  // foundation under every cell
    if (y === T) { g.set(x, y, z, "smooth_stone"); continue; }                     // roof of this tier
    if (y === T + 1) { if (faceOf(x, z, T)) g.set(x, y, z, "stone_bricks"); continue; }   // parapet on the tier edge
    const f = faceOf(x, z, y), r = (y - 1) % 4, band0 = y <= 4;
    if (!f) {                                                                       // interior: solid core, air gaps
      if (!gaps.has(`${x},${y},${z}`)) g.set(x, y, z, "stone");
      else if (r === 1 && lit(x, y, z)) g.set(x, y, z, "glowstone");
      else if (r === 2 && lit(x, y, z)) g.set(x, y, z, "lantern", { hanging: "true" });
      continue;
    }
    const door = doorAt(x, y, z);
    if (r === 0) g.set(x, y, z, band0 ? "polished_granite" : "calcite");          // string course / base course
    else if (r === 3) g.set(x, y, z, band0 ? "polished_granite" : "bricks");       // spandrel
    else if (door) g.set(x, y, z, "dark_oak_door", { facing: door.facing, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (along(x, z, f) % 3 === 0) g.set(x, y, z, band0 ? "polished_granite" : "bricks");   // pier
    else if (band0 && y === 3 && doors.some(e => e.z === z && Math.abs(e.x - x) === 1)) g.set(x, y, z, "lantern", { hanging: "true" });
    else if (band0) g.set(x, y, z, "glass");                                        // shopfront glass
    else g.set(x, y, z, "glass_pane", f === "N" || f === "S"
      ? { north: "false", east: "true", south: "false", west: "true" }
      : { north: "true", east: "false", south: "true", west: "false" });
  }
}

// Roof equipment on the top tier: copper service boxes on a grid, one lightning rod near the centre of the top.
const crown = list.filter(([x, z]) => top(x, z) === maxT && !faceOf(x, z, maxT) && x % 7 === 3 && z % 7 === 3);
for (const [x, z] of crown) g.set(x, maxT + 1, z, "oxidized_cut_copper");
if (crown.length) {
  const [rx, rz] = crown.reduce((b, c) => ((c[0] - 24) ** 2 + (c[1] - 15) ** 2 < (b[0] - 24) ** 2 + (b[1] - 15) ** 2 ? c : b));
  g.set(rx, maxT + 2, rz, "lightning_rod", { facing: "up", powered: "false" });
}

const out = g.save(`${DIR}/NYC1035377.nbt`);
console.log(`NYC1035377.nbt: ${out.blocks} blocks, ${out.palette} palette entries, top ${maxT + 2} blocks, ${cells.length} cells`);
