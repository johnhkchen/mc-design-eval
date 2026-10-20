import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538403758";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 30, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup and levels
const ground = new Map();
let B = 0;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr > B) B = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => { if (inb(x, y, z)) g.set(x, y, z, b, p); };

// Storey levels: ground floor B, band B+5, upper storey B+6..B+9, roof deck B+10, parapet B+11
const G0 = B + 1;      // ground storey first course
const BAND = B + 5;    // storey line
const U0 = B + 6;      // upper storey first course
const ROOF = B + 10;   // roof deck
const PAR = B + 11;    // parapet course

// Outward faces of each footprint cell
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

const paneProps = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Along-face index and inward depth vector per face
const along = (face, x, z, minX, minZ) => (face === "N" || face === "S" ? x - minX : z - minZ);
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));

// Door on the north (street) face, centred along its run
const northCells = cells.map(c => [c[0], c[1]]).filter(([x, z]) => !has(x, z - 1)).sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;

// 1. Foundation, floor slabs, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");        // solid foundation to the common floor
  put(x, B, z, "smooth_stone");                                    // ground floor slab
  put(x, BAND, z, "stone_bricks");                                 // storey line
  put(x, ROOF, z, "light_gray_concrete");                          // roof deck
}

// 2. Walls, shopfronts, windows, parapet
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;
  const corner = faces.length >= 2;
  const isNorth = faces.includes("N");
  const face = faces[0];
  const idx = corner ? 0 : along(face, x, z, minX, minZ);

  // Ground storey (shopfront)
  const gPier = corner || idx % 4 === 0;
  for (let y = G0; y <= B + 4; y++) {
    if (gPier) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps(face));
    }
  }
  // Warm light behind a few shopfront panes (in the air gap's far wall)
  if (!gPier && !corner) {
    const [dx, dz] = inward[face];
    if (idx % 4 === 2 && has(x + 2 * dx, z + 2 * dz)) {
      put(x + 2 * dx, B + 2, z + 2 * dz, "glowstone");
    }
  }

  // Upper storey
  const uPier = corner || idx % 3 === 0;
  for (let y = U0; y <= B + 9; y++) {
    if (uPier) {
      put(x, y, z, "white_concrete");
    } else if (y === U0) {
      put(x, y, z, "smooth_stone");                                 // sill
    } else if (y === B + 9) {
      put(x, y, z, "white_concrete");                               // lintel
    } else {
      put(x, y, z, "glass_pane", paneProps(face));
    }
  }
  if (!uPier) {
    const [dx, dz] = inward[face];
    if (idx % 6 === 1 && has(x + 2 * dx, z + 2 * dz)) {
      put(x + 2 * dx, B + 7, z + 2 * dz, "shroomlight");
    }
  }

  // Parapet with corner piers and cap
  for (let y = PAR; y <= PAR; y++) {
    put(x, y, z, corner ? "light_gray_concrete" : "white_concrete");
  }
}

// 3. Entrance on the street face: recessed door in glass
if (doorCell) {
  const [dx0, dz0] = doorCell;
  put(dx0, B + 1, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, B + 2, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx0, B + 3, dz0, "light_gray_concrete");                       // door head
  // Entrance surround
  for (const off of [-1, 1]) {
    if (has(dx0 + off, dz0)) {
      put(dx0 + off, B + 1, dz0, "light_gray_concrete");
      put(dx0 + off, B + 2, dz0, "light_gray_concrete");
    }
  }
  // Lamp inside the entrance
  if (has(dx0, dz0 + 2)) put(dx0, B + 3, dz0 + 2, "glowstone");
}

// 4. Roof equipment: two plant boxes on the deck, set back from the parapet
const equip = [
  [Math.floor(W / 2) - 3, Math.floor(D / 2) - 1],
  [Math.floor(W / 2) + 2, Math.floor(D / 2) - 1],
];
for (const [ex, ez] of equip) {
  for (let dx = 0; dx < 2; dx++) {
    for (let dz = 0; dz < 2; dz++) {
      if (!has(ex + dx, ez + dz)) continue;
      put(ex + dx, ROOF + 1, ez + dz, "light_gray_concrete");
      put(ex + dx, ROOF + 2, ez + dz, "iron_bars");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
