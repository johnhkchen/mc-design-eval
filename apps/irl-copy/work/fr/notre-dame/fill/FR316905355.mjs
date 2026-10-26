import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR316905355.cells.json`, "utf8"));

// A commercial block in pale Parisian stone: smooth-quartz walls on a stone-brick plinth with string courses, dark-wood
// shopfronts under a red awning, a slate roof deck with a coping, and glass panes with a warm room behind some of them.
const WALL = "smooth_quartz", STONE = "stone_bricks", FASCIA = "dark_oak_planks", AWNING = "red_terracotta";
const SLATE = "deepslate_tiles", CHIMNEY = "bricks", LIGHT = "glowstone", DOOR = "dark_oak_door";

// outward normal (dx, dz) of each side; north is -z, west is -x
const SIDE = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// 1. Massing: a 3x3 median of the lidar roof (kills the noise), then three tiers: the main block to y 13, wings to y 10,
//    and low edges to 5-8. Each tier is at least 3 above its own ground.
const plan = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.r); }
  const s = median(near);
  const T = s >= 10 ? 13 : s >= 6 ? 10 : Math.max(g + 3, 5);
  plan.set(key(x, z), { x, z, g, T, sides: [] });
}
const cellAt = (x, z) => plan.get(key(x, z));
for (const c of plan.values()) for (const [side, [dx, dz]] of Object.entries(SIDE)) if (!cellAt(c.x + dx, c.z + dz)) c.sides.push(side);
for (const c of plan.values()) {
  // a shell cell is on the outside of the footprint or on the edge of a tier, so every setback has a wall under it
  const tierEdge = Object.values(SIDE).some(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return n && n.T !== c.T; });
  c.shell = c.sides.length > 0 || tierEdge;
  c.corner = c.sides.some((s) => s === "W" || s === "E") && c.sides.some((s) => s === "N" || s === "S");
}

// along a side: the coordinate that runs along that facade (z on the long W/E walls, x on the N/S ends)
const along = (c, side) => (side === "W" || side === "E" ? c.z : c.x);

// storeys: the ground band (a shopfront) runs from the cell's own ground to the 5 line (or 5-10 on the high ground), then
// 5-block storeys to the top; a downhill cell gets the extra storey; capped at its tier top
function bandAt(c, y) {
  const spans = c.g < 5
    ? [{ a: c.g, b: 5, ground: true }, { a: 5, b: 10 }, { a: 10, b: 13 }]
    : [{ a: 5, b: 10, ground: true }, { a: 10, b: 13 }];
  return spans.map((s) => ({ ...s, b: Math.min(s.b, c.T) })).find((s) => y >= s.a && y < s.b);
}

// 2. Entrances: one on each long side, at the middle of the shopfront run that sits lowest on the ground (g <= 2)
const pickDoor = (side) => {
  const list = [...plan.values()]
    .filter((c) => c.shell && c.sides.length === 1 && c.sides[0] === side && c.g <= 3 && along(c, side) % 3 !== 0)
    .sort((p, q) => along(p, side) - along(q, side));
  return list.length ? { side, c: list[list.length >> 1] } : null;
};
// the long west side first, then whichever other facade has a low shopfront run: two entrances
const doors = ["W", "E", "S", "N"].map(pickDoor).filter(Boolean).slice(0, 2);
const doorKeys = new Set(doors.map(({ c }) => key(c.x, c.z)));
const canopy = new Set();   // the awning runs over the door's bay: the door cell and its neighbours on the same facade
for (const { c, side } of doors) for (const d of [-1, 0, 1]) {
  const n = side === "W" || side === "E" ? cellAt(c.x, c.z + d) : cellAt(c.x + d, c.z);
  if (n && n.sides.includes(side)) canopy.add(key(n.x, n.z));
}

// 3. The volume: a foundation under every cell, a solid shell with windows on the outside, a hollow inside with a floor
//    slab per storey and a slate deck on top, and warm rooms behind some glass.
const v = new Voxels([12, 27, 29]);
const glass = new Map();   // "x,y,z" -> the pane's running axis and the direction inside
for (const c of plan.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, STONE);   // foundation: solid under the ground, so nothing floats on the slope
  if (!c.shell) {
    for (const f of new Set([g, 5, 10])) if (f < T - 1) v.set(x, f, z, STONE);   // storey floors
    v.set(x, T - 1, z, SLATE);                                                    // roof deck
    if (T === 13 && x % 4 === 2 && z % 6 === 3) { v.set(x, T, z, CHIMNEY); v.set(x, T + 1, z, CHIMNEY); }
    continue;
  }
  const side = c.sides[0];
  for (let y = g; y < T; y++) {
    const band = bandAt(c, y);
    const glassRow = band.ground ? y <= band.b - 2 : y >= band.a + 1 && y <= band.b - 2;
    if (band.ground && y === band.b - 1) { v.set(x, y, z, canopy.has(key(x, z)) ? AWNING : FASCIA); continue; }
    if (!band.ground && y === band.a) { v.set(x, y, z, STONE); continue; }                      // string course
    const glazed = glassRow && c.sides.length && !c.corner && along(c, side) % 3 !== 0 && !doorKeys.has(key(x, z));
    if (glazed) {
      const [dx, dz] = SIDE[side];
      glass.set(`${x},${y},${z}`, { axis: side === "W" || side === "E" ? "z" : "x", inward: [-dx, -dz] });
      continue;   // the pane itself is set once every neighbour is known
    }
    // between the panes, a vertical quartz pillar reads as the window's frame; a corner or a plain run stays wall
    if (glassRow && c.sides.length && !c.corner) v.set(x, y, z, "quartz_pillar", { axis: "y" });
    else v.set(x, y, z, WALL);
  }
  v.set(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// glass panes connect along their own facade only
for (const [k, p] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const has = (dx, dz) => glass.has(`${x + dx},${y},${z + dz}`);
  const st = p.axis === "z"
    ? { north: has(0, -1), south: has(0, 1), east: false, west: false }
    : { north: false, south: false, east: has(1, 0), west: has(-1, 0) };
  v.set(x, y, z, "glass_pane", Object.fromEntries(Object.entries(st).map(([n, b]) => [n, String(b)])));
}

// warm rooms: a glowstone just inside some panes (never on a floor slab, never in the deck)
let lights = 0;
for (const [k, p] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  if ((x + z + y) % 4 !== 1) continue;
  const n = cellAt(x + p.inward[0], z + p.inward[1]);
  if (!n || n.shell || y === n.g || y === 5 || y === 10 || y >= n.T - 1) continue;
  v.set(n.x, y, n.z, LIGHT); lights++;
}

// entrances: a dark-wood door, two blocks, facing out; the awning runs above it
for (const { c, side } of doors) {
  const st = (half) => ({ facing: FACING[side], half, hinge: "left", open: "false", powered: "false" });
  v.set(c.x, c.g, c.z, DOOR, st("lower"));
  v.set(c.x, c.g + 1, c.z, DOOR, st("upper"));
}

const { blocks, palette } = v.save(`${DIR}/FR316905355.nbt`);
console.log(`FR316905355: ${blocks} blocks, ${palette} palette entries, ${glass.size} panes, ${lights} lights, ${doors.length} doors`);
