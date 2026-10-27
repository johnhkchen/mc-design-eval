// Way 1095572128, Auckland: a two-storey red-brick commercial block in the stripped-classical manner of the 1920s
// (brick walls, cream smooth-quartz string course and cornice, a timber shopfront on the south street face). Its north-
// west corner rises a third tier to the lidar's 9-block roof, so the massing steps down to the 7-block wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572128.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..7, z 0..9

const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const cell = (x, z) => FOOT.get(`${x},${z}`);

// The four faces of a footprint cell. "across" is the axis the wall runs along (x on north and south faces).
const SIDES = [
  { name: "north", dx: 0, dz: -1, across: "x" },
  { name: "south", dx: 0, dz: 1, across: "x" },
  { name: "west", dx: -1, dz: 0, across: "z" },
  { name: "east", dx: 1, dz: 0, across: "z" },
];
// The faces of cell (x, z) at height y that meet the outdoors: no cell beside them, or a lower roof beside them.
const exposed = (x, z, y) => SIDES.filter(s => { const n = cell(x + s.dx, z + s.dz); return !n || y >= n.roof; });

// The street is the south face. Its shopfront is the only ground floor with a door and a timber fascia.
const DOOR_CANDIDATES = cells.filter(([x, z]) => { const e = exposed(x, z, 1); return e.length === 1 && e[0].name === "south" && x % 4 === 1; });
const DOOR = DOOR_CANDIDATES.length ? DOOR_CANDIDATES[Math.floor(DOOR_CANDIDATES.length / 2)] : null;

const g = new Voxels([8, 22, 10]);
const glazed = [];
// A small, fixed pattern: about a third of the windows are lit from behind, so the block glows at dusk without a sameness.
const lit = (x, y, z) => (x * 5 + y * 3 + z * 7) % 3 === 0;
const paneState = (side) => side.across === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, ground, roof] of cells) {
  for (let y = ground; y < roof; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) {                                   // solid core; the roof deck is the top course of the core
      g.set(x, y, z, y === roof - 2 ? "gray_concrete" : "stone");
      continue;
    }
    const side = ex.find(s => s.across === "x") ?? ex[0];   // the glazed face: an x-running wall where there is one
    const street = ex.some(s => s.name === "south");
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                           // base course
    if (y === 3) { g.set(x, y, z, street ? "dark_oak_planks" : "smooth_quartz"); continue; }   // string course / shop fascia
    if (y === roof - 1 || (y === 6 && roof === 9)) { g.set(x, y, z, "smooth_quartz"); continue; }  // cornice, parapet cap, tier string
    const u = side.across === "x" ? x : z;
    const window = u % 4 === 1 || u % 4 === 2;                                          // two-bay windows, brick piers between
    if (DOOR && x === DOOR[0] && z === DOOR[1] && side.name === "south" && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (window) { g.set(x, y, z, "glass_pane", paneState(side)); glazed.push({ x, y, z, side }); continue; }
    if (street && y < 3) { g.set(x, y, z, "dark_oak_log", { axis: "y" }); continue; }   // shopfront posts
    g.set(x, y, z, "bricks");
  }
}

// An air gap behind each glass pane (the wall is hollow there), lit in some windows. The top row of each storey is
// left solid: a pocket there would open the roof.
for (const { x, y, z, side } of glazed) {
  const ix = x - side.dx, iz = z - side.dz, inner = cell(ix, iz);
  if (!inner || y >= inner.roof - 2 || exposed(ix, iz, y).length) continue;
  g.set(ix, y, iz, lit(x, y, z) ? "glowstone" : "air");
}

// Roof plant: a low box on each flat roof, set well inside the parapet.
for (const [x, z, y] of [[5, 3, 6], [6, 3, 6], [5, 4, 6], [6, 4, 6], [2, 2, 8], [2, 3, 8]]) {
  if (cell(x, z) && !exposed(x, z, y).length) g.set(x, y, z, "light_gray_concrete");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572128.nbt";
const res = g.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
