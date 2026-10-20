import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 19 x 15 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century commercial block (Taipei, 1960s-80s):
// stone base course, white concrete frame, glass shopfront and upper windows,
// light-grey roof deck with a smooth stone parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403769";
const W = 19, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: edge cell on the minimum-z face, nearest the middle of that face.
const zMin = Math.min(...[...ground.keys()].map(k => +k.split(",")[1]));
const xsOnFace = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => z === zMin && isEdge(x, z))
  .map(([x]) => x);
const xMid = (Math.min(...xsOnFace) + Math.max(...xsOnFace)) / 2;
const entrance = xsOnFace.sort((a, b) => Math.abs(a - xMid) - Math.abs(b - xMid))[0];

const glassCells = []; // edge glass cells at upper storey, for interior glow

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  const edge = isEdge(x, z);

  // Foundation below the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground line, floors, roof deck, parapet and walls.
  for (let y = gr; y <= 10; y++) {
    let id = null;
    let props = null;

    if (y === gr) {
      id = "smooth_stone"; // slab / floor line
    } else if (y === 5) {
      id = "smooth_stone"; // storey line
    } else if (y === 9) {
      id = "light_gray_concrete"; // roof deck
    } else if (y === 10) {
      if (edge) id = "smooth_stone"; // parapet cap
      else if (x % 5 === 2 && z % 4 === 1) id = "iron_block"; // roof plant
    } else if (y <= 4) {
      // Ground storey: shopfront.
      if (edge) {
        const isDoor = x === entrance && z === zMin && (y === gr + 1 || y === gr + 2) && gr + 2 <= 4;
        if (isDoor) {
          props = {
            facing: "north",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
          id = "dark_oak_door";
        } else if (y === gr + 1) {
          id = "stone_bricks"; // base course
        } else if (y === 4) {
          id = "white_concrete"; // transom
        } else {
          id = (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
        }
      }
    } else if (y >= 6 && y <= 8) {
      // Upper storey: window grid with frame bands.
      if (edge) {
        if (y === 6 || y === 8) id = "white_concrete";
        else if ((x + z) % 3 === 0) id = "white_concrete";
        else {
          id = "light_blue_stained_glass";
          if (y === 7) glassCells.push([x, z]);
        }
      }
    }

    if (id) put(x, y, z, id, props);
  }
}

// Entrance canopy marker: dark oak slab just above the door, inside the footprint.
if (entrance !== undefined) {
  const gr = ground.get(`${entrance},${zMin}`);
  if (gr + 3 <= 4) put(entrance, gr + 3, zMin, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Warm light: glowstone one cell inside a lit upper window, where an interior cell exists.
for (const [x, z] of glassCells) {
  if ((x * 7 + z * 13) % 5 !== 0) continue;
  const inner = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
  if (!inner) continue;
  const gr = ground.get(`${x},${z}`);
  if (gr < 7) put(inner[0], 7, inner[1], "glowstone");
}

// Shroomlight accents in some ground-storey shopfronts for dusk legibility.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  if (!isEdge(x, z) || gr + 2 > 4) continue;
  if ((x * 3 + z * 5) % 7 !== 0) continue;
  const inner = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
  if (inner) put(inner[0], gr + 2, inner[1], "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
