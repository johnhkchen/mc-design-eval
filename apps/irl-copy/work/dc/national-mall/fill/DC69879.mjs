// 1725 17th St NW: a c.1920s Georgian/Beaux-Arts residential co-operative. Red brick on a stone base, calcite string
// courses and quoins, four storeys of window bands, a dentilled attic and a calcite cornice. The plan is an E: a front
// block across the street face and three rear wings opening south onto two light courts. The lidar roof (8, with 9
// where the rear-left corner pavilion and two mechanical penthouses stand) sets the massing; 9 is read as a tier.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69879.cells.json", "utf8"));

const roof = new Map();
for (const [x, z, ground, r] of cells) roof.set(`${x},${z}`, { ground, roof: r });
const inF = (x, z) => roof.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perim = (x, z) => NB.some(([dx, dz]) => !inF(x + dx, z + dz));
// a corner: a missing neighbour on both an x side and a z side (convex corners, and the court's inner corners)
const quoin = (x, z) => (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));

const BRICK = "bricks", STONE_CAP = "calcite", BASE = "chiseled_stone_bricks", FLOOR = "stone", ROOF = "gray_concrete", GLASS = "glass_pane";
const WARM = ["glowstone"];

// the 9-tier: the SW rear pavilion (x 0..5, z 6..10) and two mechanical penthouses (x 11..12 z 3..4; x 20..22 z 3..5)
const tier = (x, z) => inF(x, z) && ((x <= 5 && z >= 6) || (x >= 11 && x <= 12 && z >= 3 && z <= 4) || (x >= 20 && x <= 22 && z >= 3 && z <= 5));

const blocks = new Map();                       // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);

const DOOR_X = [11, 12];
for (const [x, z] of [...roof.keys()].map((k) => k.split(",").map(Number))) {
  const isPerim = perim(x, z), q = isPerim && quoin(x, z);

  // ground and every floor slab, and the roof deck: solid across the whole footprint, so nothing hangs
  if (!isPerim) {
    for (const y of [0, 2, 4, 6]) put(x, y, z, FLOOR);
    put(x, 7, z, ROOF);
    // window storeys: one air cell behind the glass (the gap, where the glow goes), then a solid partition, so the
    // windows show a lit gap and not the far side of the building through them
    const behindGlass = NB.some(([dx, dz]) => inF(x + dx, z + dz) && perim(x + dx, z + dz));
    if (!behindGlass) for (const y of [1, 3, 5]) put(x, y, z, FLOOR);
  } else {
    // the outer shell, storey by storey: 0 base, 1 ground windows, 2 string, 3 windows, 4 string, 5 windows, 6 dentils, 7 cornice
    put(x, 0, z, q ? STONE_CAP : BASE);
    put(x, 2, z, STONE_CAP);
    put(x, 4, z, STONE_CAP);
    put(x, 6, z, (x + z) % 2 ? BRICK : STONE_CAP);
    put(x, 7, z, STONE_CAP);
    for (const y of [1, 3, 5]) {
      let block = q ? STONE_CAP : (x + z) % 3 === 0 ? BRICK : GLASS;
      let state;
      if (z === 0 && x >= 10 && x <= 13 && y === 1 && (x === 10 || x === 13)) block = STONE_CAP;      // door pilasters
      if (z === 0 && x >= 10 && x <= 13 && y === 3) block = STONE_CAP;                                  // door hood
      if (z === 0 && DOOR_X.includes(x) && y === 1) {                                                 // double door
        block = "dark_oak_door"; state = { facing: "north", half: "lower", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" };
      }
      put(x, y, z, block, state);
    }
    // the upper half of the front door, in the string course above the lower half
    if (z === 0 && DOOR_X.includes(x)) put(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" });
  }
}

// the 9-tier: a solid tier on top of the pavilion and the penthouses, calcite cap on the rim, roof deck inside
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!tier(x, z)) continue;
  put(x, 8, z, perim(x, z) ? STONE_CAP : ROOF);
}

// warm lights: glowstone (or shroomlight) on the room side of some glazed windows, floor by floor
for (const [key, v] of [...blocks.entries()]) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  const h = (x * 31 + z * 17 + y * 7) % 11;
  if (h % 4 !== 0) continue;
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !perim(nx, nz) && !has(nx, y, nz)) { put(nx, y, nz, WARM[h % WARM.length]); break; }
  }
}

// pane connections: a pane joins a neighbouring pane or solid block in its own plane (x or z), nothing else
const connect = (x, y, z) => {
  const solid = (nx, nz) => { const b = blocks.get(`${nx},${y},${nz}`); return !!b && b.block !== "dark_oak_door"; };
  return { north: solid(x, z - 1) ? "true" : "false", south: solid(x, z + 1) ? "true" : "false", east: solid(x + 1, z) ? "true" : "false", west: solid(x - 1, z) ? "true" : "false" };
};
for (const [key, v] of [...blocks.entries()]) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  blocks.set(key, { block: GLASS, state: connect(x, y, z) });
}

const g = new Voxels([26, 21, 11]);
for (const [key, v] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69879.nbt";
console.log(g.save(out));
