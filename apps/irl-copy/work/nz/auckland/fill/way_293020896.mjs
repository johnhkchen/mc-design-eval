// Auckland, from Maungawhau: way 293020896, a two-storey 1920s-30s brick commercial block on a sloping site.
// Brick walls on a stone base, smooth-quartz dressings (quoins, storey band, piered window frames, cornice),
// a panelled door in a stone surround, a parapet with coping, and a roof plant room. The uphill (north) side is one
// storey on its foundation; the downhill side shows the second storey. The shell is one block thick, so every window
// has an air gap behind it; the floors are solid slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020896.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020896.nbt";
const SIZE = [20, 21, 29];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// The lidar roof wobbles between 7 and 8 over the body and between 5 and 6 on the SE wing: smooth each to one flat tier.
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, tier: roof >= 7 ? 8 : 6 });

const inside = (x, z) => foot.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const openSides = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));

// spec: "x,y,z" -> [block, state]; built first so that glass panes can read their neighbours before any voxel is set
const spec = new Map();
const put = (x, y, z, block, state) => spec.set(`${x},${y},${z}`, [block, state]);
const has = (x, y, z) => spec.has(`${x},${y},${z}`);

for (const [key, { ground, tier }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const deck = tier - 1;                                   // the roof deck layer; the parapet rises above it
  const open = openSides(x, z);
  const shell = open.length > 0;

  // foundation: solid from y 0 up to this cell's ground; the lowest cells get a floor slab at y 0
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
  if (ground === 0) put(x, 0, z, "stone_bricks");
  // one upper floor slab at y 4 where a ground storey sits under it
  if (ground < 4 && deck > 4) put(x, 4, z, "smooth_stone");
  // the roof deck is solid over the whole footprint
  put(x, deck, z, "smooth_stone");
  if (!shell) continue;

  // the outline is stair-stepped, so the facade runs along whichever open side the cell has (x for north/south)
  const alongX = open.includes("north") || open.includes("south");
  const s = alongX ? x : z;                                // position along the facade
  // per 4 cells: a stone pier, two glazed bays, then a brick spandrel; the ground storey is shopfront glass
  // (every bay but the pier), the upper storey is the 2-wide window
  const phase = ((s % 4) + 4) % 4;
  const groundRows = ground < 4 ? [ground + 1, ground + 2].filter((y) => y <= 3) : [];
  const upperRows = [5, 6].filter((y) => y < deck);

  put(x, ground, z, "stone_bricks");                       // base course
  for (let y = ground + 1; y < deck; y++) {
    let block = "bricks";
    if (phase === 0) block = "smooth_quartz";              // pier, the frame of each bay
    else if (y === 4 && ground < 4) block = "smooth_quartz"; // storey band
    else if (groundRows.includes(y) && phase !== 3) block = "glass_pane";
    else if (upperRows.includes(y) && phase !== 3) block = "glass_pane";
    put(x, y, z, block);
  }
  put(x, deck, z, "smooth_quartz");                        // cornice
  put(x, deck + 1, z, "bricks");                           // parapet
  put(x, deck + 2, z, "smooth_quartz_slab", { type: "bottom" }); // coping
}

// Entrance: the longest straight run of open faces, its middle cell takes a door in a stone surround.
let best = null;
for (const d of Object.keys(DIRS)) {
  const lines = new Map();
  for (const [key, { ground, tier }] of foot) {
    const [x, z] = key.split(",").map(Number);
    if (!openSides(x, z).includes(d)) continue;
    const alongX = d === "north" || d === "south";
    const line = alongX ? z : x, pos = alongX ? x : z;
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push({ pos, x, z, ground, tier });
  }
  for (const cellsOnLine of lines.values()) {
    cellsOnLine.sort((a, b) => a.pos - b.pos);
    let run = [];
    const flush = () => { if (run.length && (!best || run.length > best.run.length)) best = { d, run }; run = []; };
    for (const c of cellsOnLine) {
      if (run.length && c.pos !== run[run.length - 1].pos + 1) flush();
      // a corner cell is not a door position, nor is one whose ground storey is too short for a door
      if (openSides(c.x, c.z).length === 1 && c.ground + 2 < c.tier - 1) run.push(c); else flush();
    }
    flush();
  }
}
if (best) {
  const mid = best.run[Math.floor(best.run.length / 2)];
  const { x, z, ground, tier } = mid;
  const facing = best.d, lo = ground + 1, hi = ground + 2;
  if (hi < tier - 1) {
    put(x, lo, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, hi, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // the surround: quartz jambs at the door's sides and a lintel over, one cell in from the door
    const [ax, az] = best.d === "north" || best.d === "south" ? [1, 0] : [0, 1];
    for (const k of [-1, 1]) for (const y of [lo, hi]) put(x + k * ax, y, z + k * az, "smooth_quartz");
    for (const k of [-1, 0, 1]) put(x + k * ax, hi + 1, z + k * az, "smooth_quartz");
  }
}

// Roof plant room, a solid box on the deck of the body (stands on the deck layer, inside the footprint).
for (let x = 8; x <= 11; x++) for (let z = 11; z <= 13; z++) {
  for (const y of [8, 9]) put(x, y, z, "light_gray_concrete");
  put(x, 10, z, "smooth_quartz_slab", { type: "bottom" });
}

// Warm lights behind some glazed bays: one glowstone in the interior cell just inside the glass.
for (const [key, [block]] of [...spec]) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  if (((x * 7 + z * 3 + y * 5) % 6) !== 0) continue;
  const open = openSides(x, z);
  if (open.length !== 1) continue;
  const [ox, oz] = DIRS[open[0]];
  const ix = x - ox, iz = z - oz;
  if (!inside(ix, iz) || openSides(ix, iz).length || has(ix, y, iz)) continue;
  put(ix, y, iz, "glowstone");
}

// Panes connect to the solid blocks and panes beside them, as they do in the game.
const g = new Voxels(SIZE);
const solid = (x, y, z) => has(x, y, z) && spec.get(`${x},${y},${z}`)[0] !== "air";
for (const [key, [block]] of spec) {
  const [x, y, z] = key.split(",").map(Number);
  let state;
  if (block === "glass_pane") {
    state = Object.fromEntries(Object.entries(DIRS).map(([d, [dx, dz]]) => [d, String(solid(x + dx, y, z + dz))]));
  }
  g.set(x, y, z, block, state);
}

g.save(OUT);
