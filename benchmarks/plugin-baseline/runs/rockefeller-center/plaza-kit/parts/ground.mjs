// Ground: both plots' terrain, street, sidewalks, promenade and Channel Gardens walks.
import { groundColumn, roadStrip, crosswalk, halfStep, PLOT1_LEVELS } from "../vocab.mjs";
import { WALK_BANDS, isSoil, isPoolWater } from "./garden-layout.mjs";

const M0 = `
5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 4 4 5 5 5 5 5 5
5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 4 4 4 4 4 5 5 5 5 5 4
5 5 5 5 5 5 5 5 5 5 5 5 4 5 4 4 4 4 4 4 4 5 5 4 4 4
5 5 5 5 5 5 5 5 5 5 5 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
5 5 5 5 5 5 5 5 5 5 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
5 5 5 5 5 5 5 5 5 4 2 2 1 2 2 2 2 2 2 2 2 2 2 4 4 4
5 5 5 5 5 5 5 5 5 4 1 0 0 0 0 0 0 0 0 0 0 0 1 4 4 4
5 5 5 4 4 5 5 5 5 5 1 0 0 0 0 0 0 0 0 0 0 0 1 4 4 4
5 5 5 5 4 5 5 5 5 5 1 0 0 0 0 0 0 0 0 0 0 0 1 4 4 4
5 5 4 5 4 5 5 5 5 5 1 0 0 0 0 0 0 0 0 0 0 0 1 4 4 4
4 4 4 4 4 4 4 5 5 4 1 0 0 0 0 0 0 0 0 0 0 1 1 4 4 4
5 4 4 4 4 5 4 5 5 3 1 1 0 0 0 0 0 0 0 0 0 1 2 3 4 4
5 4 4 4 4 4 5 5 5 3 2 1 0 0 0 0 0 0 0 0 0 1 2 3 4 4
4 4 4 4 4 4 4 5 5 3 2 1 0 0 0 0 0 0 0 0 0 1 2 3 4 4
4 4 4 4 4 4 4 5 5 3 2 1 0 0 0 0 0 0 0 0 0 1 2 3 3 4
4 4 4 4 4 4 4 5 5 3 2 1 0 0 0 0 0 0 0 0 0 1 2 3 4 4
4 4 4 4 4 4 4 5 5 3 1 1 0 0 0 0 0 0 0 0 0 1 1 4 4 4
4 4 4 4 4 4 4 5 5 2 1 0 0 0 0 0 0 0 0 0 0 1 1 4 4 4
4 4 4 4 4 4 4 4 4 1 0 0 0 0 0 0 0 0 0 0 0 0 0 4 4 4
4 4 4 4 4 4 4 4 5 2 0 0 0 0 0 0 0 0 0 0 0 0 0 4 4 4
4 4 4 4 4 4 4 4 4 2 0 0 0 0 0 0 0 0 0 0 0 0 0 4 4 4
4 4 4 4 4 4 4 4 4 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4 4 4
4 4 4 4 4 4 4 4 4 4 2 2 4 2 2 2 2 0 2 2 2 4 2 4 4 4
4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
4 4 4 4 4 4 4 4 4 4 4 4 4 5 4 4 4 5 5 4 4 5 5 4 4 4
4 4 4 4 4 4 4 4 4 4 4 5 5 5 4 4 4 5 5 5 5 5 5 4 4 4`.trim().split("\n").map((r) => r.trim().split(/\s+/).map(Number));
const map0 = (x, z) => M0[Math.min(26, z >> 1)][Math.min(25, x >> 1)];
const inBox = (x, z, a, b, c, d) => x >= a && x <= b && z >= c && z <= d;

function plot0(g) {
  const roadY = (z) => (z <= 19 ? 5 : 4);
  for (let z = 0; z <= 53; z++) for (let x = 4; x <= 12; x++) g.fill([x, 0, z], [x, roadY(z) - 1, z], "stone");
  roadStrip(g, 4, 12, 0, 19, 5);
  roadStrip(g, 4, 12, 20, 53, 4);
  for (let x = 5; x <= 11; x++) for (const z of [20, 21]) halfStep(g, x, z, 5, { material: "smooth_stone" });
  crosswalk(g, 2, 4);
  crosswalk(g, 49, 51);

  for (let z = 0; z <= 53; z++) for (let x = 0; x <= 50; x++) {
    if (x >= 4 && x <= 12) continue;
    if (inBox(x, z, 18, 19, 18, 37)) continue; // Prometheus wall: its own part
    if (inBox(x, z, 20, 45, 10, 45)) {
      // the well: perimeter left air for the well walls, floor y0 inside, rink ice and steps reserved
      if (inBox(x, z, 20, 22, 20, 35)) { groundColumn(g, x, z, 0); continue; }
      if (!inBox(x, z, 21, 44, 11, 44)) continue;
      if (inBox(x, z, 24, 39, 14, 41) || inBox(x, z, 42, 45, 19, 34)) continue;
      groundColumn(g, x, z, 0);
      continue;
    }
    if (inBox(x, z, 42, 47, 20, 33)) continue; // steps
    if (inBox(x, z, 22, 43, 4, 8) || inBox(x, z, 22, 43, 47, 50)) {
      // restaurant strip: floor y0 stone, air above, ceiling at y4 is the promenade slab
      g.set(x, 0, z, "stone");
      g.set(x, 4, z, "smooth_stone");
      continue;
    }
    if (inBox(x, z, 22, 43, 3, 3) || inBox(x, z, 22, 43, 51, 51) || inBox(x, z, 22, 22, 3, 9) || inBox(x, z, 43, 43, 3, 9) || inBox(x, z, 22, 22, 46, 51) || inBox(x, z, 43, 43, 46, 51)) {
      groundColumn(g, x, z, 4, { surface: "smooth_stone" });
      continue;
    }
    const h = map0(x, z);
    let surface;
    if (x <= 16) surface = z % 4 === 0 ? "smooth_stone" : "polished_andesite";
    else surface = x === 17 || x === 50 || z === 0 || z === 53 || x % 6 === 5 || z % 6 === 5 ? "polished_andesite" : "smooth_stone";
    groundColumn(g, x, z, h, { surface });
  }
}

// z 14..15 edge rows follow the lidar map exactly
const edgeRow = (x) => { const c = (x - 55) >> 1; return c < 11 ? 0 : c < 23 ? 1 : 2; };

function plot1(g) {
  const level = (x) => PLOT1_LEVELS.find((l) => x >= l.x0 && x <= l.x1).g;
  for (let x = 55; x <= 108; x++) for (let z = 0; z <= 15; z++) {
    const h = z >= 14 ? edgeRow(x) : level(x);
    // soil under the planters, prismarine floor under the pool water, pale walk elsewhere with andesite cross bands
    let surface = WALK_BANDS.includes(x) ? "polished_andesite" : "smooth_stone";
    if (isSoil(x, z)) surface = (x * 7 + z * 3) % 5 < 2 ? "moss_block" : "grass_block";
    else if (isPoolWater(x, z)) surface = "prismarine_bricks";
    groundColumn(g, x, z, h, { surface });
  }
  for (const [xs, y] of [[[73, 74], 1], [[97, 98], 2]]) for (const x of xs) for (let z = 0; z <= 15; z++) halfStep(g, x, z, y, { overwrite: false });
  // the south edge rows (z 14..15) keep the lidar's lower ground where the terraces have already stepped up: a half step
  // on them (x 75..76 and 99..100) so the walk climbs in half blocks, never a full raw step
  for (const [xs, y] of [[[75, 76], 1], [[99, 100], 2]]) for (const x of xs) for (const z of [14, 15]) halfStep(g, x, z, y, { material: "smooth_stone", overwrite: false });
}

export function build(g) {
  plot0(g);
  plot1(g);
}
