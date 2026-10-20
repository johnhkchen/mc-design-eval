import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988095";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey commercial/civic block: stone base, white concrete walls, quartz storey bands,
// shopfront ground floor, punched window grid above, flat roof with plant and a parapet.
const W = 13, H = 23, D = 15;
const TOP = 11;               // parapet top, about 11 blocks above lowest ground
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inFp = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => gmap.get(`${x},${z}`);

const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: 1, dz: 0, f: "east" },
  { dx: -1, dz: 0, f: "west" },
];

const edgeFaces = (x, z) => DIRS.filter(d => !inFp(x + d.dx, z + d.dz));

// Pass 1: foundations, floors, walls, parapet
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab
  g.set(x, gr, z, "light_gray_concrete");

  // Upper floor slabs (storey lines at 5 and 10), full footprint
  for (const y of [5, 10]) {
    if (y > gr) g.set(x, y, z, "light_gray_concrete");
  }

  const faces = edgeFaces(x, z);
  const edge = faces.length > 0;

  if (!edge) continue;

  // Parapet / cornice course at the top of the walls
  for (let y = gr; y <= TOP; y++) {
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === 5 || y === 10 || y === TOP) { g.set(x, y, z, "quartz_block"); continue; }
  }

  if (faces.length >= 2) {
    // Corner pillar: plain white concrete through the storeys
    for (let y = gr + 1; y <= 9; y++) {
      if (y === 5) continue;
      g.set(x, y, z, "white_concrete");
    }
    continue;
  }

  // Single exposed face
  const face = faces[0];
  const t = (face.f === "north" || face.f === "south") ? x : z;

  // Shopfront band (ground floor)
  for (let y = gr + 1; y <= 4; y++) {
    if (t % 3 === 0) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_blue_stained_glass");
  }

  // Upper storey window grid
  for (let y = 6; y <= 9; y++) {
    if (y <= gr) continue;
    if (t % 3 === 1) g.set(x, y, z, "light_blue_stained_glass");
    else g.set(x, y, z, "white_concrete");
  }
}

// Pass 2: warm lights behind some upper windows
for (const [x, z, gr] of cells) {
  const faces = edgeFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const t = (face.f === "north" || face.f === "south") ? x : z;
  if (t % 3 !== 1 || t % 6 !== 1) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (!inFp(ix, iz)) continue;
  if (7 <= groundOf(ix, iz)) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Pass 3: entrance on the north face (middle of the face), double door
const northCells = cells
  .filter(([x, z]) => inFp(x, z) && !inFp(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length >= 3) {
  const [dx, dz, dgr] = northCells[Math.floor(northCells.length / 2)];
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  g.set(dx, dgr + 1, dz, "dark_oak_door", doorProps("lower"));
  g.set(dx, dgr + 2, dz, "dark_oak_door", doorProps("upper"));
  // Lintel above the door, in the shopfront band
  if (dgr + 3 <= 4) g.set(dx, dgr + 3, dz, "quartz_block");
}

// Pass 4: roof plant on the interior of the roof, plus a lightning rod
let rodPlaced = false;
for (const [x, z] of cells) {
  if (edgeFaces(x, z).length > 0) continue;
  if ((x * 3 + z * 5) % 9 === 4) {
    g.set(x, TOP, z, "iron_block");
    if (!rodPlaced) {
      g.set(x, TOP + 1, z, "lightning_rod", { facing: "up", powered: "false" });
      rodPlaced = true;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
