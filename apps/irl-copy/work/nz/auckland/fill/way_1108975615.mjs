// Eight The Mews: a 1990s four-storey concrete office and retail block on a glazed shopfront base. Its roof comes from the
// lidar (24 blocks above the lowest ground, a plant core at 26); the ground is 0 to 8 blocks under it. Storeys are 4 blocks:
// a shopfront from each cell's ground to y 11, then floor slabs at 12, 16 and 20. The facade is a bay grid: a 3-block rhythm
// of concrete piers and tinted glass panes with spandrels, a stone base and cornice, and a dark-oak entrance. Inside the glass
// is an air gap with a floor slab per storey; a few glowstone lamps sit behind the panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1108975615.cells.json", "utf8"));

// lidar roof heights cluster into four flat tiers: the plant core (26), the main body (24), the lower wings (20), and the
// low podium and noise at the edges (12)
const tierOf = (r) => (r >= 26 ? 26 : r >= 23 ? 24 : r >= 19 ? 20 : 12);
const SLABS = [12, 16, 20];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, T: tierOf(r) });
const at = (x, z) => cell.get(`${x},${z}`);

// the faces of a column at height y that are outside the building: no neighbour, or a neighbour whose top is below y
function exposedFaces(x, z, y) {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const n = at(x + dx, z + dz);
    if (!n || n.T <= y) out.push([dx, dz]);
  }
  return out;
}

// the block of one cell at height y: null is air (an interior void), and a window carries its facing for the pane's arms
function classify(x, z, y, { g, T }) {
  if (y < g) return { block: "stone" };
  if (y >= T) return y === T && DIRS.some(([dx, dz]) => !at(x + dx, z + dz)) ? { block: "smooth_stone" } : null;   // parapet on the outer edge
  const faces = exposedFaces(x, z, y);
  const cap = y === T - 1;
  if (!faces.length) {
    if (y === g) return { block: "smooth_stone" };        // interior floor on the foundation
    if (cap) return { block: "gray_concrete" };           // flat roof membrane
    if (SLABS.includes(y)) return { block: "light_gray_concrete" };
    return null;
  }
  if (cap) return { block: "smooth_stone" };               // cornice
  if (y === g) return { block: "stone_bricks" };           // base course
  if (SLABS.includes(y)) return { block: "light_gray_concrete" };
  if (y === 11) return { block: "gray_concrete" };         // shopfront fascia
  if (SLABS.some((s) => y === s + 3)) return { block: "light_gray_concrete" };
  if (faces.length >= 2) return { block: "smooth_stone" }; // corner pier
  const [dx, dz] = faces[0];
  const along = dx ? z : x;
  if (along % 3 === 0) return { block: "smooth_stone" };   // pier between bays
  if (T === 26) return { block: "iron_bars", face: faces[0] };
  return { block: "light_blue_stained_glass_pane", face: faces[0] };
}

const g = new Voxels([46, 39, 40]);
const windows = [];   // [x, y, z, faceDx, faceDz] for the lamp pass
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z, , ] of cells) {
  const c = at(x, z);
  for (let y = 0; y <= c.T; y++) {
    const r = classify(x, z, y, c);
    if (!r) continue;
    if (r.face) {
      // panes run along the facade, so their arms reach east-west on a north or south face and north-south on east or west
      const along = r.face[0] ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
      const block = r.block === "iron_bars" ? "iron_bars" : r.block;
      put(x, y, z, block, { ...along, waterlogged: "false" });
      windows.push([x, y, z, r.face[0], r.face[1]]);
    } else {
      put(x, y, z, r.block);
    }
  }
  // roof equipment on the main roof
  if (c.T === 24 && x >= 17 && x <= 19 && z >= 11 && z <= 12) put(x, 24, z, "iron_block");
}

// warm light behind some panes: the air gap just inside the glass (on the storey's floor) gets glowstone
for (const [x, y, z, dx, dz] of windows) {
  if ((x * 31 + y * 17 + z * 7) % 6 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  const inner = at(ix, iz);
  if (!inner || exposedFaces(ix, iz, y).length || y < 1) continue;
  if (classify(ix, iz, y, inner)) continue;
  put(ix, y, iz, "glowstone");
}

// the entrance: on the north face (z 0), in a window bay, with a stone surround and a lantern inside
const entryX = [8, 9, 10, 11, 12, 13, 14].find((x) => {
  const c = at(x, 0);
  if (!c || c.T !== 24 || x % 3 === 0) return false;
  return true;
});
if (entryX !== undefined) {
  const c = at(entryX, 0);
  const lo = c.g + 1, hi = c.g + 2;
  put(entryX, lo, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(entryX, hi, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) put(entryX + dx, lo, 0, "stone_bricks");
  for (let dx = -1; dx <= 1; dx++) put(entryX + dx, c.g + 3, 0, "stone_bricks");
  if (at(entryX, 1)) put(entryX, lo, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1108975615.nbt");
console.log(JSON.stringify({ cells: cells.length, entryX, ...stats }));
