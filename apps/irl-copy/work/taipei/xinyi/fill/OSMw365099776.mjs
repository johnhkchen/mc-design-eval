import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099776";
const W = 20, H = 23, D = 45;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Lowest ground under the footprint; roof sits ~11 blocks above it.
const base = Math.min(...cells.map(c => c[2]));
const ROOF = base + 10;          // top block layer of the building (roof surface at base+11)

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Edge cells = footprint cells with a missing 4-neighbour.
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));

// Front = edge cell on the minimum-z side, nearest the middle of the footprint.
const minZ = Math.min(...edgeCells.map(c => c[1]));
const xs = cells.map(c => c[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
const frontCell = edgeCells
  .filter(c => c[1] === minZ)
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0];

// Pane connection states depending on which way the wall faces.
const paneZFacing = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneXFacing = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs only, air gap between them.
    put(x, gr, z, "smooth_stone");
    if (base + 5 >= gr) put(x, base + 5, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");                 // flat roof deck
    if (x % 5 === 2 && z % 9 === 4) put(x, ROOF + 1, z, "light_gray_concrete"); // AC plant
    continue;
  }

  // Edge: facade. Wall faces +-z when a z-neighbour is missing.
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const bayPos = zFace ? x % 3 : z % 3;
  const winCol = bayPos === 1;                        // window bay
  const pier = bayPos === 0;                          // stone pilaster beside each window
  const lit = ((x * 7 + z * 13) % 5 === 0);
  const pane = zFace ? paneZFacing : paneXFacing;

  for (let y = gr; y <= ROOF; y++) {
    const r = y - base;
    let b = pier ? "stone_bricks" : "white_terracotta", p;
    if (y === gr) {
      b = "stone_bricks";                              // base course / plinth
    } else if (r === 4) {
      b = "red_terracotta";                            // lintel band, colour accent
    } else if (r === 5 || r === 9) {
      b = "smooth_stone";                              // storey lines / sill course
    } else if (r === 10) {
      b = "stone_brick_slab";                          // parapet cap
      p = { type: "top", waterlogged: "false" };
    } else if (r >= 1 && r <= 3) {
      if (winCol) b = "glass";                         // shopfront glazing
    } else if (r >= 6 && r <= 8) {
      if (winCol) {
        if (r === 7 && lit) b = "glowstone";           // warm light behind the glass
        else { b = "light_blue_stained_glass_pane"; p = pane; }
      }
    }
    put(x, y, z, b, p);
  }
}

// Entrance on the front cell: recessed door, canopy slab, hanging lanterns.
if (frontCell) {
  const [fx, fz, fg] = frontCell;
  const yDoor = fg + 1;
  // Canopy over the door bay: bottom slab at base+3, supported by the lintel wall above.
  for (const dx of [-1, 0, 1]) {
    if (has(fx + dx, fz) && isEdge(fx + dx, fz)) {
      put(fx + dx, base + 3, fz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  put(fx, yDoor, fz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(fx, yDoor + 1, fz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lanterns hang from the canopy slab beside the door head.
  for (const dx of [-1, 1]) {
    if (has(fx + dx, fz) && isEdge(fx + dx, fz)) {
      put(fx + dx, base + 2, fz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
