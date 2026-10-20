import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414201";
const W = 25, H = 23, D = 18;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`) - minG;
let maxG = 0;
for (const [x, z] of cells) maxG = Math.max(maxG, groundOf(x, z));

// Storey plan (absolute y, lowest ground = 0):
//  F1      ground-storey floor slab (above the highest ground under the footprint)
//  F1+1..4 ground storey (shopfront), F1+5 floor slab
//  F1+6..8 second storey, F1+9 roof deck, F1+10 parapet top (~11 above lowest ground)
const F1 = maxG + 1;

const isEdge = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
// Outward direction of an edge cell (front = toward -z).
const outOf = (x, z) => {
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x - 1, z)) return [-1, 0];
  return [1, 0];
};
const facingOf = ([ox, oz]) =>
  ox === 0 && oz === -1 ? "north" : ox === 0 && oz === 1 ? "south" : ox === -1 ? "west" : "east";

// Entrance: front-facing edge cell nearest the footprint's mean x.
const frontCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => isEdge(x, z) && !isCorner(x, z) && outOf(x, z)[1] === -1);
const meanX = cells.reduce((s, [x]) => s + x, 0) / cells.length;
let door = null;
if (frontCells.length) {
  door = frontCells.reduce((best, c) =>
    Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best
  );
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const base = groundOf(x, z);
  const edge = isEdge(x, z);

  // Foundation up to this cell's ground, then the downhill storeys down to F1.
  for (let y = 0; y <= base; y++) set(x, y, z, "stone");
  for (let y = base + 1; y < F1; y++) set(x, y, z, edge ? "light_gray_concrete" : "stone");

  // Floor, storey-line, and roof slabs run across the whole footprint.
  set(x, F1, z, edge ? "stone_bricks" : "smooth_stone");
  set(x, F1 + 5, z, edge ? "smooth_stone" : "stone");
  set(x, F1 + 9, z, edge ? "stone_bricks" : "light_gray_concrete");

  if (!edge) {
    // Interior: air behind the glass; a little roof plant on the deck.
    if ((x * 3 + z * 5) % 11 === 0) set(x, F1 + 10, z, "smooth_stone");
    continue;
  }

  const out = outOf(x, z);
  const corner = isCorner(x, z);
  const idx = out[1] !== 0 ? x : z; // position along the face
  const isDoor = door && door[0] === x && door[1] === z;
  const paneProps =
    out[1] !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const inward = [-out[0], -out[1]];
  const inwardCell = [x + inward[0], z + inward[1]];
  const inwardOk = has(...inwardCell) && !isEdge(...inwardCell);

  // Base course / entrance.
  if (isDoor) {
    const doorProps = { facing: facingOf(out), hinge: "left", open: "false", powered: "false" };
    set(x, F1 + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
    set(x, F1 + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
    set(x, F1 + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    set(x, F1 + 1, z, "polished_andesite");
  }

  // Spandrels.
  set(x, F1 + 4, z, "light_gray_concrete");
  set(x, F1 + 6, z, "light_gray_concrete");
  set(x, F1 + 5, z, "smooth_stone");

  // Ground storey: wide shopfront glass with piers at corners and every 6 blocks.
  if (!isDoor) {
    const pier1 = corner || idx % 6 === 0;
    for (const y of [F1 + 2, F1 + 3]) {
      if (pier1) set(x, y, z, "white_concrete");
      else set(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
    if (!pier1 && inwardOk && (x * 7 + z * 3) % 5 === 0) {
      set(inwardCell[0], F1 + 2, inwardCell[1], "glowstone");
    }
  }

  // Second storey: punched windows, piers every 3.
  const pier2 = corner || idx % 3 === 0;
  for (const y of [F1 + 7, F1 + 8]) {
    if (pier2) set(x, y, z, "white_concrete");
    else set(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  if (!pier2 && inwardOk && (x * 5 + z * 7) % 6 === 0) {
    set(inwardCell[0], F1 + 7, inwardCell[1], "shroomlight");
  }

  // Parapet with cornice course below.
  set(x, F1 + 10, z, "stone_brick_wall");
}

g.save(`${DIR}/${ID}.nbt`);
