import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Taiwanese shophouse-style block (1960s-70s commercial), flat roof with parapet.
// Storeys: ground 0..4 (shopfront, fascia at 4), upper 5..9 (belt at 5 and 9, windows 6..8).
// Roof deck at y=10 with cornice, parapet at y=11, small rooftop plant on top.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610196";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 6, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => fp.has(`${x},${z}`);
const groundOf = (x, z) => fp.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Side-face window rhythm along z (N/S faces use x 1..4).
const sideWindow = (z) => [2, 3].includes(z % 4);

const ROOF_DECK = 10;
const UPPER_TOP = 9;
const UPPER_WIN_LO = 6, UPPER_WIN_HI = 8;
const GROUND_FASCIA = 4;
const GROUND_GLASS_HI = 3;

// Pass 1: per-cell foundation, walls, floors, deck, parapet.
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const perim = missN || missS || missW || missE;
  const corner = (missN || missS) && (missW || missE);
  const face = missN ? "N" : missS ? "S" : missW ? "W" : missE ? "E" : null;

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (gr > ROOF_DECK) continue; // nothing above the deck level on very high ground

  for (let y = gr; y <= ROOF_DECK; y++) {
    if (y === ROOF_DECK) {
      put(x, y, z, perim ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (y === 5) {
      // Storey floor slab / belt course.
      put(x, y, z, perim ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!perim) {
      // Interior: floor slab at the cell's ground, air above (no interiors).
      if (y === gr) put(x, y, z, "smooth_stone");
      continue;
    }
    // Perimeter facade.
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    if (corner) { put(x, y, z, "red_terracotta"); continue; }
    if (y === UPPER_TOP) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y >= UPPER_WIN_LO && y <= UPPER_WIN_HI) {
      const win = face === "N" || face === "S" ? (x >= 1 && x <= 4) : sideWindow(z);
      if (win) put(x, y, z, "glass_pane", paneProps(face));
      else put(x, y, z, "white_concrete");
      continue;
    }
    if (y === GROUND_FASCIA) {
      put(x, y, z, face === "N" ? "dark_oak_planks" : "white_concrete");
      continue;
    }
    if (y > gr && y <= GROUND_GLASS_HI) {
      const win = face === "N" || face === "S" ? (x >= 1 && x <= 4) : sideWindow(z);
      if (win) put(x, y, z, "glass_pane", paneProps(face));
      else put(x, y, z, "white_concrete");
      continue;
    }
    put(x, y, z, "white_concrete");
  }

  // Parapet on the perimeter above the roof deck.
  if (perim) put(x, ROOF_DECK + 1, z, "white_concrete");
}

// Pass 2: entrance door on the north (street) face, centred at x=2.
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (x !== 2 || z !== 0 || gr > 2) continue;
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(x, gr, z, "oak_door", doorProps("lower"));
  put(x, gr + 1, z, "oak_door", doorProps("upper"));
}

// Pass 3: warm light behind the glass (sitting on floors, inside the air gap).
const lights = [
  [2, 6, 1], [3, 6, 7], [1, 6, 12], [4, 6, 13],
];
for (const [x, y, z] of lights) {
  if (has(x, z) && x >= 1 && x <= 4 && z >= 1 && z <= 13) put(x, y, z, "glowstone");
}
if (has(4, 1) && groundOf(4, 1) + 1 <= GROUND_GLASS_HI) {
  put(4, groundOf(4, 1) + 1, 1, "glowstone");
}

// Pass 4: rooftop water tank and an HVAC unit on the deck.
for (let x = 1; x <= 2; x++) {
  for (let z = 10; z <= 11; z++) {
    if (!has(x, z) || groundOf(x, z) > ROOF_DECK) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "light_gray_concrete");
    put(x, 14, z, "smooth_stone");
  }
}
if (has(4, 3) && groundOf(4, 3) <= ROOF_DECK) put(4, 11, 3, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
