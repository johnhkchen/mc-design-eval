import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 2012 Massachusetts Ave NW (Beale, Joseph House): a 1920s red-brick commercial office block on Embassy Row,
// three storeys of 3 blocks on a granite plinth, calcite (limestone) sills, lintels, quoins and a cornice,
// a shopfront with a central door on the street (north) face, one-storey rear wings, and a plant penthouse
// set back on the core. Walls are one block thick with an air gap behind the glass and a slab per storey.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78997.cells.json`, "utf8"));

const W = 15, D = 16, H = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const nExposed = (f) => +f.n + +f.s + +f.w + +f.e;

// Roof tiers from the lidar: 3x3 median (noise out), then snapped to the three tiers the record allows:
// one storey (3), two storeys (6) or the three-storey block (10).
const TOP = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  TOP.set(key(x, z), med <= 4 ? 3 : med <= 7 ? 6 : 10);
}
const top = (x, z) => TOP.get(key(x, z));
const gr = (x, z) => raw.get(key(x, z)).gr;

// Depth in from the outside wall: 1 = the envelope (one block thick), 2 = the room behind it, and so on
const DEPTH = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) if (nExposed(faces(x, z)) > 0) DEPTH.set(key(x, z), 1);
for (let pass = 2; pass < 20; pass++)
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (DEPTH.has(key(x, z))) continue;
    const ns = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].map(([a, b]) => DEPTH.get(key(a, b))).filter(Boolean);
    if (ns.length) DEPTH.set(key(x, z), Math.min(...ns) + 1);
  }
const depth = (x, z) => DEPTH.get(key(x, z)) ?? 99;

// Storey lines (absolute y): the floor slab and the sill course sit on 3 and 6; the roof is at the tier's top less one
const LINES = [3, 6];
const DOOR = { x: 5, z: 0 };       // the entrance, on the north (street) face, near the middle of its run

// A one-storey wing or a two-storey block keeps its cap row at T-1; the three-storey core keeps 9.
function wallBlock(x, y, z, G, T, f) {
  const cap = T - 1;
  const exposed = nExposed(f);
  const corner = exposed >= 2;
  // the parapet: a stone coping on every envelope cell, its top row
  if (y === cap) return "calcite";
  // the door (two rows high, on the street face)
  if (x === DOOR.x && z === DOOR.z && y >= G && y <= G + 1) return "dark_oak_door";
  // the ground floor: a granite base (where it shows), shopfront glass, a calcite lintel
  if (y < 3) {
    if (y === 0 && G === 0) return "polished_granite";
    if (y === 2) return "calcite";
    if (y === G && G === 0) return "polished_granite";
    return "glass";
  }
  // the quoins at corners, alternate courses of calcite and brick
  if (corner) return y % 2 === 0 ? "calcite" : "bricks";
  // the storey lines: sill (line), window row (line + 1), lintel (line + 2)
  const line = LINES.filter((l) => y >= l && y <= l + 2).pop();
  if (line !== undefined && y === line) return "calcite";
  if (line !== undefined && y === line + 2) return "calcite";
  if (line !== undefined && y === line + 1) return isWindow(x, z, f) ? "glass_pane" : "bricks";
  return "bricks";
}

// Ribbon windows: two panes to each one-block pier on a face, not on corners
function isWindow(x, z, f) {
  if (f.n || f.s) return x % 3 !== 0;
  if (f.e || f.w) return z % 3 !== 0;
  return false;
}

// The core's plant penthouse: set back on the three-storey block, only where the roof is the top tier
const PH = new Set();
for (const [x, z] of cells.map((c) => [c[0], c[1]]))
  if (top(x, z) === 10 && depth(x, z) >= 3) PH.add(key(x, z));
const inPH = (x, z) => PH.has(key(x, z));

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = gr(x, z);       // 0 or 1: the cell's ground, the building stands on it
  const T = top(x, z);
  const f = faces(x, z);
  const perim = depth(x, z) === 1;

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "polished_granite");

  if (!perim) {
    // interior: a floor slab per storey, the roof slab on top, and air between (no interiors)
    g.set(x, G, z, "smooth_stone");
    for (const l of LINES) if (l > G && l < T - 1) g.set(x, l, z, "smooth_stone");
    g.set(x, T - 1, z, "stone");
    // the warm light behind some windows: a glowstone in the room just inside a window's row on the outer wall
    if (depth(x, z) === 2 && (x * 3 + z * 5) % 4 === 0) {
      const outer = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(([a, b]) => depth(a, b) === 1);
      if (outer) {
        const ef = faces(outer[0], outer[1]);
        const onWall = ef.n || ef.s || ef.e || ef.w;
        for (const l of LINES) {
          const wy = l + 1;
          if (onWall && wy < T - 1 && l >= 3 && isWindow(outer[0], outer[1], ef)) g.set(x, wy, z, "glowstone");
        }
      }
    }
    continue;
  }

  // the envelope: solid from the ground up to the cap row
  for (let y = G; y < T; y++) {
    const b = wallBlock(x, y, z, G, T, f);
    if (b === "dark_oak_door") {
      const upper = y === G + 1;
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: upper ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (b === "glass_pane") {
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false" });
      continue;
    }
    g.set(x, y, z, b);
  }
  // the roof slab in the room behind the parapet is inside the cap, so no air gap above the top storey
}

// The penthouse: a stone box on the roof of the three-storey core, a calcite cap, and a row of panes on its front
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!inPH(x, z)) continue;
  const G = gr(x, z), T = top(x, z);
  const edge = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, b]) => !inPH(a, b));
  for (let y = T; y < T + 2; y++) {
    if (y === T + 1) g.set(x, y, z, "calcite");
    else if (edge && (x + z) % 2 === 0) g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false" });
    else g.set(x, y, z, "stone_bricks");
  }
}

// Panes join their neighbours: a window connects to the brick or pane on each side, so the rows read as a grid
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = gr(x, z), T = top(x, z);
  for (let y = G; y < T + 2; y++) {
    const here = g.get(x, y, z);
    if (!here || here.block !== "minecraft:glass_pane") continue;
    const side = (dx, dz) => {
      const n = g.get(x + dx, y, z + dz);
      return n && n.block !== "minecraft:air" ? "true" : "false";
    };
    g.set(x, y, z, "glass_pane", { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0) });
  }
}

// Plant penthouse parapet is calcite on the edge (done above); the depth-1 envelope stays solid.
g.save(`${DIR}/DC78997.nbt`);
