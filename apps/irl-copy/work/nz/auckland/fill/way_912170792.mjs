// Auckland way 912170792: a 1920s-30s three-storey brick commercial block on a sloping site (Eden Terrace / Karangahape
// side). Ground-floor shopfront of glass and dark-oak piers, red brick walls on stone bands (quartz sills and string
// courses), sash-style glass in brick piers, a quartz parapet on a flat deck with a plant box. Footprint cells only:
// each cell is foundation up to its ground, a floor slab per storey, and walls on the perimeter with an air gap inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170792.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170792.nbt";
const [SX, SY, SZ] = [10, 25, 6];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

// The lidar roof is one flat tier: the median of the cells' roof heights (12 here), not per-cell noise.
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const TOP = roofs[roofs.length >> 1];
const DECK = TOP - 1;                         // parapet and roof deck (y of the top course)
const SILL_2 = 4, SILL_3 = 8;                 // storey lines: floor slab 2 and floor slab 3 (quartz on the walls)

const FACE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const exposed = (x, z) => Object.keys(FACE).filter((f) => !has(x + FACE[f][0], z + FACE[f][1]));
const interiorAt = (x, z) => has(x, z) && exposed(x, z).length === 0;

const g = new Voxels([SX, SY, SZ]);
const placed = new Map();                     // "x,y,z" -> block id, for the pane connections
const put = (x, y, z, block, state) => { placed.set(`${x},${y},${z}`, block); g.set(x, y, z, block, state); };
const lit = (x, z, k) => (x * 5 + z * 3 + k) % 3 === 0;
const panes = [];

for (const [x, z, gr] of cells) {
  const faces = exposed(x, z);
  const wall = faces.length > 0, corner = faces.length > 1;
  const pier = corner || (faces.some((f) => f === "N" || f === "S") ? x % 3 === 0 : z % 3 === 0);
  // foundation to the cell's ground, then the floor (plinth on the walls, slab inside)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, wall ? "stone_bricks" : "smooth_stone");
  if (!wall) { // interior: air between slabs at each storey line, a deck on top; lights are placed in the pass below
    for (const y of [SILL_2, SILL_3]) put(x, y, z, "smooth_stone");
    put(x, DECK, z, "gray_concrete");
    continue;
  }

  // ground storey: shopfront glass between dark-oak piers, timber fascia over
  const isDoor = x === 6 && z === 0;
  for (let y = gr + 1; y <= 2; y++) {
    if (isDoor) continue;
    if (pier) put(x, y, z, "dark_oak_log");
    else { put(x, y, z, "glass_pane"); panes.push([x, y, z, faces]); }
  }
  if (isDoor) {
    put(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  put(x, 3, z, "dark_oak_planks");
  // the storeys above: quartz string courses, brick piers, glass in the bays
  put(x, SILL_2, z, "quartz_block");
  put(x, SILL_3, z, "quartz_block");
  put(x, DECK, z, "quartz_block");
  for (const [y0, y1] of [[5, 7], [9, 10]]) {
    for (let y = y0; y <= y1; y++) {
      if (pier) put(x, y, z, "bricks");
      else { put(x, y, z, "glass_pane"); panes.push([x, y, z, faces]); }
    }
  }
}

// second pass, once every cell is placed: a pane arms only toward its neighbours in the wall plane
const joins = (x, y, z) => { const b = placed.get(`${x},${y},${z}`); return !!b && b !== "dark_oak_door" && b !== "lantern"; };
for (const [x, y, z, faces] of panes) {
  const ns = faces.some((f) => f === "N" || f === "S");
  const st = ns
    ? { north: "false", south: "false", east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false" }
    : { north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" };
  g.set(x, y, z, "glass_pane", st);
}

// Lights behind some windows (inside the air gap, on the floor slab below) and in the shop; a plant box on the deck.
for (const [x, z, gr] of cells) {
  const faces = exposed(x, z);
  if (!faces.length) continue;
  const [ix, iz] = INWARD[faces[0]];
  if (!interiorAt(x + ix, z + iz)) continue;
  const bx = x + ix, bz = z + iz;
  if (lit(x, z, 0)) put(bx, gr + 1, bz, "lantern", { hanging: "false", waterlogged: "false" });
  if (lit(x, z, 1)) put(bx, SILL_2 + 1, bz, "glowstone");
  if (lit(x, z, 2)) put(bx, SILL_3 + 1, bz, "shroomlight");
}
put(3, DECK + 1, 2, "iron_block");
put(3, DECK + 1, 3, "iron_block");

g.save(OUT);
console.log(`wrote ${OUT}: ${g.count()} blocks, top y=${TOP}`);
