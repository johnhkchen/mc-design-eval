import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499478";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 40, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass_pane";

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { x, z, gr, roof });
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const med = roofs[roofs.length >> 1];
const minX = Math.min(...cells.map(c => c[0]));

// Front = north (low z) edge cells; door sits at the median front cell
const frontCells = cells.filter(c => !has(c[0], c[1] - 1)).sort((a, b) => a[0] - b[0]);
const fc = frontCells[frontCells.length >> 1];
const doorX = fc[0], doorZ = fc[1];

for (const [x, z, gr, roofRaw] of cells) {
  // Smooth lidar noise into one roof tier, keep real steps
  let top = Math.abs(roofRaw - med) <= 2 ? med : Math.round(roofRaw);
  top = Math.min(H - 2, Math.max(gr + 8, top));

  // Foundation and floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  if (!isEdge(x, z)) {
    // Interior: air gap, roof slab closes the top
    put(x, top - 1, z, "smooth_stone");
    // Rooftop units: closed box with slab lid, clear of the parapet
    if (x % 9 === 4 && z % 6 === 3 && top + 2 < H) {
      put(x, top, z, "light_gray_concrete");
      put(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Edge cell: determine which face it lies on
  const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z), edgeE = !has(x + 1, z);
  let face, along, inX, inZ;
  if (edgeN) { face = "n"; along = x; inX = x; inZ = z + 1; }
  else if (edgeS) { face = "s"; along = x; inX = x; inZ = z - 1; }
  else if (edgeW) { face = "w"; along = z; inX = x + 1; inZ = z; }
  else { face = "e"; along = z; inX = x - 1; inZ = z; }

  const m = (((along - (face === "n" || face === "s" ? minX : 0)) % 4) + 4) % 4;
  const isFront = face === "n";
  const isDoor = isFront && x === doorX && z === doorZ;
  const doorSurround = isFront && z === doorZ && Math.abs(x - doorX) === 1;
  const inside = has(inX, inZ) && !isEdge(inX, inZ);

  for (let y = gr + 1; y <= top - 2; y++) {
    let id = "calcite", p;

    // Base course on side faces
    if (!isFront && y === gr + 1) id = "stone_bricks";
    // String course at storey line
    if (y === gr + 5) id = "stone_bricks";
    // Cornice
    if (y === top - 2) { id = "stone_brick_slab"; p = { type: "bottom", waterlogged: "false" }; }

    // Openings: shopfront on the front, window bands elsewhere and above
    const winRow = isFront ? (y >= gr + 1 && y <= gr + 3) : (y >= gr + 2 && y <= gr + 4);
    const upRow = y >= gr + 6 && y <= top - 3;
    if (winRow || upRow) {
      if (m === 0) id = "stone_bricks";
      else if (isFront && winRow) id = GLASS;
      else if (m === 3) id = "calcite";
      else id = GLASS;
      p = undefined;
    }

    // Entrance surround: solid stone jambs beside the door
    if (doorSurround && y <= gr + 3) { id = "stone_bricks"; p = undefined; }

    // Awning fascia over the shopfront
    if (isFront && y === gr + 4) { id = "dark_oak_slab"; p = { type: "top", waterlogged: "false" }; }

    // Entrance door, transom above
    if (isDoor) {
      if (y === gr + 1) { id = "dark_oak_door"; p = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (y === gr + 2) { id = "dark_oak_door"; p = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (y === gr + 3) { id = GLASS; p = undefined; }
    }

    put(x, y, z, id, p);

    // Warm light behind glass
    if (inside && winRow && !isDoor && m === 1 && y === gr + 2) put(inX, y, inZ, "glowstone");
    if (inside && upRow && m === 2 && y === gr + 7) put(inX, y, inZ, "shroomlight");
  }

  // Parapet and roof surface
  put(x, top - 1, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
