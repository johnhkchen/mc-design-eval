import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style commercial block, c.1990s: 4 storeys of white concrete
// with a shopfront ground floor, tinted glass bands, stone plinth, cornice and parapet.
// Storey floors sit at L + 5k (L = lowest ground under the footprint); roof slab at L+20,
// parapet at L+21, so the top is about 22 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588118452";
const W = 28, H = 34, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let L = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < L) L = gr;
}
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces. north = -z, south = +z, west = -x, east = +x.
// Pane props: a pane on a north/south face runs east-west, on east/west runs north-south.
const EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DIRS = [
  { name: "north", dx: 0, dz: -1, pane: EW },
  { name: "south", dx: 0, dz: 1, pane: EW },
  { name: "west", dx: -1, dz: 0, pane: NS },
  { name: "east", dx: 1, dz: 0, pane: NS },
];

const ROOF_Y = L + 20;   // roof slab (top of storey 4)
const PARAPET_Y = L + 21;
const WALL_TOP = L + 19; // cornice band sits at L+19

const missingOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Pass 1: foundations, floor slabs, roof slab, walls, articulation, windows.
for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Storey floor slabs (interior and edge) and roof slab.
  for (let k = 1; k <= 3; k++) {
    const f = L + 5 * k;
    if (f >= gy) put(x, f, z, "smooth_stone");
  }
  if (ROOF_Y >= gy) put(x, ROOF_Y, z, "light_gray_concrete");

  const missing = missingOf(x, z);
  if (missing.length === 0) continue; // interior cell, nothing more on this pass

  const face = missing[0];
  const along = face.dx !== 0 ? z : x;
  const isPillar = (along % 3) === 0;

  // Spandrel walls from ground to the cornice line.
  for (let y = gy; y <= WALL_TOP; y++) put(x, y, z, "white_concrete");

  // Polished plinth course at ground level.
  put(x, gy, z, "polished_andesite");

  // Gray pillars every third bay.
  if (isPillar) {
    for (let y = gy + 1; y <= WALL_TOP; y++) put(x, y, z, "gray_concrete");
  }

  // Storey lines (lintel bands) at L+4, L+9, L+14, L+19.
  for (let k = 0; k < 4; k++) {
    const ly = L + 5 * k + 4;
    if (ly >= gy) put(x, ly, z, "smooth_stone");
  }

  // Glass panes in the 3-block window band of each storey, not on pillars.
  for (let k = 0; k < 4; k++) {
    const f = L + 5 * k;
    const lo = Math.max(f + 1, gy + 1);
    const hi = f + 3;
    for (let y = lo; y <= hi; y++) {
      if (isPillar) continue;
      put(x, y, z, "light_blue_stained_glass_pane", face.pane);
    }
    // Warm light behind some windows, in the interior cell just inside the facade.
    const yl = f + 2;
    if (!isPillar && yl >= gy + 1 && (along + k) % 4 === 0) {
      const ix = x - face.dx;
      const iz = z - face.dz;
      if (has(ix, iz) && groundAt(ix, iz) <= yl) {
        put(ix, yl, iz, k === 0 ? "glowstone" : "shroomlight");
      }
    }
  }

  // Parapet ring on the roof edge.
  put(x, PARAPET_Y, z, "white_concrete");
}

// Shopfront: stone-framed glass under the first lintel, with a dark canopy over the door.
// Door on the street-side (north, min-z) face, nearest the middle of the footprint.
let door = null;
for (const [x, z] of cells) {
  if (!has(x, z - 1)) {
    if (!door || Math.abs(x - 14) < Math.abs(door[0] - 14)) door = [x, z];
  }
}
if (door) {
  const [dx0, dz0] = door;
  const gd = groundAt(dx0, dz0);
  put(dx0, gd + 1, dz0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx0, gd + 2, dz0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy over the entrance bay, three cells wide, along the facade.
  for (let ox = -1; ox <= 1; ox++) {
    const cx = dx0 + ox;
    const cz = dz0;
    if (!has(cx, cz) || has(cx, cz - 1)) continue;
    const gc = groundAt(cx, cz);
    put(cx, gc + 3, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: roof equipment (AC units) on the roof slab, set back from the parapet.
for (const [x, z, gy] of cells) {
  if (missingOf(x, z).length !== 0) continue;
  if (ROOF_Y < gy) continue;
  if (x % 9 === 4 && z % 9 === 5) {
    put(x, PARAPET_Y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
