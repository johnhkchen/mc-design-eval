// DC54682: a stone Classical (Federal-style) office block with a stepped central tower over three lidar tiers.
// Limestone walls, granite plinth, quartz string courses and cornice, glazed bays on 3-block storeys, a centred entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54682.cells.json", "utf8"));

// lidar roof heights as three flat tiers (wings 8, mid block 10, core 13), then a weighted vote over each cell's
// neighbours so the tier edges run clean instead of stair-stepping cell by cell
const tier = (r) => (r <= 8 ? 8 : r <= 11 ? 10 : 13);
const RAW = new Map();
for (const [x, z, ground, roof] of cells) RAW.set(`${x},${z}`, { g: ground, H: tier(roof) });
const FOOT = new Map();
for (const [x, z, ground] of cells) {
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = RAW.get(`${x + dx},${z + dz}`); if (!c) continue;
    const w = dx === 0 && dz === 0 ? 1.5 : 1;
    votes.set(c.H, (votes.get(c.H) || 0) + w);
  }
  const H = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  FOOT.set(`${x},${z}`, { g: ground, H });
}
const cell = (x, z) => FOOT.get(`${x},${z}`);
const solid = (x, y, z) => { const c = cell(x, z); return !!c && y >= 0 && y < c.H; };
const exposed = (x, y, z, dx, dz) => !solid(x + dx, y, z + dz);

const W = 14, D = 12, TOP = 13;
const g = new Voxels([W, TOP + 1, D]);
const made = new Map();                       // "x,y,z" -> block, so panes can see their neighbours
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); made.set(`${x},${y},${z}`, block); };
const has = (x, y, z) => made.has(`${x},${y},${z}`);

const ENTRANCE_Z = D - 1, ENTRANCE_X = 5;
const panes = [];                             // { x, y, z, alongX }
const lanterns = [];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { g: gr, H } = cell(x, z);
  for (let y = 0; y < H; y++) {
    const exX = exposed(x, y, z, -1, 0) || exposed(x, y, z, 1, 0);
    const exZ = exposed(x, y, z, 0, -1) || exposed(x, y, z, 0, 1);
    const ext = exX || exZ;
    if (y < gr) { put(x, y, z, "polished_granite"); continue; }                 // foundation under the lower cells
    if (y === H - 1) { put(x, y, z, ext ? "smooth_quartz" : "stone_bricks"); continue; }   // cornice / roof membrane
    if (y % 3 === 0) {                                                           // storey floor slabs, string courses
      put(x, y, z, y === 0 && ext ? "polished_granite" : ext ? "smooth_quartz" : "stone");
      continue;
    }
    if (!ext) continue;                                                          // interior air behind the glass
    // entrance bay on the south face: a door in the centre, calcite jambs
    if (z === ENTRANCE_Z && exZ && y <= 2 && x >= 4 && x <= 6) {
      if (x === ENTRANCE_X) {
        const half = y === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else put(x, y, z, "calcite");
      continue;
    }
    const along = exX && exZ ? -1 : exX ? z : x;
    if (along < 0) { put(x, y, z, "calcite"); continue; }                        // corner pilaster
    if (along % 4 !== 0) {                                                       // three glazed bays, then a pilaster
      panes.push({ x, y, z, alongX: !exX });
      put(x, y, z, "light_blue_stained_glass_pane");
      // a warm lantern hangs inside some top-row windows, under the floor slab above
      if (y % 3 === 2) {
        const ix = exX ? (exposed(x, y, z, -1, 0) ? x + 1 : x - 1) : x;
        const iz = exX ? z : (exposed(x, y, z, 0, -1) ? z + 1 : z - 1);
        if (((x + y + z) % 5 === 0) && solid(ix, y, iz) && !exposed(ix, y, iz, 0, 0)) lanterns.push([ix, y, iz]);
      }
    } else put(x, y, z, "calcite");
  }
}

// glass panes join their wall run: east/west on faces that run along x, north/south on faces along z
for (const p of panes) {
  const ax = p.alongX;
  const side = (dx, dz) => (has(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  const state = {
    north: ax ? "false" : side(0, -1),
    south: ax ? "false" : side(0, 1),
    east: ax ? side(1, 0) : "false",
    west: ax ? side(-1, 0) : "false",
    waterlogged: "false",
  };
  put(p.x, p.y, p.z, "light_blue_stained_glass_pane", state);
}
for (const [x, y, z] of lanterns) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54682.nbt"));
