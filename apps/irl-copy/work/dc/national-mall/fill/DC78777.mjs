// 20 F St NW (Commercial-Office-Large), a Washington office block of the 1920s-30s: light Indiana-style limestone field,
// smooth-stone bands, a granite base, glazed bays with stone piers and a flat stepped roof. Lidar roof: 16 for the mass,
// 18 for the core (a 2-block step back from the edge), 3 to 5 for the low wings. One storey = 3 blocks (the lidar gives
// about 18 blocks over about 5 storeys; a 1-block storey would not hold a window).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78777.cells.json`, "utf8"));
const W = 14, D = 31, SPAN = [5, 8, 11, 14];          // absolute storey string-course rows
const K = (x, z) => `${x},${z}`;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];        // W, E, N, S: the facade priority order
const FACE = ["W", "E", "N", "S"];

const cell = new Map();
for (const [x, z, g, rr] of cells) cell.set(K(x, z), { x, z, g, rr });
const inFp = (x, z) => cell.has(K(x, z));
const isTall = (x, z) => inFp(x, z) && cell.get(K(x, z)).rr >= 17;

// Core = tall cells at least 2 from any lower or missing cell: the 18-block core, with the 16-block ring stepped down round it.
const dist = new Map(), q = [];
for (let z = -1; z <= D; z++) for (let x = -1; x <= W; x++) if (!isTall(x, z)) { dist.set(K(x, z), 0); q.push([x, z]); }
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d0 = dist.get(K(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (nx < 0 || nz < 0 || nx >= W || nz >= D || !isTall(nx, nz) || dist.has(K(nx, nz))) continue;
    dist.set(K(nx, nz), d0 + 1); q.push([nx, nz]);
  }
}

for (const c of cell.values()) {
  const { x, z, rr, g } = c;
  const core = isTall(x, z) && dist.get(K(x, z)) >= 2;
  c.core = core;
  c.top = rr >= 16 ? (core ? 18 : 16) : rr >= 4 ? 5 : 3;               // lidar tiers, snapped
  c.top = Math.max(c.top, g + 2);
}
for (const c of cell.values()) {
  const { x, z } = c;
  // An exposed face: open to the air (edge of the footprint) or stepping down to a lower tier; both get the facade.
  const exposed = DIRS.map(([dx, dz], i) => { const n = cell.get(K(x + dx, z + dz)); return !n || n.top < c.top ? i : -1; }).filter((i) => i >= 0);
  c.perim = exposed.length > 0;
  c.corner = exposed.length >= 2;
  c.face = c.perim ? exposed[0] : -1;                                  // outward face of a perimeter cell
  c.out = c.face >= 0 ? DIRS[c.face] : null;
  c.k = c.face === 0 || c.face === 1 ? z : x;                          // position along the face (piers by it)
  c.entry = x === 0 && (z === 14 || z === 15);                         // the F Street-side entrance, a pair of doors
}

// Facade of a perimeter cell at height y: returns [block, state] (or null for nothing).
function facade(c, y) {
  const { g, top } = c;
  if (y === top - 1) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];   // parapet cap
  if (y === g) return ["polished_granite"];                                                  // base course
  if (c.entry && (y === g + 1 || y === g + 2))
    return ["dark_oak_door", { facing: "east", half: y === g + 1 ? "lower" : "upper", hinge: c.z === 14 ? "left" : "right", open: "false", powered: "false" }];
  if (c.entry && y === g + 3) return ["polished_granite"];                                    // lintel over the doors
  if (y === top - 2 && top - 2 > g + 1) return ["smooth_quartz"];                              // cornice
  if (c.corner) return ["smooth_quartz"];                                                      // corner pilaster
  if (SPAN.includes(y) && y < top - 2) return ["smooth_quartz"];                               // storey string course
  const ground = y <= 4;
  const pier = ground ? c.k % 6 === 0 : c.k % 3 === 0;                                          // shopfront glass below 5, bays above
  return pier ? ["calcite"] : ["light_blue_stained_glass"];
}

// Air gap: the interior cell straight behind a window (and only there), so the glass has depth but no rooms.
const gap = new Map();
for (const c of cell.values()) {
  if (!c.perim || !c.out) continue;
  const ix = c.x - c.out[0], iz = c.z - c.out[1];
  if (!inFp(ix, iz) || cell.get(K(ix, iz)).perim) continue;
  for (let y = c.g; y < c.top; y++) {
    const f = facade(c, y);
    if (f && f[0] === "light_blue_stained_glass") {
      if (!gap.has(K(ix, iz))) gap.set(K(ix, iz), new Set());
      gap.get(K(ix, iz)).add(y);
    }
  }
}

const v = new Voxels([W, 30, D]);
for (const c of cell.values()) {
  const { x, z, g, top } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");                                    // foundation to the lowest ground
  for (let y = g; y < top; y++) {
    if (c.perim) {
      const f = facade(c, y);
      if (f) v.set(x, y, z, f[0], f[1]);
    } else if (y === top - 1) v.set(x, y, z, "light_gray_concrete");                                    // roof membrane
    else if (gap.has(K(x, z)) && gap.get(K(x, z)).has(y)) {
      if ((x * 31 + z * 17 + y * 7) % 11 === 0) v.set(x, y, z, "glowstone");                       // warm light behind some glass
    } else v.set(x, y, z, "stone");
  }
  if (!c.perim && (x * 5 + z * 3) % 17 === 0) v.set(x, top, z, "iron_block");                    // roof plant
}
v.save(`${DIR}/DC78777.nbt`);
