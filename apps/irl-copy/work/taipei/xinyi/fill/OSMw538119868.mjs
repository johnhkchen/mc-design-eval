import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial block: two storeys over a stone base,
// cream tiled walls, tinted-glass shopfront with a red fascia, a parapet,
// and a rooftop water tank. Front (street) face is z = 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119868";
const W = 11, D = 23, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(gy));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const mg = Math.min(...ground.values());     // lowest ground under the footprint
const TOP = mg + 10;                          // parapet course; roof deck surface at mg+11

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const isRing = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "north";   // street face
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
};
const paneP = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";

// Pass 1: footprint shell, foundations, floors, walls, windows.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isRing(x, z)) {
    // Interior: ground-floor slab, storey slab, roof deck. Air between.
    put(x, gr, z, "smooth_stone");
    if (gr < mg + 5) put(x, mg + 5, z, "light_gray_concrete");
    put(x, TOP, z, "light_gray_concrete");
    continue;
  }

  const face = faceOf(x, z);
  const corner = isCorner(x, z);
  const horiz = face === "north" || face === "south";
  const idx = horiz ? x : z;
  const len = horiz ? W : D;
  const win = idx >= 1 && idx <= len - 2 && idx % 3 !== 0;

  // Base course at ground level.
  put(x, gr, z, "polished_andesite");

  for (let y = gr + 1; y <= TOP; y++) {
    let id = "smooth_quartz", p;

    if (corner) {
      id = "quartz_pillar"; p = { axis: "y" };
    } else if (y === TOP || y === mg + 5 || y === mg + 9) {
      id = "polished_andesite";                       // parapet, storey band, window head
    } else if (y === mg + 4 && face === "north" && idx >= 1 && idx <= 9) {
      id = "red_terracotta";                          // shopfront fascia
    } else if (y >= mg + 1 && y <= mg + 3 && face === "north") {
      // Shopfront: tinted glass with mullions; door is set after this loop.
      if (idx === 3 || idx === 7) id = "polished_andesite";
      else if (idx >= 1 && idx <= 9 && idx !== 5) { id = GLASS; p = paneP(face); }
    } else if (y >= mg + 1 && y <= mg + 3 && win) {
      id = GLASS; p = paneP(face);                    // ground floor windows on other faces
    } else if (y >= mg + 6 && y <= mg + 8 && win) {
      id = GLASS; p = paneP(face);                    // upper storey windows
    }

    put(x, y, z, id, p);
  }
}

// Warm lights behind glass (interior cells at z = 1 for the street face, x = 1 / x = 9 for the sides).
for (const i of [2, 8]) {
  if (has(i, 1) && !isRing(i, 1)) {
    put(i, mg + 7, 1, "shroomlight");
    put(i, gnd(i, 1) + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}
for (const z of [4, 10, 16, 20]) {
  if (has(1, z) && !isRing(1, z)) put(1, mg + 7, z, "shroomlight");
  if (has(9, z) && !isRing(9, z)) put(9, mg + 7, z, "glowstone");
}

// Entrance door in the middle of the shopfront.
if (has(5, 0)) {
  const gd = gnd(5, 0);
  const doorP = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(5, gd + 1, 0, "oak_door", doorP("lower"));
  put(5, gd + 2, 0, "oak_door", doorP("upper"));
}

// Roof: water tank on the deck (4 x 4), with a stone cap.
const tankOk = [3, 4, 5, 6].every((x) => [8, 9, 10, 11].every((z) => has(x, z)));
if (tankOk) {
  for (let x = 3; x <= 6; x++) {
    for (let z = 8; z <= 11; z++) {
      for (let y = TOP + 1; y <= TOP + 3; y++) put(x, y, z, "white_concrete");
      put(x, TOP + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Roof vents: two small plant boxes.
for (let x = 7; x <= 8; x++) {
  for (let z = 15; z <= 16; z++) {
    if (has(x, z)) put(x, TOP + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
