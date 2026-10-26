// DC77001: a two-storey limestone Federal-style annex with a parapet attic on the lidar's raised centre bays.
// Footprint is the 25-cell diagonal strip from the lidar (x 0..10, z 0..5). Every column is solid from y 0 to its
// top (base, storey floors, roof), so each tier stands on the one below. Windows are glass panes in the outer ring
// with air behind them (the inward cell is carved to air) and a floor slab per storey; the interior cells between
// slabs are air.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77001.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..10, z 0..5

const F = new Map();
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { g, r });
const has = (x, z) => F.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
// the exterior faces of a cell: the sides with no footprint cell beside them
const extFaces = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));

const DOOR = { x: 1, z: 5 };                 // the entrance: the south face of the lowest, long run
const BASE = "stone_bricks", STONE = "calcite", TRIM = "smooth_quartz", CAP = "smooth_stone", ROOF = "gray_concrete";
const GF = [3, 4], UF = [6], SILL = 2, BELT = 5;   // ground storey rows, upper storey rows, sill and belt courses

// 1. what each footprint cell is, per row: a block, a window (glass pane on a face), or air
const kind = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => kind.set(`${x},${y},${z}`, state === undefined ? { block } : { block, state });
const windowCells = [];   // { x, z, face, rows }
const hasFace = (x, z, f) => extFaces(x, z).includes(f);

for (const [k, { r }] of F) {
  const [x, z] = k.split(",").map(Number);
  const top = r - 1;                                        // the top block's y (roof 8 -> 7, roof 9 -> 8)
  const faces = extFaces(x, z), exterior = faces.length > 0, corner = faces.length >= 2;
  const face = faces[0];
  const along = face && (face === "north" || face === "south") ? x : z;
  // on a single-face cell: a pier every third cell along the face (trim), glass in the two between; corners are piers
  const pier = corner || along % 3 === 0;
  const isWin = exterior && !pier && !(x === DOOR.x && z === DOOR.z);
  for (let y = 0; y <= top; y++) {
    if (y <= 1) { put(x, y, z, BASE); continue; }
    if (y === SILL || y === BELT) { put(x, y, z, TRIM); continue; }
    if (y === top) { put(x, y, z, exterior ? CAP : ROOF); continue; }
    if (!exterior) {                                        // interior: air between the slabs
      if (y === 7 && top === 8) put(x, y, z, TRIM);         // attic floor slab on the raised bays
      continue;
    }
    if (y === top - 1 && top === 8) { put(x, y, z, STONE); continue; }   // raised bays: a band under the parapet
    const winRows = [...GF, ...UF];
    if (isWin && winRows.includes(y)) continue;             // set below as glass
    put(x, y, z, pier ? TRIM : STONE);                      // piers and corners, wall otherwise
  }
  if (isWin) windowCells.push({ x, z, face, rows: [...GF, ...UF].filter((y) => y <= top) });
}

// 2. the entrance: a pair of doors in the south face, a lintel over, a lantern hung in the air behind it
put(DOOR.x, 2, DOOR.z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR.x, 3, DOOR.z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(DOOR.x, 4, DOOR.z, TRIM);

// 3. the windows: glass panes joined to the glass or piers beside them, the air behind each one carved out
const carved = new Set();
for (const w of windowCells) {
  const [dx, dz] = DIRS[w.face], inX = w.x - dx, inZ = w.z - dz;
  const alongAxis = w.face === "north" || w.face === "south" ? ["east", "west"] : ["north", "south"];
  for (const y of w.rows) {
    const conn = { north: "false", south: "false", east: "false", west: "false" };
    for (const d of alongAxis) { const [ax, az] = DIRS[d]; if (has(w.x + ax, w.z + az)) conn[d] = "true"; }
    put(w.x, y, w.z, "glass_pane", { ...conn, waterlogged: "false" });
  }
  if (has(inX, inZ)) for (const y of w.rows) { carved.add(`${inX},${y},${inZ}`); kind.delete(`${inX},${y},${inZ}`); }
}
// warm light in some windows: glowstone on the glass's inside in the ground storey, shroomlights upstairs
for (const w of windowCells) {
  const [dx, dz] = DIRS[w.face], inX = w.x - dx, inZ = w.z - dz;
  if (!has(inX, inZ)) continue;
  if ((w.x + w.z) % 3 === 0) put(inX, 3, inZ, "glowstone");
  else if ((w.x + w.z) % 4 === 1) put(inX, 6, inZ, "shroomlight");
}
// the lantern under the lintel, and a pair of rooftop vents on the raised bays
if (has(DOOR.x, DOOR.z - 1)) put(DOOR.x, 4, DOOR.z - 1, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, z] of [[3, 3], [4, 3]]) if (has(x, z) && F.get(`${x},${z}`).r === 9) put(x, 9, z, "iron_block");

// 4. the floor slabs: each interior cell's storey floors are full layers already; now write to the volume
const vox = new Voxels([11, 21, 6]);
for (const [k, b] of kind) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, b.block, b.state);
}
const res = vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77001.nbt");
console.log(JSON.stringify({ ...res, windows: windowCells.length, carved: carved.size }));
