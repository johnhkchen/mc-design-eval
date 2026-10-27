import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 326735498, Mt Eden: a 1920s-30s brick commercial block (the Stripped Classical corner shop of Mt Eden and
// Eden Terrace): a stone plinth, a shopfront and a recessed door on the street (north) side, two brick storeys of
// glazed bays between white string courses, a cornice and parapet, and a flat roof with plant boxes. The lidar roof
// (11 or 12 above y0) is smoothed to one flat tier at 12 (the deck top at 13, the parapet at 14). Each storey is a
// floor slab with an air room behind the glass; a glowstone sits two cells behind some glass.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735498.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735498.nbt";

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFp = (x, z) => ground.has(`${x},${z}`);
const DIR = { S: [0, 1], N: [0, -1], W: [-1, 0], E: [1, 0] };   // S first: the street front (the long side)
const outward = (x, z) => Object.keys(DIR).filter((d) => !inFp(x + DIR[d][0], z + DIR[d][1]));
const OFF = { N: 0, S: 2, W: 3, E: 1 };                         // each face staggers its bay rhythm
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const DOOR = [4, 6], DOOR_FACE = "S";                           // the street entrance: a g0 cell on the south face

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const slab = (type) => ({ type, waterlogged: "false" });
const door = (half) => ({ facing: FACING[DOOR_FACE], half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gnd] of cells) {
  const outs = outward(x, z);
  if (!outs.length) {
    // interior: foundation up to the ground, then floor slabs at storey lines; the rooms stay air
    for (let y = 0; y <= gnd; y++) put(x, y, z, "stone_bricks");
    for (const y of [4, 8, 12]) put(x, y, z, "smooth_stone");
    continue;
  }
  const face = outs[0];
  const along = face === "N" || face === "S" ? x : z;
  const phase = (along + OFF[face]) % 4;                        // 0 pier, 1 frame, 2 and 3 glass
  const front = face === "S";
  for (let y = 0; y <= 14; y++) {
    if (y <= gnd) { put(x, y, z, "stone_bricks"); continue; }  // foundation under the ground
    if (x === DOOR[0] && z === DOOR[1]) {
      if (y === 1) { put(x, y, z, "dark_oak_door", door("lower")); continue; }
      if (y === 2) { put(x, y, z, "dark_oak_door", door("upper")); continue; }
      if (y === 3) { put(x, y, z, "white_concrete"); continue; }   // the hood over the door
    }
    let spec = null;
    if (y === 1) spec = ["polished_andesite"];                     // base course
    else if (y === 4 || y === 8 || y === 13) spec = ["white_concrete"];   // string courses, parapet
    else if (y === 5 || y === 9) spec = ["smooth_stone"];          // sills
    else if (y === 12) spec = ["stone_brick_slab", slab("bottom")];       // cornice lip on the roof deck
    else if (y === 14) spec = ["smooth_stone_slab", slab("top")];         // coping
    else if ([2, 3, 6, 7, 10, 11].includes(y)) {                  // the window rows
      if (phase === 2 || phase === 3) spec = ["glass_pane"];
      else if (phase === 1) spec = ["dark_oak_planks"];
      else spec = [front && y < 4 ? "stone_bricks" : "bricks"];
    }
    if (spec) put(x, y, z, spec[0], spec[1]);
    // a warm light two cells in, behind the glass (the cell directly behind stays air)
    if (phase === 2 && [2, 6, 10].includes(y) && (along + y + OFF[face]) % 3 === 0) {
      const dx = x - 2 * DIR[face][0], dz = z - 2 * DIR[face][1];
      if (inFp(dx, dz) && !outward(dx, dz).length && ground.get(`${dx},${dz}`) < y) put(dx, y, dz, "glowstone");
    }
  }
}

// roof plant: two boxes on the deck
for (let x = 6; x <= 9; x++) for (let z = 4; z <= 5; z++) for (const y of [13, 14]) put(x, y, z, "stone_bricks");
for (let x = 11; x <= 12; x++) for (let z = 6; z <= 7; z++) for (const y of [13, 14]) put(x, y, z, "bricks");

// glass panes connect to panes and to solid facade blocks, as the game would draw them
const SOLID = new Set(["stone_bricks", "bricks", "polished_andesite", "white_concrete", "smooth_stone", "dark_oak_planks"]);
const joins = (x, y, z) => { const e = at(x, y, z); return !!e && (e.block === "glass_pane" || SOLID.has(e.block)); };
for (const [k, e] of B) {
  if (e.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  e.state = { north: joins(x, y, z - 1), south: joins(x, y, z + 1), east: joins(x + 1, y, z), west: joins(x - 1, y, z), waterlogged: "false" };
}

const g = new Voxels([15, 25, 10]);
for (const [k, e] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, e.block, e.state); }
console.log(g.save(OUT));
