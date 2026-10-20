import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE91-0324-3F-5: a 2002 three-storey Xinyi office/retail block (roof about 16 blocks above lowest ground).
// Grey-and-white concrete frame with blue glass bays, a stone base, cornice bands, warm lit bays,
// a setback roof core, and a dark-oak entrance on the front (+z) edge.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0324-3F-5";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 11, H = 28, D = 7;
const g = new Voxels([W, H, D]);

const ROOF_DECK = 15;               // solid roof deck (top of the building body)
const PARAPET = 16;                 // parapet course on the perimeter
const CORE_TOP = 17;                // setback roof core (penthouse) top
const FLOOR_LINES = [5, 10];        // storey floor lines (about 5 blocks per storey)

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const missing = (x, z) => [!has(x + 1, z), !has(x - 1, z), !has(x, z + 1), !has(x, z - 1)];
const isRing = (x, z) => missing(x, z).some(Boolean);
const isCorner = (x, z) => {
  const m = missing(x, z);
  return (m[0] || m[1]) && (m[2] || m[3]);
};
const clampG = (gr) => Math.max(0, Math.min(14, Math.round(gr)));

// Front is the +z edge of the footprint; entrance sits at the middle of that row.
const zMax = Math.max(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === zMax).map((c) => c[0]).sort((a, b) => a - b);
const ex = frontXs[Math.floor(frontXs.length / 2)];
const ez = zMax;

// Warm lit bays: a deterministic subset of mid-storey window cells.
const lit = (x, y, z) => y % 5 === 2 && (x * 5 + y * 7 + z * 3) % 11 === 0;

const paneProps = (x, z, horizWall) => {
  const conn = (dx, dz) => (has(x + dx, z + dz) && isRing(x + dx, z + dz) ? "true" : "false");
  if (horizWall) {
    return { east: conn(1, 0), west: conn(-1, 0), north: "false", south: "false", waterlogged: "false" };
  }
  return { east: "false", west: "false", north: conn(0, -1), south: conn(0, 1), waterlogged: "false" };
};

// Setback core: interior roof cells well inside the footprint, so the core stands on the deck.
const inCore = (x, z) => has(x, z) && !isRing(x, z) && x >= 3 && x <= 7 && z >= 2 && z <= 4;

// 1. Foundations, floors, facade and roof deck for every footprint cell.
for (const [x, z, raw] of cells) {
  const gr = clampG(raw);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ring = isRing(x, z);
  const horizWall = !has(x, z + 1) || !has(x, z - 1);

  for (let y = gr; y <= ROOF_DECK; y++) {
    if (y === ROOF_DECK) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!ring) {
      // Interior: only the floor slabs; the air between them stays empty.
      if (FLOOR_LINES.includes(y)) g.set(x, y, z, "white_concrete");
      continue;
    }

    let blk;
    let props;
    if (y === gr) {
      blk = "polished_andesite";                 // base course
    } else if (FLOOR_LINES.includes(y)) {
      blk = "white_concrete";                    // storey line
    } else if (y % 5 === 4) {
      blk = "smooth_stone";                      // cornice band under each storey line
    } else {
      const along = horizWall ? x : z;
      if (isCorner(x, z) || along % 3 === 0) {
        blk = "white_concrete";                  // frame piers
      } else if (lit(x, y, z)) {
        blk = "shroomlight";                     // warm lit bay
      } else {
        blk = "light_blue_stained_glass_pane";   // glazing
        props = paneProps(x, z, horizWall);
      }
    }
    if (props) g.set(x, y, z, blk, props);
    else g.set(x, y, z, blk);
  }
}

// 2. Parapet cap along the roof edge.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isRing(x, z)) g.set(x, PARAPET, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Setback roof core: a white-concrete penthouse on the deck, with a stone cap.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!inCore(x, z)) continue;
  g.set(x, PARAPET, z, "white_concrete");
  g.set(x, CORE_TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Roof equipment: air-handling units on open deck cells beside the core.
for (const [x, z] of [[1, 3], [9, 3]]) {
  if (has(x, z) && !isRing(x, z)) g.set(x, PARAPET, z, "iron_block");
}

// 5. Entrance: a canopy block over the door, a hanging lantern, and a dark-oak door.
const egr = clampG(ground.get(`${ex},${ez}`));
g.set(ex, egr, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, egr + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -1; dx <= 1; dx++) {
  if (has(ex + dx, ez)) g.set(ex + dx, egr + 3, ez, "stone_bricks");
}
g.set(ex, egr + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
