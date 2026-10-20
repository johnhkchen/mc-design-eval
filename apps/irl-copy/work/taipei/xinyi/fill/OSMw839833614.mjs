import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833614";
const W = 19, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Lowest ground under the footprint; storeys hang off this absolute level.
const B = Math.min(...cells.map(c => c[2]));
const DECK = B;          // ground floor deck
const S1_BOT = B + 1;    // storey 1: B+1..B+4 (shopfront)
const S1_LINE = B + 5;   // storey line
const S2_BOT = B + 6;    // storey 2: B+6..B+9
const ROOF = B + 10;     // roof slab / cornice
const TOP = B + 11;      // parapet course; roof is ~11 blocks above lowest ground

const OFF = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };

// Outward face for a footprint cell, or null if the cell is interior.
function outward(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}
const isWall = (x, z) => has(x, z) && outward(x, z) !== null;

// Front = south face if present, else the face with most cells.
const faceCount = { west: 0, east: 0, north: 0, south: 0 };
for (const [x, z] of cells) {
  const f = outward(x, z);
  if (f) faceCount[f]++;
}
const front = faceCount.south > 0
  ? "south"
  : Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

const alongIndex = (face, x, z) => (face === "west" || face === "east" ? z : x);
const frontIdx = cells
  .filter(([x, z]) => outward(x, z) === front)
  .map(([x, z]) => alongIndex(front, x, z))
  .sort((a, b) => a - b);
const entIdx = frontIdx[Math.floor(frontIdx.length / 2)];

// Roof plant box centre.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const rcx = Math.round(cx), rcz = Math.round(cz);
const inBox = (x, z) => Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (face) =>
  face === "west" || face === "east"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

const doorProps = (face, half) => ({
  facing: face,
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

for (const [x, z, gr] of cells) {
  const face = outward(x, z);
  const wall = face !== null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!wall) {
    // Interior: floor decks and roof only, air elsewhere (no interiors).
    if (DECK >= gr) put(x, DECK, z, "light_gray_concrete");
    put(x, S1_LINE, z, "light_gray_concrete");
    put(x, ROOF, z, "gray_concrete");

    // Roof plant box and mast, central.
    if (inBox(x, z)) {
      put(x, TOP, z, "stone_bricks");
      put(x, TOP + 1, z, "stone_bricks");
    }
    if (x === rcx && z === rcz) {
      put(x, TOP + 2, z, "lightning_rod", { facing: "up", powered: "false" });
    }
    continue;
  }

  const i = alongIndex(face, x, z);
  const [ox, oz] = OFF[face];
  const ix = x - ox, iz = z - oz; // inward neighbour
  const inwardInterior = has(ix, iz) && !isWall(ix, iz);
  const isEntrance = face === front && i === entIdx;
  const isCanopyCell = face === front && Math.abs(i - entIdx) <= 1;

  for (let y = gr; y <= TOP; y++) {
    // Entrance door (lower and upper halves).
    if (isEntrance && (y === gr || y === gr + 1) && y <= B + 3) {
      put(x, y, z, "dark_oak_door", doorProps(face, y === gr ? "lower" : "upper"));
      continue;
    }

    let b = null, p = null;

    if (y === B) {
      b = "stone_bricks"; // plinth / base course
    } else if (y >= S1_BOT && y <= B + 3) {
      // Shopfront: glass panes between piers, piers every third cell.
      if (i % 3 === 0) b = "polished_andesite";
      else { b = "glass_pane"; p = paneProps(face); }
      // Warm light inside the shopfront on the ground floor.
      if (gr === B && y === S1_BOT && inwardInterior && i % 3 === 2 && !isEntrance) {
        put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    } else if (y === B + 4) {
      b = isCanopyCell ? "dark_oak_slab" : "light_gray_concrete"; // lintel / canopy band
      if (isCanopyCell) p = { type: "top", waterlogged: "false" };
    } else if (y === S1_LINE) {
      b = "light_gray_concrete"; // storey line
    } else if (y === S2_BOT || y === B + 9) {
      b = "white_concrete"; // spandrels
    } else if (y === B + 7 || y === B + 8) {
      if (i % 3 === 0) b = "white_concrete";
      else { b = "glass_pane"; p = paneProps(face); }
      // Glowstone behind some upper windows.
      if (y === B + 7 && i % 6 === 2 && inwardInterior) {
        put(ix, y, iz, "glowstone");
      }
    } else if (y === ROOF) {
      b = "light_gray_concrete"; // cornice
    } else if (y === TOP) {
      b = i % 3 === 0 ? "light_gray_concrete" : "white_concrete"; // parapet with caps
    }

    if (b) put(x, y, z, b, p);
  }
}

g.save(`${DIR}/${ID}.nbt`);
