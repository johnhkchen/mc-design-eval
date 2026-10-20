import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459521.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459521.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Two-storey mid-century commercial block: white tiled concrete walls,
// stone base, pale cornice and parapet, glass shopfront below, punched
// windows above, flat roof with plant boxes.
const WALL = "white_concrete";
const BELT = "smooth_stone";
const BASE = "stone_bricks";
const GLASS = "glass_pane";
const ROOF = "light_gray_concrete";
const PARA = "smooth_quartz";
const PLANT = "stone_bricks";

const key = (x, z) => x + "," + z;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => has.has(key(x, z));

// dx, dz, facing name (z+ is south)
const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];

const missing = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isEdge = (x, z) => missing(x, z).length > 0;
const isCorner = (x, z) => {
  const m = missing(x, z);
  const mx = m.some(([dx]) => dx !== 0);
  const mz = m.some(([, dz]) => dz !== 0);
  return mx && mz;
};

// Storey lines (absolute y): ground floor slab at each cell's ground,
// first-floor slab at y=5, roof slab at y=11, parapet y=12.
const FLOOR2 = 5;
const ROOF_Y = 11;
const TOP_WALL = 10;

function isWindow(x, z, y, gc) {
  if (y < FLOOR2) {
    // ground storey: shopfront glass with mullion pillars every third cell
    return y >= gc + 1 && y <= Math.min(gc + 3, FLOOR2 - 1) && (x + z) % 3 !== 0;
  }
  // upper storey: punched windows in a regular grid
  return y >= FLOOR2 + 1 && y <= 9 && (x + z) % 2 === 1;
}

// 1. Foundations, floors, roof, walls
for (const [xr, zr, gcRaw] of cells) {
  const x = xr, z = zr;
  const gc = Math.round(gcRaw);

  // foundation solid from y0 up to ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, BASE);
  // ground floor slab
  g.set(x, gc, z, BELT);

  // first-floor slab across the whole plate (interior floor)
  if (gc < FLOOR2) g.set(x, FLOOR2, z, BELT);

  // roof slab across the whole plate
  g.set(x, ROOF_Y, z, ROOF);

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  if (edge) {
    for (let y = gc + 1; y <= TOP_WALL; y++) {
      if (y === FLOOR2 && gc < FLOOR2) {
        g.set(x, y, z, BELT); // floor belt course
        continue;
      }
      let v = WALL;
      if (!corner && isWindow(x, z, y, gc)) v = GLASS;
      g.set(x, y, z, v);
    }
    // cornice band and parapet
    g.set(x, ROOF_Y, z, BELT);
    g.set(x, ROOF_Y + 1, z, PARA);
  } else {
    // interior plate: air above the floor slabs (no interiors)
  }
}

// 2. Rooftop plant boxes on interior cells
for (const [x, z] of cells) {
  if (!isEdge(x, z) && x % 3 === 1 && z % 4 === 1) {
    g.set(x, ROOF_Y + 1, z, PLANT);
  }
}

// 3. Warm light inside some shopfront windows (lanterns on the interior floor)
for (const [x, z, gcRaw] of cells) {
  const gc = Math.round(gcRaw);
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  if (gc + 1 > FLOOR2 - 1) continue;
  if ((x + z) % 4 !== 1) continue;
  const m = missing(x, z);
  if (m.length !== 1) continue;
  const [dx, dz] = m[0];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz)) continue;
  g.set(ix, gc + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 4. Entrance on the south face where possible, else any outward face
let candidates = cells
  .map(([x, z, gcRaw]) => ({ x, z, gc: Math.round(gcRaw) }))
  .filter(({ x, z }) => isEdge(x, z) && !isCorner(x, z));
const southFacing = candidates.filter(({ x, z }) =>
  missing(x, z).some(([dx, dz]) => dx === 0 && dz === 1)
);
if (southFacing.length) candidates = southFacing;

const cx = (Math.min(...cells.map((c) => c[0])) + Math.max(...cells.map((c) => c[0]))) / 2;
candidates.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));

if (candidates.length) {
  const { x, z, gc } = candidates[0];
  const out = missing(x, z)[0] ?? [0, 1, "south"];
  const facing = out[2];

  // ground floor door opening: lower and upper halves
  g.set(x, gc + 1, z, "dark_oak_door", {
    facing,
    half: "lower",
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(x, gc + 2, z, "dark_oak_door", {
    facing,
    half: "upper",
    hinge: "left",
    open: "false",
    powered: "false",
  });
  // lintel over the entrance inside the wall line
  g.set(x, gc + 3, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

g.save(OUT);
