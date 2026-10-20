import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 21 x 23 footprint, roof about 11 blocks above the lowest ground.
// Read as a two-storey, flat-roofed Taipei commercial block of the 1970s-80s:
// pale concrete walls on a stone base, quartz piers between a grid of glass windows,
// a shopfront with a central entrance on the street face, and a plain parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343812";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ROOF = 11;     // parapet top; roof is level across the block
const FLOOR = 5;     // first-floor line (storey height about 5)
const CORNICE = 10;  // cornice band just under the parapet

// Footprint: ground per cell (y 0 = lowest ground under the footprint)
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));

const ins = (x, z) => gm.has(`${x},${z}`);
const ground = (x, z) => gm.get(`${x},${z}`);
const outW = (x, z) => !ins(x - 1, z);
const outE = (x, z) => !ins(x + 1, z);
const outN = (x, z) => !ins(x, z - 1);
const outS = (x, z) => !ins(x, z + 1);
const exposedX = (x, z) => outW(x, z) || outE(x, z);
const exposedZ = (x, z) => outN(x, z) || outS(x, z);
const perimeter = (x, z) => exposedX(x, z) || exposedZ(x, z);
const corner = (x, z) => exposedX(x, z) && exposedZ(x, z);

const maxZ = Math.max(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === maxZ).map(([x]) => x);
const doorX = Math.round(frontXs.reduce((a, b) => a + b, 0) / frontXs.length);
const doorZ = maxZ;

const cxAll = cells.reduce((a, c) => a + c[0], 0) / cells.length;
const czAll = cells.reduce((a, c) => a + c[1], 0) / cells.length;
const coreX = Math.round(cxAll), coreZ = Math.round(czAll);

const PANE_Z_WALL = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X_WALL = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Which storey rows carry glazing (ground storey 1..3, upper storey 6..8)
const isWindowRow = (y) => (y >= 1 && y <= 3) || (y >= FLOOR + 1 && y <= FLOOR + 3);

for (const [x, z, gr] of cells) {
  const base = ground(x, z);

  // 1. Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone");

  // 2. Floor slab at ground line (interior); perimeter gets the stone base course
  if (!perimeter(x, z)) {
    g.set(x, base, z, "smooth_stone");
  }

  // 3. First-floor slab across the whole footprint, where it sits above ground
  if (FLOOR > base && !perimeter(x, z)) {
    g.set(x, FLOOR, z, "smooth_stone");
  }

  // 4. Roof deck (interior) at parapet level
  if (!perimeter(x, z) && ROOF > base) {
    g.set(x, ROOF, z, "light_gray_concrete");
  }

  if (!perimeter(x, z)) continue;

  // 5. Perimeter wall column, from ground to roof
  for (let y = base; y <= ROOF; y++) {
    if (y === base) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === ROOF) { g.set(x, y, z, "quartz_block"); continue; }          // parapet
    if (y === CORNICE) { g.set(x, y, z, "smooth_stone"); continue; }       // cornice
    if (FLOOR > base && y === FLOOR) { g.set(x, y, z, "smooth_stone"); continue; } // storey line

    if (corner(x, z)) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

    const t = exposedZ(x, z) ? x : z;      // position along the face
    const pier = t % 3 === 0;
    if (pier) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

    if (isWindowRow(y) && y > base) {
      const props = exposedZ(x, z) && !exposedX(x, z) ? PANE_Z_WALL : PANE_X_WALL;
      g.set(x, y, z, "glass_pane", props);
      continue;
    }

    g.set(x, y, z, "white_concrete");      // spandrel / plain wall
  }
}

// 6. Shopfront on the street face: glazing across ground storey, central entrance
for (const [x, z] of cells) {
  if (z !== maxZ || !exposedZ(x, z) || corner(x, z)) continue;
  const base = ground(x, z);
  if (base >= FLOOR - 1) continue;
  for (let y = base + 1; y <= Math.min(3, FLOOR - 2); y++) {
    if (x % 3 === 0) continue;   // keep piers
    g.set(x, y, z, "glass_pane", PANE_X_WALL);
  }
}

// 7. Entrance door (two blocks) at the centre of the street face
if (ins(doorX, doorZ)) {
  const base = ground(doorX, doorZ);
  g.set(doorX, base + 1, doorZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, base + 2, doorZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 8. Warm lights behind some upper-storey windows (standing lanterns on the floor slab)
for (const [x, z] of cells) {
  if (!perimeter(x, z) || corner(x, z)) continue;
  const base = ground(x, z);
  if (FLOOR <= base) continue;
  const t = exposedZ(x, z) ? x : z;
  if (t % 9 !== 4) continue;
  let dx = 0, dz = 0;
  if (outW(x, z)) dx = 1;
  else if (outE(x, z)) dx = -1;
  else if (outN(x, z)) dz = 1;
  else if (outS(x, z)) dz = -1;
  const ix = x + dx, iz = z + dz;
  if (!ins(ix, iz)) continue;
  g.set(ix, FLOOR + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 9. Roof: stair/lift core in the middle and two condenser units
for (const [x, z] of cells) {
  if (perimeter(x, z)) continue;
  if (Math.abs(x - coreX) <= 2 && Math.abs(z - coreZ) <= 2) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}
for (const [x, z] of cells) {
  if (perimeter(x, z)) continue;
  const edgeN = !ins(x, z - 2) || !ins(x, z + 2);
  if ((x === coreX - 4 || x === coreX + 4) && z === coreZ && ins(x, z)) {
    g.set(x, ROOF + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
