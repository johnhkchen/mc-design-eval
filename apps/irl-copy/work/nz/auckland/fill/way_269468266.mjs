// Auckland, Mt Eden / Eden Terrace: a two-storey brick commercial block (c. 1905-1930 Edwardian-commercial massing)
// with a stone base, shopfront glass at street level, a white string course and cornice, brick piers in the upper
// storey, and a brick parapet. Lidar gives a flat roof at 7 blocks over most of the footprint, with a low wing (roof <6)
// on the western tail. Walls are one cell thick: a perimeter ring of facade, air behind it, floor slabs at y 0 and y 3,
// roof deck at y 6. Nothing is built past the footprint.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468266.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..34, z 0..33

const TALL = 7, WING = 4;                       // lidar roof (7 over the body); the low tail is a one-storey wing
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof: roof >= 6 ? TALL : WING });
const top = (x, z) => foot.get(`${x},${z}`)?.roof ?? -1;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// a cell is facade when it has a neighbour outside the footprint, or a lower roof (a party wall above the wing)
const exposed = (x, z) => DIRS.some(([dx, dz]) => top(x + dx, z + dz) < top(x, z));

const g = new Voxels([35, 20, 34]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const pier = (x, z) => (x + z) % 3 === 0;      // brick piers every third cell along each face

// the entrance: a tall facade cell on the south face (its outward neighbour is outside), nearest the mean x of those
const southFace = cells.filter(([x, z, , r]) => r >= 6 && top(x, z + 1) < 0);
const mx = southFace.reduce((s, c) => s + c[0], 0) / southFace.length;
const [dx0, dz0] = southFace.reduce((best, c) => (Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best), southFace[0]);

// roof plant: two 2x2 boxes on the deck, well inside the footprint, spaced apart
const plant = [];
for (const [x, z, , r] of cells) {
  if (plant.length >= 2 || r < 6) continue;
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (sq.some(([a, b]) => top(a, b) < TALL || exposed(a, b))) continue;
  if (plant.some(([a, b]) => Math.abs(a - x) < 8 && Math.abs(b - z) < 8)) continue;
  plant.push([x, z]);
}
const onPlant = (x, z) => plant.some(([a, b]) => x >= a && x <= a + 1 && z >= b && z <= b + 1);

for (const [x, z, , r] of cells) {
  const T = top(x, z), ring = exposed(x, z);
  const party = DIRS.some(([dx, dz]) => top(x + dx, z + dz) >= 0 && top(x + dx, z + dz) < T);   // a lower wing abuts: solid brick

  // base course (ring) and interior ground floor
  put(x, 0, z, ring ? "stone_bricks" : "smooth_stone");

  // ground storey: shopfront glass in brick piers, the entrance door set in the south face
  if (ring) {
    for (const y of [1, 2]) {
      if (party || pier(x, z)) put(x, y, z, "bricks");
      else put(x, y, z, "glass");
    }
  }
  if (ring && x === dx0 && z === dz0) {
    put(x, 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "dark_oak_planks");
  }
  // ground-floor lanterns hanging behind the shopfront
  if (!ring && T === TALL && (x * 7 + z * 3) % 5 === 0) put(x, 2, z, "lantern", { hanging: "true" });
  if (!ring && T === WING && (x * 7 + z * 3) % 5 === 0) put(x, 2, z, "lantern", { hanging: "true" });

  // first floor slab / string course at y 3
  if (T === TALL) put(x, 3, z, ring ? "smooth_quartz" : "smooth_stone");
  else put(x, 3, z, ring ? "smooth_quartz" : "stone");

  if (T === TALL) {
    // upper storey: windows in brick piers, air behind them
    if (ring) {
      for (const y of [4, 5]) put(x, y, z, party || pier(x, z) ? "bricks" : "glass");
    } else if ((x * 5 + z * 2) % 4 === 0) {
      put(x, 5, z, "lantern", { hanging: "true" });
    }
    // roof deck and cornice at y 6
    put(x, 6, z, ring ? "smooth_quartz" : "stone");
    // parapet at y 7 on the facade, crenellated by the piers
    if (ring) put(x, 7, z, pier(x, z) ? "smooth_quartz" : "bricks");
    if (onPlant(x, z)) put(x, 7, z, "light_gray_concrete");
  }
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468266.nbt");
console.log("way_269468266 built:", g.count(), "blocks; entrance", dx0, dz0, "plant", JSON.stringify(plant));
