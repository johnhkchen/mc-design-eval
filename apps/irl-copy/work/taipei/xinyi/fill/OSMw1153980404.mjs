import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980404";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey low-rise commercial block, white tile/concrete with a dark stone base,
// shopfront ground floor, a stone cornice and parapet, roof at y = 11.
const W = 22, H = 23, D = 17;
const ROOF = 11;     // parapet top, about 11 blocks above lowest ground
const FLOOR1 = 5;    // first storey line
const FLOOR2 = 10;   // roof slab level

const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

// place a block only inside the bounds and above this cell's ground
function put(x, y, z, b, p) {
  if (!has(x, z) || !inB(x, y, z) || y <= gnd(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// outward faces of a perimeter cell: 'N' is -z, 'S' is +z, 'W' is -x, 'E' is +x
const FACES = {
  N: { dx: 0, dz: -1, along: "x", glass: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } },
  S: { dx: 0, dz: 1, along: "x", glass: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } },
  W: { dx: -1, dz: 0, along: "z", glass: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } },
  E: { dx: 1, dz: 0, along: "z", glass: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } },
};

function exposedFaces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  if (!has(x - 1, z)) out.push("W");
  if (!has(x + 1, z)) out.push("E");
  return out;
}

// 1. Foundations: solid stone from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) {
    if (inB(x, y, z)) g.set(x, y, z, "stone_bricks");
  }
}

// 2. Floor slabs across every footprint cell
for (const [x, z] of cells) {
  put(x, FLOOR1, z, "light_gray_concrete");
  put(x, FLOOR2, z, "smooth_stone");
}

// 3. Perimeter walls, shopfront, windows, cornice, parapet
let doorCell = null;
let minZ = Infinity;
for (const [x, z] of cells) if (z < minZ) minZ = z;
const northXs = cells.filter(([x, z]) => z === minZ && !has(x, z - 1)).map(([x]) => x);
if (northXs.length) {
  const midX = Math.round((Math.min(...northXs) + Math.max(...northXs)) / 2);
  const pick = northXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), northXs[0]);
  doorCell = { x: pick, z: minZ };
}

for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  if (!faces.length) continue; // interior cell: floors only
  const base = gr + 1;
  const f = faces[0];
  const F = FACES[f];
  const idx = F.along === "x" ? x : z;
  const inward = { x: x - F.dx, z: z - F.dz };
  const isWinCol = idx % 4 === 1 || idx % 4 === 2;

  for (let y = base; y <= ROOF; y++) {
    if (!inB(x, y, z)) continue;

    // plinth
    if (y === base) { put(x, y, z, "stone_bricks"); continue; }

    // ground storey: shopfront glass with pillars, lintel course
    if (y > base && y < FLOOR1) {
      if (y === base + 1 && doorCell && x === doorCell.x && z === doorCell.z) continue; // door set later
      if (y <= base + 3 && isWinCol) put(x, y, z, "glass_pane", F.glass);
      else put(x, y, z, "white_concrete");
      continue;
    }

    // first-floor belt course
    if (y === FLOOR1) { put(x, y, z, "light_gray_concrete"); continue; }

    // upper storey: spandrels above and below, glass in the middle band
    if (y > FLOOR1 && y < FLOOR2) {
      if ((y === 7 || y === 8) && isWinCol) {
        put(x, y, z, "glass_pane", F.glass);
        // occasional warm light behind the pane (inside the footprint)
        if (y === 7 && idx % 8 === 1 && has(inward.x, inward.z) && !exposedFaces(inward.x, inward.z).length) {
          put(inward.x, y, inward.z, "glowstone");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // cornice course at the roof slab
    if (y === FLOOR2) { put(x, y, z, "smooth_stone"); continue; }

    // parapet
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }
    if (y > FLOOR2 && y < ROOF) put(x, y, z, "white_concrete");
  }
}

// 4. Entrance on the north face: double-height door and a dark oak canopy
if (doorCell) {
  const { x, z } = doorCell;
  const base = gnd(x, z) + 1;
  if (inB(x, base + 1, z)) {
    g.set(x, base + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, base + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  for (const dx of [-1, 0, 1]) {
    const cx = x + dx;
    if (has(cx, z) && inB(cx, base + 3, z)) {
      g.set(cx, base + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// 5. Roof equipment: small plant boxes with a grille on top, on interior cells
for (const [x, z] of cells) {
  if (exposedFaces(x, z).length) continue;
  if (x % 5 === 2 && z % 5 === 2 && inB(x, ROOF, z)) {
    g.set(x, ROOF, z, "light_gray_concrete");
    if (inB(x, ROOF + 1, z)) g.set(x, ROOF + 1, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
