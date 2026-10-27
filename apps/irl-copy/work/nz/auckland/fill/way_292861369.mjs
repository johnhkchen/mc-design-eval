// A 1980s-2000s glass-and-concrete office tower on a stone podium, Auckland CBD style: the lidar's 66-block core stands
// on a 16-block podium with two setbacks (shaft to 50, crown to 66, a penthouse to 70); the north-east corner is a
// two-storey wing. Storeys are 4 blocks; slabs at each storey line; air behind the glass. Foundations fill to each
// cell's ground, so the downhill side shows more wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861369.cells.json", "utf8"));
const X = 30, Y = 83, Z = 41;
const fp = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) fp[z][x] = { g, r };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[z][x] !== null;
const body = (x, z) => inFp(x, z) && fp[z][x].r >= 30;     // the tower body: the lidar's 66-block mass and its ragged 57/39/46 edge

// inset from the body's edge (0 on the edge), by 4-neighbour steps inside the body
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inset = Array.from({ length: Z }, () => Array(X).fill(-1));
const queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (body(x, z) && NB4.some(([dx, dz]) => !body(x + dx, z + dz))) { inset[z][x] = 0; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NB4) {
    const nx = x + dx, nz = z + dz;
    if (body(nx, nz) && inset[nz][nx] < 0) { inset[nz][nx] = inset[z][x] + 1; queue.push([nx, nz]); }
  }
}

// kind codes: 1 foundation, 2 podium, 3 shaft, 4 crown, 5 plant, 6 wing
const K = { found: 1, podium: 2, shaft: 3, crown: 4, plant: 5, wing: 6 };
// [y0, y1, kind] stacks per footprint cell: the wing's top is the lidar's roof quantised to 4s; the tower is a podium
// everywhere, a shaft set back two cells in from the edge (to 50), a crown set back four cells (to 66), a penthouse
// set back five (to 70)
function tiers(x, z) {
  if (!body(x, z)) return [[0, Math.min(16, Math.max(8, Math.round(fp[z][x].r / 4) * 4)), K.wing]];
  const d = inset[z][x], t = [[0, 16, K.podium]];
  if (d >= 2) t.push([16, 50, K.shaft]);
  if (d >= 4) t.push([50, 66, K.crown]);
  if (d >= 5) t.push([66, 70, K.plant]);
  return t;
}

// the solid massing: kind per voxel (0 = air), foundation to each cell's ground
const kind = new Uint8Array(X * Y * Z);
const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? 0 : kind[(z * Y + y) * X + x]);
const sol = (x, y, z) => at(x, y, z) !== 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  const g = fp[z][x].g;
  for (let y = 0; y < g; y++) kind[(z * Y + y) * X + x] = K.found;
  for (const [y0, y1, k] of tiers(x, z)) for (let y = Math.max(y0, g); y < y1; y++) kind[(z * Y + y) * X + x] = k;
}

const FACES = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const out = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => out.set(x, y, z, block, state);
const pane = (dir, block) => ({
  block,
  state: dir === "W" || dir === "E"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
});
const SPANDREL = { 2: "polished_andesite", 3: "white_concrete", 4: "white_concrete", 5: "light_gray_concrete", 6: "light_gray_concrete" };
const BAND = { 2: "polished_andesite", 3: "light_gray_concrete", 4: "light_gray_concrete", 5: "light_gray_concrete", 6: "light_gray_concrete" };
const GLASS = { 2: "gray_stained_glass_pane", 3: "light_blue_stained_glass_pane", 4: "light_blue_stained_glass_pane", 5: "iron_bars", 6: "light_blue_stained_glass_pane" };

// the entrance: the north face of the podium, at its lowest row on the north edge, nearest the middle of the tower
let door = null;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (kind[(z * Y + 8) * X + x] !== K.podium || sol(x, 8, z - 1)) continue;
  const score = z * 100 + Math.abs(x - 15);
  if (!door || score < door.score) door = { x, z, score, g: fp[z][x].g };
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  for (let y = 0; y < Y; y++) {
    const k = at(x, y, z);
    if (!k) continue;
    if (k === K.found) { put(x, y, z, "stone_bricks"); continue; }
    const exposed = FACES.filter(([, dx, dz]) => !sol(x + dx, y, z + dz));
    const top = !sol(x, y + 1, z);
    const slab = top || y % 4 === 0 || at(x, y + 1, z) !== k;   // a floor, or a tier's top or base
    if (top) {
      put(x, y, z, k === K.podium ? "smooth_stone" : "light_gray_concrete");
      if (exposed.length) put(x, y + 1, z, k === K.podium ? "polished_andesite" : "white_concrete");   // parapet
    } else if (slab) {
      if (exposed.length) put(x, y, z, SPANDREL[k]);
      else put(x, y, z, "light_gray_concrete");                       // floor slab; the interior is air
    } else if (exposed.length) {
      const axis = new Set(exposed.map(([n]) => (n === "W" || n === "E" ? "x" : "z")));
      if (y % 4 === 3) { put(x, y, z, BAND[k]); continue; }
      if (axis.size > 1) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
      const [dir] = exposed[0];
      const along = dir === "W" || dir === "E" ? z : x;
      if (along % 3 === 0) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
      const glass = k === K.podium && y < 4 ? "glass_pane" : GLASS[k];
      const p = glass === "iron_bars"
        ? { block: "iron_bars", state: pane(dir).state }
        : pane(dir, glass);
      put(x, y, z, p.block, p.state);
      // a warm light behind some panes, in the air gap inside the glass
      const [, dx, dz] = exposed[0];
      if (y % 4 === 1 && (along + y) % 7 === 2 && k !== K.plant && sol(x - dx, y, z - dz) === false && inFp(x - dx, z - dz)) {
        put(x - dx, y, z - dz, (k === K.podium ? (along + y) % 2 === 0 : false) ? "shroomlight" : "glowstone");
      }
    }
  }
}

// the entrance: door pair on the north face, piers either side, a hood over the bay at the head of the door
{
  const { x: ex, z: ez, g } = door;
  for (const dx of [-1, 1]) for (const y of [g, g + 1]) put(ex + dx, y, ez, "quartz_pillar", { axis: "y" });
  put(ex, g, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, g + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) put(ex + dx, g + 2, ez, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// the podium terrace (sixteen up): lanterns and planters on the inner ring, and the penthouse's lightning rod
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z) || at(x, 15, z) !== K.podium || sol(x, 16, z) || inset[z][x] !== 1) continue;
  if ((x + z) % 4 === 0) put(x, 16, z, "lantern", { hanging: "false", waterlogged: "false" });
  else if ((2 * x + z) % 9 === 0) put(x, 16, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}
{
  let sx = 0, sz = 0, n = 0;
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (at(x, 69, z) === K.plant) { sx += x; sz += z; n++; }
  if (n) put(Math.round(sx / n), 70, Math.round(sz / n), "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const stats = out.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861369.nbt");
console.log("door at", door, "blocks", stats.blocks, "palette", stats.palette);
