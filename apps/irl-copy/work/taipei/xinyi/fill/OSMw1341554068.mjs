import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341554068";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, D = 19, H = 43;
const ROOF = 30;      // roof slab level (6 storeys of 5 blocks)
const PARAPET = 31;   // top of parapet

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const grid = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) grid.set(x, y, z, id, props);
  else grid.set(x, y, z, id);
};

// Glass pane connected on all sides so the window reads as a continuous grid
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const pane = (x, y, z) => put(x, y, z, "light_blue_stained_glass_pane", PANE);
const frame = (x, y, z) => put(x, y, z, "white_concrete");

// Facade logic for perimeter cells (absolute y, ground gr for this cell)
function facade(x, z, y, gr) {
  const longF = z === 0 || z === D - 1;
  const shortF = x === 0 || x === W - 1;
  const corner = longF && shortF;

  if (y === gr) return "polished_andesite";          // base course
  if (y === ROOF) return "smooth_stone";             // cornice
  if (y === PARAPET) return "smooth_stone";          // parapet cap
  if (y > PARAPET) return null;

  const r = y % 5;
  if (r === 0) return "white_concrete";              // storey line band
  if (r === 4) return "light_gray_concrete";         // spandrel
  // r = 1..3: window zone
  if (corner) return "white_concrete";               // corner piers
  if (y < 5) {                                        // ground-floor shopfront
    if (longF) return "glass_pane";
    return "glass_pane";
  }
  if (longF) return (x === 1 || x === 5) ? "frame" : "glass_pane";
  if (shortF) return (z % 3 === 0) ? "frame" : "glass_pane";
  return null;
}

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Interior: ground slab and storey floor slabs, roof deck
for (const [x, z, gr] of cells) {
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  if (!edge) {
    put(x, gr, z, "smooth_stone");
    for (let y = 5; y <= ROOF; y += 5) {
      if (y <= gr) continue;
      put(x, y, z, y === ROOF ? "light_gray_concrete" : "white_concrete");
    }
  }
}

// 3. Perimeter walls, windows, base, cornice, parapet
for (const [x, z, gr] of cells) {
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  if (!edge) continue;

  const longF = z === 0 || z === D - 1;
  const shortF = x === 0 || x === W - 1;
  const front = z === 0;

  for (let y = gr; y <= PARAPET; y++) {
    // Entrance on the street (z = 0) face, centred on x = 3
    if (front && x === 3 && (y === gr + 1 || y === gr + 2) && y < 5) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const kind = facade(x, z, y, gr);
    if (kind === null) continue;

    if (kind === "polished_andesite") put(x, y, z, "polished_andesite");
    else if (kind === "smooth_stone") put(x, y, z, "smooth_stone");
    else if (kind === "white_concrete") put(x, y, z, "white_concrete");
    else if (kind === "light_gray_concrete") put(x, y, z, "light_gray_concrete");
    else if (kind === "frame") frame(x, y, z);
    else if (kind === "glass_pane") pane(x, y, z);
    else put(x, y, z, kind);
  }

  // Storey-band line on ground-level base: keep the ground-floor lintel above the door
  if (front && x === 3 && gr + 3 < 5) put(x, gr + 3, z, "white_concrete");
}

// 4. Warm light behind the street-side glass on a few storeys
for (const y of [7, 12, 22]) {
  if (has(3, 1) && y > groundAt(3, 1)) put(3, y, 1, "shroomlight");
}
if (has(3, 1) && groundAt(3, 1) < 3) put(3, 2, 1, "shroomlight");

// 5. Roof plant: a solid mechanical penthouse with an antenna mast
for (let x = 2; x <= 4; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    for (let y = PARAPET; y <= 33; y++) {
      put(x, y, z, y === 33 ? "stone_bricks" : "light_gray_concrete");
    }
  }
}
if (has(3, 9)) {
  for (let y = 34; y <= 38; y++) put(3, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

grid.save(`${DIR}/${ID}.nbt`);
