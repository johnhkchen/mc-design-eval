// Part 1, Ground and paths: groundColumn over the whole box from the height map, W paving and roads, paths P1-P10 and L1,
// west seam, flat B cells, mossy slab edging on lawn rises.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { groundColumn, pathRibbon, roadStrip, B_FOOTPRINTS, SITE_X, SITE_Z, MEADOW_CENTRE } from "../vocab.mjs";

const dir = fileURLToPath(new URL(".", import.meta.url));
const rows = (f) => readFileSync(dir + f, "utf8").trim().split("\n");
const HM = rows("heights.txt").map((r) => [...r].map((c) => parseInt(c, 36)));
const SM = rows("site.txt");
const mapH = (x, z) => {
  const r0 = Math.min(72, z >> 1), c0 = Math.min(42, x >> 1);
  for (let d = 0; d < 20; d++) {            // '?' (a building cell): the nearest mapped digit, searching outward
    let best = null;
    for (let r = r0 - d; r <= r0 + d; r++) for (let c = c0 - d; c <= c0 + d; c++) {
      const v = HM[r]?.[c];
      if (Number.isInteger(v) && (best === null || v > best)) best = v;
    }
    if (best !== null) return best;
  }
  return 3;
};
const site = (x, z) => SM[Math.min(72, z >> 1)][Math.min(42, x >> 1)];

const inBox = (x, z, [x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const onEdge = (x, z) => x < 2 || x > 83 || z < 2 || z > 143;

// flat B footprints: most common surrounding height (edge columns stay at map height)
const bFlat = B_FOOTPRINTS.map((b) => {
  const cnt = {};
  for (let x = b[0]; x <= b[1]; x++) for (let z = b[2]; z <= b[3]; z++) cnt[mapH(x, z)] = (cnt[mapH(x, z)] ?? 0) + 1;
  return +Object.entries(cnt).sort((a, c) => c[1] - a[1])[0][0];
});

const heightAt = (x, z) => {
  if (x < 0 || z < 0 || x > 85 || z > 145) return 3;
  if (x >= 76 && x <= 83 && z >= 46 && z <= 63) return 2;      // the parkway's cut east of the portal (v2 comment)
  if (!onEdge(x, z)) for (let i = 0; i < B_FOOTPRINTS.length; i++) if (inBox(x, z, B_FOOTPRINTS[i])) return bFlat[i];
  return mapH(x, z);
};

const gravelAt = (x, z) =>
  (x <= 20 && z >= 34 && z <= 44) || (x >= 16 && x <= 20 && z >= 24 && z <= 33) || (x <= 3 && z >= 18 && z <= 42);

function surfaceAt(x, z) {
  if (onEdge(x, z) || !B_FOOTPRINTS.some((b) => inBox(x, z, b))) {
    if (x < 2) {
      if (z >= 18 && z <= 42) return "gravel";
      if (z >= 46 && z <= 48) return "smooth_sandstone";
      return "grass_block";
    }
    if (gravelAt(x, z) && site(x, z) !== "B") return "gravel";
    if (site(x, z) === "W") return (z % 6 === 0) ? "light_gray_concrete" : "smooth_stone";
  }
  return "grass_block";
}

export function build(g) {
  for (let x = SITE_X[0]; x <= SITE_X[1]; x++)
    for (let z = SITE_Z[0]; z <= SITE_Z[1]; z++) groundColumn(g, x, z, heightAt(x, z), surfaceAt(x, z));

  // parkway apron and its road continuing east (lower W band at the east edge): two carriageways with dashed centre
  // lines, out of the two mouths, either side of the median z55..56 (yellow double line under the barrier)
  roadStrip(g, [76, 2, 46, 83, 2, 54], "x", { over: true });
  roadStrip(g, [76, 2, 57, 83, 2, 63], "x", { over: true });
  for (let z = 46; z <= 63; z++) for (let x = 84; x <= 85; x++) if (heightAt(x, z) === 2) roadStrip(g, [x, 2, z, x, 2, z], "x", { over: true });
  // the two bores under the lid (the portal part writes into air only, so the ground part leaves them open): road y2,
  // air y3..5, light_gray_concrete side walls and pier, black_concrete back wall at x65, hanging lanterns at x73
  const bore = (z) => (z >= 48 && z <= 53) || (z >= 57 && z <= 62);
  for (let x = 65; x <= 75; x++) for (let z = 47; z <= 63; z++) {
    for (let y = 3; y <= 5; y++) {
      if (!bore(z)) g.set(x, y, z, ...B.block("light_gray_concrete"));
      else if (x === 65) g.set(x, y, z, ...B.block("black_concrete"));
      else g.set(x, y, z, "air");
    }
    if (bore(z) && x > 65) g.set(x, 2, z, ...B.block("gray_concrete"));
    if (x <= 73 && heightAt(x, z) < 6) g.set(x, 6, z, ...B.block("grass_block"));   // the lid: 1 block of soil over the bore
  }
  for (const z of [49, 51, 53, 57, 59, 61]) for (const x of [73, 69]) g.set(x, 5, z, ...B.lantern(true));
  // concrete retaining walls lining the cut on its north (z45) and south (z64) sides, smooth_stone coping
  for (let x = 76; x <= 83; x++) for (const z of [45, 64]) {
    const h = heightAt(x, z);
    for (let y = 2; y < h; y++) g.set(x, y, z, ...B.block("light_gray_concrete"));
    if (h > 2) g.set(x, h, z, ...B.block("smooth_stone"));
  }
  for (let x = 76; x <= 85; x++) for (const z of [55, 56]) if (heightAt(x, z) === 2) g.set(x, 2, z, ...B.block("yellow_concrete"));

  const P = (pts, w) => pathRibbon(g, pts, w, 0.5, { heightAt });
  P([[40, 13], [39, 24], [32, 34], [22, 44], [10, 47], [0, 47]], 3);                    // P1
  P([[62, 13], [63, 28], [58, 40], [52, 50], [42, 60], [32, 67], [26, 70]], 3);          // P3
  P([[22, 44], [34, 43], [48, 43], [58, 40]], 3);                                          // P4
  P([[12, 82], [10, 90], [12, 96], [14, 100]], 2);                                         // P5
  P([[32, 77], [40, 82], [48, 87], [48, 91]], 2);                                          // P6
  P([[48, 107], [50, 112], [50, 116]], 2);                                                 // P7
  P([[52, 50], [62, 52], [66, 52]], 2);                                                    // P8
  P([[22, 84], [26, 92], [34, 98], [40, 98]], 2);                                          // P10
  P([[9, 17], [9, 14], [38, 14]], 2);                                                      // L1
  // P2 meadow ring r 9.5..11.5 round (22,73)
  const [cx, cz] = MEADOW_CENTRE;
  for (let x = cx - 12; x <= cx + 12; x++) for (let z = cz - 12; z <= cz + 12; z++) {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= 9.5 && d < 11.5) g.set(x, heightAt(x, z), z, ...B.block("smooth_sandstone"));
  }

  // lawn rises of 1: mossy_cobblestone_slab on the lower cell (not on paths, W, terraces, mound, campfire, overlook, lid)
  const skip = [[20, 58, 40, 59], [64, 76, 46, 64], [10, 36, 61, 86], [36, 60, 85, 109], [0, 46, 92, 112]];
  for (let x = 2; x <= 83; x++) for (let z = 2; z <= 143; z++) {
    if (skip.some((b) => inBox(x, z, b)) || B_FOOTPRINTS.some((b) => inBox(x, z, b)) || site(x, z) === "W" || gravelAt(x, z)) continue;
    const h = heightAt(x, z);
    if (g.blockAt(x, h, z) !== "grass_block" && !String(g.blockAt(x, h, z)).includes("grass_block")) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => heightAt(x + dx, z + dz) === h + 1))
      g.set(x, h + 1, z, ...B.slab("mossy_cobblestone", "bottom"));
  }
}
