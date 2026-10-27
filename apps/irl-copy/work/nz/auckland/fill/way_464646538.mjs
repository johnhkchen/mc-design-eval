// Mt Eden / CBD fringe office block, c. 1980s: an 11-storey concrete-frame tower on a basalt base, cream precast spandrels,
// tinted glazing in a regular grid, a lower one-storey wing on the north side and a plant core rising 6 blocks above the
// main roof (the lidar's 52 against 46). Built only on the footprint: foundation to each cell's ground, then storeys.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_464646538.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 28, H = 65, D = 25;
const SLAB = 1, STOREY = 4, BODY_TOP = 45, WING_TOP = 5, CORE_BASE = 46, CORE_TOP = 51;
const CORE_MIN = 50, WING_MAX = 20;            // lidar roof >= 50: plant core; < 20: one-storey wing; else the 46 body (34 and 24 are single-cell noise)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const C = new Map();
for (const [x, z, ground, roof] of cells) if (roof > 0) C.set(`${x},${z}`, { ground, roof });   // roof 0 is no building
const at = (x, z) => C.get(`${x},${z}`);
const outward = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz)).length;     // sides facing outside the footprint
const isCore = (x, z) => (at(x, z)?.roof ?? 0) >= CORE_MIN;
const h = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;     // deterministic pick for lamps

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, { ground, roof }] of C) {
  const [x, z] = key.split(",").map(Number);
  const edge = outward(x, z) > 0;                          // footprint boundary: exterior wall
  const corner = outward(x, z) >= 2;
  const core = isCore(x, z);
  const top = roof >= WING_MAX ? BODY_TOP : WING_TOP;     // the wing is one storey
  const coreEdge = core && DIRS.some(([dx, dz]) => !isCore(x + dx, z + dz));

  // foundation: solid from y 0 up to this cell's ground (at least one block, under the floor slab)
  for (let y = 0; y < Math.max(ground, 1); y++) put(x, y, z, "stone");

  // body and wing storeys: slab row, then spandrel row, then two glass rows; cornice on the top row
  for (let y = Math.max(ground, 1); y <= top; y++) {
    const k = Math.floor((y - SLAB) / STOREY), o = (y - SLAB) % STOREY;
    if (o === 0) {                                        // floor slab (exterior: a concrete band; the top row a cornice)
      if (!edge) put(x, y, z, "light_gray_concrete");
      else if (k === 0) put(x, y, z, "polished_basalt");
      else put(x, y, z, y === top ? "smooth_quartz" : "white_concrete");
    } else if (o === 1) {                                 // spandrel: precast band, basalt base at street level
      if (edge) put(x, y, z, k === 0 ? "polished_basalt" : "white_concrete");
    } else if (edge) {                                    // glazing rows
      if (corner) put(x, y, z, "light_gray_concrete");
      else if ((x + z) % 3 === 0) put(x, y, z, "gray_concrete");          // mullion every third bay
      else put(x, y, z, k === 0 ? "glass" : "light_blue_stained_glass");  // clear shopfront, tinted office glass
    }
  }

  // plant core above the 46 body: louvred walls, a slab at 49, a capping deck at 51
  if (core) for (let y = CORE_BASE; y <= CORE_TOP; y++) {
    if (y === 49 || y === CORE_TOP) put(x, y, z, coreEdge ? "smooth_quartz" : "light_gray_concrete");
    else if (coreEdge) put(x, y, z, (x + z) % 2 === 0 ? "gray_concrete" : "light_gray_concrete");
  }
}

// warm lamps: some windows (upper storeys sparse, shopfronts denser), lantern standing on the slab inside the glass
for (const [key, { ground, roof }] of C) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z) === 0 || outward(x, z) >= 2 || (x + z) % 3 === 0) continue;   // windows only, not mullions or corners
  const inner = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => at(nx, nz) && outward(nx, nz) === 0);
  if (!inner) continue;
  const top = roof >= WING_MAX ? BODY_TOP : WING_TOP;
  for (let k = 0; SLAB + STOREY * k + 1 < top; k++) {
    const y = SLAB + STOREY * k + 1;                      // the spandrel-height row inside, above the slab
    if (y < ground || y < 2) continue;
    const every = k === 0 ? 3 : 6;                        // shopfronts lit more often
    if (h(x, y, z) % every === 0 && g.get(inner[0], y, inner[1]) === null)
      put(inner[0], y, inner[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// entrance on the east face, down the step from the street: basalt stair, dark oak door, a quartz canopy over it
const DOOR = [26, 8];
put(DOOR[0], 1, DOOR[1], "stone_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
put(DOOR[0], 2, DOOR[1], "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR[0], 3, DOOR[1], "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dz of [-1, 0, 1]) put(DOOR[0], 4, DOOR[1] + dz, "smooth_quartz");

// plant boxes on the 46 roof, clear of the edges, and a lightning rod on the core's cap
for (const [x0, z0] of [[20, 9], [4, 9]]) for (let x = x0; x < x0 + 3; x++) for (let z = z0; z < z0 + 3; z++) {
  put(x, 46, z, "light_gray_concrete"); put(x, 47, z, "light_gray_concrete");
}
for (const [x0, z0] of [[20, 9], [4, 9]]) put(x0 + 1, 48, z0 + 1, "iron_block");
put(12, 52, 14, "lightning_rod"); put(12, 53, 14, "lightning_rod");

const info = g.save(`${DIR}/way_464646538.nbt`);
console.log(JSON.stringify({ cells: C.size, ...info }));
