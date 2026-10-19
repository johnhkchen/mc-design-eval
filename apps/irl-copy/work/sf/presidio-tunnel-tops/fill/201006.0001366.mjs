// 3550 West Pacific Av (Presidio Heights, Miscellaneous/Mixed-Use): a 1920s-30s stucco apartment block over a
// commercial ground floor. Four storeys above a stone plinth, a cornice, a flat roof with a penthouse, a redwood
// tank and a brick chimney. The north (street) face has shopfronts with two recessed entrances; the east side
// drops to a lower storey on the downhill cells (ground 0), so it shows one more storey than the rest.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0001366.cells.json`, "utf8"));
const TOP = 10;                                    // roof surface at y 11 (the cornice tops out at 10)
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const ENTRANCES = [[4, 1], [14, 1]];               // on the north shopfront run

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inF = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Distance in cells from the outside: 1 = outer skin, 2 = inner skin (the wall is two blocks thick), 3+ = inside.
const dist = new Map(), queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([, dx, dz]) => !inF(x + dx, z + dz))) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(`${x},${z}`);
  for (const [, dx, dz] of DIRS) {
    const k = `${x + dx},${z + dz}`;
    if (inF(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const D = (x, z) => dist.get(`${x},${z}`) ?? 99;
const faces = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));
const isEntrance = (x, z) => ENTRANCES.some(([ex, ez]) => ex === x && ez === z);
const isFlank = (x, z) => ENTRANCES.some(([ex, ez]) => ez === z && Math.abs(ex - x) === 1);
for (const [ex, ez] of ENTRANCES) if (D(ex, ez) !== 1 || !faces(ex, ez).some(([n]) => n === "north")) throw new Error(`entrance ${ex},${ez} is not on the north face`);

// The intent: "x,y,z" -> { block, state }. Written to the volume at the end, once glass panes know their neighbours.
const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const clear = (x, y, z) => blocks.delete(`${x},${y},${z}`);
const at = (x, y, z) => blocks.get(`${x},${y},${z}`)?.block;
const bay = (i) => i % 3 !== 2;                    // two windows, then a pier, along each facade
const slab = { type: "bottom", waterlogged: "false" };

// Openings in the outer skin reach through to the inner skin: behind[x,z,y] = "glass" (a window) or "air" (a door bay).
const behind = new Map();
const lights = [];                                  // warm lights, one step inside each window (dist 3)

// Outer skin.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (D(x, z) !== 1) continue;
  const g = G(x, z), fs = faces(x, z), corner = fs.length > 1;
  const [name, dx, dz] = fs[0];                     // the facade a non-corner cell stands on
  const idx = dx === 0 ? x : z;                     // position along that facade, for the bays
  const shop = name === "north" && z <= 1;
  const entrance = shop && isEntrance(x, z);
  const flank = shop && isFlank(x, z);
  const bx = x - dx, bz = z - dz;                   // the inner-skin cell behind this one
  const canWin = !corner && D(bx, bz) === 2;
  const win = canWin && bay(idx);
  const open = (y, kind = "glass") => { behind.set(`${bx},${bz},${y}`, kind); };

  if (corner) {                                     // quoins at the corners, plinth at the bottom, cornice at the top
    for (let y = 0; y < TOP; y++) {
      if (y < 2) put(x, y, z, "stone_bricks");
      else put(x, y, z, "quartz_pillar", { axis: "y" });
    }
    put(x, TOP, z, "smooth_quartz");
    continue;
  }

  // The lower storey on the downhill (ground 0) cells sits at grade; the foundation fills under the others.
  if (g >= 1) put(x, 0, z, "stone_bricks");
  else if (win) { open(0); } else put(x, 0, z, "stone_bricks");

  // The plinth course, with a stoop up to each entrance.
  put(x, 1, z, entrance ? "stone_brick_stairs" : "stone_bricks",
    entrance ? { facing: name, half: "bottom", shape: "straight", waterlogged: "false" } : undefined);

  // Ground floor: shopfront glass on dark-wood piers, or recessed windows elsewhere, with two doors on the street.
  if (entrance) {
    const door = { facing: name, hinge: "left", open: "false", powered: "false" };
    put(x, 2, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, 3, z, "dark_oak_door", { ...door, half: "upper" });
    open(2, "air"); open(3, "air");
  } else if (flank) {
    put(x, 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    put(x, 3, z, "glass_pane");
    open(2, "air"); open(3, "air");
  } else if (shop) {
    if (win) { put(x, 2, z, "glass_pane"); put(x, 3, z, "glass_pane"); open(2, "air"); open(3, "air"); }
    else { put(x, 2, z, "dark_oak_planks"); put(x, 3, z, "dark_oak_planks"); }
  } else {
    for (const y of [2, 3]) if (win) open(y); else put(x, y, z, "smooth_quartz");
  }

  // Shopfront fascia (dark wood) or the storey line of stucco, then the upper storeys: two storeys of windows.
  put(x, 4, z, shop || entrance ? "dark_oak_slab" : "quartz_slab", slab);
  for (const y of [5, 6, 8, 9]) if (win) open(y); else put(x, y, z, "smooth_quartz");
  put(x, 7, z, "quartz_slab", slab);

  // Cornice: stucco with a row of dentils standing just above the roof.
  put(x, TOP, z, "smooth_quartz");
  if (idx % 2 === 0) put(x, TOP + 1, z, "smooth_quartz_slab", slab);
  if (win) for (const y of [2, 5, 8]) lights.push({ x, y, z, nx: bx - dx, nz: bz - dz });
}

// Inner skin (the second block of the wall): solid stucco, except where an opening reaches through it.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (D(x, z) !== 2) continue;
  for (let y = 0; y <= TOP; y++) put(x, y, z, y < 2 ? "stone_bricks" : "smooth_quartz");
  for (let y = 0; y <= TOP; y++) {
    const kind = behind.get(`${x},${z},${y}`);
    if (kind === "glass") put(x, y, z, "glass_pane");
    else if (kind === "air") clear(x, y, z);
  }
}

// Interior: foundation under the downhill-free cells, a floor slab per storey, roof over the top.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (D(x, z) < 3) continue;
  if (G(x, z) >= 1) put(x, 0, z, "stone_bricks");
  for (const y of [1, 4, 7, TOP]) put(x, y, z, "smooth_stone");
}

// Warm light in some windows: glowstone or shroomlight just inside the glass, in the air gap.
lights.forEach(({ x, y, z, nx, nz }, i) => {
  const h = (x * 7 + z * 13 + y * 5) % 5;
  if (h > 1 || D(nx, nz) < 3 || at(nx, y, nz)) return;
  put(nx, y, nz, h === 0 ? "glowstone" : "shroomlight");
});

// Roof: a penthouse stair and lift room in the middle of the roof, a redwood water tank, and a brick chimney.
const box = (x0, x1, z0, z1, y0, y1) => {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inF(x, z)) throw new Error(`roof ${x},${z} is off the footprint`);
    for (let y = y0; y <= y1; y++) out.push([x, y, z]);
  }
  return out;
};
// Penthouse walls: a door in the north wall, glass at the top row of the other walls, away from the corners.
for (const [x, y, z] of box(4, 8, 9, 12, 11, 13).filter(([x, , z]) => x === 4 || x === 8 || z === 9 || z === 12)) {
  const midWall = (z === 9 || z === 12) ? x > 4 && x < 8 : z > 9 && z < 12;
  if (z === 9 && x === 6 && y <= 12) put(x, y, z, "dark_oak_door", { facing: "north", hinge: "left", open: "false", powered: "false", half: y === 11 ? "lower" : "upper" });
  else if (y === 12 && midWall) put(x, y, z, "glass_pane");
  else put(x, y, z, "smooth_quartz");
}
for (const [x, , z] of box(4, 8, 9, 12, 14, 14)) put(x, 14, z, "smooth_stone_slab", slab);
for (const [x, y, z] of box(18, 20, 4, 6, 11, 13)) put(x, y, z, "spruce_planks");
for (const [x, , z] of box(18, 20, 4, 6, 14, 14)) put(x, 14, z, "spruce_slab", slab);
for (const [x, y, z] of box(11, 12, 4, 5, 11, 14)) put(x, y, z, "bricks");
for (const [x, , z] of box(11, 12, 4, 5, 15, 15)) put(x, 15, z, "brick_slab", slab);

// Glass panes connect to the solid blocks and panes beside them, as a real pane run would.
const FULL = new Set(["stone_bricks", "smooth_quartz", "smooth_stone", "dark_oak_planks", "quartz_pillar", "bricks", "spruce_planks"]);
const joins = (x, y, z) => { const b = at(x, y, z); return !!b && (FULL.has(b) || b === "glass_pane"); };
for (const [k, v] of blocks) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number), t = (b) => (b ? "true" : "false");
  v.state = { east: t(joins(x + 1, y, z)), north: t(joins(x, y, z - 1)), south: t(joins(x, y, z + 1)), west: t(joins(x - 1, y, z)), waterlogged: "false" };
}

// Write the volume. Lower storey and roof share one height; the tallest block is the chimney cap at y 15.
const vol = new Voxels([29, 23, 23]);
for (const [k, { block, state }] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  vol.set(x, y, z, block, state);
}
const out = `${DIR}/201006.0001366.nbt`;
const r = vol.save(out);
console.log(`footprint ${cells.length} cells; ${r.blocks} blocks, ${r.palette} palette entries -> ${out}`);
