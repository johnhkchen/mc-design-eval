// 418 Madison Avenue, 1927 commercial and office building: a 17-storey (about 53-block, 59 m) setback office block in
// buff limestone with cut-stone spandrel bands, a chiseled cornice and a dark granite base, the 1920s Midtown type that
// carries a stepped crown. Footprint 22 x 10 (x along the street, low z = north = the street frontage at z 0, with the
// entrance and shopfront; the rear at z 9). Lidar roof read as clean tiers, not cell by cell: a 51-block shaft across
// most of the lot, a 53-block crown at the middle with a 56-block pinnacle, a 44-block wing along the east end (with a
// penthouse), a 38-block low wing at the west end and 1-block paved terrace and courts where the lidar has no roof.
// Each storey is 3 blocks: a cut-stone band on the floor line, then two rows of glass panes between smooth-stone piers.
// The street storey is shopfront glass on granite piers, a dark-oak door under a canopy, and a lobby lantern. No
// interiors: a floor slab per storey and air behind the glass, with glowstone set behind some upper panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035438.cells.json`, "utf8"));
const X = 22, Y = 60, Z = 10;

// Massing: H[x][z] = blocks built above y 0 (0 = nothing; a court is paved at y 0 only).
const H = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, , roof] of cells) {
  let h;
  if (roof <= 2) h = 1;                                  // open ground, paved terrace or a lightwell floor
  else if (roof <= 40) h = 38;                           // west low wing
  else if (roof <= 48) h = 44;                           // east wing and its neighbours
  else h = 51;                                           // the shaft
  H[x][z] = h;
}
// The crown: a 53-block block at the middle of the shaft, and a 56-block pinnacle in its centre.
for (let x = 7; x <= 14; x++) for (let z = 3; z <= 6; z++) if (H[x][z] === 51) H[x][z] = 53;
for (let x = 10; x <= 11; x++) for (let z = 4; z <= 5; z++) H[x][z] = 56;

const at = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[x][z]);
const g = new Voxels([X, Y, Z]);
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // pane on a z face
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on an x face
const ENTRANCE = (x) => x >= 9 && x <= 11;
const lit = (bay, y) => (bay * 5 + y * 7) % 11 === 0;   // sparse, deterministic warm windows

// Exterior: the footprint's edge, or a side whose neighbour tops out at this height or one below (a step keeps its wall).
const exterior = (x, y, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => at(x + dx, z + dz) <= y + 1);
const glowAt = [];

// 1. Solid mass, cell by cell: pinnacle as a core, base course, floor slabs, a roof cap, cornices, facade rows.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const h = H[x][z];
  if (!h) continue;
  if (h === 56) {                                        // pinnacle: solid core to its top, chiseled at the top
    for (let y = 0; y < 56; y++) g.set(x, y, z, y >= 53 ? "chiseled_sandstone" : "smooth_sandstone");
    if (x === 10 && z === 4) g.set(x, 56, z, "end_rod", { facing: "up" });
    continue;
  }
  for (let y = 0; y < h; y++) {
    const ext = exterior(x, y, z);
    // Entrance canopy: a dark-oak lintel across the door bays, above the street storey.
    if (z === 0 && y === 3 && x >= 8 && x <= 12) { g.set(x, y, z, "dark_oak_planks"); continue; }
    if (y === 0) { g.set(x, y, z, ext ? "polished_granite" : "smooth_stone"); continue; }   // base course and floor
    if (y === h - 1) { g.set(x, y, z, "smooth_stone"); continue; }                         // roof cap
    if (ext && y >= h - 3) { g.set(x, y, z, "chiseled_sandstone"); continue; }             // cornice
    if (y % 3 === 0) { g.set(x, y, z, ext ? "cut_sandstone" : "smooth_stone"); continue; } // storey line, slab inside
    if (!ext) continue;                                                                      // air behind the glass
    // Facade: street face z 0 with the shopfront; the rear z 9; the x ends; holes and steps by x + z.
    const bay = z === 0 || z === Z - 1 ? x : x === 0 || x === X - 1 ? z : x + z;
    const pier = bay % 3 === 0;
    const street = z === 0;
    const inward = z === 0 ? [x, y, 1] : z === Z - 1 ? [x, y, Z - 2] : x === 0 ? [1, y, z] : x === X - 1 ? [X - 2, y, z] : null;
    if (y < 3) {                                         // street storey (rows 1-2)
      if (street && ENTRANCE(x)) {
        if (x === 10) {                                  // dark-oak door, both halves
          const st = { facing: "north", hinge: "left", open: "false", powered: "false" };
          g.set(x, 1, z, "dark_oak_door", { ...st, half: "lower" });
          g.set(x, 2, z, "dark_oak_door", { ...st, half: "upper" });
        } else g.set(x, y, z, "dark_oak_planks");
        continue;
      }
      if (street) g.set(x, y, z, pier ? "polished_granite" : "light_blue_stained_glass_pane", pier ? undefined : NS);
      else g.set(x, y, z, "polished_granite");           // base course on the sides and rear
      continue;
    }
    if (pier) { g.set(x, y, z, "smooth_sandstone"); continue; }
    g.set(x, y, z, "gray_stained_glass_pane", z === 0 || z === Z - 1 ? NS : EW);
    if (inward && lit(bay, Math.floor(y / 3)) && y % 3 !== 0) glowAt.push(inward);
  }
}

// 2. Warm glow behind the upper panes, and a lobby lantern inside the door.
for (const [x, y, z] of glowAt) if (!g.get(x, y, z)) g.set(x, y, z, "glowstone");
g.set(10, 1, 1, "lantern", { hanging: "false" });

// 3. Roof equipment: a penthouse on the east wing, and a plant box on the shaft's rear.
for (let y = 44; y <= 45; y++) for (let z = 4; z <= 6; z++) g.set(21, y, z, y === 45 ? "chiseled_sandstone" : "smooth_sandstone");
for (let y = 51; y <= 52; y++) for (let x = 4; x <= 5; x++) for (let z = 6; z <= 7; z++) g.set(x, y, z, "stone_bricks");

// 4. Check: no solid block with air below that is not carried by a solid neighbour at its own height (a floor slab
// rests on the walls around it, so it is carried; a lone block over air would float). Report it.
const solid = (x, y, z) => !!g.get(x, y, z);
const floating = [];
for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) for (let z = 0; z < Z; z++) {
  if (solid(x, y, z) && !solid(x, y - 1, z) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz))) floating.push([x, y, z]);
}
if (floating.length) console.warn(`floating blocks: ${floating.length}, first ${JSON.stringify(floating.slice(0, 8))}`);

const out = g.save(`${DIR}/NYC1035438.nbt`);
console.log(JSON.stringify(out));
