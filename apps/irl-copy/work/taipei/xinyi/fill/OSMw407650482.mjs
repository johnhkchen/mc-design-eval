import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s commercial block on the Xinyi grid: two storeys of
// white tiled concrete with light grey piers, a stone-faced base, a smooth
// quartz storey band and sill/head bands, a shopfront with a central entrance
// on the south face, and a flat roof with a parapet and small plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650482";
const W = 46, H = 23, D = 75;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);

const lowest = Math.min(...cells.map((c) => c[2]));
const RS = lowest + 10; // common roof slab level; parapet sits at RS+1 (11 above lowest ground)

const DIRS = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};

const facesOf = (x, z) => {
  const out = [];
  for (const k of ["N", "S", "W", "E"]) {
    const [dx, dz] = DIRS[k];
    if (!has(x + dx, z + dz)) out.push(k);
  }
  return out;
};

// Along-face coordinate: x for N/S faces, z for E/W faces.
const uOf = (k, x, z) => (k === "N" || k === "S" ? x : z);

// Span of each exterior face, so bays are measured from the building's own edge.
const span = {};
for (const [x, z] of cells) {
  for (const k of facesOf(x, z)) {
    const u = uOf(k, x, z);
    if (!span[k]) span[k] = { min: u, max: u };
    span[k].min = Math.min(span[k].min, u);
    span[k].max = Math.max(span[k].max, u);
  }
}

// Entrance on the south face if present, otherwise the first available face.
const entFace = span.S ? "S" : Object.keys(span)[0];

const paneProps = (k) =>
  k === "N" || k === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (k, half) => ({
  facing: DIRS[k][2],
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

// Facade block for a perimeter wall cell at height y (not a storey band row).
const wallAt = (x, z, faces, k, y, gg) => {
  if (faces.length >= 2) return { id: "light_gray_concrete" }; // corner pier
  const rel = uOf(k, x, z) - span[k].min;
  const len = span[k].max - span[k].min;
  const mid = Math.floor(len / 2);
  const ent = k === entFace;
  const isPier = rel % 4 === 0 || rel % 4 === 3;
  const pier = { id: "light_gray_concrete" };

  if (y <= gg + 4) {
    // Ground floor: shopfront
    if (ent && rel === mid) {
      if (y === gg + 1) return { id: "dark_oak_door", props: doorProps(k, "lower") };
      if (y === gg + 2) return { id: "dark_oak_door", props: doorProps(k, "upper") };
      if (y === gg + 3) return { id: "light_blue_stained_glass_pane", props: paneProps(k) };
      return { id: "stone_bricks" };
    }
    if (ent && Math.abs(rel - mid) === 1) {
      if (y === gg + 4) return { id: "stone_bricks" };
      return { id: "light_blue_stained_glass_pane", props: paneProps(k) };
    }
    if (y === gg + 4) return { id: "stone_bricks" }; // fascia under the storey band
    if (isPier) return pier;
    return { id: "light_blue_stained_glass_pane", props: paneProps(k) };
  }

  // Upper floor: window bays with sill and head bands
  if (isPier) return pier;
  if (y === gg + 6 || y === gg + 9) return { id: "smooth_quartz" };
  return { id: "light_gray_stained_glass_pane", props: paneProps(k) };
};

// ---- main build ----
for (const [x, z, gg] of cells) {
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const top = Math.max(RS, gg + 6);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  // Ground slab (base course on the outside)
  put(x, gg, z, perim ? "stone_bricks" : "smooth_stone");

  // Storey floor slabs (band on the outside, slab inside)
  for (let L = gg + 5; L < top; L += 5) {
    put(x, L, z, perim ? "smooth_quartz" : "smooth_stone");
  }

  // Roof slab / cornice
  put(x, top, z, perim ? "smooth_quartz" : "light_gray_concrete");

  if (perim) {
    const k = faces[0];
    for (let y = gg + 1; y <= top - 1; y++) {
      if ((y - gg) % 5 === 0) continue; // storey band already placed
      const b = wallAt(x, z, faces, k, y, gg);
      put(x, y, z, b.id, b.props);
    }
    // Parapet
    put(x, top + 1, z, "white_concrete");

    // Warm light behind some upper windows, inside the air gap (single exposed face only)
    if (faces.length === 1) {
      const [dx, dz] = DIRS[k];
      const rel = uOf(k, x, z) - span[k].min;
      if ((rel + gg) % 3 === 0) {
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && facesOf(ix, iz).length === 0) {
          put(ix, gg + 7, iz, "glowstone");
        }
      }
    }
  }
}

// Rooftop plant: 2x2 boxes on interior cells whose full neighbourhood is in the footprint
for (const [x, z] of cells) {
  if (x % 11 !== 6 || z % 13 !== 6) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = quad.every(([qx, qz]) => has(qx, qz) && facesOf(qx, qz).length === 0);
  if (!ok) continue;
  const tops = quad.map(([qx, qz]) => Math.max(RS, groundOf(qx, qz) + 6));
  if (!tops.every((t) => t === tops[0])) continue;
  const t = tops[0];
  for (const [qx, qz] of quad) {
    put(qx, t + 1, qz, "light_gray_concrete");
    put(qx, t + 2, qz, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
