import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024337094";
const W = 17, H = 23, D = 20;

// Record: roof ~11 blocks above lowest ground. Reads as a 2-storey mid-century
// Taipei commercial block: stone plinth, white tiled piers, light-blue glazing,
// smooth-stone storey bands, parapet cap, shopfront with entrance on the south face.
const ROOF_CAP = 11;   // parapet top block index (relative to lowest ground)
const DECK = 10;       // roof deck / top storey band
const FL1 = 5;         // first-floor slab and storey line

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));

const cellMap = new Map();
for (const [x, z, gr] of raw) {
  const g = Math.min(8, Math.max(0, gr - minG));
  cellMap.set(`${x},${z}`, g);
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const groundOf = (x, z) => cellMap.get(`${x},${z}`);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x - 1, z)) f.push("W");
  return f;
}

const cells = [...cellMap.keys()].map(k => k.split(",").map(Number));

// Entrance: middle of the southmost south-facing wall (fallback: any exposed face).
let southCells = cells.filter(([x, z]) => facesOf(x, z).includes("S"));
if (southCells.length === 0) southCells = cells.filter(([x, z]) => facesOf(x, z).length > 0);
const maxZ = Math.max(...southCells.map(([, z]) => z));
const frontRow = southCells.filter(([, z]) => z === maxZ).sort((a, b) => a[0] - b[0]);
const [entryX, entryZ] = frontRow[Math.floor(frontRow.length / 2)];

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function wallBlock(x, z, y, gr, faces) {
  const alongX = faces.includes("N") || faces.includes("S");
  const along = alongX ? x : z;
  const corner = faces.length >= 2;
  const pier = corner || along % 3 === 0;

  if (y === gr) return "stone_bricks";                 // plinth / base course
  if (y < gr) return null;
  if (y === ROOF_CAP) return "smooth_stone";           // cornice / parapet cap
  if (y === DECK) return "white_concrete";             // top storey band
  if (y === 9) return "smooth_stone";                  // storey line
  if (y >= 6 && y <= 8) return pier ? "white_concrete" : "light_blue_stained_glass";
  if (y === FL1) return "smooth_stone";                // floor line
  if (y === 4) return "light_gray_concrete";           // shopfront header
  if (y > gr && y <= 3) return pier ? "black_concrete" : "light_blue_stained_glass";
  return "white_concrete";
}

// 1. Foundation, floors, walls, roof deck.
for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  const faces = facesOf(x, z);
  const perim = faces.length > 0;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (perim) {
    for (let y = gr; y <= ROOF_CAP; y++) {
      const id = wallBlock(x, z, y, gr, faces);
      if (id) put(x, y, z, id);
    }
  } else {
    // Ground-floor slab at the building's floor level.
    put(x, gr, z, "smooth_stone");
    // First-floor slab.
    if (FL1 > gr) put(x, FL1, z, "smooth_stone");
    // Roof deck over the top storey.
    put(x, DECK, z, "gray_concrete");
  }
}

// 2. Entrance: double dark-oak door with stone lintel above.
{
  const gr = groundOf(entryX, entryZ);
  put(entryX, gr, entryZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  put(entryX, gr + 1, entryZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  for (let y = gr + 2; y <= 3; y++) put(entryX, y, entryZ, "smooth_stone");
}

// 3. Warm lights inside some window bays (lanterns standing on interior floors).
const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
for (const [x, z] of cells) {
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const along = (face === "N" || face === "S") ? x : z;
  if (along % 6 !== 1) continue;
  if (x === entryX && z === entryZ) continue;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || facesOf(ix, iz).length > 0) continue;
  const gr = groundOf(ix, iz);
  // Ground-floor lamp standing on the floor slab at gr.
  if (gr + 1 <= 4) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  // Upper-floor lamp standing on the first-floor slab.
  if (gr < FL1) put(ix, FL1 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 4. Roof equipment: a few AC plant boxes on inner roof cells.
for (const [x, z] of cells) {
  if (facesOf(x, z).length > 0) continue;
  const inner = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => has(x + dx, z + dz) && facesOf(x + dx, z + dz).length === 0);
  if (!inner) continue;
  if (x % 4 === 2 && z % 4 === 2) {
    put(x, DECK + 1, z, "light_gray_concrete");
    put(x, DECK + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
