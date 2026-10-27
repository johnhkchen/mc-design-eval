// Way 24021313, central Auckland: a late-20th-century commercial block (1980s office over a shopfront ground floor).
// Massing: the lidar roof averaged over 5x5 and snapped to 4-block storeys, so the lower wings step up to a 40-44 block
// tower. Materials are the era's precast and tinted glass: light-grey concrete piers, a quartz storey band, grey spandrels,
// blue-tinted glazing, a polished andesite plinth. Each column is solid from y 0 to its tier; the shell is the outer ring
// of each tier, the interior air behind the glass with a floor slab per storey, so every slab and tier rests on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_24021313.cells.json`, "utf8"));
const g = new Voxels([36, 57, 58]);

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(), groundAt = new Map();          // "x,z" -> the lidar roof height / ground above y 0
for (const [x, z, ground, roof] of cells) { roofAt.set(key(x, z), roof); groundAt.set(key(x, z), ground); }

// Tier per cell: the roof averaged over a 5x5 window (edge noise left out), snapped to 4-block storeys, 8 to 44
function tierAt(x, z) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined && r >= 8) { s += r; n++; }
  }
  const m = n ? s / n : 8;
  return Math.min(44, Math.max(8, Math.round(m / 4) * 4));
}
const tierOf = new Map();
for (const k of roofAt.keys()) { const [x, z] = k.split(",").map(Number); tierOf.set(k, tierAt(x, z)); }

const T = (x, z) => tierOf.get(key(x, z)) ?? 0;          // 0 outside the footprint
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const inRegion = (x, z, y) => T(x, z) > y;                // the massing still rises at height y
const outs = (x, z, y) => DIRS.filter(([dx, dz]) => !inRegion(x + dx, z + dz, y));
const shellAt = (x, z, y) => inRegion(x, z, y) && outs(x, z, y).length > 0;
const interiorAt = (x, z, y) => inRegion(x, z, y) && !shellAt(x, z, y);

const PLINTH = "polished_andesite", BAND = "smooth_quartz", PIER = "light_gray_concrete", SPANDREL = "gray_concrete";
const SLAB = "stone", ROOF = "gray_concrete", PARAPET = "smooth_quartz", GLASS = "light_blue_stained_glass_pane";
const DOOR = "iron_door", PLANT = "light_gray_concrete", LANTERN = "lantern";

// The entrance: a shopfront-level shell cell on the north face (outward -z), nearest the middle of the face
const northFace = [...tierOf.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => shellAt(x, z, 1) && x % 3 !== 0 && outs(x, z, 1).length === 1 && outs(x, z, 1)[0].join() === "0,-1");
const doorX = northFace.length ? northFace.reduce((a, b) => (Math.abs(b[0] - 18) < Math.abs(a[0] - 18) ? b : a))[0] : -1;
const doorZ = northFace.length ? northFace.find(([x]) => x === doorX)[1] : -1;

// 1. the massing and its articulation, storey by storey
for (const [k, t] of tierOf) {
  const [x, z] = k.split(",").map(Number);
  const ground = groundAt.get(k);
  for (let y = 0; y < Math.max(1, ground); y++) g.set(x, y, z, PLINTH);      // foundation: solid from y 0 to the ground
  for (let y = 0; y < t; y++) {
    const shell = shellAt(x, z, y);
    if (y === t - 1) { g.set(x, y, z, shell ? PARAPET : ROOF); continue; }     // parapet on the wall, roof over the rest
    const r = y % 4;                                                           // storey row: 0 slab/band, 1-2 glass, 3 spandrel
    if (!shell) {
      if (r === 0) g.set(x, y, z, SLAB);                                       // the floor slab; air behind the glass otherwise
      else if (r === 1 && y > 0 && DIRS.every(([a, b]) => interiorAt(x + a, z + b, y)) && (x * 7 + z * 13 + y * 5) % 19 === 0)
        g.set(x, y, z, LANTERN, { hanging: "false", waterlogged: "false" });   // a warm light two bays back from the glass
      continue;
    }
    const [dx, dz] = outs(x, z, y)[0], corner = outs(x, z, y).length > 1;
    const along = dx !== 0 ? z : x;                                            // position along the facade
    const pier = corner || along % 3 === 0;
    if (r === 0) { g.set(x, y, z, y === 0 ? PLINTH : BAND); continue; }
    if (r === 3) { g.set(x, y, z, SPANDREL); continue; }
    if (pier) { g.set(x, y, z, PIER); continue; }
    if (y <= 2 && x === doorX && z === doorZ) {                               // the entrance, two blocks tall
      g.set(x, y, z, DOOR, { facing: FACING[`${dx},${dz}`], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // glass panes: connected sideways to the neighbouring panes and piers of the same face
    const side = (a, b) => (shellAt(x + a, z + b, y) ? "true" : "false");
    const state = dx !== 0
      ? { north: side(0, -1), south: side(0, 1), east: "false", west: "false" }
      : { north: "false", south: "false", east: side(1, 0), west: side(-1, 0) };
    g.set(x, y, z, t >= 32 ? "cyan_stained_glass_pane" : GLASS, { ...state, waterlogged: "false" });   // the tower's glass reads paler
  }
}

// 2. rooftop plant: small two-block units on the top tier, set back from the parapet, standing on the roof
for (const [k, t] of tierOf) {
  if (t !== 44) continue;
  const [x, z] = k.split(",").map(Number);
  if (x % 5 !== 2 || z % 5 !== 2) continue;
  if (!DIRS.every(([a, b]) => interiorAt(x + a, z + b, 43) && interiorAt(x + 2 * a, z + 2 * b, 43))) continue;
  g.set(x, 44, z, PLANT); g.set(x, 45, z, PLANT);
}

g.save(`${HERE}/way_24021313.nbt`);
