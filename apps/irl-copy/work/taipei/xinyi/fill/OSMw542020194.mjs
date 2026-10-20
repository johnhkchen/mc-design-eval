import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020194";
const W = 13, H = 23, D = 33;

// Low-rise 1970s-80s Xinyi commercial block: two storeys over a shopfront,
// pale concrete frame with pillars, blue glass band, flat parapeted roof and a rooftop water tank.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const gnd = (x, z) => gmap.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Missing-neighbour faces of a footprint cell (outward direction).
const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push({ ox: -1, oz: 0 });
  if (!has(x + 1, z)) f.push({ ox: 1, oz: 0 });
  if (!has(x, z - 1)) f.push({ ox: 0, oz: -1 });
  if (!has(x, z + 1)) f.push({ ox: 0, oz: 1 });
  return f;
};
const isPerimeter = (x, z) => faces(x, z).length > 0;

// Storey levels, relative to the lowest ground m.
const m = Math.min(...cells.map(c => c[2]));
const F1 = m + 5;        // first floor line
const ROOF = m + 10;     // roof slab
const PAR = m + 11;      // parapet top (~11 above lowest ground)

// Along-wall index for a face (absolute, so pillars line up across cells).
const along = (x, z, f) => (f.ox !== 0 ? z : x);

const isPillar = (x, z) => {
  const f = faces(x, z);
  if (f.length > 1) return true; // corners
  return f.some(face => along(x, z, face) % 3 === 0);
};

const perimeterBlock = (x, z, y, gr) => {
  if (y === ROOF) return "light_gray_concrete";
  if (y === PAR) return "white_concrete";
  const pillar = isPillar(x, z);
  if (y <= m + 3) {
    if (y === gr) return "polished_granite";
    return pillar ? "polished_granite" : "glass";
  }
  if (y === m + 4) return "smooth_stone";
  if (y === F1) return "light_gray_concrete";
  if (y >= m + 6 && y <= m + 8) {
    return pillar ? "light_gray_concrete" : "light_blue_stained_glass_pane";
  }
  if (y === m + 9) return "white_concrete";
  return null;
};

// 1. Foundations, body, floors and roof.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isPerimeter(x, z)) {
    for (let y = gr; y <= PAR; y++) {
      const b = perimeterBlock(x, z, y, gr);
      if (b) put(x, y, z, b);
    }
  } else {
    if (F1 >= gr) put(x, F1, z, "stone_bricks");
    if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete");
  }
}

// 2. Shopfront entrance on the west face, centred on the street-side cells.
const doorCands = cells
  .filter(([x, z, gr]) => !has(x - 1, z) && gr <= m + 2)
  .map(([x, z]) => z)
  .sort((a, b) => a - b);
if (doorCands.length) {
  const dz = doorCands[Math.floor(doorCands.length / 2)];
  const dx = cells.find(([x, z]) => z === dz && !has(x - 1, z))[0];
  const gr = gnd(dx, dz);
  put(dx, gr, dz, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 1, dz, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy-style lintel over the door on the shopfront line.
  put(dx, m + 3, dz, "smooth_stone");
}

// 3. Warm light behind glass: glowstone in upper storeys, lanterns in shopfronts.
for (const [x, z, gr] of cells) {
  if (!isPerimeter(x, z)) continue;
  for (const f of faces(x, z)) {
    const ix = x - f.ox, iz = z - f.oz;
    if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
    const a = along(x, z, f);
    if (isPillar(x, z)) continue;
    if (a % 6 === 4) put(ix, m + 7, iz, "glowstone");
    if (a % 6 === 1 && gr <= m + 2) put(ix, m + 2, iz, "lantern", { hanging: "false" });
  }
}

// 4. Rooftop water tank: 3x3 on interior roof cells, sitting on the roof slab.
let tank = null;
for (let z0 = 4; z0 <= D - 7 && !tank; z0++) {
  for (let x0 = 2; x0 <= W - 5 && !tank; x0++) {
    let ok = true;
    for (let dx = 0; dx < 3 && ok; dx++)
      for (let dz = 0; dz < 3 && ok; dz++) {
        const x = x0 + dx, z = z0 + dz;
        if (!has(x, z) || isPerimeter(x, z) || gnd(x, z) > ROOF) ok = false;
      }
    if (ok) tank = [x0, z0];
  }
}
if (tank) {
  const [tx, tz] = tank;
  for (let dx = 0; dx < 3; dx++)
    for (let dz = 0; dz < 3; dz++) {
      const x = tx + dx, z = tz + dz;
      put(x, PAR, z, "gray_concrete");
      put(x, PAR + 1, z, "gray_concrete");
      put(x, PAR + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
}

g.save(`${DIR}/${ID}.nbt`);
