import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617859";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 10 x 18. Two storeys of ~5 blocks, parapet at y 11 (roof about 11 above lowest ground).
// Era: late-20th-century Taipei commercial/office block: white tiled-look concrete walls,
// stone base, smoked blue glass in ribbon windows, ground-floor shopfront with entrance.
const W = 10, H = 23, D = 18;
const TOP = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const doorX = Math.floor((minX + maxX) / 2);

const put = (x, y, z, b, s) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (s) g.set(x, y, z, b, s); else g.set(x, y, z, b);
};

const faceDefs = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  east: { dx: 1, dz: 0 },
  west: { dx: -1, dz: 0 },
};
const faces = (x, z) => Object.keys(faceDefs).filter(n => !inF(x + faceDefs[n].dx, z + faceDefs[n].dz));
const isPerim = (x, z) => faces(x, z).length > 0;

// Window columns: piers every 3 cells along each face, corners solid.
const isWin = (x, z, fs) => fs.some(n =>
  (n === "east" || n === "west")
    ? ((z - minZ) % 3 !== 0 && z !== maxZ)
    : ((x - minX) % 3 !== 0 && x !== maxX));

// Window rows: storey 1 glass y1..3 (spandrel y4), storey 2 glass y6..8 (spandrel y9).
const winRow = y => (y >= 1 && y <= 3) || (y >= 6 && y <= 8);

// 1. Foundations, walls, floors, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const perim = fs.length > 0;
  const win = perim && isWin(x, z, fs);
  const front = fs.includes("south");

  for (let y = gr; y <= TOP; y++) {
    if (!perim) {
      if (y === gr || y === 5 || y === 10) put(x, y, z, "smooth_stone");
      else if (y === TOP) put(x, y, z, "gray_concrete");
      continue;
    }
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === TOP) { put(x, y, z, "smooth_stone"); continue; }         // parapet cap
    if (y === 5 || y === 10) { put(x, y, z, "smooth_stone"); continue; } // storey lines
    if (y === 4 || y === 9) {
      put(x, y, z, win ? "light_gray_concrete" : "white_concrete");     // spandrels
      continue;
    }
    if (winRow(y) && win) {
      if (front && y <= 3 && y > gr) put(x, y, z, "light_blue_stained_glass"); // shopfront
      else if (!front || y > 3) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
      continue;
    }
    put(x, y, z, "white_concrete");
  }
}

// 2. Entrance door and shopfront details on the south (+z) face
for (const [x, z, gr] of cells) {
  if (z !== maxZ || !inF(x, z)) continue;
  if (x === doorX) {
    put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (x === doorX + 1 && gr + 2 <= 3) {
    put(x, gr + 2, z, "lantern", { hanging: "false" });
  }
}

// 3. Warm lights behind glass in some windows (air gap kept, glowstone one cell inside)
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length === 0 || !isWin(x, z, fs)) continue;
  const n = fs[0];
  const { dx, dz } = faceDefs[n];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  if ((x + z) % 4 === 0 && 2 > gr) put(ix, 2, iz, "glowstone");
  if ((x + z) % 4 === 2 && 7 > gr) put(ix, 7, iz, "glowstone");
}

// 4. Roof equipment: AC plant on the deck and a lightning rod
for (const [x, z] of [[3, 4], [3, 5], [6, 12], [6, 13]]) {
  if (inF(x, z)) put(x, TOP + 1, z, "iron_block");
}
if (inF(1, 1)) put(1, TOP + 1, 1, "lightning_rod", { facing: "up" });

g.save(`${DIR}/${ID}.nbt`);
