import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075553";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 29, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Vertical plan: 3 storeys of 5 blocks, deck at y15, parapet top at y16 (~17 blocks)
const DECK = 15;
const ROOF = 16;
const FLOORS = [5, 10];
const STOREY_BANDS = [[6, 8], [11, 13]];   // upper-storey window rows
const SPANDREL = [9, 14];                  // spandrel rows between window bands
const SHOP_TOP = 4;                        // ground-floor fascia row

// Pier rhythm on facades (every third cell along either axis)
const pier = (x, z) => (x + z) % 3 === 0;

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ed = edge(x, z);
  const cor = corner(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= DECK; y++) {
    if (y === gr) {
      g.set(x, y, z, ed ? "polished_andesite" : "smooth_stone");      // base course / floor
    } else if (y === DECK) {
      g.set(x, y, z, ed ? "light_gray_concrete" : "smooth_stone");     // cornice / roof deck
    } else if (FLOORS.includes(y)) {
      g.set(x, y, z, ed ? "light_gray_concrete" : "smooth_stone");     // storey lines / floor slabs
    } else if (ed) {
      if (cor) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });                // corner columns
      } else if (y <= SHOP_TOP) {
        if (y === SHOP_TOP) g.set(x, y, z, "dark_oak_planks");        // shopfront fascia
        else if (pier(x, z)) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "light_blue_stained_glass");               // shop glazing
      } else {
        const inBand = STOREY_BANDS.some(([a, b]) => y >= a && y <= b);
        if (SPANDREL.includes(y) || pier(x, z) || !inBand) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane");            // windows with frames
        }
      }
    }
    // interior cells above the deck-free storeys stay air (no interiors)
  }

  // Parapet along the roofline
  if (ed) {
    g.set(x, ROOF, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm light behind the street-side glazing: glowstone in interior cells beside the west wall
for (const [x, z, gr] of cells) {
  if (edge(x, z)) continue;
  if (x !== 1 || z % 4 !== 1) continue;
  for (const y of [8, 13]) {
    if (y > gr && y < DECK) g.set(x, y, z, "glowstone");
  }
}

// Rooftop mechanical plant at the centre
for (let x = 9; x <= 13; x++) {
  for (let z = 6; z <= 9; z++) {
    if (has(x, z) && G.get(`${x},${z}`) <= DECK) g.set(x, ROOF, z, "iron_block");
  }
}

// Entrance: double-height door on the street (north-facing) frontage near the centre
let doorCell = null;
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  if (!doorCell || Math.abs(x - 11) < Math.abs(doorCell[0] - 11)) doorCell = [x, z, gr];
}
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  g.set(dx, dg, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // lantern beside the entrance, lit at dusk
  if (has(dx + 1, dz) && G.get(`${dx + 1},${dz}`) <= dg + 2) {
    g.set(dx + 1, dg + 2, dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
