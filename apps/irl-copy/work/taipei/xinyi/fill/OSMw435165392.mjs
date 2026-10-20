import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw435165392";
const W = 34, H = 23, D = 25;

// Record: no name, no era. Read as a 1990s-2000s Xinyi commercial block:
// two storeys (~5 blocks each), cream concrete frame, grey tinted glazing,
// stone-brick plinth, shopfront at street level, flat roof with a parapet.
// Roof surface sits at y=11 (about 11 blocks above the lowest ground).

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint map: "x,z" -> ground height (rounded blocks above y=0)
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g = Math.round(gr);
  if (g >= 10) continue; // would sit at or above the roof line; not buildable here
  ground.set(`${x},${z}`, g);
}

const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const SHOPFRONT_GLASS = "light_blue_stained_glass";
const TINTED_GLASS = "gray_stained_glass";
const FRAME = "light_gray_concrete";
const PLINTH = "stone_bricks";
const DECK = "smooth_stone";
const CORNICE = "smooth_stone_slab";
const PARAPET = "stone_brick_wall";
const WARM = "glowstone";

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  // Roof deck at y=10 on every cell (full cover, nothing floats).
  put(x, 10, z, DECK);

  // Ground-storey slab on every cell (sits on the foundation).
  put(x, gr, z, DECK);

  // Is this cell on the outside of the footprint?
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Facade index: along the face the cell belongs to.
  const facingX = !has(x, z - 1) || !has(x, z + 1); // exposed on north/south faces
  const idx = facingX ? x : z;

  if (!edge) {
    // Interior: floor slab at the storey line, air elsewhere (no interiors modelled).
    if (5 > gr) put(x, 5, z, DECK);
    // Roof equipment sparsely on the deck.
    if ((x * 5 + z * 3) % 19 === 0) put(x, 11, z, "iron_block");
    continue;
  }

  // Exterior wall cell.
  // Storey band / floor line at y=5 (clipped to cells below it).
  if (5 > gr) put(x, 5, z, FRAME);

  // Cornice ring at roof level.
  put(x, 10, z, CORNICE === DECK ? DECK : DECK);

  // Parapet on top of the roof ring.
  put(x, 11, z, PARAPET);

  const pillar = idx % 4 === 0;
  const entrance = idx % 12 === 6;

  for (let y = gr + 1; y <= 9; y++) {
    if (y === 5) continue; // storey line already placed

    if (y <= 4) {
      // Ground storey: shopfront.
      if (pillar) put(x, y, z, FRAME);
      else if (entrance && y <= gr + 2) put(x, y, z, SHOPFRONT_GLASS);
      else put(x, y, z, SHOPFRONT_GLASS);
    } else {
      // Upper storey: spandrels at the top and bottom, glazed middle.
      if (y === 6 || y === 9) {
        put(x, y, z, FRAME);
      } else if (pillar) {
        put(x, y, z, FRAME);
      } else if (y === 7 && (idx + z) % 11 === 0) {
        put(x, y, z, WARM); // warm light behind the glass
      } else {
        put(x, y, z, TINTED_GLASS);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
