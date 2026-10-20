// Galleries (P5, plot 2): the three low dark galleries G1 (main), G2 (north entrance wing), G3 (south café step).
// Shells from galleryFace, the glass entrance under the canopy, the CHIHULY sign band, slot windows, partitions,
// green roofs with planting, and the two glass door sculptures. Every write stays on plot 2 (x 253..296, z 0..104).
import {
  galleryFace, gallerySlotWindow, canopySlab, signBand, greenRoofPatch, glassBlossom, doorPair,
} from "../vocab.mjs";

const GRAY = "gray_concrete";
const DEEP = "deepslate_tiles";
const POLISHED_DEEP = "polished_deepslate";
const MOSS = "moss_block";

/** Set every cell of a box to one block (inclusive corners). */
function fill(g, [x0, y0, z0], [x1, y1, z1], block, state) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, block, state);
}

/** Clear a box to air (our own cells: carving an opening before the helper that fills it). */
function carve(g, a, b) {
  fill(g, a, b, "air");
}

/** Low café shell (G3): plinth y1-2, gray walls y3-7, parapet y8-9, coping slab y10, moss deck y9 inside. */
function lowShell(g, { x0, z0, x1, z1 }) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const ring = x - x0 < 2 || x1 - x < 2 || z - z0 < 2 || z1 - z < 2;
      if (!ring) {
        g.set(x, 9, z, MOSS);
        continue;
      }
      for (let y = 1; y <= 9; y++) {
        const block = y <= 2 ? DEEP : y <= 7 ? GRAY : DEEP;
        g.set(x, y, z, block);
      }
      g.set(x, 10, z, POLISHED_DEEP + "_slab", { type: "bottom" });
    }
  }
}

export function build(g) {
  // ---- G1 main gallery: x 257..296, z 12..91, one tall storey (walls y1..14) ----------------------------------------
  const G1A = { x0: 257, z0: 12, x1: 296, z1: 91 };
  galleryFace(g, { ...G1A, face: "west" });
  galleryFace(g, { ...G1A, face: "east" });
  galleryFace(g, { ...G1A, face: "north" });
  galleryFace(g, { ...G1A, face: "south" });
  // flat green roof: moss deck over the interior, grass and azalea planting on top (the parapet ring is the wall)
  fill(g, [259, 12, 14], [294, 12, 89], MOSS);
  greenRoofPatch(g, { x0: 259, z0: 14, x1: 294, z1: 89, y: 13 });

  // the wing G1b: x 257..292, z 8..11, joins G2 to the gallery
  const G1B = { x0: 257, z0: 8, x1: 292, z1: 11 };
  galleryFace(g, { ...G1B, face: "west" });
  galleryFace(g, { ...G1B, face: "east" });
  fill(g, [259, 12, 8], [290, 12, 11], MOSS);
  greenRoofPatch(g, { x0: 259, z0: 8, x1: 290, z1: 11, y: 13 });

  // G2 north entrance wing: x 253..292, z 0..7
  const G2 = { x0: 253, z0: 0, x1: 292, z1: 7 };
  galleryFace(g, { ...G2, face: "west" });
  galleryFace(g, { ...G2, face: "east" });
  galleryFace(g, { ...G2, face: "north" });
  fill(g, [255, 12, 2], [290, 12, 7], MOSS);
  greenRoofPatch(g, { x0: 255, z0: 2, x1: 290, z1: 7, y: 13 });

  // the entrance recess x 263..282, z 0..3: air under the canopy, the sign band above it
  carve(g, [263, 1, 0], [282, 6, 3]);
  carve(g, [263, 7, 0], [282, 11, 1]);
  canopySlab(g, { x0: 263, z0: 0, x1: 282, z1: 3, y: 7 });
  // the canopy's downlights hang from the slab as lanterns (a sea_lantern there has nothing to stand on)
  for (let x = 265; x <= 282; x += 4) g.set(x, 6, 2, "lantern", { hanging: "true" });
  signBand(g, { x0: 263, x1: 282, z: 1, y0: 8, y1: 11, text: "CHIHULY", face: "north" });

  // glass entrance wall at z 4 with stone mullions every 4 x; three double birch doors at x 270..275
  carve(g, [270, 1, 4], [275, 3, 4]);
  for (let x = 263; x <= 282; x++) {
    for (let y = 1; y <= 6; y++) {
      if (x >= 270 && x <= 275 && y <= 3) continue;
      if ((x - 263) % 4 === 0) g.set(x, y, 4, "smooth_stone");
      else g.set(x, y, 4, "glass_pane", { north: "false", south: "false", east: "true", west: "true" });
    }
  }
  for (const x of [270, 272, 274]) doorPair(g, { x, z: 4, face: "north", width: 2 });

  // door sculptures under the canopy: stained-glass columns with end rods
  glassBlossom(g, { x: 264, z: 1, h: 4, colors: ["red", "orange"] });
  glassBlossom(g, { x: 281, z: 1, h: 3, colors: ["yellow", "red"] });

  // the lobby doorway into the main gallery: a 4-wide opening through the north wall (z 12..13), as the partitions
  carve(g, [274, 1, 12], [277, 3, 13]);

  // interior partitions, 1 thick, with a 4-wide doorway at x 274..277
  for (const z of [30, 60]) {
    fill(g, [259, 1, z], [294, 11, z], GRAY);
    carve(g, [274, 1, z], [277, 3, z]);
  }

  // slot windows: one per 20 z on the west and east walls, glass set one block in (x 258 west, x 295 east)
  for (const z of [20, 36, 52, 68, 84]) {
    carve(g, [257, 3, z], [257, 9, z]);
    carve(g, [258, 3, z], [258, 9, z]);
    gallerySlotWindow(g, { x: 257, z });
    carve(g, [296, 3, z], [296, 9, z]);
    carve(g, [295, 3, z], [295, 9, z]);
    gallerySlotWindow(g, { x: 296, z });
  }

  // ---- G3 south café step: x 261..296 / 269..296 low shells, z 92..103 ----------------------------------------------
  lowShell(g, { x0: 261, z0: 92, x1: 296, z1: 95 });
  lowShell(g, { x0: 269, z0: 96, x1: 296, z1: 103 });
  // south café door: z 103, x 280..283, two double doors
  carve(g, [280, 1, 102], [283, 3, 103]);
  for (const x of [280, 282]) doorPair(g, { x, z: 103, face: "south", width: 2 });
  greenRoofPatch(g, { x0: 271, z0: 98, x1: 294, z1: 101, y: 10 });
}
