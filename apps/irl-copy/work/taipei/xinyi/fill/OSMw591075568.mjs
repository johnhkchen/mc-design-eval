import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075568";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 8 x 8 footprint, roof about 17 blocks above lowest ground.
// Read as a 1970s-90s Taipei mid-rise: reinforced concrete frame, white
// tiled walls, black-framed glass, a shopfront base, three storeys of
// 5 blocks, and a parapet with roof plant.
const W = 8, H = 29, D = 8;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => map.has(`${x},${z}`);
const exposed = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  if (!has(x + 1, z)) out.push("E");
  if (!has(x - 1, z)) out.push("W");
  return out;
};

// Entrance: the north-facing exposed cell nearest the middle of the frontage.
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (!exposed(x, z).includes("N")) continue;
    const d = Math.abs(x - 3.5);
    if (d < best) { best = d; door = `${x},${z}`; }
  }
}

// Roof plant sits on the interior cell nearest the centre (3,3).
let plant = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (exposed(x, z).length > 0) continue;
    const d = Math.abs(x - 3) + Math.abs(z - 3);
    if (d < best) { best = d; plant = `${x},${z}`; }
  }
}

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, ground] of cells) {
  const G = Math.round(ground);
  const key = `${x},${z}`;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const isExt = ex.length > 0;
  const corner = ex.length >= 2;

  // Three storeys of 5 blocks: o0 = floor/spandrel, o1..o3 = glazing, o4 = head band.
  for (let s = 0; s < 3; s++) {
    for (let o = 0; o < 5; o++) {
      const y = G + s * 5 + o;

      if (!isExt) {
        // Interior: floor slab per storey, air otherwise (no interiors).
        if (o === 0) g.set(x, y, z, "light_gray_concrete");
        continue;
      }

      if (s === 0) {
        // Shopfront base.
        if (o === 0) { g.set(x, y, z, "stone_bricks"); continue; }
        if (o === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }
        if (key === door && (o === 1 || o === 2)) {
          g.set(x, y, z, "dark_oak_door", doorProps(o === 1 ? "lower" : "upper"));
          continue;
        }
        if (corner) { g.set(x, y, z, "white_concrete"); continue; }
        if ((x + z) % 2 === 0) g.set(x, y, z, "glass_pane");
        else g.set(x, y, z, "black_concrete");
        continue;
      }

      // Upper storeys.
      if (o === 0 || o === 4) { g.set(x, y, z, "white_concrete"); continue; }
      if (corner) { g.set(x, y, z, "white_concrete"); continue; }
      if (s === 1 && (x + z) % 4 === 1) { g.set(x, y, z, "glowstone"); continue; }
      if ((x + z) % 2 === 0) g.set(x, y, z, "glass_pane");
      else g.set(x, y, z, "white_concrete");
    }
  }

  // Roof deck at G+15 on every cell (stands on the storey below).
  g.set(x, G + 15, z, "light_gray_concrete");

  // Parapet on exposed cells: wall course with a stone slab cap.
  if (isExt) {
    g.set(x, G + 16, z, "white_concrete");
    g.set(x, G + 17, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  // Roof plant on one interior cell: a box with a vent grille.
  if (key === plant) {
    g.set(x, G + 16, z, "light_gray_concrete");
    g.set(x, G + 17, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
