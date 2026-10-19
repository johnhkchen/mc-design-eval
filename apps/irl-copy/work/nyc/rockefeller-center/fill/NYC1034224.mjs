// 19 West 44th Street, Berkeley Building: a 1916 Midtown office block, 19 storeys, built to the lot line on a
// 16 x 37 footprint (the front is the low-z face, the 44th Street frontage, 16 blocks wide; the 15-wide south end is
// the L where the lot steps in). Read from the lidar as three clean tiers, the way the 1916 setback law shaped
// Midtown: a 2-block lower wing (58) around the front and the edges, the body (61) rising behind it, and a crown (62)
// over the north-central core. Limestone base (calcite) for the first two storeys, a shopfront with a recessed-free
// entrance (double iron doors under a calcite lintel) on the front, then a brick shaft with a calcite course at every
// floor line (storeys of 3 blocks, floor lines at y 5, 8, ..., 59). Each window is two glass panes between a brick pier,
// with air behind the pane and a warm glowstone behind some of them; no interiors, the core is solid. Parapet walls
// stand on the lower wing's outer edge and the body is capped with calcite. Every column is filled from the foundation
// to its roof, so every tier stands on what is below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034224.cells.json`, "utf8"));
const X = 16, Y = 64, Z = 37;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof (57-62) as three flat tiers: 58 for the lower wing, 61 for the body, 62 for the crown.
const top = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const r = cell.get(`${x},${z}`).roof;
  return r <= 58 ? 58 : r >= 62 ? 62 : 61;
};
const open = (x, y, z) => !inFoot(x, z) || top(x, z) <= y;

const FOUND = "stone_bricks", CORE = "stone", BAND = "calcite", BRICK = "bricks", CAP = "calcite";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone", WALL = "stone_brick_wall";
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };     // outward; N is the 44th Street front
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };       // from the face into the building
const FK = { N: 0, S: 1, W: 2, E: 3 };
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 5 === 0;       // about one window in five, deterministic and warm
const faces = (x, y, z) => Object.keys(DIRS).filter((d) => open(x + DIRS[d][0], y, z + DIRS[d][1]));

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);
const glass = [];

// 1. Massing: foundation under the ground line, a solid core to each column's roof.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), t = top(x, z);
  for (let y = 0; y < t; y++) g.set(x, y, z, y < ground ? FOUND : CORE);
}

// Window or wall material on one face: a glass pane (with air or a warm light behind it) or a frame block.
const pane = (x, y, z, d) => {
  glass.push([x, y, z]);
  const [ix, iz] = IN[d], k = FK[d];
  const u = d === "N" || d === "S" ? x : z;
  if (lit(u, y, k)) g.set(x + ix, y, z + iz, LIGHT); else g.set(x + ix, y, z + iz, "air");
  return GLASS;
};

// The 44th Street shopfront: calcite piers at the corners and flanking the entrance, a calcite bulkhead and lintel,
// glass between, and a pair of iron doors in the middle under a calcite lintel.
const shopfront = (x, y, z, ground) => {
  if (x === 0 || x === 15 || x === 6 || x === 9) return BAND;
  if (x === 7 || x === 8) {
    if (y === ground || y === ground + 1) return "iron_door";
    return BAND;
  }
  if (y === ground || y === 4) return BAND;
  return pane(x, y, z, "N");
};

// 2. Facades: each exposed wall cell takes the skin of its face. Floor lines every 3 blocks from y 5; the first two
// storeys are limestone and the shaft above is brick; windows are the two of every three columns between piers.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), t = top(x, z);
  for (let y = ground; y < t; y++) {
    if (y === t - 1) { g.set(x, y, z, CAP); continue; }      // roof surface
    const fs = faces(x, y, z);
    if (!fs.length) continue;
    const d = ["N", "S", "W", "E"].find((f) => fs.includes(f));
    const u = d === "N" || d === "S" ? x : z;
    const pier = u % 3 === 0;
    const pierMat = y < 8 ? BAND : BRICK;
    if (d === "N" && y < 5) {
      const b = shopfront(x, y, z, ground);
      if (b === "iron_door") {
        const half = y === ground ? "lower" : "upper";
        g.set(x, y, z, "iron_door", { facing: "north", half, hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
      } else if (b === GLASS) g.set(x, y, z, b, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      else g.set(x, y, z, b);
      continue;
    }
    if (y < 5) {                                              // the ground floor on the side walls
      if (y > ground && y < 4 && !pier) g.set(x, y, z, pane(x, y, z, d), { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      else g.set(x, y, z, BAND);
      continue;
    }
    const rel = (y - 5) % 3;
    if (rel === 0) g.set(x, y, z, BAND);                      // floor line
    else if (rel === 1 && !pier) g.set(x, y, z, pane(x, y, z, d), { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    else g.set(x, y, z, pierMat);
  }
}

// 3. Parapet on the lower wing's outer edge (a terrace behind it at y 57). Each wall joins its neighbours.
const EDGE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outerEdge = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inFoot(x + dx, z + dz));
for (const [x, z] of cols) {
  if (top(x, z) === 58 && outerEdge(x, z)) g.set(x, 58, z, WALL);
}
for (const [x, z] of cols) {
  if (top(x, z) !== 58 || !outerEdge(x, z)) continue;
  const s = {};
  for (const [side, [dx, dz]] of Object.entries(EDGE)) s[side] = g.get(x + dx, 58, z + dz) ? "low" : "none";
  g.set(x, 58, z, WALL, { ...s, up: "true", waterlogged: "false" });
}

// 4. Panes connect to the solid or glazed neighbours beside them.
for (const [x, y, z] of glass) {
  const nb = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, GLASS, { north: nb(0, -1), south: nb(0, 1), east: nb(1, 0), west: nb(-1, 0), waterlogged: "false" });
}

const counts = g.save(`${DIR}/NYC1034224.nbt`);
console.log(`NYC1034224: ${counts.blocks} blocks, ${counts.palette} palette entries, size ${X} x ${Y} x ${Z}`);
