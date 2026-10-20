import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738101";
const W = 38, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), Math.round(gr));
}
const has = (x, z) => G.has(key(x, z));
const miss = (x, z, dx, dz) => !has(x + dx, z + dz);
const edge = (x, z) =>
  miss(x, z, 1, 0) || miss(x, z, -1, 0) || miss(x, z, 0, 1) || miss(x, z, 0, -1);

// ---- levels (absolute y; y 0 = lowest ground under footprint) ---------------
const L = Math.min(...G.values());   // lowest ground: ground storey floor
const F1 = L + 5;                    // second-storey floor slab
const R = L + 11;                    // roof level (about 11 above lowest ground)

const g = new Voxels([W, H, D]);

// ---- pass 1: foundations, floors, walls, roof -------------------------------
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const isEdge = edge(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (isEdge) {
    g.set(x, gr, z, "polished_andesite"); // base course
  } else {
    g.set(x, gr, z, "smooth_stone");      // ground floor slab
  }

  if (isEdge) {
    // facade axis: which way this face runs, and its along-face index
    const nsMiss = miss(x, z, 0, 1) || miss(x, z, 0, -1);
    const ewMiss = miss(x, z, 1, 0) || miss(x, z, -1, 0);
    let a, axis;
    if (nsMiss && !ewMiss) { a = x; axis = "ns"; }
    else if (ewMiss && !nsMiss) { a = z; axis = "ew"; }
    else { a = x + z; axis = "ns"; }

    const paneProps = axis === "ns"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = gr + 1; y <= R - 1; y++) {
      let block, props;
      if (y <= L + 4) {
        // ground storey: shopfront glazing with piers
        if (y === L + 4) {
          block = "light_gray_concrete";           // lintel / storey line
        } else if (a % 3 === 0) {
          block = "white_concrete";                // pier
        } else {
          block = "light_blue_stained_glass_pane"; // shopfront glass
          props = paneProps;
        }
      } else if (y === F1) {
        block = "light_gray_concrete";             // storey line
      } else if (y === F1 + 1) {
        block = "white_concrete";                  // spandrel
      } else if (y === R - 1) {
        block = "light_gray_concrete";             // cornice band
      } else {
        // upper storey windows
        if (a % 3 === 1) {
          block = "light_blue_stained_glass_pane";
          props = paneProps;
        } else {
          block = "white_concrete";
        }
      }
      g.set(x, y, z, block, props);
    }

    // parapet cap on the roof edge
    g.set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior: second floor slab (air gap above ground storey), roof deck
    if (gr <= F1 && F1 > gr) g.set(x, F1, z, "smooth_stone");
    g.set(x, R, z, "light_gray_concrete");
  }
}

// ---- pass 2: entrance on the lowest-z (north) face ---------------------------
const zmin = Math.min(...[...G.keys()].map(k => Number(k.split(",")[1])));
const northXs = [...G.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => z === zmin && edge(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);

if (northXs.length) {
  const xd = northXs[Math.floor(northXs.length / 2)];
  const gd = G.get(key(xd, zmin));
  g.set(xd, gd + 1, zmin, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(xd, gd + 2, zmin, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // small entrance canopy band above the door, sitting on the lintel row
  for (const dx of [-1, 0, 1]) {
    if (has(xd + dx, zmin)) {
      g.set(xd + dx, L + 4, zmin, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// ---- pass 3: warm lights in some windows, behind the glass -------------------
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (!edge(x, z)) continue;

  // inward cell: opposite of a missing neighbour
  let ix = null, iz = null;
  if (miss(x, z, 0, -1)) { ix = x; iz = z + 1; }
  else if (miss(x, z, 0, 1)) { ix = x; iz = z - 1; }
  else if (miss(x, z, -1, 0)) { ix = x + 1; iz = z; }
  else if (miss(x, z, 1, 0)) { ix = x - 1; iz = z; }
  if (ix === null || !has(ix, iz) || edge(ix, iz)) continue;

  const a = (miss(x, z, 0, 1) || miss(x, z, 0, -1)) && !(miss(x, z, 1, 0) || miss(x, z, -1, 0))
    ? x
    : (miss(x, z, 1, 0) || miss(x, z, -1, 0)) && !(miss(x, z, 0, 1) || miss(x, z, 0, -1))
      ? z
      : x + z;
  if (a % 6 !== 4) continue;

  // ground storey light
  if (a % 3 !== 0 && gr + 2 <= L + 3) {
    g.set(ix, gr + 2, iz, "glowstone");
  }
  // upper storey light
  if (a % 3 === 1 && L + 8 <= R - 2) {
    g.set(ix, L + 8, iz, "shroomlight");
  }
}

// ---- pass 4: rooftop plant enclosure on the deck ----------------------------
if (R + 2 < H) {
  for (const [k] of G) {
    const [x, z] = k.split(",").map(Number);
    if (edge(x, z)) continue;
    if (x >= 8 && x <= 13 && z >= 6 && z <= 13) {
      g.set(x, R + 1, z, "light_gray_concrete");
      if (x >= 9 && x <= 12 && z >= 7 && z <= 12) {
        g.set(x, R + 2, z, "iron_block");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
