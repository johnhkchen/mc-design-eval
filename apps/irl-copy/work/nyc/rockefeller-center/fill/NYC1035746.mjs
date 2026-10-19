// 538 Madison Avenue, Commercial & Office, built 1870: a narrow five-storey Italianate commercial block of the kind that
// lined Madison in the 1870s. Brick upper walls on a stone base, smooth-stone storey bands, paired window openings with
// stone piers, a dark-wood shopfront with one entrance on the street face, and a stone cornice with a flat parapet.
// Massing: the lidar roof (16-18 blocks, mean 17) is one flat tier, so no setbacks. Every row is solid across the
// footprint or sits on a solid row below it. Storeys are solid bands (one row) with two window rows between them,
// the interior is air behind the glass, and the back wall is windowed too so the block reads from both sides.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1035746.cells.json", "utf8"));   // [x, z, ground, roof]
const onFootprint = new Set(cells.map(([x, z]) => `${x},${z}`));

const W = 15, D = 3;
// One flat tier: the lidar roof, smoothed. Mean of the 45 cells is about 17.1, so 17 with 16 and 18 as noise.
const TOP = Math.round(cells.reduce((s, c) => s + c[3], 0) / cells.length);   // 17
const ground = Math.min(...cells.map((c) => c[2]));                            // 0

const g = new Voxels([W, TOP + 2, D]);     // +2 for the rooftop bulkhead
const FRONT = 2, BACK = 0;
const WIN = [1, 2, 4, 5, 7, 8, 10, 11];     // window columns on the storeys (two cells wide, piers between)
const GROUND_WIN = [1, 2, 4, 5, 7, 8, 10, 11];
const DOOR_X = 13;                           // entrance on the street face, in the right-hand pier bay
const BANDS = [3, 6, 9, 12];                 // solid storey lines (smooth stone)
const CORNICE = 15;                          // stone cornice course
const UPPER_LO = [4, 7, 10, 13];             // lower row of each upper storey's window pair
const lit = (x, lo) => WIN.includes(x) && (x + lo) % 3 === 0;   // about a third of the upper windows show a lamp

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground (zero here, since the lot is level with the sidewalk).
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  const edge = z === FRONT || z === BACK || x === 0 || x === W - 1;

  for (let y = gr; y < TOP; y++) {
    // Base course, storey bands and cornice run through the whole footprint: a solid row under every tier.
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (BANDS.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === CORNICE) { g.set(x, y, z, "stone_bricks"); continue; }

    // Ground storey: shopfront at the street face, brick back wall.
    if (y === 1 || y === 2) {
      if (z === FRONT) {
        if (x === DOOR_X) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        g.set(x, y, z, GROUND_WIN.includes(x) ? "glass" : "dark_oak_planks"); continue;
      }
      if (x === 0 || x === W - 1 || z === BACK && !WIN.includes(x)) { g.set(x, y, z, "bricks"); continue; }
      if (z === BACK) { g.set(x, y, z, "glass_pane"); continue; }
      // Interior air behind the shop glass, with a few lamps.
      if (y === 1 && (x === 2 || x === 8)) g.set(x, y, z, "glowstone");
      if (y === 2 && (x === 5 || x === 11) && z === FRONT - 1) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    // Upper storeys: paired window rows between the bands.
    const storey = UPPER_LO.find((lo) => y === lo || y === lo + 1);
    if (storey !== undefined) {
      const lo = storey;
      if (x === 0 || x === W - 1) { g.set(x, y, z, "bricks"); continue; }
      if (z === 1) {                       // the air gap behind the glass: lamps on the lower row only
        if (y === lo && lit(x, lo)) g.set(x, y, z, (x + lo) % 2 ? "glowstone" : "shroomlight");
        continue;
      }
      g.set(x, y, z, WIN.includes(x) ? "glass_pane" : "bricks");
      continue;
    }

    // Parapet and roof deck at the top tier.
    if (y === TOP - 1) { g.set(x, y, z, edge ? "bricks" : "smooth_stone"); continue; }
  }
}

// Rooftop bulkhead: a small stair-and-plant box on the roof deck, one bay in from the street face. Its lid is a slab.
for (let x = 4; x <= 6; x++) {
  g.set(x, TOP, 1, "stone_bricks");
  g.set(x, TOP + 1, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = new URL("./NYC1035746.nbt", import.meta.url).pathname;
const { blocks, palette } = g.save(out);
console.log(`NYC1035746: ${blocks} blocks, ${palette} palette entries, top y=${TOP}, ground ${ground}, footprint ${onFootprint.size} cells -> ${out}`);
