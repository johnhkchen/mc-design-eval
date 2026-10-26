// 1400 20th St NW: a 1910s-20s Washington apartment block under the Height Act (90 ft street wall, a 110 ft
// tower core). Red brick on a stone plinth, limestone string courses, quoins and cornice, punched window bays
// with a few lit windows, a centred entrance on the 20th St (west) front, and a flat roof with a stair penthouse.
// Massing follows the lidar roof: a 3x3 mode filter over raw tiers (<=9 wing, 10-13 main, 14+ tower).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59573.cells.json`, "utf8"));

const BRICK = "bricks", LIME = "calcite", BASE = "stone_bricks", GLASS = "glass_pane";
const LIT = "glowstone", FLOOR = "smooth_stone", ROOF = "deepslate", PENT = "smooth_stone";

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => raw.has(key(x, z));
const tierOf = (r) => (r <= 9 ? 8 : r <= 13 ? 12 : 14);

// mode of the 3x3 tiers, so lidar noise becomes flat tiers and a single stray cell can't make a bump
const height = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const q = raw.get(key(x + dx, z + dz)); if (!q) continue;
    const t = tierOf(q.r); count.set(t, (count.get(t) || 0) + 1 + (dx === 0 && dz === 0 ? 0.5 : 0));
  }
  height.set(k, [...count].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]);
}
const H_ = (x, z) => height.get(key(x, z));   // solid layers are 0 .. H_-1; the top layer is the roof cap
const ground = (x, z) => raw.get(key(x, z)).g;

// floor lines: a storey every two blocks (window row + line), the ground floor 3 high; the top of each tier is its cap
const SLAB = new Set([1, 4, 6, 8, 10, 12]);
const STRING = new Set([4, 8, 12]);   // limestone string courses; the other floor lines are brick spandrels
const DIRS = { x: [[-1, 0], [1, 0]], z: [[0, -1], [0, 1]] };

// exposure of the cell at height y to each side: outside the footprint, or the neighbour has no solid at y
function exposure(x, z, y) {
  const out = { x: false, z: false };
  for (const axis of ["x", "z"]) for (const [dx, dz] of DIRS[axis]) {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || H_(nx, nz) - 1 < y) out[axis] = true;
  }
  return out;
}

const g = new Voxels([13, 26, 40]);

// the entrance: on the 20th St (west) front, in a window bay, at a cell with a full wall
const doorZ = [4, 5, 6, 3, 7].find((z) => inF(0, z) && H_(0, z) === 12 && z % 3 === 1);

// windows: pier or pane, a warm window now and then (glowstone set into the glass row)
function facade(x, z, y, axis, u, top) {
  if (y === 0 || y === 1) return [BASE];
  if (y === top || STRING.has(y)) return [LIME];
  if (SLAB.has(y)) return [BRICK];
  const pier = u % 3 === 0;
  if (pier) return [BRICK];
  if (axis === "x" && x === 0 && z === doorZ && (y === 2 || y === 3)) {
    return ["door", y === 2 ? "lower" : "upper"];
  }
  if (((u * 5 + y * 3 + (axis === "x" ? 7 : 0)) % 11) === 0) return [LIT];
  return [GLASS, axis];
}

// 1) plinth, floors and roof, and the walls on exposed sides
for (const [k, { g: gr }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const top = H_(x, z) - 1;
  for (let y = 0; y <= top; y++) {
    const ex = exposure(x, z, y);
    const exposed = ex.x || ex.z;
    if (!exposed) {
      if (y === 0 || y === 1 || SLAB.has(y)) g.set(x, y, z, y === 0 ? BASE : FLOOR);
      else if (y === top) g.set(x, y, z, ROOF);
      continue;   // air behind the glass
    }
    if (y === 0 && gr === 0) { g.set(x, y, z, BASE); continue; }   // lowest ground: plinth fill
    const corner = ex.x && ex.z;
    const axis = ex.x ? "x" : "z";
    const u = axis === "x" ? z : x;
    const r = corner ? [LIME] : facade(x, z, y, axis, u, top);
    if (r[0] === "door") {
      g.set(x, y, z, "dark_oak_door", { facing: "west", half: r[1], hinge: "left", open: "false", powered: "false" });
    } else if (r[0] === GLASS) {
      g.set(x, y, z, GLASS, axis === "x" ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    } else {
      g.set(x, y, z, r[0]);
    }
  }
}

// 2) a stair penthouse on the tower's roof (two layers, limestone cornice), standing on its cap
for (let z = 22; z <= 23; z++) for (let x = 5; x <= 7; x++) {
  if (!inF(x, z) || H_(x, z) !== 14) continue;
  const edge = x === 5 || x === 7 || z === 22 || z === 23;
  const base = H_(x, z) - 1 + 1;   // first layer above the cap
  if (edge) { g.set(x, base, z, PENT); g.set(x, base + 1, z, LIME); }
  else { g.set(x, base + 1, z, PENT); }
}

const res = g.save(`${DIR}/DC59573.nbt`);
console.log(JSON.stringify(res));
