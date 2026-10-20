import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343841";

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);

const W = 34, H = 23, D = 99;
const g = new Voxels([W, H, D]);

// Record-driven massing: a 2-storey white-concrete commercial block with
// shopfront ground floor, belt course, cornice and parapet, flat roof.
const grounds = cells.map(c => c[2]);
const minG = Math.min(...grounds);
const maxG = Math.max(...grounds);
const R = Math.max(minG + 11, maxG + 5);   // roof surface level (level roof, slope absorbed by foundations)
const Y1 = minG + 5;                        // storey / belt line
const MID = Math.floor(D / 2);

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => has.has(key(x, z));

function S(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Outward/inward info for perimeter cells
function faceOf(x, z) {
  if (!inFp(x - 1, z)) return { out: "west", ix: 1, iz: 0, t: z };
  if (!inFp(x + 1, z)) return { out: "east", ix: -1, iz: 0, t: z };
  if (!inFp(x, z - 1)) return { out: "north", ix: 0, iz: 1, t: x };
  if (!inFp(x, z + 1)) return { out: "south", ix: 0, iz: -1, t: x };
  return null;
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  const f = faceOf(x, z);
  const hasY1 = Y1 > gr && Y1 < R;

  // Base course / ground floor slab
  S(x, gr, z, f ? "polished_andesite" : "smooth_stone");

  // Interior storey slab (air gap behind glass otherwise)
  if (!f && hasY1) S(x, Y1, z, "smooth_stone");

  // Roof slab over everything
  S(x, R, z, "gray_concrete");

  if (!f) {
    // Interior: roof equipment only (AC plant on the roof)
    if (x % 8 === 4 && z % 12 === 6) {
      S(x, R + 1, z, "light_gray_concrete");
      S(x, R + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter walls from above base course up to cornice
  for (let y = gr + 1; y <= R - 1; y++) {
    let b = null, p = null;

    if (y === R - 1) {
      b = "smooth_quartz";                       // cornice
    } else if (hasY1 && y === Y1) {
      b = "smooth_quartz";                       // belt course
    } else if (hasY1 && y < Y1) {
      // Ground-floor shopfront band
      const isDoorCol = (f.out === "west" || f.out === "east") && z === MID;
      if (y === Y1 - 1) {
        b = "black_concrete";                    // fascia / sign band
      } else if (isDoorCol && (y === gr + 1 || y === gr + 2)) {
        b = "dark_oak_door";
        p = {
          facing: f.out,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (f.t % 4 === 0) {
        b = "white_concrete";                    // shopfront pier
      } else {
        b = "glass";                             // shopfront glazing
      }
    } else {
      // Upper storey / single band
      if (y === R - 2) {
        b = "white_concrete";                    // spandrel
      } else if (f.t % 3 === 0) {
        b = "white_concrete";                    // window pier
      } else {
        b = "light_blue_stained_glass";          // window glass
      }
    }

    if (b) S(x, y, z, b, p);

    // Warm light just inside selected windows / shopfronts
    const isGlass = b === "glass" || b === "light_blue_stained_glass";
    if (isGlass && f.t % 9 === 4 && (y === gr + 2 || (hasY1 && y === Y1 + 2))) {
      const ix = x + f.ix, iz = z + f.iz;
      if (inFp(ix, iz)) S(ix, y, iz, "glowstone");
    }
  }

  // Parapet on the perimeter
  S(x, R + 1, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
