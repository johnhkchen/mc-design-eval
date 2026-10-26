// DC79304: a stone-clad Classical Revival office block on the Mall's north side, 19 x 14 blocks.
// Massing from the lidar roof heights, read into three flat tiers (a 17-block core, a 16-block ring, a 15-block outer
// body) and a 4-block service wing along the back. Storeys are 3 blocks (a 2-block window band between floor lines).
// Walls are one block thick with air behind the glass; every storey has a floor slab across the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79304.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79304.nbt";

// materials: Indiana-limestone-like walls and trim, granite entrance surround, grey tinted glass
const FOUND = "stone_bricks", BASE = "stone_bricks", WALL = "calcite", PIER = "smooth_quartz", BAND = "chiseled_stone_bricks";
const CORNICE = "smooth_stone", ROOF = "stone", FLOOR = "stone", LEDGE = "stone", PANE = "gray_stained_glass_pane", LAMP = "glowstone";
const SURROUND = "polished_granite";

const FLOORS = [4, 7, 10, 13];                               // storey floor lines above the ground floor
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// the lidar, read as tiers: 17 core, 16 ring, 15 outer body, 4 service wing; then a 3x3 vote so single cells don't notch the tiers
const raw = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) raw.set(`${x},${z}`, { g, r });
const tierOf = (r) => (r <= 4 ? 4 : r >= 17 ? 17 : r === 16 ? 16 : 15);
const tier = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number), votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(`${x + dx},${z + dz}`); if (n) votes.set(tierOf(n.r), (votes.get(tierOf(n.r)) || 0) + 1);
  }
  let best = tierOf(r), bc = votes.get(best) || 0;
  for (const [t, c] of votes) if (c > bc) { best = t; bc = c; }
  tier.set(key, { g, R: best });
}
const inF = (x, z) => tier.has(`${x},${z}`);
const G = (x, z) => tier.get(`${x},${z}`).g;
const R = (x, z) => tier.get(`${x},${z}`).R;
const isFloor = (y, g) => y === g || FLOORS.includes(y);

// the solid map: "x,y,z" -> { b: block, st: state, wall, dirs: exposed faces, y }
const solid = new Map();
const put = (x, y, z, spec) => solid.set(`${x},${y},${z}`, { ...spec, x, y, z });

// the faces of a body cell at height y that open to air: off the footprint, or above the neighbour's roof
const exposedDirs = (x, y, z) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; return !inF(x + dx, z + dz) || y >= R(x + dx, z + dz);
});

// a wall block on an exposed face: piers every third cell and at corners, glass between, in the window rows
const windowRow = (y, g, r) => {
  const fl = [g, ...FLOORS.filter((f) => f > g)].filter((f) => f <= y).pop();
  const k = y - fl;
  return (k === 1 || k === 2) && !isFloor(y, g) && y <= r - 2;
};
const faceWall = (x, y, z, dirs, g, r) => {
  const zFace = dirs.includes("N") || dirs.includes("S");
  const xFace = dirs.includes("W") || dirs.includes("E");
  const corner = zFace && xFace;
  if (windowRow(y, g, r)) {
    const coord = zFace ? x : z;
    return corner || coord % 3 === 0 ? { b: PIER } : { b: PANE };
  }
  return { b: WALL };
};

// 1. the body, storey by storey: foundation below the ground, the base course, floor lines, windows, cornice, roof
for (const [key, { g, R: r }] of tier) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    if (y < g) { put(x, y, z, { b: FOUND, wall: false, dirs: [] }); continue; }
    const dirs = exposedDirs(x, y, z);
    if (isFloor(y, g)) { put(x, y, z, dirs.length ? { b: y === g ? BASE : BAND, wall: true, dirs } : { b: FLOOR, wall: false, dirs }); continue; }
    if (y === r - 1) { put(x, y, z, dirs.length ? { b: CORNICE, wall: true, dirs } : { b: ROOF, wall: false, dirs }); continue; }
    if (dirs.length) put(x, y, z, { ...faceWall(x, y, z, dirs, g, r), wall: true, dirs });
  }
}

// 2. the penthouse on the core's roof: two rows on the 3 x 3 block of core cells at x 9..11, z 6..8
const PH = new Set(); for (let x = 9; x <= 11; x++) for (let z = 6; z <= 8; z++) PH.add(`${x},${z}`);
for (const key of PH) {
  const [x, z] = key.split(",").map(Number);
  const dirs = Object.keys(DIRS).filter((d) => !PH.has(`${x + DIRS[d][0]},${z + DIRS[d][1]}`));
  for (const y of [17, 18]) {
    if (y === 17) put(x, y, z, dirs.length ? { ...faceWall(x, y, z, dirs, 17, 19), wall: true, dirs } : { b: ROOF, wall: false, dirs });
    if (y === 18) put(x, y, z, dirs.length ? { b: CORNICE, wall: true, dirs } : { b: ROOF, wall: false, dirs });
  }
}

// 3. the front entrance: a pair of bronze-look doors in a granite surround under a lintel (the front cells are on the lowest ground)
for (const x of [7, 8, 9, 10]) {
  if (x === 8 || x === 9) {
    put(x, 1, 0, { b: "iron_door", st: { facing: "north", half: "lower", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" }, wall: true, dirs: ["N"] });
    put(x, 2, 0, { b: "iron_door", st: { facing: "north", half: "upper", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" }, wall: true, dirs: ["N"] });
  } else {
    put(x, 1, 0, { b: SURROUND, wall: true, dirs: ["N"] });
    put(x, 2, 0, { b: SURROUND, wall: true, dirs: ["N"] });
  }
  put(x, 3, 0, { b: BAND, wall: true, dirs: ["N"] });
}

// 4. warm light behind some windows: a glowstone in the air cell just inside the glass (never on a floor line)
for (const s of [...solid.values()]) {
  if (s.b !== PANE || !s.dirs.length) continue;
  if ((s.x * 5 + s.y * 7 + s.z * 3) % 9 !== 0) continue;
  const d = s.dirs[0], [dx, dz] = DIRS[d];
  const ix = s.x - dx, iz = s.z - dz;                     // one step inside the footprint, away from the face
  if (!inF(ix, iz) || solid.has(`${ix},${s.y},${iz}`) || FLOORS.includes(s.y)) continue;
  put(ix, s.y, iz, { b: LAMP, wall: false, dirs: [] });
}

// 5. every wall stands on something: a wall cell with air below gets a ledge filled down to the one below it
const work = [...solid.values()].filter((s) => s.wall && s.y > 0);
while (work.length) {
  const s = work.pop();
  const below = `${s.x},${s.y - 1},${s.z}`;
  if (solid.has(below) || !inF(s.x, s.z)) continue;
  put(s.x, s.y - 1, s.z, { b: LEDGE, wall: true, dirs: [] });
  work.push(solid.get(below));
}

// 6. write the blocks; a pane's arms go to the solid pieces beside it on its own face
const g3 = new Voxels([19, 29, 14]);
for (const s of solid.values()) {
  if (s.b === PANE) {
    const side = s.dirs.includes("N") || s.dirs.includes("S") ? ["E", "W"] : ["N", "S"];
    const arm = (d) => { const o = solid.get(`${s.x + DIRS[d][0]},${s.y},${s.z + DIRS[d][1]}`); return o && o.b !== LAMP && o.b !== FLOOR ? "true" : "false"; };
    const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    for (const d of side) st[{ N: "north", S: "south", E: "east", W: "west" }[d]] = arm(d);
    g3.set(s.x, s.y, s.z, PANE, st);
  } else {
    g3.set(s.x, s.y, s.z, s.b, s.st);
  }
}
g3.save(OUT);
console.log("blocks", g3.count(), "palette", g3.palette.length);
