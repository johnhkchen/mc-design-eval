import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341554079";
const W = 9, D = 22, H = 19;
const ROOF = 6;   // roof deck layer; top of building is y=7 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(5, Math.round(gr))));
}
const inFp = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !(inFp(x - 1, z) && inFp(x + 1, z) && inFp(x, z - 1) && inFp(x, z + 1));

// Facade a perimeter cell belongs to, and its index along that facade.
// W = street (Xinyi-style) frontage on the x=min side.
function face(x, z) {
  if (!inFp(x - 1, z)) return { f: "W", i: z };
  if (!inFp(x + 1, z)) return { f: "E", i: z };
  if (!inFp(x, z - 1)) return { f: "N", i: x };
  return { f: "S", i: x };
}

// Upper-storey window bays: every third cell, mullion between.
const isWinBay = (i) => i % 3 === 1;

// Interior cells whose perimeter neighbour is a window get an air gap behind the glass.
const windowAt5 = new Set();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!isPerim(x, z)) continue;
  const { i } = face(x, z);
  if (isWinBay(i)) windowAt5.add(key(x, z));
}
const behindGlass = (x, z) =>
  windowAt5.has(key(x - 1, z)) || windowAt5.has(key(x + 1, z)) ||
  windowAt5.has(key(x, z - 1)) || windowAt5.has(key(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => { if (y >= 0 && y < H) g.set(x, y, z, id, props); };
const pane = (f) => (f === "W" || f === "E")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, grRaw] of cells) {
  const gr = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // Interior: solid core, floor slab per storey, roof deck; air gap only behind glass.
    for (let y = gr; y <= ROOF; y++) {
      if (y <= 3) put(x, y, z, "white_concrete");
      else if (y === 4) put(x, y, z, "smooth_stone");
      else if (y === 5) {
        if (behindGlass(x, z)) {
          if ((x + z) % 5 === 0) put(x, y, z, "shroomlight");   // warm light in some bays
        } else put(x, y, z, "white_concrete");
      } else put(x, y, z, "smooth_stone");                       // roof deck
    }
    continue;
  }

  const { f, i } = face(x, z);
  const doorCell = f === "W" && i === 10;
  const doorOk = gr + 1 <= 2;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      // Roof edge cap (tiled parapet trim)
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === 5) {
      if (isWinBay(i)) put(x, y, z, "glass_pane", pane(f));
      else put(x, y, z, "white_concrete");
    } else if (y === 4) {
      put(x, y, z, "smooth_stone");                               // storey line / cornice
    } else {
      // Ground storey, y <= 3
      if (f === "W") {
        if (doorCell) {
          if (doorOk && y === gr) {
            put(x, y, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (doorOk && y === gr + 1) {
            put(x, y, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
            continue;
          }
        }
        if (y === 3) put(x, y, z, "red_terracotta");               // shop sign fascia
        else if (i % 4 === 0) put(x, y, z, "white_concrete");      // shopfront columns
        else put(x, y, z, "glass_pane", pane(f));                  // shopfront glazing
      } else {
        if (y === gr) put(x, y, z, "stone_bricks");                // plinth course
        else if (y === 3) put(x, y, z, "red_terracotta");
        else if (isWinBay(i) && y >= 1 && y <= 2) put(x, y, z, "glass_pane", pane(f));
        else put(x, y, z, "white_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
