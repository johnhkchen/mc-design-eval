// Way 910658678, Auckland CBD edge: a three-storey 1920s brick commercial block with a plastered (quartz) string
// course and cornice, a stone base and a basalt plinth on the uphill (south-east) side, and a shopfront on the
// downhill (north) side. Footprint 10 x 8 from the cells; the lidar's flat 14-block roof is kept as the massing, with
// the 7-high lower wing at cell (1,2). Storey lines sit at y 4 and 8 (absolute), so each floor stands on the one below.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658678.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..7

const byXZ = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const at = (x, z) => byXZ.get(`${x},${z}`);
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const OPP = { N: "S", S: "N", W: "E", E: "W" };

// the faces a cell shows to the air: no neighbour, or a neighbour whose roof is lower (its wall rises above that roof)
const exposed = (x, z) => {
  const c = at(x, z);
  return DIRS.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.r < c.r; }).map(([d]) => d);
};

// window bays run along the wall: a pier (brick) every third cell, glass in between; corners are always piers
const bayOf = (x, z, faces) => {
  const ns = faces.some((f) => f === "N" || f === "S"), ew = faces.some((f) => f === "W" || f === "E");
  if (ns && ew) return { pier: true };
  return ns ? { pier: x % 3 === 0, face: faces[0] } : { pier: z % 3 === 0, face: faces[0] };
};

const WINDOW_ROWS = new Set([1, 2, 5, 6, 9, 10]);   // glass in the storeys: ground 1-2, second 5-6, third 9-10
const STRING_ROWS = new Set([4, 8]);                // full quartz string courses at the floor lines
const LINTEL_ROWS = new Set([3, 7, 11]);            // quartz over the window bays
const FLOOR_ROWS = new Set([4, 8]);

const g = new Voxels([10, 27, 8]);
const DOOR = { x: 2, z: 0 };                        // entrance on the north (downhill) front

for (const [x, z, ground, roof] of cells) {
  const faces = exposed(x, z);
  const exterior = faces.length > 0;
  const { pier, face } = exterior ? bayOf(x, z, faces) : { pier: true };
  const isDoor = x === DOOR.x && z === DOOR.z;

  for (let y = 0; y < roof; y++) {
    // foundation: solid volcanic rubble under the ground line, everywhere under the footprint
    if (y < ground) { g.set(x, y, z, "cobblestone"); continue; }

    if (!exterior) {
      // inside: a floor slab at each storey line and a roof deck; air elsewhere (an air gap behind the glass)
      if (y === ground || FLOOR_ROWS.has(y) || y === roof - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (isDoor && (y === 1 || y === 2)) {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }                  // base course
    if (y === roof - 1) { g.set(x, y, z, "bricks"); continue; }                      // parapet
    if (y === roof - 2) { g.set(x, y, z, "quartz_block"); continue; }                // cornice
    if (STRING_ROWS.has(y)) { g.set(x, y, z, "quartz_block"); continue; }            // string course at the floor line
    if (LINTEL_ROWS.has(y)) { g.set(x, y, z, pier ? "bricks" : "quartz_block"); continue; }
    if (WINDOW_ROWS.has(y) && !pier) {
      g.set(x, y, z, "glass_pane");
      // a warm light in some windows, set in the air gap just behind the glass
      const dx = face === "N" ? 0 : face === "S" ? 0 : face === "W" ? 1 : -1;
      const dz = face === "N" ? 1 : face === "S" ? -1 : 0;
      const ix = x + dx, iz = z + dz, inner = at(ix, iz);
      if (inner && !exposed(ix, iz).length && y > inner.g && y < inner.r - 1 && !FLOOR_ROWS.has(y) && ((x * 7 + z * 5 + y) % 4 === 0))
        g.set(ix, y, iz, y <= 2 ? "glowstone" : "shroomlight");
      continue;
    }
    g.set(x, y, z, "bricks");
  }
}

// the door: keep the threshold level, with the lintel above it
g.set(DOOR.x, 3, DOOR.z, "quartz_block");

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658678.nbt");
console.log(`way_910658678: ${blocks} blocks, palette ${palette}`);
