// FR245157295: an Annexe du siège de l'AP-HP on the Île de la Cité, a commercial block of the Haussmann era in cream render.
// Calcite piers frame glass bays, the street storey is a dark-oak shopfront on a stone plinth, the noble floor has an iron
// balcony rail, and the top storey is a mansard of deepslate tiles with glass dormers under a flat deepslate cap. The
// lidar roof is median-smoothed over each building cell's 3 x 3 neighbourhood (courtyard cells left out) and quantised to
// five-block storey lines, so every column stands from its own ground to its own tier and the setbacks land on the
// storey lines. The cut-out courtyard (lidar roof 1 to 4) is a chequered paving with the ring walls standing round it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245157295.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const COURT_ROOF = 4;                                   // lidar roof at or under this is the courtyard floor

// the massing: one column per footprint cell, its top a storey line under the smoothed roof
const massing = new Map();
for (const [x, z, g, r] of cells) {
  if (r <= COURT_ROOF) { massing.set(key(x, z), { x, z, g, h: g + 1, court: true }); continue; }
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(key(x + dx, z + dz));
    if (n && n.r > COURT_ROOF) near.push(n.r);
  }
  const h = Math.max(10, 5 * Math.round(median(near) / 5));
  massing.set(key(x, z), { x, z, g, h, court: false });
}

const SIDES = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
// the sides a block needs a wall on: no footprint cell beside it, or the neighbour's top is below this height
const openSides = (x, z, y) => SIDES.filter(([, dx, dz]) => { const n = massing.get(key(x + dx, z + dz)); return !n || y >= n.h; }).map(([s]) => s);

const DOOR = { x: 23, z: 0 };                           // the entrance in the middle of the long north (-z) front
const blocks = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, name, state) => blocks.set(k3(x, y, z), { x, y, z, name, state });

// the wall block of an exposed cell at height y, by its storey row (five blocks a storey, lines on y % 5 == 0)
const facadeBlock = (c, x, y, z, sides) => {
  const { g, h } = c;
  if (x === DOOR.x && z === DOOR.z && sides.includes("north")) {
    if (y === g) return ["stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }];
    const half = y === g + 1 ? "lower" : "upper";
    return ["dark_oak_door", { facing: "north", hinge: "left", open: "false", powered: "false", half }];
  }
  const xFace = sides[0] === "east" || sides[0] === "west";
  const pier = (xFace ? z : x) % 3 === 0;                // bays three blocks wide: a pier, then two panes
  if (y < 5) {                                           // the street storey: plinth, shopfront, dark fascia
    if (y === g) return ["stone_bricks"];
    if (y === 4) return ["dark_oak_planks"];
    return pier ? ["dark_oak_planks"] : ["glass_pane", {}];
  }
  const top = h >= 20 && y >= h - 5;                     // the mansard storey
  const row = y % 5, storey = Math.floor(y / 5);
  if (row === 0) return ["smooth_stone"];                // storey line
  if (row === 4) return ["calcite"];                     // lintel course
  if (pier) return [top ? "deepslate_tiles" : "calcite"];
  if (storey === 1 && row === 1 && !top) return ["iron_bars", {}];   // the noble floor's balcony rail
  return ["glass_pane", {}];
};

for (const c of massing.values()) {
  const { x, z, g, h } = c;
  for (let y = 0; y < h; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                  // foundation under the ground
    if (y === h - 1) {                                                       // roof cap, or courtyard paving
      if (c.court) put(x, y, z, (x + z) % 2 ? "smooth_stone" : "stone_bricks");
      else put(x, y, z, h >= 20 ? "deepslate_tiles" : "stone_bricks");
      continue;
    }
    const sides = openSides(x, z, y);
    if (!sides.length) {                                                     // inside: a floor slab per storey, air otherwise
      if (y === g || y % 5 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    const [name, state] = facadeBlock(c, x, y, z, sides);
    put(x, y, z, name, state);
  }
}

// warm light: glowstone behind some upper panes, a lantern behind some shop panes (in the air gap inside the glass)
for (const b of [...blocks.values()]) {
  if (b.name !== "glass_pane") continue;
  const side = openSides(b.x, b.z, b.y)[0];
  const [ix, iz] = { east: [b.x - 1, b.z], west: [b.x + 1, b.z], south: [b.x, b.z - 1], north: [b.x, b.z + 1] }[side];
  if (!massing.has(key(ix, iz)) || blocks.has(k3(ix, b.y, iz))) continue;
  const storey = Math.floor(b.y / 5), row = b.y % 5;
  if (b.y < 5 && b.y === massing.get(key(b.x, b.z)).g + 1 && (b.x + b.z) % 3 === 0) put(ix, b.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (b.y >= 5 && row === 2 && storey >= 1 && (b.x + 2 * b.z + storey) % 4 === 0 && b.y < massing.get(key(b.x, b.z)).h - 5)
    put(ix, b.y, iz, "glowstone");
}

// glass panes and balcony bars connect to their in-wall neighbours (any block counts, as in the game)
for (const b of blocks.values()) {
  if (b.name !== "glass_pane" && b.name !== "iron_bars") continue;
  const side = openSides(b.x, b.z, b.y)[0];
  const has = (x, z) => (blocks.has(k3(x, b.y, z)) ? "true" : "false");
  b.state = (side === "east" || side === "west")
    ? { north: has(b.x, b.z - 1), south: has(b.x, b.z + 1), east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: has(b.x + 1, b.z), west: has(b.x - 1, b.z), waterlogged: "false" };
}

// chimney stacks on the deepslate cap of the tallest tier
for (const c of massing.values()) {
  if (c.court || c.h < 30 || c.x % 9 !== 4 || c.z % 9 !== 5 || openSides(c.x, c.z, c.h - 1).length) continue;
  put(c.x, c.h, c.z, "bricks"); put(c.x, c.h + 1, c.z, "bricks");
  put(c.x, c.h + 2, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const g = new Voxels([47, 51, 64]);
for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.name, b.state);
const res = g.save(`${DIR}/FR245157295.nbt`);
console.log(JSON.stringify({ columns: massing.size, ...res }));
