import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw541986978: 13 x 12 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey reinforced-concrete commercial block of the 1980s-90s:
// stone-bricked plinth, white-concrete frame with a glazed upper band, a shopfront
// on the ground floor, a smooth-stone roof slab, a parapet, and rooftop AC units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986978";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPPOSITE = { north: "south", south: "north", west: "east", east: "west" };

// Exterior faces of a cell: sides where no neighbouring footprint cell exists.
const exteriorFaces = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

const GLASS = "glass_pane";
const FRAME = "white_concrete";
const SLAB = "smooth_stone";
const PLINTH = "stone_bricks";
const PARAPET = "white_concrete";
const AC = "light_gray_concrete";

// Pass 1: foundation, floor slabs, roof slab, walls and windows per cell.
for (const [x, z, gr] of cells) {
  const roofY = Math.min(H - 2, gr + 10);
  const parapetY = Math.min(H - 1, gr + 11);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);

  // Ground-floor slab, storey line at +5, roof slab at +10.
  g.set(x, gr, z, SLAB);
  g.set(x, gr + 5, z, SLAB);
  g.set(x, roofY, z, SLAB);

  const ext = exteriorFaces(x, z);
  if (ext.length === 0) continue; // interior cell: air behind the glass, slabs only

  const isCorner = ext.length >= 2;

  // Base course on the exterior face.
  g.set(x, gr, z, PLINTH);

  // Walls: upper storey and ground storey.
  for (let y = gr + 1; y <= gr + 4; y++) g.set(x, y, z, FRAME);
  for (let y = gr + 6; y <= gr + 9; y++) g.set(x, y, z, FRAME);

  // Parapet on exterior cells.
  g.set(x, parapetY, z, PARAPET);

  // Window bays: mullions on corners and every third column.
  const bay = !isCorner && (x + z) % 3 !== 0;
  if (bay) {
    // Shopfront glazing on the ground floor.
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, GLASS);
    // Upper-storey window band.
    for (let y = gr + 7; y <= gr + 8; y++) g.set(x, y, z, GLASS);
  }

  // Warm light behind some upper windows (interior neighbour, inside the footprint).
  if (bay && (x + 2 * z) % 6 === 1) {
    const inward = OPPOSITE[ext[0]];
    const [dx, dz] = DIRS[inward];
    if (has(x + dx, z + dz)) g.set(x + dx, gr + 7, z + dz, "glowstone");
  }
}

// Pass 2: entrance on the north-facing exterior edge, nearest the footprint's middle.
const northCells = cells
  .filter(([x, z]) => exteriorFaces(x, z).includes("north"))
  .filter(([x, z]) => exteriorFaces(x, z).length === 1);
if (northCells.length) {
  const midX = (W - 1) / 2;
  northCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
  const [dx, dz, dg] = northCells[0];
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(dx, dg + 1, dz, "oak_door", doorProps("lower"));
  g.set(dx, dg + 2, dz, "oak_door", doorProps("upper"));
  // Transom above the door.
  g.set(dx, dg + 3, dz, GLASS);
}

// Pass 3: rooftop plant on interior-ish roof cells, and the parapet rim.
for (const [x, z, gr] of cells) {
  const roofY = Math.min(H - 2, gr + 10);
  const ext = exteriorFaces(x, z);
  if (ext.length === 0 && (x + z) % 4 === 0 && roofY + 2 < H) {
    g.set(x, roofY + 1, z, AC);
    g.set(x, roofY + 2, z, AC);
  }
}

g.save(`${DIR}/${ID}.nbt`);
