import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86585.cells.json`, "utf8"));

const W = 12, H = 29, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup
const fp = new Map();
const has = (x, z) => fp.has(`${x},${z}`);

// One flat roof for the whole block: median lidar roof, snapped to whole storeys of 3.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medR = roofs[Math.floor(roofs.length / 2)];
const N = Math.max(3, Math.min(9, Math.round(medR / 3)));
const TOP = Math.min(H, 3 * N);

for (const c of cells) {
  const [x, z, gr] = c;
  const top = Math.max(TOP, gr + 4 > TOP ? gr + 4 : TOP);
  fp.set(`${x},${z}`, { ground: gr, top: Math.min(H, top) });
}

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [k, info] of fp) {
  const [x, z] = k.split(",").map(Number);
  const { ground: gr, top } = info;

  const nN = !has(x, z - 1);
  const nS = !has(x, z + 1);
  const nW = !has(x - 1, z);
  const nE = !has(x + 1, z);
  const edge = nN || nS || nW || nE;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone");

  // Storey lines sit on absolute heights (multiples of 3) so floors line up across the slope.
  const isLine = (y) => y === gr || (y % 3 === 0 && y > gr);

  for (let y = gr; y < top && y < H; y++) {
    const roofDeck = y === top - 1;

    if (!edge) {
      // Interior: floor slabs and roof deck only, air between
      if (isLine(y) && y < top - 1) g.set(x, y, z, "smooth_stone");
      if (roofDeck) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Exposed wall: brick with stone storey lines, base course and parapet cap
    const stoneBand = isLine(y) || roofDeck;
    g.set(x, y, z, stoneBand ? "stone_bricks" : "bricks");
    if (stoneBand) continue;

    // Windows: alternate bays on each exposed face, two rows per storey
    const pick = (nN || nS) ? x : z;
    const bay = pick % 2 === 1;
    if (bay) {
      const ew = !(nN || nS) && (nE || nW);
      g.set(x, y, z, "glass_pane", ew ? GLASS_EW : GLASS_NS);

      // Warm light one block inside, where an interior cell exists
      const storeyIdx = Math.floor(y / 3);
      if ((x + z + storeyIdx) % 5 === 0) {
        let ix = x, iz = z;
        if (nN) iz = z + 1;
        else if (nS) iz = z - 1;
        else if (nW) ix = x + 1;
        else if (nE) ix = x - 1;
        if (has(ix, iz) && !(ix === x && iz === z)) g.set(ix, y, iz, "glowstone");
      }
    }

    // Entrance on the north face (z = 0): centred door, flanking piers, sill and lintel
    if (nN && z === 0 && x === 5 && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
    }
    if (nN && z === 0 && (x === 4 || x === 6) && (y === gr || y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "stone_bricks");
    }
  }

  // Entrance canopy over the door, on the first interior cell row (inside the footprint)
  if (nN && z === 0 && x === 5 && has(5, 1)) {
    const cy = gr + 2;
    if (cy < top - 1) g.set(5, cy, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86585.nbt`);
