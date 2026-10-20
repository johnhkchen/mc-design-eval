import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001528";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 21, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(c => key(c[0], c[1])));
const minX = Math.min(...cells.map(c => c[0]));

// One flat roof tier from the median lidar roof height (noise smoothed)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const roofT = Math.min(H - 1, roofs[Math.floor(roofs.length / 2)]);

const set = (x, y, z, id, props) => g.set(x, y, z, id, props);

// Storey lines: sandstone string course every 2 blocks above a 3-block shopfront
const isSlab = (y, gr, last) => y > gr + 2 && y < last - 1 && (y - gr - 3) % 2 === 0;
const isUpWin = (y, gr, last) => y >= gr + 4 && y <= last - 3 && (y - gr - 4) % 2 === 0;

// Entrance: north-face cell nearest the median x of that face
const northCells = cells.filter(c => !has.has(key(c[0], c[1] - 1)));
let doorCell = null;
if (northCells.length) {
  const xs = northCells.map(c => c[0]).sort((a, b) => a - b);
  const mx = xs[Math.floor(xs.length / 2)];
  doorCell = northCells.reduce((best, c) =>
    Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best);
}

for (const [x, z, gr] of cells) {
  const top = Math.min(H - 1, Math.max(roofT, gr + 5));
  const lastRow = top - 1;

  const zEdge = !has.has(key(x, z - 1)) || !has.has(key(x, z + 1));
  const xEdge = !has.has(key(x - 1, z)) || !has.has(key(x + 1, z));
  const ext = zEdge || xEdge;
  const odd = ((x - minX) % 2) === 1;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  for (let y = gr; y <= lastRow; y++) {
    if (!ext) {
      // Interior: floor slabs and roof deck only (no interiors, air between)
      if (y === gr || y === lastRow || isSlab(y, gr, lastRow)) {
        set(x, y, z, y === lastRow ? "stone_bricks" : "smooth_stone");
      }
      continue;
    }

    if (y === gr) {
      set(x, y, z, "stone_bricks");                       // plinth
    } else if (y === lastRow) {
      set(x, y, z, "stone_bricks");                       // roof cornice, full course
    } else if (y === lastRow - 1) {
      set(x, y, z, "sandstone");                          // frieze band
    } else if (isSlab(y, gr, lastRow)) {
      set(x, y, z, "sandstone");                          // brownstone string course
    } else if (zEdge && (y === gr + 1 || y === gr + 2)) {
      // Shopfront: glass display panes between dark timber posts
      if (odd) set(x, y, z, "glass");
      else set(x, y, z, "dark_oak_planks");
    } else if (zEdge && isUpWin(y, gr, lastRow)) {
      if (odd) set(x, y, z, "glass");                     // window glass
      else set(x, y, z, "bricks");                        // brick piers
    } else {
      set(x, y, z, "bricks");
    }
  }
}

// Entrance, canopy and warm lights behind some upper windows
for (const [x, z, gr] of cells) {
  const zEdge = !has.has(key(x, z - 1)) || !has.has(key(x, z + 1));
  if (!zEdge) continue;
  const onNorth = !has.has(key(x, z - 1));
  const outward = onNorth ? "north" : "south";
  const behindZ = onNorth ? z + 1 : z - 1;
  const top = Math.min(H - 1, Math.max(roofT, gr + 5));
  const lastRow = top - 1;
  const i = x - minX;

  if (doorCell && x === doorCell[0] && z === doorCell[1]) {
    // Doorway with a stone stoop-step inside the footprint and a small canopy above
    set(x, gr + 1, z, "dark_oak_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, gr + 2, z, "dark_oak_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
    set(x, gr + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    continue;
  }

  // Warm glow behind selected upper windows (interior air cell behind the glass)
  if (has.has(key(x, behindZ))) {
    for (let y = gr + 4; y <= lastRow - 3; y += 2) {
      if (i % 4 === 1) set(x, y, behindZ, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
