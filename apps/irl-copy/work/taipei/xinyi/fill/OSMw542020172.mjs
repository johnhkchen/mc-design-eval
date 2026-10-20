// OSMw542020172: no record, so this is a two-storey interwar-style commercial block with a
// flat parapet roof. Roof is ~11 blocks above the lowest ground (y 0..10), with a 5-block
// ground floor, one storey line at y=5, and a deck at y=9. Facades use white concrete piers,
// light-blue glass panes in frames, stone-brick base course, and a smooth-stone cornice.
// Warm glowstone sits in some upper windows. A rooftop plant box stands on the deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020172";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 34, H = 23, D = 18;
const ROOF_TOP = 10;   // highest building block (parapet cap)
const DECK = 9;        // roof deck slab level
const STOREY = 5;      // storey line between floors
const LINTEL = 4;      // top of ground-floor shopfront

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(H - 2, gr0));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const n = has(x, z - 1), s = has(x, z + 1);
  const w = has(x - 1, z), e = has(x + 1, z);
  const perim = !(n && s && w && e);
  // Exposed face runs along x when the cell is open to the north or south.
  const faceX = !n || !s;
  const u = faceX ? x : z;
  const paneProps = faceX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  if (!perim) {
    // Interior: floor slabs and roof deck only. Air gap behind the glass.
    if (STOREY >= gr && STOREY < H) g.set(x, STOREY, z, "light_gray_concrete");
    if (DECK >= gr) g.set(x, DECK, z, "light_gray_concrete");
    // Rooftop plant box on the deck.
    if (gr <= DECK && x >= 12 && x <= 20 && z >= 6 && z <= 11) {
      g.set(x, DECK + 1, z, "light_gray_concrete");
    }
    continue;
  }

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === gr) {
      // Base course.
      g.set(x, y, z, "stone_bricks");
    } else if (y === DECK || y === ROOF_TOP) {
      // Parapet, with a slab cap on top.
      if (y === ROOF_TOP) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else if (y === STOREY) {
      // Cornice / storey line.
      g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if (y <= LINTEL) {
      // Ground-floor shopfront: lintel band, piers, and glass.
      if (y === LINTEL) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (u % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else if (u % 9 === 4 && y <= gr + 2) {
        // Entrance bay: leave open.
        continue;
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    } else {
      // Upper floor (y 6..8): window grid with piers.
      if (u % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else if ((u * 5 + y * 3) % 11 === 0) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
