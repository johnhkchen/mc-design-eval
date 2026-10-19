// DC76100: Clara Barton Missing Soldiers Office Museum, 7th St NW (Penn Quarter). Store-Misc in the record, so a
// late-19th-century red-brick commercial block: a ground-floor shopfront, three storeys of brick with stone belts and
// a cornice, a three-storey setback on the court side and a one-storey wing on the low end. Massing follows the
// lidar roof, 3x3-median smoothed and snapped to three flat tiers (wing 8, setback 15, main 19).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76100.cells.json`, "utf8"));

// Footprint and lidar roof (the fourth number) per cell.
const key = (x, z) => `${x},${z}`;
const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(key(x, z), r);
const inF = (x, z) => roofAt.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 3x3 median over footprint cells, then snap to tiers: wing (1 storey), setback (3), main (4).
const tierTop = (s) => (s <= 9 ? 8 : s <= 16 ? 15 : 19);
const T = new Map();
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(roofAt.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  T.set(k, tierTop(vals[vals.length >> 1]));
}
const top = (x, z) => T.get(key(x, z));

// Floors (storey lines) sit on y=2, above the highest ground (2); everything below is solid foundation.
const FLOORS = [2, 6, 10, 14];
const FOUND = 2;

// A cell is a wall if its outside neighbour is open ground or a lower tier; otherwise it is interior.
const perim = (x, z) => { const t = top(x, z); return NB.some(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) < t); };
const exposedX = (x, z, t) => [1, -1].some((dx) => !inF(x + dx, z) || top(x + dx, z) < t);

const GRANITE = "polished_granite", BRICK = "bricks", STONE = "smooth_stone", CORNICE = "polished_andesite";
const ROOF = "stone_bricks", PARAPET = "stone_brick_wall", SHOP = "dark_oak_planks", PANE = "glass_pane";

const paneState = (alongZ) => (alongZ
  ? { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" }
  : { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" });

// Wall block for a perimeter cell at height y: cornice course under the roof, a belt course at each floor,
// window bays (glass panes between brick piers) and a brick head course; the ground floor is a shopfront.
function wall(x, z, y, t) {
  if (y === t - 2) return { block: CORNICE };
  const fl = FLOORS.filter((f) => f <= y && f <= t - 3).pop();
  const o = y - fl, ground = fl === 2;
  const alongZ = exposedX(x, z, t);            // the face runs north-south, bays counted along z
  const k = alongZ ? z : x;
  if (o === 0) return { block: ground ? GRANITE : STONE };
  if (o === 3) return { block: ground ? SHOP : BRICK };
  if (k % 3 === 0) return { block: ground ? SHOP : BRICK };
  return { block: PANE, state: paneState(alongZ) };
}

const g = new Voxels([30, 31, 54]);
const perimCells = [];
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number), t = top(x, z), p = perim(x, z);
  for (let y = 0; y < FOUND; y++) g.set(x, y, z, GRANITE);          // foundation: nothing floats on the slope
  g.set(x, t - 1, z, ROOF);                                          // roof slab over the whole tier
  if (p) {
    perimCells.push([x, z]);
    for (let y = FOUND; y <= t - 2; y++) {
      const w = wall(x, z, y, t);
      g.set(x, y, z, w.block, w.state);
    }
    if (t === 19) {                                                  // main roof: parapet on the outer ring
      const alongZ = exposedX(x, z, t);
      g.set(x, 19, z, PARAPET, alongZ ? { north: "low", south: "low", east: "none", west: "none", up: "true", waterlogged: "false" }
        : { east: "low", west: "low", north: "none", south: "none", up: "true", waterlogged: "false" });
    }
  } else {
    for (const fl of FLOORS) if (fl <= t - 3) g.set(x, fl, z, STONE);   // interior: a floor slab per storey, air between
  }
}

// Entrance on the west face at the middle of the shopfront: a dark-oak door with a planked transom, a slab canopy
// cantilevered from the fascia, and a hanging lantern under it.
const doorZ = 30;
let doorX = Math.min(...[...roofAt.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === doorZ).map(([x]) => x));
const dfacing = { facing: "west", hinge: "left", open: "false", powered: "false" };
g.set(doorX, 2, doorZ, "dark_oak_door", { ...dfacing, half: "lower" });
g.set(doorX, 3, doorZ, "dark_oak_door", { ...dfacing, half: "upper" });
g.set(doorX, 4, doorZ, SHOP);
for (let z = doorZ - 1; z <= doorZ + 1; z++) if (!inF(doorX - 1, z)) g.set(doorX - 1, 5, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
if (!inF(doorX - 1, doorZ)) g.set(doorX - 1, 4, doorZ, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light: lanterns standing on the floor just inside some windows (interior air behind the glass).
let lamps = 0;
for (const [x, z] of perimCells) {
  const t = top(x, z);
  for (const fl of FLOORS) {
    if (fl > t - 3) continue;
    const y = fl + 1;
    const w = wall(x, z, y, t);
    if (w.block !== PANE || (x * 5 + z * 3 + fl) % 7 !== 0) continue;
    const inward = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([ix, iz]) => inF(ix, iz) && !perim(ix, iz) && top(ix, iz) - 3 >= fl);
    if (!inward) continue;
    g.set(inward[0], y, inward[1], "lantern", { hanging: "false", waterlogged: "false" });
    lamps++;
  }
}

// Roof equipment on the main roof: a 2x2x2 mechanical unit on the interior of the tower, near its middle.
const mainInterior = [...roofAt.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => top(x, z) === 19 && !perim(x, z));
const cx = Math.round(mainInterior.reduce((s, [x]) => s + x, 0) / mainInterior.length);
const cz = Math.round(mainInterior.reduce((s, [, z]) => s + z, 0) / mainInterior.length);
for (const [x, z] of [[cx, cz], [cx + 1, cz], [cx, cz + 1], [cx + 1, cz + 1]]) {
  if (!inF(x, z) || top(x, z) !== 19 || perim(x, z)) continue;
  g.set(x, 19, z, "light_gray_concrete");
  g.set(x, 20, z, "light_gray_concrete");
}

const out = g.save(`${DIR}/DC76100.nbt`);
console.log(JSON.stringify({ ...out, cells: cells.length, perimeter: perimCells.length, lamps, doorX, hvac: [cx, cz] }));
