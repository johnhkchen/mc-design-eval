import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458210";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 13 x 16 footprint, 23 blocks tall: a two-storey 1990s Xinyi commercial block
// with a shopfront ground floor, white-tile upper storeys, a parapet and roof plant.
const W = 13, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, G] of cells) ground.set(`${x},${z}`, G);
const inF = (x, z) => ground.has(`${x},${z}`);

// Outward direction of the first missing neighbour (north first), or null for interior cells.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function exposed(x, z) {
  for (const d of DIRS) if (!inF(x + d[0], z + d[1])) return d;
  return null;
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const lightCells = [];

for (const [x, z, G] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const edge = exposed(x, z);

  if (!edge) {
    // Interior: floor slabs per storey, roof deck, air between (no interiors).
    put(x, G, z, "smooth_stone");
    if (G <= 5) put(x, 5, z, "smooth_stone");
    put(x, 11, z, "light_gray_concrete");
    continue;
  }

  const [dx, dz] = edge;
  const isFront = dz === -1 && z === 0;
  const along = (x + z) % 3; // 0 = pillar column, otherwise window bay
  const paneProps = dz !== 0 ? PANE_Z : PANE_X;

  for (let y = G; y <= 12; y++) {
    if (y === G) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (y === 11 || y === 12) {
      put(x, y, z, "white_concrete"); // parapet
    } else if (y === 10 || y === 5) {
      put(x, y, z, "smooth_quartz"); // cornice and storey line
    } else if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9 || along === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    } else if (y >= 1 && y <= 4) {
      if (isFront && x === 6 && (y === G + 1 || y === G + 2)) {
        put(x, y, z, "oak_door", DOOR(y === G + 1 ? "lower" : "upper"));
      } else if (y === 4) {
        put(x, y, z, "smooth_stone"); // ground-floor lintel
      } else if (isFront && x === 6) {
        put(x, y, z, "glass_pane", paneProps); // door transom
      } else if (isFront && x >= 5 && x <= 7) {
        put(x, y, z, "stone_bricks");
      } else if (along === 0) {
        put(x, y, z, "stone_bricks"); // shopfront pillars
      } else {
        put(x, y, z, "glass_pane", paneProps); // shopfront glass
      }
    }
  }

  // Warm light behind some upper and ground windows (glowstone in the room air).
  if (along !== 0) {
    const inX = x - dx, inZ = z - dz;
    const gin = ground.get(`${inX},${inZ}`);
    if (gin !== undefined && !exposed(inX, inZ)) {
      if (gin <= 6 && (x * 5 + z * 3) % 4 === 0) lightCells.push([inX, 7, inZ]);
      if (gin <= 1 && (x + 2 * z) % 5 === 0) lightCells.push([inX, 2, inZ]);
    }
  }
}

for (const [x, y, z] of lightCells) put(x, y, z, "glowstone");

// Roof plant: a 3x3 air-handling unit with a small stack, set on the roof deck.
for (let x = 5; x <= 7; x++) {
  for (let z = 6; z <= 8; z++) {
    if (!inF(x, z) || exposed(x, z)) continue;
    put(x, 12, z, "light_gray_concrete");
  }
}
if (inF(6, 7) && !exposed(6, 7)) put(6, 13, 7, "white_concrete");

g.save(`${DIR}/${ID}.nbt`);
