// TPE114-0099-6F: built 2025, 22 x 11 footprint, roof ~11 blocks above lowest ground (lidar).
// At 1.4 blocks/m that is roughly 8 m, so the record reads as a two-storey (5 blocks per storey) commercial
// block with a parapet, not a six-storey tower. The "6F" in the id conflicts with the lidar height;
// the lidar height is used here.
// Materials: pale concrete and quartz frame, light-blue glass curtain wall, grey plinth,
// a dark-framed shopfront with a central entrance on the street face, warm lanterns and shroomlights behind the glass.

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ROOT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE114-0099-6F";

const W = 22, H = 23, D = 11;
const cells = JSON.parse(readFileSync(`${ROOT}/${ID}.cells.json`, "utf8"));

const vox = new Voxels([W, H, D]);
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const NORM = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const ext = (x, z) => Object.keys(NORM).filter(k => !has(x + NORM[k][0], z + NORM[k][1]));

const g0 = Math.min(...cells.map(c => c[2]));
const T = Math.min(g0 + 11, H - 3); // roof slab level; parapet sits one block above it

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Entrance on the street (south, +z) face, nearest the middle of the frontage.
const doorFace = cells.some(([x, z]) => ext(x, z).includes("S")) ? "S" : "N";
const doorCands = cells.filter(([x, z]) => ext(x, z).includes(doorFace));
const [doorX, doorZ] = doorCands.reduce((best, c) =>
  Math.abs(c[0] - (W - 1) / 2) < Math.abs(best[0] - (W - 1) / 2) ? c : best);
const nearDoor = (x, z, faces) =>
  faces.includes(doorFace) && z === doorZ && Math.abs(x - doorX) === 1;

for (const [x, z, gr] of cells) {
  const faces = ext(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const primary = faces[0];

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys from this cell's ground up to the cornice row.
  for (let y = gr; y <= T - 1; y++) {
    const rel = y - gr;
    const storey = Math.floor(rel / 5);
    const r = rel % 5;

    if (y === T - 1) {
      put(x, y, z, perim ? "quartz_block" : "smooth_quartz");
      continue;
    }
    if (r === 0) {
      put(x, y, z, perim && rel === 0 ? "polished_andesite" : "smooth_quartz");
      continue;
    }
    if (!perim) continue; // interior: air gap behind the glass

    if (r === 4) {
      const canopy = storey === 0 && z === doorZ && faces.includes(doorFace) && Math.abs(x - doorX) <= 1;
      put(x, y, z, canopy ? "black_concrete" : "light_gray_concrete");
      continue;
    }

    // r = 1..3: glazed band
    if (x === doorX && z === doorZ && storey === 0 && (r === 1 || r === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: FACING[doorFace],
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // Door piers: solid frame either side of the entrance on the ground storey.
    if (storey === 0 && nearDoor(x, z, faces)) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (corner || (x + z) % 3 === 0) {
      put(x, y, z, "white_concrete");
      continue;
    }
    // Glass pane, connected along the facade (tangential to the exterior normal).
    const alongX = primary === "N" || primary === "S";
    const conn = (d) => {
      const tangent = alongX ? (d === "E" || d === "W") : (d === "N" || d === "S");
      return tangent && has(x + NORM[d][0], z + NORM[d][1]) ? "true" : "false";
    };
    put(x, y, z, "light_blue_stained_glass_pane", {
      north: conn("N"), south: conn("S"), east: conn("E"), west: conn("W"), waterlogged: "false",
    });

    // Warm light behind some glass: a lantern on the ground storey, shroomlight on the upper.
    if (r === 2) {
      const ix = x - NORM[primary][0], iz = z - NORM[primary][1];
      if (has(ix, iz) && ext(ix, iz).length === 0) {
        if (storey === 0 && x % 4 === 1) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
        if (storey === 1 && x % 3 === 0) put(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Roof: slab across the footprint, one continuous parapet course on the perimeter with a cap,
// and a roof plant block set back from the edge.
for (const [x, z] of cells) {
  const faces = ext(x, z);
  put(x, T, z, "smooth_quartz");
  if (faces.length > 0) {
    put(x, T + 1, z, "smooth_quartz");
    put(x, T + 2, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (const [x, z] of cells) {
  if (x >= 5 && x <= 8 && z >= 3 && z <= 6 && ext(x, z).length === 0) {
    put(x, T + 1, z, "light_gray_concrete");
    if (x >= 6 && x <= 7 && z >= 4 && z <= 5) put(x, T + 2, z, "iron_block");
  }
}

vox.save(`${ROOT}/${ID}.nbt`);
