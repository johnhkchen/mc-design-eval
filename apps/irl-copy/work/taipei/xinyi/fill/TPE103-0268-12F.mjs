import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0268-12F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 71, D = 22;
const ROOF = 59;          // main roof deck top (lidar: ~59 above lowest ground)
const ROOF_LOW = 47;      // setback terrace level on the outer cells
const TIER_LO = 3, TIER_HI = 18;  // z-range of the upper tier
const STOREY = 5;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";
const WALL = "white_concrete";
const SPAN = "smooth_quartz";
const PILLAR = "quartz_pillar";
const FLOOR = "light_gray_concrete";
const PLINTH = "polished_andesite";
const DARK = "black_concrete";
const DOOR = "tinted_glass";
const GLASS = "light_blue_stained_glass_pane";
const GLOW = "glowstone";

const cellMap = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => cellMap.has(`${x},${z}`);
const inTier = (z) => z >= TIER_LO && z <= TIER_HI;
const topOf = (x, z) => (inTier(z) ? ROOF : ROOF_LOW);
const NB = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

// faces open to air at height y: no neighbour cell, or neighbour has no body at y
function facesAt(x, z, y) {
  const f = [];
  for (const d of ["n", "s", "w", "e"]) {
    const [dx, dz] = NB[d];
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || topOf(nx, nz) <= y) f.push(d);
  }
  return f;
}
// faces open to air at the top of the cell (for parapets)
function facesTop(x, z) {
  const t = topOf(x, z);
  const f = [];
  for (const d of ["n", "s", "w", "e"]) {
    const [dx, dz] = NB[d];
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || topOf(nx, nz) < t) f.push(d);
  }
  return f;
}
const isCorner = (f) => (f.includes("n") || f.includes("s")) && (f.includes("w") || f.includes("e"));

// pane connection props: a pane on a z-normal face runs along x
function pane(face) {
  return (face === "n" || face === "s")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// pass 1: foundations, storeys, facades, setback slab
for (const [x, z, gr] of cells) {
  const top = topOf(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // slab that carries the upper tier over the setback terrace
  if (inTier(z)) g.set(x, ROOF_LOW - 1, z, FLOOR);

  for (let y = gr; y <= top - 2; y++) {
    if (y === ROOF_LOW - 1 && !inTier(z)) continue;
    const r = (y - gr) % STOREY;
    const k = Math.floor((y - gr) / STOREY);
    const faces = facesAt(x, z, y);

    if (faces.length === 0) {
      if (r === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, k === 0 ? PLINTH : SPAN);
      continue;
    }
    if (isCorner(faces)) { g.set(x, y, z, PILLAR, { axis: "y" }); continue; }

    const face = faces[0];
    if (k === 0 && faces.includes("n")) {
      // street-front shopfront with entrance
      const entrance = x === 2 || x === 3;
      if (r === 3) {
        g.set(x, y, z, entrance ? GLOW : DARK);
      } else if (entrance) {
        g.set(x, y, z, DOOR);
      } else if (x === 1 || x === 4) {
        g.set(x, y, z, DARK);
      } else {
        g.set(x, y, z, GLASS, pane("n"));
      }
      continue;
    }

    // upper bays: glass on odd index, white mullion on even
    const idx = (face === "n" || face === "s") ? x : z;
    if (idx % 2 === 1) g.set(x, y, z, GLASS, pane(face));
    else g.set(x, y, z, WALL);
  }
}

// pass 2: warm lights behind some upper-floor windows
for (const [x, z, gr] of cells) {
  const base = facesAt(x, z, gr + 2);
  if (base.length === 0 || isCorner(base)) continue;
  const face = base[0];
  const idx = (face === "n" || face === "s") ? x : z;
  const [dx, dz] = NB[face];
  const ix = x - dx, iz = z - dz;   // inward neighbour
  if (!has(ix, iz) || facesAt(ix, iz, gr + 2).length > 0) continue;
  const top = topOf(x, z);
  for (let k = 1; ; k++) {
    const y = gr + k * STOREY + 2;
    if (y > top - 3) break;
    if ((k + idx) % 3 === 0) g.set(ix, y, iz, GLOW);
  }
}

// pass 3: roof decks, parapets, corner beacons, roof plant, mast
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const t = topOf(x, z);
  g.set(x, t - 1, z, WALL);                     // cornice / roof deck
  const ex = facesTop(x, z);
  if (ex.length > 0) {
    g.set(x, t, z, WALL);                        // parapet
    g.set(x, t + 1, z, WALL);
    if (isCorner(ex)) g.set(x, t + 1, z, GLOW);  // lit corner beacons at dusk
  }
}
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (x >= 2 && x <= 3 && z >= 8 && z <= 13 && facesAt(x, z, ROOF).length === 0 && inTier(z)) {
    g.set(x, ROOF, z, FLOOR);                    // roof plant box
    g.set(x, ROOF + 1, z, FLOOR);
  }
}
if (has(2, 10)) {
  for (let y = ROOF + 2; y <= ROOF + 4; y++) {
    g.set(2, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
