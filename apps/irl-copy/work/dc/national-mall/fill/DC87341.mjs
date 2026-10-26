import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87341";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 31, D = 19;
const SH = 3; // storey height in blocks
const g = new Voxels([W, H, D]);

// Footprint lookup
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), top: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

// Pane connection states depend on which face the pane sits on
const pane = (face) => {
  const ns = face === "N" || face === "S";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
};

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Main massing pass
for (const [key, { gr, top }] of map) {
  const [x, z] = key.split(",").map(Number);

  const T = Math.min(H - 4, Math.max(top, gr + SH));

  const faces = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const perimeter = faces.N || faces.S || faces.W || faces.E;
  const corner = (faces.N || faces.S) && (faces.W || faces.E);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const j = (y - gr) % SH;
    const s = Math.floor((y - gr) / SH);

    // Floor slabs / spandrels across the whole footprint
    if (j === 0) {
      let blk = "white_concrete";
      if (y === gr && perimeter) blk = "smooth_stone";       // plinth course
      else if (perimeter && s >= 1) blk = "white_concrete";  // spandrel band
      g.set(x, y, z, blk);
      continue;
    }

    if (!perimeter) continue; // interior stays air behind the glass

    for (const f of ["N", "S", "W", "E"]) {
      if (!faces[f]) continue;
      const i = f === "N" || f === "S" ? x : z;
      const bx = x, bz = z;

      // Corner cells: solid stone piers so the massing turns the corner cleanly
      if (corner) {
        g.set(bx, y, bz, "stone_bricks");
        continue;
      }

      // Entrance: door on the north face at x=5, ground storey, with a stone surround
      if (f === "N" && x === 5 && s === 0 && (j === 1 || j === 2)) {
        const half = j === 1 ? "lower" : "upper";
        g.set(bx, y, bz, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (f === "N" && s === 0 && (x === 4 || x === 6) && (j === 1 || j === 2)) {
        g.set(bx, y, bz, "stone_bricks");
        continue;
      }

      // Ground storey shopfront: continuous glazing, no mullions
      if (s === 0) {
        g.set(bx, y, bz, "light_blue_stained_glass_pane", pane(f));
        continue;
      }

      // Upper storeys: mullion piers on even bays, glazing on odd bays
      if (i % 2 === 0) {
        g.set(bx, y, bz, "white_concrete");
        continue;
      }

      // Warm lamp in the glazing, a few per face, visible from the street at dusk
      if (j === 1 && (i + s) % 7 === 1) {
        g.set(bx, y, bz, "glowstone");
        continue;
      }

      g.set(bx, y, bz, "light_blue_stained_glass_pane", pane(f));
    }
  }

  // Stone cornice band and parapet on the perimeter, roof surface inside
  if (perimeter) {
    if (T - 2 >= gr) g.set(x, T - 2, z, "stone_bricks");
    g.set(x, T - 1, z, "smooth_stone");
  } else {
    g.set(x, T - 1, z, "light_gray_concrete");
  }
}

// Rooftop plant room on interior cells, sitting on the roof surface
for (const [key, { top }] of map) {
  const [x, z] = key.split(",").map(Number);
  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (perimeter) continue;
  if (x < 3 || x > 7 || z < 6 || z > 12) continue;
  const T = Math.min(H - 4, Math.max(Math.round(top), 0));
  if (T + 2 > H - 1) continue;
  g.set(x, T, z, "stone_bricks");
  g.set(x, T + 1, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
