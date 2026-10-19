// 609 Fifth Avenue, Commercial & Office Buildings, 1925: a stepped limestone office block on a granite base. Lidar roof
// heights (median-smoothed) snap to four flat setback tops (21, 36, 45, 54, 63 blocks: storeys of 3), each column a solid
// envelope with a floor slab per storey and air behind the glass. A shopfront ground floor with a double-door entrance on
// the avenue face, storey lines, a cornice, penthouses on the lower roofs, a crown on the top tier, and warm light behind
// some windows. Lidar roofs near 0 are open paved courts, not building.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035448.cells.json`, "utf8"));
const W = 49, D = 27, Y = 76;

const TIERS = [21, 36, 45, 54, 63];
const snap = (r) => TIERS.reduce((a, t) => (Math.abs(t - r) < Math.abs(a - r) ? t : a));

// Roof heights, 3x3 median to drop single-cell lidar holes, then snapped to the tiers.
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = roof.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r);
  }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const cell = new Map();
for (const [x, z, g] of cells) {
  const m = median(x, z), court = m <= 3;
  cell.set(`${x},${z}`, { g, court, top: court ? g + 1 : snap(m) });   // solid up to top-1; a court is paving at g
}
const C = (x, z) => cell.get(`${x},${z}`);
// Open to air at height y: outside the footprint, on a court, or its column ends at or below y.
const open = (x, z, y) => { const c = C(x, z); return !c || c.court || c.top <= y; };
const edgeX = (x, z, y) => open(x - 1, z, y) || open(x + 1, z, y);
const edgeZ = (x, z, y) => open(x, z - 1, y) || open(x, z + 1, y);
const indoorRoof = (x, z, y) => !open(x - 1, z, y) && !open(x + 1, z, y) && !open(x, z - 1, y) && !open(x, z + 1, y);

const v = new Voxels([W, Y, D]);
const panes = [], lamps = [];

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const { g, top, court } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, "polished_granite");               // foundation to the lowest ground
  if (court) { v.set(x, g, z, "stone_bricks"); continue; }
  for (let y = g; y < top; y++) {
    const ex = edgeX(x, z, y), ez = edgeZ(x, z, y);
    if (!ex && !ez) {                                                           // inside: floor per storey, roof on top
      if (y === g || (y % 3 === 0 && y > g)) v.set(x, y, z, "smooth_stone");
      else if (y === top - 1) v.set(x, y, z, "gray_concrete");
      continue;
    }
    const corner = ex && ez;
    const pier = corner || (ex ? z : x) % 3 === 0;                              // bays of 2 glass, 1 pier
    let b;
    if (y === top - 1) b = "polished_granite";                                   // cornice
    else if (y < g + 2) b = pier ? "polished_granite" : "glass_pane";            // shopfront
    else if (y === g + 2 || y % 3 === 0) b = "smooth_quartz";                    // storey lines
    else b = pier ? "calcite" : "light_blue_stained_glass_pane";                 // limestone piers, office glass
    v.set(x, y, z, b);
    if (b === "glass_pane" || b === "light_blue_stained_glass_pane") panes.push([x, y, z, b]);
    if (b === "light_blue_stained_glass_pane" && !corner && (x * 5 + z * 3 + y) % 17 === 0) {
      const ix = ex ? (open(x - 1, z, y) ? x + 1 : x - 1) : x;                   // one cell inside the glass
      const iz = ex ? z : (open(x, z - 1, y) ? z + 1 : z - 1);
      lamps.push([ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight"]);
    }
  }
}

// Entrance on the avenue face (x = 0): piers frame a double iron door; the lintel band runs across the bay.
for (const z of [11, 14]) { const c = C(0, z); if (c && !c.court) for (let y = c.g; y < c.g + 2; y++) v.set(0, y, z, "polished_granite"); }
for (let z = 11; z <= 14; z++) { const c = C(0, z); if (c && !c.court) v.set(0, c.g + 2, z, "polished_granite"); }
for (const z of [12, 13]) {
  const c = C(0, z); if (!c || c.court) continue;
  for (const [dy, half] of [[0, "lower"], [1, "upper"]])
    v.set(0, c.g + dy, z, "iron_door", { facing: "west", half, hinge: z === 12 ? "left" : "right", open: "false", powered: "false" });
}

// Roof plant: penthouses on the interior roofs of the lower tiers.
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (c.court || c.top >= 63 || (x * 7 + z * 11) % 23 !== 0 || !indoorRoof(x, z, c.top - 1)) continue;
  v.set(x, c.top, z, "stone_bricks"); v.set(x, c.top + 1, z, "stone_bricks"); v.set(x, c.top + 2, z, "polished_granite");
}

// Crown on the top tier: calcite stepping down from the middle of the interior roof, a copper cap and a rod.
const top = [...cell].filter(([, c]) => c.top === 63 && !c.court).map(([k]) => k.split(",").map(Number))
  .filter(([x, z]) => indoorRoof(x, z, 62));
const mx = top.reduce((s, [x]) => s + x, 0) / top.length, mz = top.reduce((s, [, z]) => s + z, 0) / top.length;
const dist = ([x, z]) => Math.hypot(x - mx, z - mz);
const [centre] = [...top].sort((a, b) => dist(a) - dist(b));
for (const p of top) {
  const d = dist(p), [x, z] = p;
  if (d <= 2.5) { v.set(x, 63, z, "calcite"); v.set(x, 64, z, "calcite"); }
  if (d <= 1.2) v.set(x, 65, z, "calcite");
}
v.set(centre[0], 66, centre[1], "oxidized_copper");
v.set(centre[0], 67, centre[1], "lightning_rod");

// Warm light behind some windows, only where the air gap is still air.
for (const [x, y, z, b] of lamps) if (C(x, z) && !C(x, z).court && v.get(x, y, z) === null) v.set(x, y, z, b);

// Panes connect to whatever solid is beside them, so the glass reads as a grid of windows in stone frames.
const solid = (x, y, z) => v.get(x, y, z) !== null;
for (const [x, y, z, b] of panes)
  v.set(x, y, z, b, { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), west: String(solid(x - 1, y, z)), east: String(solid(x + 1, y, z)) });

const out = v.save(`${DIR}/NYC1035448.nbt`);
console.log(JSON.stringify({ ...out, footprint: cells.length, tiers: TIERS, crownCentre: centre, lamps: lamps.length }));
