// DC75335: a Neoclassical federal office block on the Mall's flank (c. 1930s): a limestone (calcite) upper body on a
// granite-grey base, a quartz string course at every floor, pilaster piers between glass bays, a central doorway in a
// pilastered portico, and a stepped massing from the lidar roof: a 1-storey wing, a 3-storey podium, a set-back attic
// ring and a 4-storey core with a plant-room penthouse. Solid foundation, floor slabs per storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75335.cells.json", "utf8"));

const W = 15, D = 18, H = 25;
const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roof.set(key(x, z), r); }
const inF = (x, z) => ground.has(key(x, z));

// Smooth the lidar roof with a 3x3 median over footprint cells, then snap it to four tiers:
// 4 = one-storey wing, 10 = three-storey podium, 12 = set-back attic ring, 13 = four-storey core.
const median = (a) => { const s = a.slice().sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const topOf = new Map();
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) nb.push(roof.get(key(x + dx, z + dz)));
  const m = median(nb);
  topOf.set(k, m <= 5 ? 4 : m <= 11 ? 10 : m === 12 ? 12 : 13);
}
const top = (x, z) => topOf.get(key(x, z)) ?? 0;          // rows solid in a column: 0..top-1
const FLOORS = [1, 4, 7, 10];                              // storey floor slabs: storey k is rows FLOORS[k]..+2

// The face(s) a footprint cell shows to the air at row y: N/S (z) or E/W (x) faces, exposed where the neighbour has no block there
const faces = (x, z, y) => {
  const out = [];
  if (!inF(x, z - 1) || top(x, z - 1) <= y) out.push("N");
  if (!inF(x, z + 1) || top(x, z + 1) <= y) out.push("S");
  if (!inF(x - 1, z) || top(x - 1, z) <= y) out.push("W");
  if (!inF(x + 1, z) || top(x + 1, z) <= y) out.push("E");
  return out;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DOOR_X = [6, 7];                                      // the double doorway on the north (z = 0) front
const isFloor = (y) => FLOORS.includes(y);

for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  // foundation: solid from y 0 under every footprint cell (a G=0 cell's y 0 is its visible base course)
  put(x, 0, z, "polished_andesite");

  for (let y = 1; y < T; y++) {
    const exp = faces(x, z, y);
    const edge = exp.length > 0;

    // roof row: a parapet on the edge, a light roof field inside
    if (y === T - 1) { put(x, y, z, edge ? "smooth_quartz" : "smooth_stone"); continue; }

    // floor slab per storey: a quartz string course outside, solid inside
    if (isFloor(y)) { put(x, y, z, "smooth_quartz"); continue; }
    if (!edge) continue;                                    // interior air behind the glass

    const floor = FLOORS.filter((f) => f <= y).at(-1);
    const storey = FLOORS.indexOf(floor);
    const along = exp.includes("N") || exp.includes("S") ? x : z;   // position along the face
    const pier = exp.length > 1 || along % 3 === 0;

    // ground storey: a granite-grey base with one row of windows; upper storeys: calcite with glass bays
    if (storey === 0) {
      if (y === 2 && !pier) { put(x, y, z, "glass_pane", paneState(exp)); continue; }
      put(x, y, z, "polished_andesite");
      continue;
    }
    if (pier) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    put(x, y, z, "glass_pane", paneState(exp));
  }
}

// a glass pane joins its neighbours along the face it sits in
function paneState(exp) {
  const ns = exp.includes("N") || exp.includes("S");
  return { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" };
}

// the doorway: a pilastered portico (quartz pillars at x 5 and 8), steps at the threshold, a dark oak double door
for (const x of DOOR_X) {
  put(x, 1, 0, "polished_andesite_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  const hinge = x === DOOR_X[0] ? "left" : "right";
  put(x, 2, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 3, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
for (const x of [5, 8]) for (const y of [2, 3]) put(x, y, 0, "quartz_pillar", { axis: "y" });

// a warm glow behind some ground and upper windows: glowstone in the air just inside the glass
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  for (let y = 2; y < T - 1; y++) {
    if (isFloor(y) || !faces(x, z, y).length) continue;
    const exp = faces(x, z, y);
    if (exp.length !== 1 || (exp[0] === "N" || exp[0] === "S" ? x : z) % 3 === 0) continue;   // a window bay, not a pier
    const storey = FLOORS.indexOf(FLOORS.filter((f) => f <= y).at(-1));
    if (storey === 0 && y !== 2) continue;
    if ((x * 5 + y * 3 + z) % 11 !== 0) continue;           // a few lit windows, not a spotted façade
    const [dx, dz] = exp[0] === "N" ? [0, 1] : exp[0] === "S" ? [0, -1] : exp[0] === "W" ? [1, 0] : [-1, 0];
    const ix = x + dx, iz = z + dz;
    if (!inF(ix, iz) || top(ix, iz) <= y) continue;
    if (faces(ix, iz, y).length) continue;                  // only air that sits inside the wall
    put(ix, y, iz, "glowstone");
  }
}

// a plant-room penthouse on the core: cells whose four neighbours are also core, two rows of calcite and a
// smaller cap above, each stacked on the roof field below
const core = (x, z) => inF(x, z) && top(x, z) === 13;
const P = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (core(x, z) && core(x + 1, z) && core(x - 1, z) && core(x, z + 1) && core(x, z - 1)) P.push([x, z]);
}
for (const [x, z] of P) {
  put(x, 13, z, "calcite");
  put(x, 14, z, "smooth_quartz");
}
const inP = new Set(P.map(([x, z]) => key(x, z)));
const P2 = P.filter(([x, z]) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inP.has(key(x + dx, z + dz))));
for (const [x, z] of P2) put(x, 15, z, "smooth_stone");

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75335.nbt");
console.log(JSON.stringify({ ...info, penthouse: P.length, cap: P2.length }));
