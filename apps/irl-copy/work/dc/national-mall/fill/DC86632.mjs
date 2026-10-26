import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1400 L St NW: mid-century/1980s Class-A office block. White-concrete piers,
// light-concrete spandrels, tinted glass ribbons, granite base, stone cornice,
// one flat roof tier (lidar median, quantized to 3-block storeys) and a central
// mechanical penthouse seated directly on the roof.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const id = "DC86632";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 18, H = 31, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  cellMap.set(key(x, z), { g: Math.round(gr), r: Math.round(roof) });
}

// One flat roof tier: median lidar roof, quantized to storeys, kept above the
// highest ground so every cell has at least six blocks of massing.
const maxG = Math.max(...[...cellMap.values()].map(c => c.g));
const roofs = [...cellMap.values()].map(c => c.r).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const T = Math.min(27, Math.max(maxG + 6, Math.round(median / 3) * 3));

// Global storey datum so spandrel bands line up across every cell
const base = maxG;
const sl = y => ((y - base) % 3 + 3) % 3; // storey-line phase, 0 = spandrel band

function face(x, z) {
  if (!cellMap.has(key(x, z - 1))) return "N";
  if (!cellMap.has(key(x, z + 1))) return "S";
  if (!cellMap.has(key(x - 1, z))) return "W";
  if (!cellMap.has(key(x + 1, z))) return "E";
  return null;
}

const lit = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 9 === 0;

for (const [k, { g: gr }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const f = face(x, z);
  const per = f !== null;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor / base course
  g.set(x, gr, z, per ? "polished_granite" : "light_gray_concrete");

  for (let y = gr + 1; y < T; y++) {
    const phase = sl(y);

    // Cornice / roof cap
    if (y === T - 1) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (!per) {
      // Interior: floor slab at each storey line, otherwise open air behind glass
      if (phase === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter spandrel band
    if (phase === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Along-face pier logic: piers every third bay and at corners
    const ns = f === "N" || f === "S";
    const t = ns ? x : z;
    const side1 = ns ? cellMap.has(key(x - 1, z)) : cellMap.has(key(x, z - 1));
    const side2 = ns ? cellMap.has(key(x + 1, z)) : cellMap.has(key(x, z + 1));
    const pier = t % 3 === 0 || !side1 || !side2;

    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      const props = ns
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "gray_stained_glass_pane", props);
    }

    // Warm light behind some lower-row glass
    if (phase === 1 && !pier) {
      const dx = f === "W" ? 1 : f === "E" ? -1 : 0;
      const dz = f === "N" ? 1 : f === "S" ? -1 : 0;
      const ix = x + dx, iz = z + dz;
      if (cellMap.has(key(ix, iz)) && face(ix, iz) === null && lit(x, y, z)) {
        g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Entrance: double doors centred on the north (street) face, granite lintel above
for (const [k, { g: gr }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (face(x, z) !== "N" || (x !== 8 && x !== 9)) continue;
  const hinge = x === 8 ? "left" : "right";
  g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  g.set(x, gr + 3, z, "polished_granite");
}

// Central mechanical penthouse on the flat roof, interior cells only (all share top T)
const pen = { x0: 5, x1: 12, z0: 5, z1: 9 };
let allIn = true;
for (let x = pen.x0; x <= pen.x1; x++) {
  for (let z = pen.z0; z <= pen.z1; z++) {
    if (!cellMap.has(key(x, z)) || face(x, z) !== null) allIn = false;
  }
}
if (allIn && T + 2 < H) {
  for (let x = pen.x0; x <= pen.x1; x++) {
    for (let z = pen.z0; z <= pen.z1; z++) {
      const ring = x === pen.x0 || x === pen.x1 || z === pen.z0 || z === pen.z1;
      if (ring) {
        g.set(x, T, z, "light_gray_concrete");
        g.set(x, T + 1, z, "light_gray_concrete");
      }
      g.set(x, T + 2, z, "stone_bricks");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
