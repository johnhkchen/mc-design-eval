import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807568";
const W = 29, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const isIn = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Two-storey commercial block: shopfront ground floor, one upper storey, parapet.
const L1 = minG + 5;          // second-floor level
const R = minG + 10;          // roof deck / cornice band
const roofY = Math.min(H - 3, minG + 11); // parapet cap (11 blocks above lowest ground)

const FACE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function faceOf(x, z) {
  if (!isIn(x, z - 1)) return "north";
  if (!isIn(x, z + 1)) return "south";
  if (!isIn(x - 1, z)) return "west";
  return "east";
}
function isPerim(x, z) {
  return !isIn(x, z - 1) || !isIn(x, z + 1) || !isIn(x - 1, z) || !isIn(x + 1, z);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_ALONG = { north: "north", south: "north", east: "east", west: "east" };
const DOOR_FACE = "south";
const DOOR_U = 14;

// Pass 1: foundations, floors, walls, shopfronts, windows, doors, cornice.
for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);

  if (!perim) {
    // Interior: no rooms, only floor slabs and the roof deck.
    if (gr <= H - 1) put(x, gr, z, "light_gray_concrete");          // ground floor slab
    if (L1 >= gr) put(x, L1, z, "light_gray_concrete");             // second floor slab
    if (R >= gr) put(x, R, z, "light_gray_concrete");               // roof deck
    // Roof plant boxes on the deck.
    if (x % 9 === 4 && z === 6) {
      put(x, R + 1, z, "light_gray_concrete");
      put(x, R + 2, z, "light_gray_concrete");
    }
    continue;
  }

  const face = faceOf(x, z);
  const u = (face === "north" || face === "south") ? x : z;
  const isDoorCol = face === DOOR_FACE && u === DOOR_U;
  const paneProps = PANE_ALONG[face] === "north"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = gr; y <= roofY; y++) {
    if (y === gr) {
      put(x, y, z, "polished_andesite");               // base course
    } else if (y === roofY) {
      put(x, y, z, "smooth_stone");                    // parapet cap
    } else if (y === R) {
      put(x, y, z, "smooth_stone");                    // cornice band
    } else if (y < L1) {
      // Ground-floor shopfront.
      if (y === L1 - 1) {
        put(x, y, z, "stone_bricks");                  // lintel
      } else if (isDoorCol && y <= gr + 1) {
        const half = y === gr ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: face, half, hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoorCol) {
        put(x, y, z, "smooth_stone");
      } else if (u % 4 === 0) {
        put(x, y, z, "light_gray_concrete");          // shopfront pillar
      } else {
        put(x, y, z, "cyan_stained_glass");           // shopfront glass
      }
    } else if (y === L1) {
      put(x, y, z, "light_gray_concrete");            // storey line
    } else if (y >= L1 + 1 && y <= L1 + 3) {
      // Upper storey windows with pillars.
      if (u % 4 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    } else if (y === L1 + 4 && y < R) {
      put(x, y, z, "white_concrete");                 // spandrel
    } else if (y < R) {
      put(x, y, z, "white_concrete");
    }
  }
}

// Pass 2: warm light in some upper windows, placed inside the room behind the glass.
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const u = (face === "north" || face === "south") ? x : z;
  if (u % 8 !== 2) continue;
  if (face === DOOR_FACE && u === DOOR_U) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!isIn(ix, iz) || isPerim(ix, iz)) continue;
  const yLight = L1 + 2;
  if (yLight >= R) continue;
  put(ix, yLight, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
