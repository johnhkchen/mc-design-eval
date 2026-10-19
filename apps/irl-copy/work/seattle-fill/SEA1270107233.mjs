// SEA1270107233: west edge of a long three-storey mixed-use block along 5th Ave N (box 6 x 155, cut by the place's east edge).
// Only the west facade (local x=0) and the roof are seen; the east and end walls are plain.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const ID = "SEA1270107233";
const X0 = 498, Z0 = 199;
const man = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = man.buildings.find((q) => q.id === ID);
const S = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const W = 6, D = 155, H = 16;
const has = (x, z) => S.has(`${x},${z}`);
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, st) => g.set(x, y, z, id, st);

const sec = (u) => (Math.floor(u / 27) % 2 === 0 ? "bricks" : "smooth_sandstone");   // brick / cream stucco sections
const AWN = ["red_terracotta", "green_terracotta", "blue_terracotta"];   // muted awnings
const BAND = "gray_concrete";                                              // single dark sign band
const accent = (u) => false;                                                        // accent bands removed (fix round)
const DOOR = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

// 1. foundation, floors, roof membrane under the whole footprint
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  put(x, 0, z, "stone_bricks"); put(x, 1, z, "stone_bricks");
  put(x, 4, z, "smooth_stone"); put(x, 7, z, "smooth_stone");
  put(x, 10, z, "stone");
}

// 2. walls on exterior cells (4-neighbour outside footprint)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  const isW = !has(x - 1, z), isE = !has(x + 1, z), isN = !has(x, z - 1), isS = !has(x, z + 1);
  if (!(isW || isE || isN || isS)) continue;
  if (isW) { facade(x, z); continue; }
  // plain east and end walls
  put(x, 1, z, "polished_granite");
  for (let y = 2; y <= 9; y++) put(x, y, z, sec(z));
  put(x, 10, z, z % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
  put(x, 11, z, "stone_bricks");
}

function facade(x, z) {
  const u = z, k = Math.floor(u / 12), gap = k % 4 === 3;
  const pil = u % 8 === 0, mull = u % 8 === 4;
  const acc = accent(u), ACC = "green_glazed_terracotta";
  const pilMat = acc ? ACC : sec(u);
  const glassX = has(x + 1, z) ? x + 1 : x;               // windows are recessed one block, glass behind
  put(x, 1, z, "polished_granite");
  // storefront, y 2-3
  for (const y of [2, 3]) {
    if (pil) put(x, y, z, pilMat);
    else if (gap) put(x, y, z, "bricks");                 // brick pier gap
    else if (u === 12 * k + 1 && k % 3 === 0 && !gap) {    // entrance door
      put(x, y, z, k === 9 ? "spruce_door" : "oak_door", DOOR(y === 2 ? "lower" : "upper"));
    } else put(x, y, z, "glass");
  }
  // awning / sign band, y 4
  const doorBay = !gap && k % 3 === 0 && (k === 0 || k === 6 || k === 9 || k === 12);
  if (pil) put(x, 4, z, pilMat);
  else if (doorBay && u - 12 * k <= 2) put(x, 4, z, AWN[(k + 1) % AWN.length]);   // short plaque over the shop door
  else if (gap) put(x, 4, z, BAND);
  else put(x, 4, z, AWN[k % AWN.length]);
  // windows, y 5-6 and 8-9 (mullion every 8, pilaster every 8)
  for (const [y0, y1] of [[5, 6], [8, 9]]) for (const y of [y0, y1]) {
    if (pil) put(x, y, z, pilMat);
    else if (mull) put(x, y, z, acc ? ACC : "polished_andesite");
    else put(glassX, y, z, "glass");                       // recess: plane cell left air, glass behind
  }
  // sign band, y 7
  if (pil) put(x, 7, z, pilMat);
  else put(x, 7, z, BAND);
  // cornice and parapet
  put(x, 10, z, u % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
  put(x, 11, z, "stone_bricks");
}

// 3. roof: skylights (glass in the membrane), HVAC boxes and vent stacks on the roof
const inside = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
for (const [a, c] of [[34, 36], [74, 76], [104, 106], [144, 145]])
  for (let z = a; z <= c; z++) for (const x of [2, 3]) if (inside(x, z)) put(x, 10, z, "glass");
for (const [a, c] of [[18, 19], [58, 59], [88, 89], [132, 133]])
  for (let z = a; z <= c; z++) for (const x of [2, 3]) if (inside(x, z)) {
    put(x, 11, z, "light_gray_concrete"); put(x, 12, z, z === a ? "iron_block" : "light_gray_concrete");
  }
for (const z of [30, 70, 100, 140]) if (inside(4, z)) { put(4, 11, z, "iron_block"); put(4, 12, z, "iron_bars"); put(4, 13, z, "iron_bars"); }

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270107233.nbt");
console.log("size", g.size, "blocks", g.count(), "footprint cells", S.size);
