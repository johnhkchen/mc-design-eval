// Way 270737178: a two-storey brick commercial block, c.1930 (interwar brick over a stone plinth, a Mt Eden / Eden
// Terrace street front). The lidar roof is 8 over most of the footprint and 9 along a north-west bay: that bay is one
// tier higher with a parapet on its outer edge, the rest is a lower wing. Shopfronts on the south and east street faces.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737178.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 31, H = 23, D = 30;
const g = new Voxels([W, H, D]);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const key = (x, z) => `${x},${z}`;

const roofAt = new Map(), groundAt = new Map();
for (const [x, z, ground, roof] of cells) { roofAt.set(key(x, z), roof); groundAt.set(key(x, z), ground); }
const inFP = (x, z) => roofAt.has(key(x, z));

// Two tiers, smoothed: a cell is in the high bay when most of its 3x3 neighbourhood has a lidar roof of 9 or more.
const highRaw = new Map();
for (const [k] of roofAt) {
  const [x, z] = k.split(",").map(Number);
  let n = 0, m = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofAt.get(key(x + dx, z + dz));
    if (r !== undefined) { m++; if (r >= 9) n++; }
  }
  highRaw.set(k, n * 2 > m);
}
const isHi = (x, z) => highRaw.get(key(x, z)) === true;

// Per cell: the sides that face outside the footprint (edge) or a lower tier (step) make a wall.
const info = new Map();
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const edge = [], step = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz)) edge.push(d);
    else if (isHi(x, z) && !isHi(nx, nz)) step.push(d);
  }
  const out = [...edge, ...step];
  const ns = out.some((d) => d === "north" || d === "south"), ew = out.some((d) => d === "east" || d === "west");
  info.set(k, {
    x, z, hi: isHi(x, z), edge, out, wall: out.length > 0,
    corner: ns && ew,
    u: ns ? x : z,                                   // the coordinate that runs along the facade
    shop: edge.some((d) => d === "south" || d === "east"),
  });
}
const cellAt = (x, z) => info.get(key(x, z));

// The front door: the middle of the south-facing street wall (one door, two cells tall).
const southFront = [...info.values()].filter((c) => c.wall && !c.corner && c.edge.includes("south")).sort((a, b) => a.x - b.x);
const doorCell = southFront[Math.floor(southFront.length / 2)];
doorCell.door = true;
const doorFacing = "north";                           // inward from the south wall

const KIN = new Set(["glass_pane", "white_concrete", "bricks", "stone_bricks", "dark_oak_planks", "smooth_stone", "stone"]);
const panes = [];
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); if (block === "glass_pane") panes.push([x, y, z]); };

// Storey 1 (y 1..2 glass, y 3 lintel band), storey 2 (y 5..6 glass, y 4 sill / string course), cornice at y 7.
// Facade rhythm along the wall: pier, pane, mullion, pane. Shop fronts: 6-wide bays with timber piers.
function facade(c, y) {
  if (c.corner) return ["stone_bricks"];
  if (c.shop && y < 3) {
    if (c.door) return y === 1 ? ["dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" }]
                                : ["dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" }];
    return c.u % 6 === 0 ? ["dark_oak_planks"] : ["glass_pane"];
  }
  if (c.door) return ["bricks"];
  const k = c.u % 4;
  if (k === 0) return ["bricks"];
  if (k === 2) return ["white_concrete"];
  return ["glass_pane"];
}

for (const c of info.values()) {
  const { x, z } = c;
  if (!c.wall) {
    // interior: the foundation at y 0, floor slabs at y 4 and y 7, the high bay's roof deck at y 8; the rest is air
    put(x, 0, z, "stone");
    put(x, 4, z, "stone"); put(x, 7, z, c.hi ? "stone" : "gray_concrete");   // low wing: tar-seal roof deck at y 7
    if (c.hi) put(x, 8, z, "gray_concrete");                                  // high bay: roof deck at y 8
    continue;
  }
  // every wall cell stands on the plinth at y 0 and carries the same bands above it
  put(x, 0, z, "stone_bricks");
  put(x, 3, z, c.shop ? "dark_oak_planks" : "bricks");
  put(x, 4, z, "smooth_stone");
  put(x, 7, z, "stone_bricks");
  if (c.hi) {
    if (c.edge.length) { put(x, 8, z, "bricks"); put(x, 9, z, "smooth_stone"); }   // parapet and coping on the outer edge
    else put(x, 8, z, "stone_bricks");                                              // cap on a step wall
  }
  for (const y of [1, 2, 5, 6]) {
    const [b, s] = facade(c, y);
    put(x, y, z, b, s);
  }
}

// Panes join their neighbours in the wall plane only (facade blocks), never a lamp behind them.
for (const [x, y, z] of panes) {
  const joins = (dx, dz) => { const v = g.get(x + dx, y, z + dz); return !!v && KIN.has(v.block.replace("minecraft:", "")); };
  g.set(x, y, z, "glass_pane", {
    north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)), waterlogged: "false",
  });
}

// Warm lights in the air behind some windows: shroomlights in the shop bays (standing on the y 0 slab), glowstone
// in the storey-2 bays (standing on the y 4 slab). Only cells on one outer face, with a room cell behind the glass.
for (const c of info.values()) {
  if (!c.wall || c.corner || c.door || !c.edge.length) continue;
  const [ox, oz] = DIRS[c.edge[0]];
  const ix = c.x - ox, iz = c.z - oz;
  const inner = cellAt(ix, iz);
  if (!inner || inner.wall) continue;
  if (c.shop && c.u % 6 === 3) g.set(ix, 1, iz, "shroomlight");
  else if (!c.shop && c.u % 4 === 1 && Math.floor(c.u / 4) % 2 === 0) g.set(ix, 5, iz, "glowstone");
  else if (!c.shop && c.u % 4 === 3 && Math.floor(c.u / 4) % 2 === 1) g.set(ix, 1, iz, "glowstone");
}

// Roof: a lift-overrun box on the high bay (top at y 11, the lidar roof plus its parapet), a brick flue on the low wing.
const highInterior = [...info.values()].filter((c) => c.hi && !c.wall);
const inHigh = (x, z) => { const c = cellAt(x, z); return !!c && c.hi && !c.wall; };
const cx = highInterior.reduce((s, c) => s + c.x, 0) / highInterior.length;
const cz = highInterior.reduce((s, c) => s + c.z, 0) / highInterior.length;
let best = null;
for (const c of highInterior) {
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) ok = inHigh(c.x + dx, c.z + dz);
  if (!ok) continue;
  const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
  if (!best || d < best.d) best = { x: c.x, z: c.z, d };
}
if (best) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (let y = 9; y <= 10; y++) g.set(best.x + dx, y, best.z + dz, "light_gray_concrete");

const lowInterior = [...info.values()].filter((c) => !c.hi && !c.wall);
const flue = lowInterior.sort((a, b) => (b.x + b.z) - (a.x + a.z))[0];
if (flue) { g.set(flue.x, 8, flue.z, "bricks"); g.set(flue.x, 9, flue.z, "bricks"); }

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737178.nbt");
console.log(JSON.stringify({ footprint: cells.length, high: highInterior.length, walls: [...info.values()].filter((c) => c.wall).length, ...stats }));
