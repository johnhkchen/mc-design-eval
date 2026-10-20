import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374046";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, VH = 23, D = 20;
const g = new Voxels([W, VH, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const minG = Math.min(...ground.values());

// Two storeys of 5 blocks, parapet course, roof surface at minG+10, equipment above.
const F1 = minG + 5;   // first-floor line
const F2 = minG + 10;  // cornice / roof surface course
const TOP = minG + 11; // roof top (about 11 blocks above lowest ground)

// Palette: 1980s-90s Taipei mid-rise office/retail, white tile walls, blue tinted glass.
const WALL = "white_terracotta";
const BAND = "smooth_quartz";
const CORNER = "quartz_pillar";
const PLINTH = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const FASCIA = "red_concrete";
const SLAB = "smooth_stone";
const ROOF = "light_gray_concrete";
const DOOR = "dark_oak_door";

const dirs = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];

const put = (x, y, z, id, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= VH) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const has = (x, z) => ground.has(key(x, z));
const missingDirs = (x, z) => dirs.filter((d) => !has(x + d.dx, z + d.dz));
const isEdge = (x, z) => missingDirs(x, z).length > 0;

// Choose the entrance: a street-side (north) edge cell nearest the middle of the frontage.
const edgeCells = cells.map(([x, z]) => [x, z]).filter(([x, z]) => isEdge(x, z));
let doorCands = edgeCells.filter(([x, z]) => missingDirs(x, z).some((d) => d.dz === -1));
if (doorCands.length === 0) doorCands = edgeCells;
const meanX = doorCands.reduce((s, [x]) => s + x, 0) / Math.max(1, doorCands.length);
doorCands.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
const doorCell = doorCands[0] ?? null;
let doorFacing = null;
if (doorCell) {
  const md = missingDirs(doorCell[0], doorCell[1]);
  const pick = md.find((d) => d.dz === -1) ?? md[0];
  doorFacing = pick.facing;
}

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (gr >= TOP) continue;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  const md = missingDirs(x, z);
  const edge = md.length > 0;
  const corner = md.length >= 2;

  if (!edge) {
    // Interior: floor slabs per storey, air between, roof slab on top.
    if (gr < VH) put(x, gr, z, SLAB);
    if (F1 > gr) put(x, F1, z, SLAB);
    if (F2 >= gr) put(x, F2, z, ROOF);
    continue;
  }

  const windowCell = !corner && (x + z) % 2 === 0;

  for (let y = gr; y <= F2; y++) {
    if (y === gr) {
      put(x, y, z, PLINTH);
    } else if (corner) {
      put(x, y, z, CORNER);
    } else if (y === F2) {
      put(x, y, z, BAND);
    } else if (y < F1) {
      // Ground-floor shopfront.
      if (y === F1 - 1) put(x, y, z, FASCIA);
      else if ((x + z) % 2 === 0) put(x, y, z, GLASS);
      else put(x, y, z, BAND);
    } else if (y === F1) {
      put(x, y, z, BAND);
    } else {
      // Second storey: window grid with frames.
      if (windowCell) {
        if (y === F1 + 4) put(x, y, z, BAND);
        else put(x, y, z, GLASS);
      } else {
        put(x, y, z, WALL);
      }
    }
  }

  // Interior slabs for edge cells: ground-floor slab is the plinth; keep floor line as band.
}

// Entrance door on the chosen cell.
if (doorCell) {
  const [x, z] = doorCell;
  const gr = Math.round(ground.get(key(x, z)));
  if (gr + 2 < F1 - 1) {
    put(x, gr + 1, z, DOOR, { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, DOOR, { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light behind glass: glowstone on interior cells just inside lit windows.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (!isEdge(x, z) || gr >= TOP) continue;
  const md = missingDirs(x, z);
  if (md.length !== 1) continue; // skip corners
  const out = md[0];
  const ix = x - out.dx, iz = z - out.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;

  // Shopfront light, sparse.
  const shopY = gr + 2;
  if (shopY < F1 - 1 && (x * 3 + z) % 4 === 0) {
    put(ix, shopY, iz, "glowstone");
  }
  // Upper-storey light, sparse.
  const upY = F1 + 2;
  if (upY < F2 && (x + z) % 2 === 0 && (x * 5 + z * 7) % 4 === 0) {
    put(ix, upY, iz, "glowstone");
  }
}

// Roof plant: a few condenser units on the interior roof.
if (TOP <= VH - 1) {
  for (const [x, z, gr0] of cells) {
    if (isEdge(x, z)) continue;
    if (Math.round(gr0) >= TOP) continue;
    if ((x * 3 + z * 5) % 7 === 0) put(x, F2 + 1, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
