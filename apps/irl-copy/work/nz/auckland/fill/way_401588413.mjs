// Chancery Court, Auckland: a three-storey office block of the 1970s-80s (the lidar roof tiers are 4, 8 and 12 blocks
// above y 0, the top tier with a 1-block parapet to 13). Stone plinth on a solid foundation, pale concrete piers and
// string courses, glass panes in each bay with an air gap behind and a floor slab per storey, a timber-door entrance
// under a lintel, roof plant on the top tier, and warm lights behind some of the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const [X, Y, Z] = [57, 25, 56];
const cells = JSON.parse(readFileSync(`${DIR}/way_401588413.cells.json`, "utf8"));

// Per footprint cell: g = its ground (the lidar's third number), T = its snapped top (the wall stops below y = T).
// The lidar's roof noise is smoothed into three flat tiers: 10+ -> 12, 7-9 -> 8, 4-6 -> 4.
const tierOf = (r) => (r >= 10 ? 12 : r >= 7 ? 8 : 4);
const foot = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, gr, roof] of cells) foot[x][z] = { g: gr, T: tierOf(roof) };

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && foot[x][z] !== null;
// solid or open storey air: a footprint cell below its top
const occ = (x, y, z) => inFoot(x, z) && y >= 0 && y < foot[x][z].T;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the horizontal faces of a cell at height y that look out onto air (outside the building or a lower tier)
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !occ(x + dx, y, z + dz));
// the envelope: an occupied cell above its ground with an open face
const isShell = (x, y, z) => occ(x, y, z) && y >= foot[x][z].g && exposed(x, y, z).length > 0;

// Entrance: the ground-level envelope cells on the south side (open to +z), nearest the middle of that run
let door = null;
{
  const south = [];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    if (!inFoot(x, z)) continue;
    const gr = foot[x][z].g;
    if (isShell(x, gr, z) && !occ(x, gr, z + 1)) south.push([x, z]);
  }
  if (south.length) {
    const zMax = Math.max(...south.map(([, z]) => z));
    const run = south.filter(([, z]) => z >= zMax - 3);
    const mid = run.reduce((s, [x]) => s + x, 0) / run.length;
    door = run.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
  }
}

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  const { g: gr, T } = foot[x][z];

  // solid from y 0 up to the ground: foundation under the slope
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let y = gr; y < T; y++) {
    if (isShell(x, y, z)) {
      const ex = exposed(x, y, z);
      if (y === gr) put(x, y, z, "stone_bricks");                       // base course / plinth
      else if (y % 4 === 0 || y % 4 === 3) put(x, y, z, "white_concrete"); // string course, spandrel and cornice
      else {
        // window row: a corner or every third bay is a concrete pier, the rest glass panes with frames around
        const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
        const [dx] = ex[0];
        const along = dx ? z : x;
        if (corner || along % 3 === 0) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane",
          dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
             : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      }
      if (y === T - 1) put(x, T, z, "smooth_stone");                     // parapet on the top course
    } else if (y === gr || y % 4 === 0) {
      put(x, y, z, "smooth_stone");                                       // floor slab of each storey
    } else if (y === T - 1) {
      put(x, y, z, "gray_concrete");                                      // roof membrane over the top tier
    }                                                                     // else: air behind the glass
  }
}

// Roof plant: a few 2 x 2 concrete boxes on the top tier's interior, two blocks high, away from the parapet
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (x % 12 < 4 || x % 12 > 5 || z % 12 < 4 || z % 12 > 5) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => inFoot(qx, qz) && foot[qx][qz].T === 12 && !isShell(qx, 11, qz))) continue;
  for (const [qx, qz] of quad) { put(qx, 12, qz, "light_gray_concrete"); put(qx, 13, qz, "light_gray_concrete"); }
}

// Warm light behind some glass: a lantern in the ground storey, glowstone and shroomlight above, standing on the floor
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  const { g: gr, T } = foot[x][z];
  for (let y = gr + 1; y < T; y++) {
    if (!isShell(x, y, z) || y === gr || y % 4 === 0 || y % 4 === 3) continue;   // window rows only
    if (door && x === door[0] && z === door[1]) continue;
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;
    const [dx, dz] = ex[0];
    const along = dx ? z : x;
    if (along % 3 === 0) continue;                                         // a pier, not glass
    const xi = x - dx, zi = z - dz;                                        // the storey air behind this pane
    if (!occ(xi, y, zi) || isShell(xi, y, zi)) continue;
    if (y - 1 !== foot[xi][zi].g && (y - 1) % 4 !== 0) continue;            // needs a floor slab below
    if (y < 4 && along % 4 === 1) put(xi, y, zi, "lantern", { hanging: "false", waterlogged: "false" });
    else if (y >= 4 && y % 4 === 1 && along % 5 === 1) put(xi, y, zi, "glowstone");
    else if (y >= 4 && y % 4 === 1 && along % 5 === 3) put(xi, y, zi, "shroomlight");
  }
}

// The entrance: dark oak doors (two halves), a stone lintel over the door and its neighbours on the same face
if (door) {
  const [dx0, dz0] = door;
  const gr = foot[dx0][dz0].g;
  put(dx0, gr, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, gr + 1, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    if (isShell(dx0 + dx, gr + 2, dz0)) put(dx0 + dx, gr + 2, dz0, "smooth_stone");
  }
}

const out = `${DIR}/way_401588413.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries; door at ${door}`);
