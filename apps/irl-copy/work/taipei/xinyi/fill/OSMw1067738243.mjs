import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738243";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

// Common floor level: highest ground under the footprint, so the body is level
const B = Math.max(...cells.map(c => c[2]));

// Faces of each cell that are exposed (outside the footprint)
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}
const isPerim = (x, z) => facesOf(x, z).length > 0;

const set = (x, y, z, id, props) => g.set(x, y, z, id, props);

// 1) Foundation: solid from y 0 up to the floor level under every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < B; y++) set(x, y, z, "stone_bricks");
}

// Intermediate floor slabs and roof deck (all footprint cells)
for (const [x, z] of cells) {
  set(x, B + 5, z, "smooth_stone");   // second-storey floor
  set(x, B + 10, z, "smooth_stone");  // roof deck
}

// 2) Walls, storeys, shopfronts and windows on the perimeter
const mid = Math.round((minX + maxX) / 2);

for (const [x, z] of cells) {
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;

  // base course at grade
  set(x, B - 1, z, "polished_andesite");

  const alongNS = faces.includes("n") || faces.includes("s");
  const alongWE = faces.includes("w") || faces.includes("e");
  const corner = alongNS && alongWE;
  const i = alongNS ? x - minX : z - minZ;
  const pier = corner || i % 3 === 0;

  // Ground storey: shopfront glass with a lintel band, piers in stone
  for (let y = B; y <= B + 3; y++) {
    set(x, y, z, pier ? (corner ? "white_concrete" : "polished_andesite") : "light_blue_stained_glass");
  }
  set(x, B + 4, z, pier ? "white_concrete" : "light_gray_concrete");

  // Second storey: sill, glazed ribbon, lintel
  set(x, B + 5, z, pier ? "white_concrete" : "light_gray_concrete");
  for (let y = B + 6; y <= B + 8; y++) {
    set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  set(x, B + 9, z, "light_gray_concrete");

  // Cornice and parapet
  set(x, B + 10, z, "light_gray_concrete");
  set(x, B + 11, z, "white_concrete");
}

// Entrance on the north (low z) facade, centred
if (has(mid, minZ)) {
  const ex = mid, ez = minZ;
  set(ex, B, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(ex, B + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  set(ex, B + 2, ez, "light_gray_concrete");
  set(ex, B + 3, ez, "light_gray_concrete");
  // warm lanterns standing just inside either side of the door
  for (const dx of [-1, 1]) {
    if (has(ex + dx, ez + 1)) {
      set(ex + dx, B, ez + 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 3) Warm light behind some upper-storey windows (glowstone in the interior air gap)
for (const [x, z] of cells) {
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;
  const alongNS = faces.includes("n") || faces.includes("s");
  const alongWE = faces.includes("w") || faces.includes("e");
  if (alongNS && alongWE) continue;
  const i = alongNS ? x - minX : z - minZ;
  if (i % 3 !== 1 || Math.floor(i / 3) % 2 !== 0) continue;

  // inward neighbour across the exposed face
  let ix = x, iz = z;
  if (faces.includes("n")) iz = z + 1;
  else if (faces.includes("s")) iz = z - 1;
  else if (faces.includes("w")) ix = x + 1;
  else if (faces.includes("e")) ix = x - 1;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    set(ix, B + 7, iz, "glowstone");
  }
}

// 4) Roof equipment: a plant block with a red signage band
for (let x = mid - 4; x <= mid + 4; x++) {
  for (let z = 2; z <= 6; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    set(x, B + 11, z, "light_gray_concrete");
  }
}
for (let x = mid - 2; x <= mid + 2; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    set(x, B + 12, z, "red_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
