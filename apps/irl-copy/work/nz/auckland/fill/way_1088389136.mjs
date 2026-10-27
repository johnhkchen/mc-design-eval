// Waipārūrū Hall (way 1088389136): a 1970s-80s concrete-framed office block on a footprint of 49 x 69 blocks.
// Decided from the record: lidar roofs sit at 66-74 blocks above the lowest ground (about 18 storeys at 4 blocks, the
// tallest core 74), a wide slab with a higher central core; white and light-grey precast concrete (frames, piers,
// spandrels), blue-tinted glass in a paired window grid, a stone plinth. Tiers are smoothed by a median over 5x5 cells
// and quantized to three roof levels (66 wing, 70 middle, 74 core), so each storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1088389136.cells.json", "utf8"));
const [W, H, D] = [49, 86, 69];
const g = new Voxels([W, H, D]);

// footprint: "x,z" -> { ground, roof (lidar), tier (smoothed, quantized) }
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, ground, roof, tier: 0 });
const at = (x, z) => cell.get(`${x},${z}`);
const tierOf = (r) => (r >= 71 ? 74 : r >= 68 ? 70 : 66);
for (const c of cell.values()) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.roof); }
  v.sort((a, b) => a - b);
  c.tier = tierOf(v[v.length >> 1]);
}

// a face is exposed where the neighbour is outside the footprint or sits on a lower roof: that cell is a wall
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (c) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.tier < c.tier; });

// materials
const FOUND = "smooth_stone", FILL = "stone", CONCRETE = "light_gray_concrete", FRAME = "white_concrete";
const GLASS = "light_blue_stained_glass", CORNICE = "smooth_stone_slab";

// entrance: the outward wall cell on the lowest ground (street side), first in scan order
let door = null;
for (const c of cell.values()) {
  const out = exposed(c).filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
  if (!out.length || c.tier < c.ground + 4) continue;
  if (!door || c.ground < door.c.ground) door = { c, out: out[0] };
}
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

for (const c of cell.values()) {
  const { x, z, ground, tier } = c;
  const walls = exposed(c);
  // foundation: solid from y 0 to the lowest-ground-under-the-cell, then the building on it
  for (let y = 0; y < ground; y++) g.set(x, y, z, walls.length ? FOUND : FILL);

  for (let y = ground; y < tier; y++) {
    const m = y % 4;
    if (!walls.length) {                                   // interior: floor slab per storey, air gap, roof cap
      if (y === tier - 1) g.set(x, y, z, CONCRETE);
      else if (m === 2) g.set(x, y, z, CONCRETE);
      continue;
    }
    if (y === tier - 1) { g.set(x, y, z, FRAME); continue; }                     // parapet course
    if (y === ground) { g.set(x, y, z, FOUND); continue; }                       // base course
    if (door && door.c === c && (y === ground + 1 || y === ground + 2)) {         // entrance door
      const facing = DIR_NAME[door.out.join(",")];
      const half = y === ground + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (m === 2) { g.set(x, y, z, CONCRETE); continue; }                          // spandrel: the floor line
    if (m === 1) { g.set(x, y, z, FRAME); continue; }                             // header over the glass
    // glass band: piers at corners and every third bay, panes between
    const along = walls[0][0] !== 0 ? z : x;
    const corner = walls.length > 1;
    if (corner || along % 3 === 0) { g.set(x, y, z, FRAME); continue; }
    g.set(x, y, z, GLASS);
    // a warm light in some windows, behind the glass in the air gap
    if ((along * 7 + y * 3 + x) % 11 === 0) {
      const [dx, dz] = walls[0], ix = x - dx, iz = z - dz;
      const inner = at(ix, iz);
      if (inner && !exposed(inner).length && y >= inner.ground && y < inner.tier - 1) g.set(ix, y, iz, "glowstone");
    }
  }
  // cornice on the wall tops
  if (walls.length && tier < H) g.set(x, tier, z, CORNICE, { type: "bottom", waterlogged: "false" });
}

// the core's roof: a plant room and a mast, both standing on the 74 roof
const core = [...cell.values()].filter((c) => c.tier === 74);
const cx0 = Math.round(core.reduce((s, c) => s + c.x, 0) / core.length);
const cz0 = Math.round(core.reduce((s, c) => s + c.z, 0) / core.length);
let room = null;
for (const c of core.sort((a, b) => Math.hypot(a.x - cx0, a.z - cz0) - Math.hypot(b.x - cx0, b.z - cz0))) {
  const ok = [];
  for (let x = c.x - 2; x <= c.x + 2; x++) for (let z = c.z - 3; z <= c.z + 3; z++) ok.push(at(x, z)?.tier === 74);
  if (ok.every(Boolean)) { room = c; break; }
}
if (room) {
  const [x0, x1, z0, z1] = [room.x - 2, room.x + 2, room.z - 3, room.z + 3];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = 74; y <= 76; y++) {
      if (y === 75 && edge && (x === room.x || z === room.z)) g.set(x, y, z, "iron_bars");   // vents on each face
      else if (edge) g.set(x, y, z, CONCRETE);
    }
    g.set(x, 77, z, FRAME);                                                             // room roof
  }
  g.set(room.x, 78, room.z, "iron_bars");
  g.set(room.x, 79, room.z, "iron_bars");
  g.set(room.x, 80, room.z, "iron_bars");
  g.set(room.x, 81, room.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1088389136.nbt");
console.log("blocks", info.blocks, "palette", info.palette, "room", room ? [room.x, room.z] : null, "door", door ? [door.c.x, door.c.z] : null);
