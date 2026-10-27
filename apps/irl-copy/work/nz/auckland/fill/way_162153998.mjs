// Mazuran's Building (way 162153998), Eden Terrace side of Maungawhau's view: a 1970s brick-and-concrete office
// block. A two-storey brick body (lidar roof 10) covers the footprint; a six-storey pale-concrete tower stands on the
// SE lobe where the lidar's tall cells sit (lidar 22 under a setback crown at 26). The solid mass is recessed:
// glass sits in the outer face with an air gap behind, a floor band per storey, so nothing floats and there are no
// interiors. Some windows get a warm light in the gap behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162153998.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 22, D = 35, HY = 39;

const GROUND = new Map(), LIDAR = new Map();
for (const [x, z, g, r] of cells) { GROUND.set(`${x},${z}`, g); LIDAR.set(`${x},${z}`, r); }
const inFoot = (x, z) => GROUND.has(`${x},${z}`);

// Massing: the largest rectangle inside the footprint that holds the lidar's tall cells (14 of 17 with roof >= 18),
// rising to 22; a setback crown (inset 2) to 26; the body is the lidar's 10 everywhere else.
const TOWER = { x0: 10, x1: 19, z0: 23, z1: 31, top: 22 };
const CROWN = { x0: 12, x1: 17, z0: 25, z1: 29, top: 26 };
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const roofAt = (x, z) => (inBox(CROWN, x, z) ? CROWN.top : inBox(TOWER, x, z) ? TOWER.top : 10);
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < roofAt(x, z);

// [dx, dz, facing] for the four outward faces
const FACES = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const exposed = (x, y, z) => FACES.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const isTower = (x, z) => roofAt(x, z) > 10;
// The grammar follows height: the brick body below 10 (its storeys run from the ground, even under the tower's edge),
// the concrete tower from 10 (its first storey), and the crown from 22.
const tierAt = (x, y, z) => (y < 10 ? { tower: false, base: 0 } : y < 22 ? { tower: isTower(x, z), base: 10 } : { tower: true, base: 22 });

// Materials
const M = {
  body: { wall: "bricks", band: "stone_bricks", cap: "smooth_stone", interior: "stone" },
  tower: { wall: "white_concrete", band: "light_gray_concrete", cap: "smooth_stone", interior: "stone" },
  glass: "light_blue_stained_glass_pane",
  foundation: "stone_bricks",
  roof: "gravel",
  plant: "light_gray_concrete",
};

const cellKey = (x, y, z) => `${x},${y},${z}`;
const occ = new Map();      // "x,y,z" -> { block, state }
const carve = new Set();    // air gaps behind glass
const warm = new Map();     // carve key -> warm block name
const panes = [];           // { x, y, z, along: "ns" | "ew" }

const put = (x, y, z, block, state) => occ.set(cellKey(x, y, z), { block, state });

// The face rule for one exposed block: rows by storey from the tier's base, windows on the 2 middle rows of each
// 4-block storey, piers every third cell, a plinth on the ground, and the door/canopy on the entrance bay.
function facade(x, y, z, [dx, dz, facing]) {
  const { tower, base } = tierAt(x, y, z), mat = tower ? M.tower : M.body;
  const r = y - base;
  const u = dx !== 0 ? z : x;                              // along-face coordinate
  const entrance = facing === "west" && x === 0 && z >= 4 && z <= 6 && y <= 3;
  if (entrance && y === 3) return { block: "stone_brick_slab", state: { type: "top", waterlogged: "false" } };
  if (entrance && z === 5 && (y === 1 || y === 2)) return { door: true };
  if (r % 4 !== 1 && r % 4 !== 2) return { block: mat.band };
  // window row
  const inward = [x - dx, y, z - dz];
  const inwardExposed = exposed(inward[0], y, inward[2]).length > 0;
  if (!entrance && (u % 3 === 0 || inwardExposed)) return { block: mat.wall };
  return { glass: true, facing, carveAt: inward, u, tower };
}

// First pass: decide every block, record the carved air gaps (behind glass) and the warm lights.
const plan = [];
for (const key of GROUND.keys()) {
  const [x, z] = key.split(",").map(Number);
  const g = GROUND.get(key), top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    if (y < g) { plan.push([x, y, z, { block: M.foundation }]); continue; }
    const exps = exposed(x, y, z);
    if (y === top - 1) {
      plan.push([x, y, z, exps.length ? { block: M.body.cap } : { block: M.roof }]); continue;
    }
    if (!exps.length) { plan.push([x, y, z, { block: isTower(x, z) ? M.tower.interior : M.body.interior }]); continue; }
    plan.push([x, y, z, { face: facade(x, y, z, exps[0]) }]);
  }
}

// Resolve faces: doors, glass with carved gaps, plain blocks.
const pending = [];
for (const [x, y, z, p] of plan) {
  if (!p.face) { pending.push([x, y, z, p]); continue; }
  const f = p.face;
  if (f.door) { pending.push([x, y, z, { door: f }]); continue; }
  if (f.glass) {
    pending.push([x, y, z, { glass: f }]);
    const [cx, cy, cz] = f.carveAt; carve.add(cellKey(cx, cy, cz));
    panes.push({ x, y, z, facing: f.facing });
    continue;
  }
  pending.push([x, y, z, { block: f.block, state: f.state }]);
}
// Warm lights: some windows get a lamp in the gap behind the glass (glowstone in the body, shroomlight in the tower).
for (const p of panes) {
  if ((p.x + p.y + p.z) % 7 !== 0) continue;
  const f = p.facing === "west" ? [1, 0] : p.facing === "east" ? [-1, 0] : p.facing === "north" ? [0, 1] : [0, -1];
  const c = cellKey(p.x + f[0], p.y, p.z + f[1]);
  if (carve.has(c)) warm.set(c, tierAt(p.x, p.y, p.z).tower ? "shroomlight" : "glowstone");
}

for (const [x, y, z, p] of pending) {
  if (p.door) { put(x, y, z, M.body.wall); continue; }   // the door itself goes in below
  if (p.glass) continue;
  if (p.block) put(x, y, z, p.block, p.state);
}
// Door (lower and upper halves) and its gap
for (const y of [1, 2]) {
  put(0, y, 5, "iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
// Glass (state set after the panes' neighbours are known) and the gaps behind them.
const glassAt = new Set(panes.map((p) => cellKey(p.x, p.y, p.z)));
for (const p of panes) put(p.x, p.y, p.z, M.glass, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
const carveKeys = [...carve];
for (const c of carveKeys) occ.delete(c);
for (const [c, b] of warm) occ.set(c, { block: b, state: undefined });

// Pane connections: each glass joins its neighbours along the face (glass or any solid block), like vanilla panes.
const solidAt = (x, y, z) => occ.has(cellKey(x, y, z));
for (const p of panes) {
  const along = p.facing === "west" || p.facing === "east"
    ? [["north", 0, -1], ["south", 0, 1]] : [["west", -1, 0], ["east", 1, 0]];
  const st = occ.get(cellKey(p.x, p.y, p.z)).state;
  for (const [side, dx, dz] of along) {
    const nx = p.x + dx, nz = p.z + dz;
    st[side] = (solidAt(nx, p.y, nz) || glassAt.has(cellKey(nx, p.y, nz))) ? "true" : "false";
  }
}

// Rooftop plant: a lift and plant room on the crown, and HVAC units on the body roof.
for (const x of [14, 15]) for (const z of [26, 27]) {
  put(x, 26, z, M.plant); put(x, 27, z, M.plant); put(x, 28, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// Plant sits on the body roof only where all eight neighbours are body roof too (so it is well inside the parapet).
const AROUND = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const ac = [];
for (const key of GROUND.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (AROUND.every(([dx, dz]) => inFoot(x + dx, z + dz) && roofAt(x + dx, z + dz) === 10)) ac.push([x, z]);
}
for (const [x, z] of ac.filter((_, i) => i % 9 === 4).slice(0, 3)) { put(x, 10, z, "iron_block"); put(x, 11, z, "iron_block"); }

// Write
const g = new Voxels([W, HY, D]);
for (const [key, { block, state }] of occ) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = `${DIR}/way_162153998.nbt`;
const res = g.save(out);
const counts = {};
for (const { block } of occ.values()) counts[block] = (counts[block] || 0) + 1;
console.log(JSON.stringify({ file: out, blocks: res.blocks, palette: res.palette, counts }, null, 1));
