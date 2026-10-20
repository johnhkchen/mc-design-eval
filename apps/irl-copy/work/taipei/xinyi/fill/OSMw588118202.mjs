import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588118202";
const W = 13, H = 30, D = 49;

// Roof top (exclusive) sits 18 blocks above the lowest ground, measured from y 0.
// Deck at y 15, cornice at y 16, parapet cap at y 17.
const DECK = 15, CORNICE = 16, PARAPET = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const minX = Math.min(...cells.map(c => c[0]));
const westZ = cells.filter(([x, z]) => x === minX && DIRS.some(([dx, dz]) => !has(x + dx, z + dz)))
  .map(c => c[1]);
const midZ = westZ.length ? westZ.reduce((a, b) => a + b, 0) / westZ.length : D / 2;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [x, z, gr] of cells) {
  const missing = DIRS.find(([dx, dz]) => !has(x + dx, z + dz));
  const perim = Boolean(missing);
  const inward = missing ? [-missing[0], -missing[1]] : null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= PARAPET; y++) {
    const rel = y - gr;

    if (y === PARAPET) {
      if (perim) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === CORNICE) {
      if (perim) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === DECK) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y > DECK) continue;

    // Storey floor line (every 5 blocks from ground)
    if (rel % 5 === 0) {
      if (perim) put(x, y, z, rel === 0 ? "polished_granite" : "smooth_quartz");
      else put(x, y, z, "smooth_stone");
      continue;
    }

    if (perim) {
      // Spandrel below each window band
      if (rel % 5 === 4) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      const ground_floor = rel < 5;
      const entrance = ground_floor && missing && missing[0] === -1 && Math.abs(z - midZ) <= 1;
      if (entrance) {
        put(x, y, z, "glass");
        continue;
      }

      const pier = (x + z) % 3 === 0;
      if (ground_floor) {
        put(x, y, z, pier ? "polished_granite" : "glass");
      } else {
        put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }

      // Warm light in the air gap behind some upper-floor windows
      if (!pier && !ground_floor && rel % 5 === 2 && inward && z % 4 === 1) {
        const ix = x + inward[0], iz = z + inward[1];
        if (has(ix, iz) && y >= ground.get(`${ix},${iz}`)) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
    // Interior cells above the floor line stay air (no interiors).
  }

  // Roof plant: small interior blocks standing on the deck.
  if (!perim && gr <= DECK && x % 5 >= 2 && x % 5 <= 3 && z % 12 >= 5 && z % 12 <= 6) {
    put(x, DECK + 1, z, "light_gray_concrete");
    put(x, DECK + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
