// DC77886: 1155 F St NW, Commercial-Office-Large. A 1920s-30s Washington office block in buff limestone on a granite
// plinth: a 9-storey central tower with a one-block setback shoulder, 8-storey west wing, 5-storey east wing. Storeys
// are 2 blocks (window band over a string course); the ground floor is a shopfront with a recessed double door and canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77886.cells.json`, "utf8"));
const X = 27, Z = 21, Y = 32;

// --- footprint, ground and lidar roof -------------------------------------------------------------------------------
const grid = (v) => Array.from({ length: Z }, () => Array(X).fill(v));
const fp = grid(false), raw = grid(0);
for (const [x, z, , r] of cells) { fp[z][x] = true; raw[z][x] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[z][x];

// --- massing: smooth the lidar into three clean tiers (tower >= 19, west wing 14-18, east wing 11-13) ----------------
const tierOf = (r) => (r >= 19 ? "T" : r >= 14 ? "W" : r >= 11 ? "E" : null);
const tier = grid(null);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (fp[z][x]) tier[z][x] = tierOf(raw[z][x]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {       // lidar noise (2, 4, 7, 10): the majority tier around it
  if (!fp[z][x] || tier[z][x]) continue;
  const n = { T: 0, W: 0, E: 0 };
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz) && tier[z + dz][x + dx]) n[tier[z + dz][x + dx]]++;
  tier[z][x] = n.W >= n.E && n.W >= n.T ? "W" : n.E >= n.T ? "E" : "T";
}
const roof = grid(0);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  if (tier[z][x] === "E") roof[z][x] = 12;
  else if (tier[z][x] === "W") roof[z][x] = 17;
  else {                                                           // tower: 20 core, 18 setback shoulder on its edge
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !(inFp(x + dx, z + dz) && tier[z + dz][x + dx] === "T"));
    roof[z][x] = edge ? 18 : 20;
  }
}

// --- solid massing and its depth from the outside (per storey level) --------------------------------------------------
const solid = (x, y, z) => inFp(x, z) && y >= 0 && y < roof[z][x];
const depth = new Int8Array(X * Y * Z).fill(-1);
const di = (x, y, z) => (y * Z + z) * X + x;
for (let y = 0; y < Y; y++) {
  const q = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (!solid(x, y, z)) continue;
    if (!solid(x - 1, y, z) || !solid(x + 1, y, z) || !solid(x, y, z - 1) || !solid(x, y, z + 1)) { depth[di(x, y, z)] = 0; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = depth[di(x, y, z)];
    for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]])
      if (solid(nx, y, nz) && depth[di(nx, y, nz)] < 0) { depth[di(nx, y, nz)] = d + 1; q.push([nx, nz]); }
  }
}
const D = (x, y, z) => depth[di(x, y, z)];

// --- facade: which way a facade cell faces, and what it is ------------------------------------------------------------
const exposedX = (x, y, z) => !solid(x - 1, y, z) || !solid(x + 1, y, z);
const exposedZ = (x, y, z) => !solid(x, y, z - 1) || !solid(x, y, z + 1);
const MULLION = (t) => t % 3 === 0;                                 // a pier every third cell; two glass bays between
const DOOR_X = [22, 23], CANOPY_X = [21, 22, 23, 24];
const isDoor = (x, y, z) => z === 0 && DOOR_X.includes(x) && (y === 1 || y === 2);

// kind of a depth-0 cell: 'glass' | 'door' | 'stone' | 'string' | 'lintel' | 'cornice' | 'plinth'
function kindOf(x, y, z) {
  const r = roof[z][x];
  if (y === 0) return "plinth";
  if (y === r - 1) return "cornice";
  if (isDoor(x, y, z)) return "door";
  if (y === 1 || y === 2) {                                          // shopfront band
    const ex = exposedX(x, y, z), ez = exposedZ(x, y, z);
    if (ex && ez) return "stone";
    const t = ex ? z : x;
    return MULLION(t) ? "stone" : "glass";
  }
  if (y === 3) return "lintel";
  if (y % 2 === 0) return "string";                                  // storey string course
  const ex = exposedX(x, y, z), ez = exposedZ(x, y, z);
  if (ex && ez) return "stone";
  return MULLION(ex ? z : x) ? "stone" : "glass";
}
// a depth-1 cell behind glass is the air gap (or a warm light); behind a door it is the vestibule
function behind(x, y, z) {
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    if (!inFp(nx, nz) || !solid(nx, y, nz) || D(nx, y, nz) !== 0) continue;
    const k = kindOf(nx, y, nz);
    if (k === "door") return "door";
    if (k === "glass") return "glass";
  }
  return null;
}

const STONE = "calcite", TRIM = "smooth_quartz", BASE = "polished_granite", CORE = "smooth_stone", GLASS = "light_blue_stained_glass_pane";
const panes = [];                                                    // [x, y, z, axis] with axis 'x' (connects east-west) or 'z'
const lights = [];
function blockFor(x, y, z) {
  const r = roof[z][x], d = D(x, y, z);
  // ground-floor canopy and the vestibule over the doors
  if (z <= 1 && y === 3 && CANOPY_X.includes(x) && d <= 1) return [TRIM];
  if (z === 1 && y === 2 && (x === 22)) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if (y === 0) return [BASE];
  if (y === r - 1) return d === 0 ? [TRIM] : [CORE];
  if (d >= 2) return [CORE];
  if (d === 1) {
    const b = behind(x, y, z);
    if (b === "door") return null;                                  // vestibule: air
    if (b === "glass") {
      const h = (x * 31 + y * 17 + z * 7) % 13;                     // warm lights in some windows
      if (h === 0) return ["glowstone"];
      if (h === 5) return ["shroomlight"];
      return null;                                                  // air gap behind the glass
    }
    return [CORE];
  }
  if (isDoor(x, y, z)) return ["iron_door", doorState(x, y, z)];
  const k = kindOf(x, y, z);
  if (k === "glass") return [GLASS];
  if (k === "string") return [TRIM];
  return [STONE];
}
function doorState(x, y, z) {
  return { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 22 ? "left" : "right", open: "false", powered: "false" };
}

// --- build -----------------------------------------------------------------------------------------------------------
const g = new Voxels([X, Y, Z]);
const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  for (let y = 0; y < roof[z][x]; y++) {
    const b = blockFor(x, y, z);
    if (!b) continue;
    put(x, y, z, b);
    if (b[0] === GLASS) panes.push([x, y, z, exposedX(x, y, z) ? "x" : "z"]);
    if (b[0] === "glowstone" || b[0] === "shroomlight") lights.push([x, y, z]);
  }
  // parapet: one block on the top cell of the facade
  const r = roof[z][x];
  if (D(x, r - 1, z) === 0 && fp[z][x]) put(x, r, z, [STONE]);
}
// the penthouse on the tower roof: solid, a glass band on its outer faces
for (let y = 20; y <= 21; y++) for (let z = 9; z <= 11; z++) for (let x = 7; x <= 10; x++) {
  const edge = x === 7 || x === 10 || z === 9 || z === 11;
  const corner = (x === 7 || x === 10) && (z === 9 || z === 11);
  if (y === 20 && edge && !corner) { g.set(x, y, z, GLASS); panes.push([x, y, z, z === 9 || z === 11 ? "x" : "z"]); }
  else g.set(x, y, z, STONE);
}
for (let z = 9; z <= 11; z++) for (let x = 7; x <= 10; x++) g.set(x, 22, z, TRIM);

// glass panes connect to the neighbours in their facade run, not to the air gap behind
const solidish = (n) => n && !/door|lantern|glowstone|shroomlight|light_blue_stained/.test(n.block);
for (const [x, y, z, axis] of panes) {
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (axis === "x") {
    st.east = String(!!solidish(g.get(x + 1, y, z)) || g.get(x + 1, y, z)?.block.endsWith("glass_pane") === true);
    st.west = String(!!solidish(g.get(x - 1, y, z)) || g.get(x - 1, y, z)?.block.endsWith("glass_pane") === true);
  } else {
    st.north = String(!!solidish(g.get(x, y, z - 1)) || g.get(x, y, z - 1)?.block.endsWith("glass_pane") === true);
    st.south = String(!!solidish(g.get(x, y, z + 1)) || g.get(x, y, z + 1)?.block.endsWith("glass_pane") === true);
  }
  g.set(x, y, z, GLASS, st);
}

g.save(`${DIR}/DC77886.nbt`);
console.log(JSON.stringify({ cells: g.count(), palette: g.palette.length - 1, panes: panes.length, lights: lights.length }));
