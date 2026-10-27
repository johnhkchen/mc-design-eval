// The Rock: a 4-to-7 storey Auckland office and civic block of the 1970s-80s, on a 100 x 118 m footprint. Its lidar roof
// sits 13-20 blocks above y0 with a taller core at 22-27. Massing: the roof is smoothed (a box mean over 9 x 9 cells),
// then quantised to 4-block tiers (12, 16, 20, 24, 28), so the lower wings step up to a 5-6 storey core. Walls are a
// one-block shell on the footprint's edge (and on any face that stands above a shorter neighbour); the inside is air
// except one floor slab per storey. Facades: white concrete spandrels, light-grey string courses and mullions, blue
// glass between them, a polished-andesite plinth and parapet, a shopfront on the ground storey, two entrances with doors
// and a timber lintel, glowstone behind some lower windows, and plant boxes on the roof of the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 120, D = 142;
const cells = JSON.parse(readFileSync(`${DIR}/way_258867705.cells.json`, "utf8"));

// the footprint: index -> { x, z, g (ground), r (lidar roof), T (tier top, set below) }
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(z * W + x, { x, z, g, r, T: 0 });
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp.has(z * W + x);
const at = (x, z) => fp.get(z * W + x);

// 1. the roof: a box mean over 9 x 9 footprint cells, quantised to 4-block tiers, never below one storey over ground
const R = 4;
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
    if (!inFp(c.x + dx, c.z + dz)) continue;
    s += at(c.x + dx, c.z + dz).r; n++;
  }
  c.T = Math.max(8, Math.min(28, 4 * Math.round(s / n / 4)));
  c.T = Math.max(c.T, c.g + 4);
}

// 2. exposed faces at height y: a side that faces off the footprint, or a neighbour whose tier has already ended
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (c, y) => DIRS.filter(([, dx, dz]) => !inFp(c.x + dx, c.z + dz) || y >= at(c.x + dx, c.z + dz).T);
const taller = (c) => DIRS.some(([, dx, dz]) => inFp(c.x + dx, c.z + dz) && at(c.x + dx, c.z + dz).T > c.T);

// 3. entrances: the two longest faces at ground level get a 2-wide door in their middle
const doors = new Map();
const faceCount = { north: [], south: [], west: [], east: [] };
for (const c of fp.values()) {
  const ex = exposed(c, c.g + 1);
  if (ex.length === 1) faceCount[ex[0][0]].push(c);
}
for (const [name, list] of Object.entries(faceCount).sort((a, b) => b[1].length - a[1].length).slice(0, 2)) {
  const horiz = name === "north" || name === "south";
  list.sort((a, b) => (horiz ? a.x - b.x : a.z - b.z));
  const mid = Math.floor(list.length / 2);
  list.slice(mid, mid + 2).forEach((c) => doors.set(c.z * W + c.x, name));
}
const doorFacing = (c) => doors.get(c.z * W + c.x);

// glass panes connect along the wall they are in
const paneState = (face) => (face === "north" || face === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels([W, 40, D]);

// 4. the columns
for (const c of fp.values()) {
  const { x, z, T } = c, gr = c.g;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");        // foundation to the ground
  const ground = exposed(c, gr).length ? "polished_andesite" : "smooth_stone";
  g.set(x, gr, z, ground);                                            // plinth on the edge, floor inside
  for (let y = gr + 1; y < T; y++) {
    const s = y - gr, rr = s % 4, k = Math.floor(s / 4);
    const ex = exposed(c, y);
    if (y === T - 1) {                                                  // the roof covering (cornice on the edge)
      g.set(x, y, z, ex.length ? "light_gray_concrete" : taller(c) ? "gray_concrete" : "smooth_stone");
      continue;
    }
    if (rr === 0) {                                                     // storey line: string course or floor slab
      g.set(x, y, z, ex.length ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!ex.length) continue;                                           // interior air behind the glass
    if (rr === 3) { g.set(x, y, z, "white_concrete"); continue; }        // spandrel
    const [face] = ex[0];
    const along = face === "north" || face === "south" ? x : z;
    if (ex.length > 1) { g.set(x, y, z, "smooth_quartz"); continue; }   // corner pilaster
    const mullion = k === 0 ? along % 4 === 0 : along % 3 === 0;      // shopfront is more open on the ground storey
    if (mullion) { g.set(x, y, z, "light_gray_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", paneState(face));
  }
  if (exposed(c, T).length) g.set(x, T, z, "polished_andesite");     // parapet crown
}

// 5. doors (two blocks high, each cell's own storey) and a timber lintel
for (const c of fp.values()) {
  const face = doorFacing(c);
  if (!face) continue;
  const hinge = "left";
  g.set(c.x, c.g + 1, c.z, "dark_oak_door", { facing: face, half: "lower", hinge, open: "false", powered: "false" });
  g.set(c.x, c.g + 2, c.z, "dark_oak_door", { facing: face, half: "upper", hinge, open: "false", powered: "false" });
  g.set(c.x, c.g + 3, c.z, "dark_oak_planks");
}

// 6. warm light: glowstone on the inside of some lower windows, on an air cell with a floor under it
for (const c of fp.values()) {
  const ex = exposed(c, c.g + 1);
  if (ex.length !== 1 || doorFacing(c)) continue;
  const [face, dx, dz] = ex[0];
  const along = face === "north" || face === "south" ? c.x : c.z;
  if ((along * 5 + c.g * 3) % 9 !== 0) continue;
  const ix = c.x - dx, iz = c.z - dz;
  if (!inFp(ix, iz)) continue;
  const inner = at(ix, iz);
  if (exposed(inner, c.g + 1).length || inner.T <= c.g + 2) continue;
  g.set(ix, c.g + 1, iz, "glowstone");
}

// 7. roof plant on the tower and the core: boxes on the roof covering, two blocks high
for (const c of fp.values()) {
  if (c.T < 20 || exposed(c, c.T).length || taller(c)) continue;
  if (c.x % 10 !== 5 || c.z % 10 !== 5) continue;
  g.set(c.x, c.T, c.z, "iron_block");
  g.set(c.x, c.T + 1, c.z, "iron_block");
}

const { blocks, palette } = g.save(`${DIR}/way_258867705.nbt`);
console.log(`way_258867705: ${fp.size} cells, ${blocks} blocks, ${palette} palette entries`);
