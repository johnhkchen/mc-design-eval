import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial block, Xinyi district, c. 1990s: pale quartz-tile wall,
// dark-glass window bands, stone plinth, stepped mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245244";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 28, D = 20;
const ROOF = 15;      // solid roof slab row (3 storeys of 5 blocks)
const PARAPET = 16;   // parapet row, roof surface ~16 above lowest ground
const PH_TOP = 18;    // penthouse cap row

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const inside = new Map(cells.map(([x, z, gr]) => [key(x, z), Math.max(0, Math.round(gr))]));
const has = (x, z) => inside.has(key(x, z));

const FACES = [
  { dx: 0, dz: -1, facing: "north", axis: "z" },
  { dx: 0, dz: 1, facing: "south", axis: "z" },
  { dx: 1, dz: 0, facing: "east", axis: "x" },
  { dx: -1, dz: 0, facing: "west", axis: "x" },
];
const exposed = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundations, shell, floors, windows, parapet.
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const ex = exposed(x, z);
  const perim = ex.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const top = perim ? PARAPET : ROOF;
  for (let y = ground; y <= top; y++) {
    if (!perim) {
      if (y % 5 === 0 || y === ROOF) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === PARAPET) { put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === ground) { put(x, y, z, "polished_andesite"); continue; }   // base course
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }          // cornice course
    const band = y % 5;
    if (band === 0) { put(x, y, z, "light_gray_concrete"); continue; }    // storey line
    if (band === 4) {                                                     // spandrel / lintel
      put(x, y, z, y < 5 ? "polished_andesite" : "light_gray_concrete");
      continue;
    }
    // Window band rows 1..3 of each storey.
    if (ex.length > 1) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; } // corner column
    const idx = ex[0].axis === "z" ? x : z;
    if (idx % 3 === 0) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; } // mullion
    put(x, y, z, "light_blue_stained_glass");
  }
}

// Pass 2: warm lights glowing in some interior cells behind window glass.
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const f = ex[0];
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || exposed(ix, iz).length > 0) continue;
  for (const y of [2, 7]) {
    if (y <= ground) continue;
    const idx = f.axis === "z" ? x : z;
    if (idx % 3 === 0) continue;
    if ((x * 7 + z * 13 + y) % 5 === 0) put(ix, y, iz, "glowstone");
  }
}

// Pass 3: entrance on the north-most exposed face nearest the middle.
let door = null;
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z).filter((f) => f.dz === -1);
  if (!ex.length) continue;
  const score = Math.abs(x - 8) + z;
  if (!door || score < door.score) door = { x, z, gr: Math.max(0, Math.round(gr)), score };
}
if (door) {
  const yd = door.gr + 1;
  put(door.x, yd, door.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, yd + 1, door.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x, yd + 2, door.z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // lintel
}

// Pass 4: rooftop mechanical penthouse on interior cells near the centre.
for (let x = 5; x <= 11; x++) {
  for (let z = 7; z <= 12; z++) {
    if (!has(x, z) || exposed(x, z).length) continue;
    put(x, PARAPET, z, "smooth_quartz");
    put(x, PARAPET + 1, z, "smooth_quartz");
    put(x, PH_TOP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
