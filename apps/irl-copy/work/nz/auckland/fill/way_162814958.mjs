// Liverpool House: a 1970s-80s concrete-frame office block (a tinted-glass curtain wall between concrete spandrels,
// stepped down from an 8-storey core through a 6-storey podium to 6-storey wings). Read from the lidar roof record:
// 33 blocks is the core, 29 the podium, 25 the wings; storey lines fall every 4 blocks from the lowest ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814958.cells.json", "utf8"));
const W = 43, D = 57, TOP = 45;
const vox = new Voxels([W, TOP, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map(), ROOF = new Map();
for (const [x, z, gr, r] of cells) { GROUND.set(key(x, z), gr); ROOF.set(key(x, z), r); }
const inFp = (x, z) => GROUND.has(key(x, z));
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB6 = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];

// Roof tiers from the lidar: smooth the noise into three flat levels (wing 25, podium 29, core 33). Stray low values
// (under 15) take the wing level.
const tierOf = (r) => (r < 15 ? 25 : r >= 31 ? 33 : r >= 26 ? 29 : 25);
const H = new Map();
for (const [k, r] of ROOF) H.set(k, tierOf(r));
// Setback: the core stands back one cell from the podium's edge, so its outer ring steps down to the podium roof.
const coreRaw = new Map(H);
for (const [k] of ROOF) {
  if (coreRaw.get(k) !== 33) continue;
  const [x, z] = k.split(",").map(Number);
  let inner = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (coreRaw.get(key(x + dx, z + dz)) !== 33) inner = false;
  if (!inner) H.set(k, 29);
}
const h = (x, z) => H.get(key(x, z));
const gr = (x, z) => GROUND.get(key(x, z));
const inM = (x, y, z) => inFp(x, z) && y >= 0 && y < h(x, z);

// The building is a solid massing over the footprint, hollowed: interior air behind a one-block shell, with a floor
// slab on every storey line (y % 4 == 0). Below each cell's ground is foundation.
const panes = [];
const wall = (x, y, z) => {
  if (y === 0) return vox.set(x, y, z, "stone_bricks");                       // base course at street level
  if (y % 4 === 0) return vox.set(x, y, z, "light_gray_concrete");          // storey line / floor edge
  if (y % 4 === 3) return vox.set(x, y, z, "white_concrete");               // spandrel under the window band
  if ((x + z) % 3 === 0) return vox.set(x, y, z, "light_gray_concrete");    // aluminium mullion every 3 blocks
  panes.push([x, y, z]);
  return vox.set(x, y, z, "cyan_stained_glass_pane", {});
};

for (const [k] of GROUND) {
  const [x, z] = k.split(",").map(Number);
  const top = h(x, z), base = gr(x, z);
  for (let y = 0; y < top; y++) {
    if (y < base) { vox.set(x, y, z, "stone_bricks"); continue; }                // foundation to the lowest ground
    if (y === top - 1) { vox.set(x, y, z, "smooth_stone"); continue; }           // roof slab
    const shell = NB6.some(([dx, dy, dz]) => !inM(x + dx, y + dy, z + dz));
    if (!shell) { if (y % 4 === 0) vox.set(x, y, z, "smooth_stone"); continue; } // interior: a floor slab, else air
    wall(x, y, z);
  }
  // Parapet on the roof's outer edge (where the cell next to it is lower or outside the footprint).
  const edge = NB4.some(([dx, dz]) => !inFp(x + dx, z + dz) || h(x + dx, z + dz) < top);
  if (edge) vox.set(x, top, z, "white_concrete");
}

// Entrance on the north tip: a door on the ground floor, a glass bay beside it, and a canopy slab over both.
const DOOR = [12, 0];
const doorBase = gr(...DOOR) + 0;
vox.set(DOOR[0], doorBase, DOOR[1], "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
vox.set(DOOR[0], doorBase + 1, DOOR[1], "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [12, 13]) vox.set(x, 3, 0, "smooth_stone");                      // canopy over the entry, on the walls behind

// Roof plant: the core's lift overrun (a 4 x 4 box with iron louvres on top) and two 2 x 2 plant boxes on the podium.
const overrun = [];
for (let x = 17; x <= 20; x++) for (let z = 29; z <= 32; z++) if (h(x, z) === 33) overrun.push([x, z]);
if (overrun.length === 16) for (const [x, z] of overrun) {
  const ring = x === 17 || x === 20 || z === 29 || z === 32;
  vox.set(x, 33, z, "light_gray_concrete");
  vox.set(x, 34, z, "light_gray_concrete");
  if (ring) vox.set(x, 35, z, "light_gray_concrete"); else vox.set(x, 35, z, "iron_block");
}
const plant = [];
for (let x = 22; x < 40 && plant.length < 2; x++) for (let z = 8; z < 50 && plant.length < 2; z++) {
  const box = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = box.every(([bx, bz]) => inFp(bx, bz) && h(bx, bz) === 29 && NB4.every(([dx, dz]) => inFp(bx + dx, bz + dz) && h(bx + dx, bz + dz) === 29));
  if (!ok || plant.some(([px, pz]) => Math.abs(px - x) < 8 && Math.abs(pz - z) < 8)) continue;
  plant.push([x, z]);
  for (const [bx, bz] of box) { vox.set(bx, 29, bz, "light_gray_concrete"); vox.set(bx, 30, bz, "light_gray_concrete"); }
}

// Glass panes connect to the solid neighbours in their own wall plane.
for (const [x, y, z] of panes) {
  const solid = (dx, dz) => vox.get(x + dx, y, z + dz) !== null;
  vox.set(x, y, z, "cyan_stained_glass_pane", {
    east: String(solid(1, 0)), west: String(solid(-1, 0)),
    north: String(solid(0, -1)), south: String(solid(0, 1)), waterlogged: "false",
  });
}

// Warm lights behind some windows: a lantern on the interior floor, against the glass.
let lanterns = 0;
for (const [x, y, z] of panes) {
  if (y % 4 !== 1 || (x * 2 + z * 5 + y * 3) % 7 !== 0) continue;             // some bays only, spread over the walls
  for (const [dx, dz] of NB4) {
    const ix = x - dx, iz = z - dz;                                                // one step inside
    if (!inM(ix, y, iz) || vox.val(ix, y, iz) !== 0 || !vox.get(ix, y - 1, iz)) continue;
    vox.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    lanterns++; break;
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814958.nbt";
const stats = vox.save(out);
console.log(JSON.stringify({ ...stats, panes: panes.length, lanterns, overrun: overrun.length, plant }));
