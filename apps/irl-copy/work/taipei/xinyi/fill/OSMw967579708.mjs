import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579708";
const W = 31, H = 23, D = 29;

// Record: no metadata. Decided: 1980s-era, 2-storey low-rise office/commercial block,
// reinforced concrete frame with white tiled spandrels, smooth quartz piers, tinted glazing,
// shopfront entrance on the ground floor, flat roof with parapet and rooftop plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

const minG = Math.min(...ground.values());
const B = minG + 1;          // ground-floor slab level
const ROOF = B + 10;         // roof deck top (about 11 blocks above lowest ground)
const PARAPET = B + 11;

const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const dirs = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const inside = (x, z) => ground.has(key(x, z));
const missing = (x, z) => dirs.filter(([, dx, dz]) => !inside(x + dx, z + dz));
const isEdge = (x, z) => missing(x, z).length > 0;
const alongT = (face, x, z) => (face === "north" || face === "south" ? x : z);
const vec = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const glassProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Pier test: corners and every third bay along the wall are piers.
const isPier = (x, z) => {
  const m = missing(x, z);
  if (m.length > 1) return true;
  const face = m[0][0];
  return alongT(face, x, z) % 3 === 0;
};

// ---- Pass 1: slabs, facade, parapet ----
for (const [x, z] of cells) {
  const edge = isEdge(x, z);
  const m = missing(x, z);

  // Floor slabs and roof deck (solid across the footprint)
  put(x, B, z, edge ? "polished_andesite" : "smooth_stone");
  put(x, B + 5, z, "smooth_stone");
  put(x, ROOF, z, "light_gray_concrete");

  if (!edge) continue;

  const face = m[0][0];
  const pier = isPier(x, z);

  // Ground floor: base course, glazing bays, spandrel
  for (let y = B + 1; y <= B + 3; y++) {
    if (pier) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_blue_stained_glass_pane", glassProps);
  }
  put(x, B + 4, z, pier ? "smooth_quartz" : "white_concrete");

  // Upper floor
  for (let y = B + 6; y <= B + 8; y++) {
    if (pier) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_blue_stained_glass_pane", glassProps);
  }
  put(x, B + 9, z, pier ? "smooth_quartz" : "white_concrete");

  // Parapet cornice on the perimeter
  put(x, PARAPET, z, "smooth_stone");
}

// ---- Pass 2: entrance on the chosen face ----
const faceCount = {};
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (m.length === 1) faceCount[m[0][0]] = (faceCount[m[0][0]] || 0) + 1;
}
const doorFace = faceCount.south
  ? "south"
  : Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

const faceCells = cells
  .filter(([x, z]) => {
    const m = missing(x, z);
    return m.length === 1 && m[0][0] === doorFace;
  })
  .sort((a, b) => alongT(doorFace, a[0], a[1]) - alongT(doorFace, b[0], b[1]));

let doorCell = null;
if (faceCells.length) {
  const mid = Math.floor(faceCells.length / 2);
  for (let i = 0; i < faceCells.length && !doorCell; i++) {
    for (const k of [mid + i, mid - i]) {
      const c = faceCells[k];
      if (c && !isPier(c[0], c[1])) { doorCell = c; break; }
    }
  }
}

if (doorCell) {
  const [dx0, dz0] = doorCell;
  const doorBlock = { facing: doorFace, hinge: "left", open: "false", powered: "false" };
  put(dx0, B + 1, dz0, "dark_oak_door", { ...doorBlock, half: "lower" });
  put(dx0, B + 2, dz0, "dark_oak_door", { ...doorBlock, half: "upper" });
  // Hanging lantern over the entrance, below the spandrel
  put(dx0, B + 3, dz0, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- Pass 3: warm interior lights behind selected glazing ----
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (m.length !== 1) continue;
  const face = m[0][0];
  if (isPier(x, z)) continue;
  if (doorCell && x === doorCell[0] && z === doorCell[1]) continue;
  const t = alongT(face, x, z);
  const [vx, vz] = vec[face];
  const ix = x - vx, iz = z - vz;
  if (!inside(ix, iz)) continue;
  if (t % 6 === 1) put(ix, B + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if (t % 6 === 4) put(ix, B + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- Pass 4: rooftop plant and a central penthouse ----
const px0 = minX + 5, px1 = maxX - 5, pz0 = minZ + 5, pz1 = maxZ - 5;
let hasPenthouse = px0 <= px1 && pz0 <= pz1;
if (hasPenthouse) {
  for (let x = px0; x <= px1 && hasPenthouse; x++)
    for (let z = pz0; z <= pz1; z++)
      if (!inside(x, z)) { hasPenthouse = false; break; }
}
const inPenthouse = (x, z) => hasPenthouse && x >= px0 && x <= px1 && z >= pz0 && z <= pz1;

if (hasPenthouse) {
  for (let x = px0; x <= px1; x++)
    for (let z = pz0; z <= pz1; z++) {
      put(x, PARAPET, z, "white_concrete");
      put(x, PARAPET + 1, z, "smooth_quartz");
    }
}

for (const [x, z] of cells) {
  if (isEdge(x, z) || inPenthouse(x, z)) continue;
  if (x % 6 === 2 && z % 6 === 2) put(x, PARAPET, z, "iron_block");
}

// ---- Pass 5: foundation from y 0 up to each cell's ground (written last, so it wins below ground) ----
for (const [x, z, gr] of cells) {
  const top = Math.round(gr);
  for (let y = 0; y <= top; y++) put(x, y, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
