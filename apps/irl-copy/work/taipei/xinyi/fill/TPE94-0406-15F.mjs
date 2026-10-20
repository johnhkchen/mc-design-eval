import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0406-15F: 2005 Xinyi mixed-use office tower, 15 floors (ground + 14), roof at y=74.
// Storey lines are absolute: plinth y0, ground storey 0-3 (shopfront), slabs at y = 4 + 5k,
// glass in the three blocks above each slab, white spandrel below the next slab.
// Foundations fill from y0 up to each cell's ground. A setback at y=50 steps the outer
// ring down to a terrace. Mullion bays carry one-block fins for depth.
// Penthouse core and mast sit on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0406-15F";
const W = 26, H = 86, D = 23;
const ROOF = 74;
const SETBACK = 50;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(40, Math.round(gr))));
}

const key = (x, z) => `${x},${z}`;
const inside = (x, z) => ground.has(key(x, z));
const NORM = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Chebyshev distance to the nearest non-footprint cell (edge cells = 1).
function edgeDist(x, z) {
  for (let r = 1; r < 40; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!inside(x + dx, z + dz)) return r;
      }
    }
  }
  return 40;
}

const dist = new Map();
for (const [x, z] of cells) dist.set(key(x, z), edgeDist(x, z));

// Tier membership: below the setback the full footprint; above it only cells at dist >= 2.
const inTier = (x, z, y) =>
  inside(x, z) && (y < SETBACK || dist.get(key(x, z)) >= 2);

const facesAt = (x, z, y) => {
  const f = [];
  if (!inTier(x, z - 1, y)) f.push("N");
  if (!inTier(x, z + 1, y)) f.push("S");
  if (!inTier(x - 1, z, y)) f.push("W");
  if (!inTier(x + 1, z, y)) f.push("E");
  return f;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: middle column of the south (+z) facade.
const southXs = cells
  .filter(([x, z]) => facesAt(x, z, 0).includes("S"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

const glassFor = (x, y, z) =>
  (x * 7 + z * 3 + y) % 9 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";

// Main shell pass.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(40, Math.round(gr0)));
  const d = dist.get(key(x, z));

  for (let y = 0; y <= ROOF; y++) {
    // Foundation up to this cell's ground.
    if (y < gr) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Outside the upper tier: terrace parapet on the outer ring, otherwise air.
    if (!inTier(x, z, y)) {
      if ((y === SETBACK || y === SETBACK + 1) && d === 1) {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    const f = facesAt(x, z, y);
    const edge = f.length > 0;

    // Roof deck and parapet.
    if (y === ROOF) {
      put(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (y === ROOF + 1 && edge) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Plinth course.
    if (y === 0) {
      put(x, y, z, edge ? "polished_granite" : "smooth_stone");
      continue;
    }

    // Floor slabs at y = 4 + 5k.
    if (y % 5 === 4) {
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (!edge) continue; // interior: air gap behind the glass

    // Spandrel / ground lintel.
    if (y % 5 === 3) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const outward = f[0];
    const bay = outward === "N" || outward === "S" ? x : z;
    const corner = f.length > 1;

    // Entrance: three-wide, glass doors in the centre with mullions either side.
    if (y <= 2 && f.includes("S") && Math.abs(x - entX) <= 1) {
      put(x, y, z, x === entX ? "glass" : "white_concrete");
      continue;
    }

    const mullion = corner || bay % 3 === 0;
    put(x, y, z, mullion ? "white_concrete" : glassFor(x, y, z));

    // Warm light just inside the glass, on a few bays.
    if (!mullion) {
      const [nx, nz] = NORM[outward];
      const ix = x - nx, iz = z - nz;
      const innerInterior = inTier(ix, iz, y) && facesAt(ix, iz, y).length === 0;
      const lamp = y % 5 === 1 && bay % 4 === 2;
      if (innerInterior && lamp) put(ix, y, iz, "glowstone");
    }
  }
}

// Entrance glow just inside the doors.
{
  const doorCell = cells.find(([x, z]) => x === entX && facesAt(x, z, 1).includes("S"));
  if (doorCell) {
    const [dx, dz] = doorCell;
    put(dx, 2, dz - 1, "glowstone");
  }
}

// Fins: one-block piers inside each mullion bay, for depth on the facades.
for (const [x, z] of cells) {
  for (let y = 1; y < ROOF; y++) {
    if (!inTier(x, z, y)) continue;
    const f = facesAt(x, z, y);
    if (f.length !== 1) continue; // corners are already solid columns
    const outward = f[0];
    const bay = outward === "N" || outward === "S" ? x : z;
    if (bay % 3 !== 0) continue;
    const [nx, nz] = NORM[outward];
    const ix = x - nx, iz = z - nz;
    if (!inTier(ix, iz, y)) continue;
    if (y < (ground.get(key(ix, iz)) ?? 0)) continue;
    if (facesAt(ix, iz, y).length > 0) continue;
    put(ix, y, iz, "white_concrete");
  }
}

// Rooftop penthouse core, set on the roof deck at y=75.
let mastCell = null;
let mastD = -1;
for (const [x, z] of cells) {
  const d = dist.get(key(x, z));
  if (d < 5) continue;

  if (d === 5) {
    put(x, 75, z, "light_gray_concrete");
    put(x, 76, z, "white_concrete");
    put(x, 77, z, glassFor(x, 77, z));
    put(x, 78, z, "white_concrete");
  } else {
    put(x, 75, z, "white_concrete");
    put(x, 76, z, "white_concrete");
    put(x, 77, z, "white_concrete");
    put(x, 78, z, "white_concrete");
  }
  put(x, 79, z, "light_gray_concrete");

  if (d > mastD) {
    mastD = d;
    mastCell = [x, z];
  }
}

// Antenna mast with an aviation light on the penthouse.
if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = 80; y <= 83; y++) put(mx, y, mz, "iron_bars");
  put(mx, 84, mz, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
