import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001488";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 26, D = 7;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, st) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const cellMap = new Map();
for (const c of cells) cellMap.set(`${c[0]},${c[1]}`, c);

// Smooth the lidar roof into one clean tier height for the whole block (median),
// then keep each cell's own ground for the foundations.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
let ROOF = roofs[Math.floor(roofs.length / 2)];
if (ROOF % 2 === 1) ROOF += 1;           // keep storey rows on a 2-block rhythm
if (ROOF > H - 4) ROOF = H - 4;
if (ROOF < 8) ROOF = 8;

const info = (x, z) => {
  const c = cellMap.get(`${x},${z}`);
  if (!c) return null;
  let gr = Math.max(0, Math.round(c[2]));
  if (gr > ROOF - 6) gr = ROOF - 6;
  return { gr, r: ROOF };
};

const FRONT = "brown_terracotta";  // brownstone-toned street face
const BRICK = "bricks";
const BAND = "smooth_stone";
const FOUND = "stone_bricks";
const DOOR = "dark_oak_door";
const ROOFMAT = "deepslate_tiles";

const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

// Pass 1: massing, foundations, floor slabs, roof, facades, windows, door.
for (const c of cells) {
  const x = c[0], z = c[1];
  const I = info(x, z);
  if (!I) continue;
  const { gr, r } = I;
  const perim = isPerim(x, z);
  const front = z === 0;
  const facadeMat = front ? FRONT : BRICK;
  const t = (z === 0 || z === D - 1) ? x : z;

  // Solid foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Floor slabs at r-2 and every second row down to the ground deck.
  const floors = new Set([gr]);
  for (let f = r - 2; f > gr; f -= 2) floors.add(f);

  for (let y = gr; y <= r - 1; y++) {
    // Entrance: centre bay of the street face, two blocks high.
    if (front && x === 6 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, DOOR, { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === r - 1) {
      put(x, y, z, perim ? "stone_bricks" : ROOFMAT);
      continue;
    }
    if (y === r - 2) {
      // Cornice band on the perimeter, floor slab inside.
      put(x, y, z, BAND);
      continue;
    }
    if (y === gr || floors.has(y)) {
      put(x, y, z, BAND);
      continue;
    }
    // Storey row
    if (!perim) continue; // air behind the glass
    // Window on every third column (centred on t%3===1); brick piers between.
    if (t % 3 === 1) put(x, y, z, "glass_pane");
    else put(x, y, z, facadeMat);
  }

  // Chimney stacks on the roof.
  if ((x === 3 || x === 10) && z === 3) {
    put(x, r, z, BRICK);
    put(x, r + 1, z, BRICK);
    put(x, r + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: warm lights behind some window glass, on the floor slab below.
for (const c of cells) {
  const x = c[0], z = c[1];
  const I = info(x, z);
  if (!I || !isPerim(x, z)) continue;
  const { gr, r } = I;
  const t = (z === 0 || z === D - 1) ? x : z;
  if (t % 3 !== 1) continue;
  let bx = x, bz = z;
  if (z === 0) bz = 1;
  else if (z === D - 1) bz = D - 2;
  else if (x === 0) bx = 1;
  else if (x === W - 1) bx = W - 2;
  if (!cellMap.has(`${bx},${bz}`)) continue;
  for (let y = gr + 1; y <= r - 3; y++) {
    const storeyRow = (r - 2 - y) % 2 === 1;   // rows between floor slabs
    if (!storeyRow) continue;
    if (z === 0 && x === 6) continue;          // keep the door bay clear
    if (((t + y) % 5) === 0) put(bx, y, bz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
