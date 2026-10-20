import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098235.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098235.nbt";

const W = 7, H = 23, D = 22;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Storey datum: lowest ground under the footprint. Roof sits 11 blocks above it.
let L0 = Math.min(...ground.values());
L0 = Math.min(L0, H - 12);
const T = L0 + 11;        // first air row above the roof
const DOOR_Z = 10;        // street entrance on the west (x = 0) long face

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneLong = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEnd = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Building shell per footprint cell
for (const [x, z, gr] of cells) {
  const edgeW = !has(x - 1, z), edgeE = !has(x + 1, z);
  const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1);
  const perim = edgeW || edgeE || edgeN || edgeS;
  const longFace = (edgeW || edgeE) && !(edgeN || edgeS);
  const endFace = (edgeN || edgeS) && !(edgeW || edgeE);
  const corner = (edgeW || edgeE) && (edgeN || edgeS);

  // Interior: floor slabs and roof deck only; the air between is the gap behind the glass
  if (!perim) {
    if (gr <= L0 + 5) put(x, L0 + 5, z, "light_gray_concrete");
    put(x, T - 1, z, "light_gray_concrete");
    continue;
  }

  // Window columns on each facade
  let winCol = false;
  if (longFace) winCol = z >= 1 && z <= 20 && ![4, 8, 12, 16].includes(z);
  if (endFace) winCol = [1, 2, 4, 5].includes(x);
  if (corner) winCol = false;

  // Perimeter column, bottom to top
  for (let y = gr; y <= T - 1; y++) {
    // Entrance on the street face
    if (edgeW && x === 0 && z === DOOR_Z && (y === gr || y === gr + 1)) {
      put(x, y, z, "iron_door", {
        facing: "west",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let id = "white_concrete";
    let props;

    if (y === T - 1 || y === T - 2 || y === L0 + 5) {
      id = "smooth_quartz";                       // parapet coping, cornice, storey line
    } else if (y === gr) {
      id = "stone_bricks";                        // base course
    } else {
      const winRows = (y >= gr + 1 && y <= L0 + 3) || (y >= L0 + 6 && y <= L0 + 8);
      if (winRows && winCol) {
        id = "light_blue_stained_glass_pane";
        props = longFace ? paneLong : paneEnd;
      }
    }

    put(x, y, z, id, props);
  }

  // Warm lights set back behind selected windows (interior side)
  if (longFace && winCol) {
    const ix = edgeW ? 1 : 5;
    if (z % 4 === 2) put(ix, L0 + 6, z, "glowstone");       // upper storey
    if (z % 8 === 6) put(ix, gr, z, "glowstone");           // ground floor
  }
}

// 3. Roof plant room: small penthouse on the roof deck, centred on the roof
if (T + 2 <= H - 1) {
  for (let x = 2; x <= 4; x++) {
    for (let z = 8; z <= 11; z++) {
      if (!has(x, z)) continue;
      const wall = x === 2 || x === 4 || z === 8 || z === 11;
      for (let y = T; y <= T + 1; y++) {
        if (wall) put(x, y, z, "smooth_stone");
      }
      put(x, T + 2, z, "light_gray_concrete");
    }
  }
}

g.save(OUT);
