import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690455";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 18 footprint, roof at y 10 (11 blocks above lowest ground).
// Ground-floor shopfront, two storeys of office/shop-house, cream tile and grey
// concrete with tinted-blue glazing, a red fascia, and a parapet with rooftop units.
const W = 16, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr | 0);
const has = (x, z) => G.has(key(x, z));

const FACE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const axisT = (d, x, z) => (d === "N" || d === "S" ? x : z);

const missing = (x, z) =>
  Object.keys(FACE).filter((d) => {
    const [dx, dz] = FACE[d];
    return !has(x + dx, z + dz);
  });

// Per-face minimum along the wall, used to space piers every third block.
const faceMin = {};
for (const [x, z] of cells) {
  for (const d of missing(x, z)) {
    const t = axisT(d, x, z);
    faceMin[d] = faceMin[d] === undefined ? t : Math.min(faceMin[d], t);
  }
}

// Door: the single-face north cell nearest the middle of the north wall.
const northSingles = cells
  .filter(([x, z]) => { const m = missing(x, z); return m.length === 1 && m[0] === "N"; })
  .map(([x, z]) => [x, z]);
const midX = northSingles.reduce((s, [x]) => s + x, 0) / Math.max(1, northSingles.length);
let door = null;
for (const [x, z] of northSingles) {
  if (!door || Math.abs(x - midX) < Math.abs(door[0] - midX)) door = [x, z];
}

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of cells) {
  const gr = G.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  const m = missing(x, z);
  const edge = m.length > 0;
  const corner = m.length >= 2;
  const face = m.length === 1 ? m[0] : null;
  const pier = corner || (face !== null && (axisT(face, x, z) - faceMin[face]) % 3 === 0);
  const isDoor = !!door && door[0] === x && door[1] === z && face === "N";
  const paneProps = face === "E" || face === "W" ? PANE_EW : PANE_NS;

  if (!edge) {
    // Interior: ground ceiling / floor-2 slab, roof-2 ceiling, roof deck, rooftop units.
    g.set(x, 4, z, "smooth_stone");
    g.set(x, 9, z, "smooth_stone");
    g.set(x, 10, z, "smooth_stone");
    if ((x * 3 + z * 5) % 11 === 0) g.set(x, 11, z, "light_gray_concrete");
    continue;
  }

  for (let y = gr; y <= 10; y++) {
    // Ground floor shopfront (gr .. 4)
    if (y <= 4) {
      if (isDoor && y <= gr + 1) {
        const half = y === gr ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }
      if (y === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
      if (y === 4) { g.set(x, y, z, "red_terracotta"); continue; }
      // y in gr+1 .. 2: glazing or pier
      if (pier) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      continue;
    }

    // Storey lines and upper floor (5 .. 9)
    if (y === 5 || y === 9) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y === 6) { g.set(x, y, z, "white_concrete"); continue; }
    if (y === 7 || y === 8) {
      if (pier) { g.set(x, y, z, "light_gray_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      // Warm light: a hanging lantern just inside a selected window.
      if (y === 8 && (x * 5 + z * 3) % 4 === 0 && face) {
        const [dx, dz] = FACE[face];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && missing(ix, iz).length === 0) {
          g.set(ix, 8, iz, "lantern", { hanging: "true", waterlogged: "false" });
        }
      }
      continue;
    }

    // Parapet (10)
    if (y === 10) { g.set(x, y, z, "white_concrete"); continue; }
  }
}

g.save(`${DIR}/${ID}.nbt`);
