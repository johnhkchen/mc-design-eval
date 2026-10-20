import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw551429771";
const W = 36, H = 19, D = 15;
const ROOF = 7; // roof height above lowest ground (lidar)

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Glass panes: connect along the wall they sit in
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE = "light_blue_stained_glass_pane";
const FRAME = "light_gray_concrete";

// Entrances: one on the north face, one on the south face
const DOOR_N_X = 17;
const DOOR_S_X = 18;

for (const [x, z, gr] of cells) {
  const nF = !has(x, z - 1);
  const sF = !has(x, z + 1);
  const wF = !has(x - 1, z);
  const eF = !has(x + 1, z);
  const perim = nF || sF || wF || eF;
  const ns = nF || sF;               // wall runs east-west
  const p = ns ? x : z;              // bay index along the wall
  const T = Math.max(ROOF, gr + 6);  // roof level for this cell

  // Inward neighbour, used for warm light behind glass
  let inX = x, inZ = z;
  if (nF) inZ = z + 1;
  else if (sF) inZ = z - 1;
  else if (wF) inX = x + 1;
  else if (eF) inX = x - 1;
  const inwardInterior = perim && has(inX, inZ) && !(
    !has(inX, inZ - 1) || !has(inX, inZ + 1) || !has(inX - 1, inZ) || !has(inX + 1, inZ)
  ) === false ? false : (perim && has(inX, inZ));

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at ground level
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Ground storey: shopfront, entrances, fascia
  const isDoorN = nF && z === 0 && x === DOOR_N_X;
  const isDoorS = sF && z === D - 1 && x === DOOR_S_X;
  const isDoor = isDoorN || isDoorS;
  const doorFacing = isDoorN ? "north" : "south";

  if (perim) {
    for (const dy of [1, 2]) {
      const y = gr + dy;
      if (isDoor) {
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing,
          half: dy === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (p % 3 === 0) {
        put(x, y, z, FRAME);
      } else {
        put(x, y, z, PANE, ns ? PANE_NS : PANE_EW);
      }
    }
    // Fascia over the shopfront, with a hanging lantern above each entrance
    if (isDoor) {
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      put(x, gr + 3, z, "gray_concrete");
    }
  }

  // Storey line between the two storeys
  put(x, gr + 4, z, perim ? "white_concrete" : "smooth_stone");

  // Upper storey walls
  for (let y = gr + 5; y <= T - 1; y++) {
    if (perim) {
      if (p % 3 === 0) put(x, y, z, FRAME);
      else put(x, y, z, PANE, ns ? PANE_NS : PANE_EW);
    }
  }

  // Warm light behind some windows (interior cell inside the glass)
  if (perim && inwardInterior && !isDoor) {
    const litLow = (p + gr) % 6 === 2 && p % 3 !== 0;
    if (litLow) put(inX, gr + 2, inZ, "glowstone");
    if (gr + 6 <= T - 1 && (p + gr) % 7 === 0 && p % 3 !== 0) {
      put(inX, gr + 6, inZ, "shroomlight");
    }
  }

  // Roof slab
  put(x, T, z, "smooth_stone");

  if (perim) {
    // Parapet and cornice
    put(x, T + 1, z, "white_concrete");
    put(x, T + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (x % 7 === 3 && z % 5 === 2) {
    // Roof plant: sparse iron units
    put(x, T + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
