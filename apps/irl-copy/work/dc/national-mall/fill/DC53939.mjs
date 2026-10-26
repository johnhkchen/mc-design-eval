import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53939.cells.json`, "utf8"));

const W = 23, H = 29, D = 52;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => raw.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// ---- raw lidar per cell ----
const raw = new Map();
for (const [x, z, gr0, roof0] of cells) {
  raw.set(key(x, z), { gr: Math.max(0, Math.round(gr0)), roof: roof0 });
}

// ---- smooth the roof over a 5x5 window, then quantise to 3-block storeys ----
const map = new Map();
for (const [k, c] of raw.entries()) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const o = raw.get(key(x + dx, z + dz));
      if (o) { sum += o.roof; n++; }
    }
  const avg = sum / n;
  let Rq = 3 * Math.round(avg / 3);
  Rq = Math.min(Math.max(Rq, c.gr + 6), 18);
  map.set(k, { gr: c.gr, Rq });
}

let maxRq = 0;
for (const c of map.values()) maxRq = Math.max(maxRq, c.Rq);

// Central core: cell is at least 2 in from every footprint edge.
const inset2 = (x, z) => {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};

const GLASS = "light_blue_stained_glass_pane";
const PILLAR = "calcite";
const BAND = "calcite";
const SPANDREL = "white_concrete";
const BASE = "polished_granite";
const CORNICE = "stone_bricks";
const PARAPET = "stone_brick_wall";
const FOUNDATION = "stone_bricks";
const FLOOR = "smooth_stone";

// ---- main pass: foundation, facade, interior floors, parapet ----
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const { gr, Rq } = map.get(key(x, z));

    for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

    if (isEdge(x, z)) {
      let face, b;
      if (!has(x, z - 1)) { face = "n"; b = x; }
      else if (!has(x, z + 1)) { face = "s"; b = x; }
      else if (!has(x - 1, z)) { face = "w"; b = z; }
      else { face = "e"; b = z; }

      const pillar = b % 3 === 0;

      for (let y = gr; y < Rq; y++) {
        let m;
        if (y === gr) m = BASE;
        else if (y === Rq - 1) m = CORNICE;
        else if (pillar) m = PILLAR;
        else if (y % 3 === 0) m = BAND;
        else if (y % 3 === 1) m = SPANDREL;
        else m = GLASS;
        g.set(x, y, z, m);
      }

      g.set(x, Rq, z, PARAPET);

      let ix = x, iz = z;
      if (face === "n") iz = z + 1;
      else if (face === "s") iz = z - 1;
      else if (face === "w") ix = x + 1;
      else ix = x - 1;
      if (has(ix, iz) && !isEdge(ix, iz) && b % 6 === 4) {
        for (let y = gr; y < Rq - 1; y++) {
          if (y % 3 === 2) g.set(ix, y, iz, "glowstone");
        }
      }
    } else {
      for (let y = gr; y <= Rq - 2; y++) {
        if (y % 3 === 0) g.set(x, y, z, FLOOR);
      }
      g.set(x, Rq - 1, z, FLOOR);
    }
  }
}

// ---- entrances on both short faces (z=0 and z=51), centred, with canopy ----
function entrance(ex, ez, facing, inward) {
  if (!has(ex, ez) || !isEdge(ex, ez)) return;
  const { gr } = map.get(key(ex, ez));
  // Flanking piers and lintel carrying a canopy.
  for (let y = gr; y <= gr + 2; y++) {
    g.set(ex - 2, y, ez, PILLAR);
    g.set(ex + 2, y, ez, PILLAR);
  }
  for (let x = ex - 1; x <= ex + 1; x++) g.set(x, gr + 2, ez, PILLAR);
  // Canopy at storey-head height, projecting one cell inward where it exists.
  for (let x = ex - 2; x <= ex + 2; x++) {
    g.set(x, gr + 3, ez, CORNICE);
    if (has(x, ez + inward)) g.set(x, gr + 3, ez + inward, CORNICE);
  }
  // Glass doors with a warm light above.
  g.set(ex, gr, ez, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(ex, gr + 1, ez, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(ex, gr + 2, ez, "lantern", { hanging: "false" });
}
entrance(11, 0, "north", 1);
entrance(11, D - 1, "south", -1);

// ---- central penthouse on the top tier ----
{
  const P = new Set();
  for (const [k, c] of map.entries()) {
    const [x, z] = k.split(",").map(Number);
    if (c.Rq === maxRq && inset2(x, z)) P.add(k);
  }
  for (const k of P) {
    const [x, z] = k.split(",").map(Number);
    const { Rq } = map.get(k);
    const ring =
      !P.has(key(x + 1, z)) || !P.has(key(x - 1, z)) ||
      !P.has(key(x, z + 1)) || !P.has(key(x, z - 1));
    if (ring) {
      g.set(x, Rq, z, SPANDREL);
      g.set(x, Rq + 1, z, GLASS);
    }
    g.set(x, Rq + 2, z, CORNICE);
  }
}

g.save(`${DIR}/DC53939.nbt`);
