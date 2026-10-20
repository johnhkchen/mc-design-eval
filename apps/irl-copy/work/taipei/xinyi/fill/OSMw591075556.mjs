import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075556";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 20, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gmin = Math.min(...ground.values());

// Vertical plan (absolute y, anchored to lowest ground)
// base course gy+1 | shopfront gy+2..gmin+3 | fascia gmin+4 | storey line gmin+5
// upper windows gmin+6 | cornice gmin+7 | parapet/roof top gmin+8 (R)
const R = gmin + 8;
const FL = gmin + 5;
const FASCIA = gmin + 4;
const SHOP_TOP = gmin + 3;
const UPPER = gmin + 6;
const CORN = gmin + 7;

function setv(x, y, z, name, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Outward normals of the cell's exposed sides
function exposures(x, z) {
  const out = [];
  if (!has(x + 1, z)) out.push([1, 0]);
  if (!has(x - 1, z)) out.push([-1, 0]);
  if (!has(x, z + 1)) out.push([0, 1]);
  if (!has(x, z - 1)) out.push([0, -1]);
  return out;
}

const interiorCells = [];

// Main body
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= gy; y++) setv(x, y, z, "stone_bricks");

  const ex = exposures(x, z);

  if (ex.length === 0) {
    // Interior: floor slabs and roof deck only (air gap behind glass)
    interiorCells.push([x, z, gy]);
    if (FL > gy) setv(x, FL, z, "smooth_stone");
    if (CORN > gy) setv(x, CORN, z, "gray_concrete");
    continue;
  }

  const onZFace = ex.some(([, dz]) => dz !== 0); // face runs along x
  const idx = onZFace ? x : z;
  const [nx, nz] = ex[0];

  for (let y = gy + 1; y <= R; y++) {
    if (y === R) {
      setv(x, y, z, "smooth_stone");                 // parapet cap
    } else if (y === CORN) {
      setv(x, y, z, "stone_bricks");                 // cornice
    } else if (y === FL) {
      setv(x, y, z, "smooth_stone");                 // storey line
    } else if (y === FASCIA) {
      setv(x, y, z, "red_concrete");                 // shop fascia band
    } else if (y === gy + 1) {
      setv(x, y, z, "polished_andesite");            // base course
    } else if (y >= gy + 2 && y <= SHOP_TOP) {
      // Ground-floor shopfront: glass bays between white piers
      if (idx % 4 === 0) setv(x, y, z, "white_concrete");
      else setv(x, y, z, "glass_pane");
    } else if (y === UPPER) {
      if (idx % 3 === 0) {
        setv(x, y, z, "white_concrete");
      } else {
        setv(x, y, z, "light_blue_stained_glass_pane");
        // warm light just behind some upper windows
        if (idx % 6 === 1) {
          const ix = x - nx, iz = z - nz;
          if (has(ix, iz) && exposures(ix, iz).length === 0) {
            setv(ix, y, iz, "shroomlight");
          }
        }
      }
    } else {
      setv(x, y, z, "white_concrete");               // plain wall
    }
  }

  // Warm glow behind some shopfront bays
  if (idx % 4 === 2) {
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && exposures(ix, iz).length === 0 && gy + 2 <= SHOP_TOP) {
      setv(ix, gy + 2, iz, "glowstone");
    }
  }
}

// Entrance: centre bay of the south (+z) front, two blocks tall
const front = cells
  .filter(([x, z]) => exposures(x, z).some(([, dz]) => dz === 1))
  .sort((a, b) => a[0] - b[0]);
if (front.length) {
  const [fx, fz, fg] = front[Math.floor(front.length / 2)];
  const y0 = fg + 2;
  if (y0 + 1 <= SHOP_TOP) {
    setv(fx, y0, fz, "oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    setv(fx, y0 + 1, fz, "oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Roof plant room: small stair/lift house on the deck, interior cells only
if (interiorCells.length) {
  const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
  const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
  for (const [x, z, gy] of interiorCells) {
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2 && CORN > gy) {
      setv(x, R, z, "light_gray_concrete");
      setv(x, R + 1, z, "light_gray_concrete");
      setv(x, R + 2, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
