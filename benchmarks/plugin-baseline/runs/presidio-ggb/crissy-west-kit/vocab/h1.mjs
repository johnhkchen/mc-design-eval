// Helpers from plan.md VOCABULARY: wallBox, leanTo, shutter, arcade, cupola, lawn, lampPost.
// Every helper takes its position as arguments (row coordinates), writes only its own footprint, and writes only
// into air. A cell that is already filled (ground, an earlier part's wall or roof) is refused, not overwritten:
// the call returns { placed, refused } where refused lists [x, y, z, block] for each cell it left alone.
// The lawn is the one helper that writes into ground: it turns the plot's smooth_stone at its y into grass.
import { B, face, shutter as toolkitShutter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const out = () => ({ placed: 0, refused: [] });

// one cell, air only: true when the write may go ahead; a filled or out-of-bounds cell is recorded as refused
function free(g, res, [x, y, z], block) {
  if (g.inBounds(x, y, z) && g.isAir(x, y, z)) return true;
  res.refused.push([x, y, z, block]);
  return false;
}
function place(g, res, pos, block, state) {
  if (!free(g, res, pos, block)) return;
  g.set(...pos, block, state);
  res.placed++;
}
// the family name B.stairs takes ("stone_brick_stairs" -> "stone_brick"); a bare family name passes through
const family = (m) => m.replace(/_stairs$/, "");

/**
 * Hollow wall shell on the rect [x0, z0, x1, z1] from y0 up to y1 (both included): the perimeter only, no floor, no
 * roof. plinthMat, when given, is the bottom course (y0): the plinth row. Openings are cut later, as air.
 */
export function wallBox(g, [x0, z0, x1, z1], y0, y1, mat, plinthMat) {
  const res = out();
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
        place(g, res, [x, y, z], y === y0 && plinthMat ? plinthMat : mat);
      }
  return res;
}

/**
 * One course of bottom stairs over the rect [x0, z0, x1, z1] at height y. dir is the way the roof falls ("west" for a
 * lean-to that is sloping west, as in plan.md); its stairs face up the slope, toward the hall (the opposite of dir).
 * The outer row (the low edge) is edgeMat's stairs, the rest stairMat's.
 */
export function leanTo(g, [x0, z0, x1, z1], y, dir, stairMat, edgeMat) {
  if (!["north", "south", "east", "west"].includes(dir)) throw new Error(`leanTo: dir must be north|south|east|west, got ${dir}`);
  const res = out();
  const up = face.opposite(dir);
  const onLowEdge = (x, z) => ({ west: x === x0, east: x === x1, north: z === z0, south: z === z1 })[dir];
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const stairs = onLowEdge(x, z) ? edgeMat : stairMat;
      place(g, res, [x, y, z], ...B.stairs(family(stairs), up, "bottom"));
    }
  return res;
}

/**
 * A window shutter: open trapdoor (default warped) lying flat on the wall, on the cell at [x, y, z] (the bottom cell),
 * `height` cells up. wallFace is the way the wall looks. plot: [x0, z0, x1, z1]; a cell outside it is skipped.
 */
export function shutter(g, [x, y, z], wallFace, wood = "warped", { height = 1, plot } = {}) {
  const res = out();
  for (let i = 0; i < height; i++) {
    const pos = [x, y + i, z];
    if (plot && (x < plot[0] || x > plot[2] || z < plot[1] || z > plot[3])) {
      res.refused.push([...pos, `${wood}_trapdoor`, "outside plot"]);
      continue;
    }
    if (!free(g, res, pos, `${wood}_trapdoor`)) continue;
    toolkitShutter(g, pos, wallFace, wood);
    res.placed++;
  }
  return res;
}

/**
 * Mission arcade along the row z from x0 to x1, base y: piers of smooth_sandstone at y and y+1, and over each 2-wide bay
 * an arch of upside-down smooth_sandstone_stairs at y+2 facing each other. Bays start one cell in from x0 and repeat
 * every 3; a cell in no full bay is a pier, so x0..x1 = 39..46 gives piers 39, 42, 45, 46 and bays 40-41, 43-44.
 */
export function arcade(g, x0, x1, z, y) {
  const res = out();
  const bayStarts = new Set();                              // first x of each full 2-wide bay
  for (let b = x0 + 1; b + 1 <= x1; b += 3) bayStarts.add(b);
  for (let x = x0; x <= x1; x++) {
    const bay = bayStarts.has(x) ? x : bayStarts.has(x - 1) ? x - 1 : null;
    if (bay === null) {
      place(g, res, [x, y, z], "smooth_sandstone");
      place(g, res, [x, y + 1, z], "smooth_sandstone");
    } else {
      place(g, res, [x, y + 2, z], ...B.stairs("smooth_sandstone", x === bay ? "east" : "west", "top"));
    }
  }
  return res;
}

/**
 * Lookout cupola on the 2x2 footprint [x0..x0+1, z0..z0+1]: quartz_block base at y0, glass_pane (connected to its
 * neighbours in the footprint) at y0+1, dark_prismarine_slab cap at y0+2, lightning_rod at [x0, y0+3, z0].
 * plan.md: cupola([125, 6], 7) is the coast guard's.
 */
export function cupola(g, [x0, z0], y0 = 7) {
  const res = out();
  for (let x = x0; x <= x0 + 1; x++)
    for (let z = z0; z <= z0 + 1; z++) {
      place(g, res, [x, y0, z], "quartz_block");
      place(g, res, [x, y0 + 1, z], "glass_pane", {
        north: z - 1 >= z0, south: z + 1 <= z0 + 1, west: x - 1 >= x0, east: x + 1 <= x0 + 1,
      });
      place(g, res, [x, y0 + 2, z], ...B.slab("dark_prismarine", "bottom"));
    }
  place(g, res, [x0, y0 + 3, z0], "lightning_rod", { facing: "up", powered: "false" });
  return res;
}

/**
 * Lawn on the rect [x0, z0, x1, z1] at ground height y (default 0): grass_block replaces the smooth_stone there (or air).
 * Any other block at y is left alone and reported in refused.
 */
export function lawn(g, [x0, z0, x1, z1], y = 0) {
  const res = out();
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const b = g.blockAt(x, y, z);
      if (b === "minecraft:air" || b === "minecraft:smooth_stone") {
        g.set(x, y, z, "grass_block");
        res.placed++;
      } else res.refused.push([x, y, z, b]);
    }
  return res;
}

/** Lamp post on the lawn at [x, z]: spruce_fence posts at y..y+2 with a standing lantern on top at y+3 (y default 1). */
export function lampPost(g, x, z, y = 1) {
  const res = out();
  for (let i = 0; i < 3; i++) place(g, res, [x, y + i, z], ...B.fence("spruce"));
  place(g, res, [x, y + 3, z], ...B.lantern(false));
  return res;
}
