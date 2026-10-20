import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 13 x 17 footprint, roof about 11 blocks above lowest ground.
// Read as a 1960s-80s low-rise commercial block on the Xinyi grid:
// two storeys of shopfront and office windows, a tiled white facade with
// light concrete mullions, a stone base, a storey band, a cornice and a parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612484";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const ROOF = 10;   // parapet top block: roof about 11 blocks above lowest ground
const DECK = 9;    // roof deck / cornice line
const BAND = 5;    // storey line between ground and upper floor

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(gr, 9));
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

const exX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const exZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isEdge = (x, z) => exX(x, z) || exZ(x, z);

// Glass pane connected along the wall it sits in.
const pane = (xFace) => ({
  north: xFace ? "true" : "false",
  south: xFace ? "true" : "false",
  east: xFace ? "false" : "true",
  west: xFace ? "false" : "true",
  waterlogged: "false",
});

// Interior neighbour one cell inward from an exposed face (null if none).
function inwardOf(x, z) {
  const ex = exX(x, z), ez = exZ(x, z);
  let ix = x, iz = z;
  if (ex && !ez) ix = !has(x - 1, z) ? x + 1 : x - 1;
  else if (ez && !ex) iz = !has(x, z - 1) ? z + 1 : z - 1;
  else return null;
  if (!has(ix, iz) || isEdge(ix, iz)) return null;
  return [ix, iz];
}

// Pass 1: foundation, walls, floors, roof deck.
for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const xf = exX(x, z), zf = exZ(x, z);
  const edge = xf || zf;
  const corner = xf && zf;
  const xFace = xf && !zf;
  const along = xFace ? z : x;
  const pillar = corner || along % 3 === 0;

  if (edge) {
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr) put(x, y, z, "stone_bricks");
      else if (y === DECK) put(x, y, z, "light_gray_concrete");          // cornice
      else if (y === ROOF) put(x, y, z, pillar ? "light_gray_concrete" : "white_terracotta"); // parapet
      else if (y === BAND) put(x, y, z, "light_gray_concrete");          // storey band
      else if (pillar) put(x, y, z, "light_gray_concrete");              // mullion
      else if (y < BAND) put(x, y, z, "glass_pane", pane(xFace));       // shopfront
      else put(x, y, z, "glass_pane", pane(xFace));                      // office window
    }
  } else {
    // Interior: floor at ground, storey slab, roof deck. Air otherwise.
    put(x, gr, z, "smooth_stone");
    if (gr < BAND) put(x, BAND, z, "light_gray_concrete");
    put(x, DECK, z, "smooth_stone");
    // Small roof plant on the deck.
    if (x % 4 === 2 && z % 4 === 2 && DECK + 1 <= ROOF) {
      put(x, ROOF, z, "light_gray_concrete");
    }
  }
}

// Pass 2: warm light behind some upper windows.
for (const [x, z] of cells) {
  if (!isEdge(x, z) || exX(x, z) && exZ(x, z)) continue;
  const gr = gnd(x, z);
  const xFace = exX(x, z);
  const along = xFace ? z : x;
  const y = 7;
  if (y <= gr || along % 6 !== 4 || (along + y) % 5 !== 0) continue;
  const inn = inwardOf(x, z);
  if (inn) put(inn[0], y, inn[1], "shroomlight");
}

// Pass 3: entrance on the street side (lowest z face, nearest footprint centre).
{
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  let cand = cells.filter(([x, z]) => isEdge(x, z) && !has(x, z - 1));
  if (cand.length === 0) cand = cells.filter(([x, z]) => isEdge(x, z));
  cand.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  const [ex, ez] = cand[0];
  const gr = gnd(ex, ez);

  // Outward normal decides door facing.
  let facing = "north";
  if (!has(ex, ez - 1)) facing = "north";
  else if (!has(ex, ez + 1)) facing = "south";
  else if (!has(ex - 1, ez)) facing = "west";
  else facing = "east";

  const yl = gr + 1, yu = gr + 2;
  put(ex, yl, ez, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ex, yu, ez, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Hanging lantern above the door.
  if (gr + 3 < DECK) {
    put(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
