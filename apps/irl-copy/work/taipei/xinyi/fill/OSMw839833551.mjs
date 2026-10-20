import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833551.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833551.nbt";

// Low-rise 1990s-2000s Xinyi commercial block: 2 storeys of 5 blocks, shopfront
// ground floor, window band above, stone-brick parapet, rooftop plant.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 18, H = 23, D = 16;
const TOP = 11;          // roof surface level above lowest ground
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.max(0, Math.min(10, gr)));
const has = (x, z) => map.has(`${x},${z}`);

// Pick entrance: middle of the south-facing (z max) exposed edge, else north.
function pickEntrance() {
  const southEdge = cells
    .filter(([x, z]) => !has(x, z + 1))
    .sort((a, b) => a[0] - b[0]);
  if (southEdge.length) return { cell: southEdge[Math.floor(southEdge.length / 2)], face: "s" };
  const northEdge = cells
    .filter(([x, z]) => !has(x, z - 1))
    .sort((a, b) => a[0] - b[0]);
  if (northEdge.length) return { cell: northEdge[Math.floor(northEdge.length / 2)], face: "n" };
  return null;
}
const entrance = pickEntrance();

function facadeBlock(y, gr, idx, isEntryCell, face) {
  // Base course at the lowest exposed level of each column
  if (y === gr && gr <= 3) return ["polished_andesite"];

  // Ground-floor shopfront (storey 1)
  if (y <= 3) {
    if (idx % 3 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass"];
  }
  if (y === 4) return ["smooth_stone"];          // lintel / fascia
  if (y === 5) return ["light_gray_concrete"];   // floor slab line

  // Upper storey window band
  if (y >= 6 && y <= 8) {
    if (idx % 3 === 0) return ["white_concrete"]; // piers
    if (y === 6 || y === 8) return ["white_concrete"]; // window frames
    if (y === 7 && idx % 6 === 1) return ["glowstone"]; // warm lit window
    return ["light_blue_stained_glass"];
  }
  if (y === 9) return ["light_gray_concrete"];   // spandrel
  if (y === 10) return ["stone_bricks"];         // cornice band
  if (y === 11) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }]; // coping
  return null;
}

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(10, gr0));

  // Foundation under every footprint cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const exposed = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const isEdge = exposed.n || exposed.s || exposed.w || exposed.e;

  if (isEdge) {
    // Choose the exposed face used for articulation (prefer street-facing n/s)
    const face = exposed.s ? "s" : exposed.n ? "n" : exposed.e ? "e" : "w";
    const idx = face === "n" || face === "s" ? x : z;

    const isEntry = entrance && entrance.cell[0] === x && entrance.cell[1] === z;

    for (let y = gr; y <= TOP; y++) {
      if (isEntry && (y === gr || y === gr + 1) && y <= 3) {
        // Door: lower then upper half
        const half = y === gr ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: entrance.face === "s" ? "south" : "north",
          half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      const spec = facadeBlock(y, gr, idx, isEntry, face);
      if (!spec) continue;
      const [name, props] = spec;
      if (props) g.set(x, y, z, name, props);
      else g.set(x, y, z, name);
    }
    // Make sure coping is present where the facade stops below TOP
    if (gr > TOP) g.set(x, TOP, z, "stone_bricks");
  } else {
    // Interior: solid core (no open interior), storey slab, roof deck
    for (let y = 0; y <= 10; y++) {
      if (y === 5) g.set(x, y, z, "light_gray_concrete");   // floor slab
      else g.set(x, y, z, "light_gray_concrete");          // solid core
    }
    g.set(x, TOP, z, "gray_concrete");                      // roof deck
  }

  // Rooftop plant: a few AC boxes and a stair-stepped penthouse on interior cells
  const interior = !isEdge;
  if (interior && x % 5 === 2 && z % 5 === 2) {
    g.set(x, 12, z, "iron_block");
    g.set(x, 13, z, "light_gray_concrete");
  } else if (interior && x % 4 === 1 && z % 4 === 1) {
    g.set(x, 12, z, "light_gray_concrete");
  }
}

g.save(OUT);
