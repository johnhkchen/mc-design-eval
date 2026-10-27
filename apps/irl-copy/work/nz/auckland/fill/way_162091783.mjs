// way 162091783: a three-storey 1930s brick commercial block on the Eden Terrace slope, as its lidar record gives it.
// Massing: the lidar roof, median-smoothed over 3x3, is quantized to two flat tiers (a two-storey wing where it sits
// at 10 or under, the three-storey main block otherwise), each with a one-block parapet. Storey lines sit at absolute
// y = 0, 4, 8 (smooth stone floor slabs), so the flat roof is level across the slope: the uphill (north) side has two
// storeys above its ground, the downhill (south) side three. Walls are red brick with stone-bricks foundations to each
// cell's ground; the ground storey is a shopfront on the south and east faces; the entrance sits in the south face.
// Windows are glass panes in 2-wide bays with white lintels and brick piers; warm glowstone sits behind some upper
// windows. A stair and lift overrun stands on the roof, and light-grey plant boxes sit on the deck. Interiors are air
// behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091783.cells.json", "utf8"));
const W = 21, D = 38, H = 26;
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091783.nbt";

// footprint: ground g and raw roof r per cell
const raw = new Map(cells.map(([x, z, g, r]) => [x + "," + z, { g, r }]));
const inFp = (x, z) => raw.has(x + "," + z);
const at = (x, z) => raw.get(x + "," + z);

// smoothed roof: median of the 3x3 neighbourhood, then two flat tiers
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at(x + dx, z + dz); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// per footprint cell: top level T (surface y), outward normal(s), exterior flag
const C = new Map();
for (const [x, z, g] of cells) {
  const n = [];
  if (!inFp(x + 1, z)) n.push([1, 0]);
  if (!inFp(x - 1, z)) n.push([-1, 0]);
  if (!inFp(x, z + 1)) n.push([0, 1]);
  if (!inFp(x, z - 1)) n.push([0, -1]);
  const m = medianRoof(x, z);
  C.set(x + "," + z, { x, z, g, T: m <= 10 ? 8 : 12, normals: n, corner: n.length > 1, ext: n.length > 0 });
}
const cellOf = (x, z) => C.get(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const paneCells = [];

// the entrance: south face, lowest ground, middle of the bottom row
const DOOR = { x: 13, z: 37 };
const CANOPY_ROW = [12, 13, 14];

// shopfront faces: south (+z) and east (+x)
const isShopFace = (c, n) => c.ext && !c.corner && (n[0] === 0 && n[1] === 1 || n[0] === 1 && n[1] === 0);

for (const c of C.values()) {
  const { x, z, g: gr, T } = c;
  const n = c.normals[0];
  // the facade coordinate along the wall: x for a z-facing wall, z for an x-facing wall
  const a = n ? (n[0] !== 0 ? z : x) : 0;
  const bay = a % 4 === 1 || a % 4 === 2;                         // 2-wide window bays; piers at a%4 0 and 3
  const k0 = Math.floor(gr / 4);                                  // the ground storey
  for (let y = 0; y <= (c.ext ? T : T - 1); y++) {
    let block = null, state;
    if (y === 0 || y < gr) block = "stone_bricks";                 // foundation and base course to each cell's ground
    else if (y % 4 === 0 && y < T) block = "smooth_stone";         // floor slab per storey (string course outside)
    else if (!c.ext) {
      if (y === T - 1) block = "smooth_stone";                     // roof deck (interior), light so the top does not read as a hole
    } else if (y === T) block = "smooth_stone";                    // parapet cap
    else {                                                         // the facade
      const shop = isShopFace(c, n) && Math.floor(y / 4) === k0;
      const row = y % 4;                                           // 1-2 window, 3 lintel
      if (c.corner || !bay) {
        block = shop && row !== 3 && y >= gr ? "dark_oak_planks" : "bricks";
      } else if (row === 3) {
        block = shop ? "bricks" : "white_concrete";
      } else if (y >= gr) {
        block = "glass_pane";
      }
      if (!block) block = "bricks";
      if (block === "glass_pane") paneCells.push([x, y, z]);
    }
    if (block) put(x, y, z, block);
  }
}

// the entrance: a dark oak door on the south face, its canopy band above
for (const x of CANOPY_ROW) {
  const c = cellOf(x, DOOR.z);
  if (c) put(x, c.g + 2, DOOR.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
{
  const c = cellOf(DOOR.x, DOOR.z);
  const lo = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
  const up = { ...lo, half: "upper" };
  put(DOOR.x, c.g, DOOR.z, "dark_oak_door", lo);
  put(DOOR.x, c.g + 1, DOOR.z, "dark_oak_door", up);
  // the door cell's glass is gone; pane list drops it
  const k = paneCells.findIndex(([x, y, z]) => x === DOOR.x && z === DOOR.z && y === c.g + 1);
  if (k >= 0) paneCells.splice(k, 1);
}

// warm light: glowstone behind some upper-storey windows, on the interior air cell inward of the glass
let lights = 0;
for (const c of C.values()) {
  if (!c.ext || c.corner) continue;
  const n = c.normals[0];
  const a = n[0] !== 0 ? c.z : c.x;
  if (!(a % 4 === 1 || a % 4 === 2)) continue;
  for (const y of [5, 9]) {
    if (y < c.g + 1 || y > c.T - 3) continue;
    if ((c.x * 3 + c.z * 5 + y) % 4 !== 0) continue;
    const ix = c.x - n[0], iz = c.z - n[1];
    const ic = cellOf(ix, iz);
    if (!ic || ic.ext) continue;
    put(ix, y, iz, "glowstone");
    lights++;
  }
}

// roof: a stair and lift overrun (2x2 interior cells nearest the middle) and light-grey plant boxes on the deck
const interior = (c) => c && !c.ext;
let best = null;
for (const c of C.values()) {
  const cs = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]].map(([x, z]) => cellOf(x, z));
  if (!cs.every(interior)) continue;
  if (cs.some((q) => q.T !== 12)) continue;
  const d = Math.hypot(c.x + 0.5 - 10, c.z + 0.5 - 18);
  if (!best || d < best.d) best = { d, x: c.x, z: c.z };
}
const overrun = new Set();
if (best) {
  for (const [x, z] of [[best.x, best.z], [best.x + 1, best.z], [best.x, best.z + 1], [best.x + 1, best.z + 1]]) {
    overrun.add(x + "," + z);
    put(x, 12, z, "stone_bricks");
    put(x, 13, z, "stone_bricks");
    put(x, 14, z, "smooth_stone");
  }
}
let plant = 0;
for (const c of C.values()) {
  if (!interior(c) || c.T !== 12 || overrun.has(c.x + "," + c.z)) continue;
  if ((c.x * 7 + c.z * 3) % 13 !== 0) continue;
  if (plant >= 4) break;
  put(c.x, 12, c.z, "light_gray_concrete");
  plant++;
}

// glass panes connect to the solid walls and to each other: set their four horizontal states from the neighbours
const paneNb = (x, y, z) => {
  const b = g.get(x, y, z);
  return !!b && b.block !== "minecraft:glowstone";
};
for (const [x, y, z] of paneCells) {
  const st = {
    north: paneNb(x, y, z - 1) ? "true" : "false",
    south: paneNb(x, y, z + 1) ? "true" : "false",
    east: paneNb(x + 1, y, z) ? "true" : "false",
    west: paneNb(x - 1, y, z) ? "true" : "false",
    waterlogged: "false",
  };
  put(x, y, z, "glass_pane", st);
}

const res = g.save(OUT);
console.log(`way_162091783: ${res.blocks} blocks, palette ${res.palette}, panes ${paneCells.length}, glowstone ${lights}, overrun ${best ? "yes" : "no"}, plant ${plant}`);
