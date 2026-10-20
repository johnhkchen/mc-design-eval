// Part 2: North shell, shed frame, arcade floor (plan.md MASSES A, B1, B2, S frame; FLOORS; OPENINGS; RAMP_Z).
// Writes: footings and floors of A, B1, S; the west walls of A (x29) and B1 (x29); B2's walls and two floors; the green
// posts of A (x33), B1 (x40) and S (x40) with their head beams; the slab ramps at z132/133, 188/189, 279/280.
// Openings left air: the A west windows (y21..22), the B2 shopfront band (y21..23) and window rows (y28..30).
import { post_bay, ramp } from "../vocab.mjs";

// plan.md GROUND map: ground height above y 0 per 7x7 cell. One row per z band of 7 (row r = z r*7..r*7+6), one column
// per x band of 7 (column c = x c*7..c*7+6). '.' = off the plot. Replaces base.mjs's placeholder groundY for this part.
const GROUND_ROWS = [
  ". . . 13 18 18 .", ". . . 13 17 18 .", ". . . 13 17 18 .", ". . . 13 17 18 .", ". . . 14 17 18 .",
  ". . . 14 18 19 .", ". . . 14 18 19 .", ". . . 14 18 19 .", ". . . 15 18 19 .", ". . . 15 18 19 .",
  ". . . 14 18 19 .", ". . . 13 17 19 .", ". . . 12 17 19 .", ". . . 11 17 19 .", ". . . 11 16 19 .",
  ". . . . 16 19 .", ". . . . 16 20 .", ". . . . 16 19 .", ". . . . 16 19 .", ". . . . 15 20 .",
  ". . . . 16 20 .", ". . . 7 16 20 .", ". . . 7 15 20 .", ". . . 8 15 20 .", ". . 5 10 16 20 .",
  ". . 5 10 16 21 .", ". . 6 11 16 20 .", ". . 7 12 17 20 .", ". 3 7 12 17 21 .", ". 3 8 12 17 21 .",
  ". 3 8 13 17 20 .", ". 4 8 13 17 22 .", ". 4 9 13 17 21 .", "2 5 9 13 18 21 .", "2 5 10 14 18 21 .",
  "2 6 10 14 18 21 .", "3 7 10 14 18 21 .", "4 7 11 14 18 22 .", "4 8 11 15 18 22 .", "5 8 12 15 19 22 .",
  "5 9 12 15 19 22 .", "6 9 12 16 19 22 .", "6 9 12 16 19 23 23", "7 10 12 16 19 23 23", "7 10 12 15 19 23 23",
].map((row) => row.split(" ").map((v) => (v === "." ? null : Number(v))));

const groundAt = (x, z) => GROUND_ROWS[Math.floor(z / 7)]?.[Math.floor(x / 7)] ?? null;

// Solid run of one block, inclusive, every cell written through g.set (earlier parts' cells are refused by runParts).
const box = (g, x0, y0, z0, x1, y1, z1, block) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, block, {});
};

// Footing: masonry from each cell's ground - 2 up to just under the floor, so nothing floats (plan.md SITE rule).
const footing = (g, x0, x1, z0, z1, floor, block = "stone_bricks") => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const G = groundAt(x, z);
    if (G === null) throw new Error(`shell-north: no ground at ${x},${z}`);
    for (let y = G - 2; y < floor; y++) g.set(x, y, z, block, {});
  }
};

// v2: the ground just west of the North Arcade (the 7x7 column x 21..27, lower than the plot's own x 28..34 column):
// the west face x 28 is building down to it. Where the map has no value there, interpolate between the known rows.
const westGround = (z) => {
  const r = Math.floor(z / 7), v = GROUND_ROWS[r]?.[3];
  if (v != null) return v;
  return Math.round(11 + ((7 - 11) * (r - 14)) / (21 - 14));
};
const FENCE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
// The west face of the North Arcade plinth (x 28, z0..z1, up to floor-1): cobbled_deepslate from the neighbouring ground
// - 2 to its ground + 1, white-painted brick above, a grey storey line (upside-down stone brick stairs) at y 8 and 13, and
// 2 x 3 windows (z 2+4k..3+4k) on each storey that clears the ground, lit by an ochre_froglight just inside (x 29).
const lowerWestFace = (g, z0, z1, floor) => {
  for (let z = z0; z <= z1; z++) {
    const nb = westGround(z), win = ((z - 2) % 4 + 4) % 4 < 2;
    for (let y = nb - 2; y < floor; y++) {
      const lvl = y > 13 ? 13 : y > 8 ? 8 : null;
      if (win && lvl !== null && y <= lvl + 3 && lvl + 1 > nb + 1 && y >= lvl + 1) {
        g.set(28, y, z, "glass_pane", FENCE);
        const lit = Math.floor(z / 4) % 5 !== 3;
        g.set(29, y, z, lit && y === lvl + 2 ? "ochre_froglight" : "dark_oak_planks", lit && y === lvl + 2 ? { axis: "y" } : {});
        continue;
      }
      if (y <= nb + 1) g.set(28, y, z, "cobbled_deepslate", {});
      else if ((y === 8 || y === 13) && y > nb + 1) g.set(28, y, z, "stone_brick_stairs", { facing: "east", half: "top", shape: "straight", waterlogged: "false" });
      else g.set(28, y, z, "quartz_bricks", {});
    }
  }
};

// Mass A: the North Arcade shed, floor 19, walls x29, posts x33 every 4 along z.
function buildA(g) {
  footing(g, 28, 34, 0, 132, 19);
  lowerWestFace(g, 0, 132, 19);
  box(g, 28, 19, 0, 33, 19, 132, "polished_andesite");
  box(g, 34, 19, 0, 34, 19, 132, "smooth_stone");
  // v2: the west side is open too (a covered market on posts): green posts on x 29 every 4 from z 1 with a head beam at
  // y 25, and a dark oak rail at y 20 between them along the bluff edge
  for (let z = 1; z <= 129; z += 4) post_bay(g, { x: 29, z, y0: 20, h: 5, beamY: 25, beamZ: [z, Math.min(z + 3, 132)] });
  for (let z = 0; z <= 132; z++) if (g.isAir(29, 20, z)) g.set(29, 20, z, "dark_oak_fence", FENCE);
  // green posts on the street line x33, every 4 cells from z1, head beam y25 running on to the next post
  for (let z = 1; z <= 129; z += 4) post_bay(g, { x: 33, z, y0: 20, h: 5, beamY: 25, beamZ: [z, Math.min(z + 3, 132)] });
}

// Mass B1: the North Arcade hall, floor 20, walls x29, posts x40 every 4 along z.
function buildB1(g) {
  footing(g, 28, 41, 133, 160, 20);
  lowerWestFace(g, 133, 160, 20);
  box(g, 28, 20, 133, 40, 20, 160, "polished_andesite");
  box(g, 41, 20, 133, 41, 20, 160, "smooth_stone");
  box(g, 29, 21, 133, 29, 26, 160, "quartz_bricks");
  for (let z = 133; z <= 157; z += 4) post_bay(g, { x: 40, z, y0: 21, h: 6, beamY: 27, beamZ: [z, Math.min(z + 3, 160)] });
}

// Mass B2: the upper market building, north: walls x22 and x33 to y31 (floors 20 and 26), end walls at z161 and z188.
// The shopfront band y21..23 on the east wall and the window rows y28..30 are left as air.
function buildB2(g) {
  const winZ = (z) => ((184 - z) % 6 + 6) % 6 >= 1 && ((184 - z) % 6 + 6) % 6 <= 4;
  // the street floor y20 is the south shell's (DU), so only the upper floor is laid here
  box(g, 22, 26, 161, 33, 26, 188, "smooth_stone");
  for (let z = 161; z <= 188; z++) {
    for (const x of [22, 33]) for (let y = 21; y <= 31; y++) {
      if (y === 26) continue;
      if (x === 33 && y <= 23) continue;
      if (y >= 28 && y <= 30 && winZ(z)) continue;
      g.set(x, y, z, "quartz_bricks", {});
    }
  }
  for (const z of [161, 188]) for (let x = 23; x <= 32; x++) for (let y = 21; y <= 31; y++) {
    if (y !== 26) g.set(x, y, z, "quartz_bricks", {});
  }
}

// Mass S: the street arcade shed (stalls), floors 20 (z161..188) and 22 (z189..279), posts x40 every 4 along z.
function buildS(g) {
  const floorAt = (z) => (z <= 188 ? 20 : 22);
  // footing and floors, one run per floor level
  footing(g, 34, 41, 161, 188, 20);
  footing(g, 34, 41, 189, 279, 22);
  box(g, 34, 20, 161, 40, 20, 188, "polished_andesite");
  box(g, 41, 20, 161, 41, 20, 188, "smooth_stone");
  box(g, 34, 22, 189, 40, 22, 279, "polished_andesite");
  box(g, 41, 22, 189, 41, 22, 279, "smooth_stone");
  for (let z = 161; z <= 277; z += 4) {
    const f = floorAt(z);
    post_bay(g, { x: 40, z, y0: f + 1, h: 4, beamY: f + 5, beamZ: [z, Math.min(z + 3, 279)] });
  }
}

// The aisle slab ramps where the street floors step (plan.md RAMP_Z), in the aisle x34..36.
function buildRamps(g) {
  ramp(g, { x0: 34, x1: 36, z: 132, from: 19, rise: 1, dir: 1 });
  ramp(g, { x0: 34, x1: 36, z: 188, from: 20, rise: 2, dir: 1 });
  ramp(g, { x0: 34, x1: 36, z: 279, from: 22, rise: 1, dir: 1 });
}

export function build(g) {
  buildA(g);
  buildB1(g);
  buildB2(g);
  buildS(g);
  buildRamps(g);
}
