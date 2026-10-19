// 521 Madison Avenue, 1930: a plain-faced Art Deco commercial and office block. A granite plinth and shopfront, eight
// storeys of cream stone piers between tinted glass bays, sandstone-and-terracotta spandrels, a granite cornice and
// parapet, and a stepped penthouse with a gilded finial. Floors are slabs spanning the 3-block air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1035730.cells.json`, "utf8"));

const W = 23, D = 5, EAST = 12;           // footprint x 0..22 (open east end), z 0..4; the building is x 0..12
const ROOF = 24, CORNICE = 23;            // lidar roof is 23 to 25 almost everywhere: one flat tier at 24
const FOUND = "stone", GRANITE = "polished_granite", SAND = "smooth_sandstone", PIER = "quartz_pillar";
const SPANDREL = "white_terracotta", FLOOR = "smooth_stone", DECK = "smooth_stone", PLANT = "light_gray_concrete";
const PANE = "light_blue_stained_glass_pane", LIT = "yellow_stained_glass_pane", GOLD = "gold_block";
const DOORS = [{ z: 0, xs: [4, 5], facing: "north" }, { z: 4, xs: [10, 11], facing: "south" }];

const lidar = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
// Lidar roof 1 at the west corner cells is noise in a wall that stands on the others: fill it with the column.
const built = (x, z) => { const c = lidar.get(`${x},${z}`); return !!c && (c.r > 1 || x === 0); };
// The storey datum of a column is its lowest ground, so one column's floors line up; higher cells get a stone foundation.
const datum = Array.from({ length: W }, (_, x) => {
  let d = Infinity;
  for (let z = 0; z < D; z++) if (built(x, z)) d = Math.min(d, lidar.get(`${x},${z}`).g);
  return d;
});

const outerOf = (x, z) => z === 0 || z === D - 1 || x === 0 || x === EAST;
const doorBay = (x, z, rel) => rel >= 1 && rel <= 2 && DOORS.some((d) => d.z === z && d.xs.includes(x));
// A glass bay: a facade cell between piers (x % 3 == 0), above the base course, not a door.
const isPane = (x, rel, z) => (z === 0 || z === D - 1) && rel >= 1 && rel % 3 !== 0 && x % 3 !== 0 && x !== 0 && x !== EAST && !doorBay(x, z, rel);
const lit = (x, y, z) => isPane(x, y - datum[x], z) && (x * 7 + y * 3 + z * 5) % 11 === 0;
// Panes join their bay partner (east or west), so each bay reads as one two-pane window in a frame of piers.
const paneState = (x) => ({ north: "false", south: "false", east: String(x % 3 === 1), west: String(x % 3 === 2), waterlogged: "false" });

function doorState(x, z, rel) {
  const d = DOORS.find((q) => q.z === z);
  return { facing: d.facing, half: rel === 1 ? "lower" : "upper", hinge: x === d.xs[0] ? "left" : "right", open: "false", powered: "false" };
}

function block(x, y, z) {
  const outer = outerOf(x, z);
  // Penthouse on the centre of the roof, x 4..8, and a rooftop plant box.
  if (x >= 4 && x <= 8 && y >= ROOF) {
    if (y === ROOF) return outer ? [GRANITE] : [FLOOR];
    if (y === ROOF + 1) {
      if (!outer) return x === 4 || x === 8 ? [SAND] : null;
      if (z === 0 || z === D - 1) return x === 4 || x === 8 ? [PIER] : [PANE, { north: "false", south: "false", east: String(x === 5), west: String(x === 7), waterlogged: "false" }];
      return [SAND];
    }
    if (y === ROOF + 2) return [GRANITE];
    if (y === ROOF + 3 && x === 6 && z === 2) return [GOLD];
    return null;
  }
  if ((x === 10 || x === 11) && (z === 1 || z === 2) && (y === ROOF || y === ROOF + 1)) return [PLANT];

  if (!built(x, z)) return null;
  const g = lidar.get(`${x},${z}`).g, d = datum[x], rel = y - d;
  if (y < g) return [FOUND];                       // foundation up to this cell's ground
  if (y === CORNICE) return outer ? [GRANITE] : [DECK];
  if (y === ROOF) return outer ? [SAND] : null;    // parapet on the perimeter
  if (y > ROOF) return null;
  if (rel === 0) return outer ? [GRANITE] : [FLOOR]; // base course, and the ground-storey floor slab
  if (rel % 3 === 0) {                              // floor line: spandrel on the facade, floor slab inside
    if (!outer) return [FLOOR];
    if (doorBay(x, z, 3)) return [GRANITE];          // lintel over the entrance
    return [SPANDREL];
  }
  if (!outer) {                                     // the air gap behind the glass, with warm light in some bays
    if (z === 1 && lit(x, y, 0)) return ["glowstone"];
    if (z === D - 2 && lit(x, y, D - 1)) return ["glowstone"];
    return null;
  }
  if (x === 0 || x === EAST) return z === 2 ? [PANE, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }] : [SAND];
  if (z === 0 || z === D - 1) {
    const door = DOORS.find((q) => q.z === z && q.xs.includes(x));
    if (door && rel >= 1 && rel <= 2) return ["iron_door", doorState(x, z, rel)];
    if (rel < 3) return x % 3 === 0 ? [GRANITE] : lit(x, y, z) ? [LIT, paneState(x)] : [PANE, paneState(x)];
    if (x % 3 === 0) return [PIER];
    return lit(x, y, z) ? [LIT, paneState(x)] : [PANE, paneState(x)];
  }
  return null;
}

const g = new Voxels([23, 37, 5]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < 28; y++) {
  const b = block(x, y, z);
  if (b) g.set(x, y, z, b[0], b[1]);
}
const out = `${HERE}/NYC1035730.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
