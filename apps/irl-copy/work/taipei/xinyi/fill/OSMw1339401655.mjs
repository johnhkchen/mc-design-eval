import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 22 x 4 footprint, roof ~12 blocks above lowest ground.
// Read as a two-storey 1980s-style concrete shophouse with a tiled-look
// stone base, a shopfront ground floor, a window band above, a cornice and a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401655";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 24, D = 4;
const g = new Voxels([W, H, D]);

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inFP = (x, z) => fp.has(`${x},${z}`);
const isExterior = (x, z) => !inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const STAIR_NONE = null;

for (const [x, z, gr] of cells) {
  const ext = isExterior(x, z);
  const front = ext && z === 0;
  const back = ext && z === D - 1;
  const endFace = ext && (x === 0 || x === W - 1);
  const lvl = gr; // floor level of this cell

  // Foundation: solid from 0 up to the cell's ground.
  for (let y = 0; y < lvl; y++) put(x, y, z, "stone_bricks");

  // Base course / ground slab.
  put(x, lvl, z, ext ? "polished_andesite" : "smooth_stone");

  // Ground floor (commercial): levels lvl+1 .. lvl+4.
  if (ext) {
    for (let y = lvl + 1; y <= lvl + 4; y++) {
      if (front || back) {
        if (x % 4 === 0) {
          put(x, y, z, "white_concrete");
        } else if (front && x === 2 && y <= lvl + 2) {
          // Main entrance door, lower and upper halves.
          const half = y === lvl + 1 ? "lower" : "upper";
          put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        } else if (y === lvl + 4) {
          put(x, y, z, "white_concrete"); // shopfront lintel
        } else if (front && x === 2) {
          put(x, y, z, "white_concrete"); // transom above entrance
        } else {
          put(x, y, z, "light_blue_stained_glass_pane");
        }
      } else if (endFace) {
        if ((z === 1 || z === 2) && (y === lvl + 2 || y === lvl + 3)) {
          put(x, y, z, "light_blue_stained_glass_pane");
        } else {
          put(x, y, z, "white_concrete");
        }
      }
    }
  }

  // Storey line / floor slab between storeys.
  put(x, lvl + 5, z, "smooth_stone");

  // Second floor (offices/residential): levels lvl+6 .. lvl+8, lintel lvl+9.
  if (ext) {
    for (let y = lvl + 6; y <= lvl + 8; y++) {
      if (front || back) {
        if (x % 3 === 0) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane");
        }
      } else if (endFace) {
        if (z === 1 || z === 2) put(x, y, z, "light_blue_stained_glass_pane");
        else put(x, y, z, "white_concrete");
      }
    }
    if (front || back) put(x, lvl + 9, z, "light_gray_concrete");
    else put(x, lvl + 9, z, "white_concrete");
  }

  // Roof slab / cornice course.
  put(x, lvl + 10, z, "smooth_stone");

  // Parapet on the exterior ring.
  if (ext) put(x, lvl + 11, z, "white_concrete");

  // Warm lights in some windows: glowstone one block behind the glass (interior side).
  if (!ext) {
    if (z === 1 && x % 6 === 1) put(x, lvl + 7, z, "glowstone");
    if (z === 1 && x % 6 === 4) put(x, lvl + 2, z, "shroomlight");
  }

  // Roof equipment: a small plant block on the interior roof.
  if (!ext && z === 2 && x === 10) put(x, lvl + 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
