// Way 948317537: a three-storey brick commercial block (Edwardian/interwar Auckland, Newton/Eden Terrace fabric), 29 x 32 blocks.
// Massing from the lidar roof, median-smoothed and quantised to three flat tiers (6 / 9 / 13 blocks): a one-storey wing
// to the south-east, a two-storey middle, a three-storey parapeted core to the north-west. Each column stands on a stone
// foundation down to its lidar ground; the shell is one block thick with floor slabs at each storey line and air behind
// the glass. Ground floor is glazed shopfront with a dark timber fascia; one entrance door in the longest street run.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317537.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317537.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 29, Y = 25, Z = 32;

// --- footprint, lidar ground and roof -------------------------------------------------------------
const grid = (v) => Array.from({ length: X }, () => Array(Z).fill(v));
const inFP = grid(false), gr = grid(0), roofRaw = grid(0);
for (const [x, z, ground, roof] of cells) { inFP[x][z] = true; gr[x][z] = ground; roofRaw[x][z] = roof; }
const fp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && inFP[x][z];

// Roof: 3x3 median over the footprint (lidar noise), then three flat tiers: 6 = one storey + cap,
// 9 = two storeys + cap, 13 = three storeys + parapet (the lidar's roof reads about 13 above the lowest ground).
const top = grid(0);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFP[x][z]) continue;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (fp(x + dx, z + dz)) vals.push(roofRaw[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  top[x][z] = m >= 11 ? 13 : m >= 7 ? 9 : 6;
}

// The building envelope: footprint column from its ground up to its tier top.
const env = (x, y, z) => fp(x, z) && y >= gr[x][z] && y < top[x][z];
// Directions the open air lies in from a block; a block with none is interior (or a roof/floor slab cell).
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exposed = (x, y, z) => DIRS.filter(([, dx, dz]) => !env(x + dx, y, z + dz)).map(([n]) => n);
const along = (d, x, z) => (d === "north" || d === "south" ? x : z);   // coordinate running along a face

// --- entrance: the longest run of street-level faces in one direction, its middle glazed bay ---------
const runs = { north: [], south: [], west: [], east: [] };
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFP[x][z]) continue;
  const y = gr[x][z] + 1;
  if (!env(x, y, z)) continue;
  const dirs = exposed(x, y, z);
  if (dirs.length === 1 && along(dirs[0], x, z) % 3 !== 0) runs[dirs[0]].push([x, z]);
}
const doorDir = Object.keys(runs).sort((a, b) => runs[b].length - runs[a].length)[0];
const doorRun = runs[doorDir].sort((a, b) => along(doorDir, a[0], a[1]) - along(doorDir, b[0], b[1]));
const [doorX, doorZ] = doorRun[doorRun.length >> 1];

// --- the shell -----------------------------------------------------------------------------------
const g = new Voxels([X, Y, Z]);
const lanternSites = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFP[x][z]) continue;
  const base = gr[x][z], t = top[x][z];
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");            // foundation down to the lidar ground
  for (let y = base; y < t; y++) {
    const dirs = exposed(x, y, z);
    const r = (y - base) % 4;                                              // storey row: 0 floor line, 1-2 glazing, 3 head
    const ground = y - base < 4;
    if (!dirs.length) {                                                    // interior: floor slabs and the roof deck only
      if (r === 0 || y === t - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 1) {                                                     // parapet course
      if (dirs.length === 1) g.set(x, y, z, "smooth_quartz_stairs", { facing: dirs[0], half: "top", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === base) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (r === 0) { g.set(x, y, z, "smooth_quartz"); continue; }            // string course at each floor line
    if (r === 3) { g.set(x, y, z, ground ? "dark_oak_planks" : "bricks"); continue; }   // shop fascia / brick spandrel
    if (dirs.length > 1 || along(dirs[0], x, z) % 3 === 0) { g.set(x, y, z, "red_terracotta"); continue; }   // corner and pier
    const d = dirs[0];
    if (ground && x === doorX && z === doorZ && (y === base + 1 || y === base + 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: OPP[d], half: y === base + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground) { g.set(x, y, z, "glass"); }                              // shopfront glazing
    else {
      const ew = d === "north" || d === "south";                          // a pane joins its neighbours along the face
      g.set(x, y, z, "glass_pane", { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" });
    }
    if (r === 1) lanternSites.push([x, y, z, d]);
  }
}

// Warm lights: a standing lantern on the floor slab in the air gap behind every fourth window.
const IN = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
for (const [x, y, z, d] of lanternSites) {
  if ((x * 7 + z * 3 + y) % 4 !== 0) continue;
  const [ox, oz] = IN[d], ix = x + ox, iz = z + oz;
  if (!env(ix, y, iz) || exposed(ix, y, iz).length) continue;
  g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant on the three-storey core: a few iron boxes standing on the roof deck.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFP[x][z] || top[x][z] !== 13) continue;
  if (exposed(x, 12, z).length) continue;
  if ((x * 5 + z * 7) % 19 === 0) g.set(x, 13, z, "iron_block");
}

const stats = g.save(OUT);
console.log(`way_948317537: ${stats.blocks} blocks, ${stats.palette} palette entries, door ${doorDir} at (${doorX},${doorZ})`);
