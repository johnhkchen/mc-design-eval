import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0103-10F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2006 Xinyi mid-rise office block: 10 storeys of 5 blocks, glass curtain wall
// with white concrete spandrels, stepped top (3-cell outer ring stops at y=44,
// core rises to a roof at y=50), mechanical penthouse and a lightning rod.
const W = 54, H = 62, D = 31;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const inFp = new Set();
const gr = new Map();
for (const [x, z, gy] of cells) {
  inFp.add(x + "," + z);
  gr.set(x + "," + z, gy);
}
const has = (x, z) => inFp.has(x + "," + z);
const groundAt = (x, z) => gr.get(x + "," + z);

const lights = [];

// Main pass: foundation, facade, interior slabs, roof cap
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const outN = !has(x, z - 1);
  const outS = !has(x, z + 1);
  const outW = !has(x - 1, z);
  const outE = !has(x + 1, z);
  const edge = outN || outS || outW || outE;
  const d = Math.min(x, z, W - 1 - x, D - 1 - z);
  const top = d <= 2 ? 44 : 50;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  for (let y = gy; y < top; y++) {
    const j = (y - gy) % 5;
    const s = Math.floor((y - gy) / 5);

    if (!edge) {
      // Interior: floor slabs only, air between (no interiors)
      if (j === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const u = (outN || outS) ? x : z;

    if (j === 0 || j === 4) {
      // Storey lines / spandrels
      put(x, y, z, "white_concrete");
      continue;
    }

    // Window band j = 1..3
    if (u % 3 === 0) {
      put(x, y, z, "white_concrete"); // mullion / frame
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }

    // Warm light behind some windows: glowstone one cell inward
    const hash = (x * 7 + z * 13 + s * 5) % 9;
    if (j === 2 && hash === 0) {
      let ix = x, iz = z;
      if (outN) iz = z + 1;
      else if (outS) iz = z - 1;
      else if (outW) ix = x + 1;
      else if (outE) ix = x - 1;
      if (has(ix, iz)) lights.push([ix, y, iz, groundAt(ix, iz)]);
    }
  }

  // Roof cap at the top of this cell's column
  if (top < H) {
    put(x, top, z, edge ? "white_concrete" : "light_gray_concrete");
  }
  // Parapet coping on the outer edge at the setback
  if (edge && d === 0 && top + 1 < H) {
    put(x, top + 1, z, "stone_brick_wall");
  }
}

// Deferred interior glowstone (only where the interior cell is above its own foundation)
for (const [ix, y, iz, igy] of lights) {
  if (y >= igy && y < 44) put(ix, y, iz, "glowstone");
}

// Entrance on the south face (z = D-1): stone jambs framing a two-leaf iron door,
// canopy beam across the bay, and lanterns hanging beneath the canopy.
for (const x of [25, 28]) {
  if (!has(x, D - 1)) continue;
  const gy = groundAt(x, D - 1);
  for (let y = gy; y <= gy + 2; y++) put(x, y, D - 1, "stone_bricks");
}
const doorX = [26, 27];
for (const x of doorX) {
  if (!has(x, D - 1)) continue;
  const gy = groundAt(x, D - 1);
  const hingeL = x === 26 ? "left" : "right";
  put(x, gy, D - 1, "iron_door", {
    facing: "south", half: "lower", hinge: hingeL, open: "false", powered: "false",
  });
  put(x, gy + 1, D - 1, "iron_door", {
    facing: "south", half: "upper", hinge: hingeL, open: "false", powered: "false",
  });
}
// Canopy beam across the entrance bay, attached to the facade
for (let x = 23; x <= 30; x++) {
  if (!has(x, D - 1)) continue;
  const gy = groundAt(x, D - 1);
  put(x, gy + 3, D - 1, "white_concrete");
  put(x, gy + 3, D - 2, "white_concrete");
}
// Hanging lanterns under the canopy at the bay edges
for (const x of [24, 29]) {
  if (!has(x, D - 1)) continue;
  const gy = groundAt(x, D - 1);
  put(x, gy + 2, D - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop: mechanical penthouse on the core and a lightning rod spire
for (const [x, z] of [...inFp].map((k) => k.split(",").map(Number))) {
  const d = Math.min(x, z, W - 1 - x, D - 1 - z);
  if (d >= 8 && x >= 20 && x <= 32 && z >= 12 && z <= 18) {
    for (let y = 51; y <= 53; y++) put(x, y, z, "light_gray_concrete");
  }
}
if (has(27, 15)) {
  for (let y = 54; y <= 57; y++) put(27, y, 15, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
