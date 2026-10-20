import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record-driven choice: a 16 x 25 block lot with a roof about 11 blocks above the lowest ground
// reads as a two-storey, c.1980s Taipei street-front commercial block: reinforced-concrete frame,
// white tiled walls, a stone base, a red shop fascia at ground level, a light-blue tinted glass
// shopfront below and in-line window bays above, a cornice, a parapet, and a rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408103";
const W = 16, H = 23, D = 25;

const list = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const GROUND = new Map();
let ref = Infinity;
for (const [x, z, gr] of list) {
  GROUND.set(`${x},${z}`, gr);
  ref = Math.min(ref, gr);
}
if (!Number.isFinite(ref)) ref = 0;

const has = (x, z) => GROUND.has(`${x},${z}`);
const groundAt = (x, z) => GROUND.get(`${x},${z}`);

// Outward faces of a cell: a face is exterior when the neighbour in that direction is off the footprint.
const FACE_STEP = {
  west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1],
};
const INWARD = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] };

function faces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(FACE_STEP)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}
const isExterior = (x, z) => faces(x, z).length > 0;

// Along-face index used for bay rhythm.
const alongOf = (face, x, z) => (face === "west" || face === "east" ? z : x);

// Pick the main entrance: middle of the south (+z) face, if the footprint has one.
const southCells = list.filter(([x, z]) => !has(x, z + 1));
let doorKey = null;
if (southCells.length) {
  const xs = southCells.map(([x]) => x).sort((a, b) => a - b);
  const mx = xs[Math.floor(xs.length / 2)];
  const zs = list.filter(([x]) => x === mx).map(([, z]) => z);
  doorKey = `${mx},${Math.max(...zs)}`;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const top = ref + 11; // parapet top, about 11 blocks above the lowest ground

// Pass 1: foundations, interior floor slabs, roof deck, and the envelope.
for (const [x, z, gr] of list) {
  // Foundation: fill solid from y 0 up to this cell's ground so nothing floats on a slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const ext = fs.length > 0;
  const face = fs[0];

  for (let dy = 0; dy <= 11; dy++) {
    const y = ref + dy;
    if (y < gr) continue; // already foundation

    if (!ext) {
      // Interior: only floor slabs (ground, first floor, roof deck). Air elsewhere.
      if (dy === 0 || dy === 5 || dy === 10) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const along = alongOf(face, x, z);

    // Ground storey: base, shopfront glazing with white piers, red fascia.
    if (dy === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (dy >= 1 && dy <= 3) {
      if (dy === 1 || dy === 2) {
        if (doorKey === `${x},${z}`) {
          const props = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
          put(x, y, z, "dark_oak_door", props(dy === 1 ? "lower" : "upper"));
          continue;
        }
      }
      if (along % 4 === 0) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }
    if (dy === 4) { put(x, y, z, "red_concrete"); continue; }

    // Upper storey: sill, window bays with white mullions, lintel.
    if (dy === 5) { put(x, y, z, "smooth_stone"); continue; }
    if (dy >= 6 && dy <= 8) {
      if (along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }
    if (dy === 9) { put(x, y, z, "smooth_stone"); continue; }

    // Cornice and parapet.
    if (dy === 10) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (dy === 11) { put(x, y, z, "white_concrete"); continue; }
  }

  // Roof deck (interior cells; exterior cells get the cornice at dy 10 above).
  if (!ext && 10 + ref >= gr) put(x, ref + 10, z, "light_gray_concrete");
}

// Pass 2: warm lights set behind selected glazing, on interior cells only.
for (const [x, z, gr] of list) {
  const fs = faces(x, z);
  if (!fs.length) continue;
  const face = fs[0];
  const along = alongOf(face, x, z);
  const [ix, iz] = INWARD[face];
  const ix2 = x + ix, iz2 = z + iz;
  if (!has(ix2, iz2) || isExterior(ix2, iz2)) continue;

  // Ground shop: a glowstone glow behind every third bay.
  if (along % 8 === 2 && along % 4 !== 0 && !(doorKey === `${x},${z}`)) {
    const y = ref + 2;
    if (y >= groundAt(ix2, iz2)) put(ix2, y, iz2, "glowstone");
  }
  // Upper storey: shroomlight behind selected windows.
  if (along % 6 === 4 && along % 3 !== 0) {
    const y = ref + 7;
    if (y >= groundAt(ix2, iz2)) put(ix2, y, iz2, "shroomlight");
  }
}

// Pass 3: rooftop water tank and a small mechanical box, both on footprint cells only.
const tankCells = [];
for (let x = 6; x <= 9; x++) for (let z = 10; z <= 13; z++) if (has(x, z)) tankCells.push([x, z]);
for (const [x, z] of tankCells) {
  for (let dy = 11; dy <= 13; dy++) put(x, ref + dy, z, "light_gray_concrete");
  put(x, ref + 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
for (let x = 2; x <= 3; x++) for (let z = 3; z <= 4; z++) {
  if (!has(x, z)) continue;
  put(x, ref + 11, z, "gray_concrete");
  put(x, ref + 12, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
