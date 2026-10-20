import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466761";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 38, D = 23;
const g = new Voxels([W, H, D]);

// Materials: mid-century Taipei concrete block with pale tiled walls
const WALL = "smooth_quartz";
const BAND = "light_gray_concrete";
const PIER = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";
const PENT = "gray_concrete";
const GLOW = "glowstone";

// Storey slabs at y = 0,5,10,15,20; roof slab at 25; parapet at 26
const SLAB_Y = [0, 5, 10, 15, 20];
const ROOF_Y = 25;
const TOP_Y = 26;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function exposedSides(x, z) {
  return Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inside(x + dx, z + dz))
    .map(([n]) => n);
}

// Door: single-exposed edge cell on the south face nearest the middle
const doorCands = [];
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const ex = exposedSides(x, z);
  if (ex.length === 1 && ex[0] === "south") doorCands.push([x, z]);
}
doorCands.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
const doorCell = doorCands[0] ?? null;

// Centroid for the roof penthouse
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = sx / cells.length, cz = sz / cells.length;

function placeDoor(x, z) {
  const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(x, 1, z, "dark_oak_door", { ...props, half: "lower" });
  g.set(x, 2, z, "dark_oak_door", { ...props, half: "upper" });
}

for (const [x, z, gr] of cells) {
  const ex = exposedSides(x, z);
  const edge = ex.length > 0;
  const corner = ex.length >= 2;

  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < Math.max(gr, 1); y++) g.set(x, y, z, FOUND);

  // Interior floor slabs (non-edge cells) at each storey line and the roof
  if (!edge) {
    for (const y of [...SLAB_Y.slice(1), ROOF_Y]) {
      if (y >= gr) g.set(x, y, z, FLOOR);
    }
  }

  // Storey walls
  if (edge) {
    for (let k = 0; k < SLAB_Y.length; k++) {
      const base = SLAB_Y[k];
      // Storey line band
      if (base >= gr) g.set(x, base, z, BAND);

      for (let y = base + 1; y <= base + 4; y++) {
        if (y < gr) continue;
        let block = WALL;

        if (corner) {
          block = PIER;
        } else if (k === 0) {
          // Shopfront: glass in the first three rows, sign band on top
          if (y === base + 4) block = BAND;
          else if (doorCell && x === doorCell[0] && z === doorCell[1] && y <= base + 2) block = "dark_oak_door_placeholder";
          else block = GLASS;
        } else {
          // Upper storeys: two rows of windows, a mullion every third cell
          const winRow = y === base + 2 || y === base + 3;
          const winCol = (x + z) % 3 !== 0;
          block = winRow && winCol ? GLASS : WALL;
        }

        if (block === "dark_oak_door_placeholder") continue; // door placed separately
        g.set(x, y, z, block);
      }
    }

    // Parapet / cornice cap on the roof edge
    if (TOP_Y >= gr) g.set(x, TOP_Y, z, corner ? PIER : WALL);
  }

  // Roof slab over every footprint cell
  if (ROOF_Y >= gr) g.set(x, ROOF_Y, z, ROOF);
}

// Entrance door on the south face, after walls so it is not overwritten
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = ground.get(`${dx},${dz}`);
  if (gr <= 1) placeDoor(dx, dz);
}

// Glowstone behind some upper-storey windows, in the interior air gap
for (const [x, z, gr] of cells) {
  const ex = exposedSides(x, z);
  if (ex.length !== 1) continue;
  const out = DIRS[ex[0]];
  const ix = x - out[0], iz = z - out[1];
  if (!inside(ix, iz)) continue;
  if (exposedSides(ix, iz).length > 0) continue;

  for (let k = 1; k < SLAB_Y.length; k++) {
    const base = SLAB_Y[k];
    if ((x + z + k) % 4 !== 0) continue;
    if (!((x + z) % 3 !== 0)) continue;
    const y = base + 2;
    if (y < gr) continue;
    g.set(ix, y, iz, GLOW);
  }
}

// Roof penthouse: central plant box two blocks tall
for (const [x, z, gr] of cells) {
  if (exposedSides(x, z).length > 0) continue;
  if (Math.hypot(x - cx, z - cz) > 3.5) continue;
  for (const y of [TOP_Y, TOP_Y + 1]) {
    if (y >= gr) g.set(x, y, z, PENT);
  }
}

g.save(`${DIR}/${ID}.nbt`);
