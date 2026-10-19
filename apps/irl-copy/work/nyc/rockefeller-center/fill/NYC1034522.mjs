// 1330 Avenue of the Americas, a 1965 Midtown office tower: a 136-block (about 151 m) slab of blue-tinted glass on
// pale spandrels with dark mullions (the Sixth Avenue corporate modern of the period), standing on a 45-block
// stone podium that wraps its west and south sides and a 12-block stone wing in the north-east corner. Footprint
// 29 x 43 (x across, low z = north = the cross street). The lidar gives a flat tower top, so the tower is one tier;
// the podium and wing are flat too. A mechanical penthouse (141) sits on the roof, centred in the slab. The lidar's
// holes inside the tower footprint (roof 0-2, surrounded by tower) are filled as tower, not left as light shafts.
//
// Massing: solid core from y 0 to each top, a 1-block air gap behind every exterior face (no interiors), a floor slab
// at every storey line (y = 0, 3, 6 ...). Facades: a stone base course at y 0, a shopfront (glass with stone piers) at
// y 1-2, then one storey = 3 blocks: a spandrel row, then two rows of glass in bays, with a mullion every third column.
// Warm glowstone sits behind some panes. Two entrances, recessed under canopies: north on the cross street (x 11) and
// west on the avenue (z 20), each with a hanging lantern. A roof covering and a parapet close each top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034522.cells.json`, "utf8"));
const X = 29, Z = 43, Y = 149;

const TOWER = 136, PODIUM = 45, WING = 12, MECH = 141;
const GLASS = "light_blue_stained_glass";

const lidar = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);
const tall = (x, z) => inFoot(x, z) && lidar.get(`${x},${z}`).roof >= 100;

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Tiers from the lidar, smoothed: 0 = open ground (plaza or outside), otherwise the block height of the top.
const TOP = new Map();
for (const [key, { roof }] of lidar) {
  const [x, z] = key.split(",").map(Number);
  let top;
  if (roof >= 100) top = TOWER;
  else if (roof >= 30) top = PODIUM;
  else if (roof >= 9) top = WING;
  else if (roof >= 3) top = 6;
  else top = DIRS.filter(([, dx, dz]) => tall(x + dx, z + dz)).length >= 3 ? TOWER : 0;   // a hole in the tower
  if (top === TOWER && x >= 10 && x <= 14 && z >= 14 && z <= 20) top = MECH;             // penthouse on the roof
  TOP.set(key, top);
}
const topAt = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const open = (x, y, z) => topAt(x, z) <= y;                    // outside the footprint, plaza, or below the top
const nbs = (x, z) => DIRS.map(([d, dx, dz]) => [d, x + dx, z + dz]);
const exterior = (x, y, z) => topAt(x, z) > y && nbs(x, z).some(([, nx, nz]) => open(nx, y, nz));
const ring1 = (x, y, z) => topAt(x, z) > y && !exterior(x, y, z) && nbs(x, z).some(([, nx, nz]) => exterior(nx, y, nz));

const kindOf = (top) => (top === TOWER ? "tower" : top === MECH ? "mech" : "low");
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// The facade block for an exterior cell. u is the position along the face (x on north/south, z on east/west).
function facade(face, x, y, z, top) {
  const u = face === "N" || face === "S" ? x : z;
  const kind = kindOf(top);
  if (y === 0) return { block: "stone_bricks" };                                     // base course
  if (kind === "mech") return { block: y % 3 === 0 ? "light_gray_concrete" : "smooth_quartz" };
  if (y < 3) return u % 3 === 0 ? { block: "smooth_stone" } : { block: GLASS };       // shopfront: glass and piers
  if (y % 3 === 0) return { block: kind === "tower" ? "white_concrete" : "smooth_stone" };   // storey spandrel
  if (u % 3 === 0) return { block: kind === "tower" ? "polished_andesite" : "stone_bricks" }; // mullion or pier
  return { block: GLASS, u };
}

const lamps = [];
const g = new Voxels([X, Y, Z]);
for (const [key] of lidar) {
  const [x, z] = key.split(",").map(Number);
  const top = topAt(x, z);
  if (top === 0) { g.set(x, 0, z, "smooth_stone"); continue; }                       // plaza paving at y 0
  for (let y = 0; y < top; y++) {
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }                // roof covering
    if (exterior(x, y, z)) {
      const face = nbs(x, z).find(([, nx, nz]) => open(nx, y, nz))[0];
      const f = facade(face, x, y, z, top);
      g.set(x, y, z, f.block);
      if (f.u !== undefined && lit(f.u, y, "NSWE".indexOf(face)) && y % 3 !== 0) {
        const [dx, dz] = DIRS.find(([d]) => d === face).slice(1);
        lamps.push([x - dx, y, z - dz]);                                           // glowstone behind the pane
      }
      continue;
    }
    if (ring1(x, y, z) && y % 3 !== 0) continue;                                    // air gap behind the glass
    g.set(x, y, z, y === 0 ? "stone_bricks" : "light_gray_concrete");              // solid core, slab at each storey
  }
  // Parapet on the roof edge: a block above the top where the neighbour is open.
  if (nbs(x, z).some(([, nx, nz]) => open(nx, top, nz))) g.set(x, top, z, "smooth_quartz");
}

// Warm light behind the glass: only in the air gap, never over a floor slab.
for (const [x, y, z] of lamps) if (ring1(x, y, z) && y < topAt(x, z) - 1) g.set(x, y, z, "glowstone");   // never the roof

// North entrance on the cross street: a recessed door under a canopy, with a hanging lantern in the vestibule.
g.set(11, 1, 0, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(11, 2, 0, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 9; x <= 13; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, "smooth_stone");
g.set(11, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// West entrance on the avenue, in the podium, the same way.
g.set(0, 1, 20, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 20, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let z = 18; z <= 22; z++) for (let x = 0; x <= 1; x++) g.set(x, 3, z, "smooth_stone");
g.set(1, 2, 20, "lantern", { hanging: "true", waterlogged: "false" });

g.save(`${DIR}/NYC1034522.nbt`);
