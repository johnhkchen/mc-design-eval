// 1350 Avenue of the Americas, the MGM Building (1966): a commercial office tower of bronze-grey glass in iron-framed bays,
// on a granite-and-limestone base. Footprint 13 x 18, x across (low z = uptown, the avenue runs along z so the x = 0 face
// is the avenue frontage). Lidar roof: 119 over most of the footprint, a 67-block shoulder at the SW corner and a 38-block
// low wing across the south end. Each cell's foundation is stone from y 0 to its ground. The skin is one block of glass
// (or spandrel and mullion) on the outside, a one-block air gap behind it with a floor slab per storey, and a solid
// core inside, so nothing is an interior. Storey lines sit on y % 3 == 0 across every tier. Three-block base: shopfront
// piers and clear glass, a granite band, then the tower. Lobby on the x = 0 face at z 7: iron door, glass either side,
// a granite lintel over it. Penthouse on the roof. Warm glowstone sits behind some panes in the air gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034815.cells.json`, "utf8"));
const X = 13, Y = 132, Z = 18;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundOf = (x, z) => cell.get(`${x},${z}`).ground;

// Flat tiers read from the lidar: 100+ is the tower (noise between 112 and 120 and one missed cell at 1 are tower too),
// 60-80 is the SW shoulder, anything lower is the south wing.
const TOP = (x, z) => {
  const r = cell.get(`${x},${z}`).roof;
  return r >= 100 || r < 10 ? 119 : r >= 60 ? 67 : 38;
};

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Solid below its ground (the foundation) and up to its top: a cell is built at y when it is a foundation or under its top.
const built = (x, z, y) => inFoot(x, z) && (y < groundOf(x, z) || TOP(x, z) > y);

// Depth from the outside at height y: 0 = the outer skin (touches air), 1 = the air gap behind the glass, 2+ = the core.
const depthsAt = (y) => {
  const d = new Map(), q = [];
  for (const k of cell.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!built(x, z, y) || y < groundOf(x, z)) continue;
    if (N4.some(([dx, dz]) => !built(x + dx, z + dz, y))) { d.set(k, 0); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], dk = d.get(`${x},${z}`);
    for (const [dx, dz] of N4) {
      const nx = x + dx, nz = z + dz, nk = `${nx},${nz}`;
      if (!built(nx, nz, y) || y < groundOf(nx, nz) || d.has(nk)) continue;
      d.set(nk, dk + 1); q.push([nx, nz]);
    }
  }
  return d;
};
const depth = Array.from({ length: Y }, (_, y) => depthsAt(y));

const g = new Voxels([X, Y, Z]);
const windows = [];   // [x, y, z, inX, inZ]: a glass pane and the air cell behind it

// Outward normal of an outer-skin cell: the first open neighbour.
const normalOf = (x, z, y) => N4.find(([dx, dz]) => !built(x + dx, z + dz, y));
const planeState = (dx, extra = {}) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false", ...extra }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false", ...extra });

// The skin of an outer cell: a base course to y 6, then storey spandrels on y % 3 == 0, iron mullions every third column,
// grey glass between. The ground storey (y < 3) is a shopfront: granite piers, clear glass.
const skin = (x, z, y, [dx, dz]) => {
  const u = dx !== 0 ? z : x;                         // position along the face
  const put = (name, state) => g.set(x, y, z, name, state);
  if (y < 3) {
    if (u % 3 === 0) return put("polished_granite");
    put("glass_pane", planeState(dx));
    windows.push([x, y, z, dx, dz]);
    return;
  }
  if (y % 3 === 0) return put(y === 3 ? "polished_granite" : "light_gray_concrete");   // base course, then spandrels
  if (u % 3 === 0) return put("iron_block");
  put("gray_stained_glass_pane", planeState(dx));
  windows.push([x, y, z, dx, dz]);
};

for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const top = TOP(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");            // foundation to the cell's ground
  for (let y = ground; y < top; y++) {
    const dep = depth[y].get(k);
    if (dep === 0) {
      if (y === top - 1) { g.set(x, y, z, "calcite"); continue; }              // cornice on the outer edge
      skin(x, z, y, normalOf(x, z, y));
    } else if (dep === 1) {
      if (y === top - 1 || y % 3 === 0) g.set(x, y, z, "light_gray_concrete"); // roof and storey slabs close the gap
    } else {
      g.set(x, y, z, "stone");                                                  // solid core
    }
  }
  if (depth[top - 1]?.get(k) === 0) g.set(x, top, z, "light_gray_concrete");   // parapet on the outer edge
}

// Glowstone behind some panes: the air cell inside each lit window (one in eleven, deterministic).
for (const [x, y, z, dx, dz] of windows) {
  const u = dx !== 0 ? z : x;
  if ((u + 2 * Math.floor(y / 3) + (dx !== 0 ? 0 : 5)) % 11 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  if (g.get(ix, y, iz) === null) g.set(ix, y, iz, "glowstone");
}

// Lobby on the avenue face (x = 0): iron double door at z 7, glass either side, a granite lintel over the entrance.
const y0 = groundOf(0, 7);
const doorState = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });
g.set(0, y0, 7, "iron_door", doorState("lower"));
g.set(0, y0 + 1, 7, "iron_door", doorState("upper"));
for (const z of [6, 8]) {
  g.set(0, y0, z, "glass_pane", planeState(-1));
  g.set(0, y0 + 1, z, "glass_pane", planeState(-1));
}
for (const z of [5, 6, 7, 8, 9]) g.set(0, y0 + 2, z, "polished_granite");

// Penthouse on the roof: a 5 x 5 block of stone, a calcite band at the top, a lit slot on the south side.
for (let y = 119; y < 122; y++) for (let x = 4; x <= 8; x++) for (let z = 4; z <= 8; z++)
  g.set(x, y, z, y === 121 ? "calcite" : "light_gray_concrete");
for (let x = 5; x <= 7; x++) g.set(x, 120, 8, "glowstone");

const { blocks, palette } = g.save(`${DIR}/NYC1034815.nbt`);
console.log(`NYC1034815: ${blocks} blocks, ${palette} palette entries`);
