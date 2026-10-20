import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse: two commercial storeys over a stone plinth, white
// concrete piers with glazed bays, red sign panels on the fascia, a parapet
// with rooftop AC plant and lanterns. The roof sits 11 blocks above the lowest
// ground (y 0). Downhill cells fill to their own ground, so the building stays
// level on top and shows its extra height on the low side.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871932";
const W = 14, H = 23, D = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let F = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < F) F = gr;
}
if (!Number.isFinite(F)) F = 0;

const has = (x, z) => ground.has(key(x, z));
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id, p ?? {});
};

// Classify footprint cells: edge (perimeter) or interior, plus corner flag.
const edgeSet = new Set();
for (const [x, z] of cells) {
  const mW = !has(x - 1, z), mE = !has(x + 1, z), mN = !has(x, z - 1), mS = !has(x, z + 1);
  if (mW || mE || mN || mS) edgeSet.add(key(x, z));
}
const isEdge = (x, z) => edgeSet.has(key(x, z));

// 1) Foundation: solid from 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2) Interior floors, and perimeter walls with their articulation.
for (const [x, z, gr] of cells) {
  const mW = !has(x - 1, z), mE = !has(x + 1, z), mN = !has(x, z - 1), mS = !has(x, z + 1);
  const edge = mW || mE || mN || mS;

  if (!edge) {
    put(x, gr, z, "smooth_stone");                       // ground floor slab
    if (F + 5 > gr) put(x, F + 5, z, "smooth_stone");     // upper floor slab
    if (F + 10 > gr) put(x, F + 10, z, "light_gray_concrete"); // roof deck
    continue;
  }

  const corner = (mW || mE) && (mN || mS);
  const xFace = mW || mE;
  const u = xFace ? z : x;
  const last = xFace ? D - 1 : W - 1;
  const pier = corner || u % 4 === 0 || u === last;
  const paneProps = xFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = gr; y <= F + 10; y++) {
    const k = y - F;
    let id, p;
    if (y === gr) {
      id = "stone_bricks";                                  // base course
    } else if (k <= 3) {
      if (pier) id = "white_concrete";
      else { id = "glass_pane"; p = paneProps; }             // shopfront glazing
    } else if (k === 4) {
      id = (!corner && u % 8 >= 2 && u % 8 <= 4) ? "red_concrete" : "smooth_stone"; // fascia / sign
    } else if (k === 5) {
      id = "smooth_stone";                                  // storey line
    } else if (k <= 8) {
      if (pier) id = "white_concrete";
      else { id = "glass_pane"; p = paneProps; }             // upper windows
    } else if (k === 9) {
      id = "light_gray_concrete";                           // spandrel
    } else {
      id = "stone_bricks";                                  // parapet
    }
    put(x, y, z, id, p);
  }
}

// 3) Entrance: a single door on the south face, with its transom glazing above.
for (const [x, z, gr] of cells) {
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z), mN = !has(x, z - 1);
  const corner = (mW || mE) && (mN || mS);
  if (mS && !corner && x === 6 && gr + 1 <= F + 3) {
    put(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// 4) Warm light behind some glazing (glowstone on interior cells, air gap kept).
for (const [x, z, gr] of cells) {
  const mW = !has(x - 1, z), mE = !has(x + 1, z), mN = !has(x, z - 1), mS = !has(x, z + 1);
  if (!(mW || mE || mN || mS)) continue;
  const corner = (mW || mE) && (mN || mS);
  if (corner) continue;
  const xFace = mW || mE;
  const u = xFace ? z : x;
  if (u % 4 === 0 || u === (xFace ? D - 1 : W - 1)) continue;
  const [ix, iz] = xFace
    ? (mW ? [x + 1, z] : [x - 1, z])
    : (mN ? [x, z + 1] : [x, z - 1]);
  const gi = ground.get(key(ix, iz));
  if (gi === undefined || isEdge(ix, iz)) continue;

  // Upper-storey lamp on every third bay.
  if (u % 8 === 2 && F + 7 > gi) put(ix, F + 7, iz, "glowstone");
  // Shopfront lamp on some bays.
  if (u % 8 === 5 && F + 2 > gi) put(ix, F + 2, iz, "glowstone");
}

// 5) Roof plant on the deck: AC condensers and standing lanterns at the corners.
if (F + 12 <= H - 1) {
  for (const [x, z] of cells) {
    if (isEdge(x, z)) continue;
    const ac = ((x === 3 || x === 4) && (z === 9 || z === 10)) ||
               ((x === 9 || x === 10) && (z === 28 || z === 29));
    if (ac) put(x, F + 11, z, "iron_block");
    const lamp = (x === 1 || x === W - 2) && (z === 1 || z === D - 2);
    if (lamp) put(x, F + 11, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
