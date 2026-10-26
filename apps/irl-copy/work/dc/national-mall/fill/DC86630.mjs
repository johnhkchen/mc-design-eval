import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86630: 1023 15th St NW, Commercial-Office-Large.
// Read as a c.1930s-50s Washington office block: calcite walls, stone-brick
// base and cornice, smooth-stone floor bands, glazed bays between calcite
// piers, a parapet, and a dark-oak entrance on the south face flanked by piers.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86630.cells.json`, "utf8"));

const W = 14, H = 31, D = 7;
const MAXY = H - 1;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = new Map();
for (const c of cells) has.set(key(c[0], c[1]), c);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const put = (x, y, z, id, st) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y > MAXY) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// Which outer faces of a footprint cell are open to the air.
function exposure(x, z) {
  return {
    n: !has.has(key(x, z - 1)), // z=0 side
    s: !has.has(key(x, z + 1)), // z=6 side (main south entrance)
    w: !has.has(key(x - 1, z)),
    e: !has.has(key(x + 1, z)),
  };
}

// Entrance: centred on the south face.
const DOOR_X = 6;

for (const c of cells) {
  const [x, z] = c;
  const gr = clamp(Math.round(c[2]), 0, MAXY - 12);
  const rf = clamp(Math.round(c[3]), gr + 3, MAXY - 4); // roof top (cap course)
  const ex = exposure(x, z);
  const faces = (ex.n ? 1 : 0) + (ex.s ? 1 : 0) + (ex.w ? 1 : 0) + (ex.e ? 1 : 0);
  const perimeter = faces > 0;
  const onNS = ex.n || ex.s;
  const bayIdx = onNS ? x : z;

  // Foundation and base course.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Storeys above the base: floor band every 3 blocks, two glazed rows between.
  for (let y = gr + 1; y < rf; y++) {
    const rel = y - gr;
    const top = rel === rf - gr - 1;

    // Floor slabs run through every cell, interior included.
    if (rel % 3 === 0 && !top) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (!perimeter) continue; // interior stays air behind the glass

    // Cornice course under the roof.
    if (top) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Corners are solid piers.
    if (faces >= 2) {
      put(x, y, z, "calcite");
      continue;
    }

    // South face around the entrance: door in the centre, piers either side.
    if (ex.s && Math.abs(x - DOOR_X) <= 1 && rel <= 2) {
      if (x === DOOR_X) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        put(x, y, z, "calcite");
      }
      continue;
    }

    // Piers every third bay; glazed bays otherwise.
    if (bayIdx % 3 === 0) {
      put(x, y, z, "calcite");
    } else {
      put(x, y, z, "glass_pane");
    }
  }

  // Roof cap: stone cornice on the edge, smooth stone over the interior.
  if (rf <= MAXY) {
    put(x, rf, z, perimeter ? "stone_bricks" : "smooth_stone");
  }
  // Parapet on the perimeter of each roof tier.
  if (perimeter && rf + 1 <= MAXY) {
    put(x, rf + 1, z, "stone_bricks");
  }

  // Warm light behind a few glazed south-row bays (interior row z=5, rel 1).
  if (!perimeter && z === 5 && x % 4 === 2 && x % 3 !== 0) {
    put(x, gr + 1, z, "glowstone");
  }
  // Warm light behind a few east/west-row bays.
  if (!perimeter && x === 1 && z % 3 === 1 && gr + 2 < rf) {
    put(x, gr + 2, z, "shroomlight");
  }

  // Roof plant on the central cells.
  if (x >= 10 && x <= 11 && z >= 2 && z <= 3 && rf + 2 <= MAXY) {
    put(x, rf + 1, z, "light_gray_concrete");
    put(x, rf + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC86630.nbt`);
