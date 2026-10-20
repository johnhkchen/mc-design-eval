import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 13 x 9 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1990s Taipei commercial block: stone-base
// shopfront on the street, white-tiled upper floors with blue-tinted glass,
// a red fascia over the shop entrance, a stone cornice and parapet, and a
// small rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888745";
const W = 13, H = 23, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, g);
}
const has = (x, z) => ground.has(`${x},${z}`);

// One common floor level for the whole block: the highest cell ground.
// Lower cells are filled up to it, so every storey sits on solid material.
const base = Math.max(0, ...ground.values());
const TOP = base + 12; // cornice cap
if (TOP > H - 1) throw new Error(`building too tall for H=${H}: base ${base}`);

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// Facade face per cell: street side is the north (z-min) face.
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
};

// Door sits on the middle of the street-facing cells.
const frontXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => faceOf(x, z) === "n")
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

// Rooftop tank on the interior cell nearest the centroid.
const cx = [...ground.keys()].reduce((s, k) => s + Number(k.split(",")[0]), 0) / ground.size;
const cz = [...ground.keys()].reduce((s, k) => s + Number(k.split(",")[1]), 0) / ground.size;
let tankCell = null, best = Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (faceOf(x, z)) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < best) { best = d; tankCell = [x, z]; }
}

for (const [x, z, gr] of cells) {
  if (!(x >= 0 && x < W && z >= 0 && z < D)) continue;

  // Foundation: solid from y 0 up to the common floor level.
  for (let y = 0; y < base; y++) S(x, y, z, "stone_bricks");

  // Floor decks: ground floor, first-floor slab, roof deck.
  S(x, base, z, "smooth_stone");
  S(x, base + 5, z, "smooth_stone");
  S(x, base + 10, z, "smooth_stone");

  const face = faceOf(x, z);
  if (!face) continue; // interior cell: decks only, air behind the glass

  const t = face === "n" || face === "s" ? x : z;
  const pillar = t % 3 === 0;
  const isFront = face === "n";

  // Storey 1: shopfront (base+1..base+3), fascia at base+4.
  for (let y = base + 1; y <= base + 3; y++) {
    if (pillar) S(x, y, z, "stone_bricks");
    else if (isFront) S(x, y, z, "glass");
    else S(x, y, z, "light_blue_stained_glass");
  }
  S(x, base + 4, z, isFront ? "red_concrete" : "light_gray_concrete");

  // Door on the street front, two blocks tall.
  if (isFront && x === doorX) {
    const facing = "north";
    S(x, base + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, base + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    S(x, base + 3, z, "stone_bricks"); // transom above the door
  }

  // Storey line between floors.
  S(x, base + 5, z, "light_gray_concrete");

  // Storey 2: white pillars, blue-tinted windows, a few lit warm.
  for (let y = base + 6; y <= base + 8; y++) {
    if (pillar) S(x, y, z, "light_gray_concrete");
    else if (y === base + 7 && t % 6 === 1) S(x, y, z, "glowstone");
    else S(x, y, z, "light_blue_stained_glass");
  }
  S(x, base + 9, z, "white_concrete"); // lintel band

  // Cornice, parapet and cap.
  S(x, base + 10, z, "stone_bricks");
  S(x, base + 11, z, "white_concrete");
  S(x, base + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop water tank on the interior cell nearest the centre.
if (tankCell) {
  const [tx, tz] = tankCell;
  for (let y = base + 11; y <= base + 13; y++) S(tx, y, tz, "stone_bricks");
  S(tx, base + 14, tz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
