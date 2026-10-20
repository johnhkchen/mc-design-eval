import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 8 x 24 footprint, roof ~11 blocks above lowest ground.
// Read as a late-1970s/80s Taipei mid-rise commercial block: two storeys of
// ~5 blocks, stone-clad ground floor with shopfronts, white concrete piers
// above, a smooth-stone band at each floor line, a parapet, and a rooftop
// with plant boxes. A glazed entrance faces west, the long street side.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459501";

const W = 8, H = 23, D = 24;
const FLOOR = 5;   // storey line
const DECK = 10;   // top of second storey / roof deck
const ROOF = 11;   // parapet cap

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const groundOf = new Map();
for (const [x, z, gr] of list) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);
const gAt = (x, z) => Math.min(groundOf.get(`${x},${z}`), DECK - 1);

// Which face of the footprint this cell sits on (null = interior).
function faceOf(x, z) {
  if (!has(x - 1, z)) return { dir: "west", u: z, L: D, dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { dir: "east", u: z, L: D, dx: -1, dz: 0 };
  if (!has(x, z - 1)) return { dir: "north", u: x, L: W, dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { dir: "south", u: x, L: W, dx: 0, dz: -1 };
  return null;
}

const isInterior = (x, z) => has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

// Entrance: west-face cell nearest to the middle of the 24-block side.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of list.map(c => [c[0], c[1]])) {
    if (has(x - 1, z)) continue;
    const d = Math.abs(z - 12) * 10 + x;
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

const g = new Voxels([W, H, D]);

const glassFor = (dir) =>
  (dir === "west" || dir === "east")
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { north: "false", south: "false", east: "true", west: "true" };

function facadeBlock(x, z, y, gr, f) {
  const { dir, u, L } = f;
  const pier = u % 3 === 0 || u === L - 1;
  const isDoorCell = doorKey === `${x},${z}`;

  if (y === ROOF) return { id: "smooth_stone_slab", props: { type: "bottom" } };
  if (y === gr) return { id: "stone_bricks" };
  if (y === FLOOR || y === DECK) return { id: "smooth_stone" };

  if (y < FLOOR) {
    // Ground storey: shopfront.
    if (y === 4) return { id: "smooth_stone" };            // lintel band
    if (isDoorCell && y === gr + 1) return { id: "oak_door", props: { facing: dir === "west" ? "west" : dir, half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (isDoorCell && y === gr + 2) return { id: "oak_door", props: { facing: dir === "west" ? "west" : dir, half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (isDoorCell && y === gr + 3) return { id: "smooth_stone_slab", props: { type: "bottom" } }; // canopy over entrance
    if (pier) return { id: "polished_andesite" };
    return { id: "glass_pane", props: glassFor(dir) };
  }

  // Upper storey.
  if (pier) return { id: "white_concrete" };
  return { id: "glass_pane", props: glassFor(dir) };
}

for (const [x, z, rawG] of list) {
  const gr = gAt(x, z);
  const f = faceOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!f) {
    // Interior: floor slabs and an air gap; a few lamps standing on the floors.
    for (let y = gr; y <= DECK; y++) {
      if (y === gr || y === FLOOR || y === DECK) g.set(x, y, z, "light_gray_concrete");
    }
    if (((x * 3 + z) % 7) === 0 && gr + 1 < FLOOR) {
      g.set(x, gr + 1, z, "lantern", { hanging: "false" });
    }
    if (((x * 3 + z) % 7) === 2) {
      g.set(x, FLOOR + 1, z, "lantern", { hanging: "false" });
    }
    continue;
  }

  // Exterior wall cell.
  for (let y = gr; y <= DECK; y++) {
    const b = facadeBlock(x, z, y, gr, f);
    g.set(x, y, z, b.id, b.props);
  }
  // Parapet on the edge.
  g.set(x, ROOF, z, "smooth_stone_slab", { type: "bottom" });

  // Warm light: lantern on the upper floor behind some windows.
  const isWindowUpper = (y) => y >= 6 && y <= 9;
  const u = f.u;
  const isPier = u % 3 === 0 || u === f.L - 1;
  if (!isPier && u % 6 === 4 && has(x + f.dx, z + f.dz)) {
    const ix = x + f.dx, iz = z + f.dz;
    if (!(doorKey === `${x},${z}`)) {
      g.set(ix, FLOOR + 1, iz, "lantern", { hanging: "false" });
    }
  }
  // Ground-floor warm light behind shopfront glass.
  if (!isPier && u % 6 === 1 && has(x + f.dx, z + f.dz) && doorKey !== `${x},${z}`) {
    g.set(x + f.dx, gr + 1, z + f.dz, "lantern", { hanging: "false" });
  }
}

// Roof plant on the deck: a few iron boxes on interior cells.
for (const [x, z] of list.map(c => [c[0], c[1]])) {
  if (!isInterior(x, z)) continue;
  if ((x === 2 && (z === 4 || z === 19)) || (x === 5 && (z === 5 || z === 18))) {
    g.set(x, ROOF, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
