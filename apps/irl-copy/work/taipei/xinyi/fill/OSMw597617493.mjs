import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 冠德花園城堡: ~10-storey 1990s residential block, white painted concrete,
// light-grey floor bands, glass-and-iron-balcony bays, stone base, parapet roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617493";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]

const W = 35, H = 66, D = 24;
const ROOF = 50;      // roof deck, 10 storeys of 5 blocks above ground
const TOP = 54;       // parapet cap, lidar roof ~54 blocks above lowest ground
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior faces: [dx, dz, name]
const FACES = [
  [0, -1, "N"],
  [0, 1, "S"],
  [-1, 0, "W"],
  [1, 0, "E"],
];

const isEdge = (x, z) => FACES.some(([dx, dz]) => !has(x + dx, z + dz));

// Pane / bar connection states so the run reads continuous along the face
function runProps(face) {
  if (face === "N" || face === "S")
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Entrance: middle exterior cell of the north face
const nFaceXs = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entX = nFaceXs.length ? nFaceXs[Math.floor(nFaceXs.length / 2)] : null;

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

// 2. Floor slabs on every storey line (relative to each cell's ground), interiors hollow otherwise
for (const [x, z, gr] of cells)
  for (let y = gr; y < ROOF; y += 5) put(x, y, z, "light_gray_concrete");

// 3. Roof deck over every footprint cell
for (const [x, z] of cells) put(x, ROOF, z, "light_gray_concrete");

// 4. Facades on exterior faces
for (const [x, z, gr] of cells) {
  for (const [dx, dz, face] of FACES) {
    if (has(x + dx, z + dz)) continue;
    const u = (face === "N" || face === "S") ? x - minX : z - minZ;
    const isEntrance = face === "N" && x === entX;

    for (let y = gr; y < ROOF; y++) {
      const s = Math.floor((y - gr) / 5);   // storey index
      const r = (y - gr) % 5;               // row within storey
      const pillar = u % 3 === 0;

      if (s === 0) {
        // Ground floor: stone base, shopfront glass, entrance door, lintel
        if (r === 0) { put(x, y, z, "polished_andesite"); continue; }
        if (isEntrance && (r === 1 || r === 2)) {
          const half = r === 1 ? "lower" : "upper";
          put(x, y, z, "oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; }
        if (pillar) { put(x, y, z, "stone_bricks"); continue; }
        put(x, y, z, "glass_pane", runProps(face));
        continue;
      }

      // Upper storeys
      if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }      // floor band
      if (r === 4) {                                                        // balcony rail
        if (pillar) put(x, y, z, "white_concrete");
        else put(x, y, z, "iron_bars", runProps(face));
        continue;
      }
      if (pillar) { put(x, y, z, "white_concrete"); continue; }            // mullion
      put(x, y, z, "glass_pane", runProps(face));                          // window

      // Warm light behind some windows (inside the footprint, one cell in)
      if (r === 2 && (u + s) % 4 === 0) {
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// 5. Parapet and cornice on the outer ring
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  put(x, ROOF, z, "light_gray_concrete");
  for (let y = ROOF + 1; y < TOP; y++) put(x, y, z, "white_concrete");
  put(x, TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 6. Roof plant: a few small mechanical boxes on interior roof cells
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if ((x * 5 + z * 3) % 11 === 0) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
