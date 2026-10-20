import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 34 x 12 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1980s Taipei commercial row: stone-base shopfronts,
// white tiled-concrete upper floors with grey mullioned tinted glazing, a quartz cornice
// and a parapet, with one central shop entrance on the north frontage.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542020892";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 34, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const STOREY = 5;     // blocks per storey
const ROOF_DECK = 10; // roof slab offset above ground
const PARAPET = 11;   // parapet top offset above ground

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

// Find the street frontage: prefer north-facing exterior (low z), then south, west, east.
let front = null;
for (const dirName of ["north", "south", "west", "east"]) {
  const cand = cells.filter(([x, z]) => {
    if (!isEdge(x, z)) return false;
    if (dirName === "north") return !has(x, z - 1);
    if (dirName === "south") return !has(x, z + 1);
    if (dirName === "west") return !has(x - 1, z);
    return !has(x + 1, z);
  });
  if (cand.length >= 3) { front = { dirName, cand }; break; }
}
let doorCell = null;
let doorFacing = "north";
if (front) {
  doorFacing = front.dirName;
  const xs = front.cand.map(c => c[0]).sort((a, b) => a - b);
  const medX = xs[Math.floor(xs.length / 2)];
  doorCell = front.cand.reduce((best, c) =>
    Math.abs(c[0] - medX) < Math.abs(best[0] - medX) ? c : best);
}

for (const [x, z, gr] of cells) {
  const top = gr + PARAPET;
  if (top >= H) throw new Error(`cell ${x},${z} exceeds height: ${top}`);
  const edge = isEdge(x, z);

  // Foundation: solid from y0 up to the cell's ground.
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, edge ? "stone_bricks" : "stone");
  }

  if (!edge) {
    // Interior: floor slabs only, air gap between them.
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + STOREY, z, "smooth_stone");
    g.set(x, gr + ROOF_DECK, z, "light_gray_concrete");
    // Rooftop plant on some interior roof cells, standing on the deck.
    if ((x * 3 + z) % 7 === 0) g.set(x, gr + ROOF_DECK + 1, z, "iron_block");
    continue;
  }

  // ---- Exterior walls ----
  const bay4 = (x + z) % 4;
  const bay3 = (x + z) % 3;

  // Ground floor: base course, shopfront glazing with pillars, fascia.
  g.set(x, gr, z, "polished_andesite");
  for (const yy of [gr + 1, gr + 2, gr + 3]) {
    g.set(x, yy, z, bay4 === 0 ? "light_gray_concrete" : "glass_pane");
  }
  g.set(x, gr + 4, z, "light_gray_concrete"); // shopfront fascia / storey line

  // Upper floor: spandrel, mullioned window band, storey line.
  g.set(x, gr + 5, z, "white_concrete");
  for (const yy of [gr + 6, gr + 7, gr + 8]) {
    g.set(x, yy, z, bay3 === 0 ? "light_gray_concrete" : "glass_pane");
  }
  g.set(x, gr + 9, z, "smooth_quartz");       // cornice band

  // Roof edge: cornice and parapet.
  g.set(x, gr + ROOF_DECK, z, "smooth_quartz");
  g.set(x, gr + PARAPET, z, "white_concrete");

  // Warm light behind some upper windows: glowstone on the inner neighbour.
  if (bay3 === 1 && (x + z) % 2 === 0) {
    const inner = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
      .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
    if (inner) g.set(inner[0], gr + 7, inner[1], "glowstone");
  }
}

// Central shop entrance on the chosen frontage, with transom and hanging lanterns.
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  g.set(dx, dg, dz, "oak_door", {
    facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx, dg + 1, dz, "oak_door", {
    facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx, dg + 2, dz, "light_gray_concrete"); // transom
  g.set(dx, dg + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });

  // Light flanking the entrance on the fascia-side columns.
  for (const [ox, oz] of [[dx - 1, dz], [dx + 1, dz]]) {
    if (has(ox, oz) && isEdge(ox, oz)) {
      g.set(ox, dg + 3, oz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
