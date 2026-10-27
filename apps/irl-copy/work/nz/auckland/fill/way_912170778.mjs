// Way 912170778: a 1920s two-storey brick shop-and-flat on a basalt plinth, the Mt Eden / Eden Terrace kind of street
// frontage. Lidar: every footprint cell has ground 0 and roof 11, so the massing is one flat block-high plan: a
// plinth (y 0), a shopfront storey (y 1-3), an upper storey (y 4-8: string course, sash-style windows, head course,
// cornice), and a brick parapet with a stone cap to y 10 (top at 11). Interiors are air behind the glass, with a
// floor slab at y 4 and a roof deck at y 8.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170778.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170778.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));    // [x, z, ground, roof]
const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => F.has(`${x},${z}`);
// the storey plan below is fixed at the lidar roof height (11); every cell here agrees, so a different roof is an error
if (cells.some(([, , g, r]) => g !== 0 || r !== 11)) throw new Error("this plan is drawn for ground 0, roof 11");

const DIR = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };   // z grows south, x grows east
const outs = (x, z) => Object.keys(DIR).filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));  // faces that look at the street or the sky
const FRONT = "s", DOOR_X = 3;                                 // the street is the south face (z 8), door on its middle bay

// a pier (brick or stone column) sits on each corner of the outline; on the upper storey also every third cell
// along a face, so the windows come in bays between piers
const isCorner = (x, z, d) => {
  const along = d === "n" || d === "s" ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  return along.some(([a, b]) => !(inF(a, b) && outs(a, b).includes(d)));
};
const upperPier = (x, z, d) => isCorner(x, z, d) || (d === "n" || d === "s" ? x : z) % 3 === 0;
const groundPier = (x, z, os) => os.some((d) => isCorner(x, z, d));

const B = new Map();   // "x,y,z" -> { block, state }, the building before it is written
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

for (const key of F.keys()) {
  const [x, z] = key.split(",").map(Number);
  const os = outs(x, z);
  put(x, 0, z, "stone_bricks");                          // base course: the basalt-ish plinth on every cell
  if (!os.length) {                                      // interior: the floor slab and the roof deck
    put(x, 4, z, "smooth_stone");
    put(x, 8, z, "smooth_stone");
    continue;
  }
  // shopfront storey, y 1-3
  const pier = groundPier(x, z, os);
  for (let y = 1; y <= 3; y++) {
    if (pier) put(x, y, z, "polished_andesite");
    else if (y === 3) put(x, y, z, "dark_oak_planks");                       // fascia over the glass and the door
    else if (os.includes(FRONT) && z === 8 && x === DOOR_X) {
      put(x, y, z, "dark_oak_door", y === 1
        ? { facing: "south", half: "lower", hinge: "left", open: "false" }
        : { half: "upper", hinge: "left", powered: "false" });
    } else put(x, y, z, "glass_pane");                                       // shop glass
  }
  // upper storey, y 4-10
  put(x, 4, z, "stone_bricks");                          // string course at the floor line
  const up = os.some((d) => upperPier(x, z, d));
  for (const y of [5, 6]) put(x, y, z, up ? "bricks" : "glass_pane");   // sash window bays, brick piers
  put(x, 7, z, "stone_bricks");                          // head course
  put(x, 8, z, "smooth_stone");                          // cornice band (and the deck above the interior)
  put(x, 9, z, "bricks");                                // parapet
  put(x, 10, z, "stone_brick_slab", { type: "top" });   // coping, top at 11
}

// roof plant: a galvanised tank on the deck, two blocks high, on the interior cells at the back
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  put(x, 9, z, "iron_block");
  put(x, 10, z, "iron_block");
}

// warm light behind the glass: a lantern on the upper floor and a glowstone in the shop
put(2, 5, 7, "lantern", { hanging: "false" });
put(4, 1, 7, "glowstone");

// glass panes connect along their own wall face only (to piers, glass and the other panes in the plane)
const FULL = new Set(["stone_bricks", "bricks", "polished_andesite", "smooth_stone", "dark_oak_planks", "iron_block", "glowstone"]);
const at = (x, y, z) => B.get(`${x},${y},${z}`);
for (const [k, v] of [...B]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const os = outs(x, z);
  const alongX = os.some((d) => d === "n" || d === "s");   // a north or south face runs east-west
  const alongZ = os.some((d) => d === "e" || d === "w");   // an east or west face runs north-south
  const joins = (dx, dz) => {
    const nb = at(x + dx, y, z + dz);
    return !!nb && (nb.block === "glass_pane" || FULL.has(nb.block));
  };
  v.state = {
    north: String(alongZ && joins(0, -1)),
    south: String(alongZ && joins(0, 1)),
    east: String(alongX && joins(1, 0)),
    west: String(alongX && joins(-1, 0)),
  };
}

// nothing floats: a block above y 0 stands on a block below it, or is a floor or deck slab carried by walls that do
// (the interior slabs span the air of the storey beneath them, as a real floor does, so they're checked level by level)
const cellsAt = (y) => [...B.keys()].map((k) => k.split(",").map(Number)).filter((c) => c[1] === y);
for (let y = 1; y < 24; y++) {
  const level = cellsAt(y);
  const seeds = level.filter(([x, , z]) => B.has(`${x},${y - 1},${z}`));
  const held = new Set(seeds.map(([x, , z]) => `${x},${z}`));
  const queue = [...held];
  while (queue.length) {
    const [x, z] = queue.pop().split(",").map(Number);
    for (const [dx, dz] of Object.values(DIR)) {
      const k = `${x + dx},${z + dz}`;
      if (B.has(`${x + dx},${y},${z + dz}`) && !held.has(k)) { held.add(k); queue.push(k); }
    }
  }
  for (const [x, , z] of level) if (!held.has(`${x},${z}`)) throw new Error(`floating block at ${x},${y},${z}`);
}

const g = new Voxels([6, 24, 9]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, palette ${res.palette}`);
