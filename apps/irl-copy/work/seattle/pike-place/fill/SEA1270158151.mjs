import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Pier 59, Seattle Aquarium (1977): one tall concrete storey on a stone plinth, a glazed band of window bays,
// a deep cornice and stone parapet, a flat roof with skylights and plant boxes. The south (Elliott Bay) face is the
// lowest ground, so its plinth is short and its storey runs full height; the uphill north-east side sits on fill.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${dir}/SEA1270158151.cells.json`, "utf8"));

const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => G.has(`${x},${z}`);
const ext = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const ROOF = 5;        // roof deck / cornice level
const PARAPET = 6;     // stone parapet ring
const PLINTH = "stone_bricks";
const FOUNDATION = "gray_concrete";
const PIER = "light_gray_concrete";
const SPANDREL = "white_concrete";
const CORNICE = "smooth_stone";
const COPING = "smooth_stone_slab";
const DECK = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SKYLIGHT = "light_blue_stained_glass";
const DOOR = "dark_oak_door";

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);
const ENTRY = new Set(["5,8", "6,8"]);
const hinge = { 5: "left", 6: "right" };

for (const [x, z, g] of cells) {
  const edge = ext(x, z);
  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < Math.max(g, 1); y++) put(x, y, z, FOUNDATION);
  if (!edge) { put(x, ROOF, z, DECK); continue; }

  // base course at the ground line, storey walls above it, spandrel at the storey line, cornice and parapet on top
  put(x, g, z, PLINTH);
  const zFace = !has(x, z - 1) || !has(x, z + 1);      // a missing neighbour across z: a north or south face
  const entry = ENTRY.has(`${x},${z}`);
  for (let y = g + 1; y < ROOF; y++) {
    if (y === 4) { put(x, y, z, SPANDREL); continue; }
    if (entry && (y === 1 || y === 2)) {
      put(x, y, z, DOOR, { facing: "south", half: y === 1 ? "lower" : "upper", hinge: hinge[x], open: "false", powered: "false" });
      continue;
    }
    if (entry && y === 3) { put(x, y, z, SKYLIGHT); continue; }     // glass canopy over the doors
    const bay = zFace ? x % 3 !== 0 : z % 3 !== 0;                  // two glazed bays to every concrete pier
    put(x, y, z, bay ? GLASS : PIER);
  }
  put(x, ROOF, z, CORNICE);
  put(x, PARAPET, z, COPING, { type: "bottom", waterlogged: "false" });
}

// interior: a skylight on some deck cells, two plant boxes on the roof
const interior = cells.filter(([x, z]) => !ext(x, z));
for (const [x, z] of interior) if ((x * 3 + z * 5) % 11 === 0) put(x, ROOF, z, SKYLIGHT);
if (interior.length >= 6) {
  for (const i of [Math.floor(interior.length / 3), Math.floor((2 * interior.length) / 3)]) {
    const [x, z] = interior[i];
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "copper_block");
  }
}

// warm light behind some glazed bays: glowstone and shroomlight on the interior cell just inside the glass
for (const [k, v] of [...plan]) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y !== 2 || (x + 2 * z) % 3 !== 0) continue;
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1; else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1; else if (!has(x + 1, z)) ix = x - 1;
  if (!has(ix, iz) || ext(ix, iz) || at(ix, y, iz)) continue;
  put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
}

// glass panes connect to whatever stands beside them
for (const [k, v] of plan) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  v.state = { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
}

const g = new Voxels([9, 19, 9]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
console.log(g.save(`${dir}/SEA1270158151.nbt`));
