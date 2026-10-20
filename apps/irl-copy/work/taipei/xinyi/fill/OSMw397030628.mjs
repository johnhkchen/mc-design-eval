import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw397030628";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Volume: 40 x 23 x 35 (x, y, z)
const W = 40, H = 23, D = 35;
const g = new Voxels([W, H, D]);

// Record: roof about 11 blocks above lowest ground, 2 storeys of ~5 blocks,
// a flat Taiwanese mid-century institutional block (cream tile walls,
// light-grey concrete bands and quoins, green-glazed parapet, pane windows).
const ROOF_Y = 10;      // roof deck top layer
const PARAPET_Y = 11;   // parapet / cornice cap
const FLOOR_Y = 5;      // storey 2 floor line
const LINTEL_LO = 4, LINTEL_HI = 9;

const WALL = "white_terracotta";
const BAND = "light_gray_concrete";
const FOUND = "stone_bricks";
const PARAPET = "green_terracotta";
const GLASS = "light_blue_stained_glass_pane";
const LAMP = "glowstone";

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);
const gAt = (x, z) => groundOf.get(`${x},${z}`);

const DV = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Outward-facing sides of a footprint cell (empty = interior cell)
function outward(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push("north");
  if (!has(x, z + 1)) s.push("south");
  if (!has(x - 1, z)) s.push("west");
  if (!has(x + 1, z)) s.push("east");
  return s;
}

// Bounding box and the south-most row (main entrance row)
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const southRow = cells.filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = southRow[Math.floor(southRow.length / 2)];

// ---- Pass 1: foundations, walls, floors, roof, parapet, entrance ----
for (const [x, z, gr0] of cells) {
  // Foundation: solid from y0 up to the cell's own ground
  const foundTop = Math.min(gr0, H - 1);
  for (let y = 0; y < foundTop; y++) g.set(x, y, z, FOUND);

  if (gr0 >= PARAPET_Y) continue; // ground at or above the roof line: foundation only

  const sides = outward(x, z);
  const edge = sides.length > 0;
  const corner = sides.length >= 2;
  const side = edge ? sides[0] : null;
  const alongIdx = side === "north" || side === "south" ? x : z;

  for (let y = gr0; y <= ROOF_Y; y++) {
    // Roof deck / cornice course
    if (y === ROOF_Y) {
      g.set(x, y, z, BAND);
      continue;
    }

    if (!edge) {
      // Interior: only the storey-2 floor slab; the rest is air gap
      if (y === FLOOR_Y) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Edge: facade
    if (y === gr0 || y === FLOOR_Y) { g.set(x, y, z, BAND); continue; }
    if (y === LINTEL_LO || y === LINTEL_HI) { g.set(x, y, z, BAND); continue; }

    // Corner quoins: solid light-grey columns that give the massing a clear edge
    if (corner) { g.set(x, y, z, BAND); continue; }

    const storey1 = y >= gr0 + 1 && y <= 3;
    const storey2 = y >= 6 && y <= 8;
    const windowRow = storey1 || storey2;

    // Main entrance door on the south row
    if (side === "south" && x === doorX && z === maxZ && (y === gr0 || y === gr0 + 1) && y <= 4) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: y === gr0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (windowRow && alongIdx % 3 !== 0) {
      // Glass pane, connected along the wall run
      const alongX = side === "north" || side === "south";
      g.set(x, y, z, GLASS, alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else {
      // Pilasters between bays, and solid wall elsewhere
      g.set(x, y, z, WALL);
    }
  }

  if (edge) g.set(x, PARAPET_Y, z, PARAPET);
}

// ---- Pass 2: entrance canopy and sconces, then warm lights behind windows ----
// Canopy: a bottom-half slab row over the door, sitting on the facade below it.
// Hanging lanterns beside the door hang from the canopy.
const doorCanopyY = 2; // above the door: gr0 + 2 is checked per cell below
for (const dx of [-1, 0, 1]) {
  const x = doorX + dx, z = maxZ;
  if (!has(x, z)) continue;
  const gr0 = gAt(x, z);
  if (gr0 > 1) continue;
  const yc = gr0 + 2;
  if (yc > 4) continue;
  g.set(x, yc, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  if (dx !== 0) {
    g.set(x, gr0 + 1, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

for (const [x, z, gr0] of cells) {
  if (gr0 > ROOF_Y) continue;
  const sides = outward(x, z);
  if (sides.length === 0 || sides.length >= 2) continue;
  const side = sides[0];
  const alongIdx = side === "north" || side === "south" ? x : z;
  if (alongIdx % 3 === 0) continue;

  const [dx, dz] = DV[side];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || outward(ix, iz).length > 0) continue;
  const ig = gAt(ix, iz);

  for (const y of [2, 7]) {
    const inWindow = (y >= gr0 + 1 && y <= 3) || (y >= 6 && y <= 8);
    if (!inWindow || y < ig || y === FLOOR_Y) continue;
    if (((x * 5 + z * 3 + y * 7) % 9) !== 0) continue;
    g.set(ix, y, iz, LAMP);
  }
}

// ---- Pass 3: roof equipment and stair/lift core ----
const spanX = maxX - minX + 1, spanZ = maxZ - minZ + 1;
const onRoof = (x, z) => has(x, z) && gAt(x, z) <= ROOF_Y && outward(x, z).length === 0;

// Mechanical plant box, west of centre
const mx0 = minX + Math.floor(spanX * 0.22), mz0 = minZ + Math.floor(spanZ * 0.3);
for (let x = mx0; x < mx0 + 7; x++) {
  for (let z = mz0; z < mz0 + 6; z++) {
    if (!onRoof(x, z)) continue;
    g.set(x, PARAPET_Y, z, BAND);
    g.set(x, PARAPET_Y + 1, z, BAND);
    g.set(x, PARAPET_Y + 2, z, PARAPET);
  }
}

// Stair/lift core, north-east corner, rising to y 16
const cx0 = maxX - 4, cz0 = minZ + 2;
for (let x = cx0; x < cx0 + 3; x++) {
  for (let z = cz0; z < cz0 + 3; z++) {
    if (!onRoof(x, z)) continue;
    for (let y = PARAPET_Y; y <= 15; y++) {
      g.set(x, y, z, y === 13 ? BAND : WALL);
    }
    g.set(x, 16, z, PARAPET);
  }
}

g.save(`${DIR}/${ID}.nbt`);
