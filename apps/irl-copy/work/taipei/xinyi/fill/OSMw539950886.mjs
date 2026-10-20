import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950886";

// Record: 15 x 15 footprint, roof about 11 blocks above lowest ground.
// Reading: a two-storey, cream-clad 1980s Xinyi shophouse/office block with a
// stone base, quartz spandrels, polished-andesite piers, glazed bays with
// warm lights in some windows, a recessed south entrance, and rooftop plant.
const ROOF = 11;          // parapet top
const SLAB_1 = 5;         // first floor line
const SLAB_ROOF = 10;     // roof slab / cornice line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([15, 23, 15]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);

// Which outward face (if any) a footprint cell sits on, and its position along that face.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", t: x };
  if (!has(x, z + 1)) return { face: "south", t: x };
  if (!has(x - 1, z)) return { face: "west", t: z };
  if (!has(x + 1, z)) return { face: "east", t: z };
  return null;
}

const DOOR_X = 7;
const DOOR_Z = 14;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faceOf(x, z);
  const pillar = f ? (f.t % 3 === 0 || f.t === 14) : false;
  const isDoor = f && f.face === "south" && x === DOOR_X && z === DOOR_Z && gr < 2;

  for (let y = gr + 1; y <= ROOF; y++) {
    // Roof slab and cornice band.
    if (y === SLAB_ROOF) {
      g.set(x, y, z, f ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // First floor slab, with quartz spandrel on the facade.
    if (y === SLAB_1) {
      g.set(x, y, z, f ? "quartz_block" : "smooth_stone");
      continue;
    }
    // Parapet course.
    if (y === ROOF) {
      if (f) g.set(x, y, z, "quartz_block");
      continue;
    }
    // Interior cells: air gap behind the glass, nothing else.
    if (!f) continue;

    // Facade.
    let id;
    let props;
    if (y === 1) {
      id = pillar ? "polished_andesite" : "stone_bricks";
    } else if (y <= 4) {
      // Ground floor: shopfront bays, pier columns, lintel at y 4.
      if (pillar) id = "polished_andesite";
      else if (y === 4) id = "quartz_block";
      else if (isDoor && x === DOOR_X) {
        id = "dark_oak_door";
        props = { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else id = "light_blue_stained_glass";
    } else if (y >= 6 && y <= 9) {
      // Upper floor: sill at y 6, glazing at y 7-8, head at y 9.
      if (pillar) id = "polished_andesite";
      else if (y === 6 || y === 9) id = "quartz_block";
      else if (y === 7 && (x * 3 + z * 5 + f.t) % 7 === 0) id = "glowstone";
      else id = "light_blue_stained_glass";
    }
    if (id) g.set(x, y, z, id, props);
  }
}

// Rooftop plant: a water tank on a light concrete plinth with an iron lid, plus one AC unit.
for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  if (x >= 4 && x <= 7 && z >= 4 && z <= 7) {
    for (let y = ROOF; y <= ROOF + 1; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "iron_block");
  }
  if (x >= 10 && x <= 11 && z >= 9 && z <= 10) {
    g.set(x, ROOF, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
