import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two shopfront/office storeys,
// cream tile-faced walls with light grey bands, a stone coping and a small
// rooftop plant room. Foundation fills to each cell's ground; the roof is
// held at a common absolute level so downhill cells show extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864102";
const W = 12, H = 23, D = 19;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};

const exts = (x, z) =>
  Object.keys(DIRS).filter((d) => !inside(x + DIRS[d].dx, z + DIRS[d].dz));

const interior = (x, z) =>
  inside(x, z) && Object.keys(DIRS).every((d) => inside(x + DIRS[d].dx, z + DIRS[d].dz));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Extents of the footprint, used for face indexing and the door position.
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);

// ---- Pass 1: foundation, shell, floor slabs and roof ----
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const e = exts(x, z);

  if (e.length === 0) {
    // Interior cell: second-floor slab and roof deck, air in between.
    if (gr + 5 < ROOF) put(x, gr + 5, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Perimeter wall column from ground to the roof coping.
  for (let y = gr; y <= ROOF; y++) {
    let b = "white_concrete";
    if (y === ROOF) b = "stone_bricks";                 // coping
    else if (y === ROOF - 1) b = "light_gray_concrete"; // cornice band
    else if (y === gr + 5 || y === gr + 9) b = "light_gray_concrete"; // storey lines and sill
    else if (y === gr) b = "polished_andesite";         // base course
    else if (y === gr + 4) b = "light_gray_concrete";   // shopfront lintel
    put(x, y, z, b);
  }
}

// ---- Pass 2: windows, door, canopy, lights and roof plant ----
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const e = exts(x, z);
  if (e.length === 0) continue;
  const corner = e.length >= 2;

  for (const d of e) {
    const { dx, dz, facing } = DIRS[d];
    const alongNS = d === "N" || d === "S";
    const idx = alongNS ? x - xmin : z - zmin;
    const pane = alongNS ? PANE_EW : PANE_NS;

    // Ground floor shopfront glass, with a pier every fourth bay.
    const groundPier = corner || idx % 4 === 0;
    // Upper floor windows, with a pier every third bay.
    const upperPier = corner || idx % 3 === 0;

    if (!groundPier) {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane", pane);
    }
    if (!upperPier) {
      for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass_pane", pane);
    }

    // Warm light behind some windows, in the interior air gap.
    const ix = x - dx, iz = z - dz;
    if (!corner && interior(ix, iz)) {
      if (!groundPier && idx % 3 === 1) {
        put(ix, gr + 2, iz, "glowstone");
      }
      if (!upperPier && idx % 4 === 2) {
        put(ix, gr + 7, iz, "glowstone");
      }
    }
  }
}

// Entrance on the north (street) face, at the middle of its frontage.
const northCells = cells
  .filter(([x, z]) => z === zmin && exts(x, z).includes("N"))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  const [dxC, dzC, dgr] = northCells[Math.floor(northCells.length / 2)];
  const doorX = dxC;
  const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  put(doorX, dgr + 1, dzC, "dark_oak_door", { ...doorProps, half: "lower" });
  put(doorX, dgr + 2, dzC, "dark_oak_door", { ...doorProps, half: "upper" });

  // Canopy over the entrance bay, spanning the door and one bay either side.
  for (const [cx, cz, cgr] of northCells) {
    if (Math.abs(cx - doorX) <= 1) {
      put(cx, cgr + 4, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Rooftop: a few AC units and a small stair housing on interior roof cells.
const roofCells = cells
  .filter(([x, z]) => interior(x, z))
  .sort((a, b) => a[1] - b[1] || a[0] - b[0]);

for (const [x, z] of roofCells) {
  if ((x % 4 === 1) && (z % 5 === 2)) {
    put(x, ROOF + 1, z, "iron_block");
  }
}

// Stair housing: a 3x3 box on interior roof cells, placed near the middle.
const housingOrigin = roofCells.find(([x, z]) => {
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (!interior(x + i, z + j)) return false;
  return x >= xmin + 2 && z >= zmin + 2;
});
if (housingOrigin) {
  const [hx, hz] = housingOrigin;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const edge = i === 0 || i === 2 || j === 0 || j === 2;
      if (edge) {
        put(hx + i, ROOF + 1, hz + j, "white_concrete");
        put(hx + i, ROOF + 2, hz + j, "white_concrete");
      }
      put(hx + i, ROOF + 3, hz + j, "light_gray_concrete");
    }
  }
  // Doorway on the south side of the housing.
  put(hx + 1, ROOF + 1, hz + 2, "air");
  put(hx + 1, ROOF + 2, hz + 2, "air");
}

g.save(`${DIR}/${ID}.nbt`);
