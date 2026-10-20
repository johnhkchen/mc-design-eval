import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857639";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 7 x 21 footprint, two-storey 1970s-80s concrete shophouse with a tiled
// cream facade, a grey plinth and cornice, a shopfront on the street (z = 0),
// and a rooftop water tank. Roof top is y = 11, about 11 blocks above the lowest ground.
const W = 7, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const SL1 = 5;        // first-floor slab / storey line
const ROOF = 10;      // roof slab
const PARAPET = 11;   // top of the parapet

const WALL = "white_terracotta";
const PLINTH = "polished_andesite";
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";
const FRAME = "polished_andesite";
const COR = "stone_bricks";
const SHOP = "glass";
const PANE = "light_blue_stained_glass_pane";

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, ground] of cells) G.set(key(x, z), Math.max(0, Math.round(ground)));
const has = (x, z) => G.has(key(x, z));
const gr = (x, z) => G.get(key(x, z));

const paneProps = (axis) =>
  axis === "ew"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Pass 1: foundation, floor slabs, roof slab, and walls on the perimeter.
for (const [k, base] of G) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  const front = faces.includes("N") && z === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);

  // Storey slab (interior) and roof slab across the whole footprint.
  if (base <= SL1) g.set(x, SL1, z, SLAB);
  g.set(x, ROOF, z, SLAB);

  // Window test per exposed face. Solid pier every third bay, corners solid.
  let winFace = null;
  for (const f of faces) {
    const isNS = f === "N" || f === "S";
    const u = isNS ? x : z;
    const m = isNS ? 6 : 20;
    if (u > 0 && u < m && u % 3 !== 0) { winFace = f; break; }
  }
  const win = winFace !== null;
  const axis = winFace === "N" || winFace === "S" ? "ns" : "ew";

  if (faces.length === 0) continue; // interior cell: only slabs

  for (let y = base; y <= 9; y++) {
    let b = WALL;
    let props = null;

    if (y === base || y === SL1) {
      b = PLINTH;                       // plinth and storey band
    } else if (y === 9) {
      b = COR;                          // cornice band
    } else if (y < SL1) {               // ground floor
      if (front) {
        if (x === 1) b = WALL;
        else if (x === 3) b = WALL;
        else if (y >= base + 1 && y <= 3) b = SHOP; // shop glass x 2, 4, 5
        else b = WALL;
      } else if (win && y >= base + 1 && y <= 3) {
        b = PANE; props = paneProps(axis);
      }
    } else if (y === 6) {               // first-floor sill
      if (win) b = FRAME;
    } else if (y === 7 || y === 8) {    // first-floor glazing
      if (win) { b = PANE; props = paneProps(axis); }
    }

    if (b === PANE && !props) props = paneProps("ew");
    g.set(x, y, z, b, props ?? undefined);
  }

  // Parapet coping on the perimeter.
  g.set(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: front entrance, lantern, interior lights, and rooftop tank.
if (has(1, 0)) {
  const b0 = gr(1, 0);
  g.set(1, b0, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(1, b0 + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Hanging lantern over the entrance, under the storey band.
if (has(3, 0) && gr(3, 0) <= 4) {
  g.set(3, 4, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light behind shop glass and first-floor glass (interior air at z = 1).
if (has(2, 1) && gr(2, 0) <= 2) g.set(2, 2, 1, "glowstone");
if (has(4, 1) && gr(4, 0) <= 2) g.set(4, 2, 1, "glowstone");
if (has(2, 1)) g.set(2, 7, 1, "glowstone");
if (has(5, 1)) g.set(5, 7, 1, "glowstone");
if (has(5, 4)) g.set(5, 7, 4, "glowstone");
if (has(1, 10)) g.set(1, 7, 10, "glowstone");

// Rooftop water tank: 3 x 3 planks with a slab cap, sitting on the roof slab.
let tankOk = true;
for (let x = 2; x <= 4; x++) for (let z = 8; z <= 10; z++) if (!has(x, z)) tankOk = false;
if (tankOk) {
  for (let x = 2; x <= 4; x++) for (let z = 8; z <= 10; z++) {
    g.set(x, 11, z, "oak_planks");
    g.set(x, 12, z, "oak_planks");
    g.set(x, 13, z, "oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
