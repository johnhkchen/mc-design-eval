// P5 BACK AND GARDEN (plan.md OPENINGS back z30 + lightwell x3, DECK, OUTDOOR; ticks E15, E24, E28, E29, E32).
// Glazing and doors fill the shell's back and lightwell openings; the deck takes air only. Ground cells (patio, path,
// beds, border) are grass from build.mjs, so they are set directly rather than put.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  BACK_FACE_Z, door, deckRail, deckTable, bench, lampPost, citrusTree, vegBed, gardenBed,
  VEG_BED, VEG_WATER, POLISHED_ANDESITE, BRICKS, SPRUCE_PLANKS, POTTED_FERN, POTTED_RED_TULIP,
  LILAC, ROSE_BUSH, PEONY, FERN, LARGE_FERN,
} from "../vocab.mjs";

const AIR = ["minecraft:air", "minecraft:cave_air"];
const isAir = (g, x, y, z) => AIR.includes(g.blockAt(x, y, z));
// Air only: a cell an earlier part already owns is skipped, as in vocab.mjs.
const put = (g, x, y, z, block, state) => { if (isAir(g, x, y, z)) g.set(x, y, z, block, state); };
const sill = (g, x, y, z) => put(g, x, y, z, ...B.slab("smooth_quartz", "top"));
// A 1-wide, 3-tall pane run at x, yb..yb+2 on plane z.
const glaze = (g, x, yb, z) => { for (let y = yb; y <= yb + 2; y++) put(g, x, y, z, ...B.pane()); };

// Back windows on z30 (no hood): [x, yb].
const BACK_WINDOWS = [[4, 5], [10, 5], [4, 9], [7, 9], [10, 9], [5, 13], [9, 13]];
const BASE_WINDOWS = [4, 10];
const PLANT_KINDS = [LILAC, ROSE_BUSH, PEONY, FERN, LARGE_FERN];

export function build(g) {
  // ---- back glazing (E15): tall panes on z30. Only the main-floor windows get a sill (on the deck, so it is supported);
  // the upper sills would hang in the air over the garden and read as orphans.
  for (const [x, yb] of BACK_WINDOWS) {
    glaze(g, x, yb, BACK_FACE_Z);
    if (yb === 5) sill(g, x, yb - 1, BACK_FACE_Z + 1);
  }
  // base windows sit under the deck: one pane, sill out on the patio
  for (const x of BASE_WINDOWS) {
    put(g, x, 2, BACK_FACE_Z, ...B.pane());
    sill(g, x, 1, BACK_FACE_Z + 1);
  }

  // ---- back doors (E24 kitchen, E32 laundry): crimson door with a transom, birch door at the base
  door(g, 7, 5, BACK_FACE_Z, "south", "left", "crimson");
  put(g, 7, 7, BACK_FACE_Z, ...B.pane());
  door(g, 7, 1, BACK_FACE_Z, "south", "left", "birch");

  // ---- lightwell glazing (x3): panes only, no sills (the lightwell floor is solid only at y4; upper sills would float)
  for (const [z, yb] of [[20, 5], [22, 5], [21, 13]]) for (let y = yb; y <= yb + 2; y++) put(g, 3, y, z, ...B.pane());
  put(g, 3, 10, 21, ...B.pane());
  put(g, 3, 11, 21, ...B.pane());

  // ---- under-deck patio (y0), then the posts that stand in it
  for (let x = 2; x <= 13; x++) for (let z = 31; z <= 38; z++) g.set(x, 0, z, POLISHED_ANDESITE);
  for (const x of [2, 6, 10]) for (let y = 0; y <= 3; y++) g.set(x, y, 35, ...B.log("spruce", "y"));

  // ---- deck (E28): floor y4 (the sills above keep their cells), stair down to the patio, rail, lanterns, table, pots
  for (let x = 2; x <= 13; x++) for (let z = 31; z <= 35; z++) put(g, x, 4, z, SPRUCE_PLANKS);
  // stair flight climbs north from the patio, x11..13: one riser per row, stringers under each riser
  for (const x of [11, 12, 13]) {
    put(g, x, 1, 38, ...B.stairs("spruce", "north", "bottom"));
    put(g, x, 2, 37, ...B.stairs("spruce", "north", "bottom"));
    put(g, x, 3, 36, ...B.stairs("spruce", "north", "bottom"));
    for (const [y, z] of [[1, 37], [1, 36], [2, 36]]) put(g, x, y, z, SPRUCE_PLANKS);
  }
  const rail = [];
  for (let z = 31; z <= 35; z++) rail.push([2, z]);
  for (let x = 3; x <= 10; x++) rail.push([x, 35]);
  for (let z = 31; z <= 34; z++) rail.push([13, z]);
  deckRail(g, rail);
  put(g, 2, 6, 35, ...B.lantern(false));
  put(g, 13, 6, 31, ...B.lantern(false));
  deckTable(g, 5, 33);
  put(g, 3, 5, 31, POTTED_FERN);
  put(g, 9, 5, 31, POTTED_FERN);
  put(g, 12, 5, 31, POTTED_RED_TULIP);

  // ---- garden: lamp post and citrus first (their cells are not in the bed), then the bed, bench and path
  lampPost(g, 9, 46);
  citrusTree(g, 4, 44);
  for (let x = 6; x <= 8; x++) for (let z = 39; z <= 47; z++) g.set(x, 0, z, BRICKS);
  const border = [];
  let kind = 0;
  for (let z = 39; z <= 48; z++) for (let x = 1; x <= 2; x++) border.push([x, z, PLANT_KINDS[kind++ % PLANT_KINDS.length]]);
  gardenBed(g, [1, 0, 39, 2, 0, 48], border);
  vegBed(g, VEG_BED, VEG_WATER);
  bench(g, 6, 8, 48);

  // ---- back and side fences, y1..2
  for (let z = 31; z <= 48; z++) for (const x of [0, 15]) for (const y of [1, 2]) put(g, x, y, z, ...B.fence("spruce"));
  for (let x = 0; x <= 15; x++) for (const y of [1, 2]) put(g, x, y, 49, ...B.fence("spruce"));
}
