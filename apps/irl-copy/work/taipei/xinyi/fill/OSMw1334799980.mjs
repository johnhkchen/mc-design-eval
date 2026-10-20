import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334799980";
const W = 19, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint: key "x,z" -> foundation ground (clamped so the two storeys and roof still fit)
const inside = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  inside.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => inside.has(`${x},${z}`);
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const OFF = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// Exposed (outward-facing) sides of each footprint cell
const ex = new Map();
for (const k of inside.keys()) {
  const [x, z] = k.split(",").map(Number);
  const e = [];
  if (!has(x, z - 1)) e.push("north");
  if (!has(x, z + 1)) e.push("south");
  if (!has(x + 1, z)) e.push("east");
  if (!has(x - 1, z)) e.push("west");
  ex.set(k, e);
}

// Street entrance: a single-sided perimeter cell near the middle of the north (street) face
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
let door = null, best = Infinity;
for (const [k] of inside) {
  const e = ex.get(k);
  if (!e.length) continue;
  const [x] = k.split(",").map(Number);
  const score = Math.abs(x - cx) + (e.includes("north") ? 0 : 100) + (e.length > 1 ? 50 : 0);
  if (score < best) { best = score; door = k; }
}

const s = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

// Levels: foundation below each cell's ground, floor at ground, upper floor at y5,
// cornice y9, roof cap y10 (roof surface ~11), penthouse y11-13.
for (const [k, gd] of inside) {
  const [x, z] = k.split(",").map(Number);
  const e = ex.get(k);
  const perim = e.length > 0;
  const corner = e.length >= 2;
  const t = perim && !corner ? (x + z) % 3 : -1; // 0 wall, 1 window bay, 2 pier

  // foundation and ground floor slab
  for (let y = 0; y < gd; y++) s(x, y, z, "stone_bricks");
  s(x, gd, z, "smooth_stone");
  // upper floor slab
  if (gd < 5) s(x, 5, z, "smooth_stone");
  // roof cap
  s(x, 10, z, perim ? "white_concrete" : "gray_concrete");

  if (!perim) continue;

  const isDoor = k === door;
  for (let y = gd + 1; y <= 9; y++) {
    let id;
    if (y === 9) id = "quartz_block";                       // cornice
    else if (corner) id = "light_gray_concrete";            // corner pilaster
    else if (t === 1) {
      const shop = gd < 4 && y >= gd + 1 && y <= 3;
      const upper = y >= 6 && y <= 8;
      id = shop || upper ? "light_blue_stained_glass" : "white_concrete";
    } else if (t === 2) id = "light_gray_concrete";
    else id = "white_concrete";

    if (y === 4 && gd < 4) id = "light_gray_concrete";      // ground-floor lintel band
    if (y === 5 && gd < 5) id = "smooth_stone";             // storey line

    if (isDoor && (y === gd + 1 || y === gd + 2)) {
      const facing = e.includes("north") ? "north" : e[0];
      const half = y === gd + 1 ? "lower" : "upper";
      s(x, y, z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    s(x, y, z, id);
  }

  // Warm light behind some window bays
  if (t === 1 && e.length === 1 && (x * 7 + z * 13) % 4 === 0) {
    const [dx, dz] = OFF[OPP[e[0]]];
    const ix = x + dx, iz = z + dz;
    const ik = `${ix},${iz}`;
    if (inside.has(ik) && ex.get(ik).length === 0) {
      s(ix, 7, iz, "glowstone");
      if (gd < 4 && gd + 2 <= 3) s(ix, gd + 2, iz, "glowstone");
    }
  }
}

// Rooftop penthouse on the interior of the roof, sitting on the roof cap at y10
const bx0 = 6, bx1 = 12, bz0 = 6, bz1 = 12;
for (let x = bx0; x <= bx1; x++) {
  for (let z = bz0; z <= bz1; z++) {
    const k = `${x},${z}`;
    if (!inside.has(k) || ex.get(k).length) continue;
    const border = x === bx0 || x === bx1 || z === bz0 || z === bz1;
    for (let y = 11; y <= 12; y++) {
      if (!border) continue; // interior air
      const mid = y === 11 ? false : (x + z) % 2 === 0;
      s(x, y, z, mid ? "light_blue_stained_glass" : "white_concrete");
    }
    s(x, 13, z, "light_gray_concrete"); // penthouse cap
  }
}

// Rooftop AC units on interior roof cells
for (const [x, z] of [[4, 4], [14, 13], [5, 14]]) {
  const k = `${x},${z}`;
  if (inside.has(k) && ex.get(k).length === 0) s(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
