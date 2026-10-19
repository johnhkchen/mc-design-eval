// 608 Fifth Avenue, 1932: an Art Deco commercial and office block of the Rockefeller Center years. Granite base and
// shopfronts at street level, pale smooth limestone-look walls in 3-block storeys, glass sash between quartz piers,
// stepped setbacks from a 42-block wing up to a 54-block tower with a stepped copper-capped crown. Lidar roof heights
// smoothed into flat tiers: the tower at 54, its ring at 51, wings at 45, 42 and 39, a court at 15, a west wing at 21.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034508.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inF = (x, z) => ground.has(key(x, z));

// Roof surface (y of the top of the tier) for each footprint cell; 0 = open ground, no building above the foundation.
function topOf(x, z) {
  if (x === 0) return z >= 20 ? 9 : 21;                                       // west edge, flush with the wing (lidar's 26 is a 1-cell strip)
  if (x <= 5 && z <= 19) return 21;                                           // west wing
  if (x <= 3) return 0;                                                       // open lots on the south-west
  if (x <= 5) return 9;                                                       // low two-storey shed
  if (z <= 1 && ((x >= 13 && x <= 17) || (x >= 28 && x <= 32) || x >= 40)) return 39;   // notches on the north edge
  if (z <= 5 && x >= 18 && x <= 27) return 15;                                // low court at the north
  if (z <= 5) return 42;                                                      // north wings
  if (x >= 17 && x <= 29 && z <= 11) return 45;                               // central wing over the court
  if (x <= 9 && z >= 6 && z <= 13) return 45;                                 // north-west corner block
  if (x <= 16 && z <= 11) return 42;
  if (x >= 30 && z <= 11) return 42;
  if (z >= 12 && z <= 18 && x >= 13 && x <= 32) return 54;                    // the tower
  if (z === 12 || z === 13) return x <= 12 ? 45 : 54;
  if (x >= 6 && x <= 12 && z >= 14 && z <= 23) return 51;                     // south-west ring
  if (x >= 13 && x <= 16 && z >= 19) return 51;
  if (x >= 33 && x <= 34 && z >= 12 && z <= 18) return 51;                    // east ring
  if (x >= 6 && x <= 16 && z >= 24 && z <= 25) return 45;
  if (x >= 6 && x <= 16 && z >= 26) return 42;
  return 42;                                                                  // east block
}
const top = new Map(cells.map(([x, z]) => [key(x, z), topOf(x, z)]));
const T = (x, z) => (inF(x, z) ? top.get(key(x, z)) : 0);

// Which sides of a cell face open air (outside the footprint, or a lower tier) at height y.
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const FACING = { E: "east", W: "west", S: "south", N: "north" };
const exposedDirs = (x, z, y) => {
  const t = T(x, z);
  return Object.entries(DIRS).filter(([, [dx, dz]]) => { const rn = T(x + dx, z + dz); return rn < t && y >= rn; }).map(([d]) => d);
};

// Street-level entrances on the north face of the 42 wing and the east face of the east block.
const doors = new Map([[key(8, 0), "N"], [key(43, 9), "E"]]);

// The facade of one wall cell: quartz corner piers, quartz piers every third bay, glass sash between, granite
// at street level. A pane connects along the wall it sits in.
function facade(x, z, k, exp) {
  const ew = exp.includes("E") || exp.includes("W");
  const ns = exp.includes("N") || exp.includes("S");
  if (ew && ns) return { block: "quartz_pillar", state: { axis: "y" } };
  const bay = ew ? z : x;
  if (bay % 3 === 0) return k === 0 ? { block: "polished_granite" } : { block: "quartz_pillar", state: { axis: "y" } };
  return ew
    ? { block: "glass_pane", state: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } }
    : { block: "glass_pane", state: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } };
}

const g = new Voxels([44, 65, 28]);
const lamps = [];
for (const [x, z, gr] of cells) {
  const t = T(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");                       // foundation to the lowest ground under the cell
  if (t === 0) continue;
  for (let y = gr; y < 3; y++) g.set(x, y, z, "polished_granite");           // granite base course to the street datum (y 3)
  const perim = exposedDirs(x, z, t - 1).length > 0;
  for (let y = Math.max(gr, 3); y <= t + 1; y++) {
    if (y === t + 1) { if (perim) g.set(x, y, z, "polished_granite"); continue; }             // cap of the parapet
    if (y === t) { if (perim) g.set(x, y, z, "smooth_quartz"); continue; }                    // parapet
    if (y === t - 1) { g.set(x, y, z, "stone_bricks"); continue; }                            // roof deck
    const k = Math.floor((y - 3) / 3);
    const door = doors.get(key(x, z));
    if (door && (y === 3 || y === 4)) {                                       // door, lower and upper half
      g.set(x, y, z, "dark_oak_door", { facing: FACING[door], half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && y === 5) { g.set(x, y, z, "polished_granite"); continue; }   // lintel over the entrance
    if ((y - 3) % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }     // storey line and floor slab
    const exp = exposedDirs(x, z, y);
    if (exp.length === 0) continue;                                           // interior: air behind the glass
    const f = facade(x, z, k, exp);
    g.set(x, y, z, f.block, f.state);
    if (f.block === "glass_pane" && y === 3 * k + 4 && (x * 3 + z * 5 + k * 2) % 7 === 0) {
      // warm light behind some bottom-row windows: one cell in, on the floor slab
      const inward = exp[0], [dx, dz] = DIRS[inward];
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && T(ix, iz) > y && exposedDirs(ix, iz, y).length === 0) lamps.push([ix, y, iz, (x + z + k) % 3 === 0 ? "shroomlight" : "glowstone"]);
    }
  }
}
for (const [x, y, z, b] of lamps) g.set(x, y, z, b);

// Roof: a stepped copper-capped crown on the tower, and two plant boxes on the 42 wing.
for (let y = 54; y <= 56; y++) for (let x = 19; x <= 26; x++) for (let z = 13; z <= 17; z++) g.set(x, y, z, "smooth_quartz");
for (let y = 57; y <= 59; y++) for (let x = 21; x <= 24; x++) for (let z = 14; z <= 16; z++) g.set(x, y, z, "smooth_quartz");
for (let y = 60; y <= 61; y++) g.set(22, y, 15, "polished_granite").set(23, y, 15, "polished_granite");
g.set(22, 62, 15, "copper_block").set(23, 62, 15, "copper_block");
for (let y = 42; y <= 43; y++) for (let x = 37; x <= 38; x++) for (let z = 3; z <= 4; z++) g.set(x, y, z, "iron_block");

const { blocks, palette } = g.save(`${dir}/NYC1034508.nbt`);
console.log(`NYC1034508.nbt: ${blocks} blocks, palette ${palette}`);
