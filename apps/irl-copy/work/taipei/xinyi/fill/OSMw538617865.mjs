import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538617865.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538617865.nbt";

const W = 19, H = 23, D = 10;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Lookup of footprint cells -> ground
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const minG = Math.min(...cells.map(c => c[2]));
const TOP = minG + 10;          // parapet / roof deck row (roof ~11 blocks above lowest ground)
const SHOP0 = minG + 1, SHOP1 = minG + 3;   // ground-floor glazing rows
const LINTEL = minG + 4;
const FLOOR2 = minG + 5;        // storey line between floors
const WIN0 = minG + 6, WIN1 = minG + 8;     // upper-floor glazing rows
const HEAD = minG + 9;

const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward-facing directions per cell (missing neighbours in footprint)
function outsOf(x, z) {
  const out = [];
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d];
    if (!gmap.has(`${x + dx},${z + dz}`)) out.push(d);
  }
  return out;
}

// Front facade: direction with most exposed cells (tie -> south, north, east, west)
const counts = { south: 0, north: 0, east: 0, west: 0 };
for (const [x, z] of cells) for (const d of outsOf(x, z)) counts[d]++;
let front = "south";
for (const d of ["south", "north", "east", "west"]) if (counts[d] > counts[front]) front = d;

// Door: middle cell of the front facade
const alongOf = (d, x, z) => (d === "north" || d === "south" ? x : z);
const frontCells = cells
  .filter(([x, z]) => outsOf(x, z).includes(front))
  .sort((a, b) => alongOf(front, a[0], a[1]) - alongOf(front, b[0], b[1]));
let door = null;
if (frontCells.length) {
  const mid = frontCells[Math.floor(frontCells.length / 2)];
  door = { x: mid[0], z: mid[1], gz: mid[2] };
}

// 1. Foundations, floor slabs and roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  const outs = outsOf(x, z);
  if (outs.length === 0) {
    // interior: floor slab at storey line, roof deck at top
    if (FLOOR2 >= gr) put(x, FLOOR2, z, "white_concrete");
    if (TOP >= gr) put(x, TOP, z, "light_gray_concrete");
  }
}

// 2. Perimeter walls, bands, shopfronts, windows
for (const [x, z, gr] of cells) {
  const outs = outsOf(x, z);
  if (outs.length === 0) continue;
  const corner = outs.length >= 2;
  const d = outs[0];
  const a = corner ? 0 : alongOf(d, x, z);
  const isNS = d === "north" || d === "south";

  for (let y = gr; y <= Math.min(TOP, H - 1); y++) {
    let id = "white_concrete", props;
    if (corner) { id = "quartz_pillar"; props = { axis: "y" }; }

    if (!corner) {
      if (y >= SHOP0 && y <= SHOP1) {
        if (a % 4 === 0) id = "white_concrete";
        else {
          id = "light_blue_stained_glass_pane";
          props = isNS
            ? { north: "false", south: "false", east: "true", west: "true" }
            : { north: "true", south: "true", east: "false", west: "false" };
        }
      } else if (y >= WIN0 && y <= WIN1) {
        if (a % 3 === 0) id = "white_concrete";
        else {
          id = "light_blue_stained_glass_pane";
          props = isNS
            ? { north: "false", south: "false", east: "true", west: "true" }
            : { north: "true", south: "true", east: "false", west: "false" };
        }
      }
    }

    // bands and cornice
    if (y === LINTEL) { id = "smooth_stone"; props = undefined; }
    if (y === FLOOR2 || y === HEAD) { id = "light_gray_concrete"; props = undefined; }
    if (y === TOP) { id = "smooth_quartz"; props = undefined; }
    if (y === gr) { id = "polished_andesite"; props = undefined; }

    put(x, y, z, id, props);
  }

  // Warm light behind an upper window: glowstone in the air gap, standing on the storey slab
  if (!corner && gr <= WIN0 && a % 6 === 1) {
    const [dx, dz] = DIRS[d];
    const ix = x - dx, iz = z - dz;
    if (gmap.has(`${ix},${iz}`) && outsOf(ix, iz).length === 0) {
      put(ix, WIN0, iz, "glowstone");
    }
  }
}

// 3. Entrance: double-height door on the front facade with a canopy
if (door && door.gz <= SHOP0) {
  const dir = front;
  const a0 = alongOf(dir, door.x, door.z);
  put(door.x, door.gz, door.z, "dark_oak_door",
    { facing: dir, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.gz + 1, door.z, "dark_oak_door",
    { facing: dir, half: "upper", hinge: "left", open: "false", powered: "false" });

  // canopy: slab row over the door and its neighbours along the facade
  for (const [x, z, gr] of cells) {
    if (!outsOf(x, z).includes(dir)) continue;
    if (Math.abs(alongOf(dir, x, z) - a0) > 1) continue;
    if (gr > LINTEL) continue;
    put(x, LINTEL, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// 4. Roof plant: small rooftop units on the deck
for (const [x, z, gr] of cells) {
  if (outsOf(x, z).length) continue;
  if (gr > TOP) continue;
  if (x % 5 === 2 && (z === 4 || z === 5)) {
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "gray_concrete");
  }
}

g.save(OUT);
