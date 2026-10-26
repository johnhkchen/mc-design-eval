// FR241938060: an undifferentiated city block on the Left Bank side of the Seine, 1600s-1800s, six storeys of cream
// render over a stone plinth, 21 x 19 blocks on the footprint. The lidar roof reaches 32 blocks at its tallest, not the
// 36 in the brief, so the massing follows the cells. Walls are calcite piers and glass-pane bays with calcite lintels
// and sills, a sandstone string course on every storey line, and a sandstone cornice and parapet. The north face is the
// street front: a shopfront at ground level under a dark-oak fascia, one street door with a stone-slab canopy. The
// massing is the lidar roof median-smoothed over each cell's 3 x 3 neighbourhood and quantised to 5-block storeys (the
// top tier at 32), so each column stands from its own ground to its own tier and the lower wings step down to the sides.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938060.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// the massing: one column per footprint cell, its top a storey line under the smoothed roof; the top tier is the 32
const massing = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.r); }
  const s = median(near);
  const h = 5 * Math.round(s / 5);
  massing.set(key(x, z), { x, z, g, h: h >= 30 ? 32 : Math.max(5, h) });
}

const SIDES = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];   // the street face first
// a wall faces a side where no footprint cell lies beside it, or the neighbour's top is below this height
const openSides = (x, z, y) => SIDES.filter(([, dx, dz]) => { const n = massing.get(key(x + dx, z + dz)); return !n || y >= n.h; }).map(([s]) => s);
// along a face, bays three blocks wide: a calcite pier, then two glass panes
const along = (side, x, z) => (side === "north" || side === "south" ? x : z);
const isPier = (side, x, z) => along(side, x, z) % 3 === 0;

const DOOR = { x: 11, z: 0, side: "north" };        // the street door in the north wall of the low wing
const blocks = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, name, state) => blocks.set(k3(x, y, z), { x, y, z, name, state });

// the block for one cell of a column at height y: a wall face, a top, a floor slab, or air
const blockFor = (c, y) => {
  if (y < c.g) return ["stone_bricks"];                                             // a plinth down to the ground
  const sides = openSides(c.x, c.z, y);
  const top = y === c.h - 1, cornice = y === c.h - 2;
  if (!sides.length) {                                                              // interior: floor slabs and a roof deck, air otherwise
    if (top) return ["deepslate_tiles"];
    if (y === c.g || y % 5 === 0 || cornice) return ["smooth_stone"];
    return null;
  }
  if (top) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];   // parapet cap
  if (cornice) return ["smooth_sandstone"];                                        // cornice course
  if (c.x === DOOR.x && c.z === DOOR.z && (y === c.g || y === c.g + 1))
    return ["dark_oak_door", { facing: "north", hinge: "left", open: "false", powered: "false", half: y === c.g ? "lower" : "upper" }];
  if (y < 2) return ["stone_bricks"];                                              // rubble base course
  const side = sides[0];
  if (side === "north" && y === 3 && Math.abs(c.x - DOOR.x) <= 1 && c.z === DOOR.z) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];  // canopy over the door
  if (side === "north" && y === 4 && c.h > 5) return ["dark_oak_planks"];          // shopfront fascia
  if (side === "north" && y <= 3 && !isPier(side, c.x, c.z)) return ["glass_pane", {}];  // shop windows
  if (y % 5 === 0) return ["smooth_sandstone"];                                    // storey string course
  if (isPier(side, c.x, c.z)) return ["calcite"];
  const rel = y % 5;
  if (rel === 1 || rel === 4) return ["calcite"];                                  // lintel and sill
  return ["glass_pane", {}];
};

for (const c of massing.values()) {
  for (let y = 0; y < c.h; y++) {
    const b = blockFor(c, y);
    if (b) put(c.x, y, c.z, b[0], b[1]);
  }
}

// chimney stacks rise from the top tier's roof, on interior cells only
for (const [x, z] of [[8, 8], [14, 9], [11, 13], [16, 11]]) {
  const c = massing.get(key(x, z));
  if (!c || c.h !== 32 || openSides(x, z, 31).length) continue;
  put(x, 32, z, "bricks"); put(x, 33, z, "bricks");
  put(x, 34, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// glass panes connect to their in-wall neighbours (any solid block counts, as in the game)
for (const b of blocks.values()) {
  if (b.name !== "glass_pane") continue;
  const has = (x, z) => blocks.has(k3(x, b.y, z));
  const side = openSides(b.x, b.z, b.y)[0];
  b.state = (side === "north" || side === "south")
    ? { north: "false", south: "false", east: String(has(b.x + 1, b.z)), west: String(has(b.x - 1, b.z)), waterlogged: "false" }
    : { north: String(has(b.x, b.z - 1)), south: String(has(b.x, b.z + 1)), east: "false", west: "false", waterlogged: "false" };
}

// warm light behind some panes, in the air gap inside the glass (a fixed pattern, so the run is repeatable)
for (const b of [...blocks.values()]) {
  if (b.name !== "glass_pane" || b.y % 5 !== 2) continue;
  const k = Math.floor(b.y / 5);
  if ((b.x + 2 * b.z + k) % 4 !== 0) continue;
  const side = openSides(b.x, b.z, b.y)[0];
  const [ix, iz] = { north: [b.x, b.z + 1], south: [b.x, b.z - 1], east: [b.x - 1, b.z], west: [b.x + 1, b.z] }[side];
  if (massing.has(key(ix, iz)) && !blocks.has(k3(ix, b.y, iz))) put(ix, b.y, iz, "glowstone");
}

const g = new Voxels([21, 48, 19]);
for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.name, b.state);
const res = g.save(`${DIR}/FR241938060.nbt`);
console.log(JSON.stringify({ columns: massing.size, ...res }));
