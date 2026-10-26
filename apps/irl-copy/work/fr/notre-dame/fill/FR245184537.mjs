// FR245184537: an 1895 Haussmann block of residential flats in pale limestone (calcite) on a polished granite plinth, with a
// grey zinc mansard (deepslate tiles) and glass dormers, a sandstone string course at each storey line, quoins at the corners
// and a porte-cochere entrance on the south front. Lidar roofs read 20 blocks over most of the footprint (five 4-block
// storeys: 3 m at 1.4 blocks a metre) and step down to 16, 12 and 8 on the wings; the tiers come from the median of each
// cell's 3x3 neighbourhood, so the lidar noise becomes flat tiers. Every column is solid from its ground to its roof; only the
// air behind each window and the entrance hall are hollow, each sealed by the floor slabs above and below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184537.cells.json`, "utf8"));

const W = 26, H = 36, D = 31;
const SLABS = [5, 9, 13, 17];                       // floor lines: RDC/1st, 1st/2nd, 2nd/3rd, 3rd/mansard
const LIME = "calcite", BAND = "smooth_sandstone", BASE = "polished_andesite", ROOF = "deepslate_tiles";
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const fp = new Map();                               // "x,z" -> { gr, r, T }
for (const [x, z, gr, r] of cells) fp.set(`${x},${z}`, { gr, r, T: 0 });
const inFp = (x, z) => fp.has(`${x},${z}`);
const tierOf = (v) => (v >= 18 ? 20 : v >= 14 ? 16 : v >= 10 ? 12 : 8);
for (const [k, c] of fp) {                          // flat tiers: the 3x3 median of the lidar roof, snapped
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(`${x + dx},${z + dz}`); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.T = tierOf(vals[vals.length >> 1]);
}
const outward = (x, z) => Object.keys(DIRS).filter(d => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
// a step down to a lower tier is a face too: its exposed wall above the lower roof gets the same skin as the street front
const stepDown = (x, z) => Object.keys(DIRS).filter(d => { const n = fp.get(`${x + DIRS[d][0]},${z + DIRS[d][1]}`); return n && n.T <= fp.get(`${x},${z}`).T - 2; });

const g = new Voxels([W, H, D]);
const facades = [];                                 // { x, z, face, win, T, gr, quoin, along }

// pass 1: the solid envelope, plinth, cover and facade skin
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const { gr, T } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);
  for (let y = gr; y < T; y++) g.set(x, y, z, LIME);
  g.set(x, T - 1, z, ROOF);
  const faces = [...outward(x, z), ...stepDown(x, z)];
  if (!faces.length) {
    // a chimney stack on the mansard roofs, one every few cells
    if (T === 20 && x % 7 === 3 && z % 9 === 4) for (let y = T; y < T + 4; y++) g.set(x, y, z, "bricks");
    if (T === 20 && x % 7 === 3 && z % 9 === 4) g.set(x, T + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }
  const face = faces[0], north = face === "north" || face === "south";
  const along = north ? x : z;
  const win = along % 4 === 1 || along % 4 === 2;   // two stone piers, then two windows: less glazing, more limestone
  const quoin = false;                              // the jagged street edge makes too many corners for quoins: the piers carry the bays
  const pane = north ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                     : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const rail = { ...pane, waterlogged: "false" };
  facades.push({ x, z, face, win, T, gr, quoin, along, north, pane, rail });
  for (let y = gr; y <= T - 2; y++) {
    let b;
    if (y === gr) b = [BASE];                       // base course on the foundation
    else if (quoin) b = [BAND];                     // quoins at the corners
    else if (SLABS.includes(y)) b = [BAND];         // string courses at each floor line
    else if (T === 20 && y === 18) b = win ? ["glass_pane", pane] : [ROOF];   // mansard dormers
    else if (y < SLABS[0]) b = win ? ["glass_pane", pane] : [LIME];           // ground floor glazing
    else {
      const F = SLABS.filter(s => s < y).pop();
      if (y - F === 1) b = win ? ["iron_bars", rail] : [LIME];                // balcony rail at each sill
      else b = win ? ["glass_pane", pane] : [LIME];
    }
    g.set(x, y, z, b[0], b[1]);
  }
}

// pass 2: the air behind each window (sealed by the slabs), a lantern in some, and the porte-cochere entrance
// each window's interior cell is air from the sill up to the storey's top, with the floor slabs left solid, so every pocket is
// one cell deep and sealed; one pocket in six gets a lantern standing on the first floor's slab
let n = 0;
for (const f of facades) {
  if (!f.win || f.quoin) continue;
  const ix = f.x - DIRS[f.face][0], iz = f.z - DIRS[f.face][1];
  if (!inFp(ix, iz) || outward(ix, iz).length) continue;
  for (let y = f.gr + 1; y <= f.T - 2; y++) if (!SLABS.includes(y)) g.set(ix, y, iz, "air");
  if (n++ % 6 === 0) g.set(ix, SLABS[0] + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// the porte-cochere: a dark oak door on the south front, a sandstone canopy lintel over it, and a hall behind it
const door = facades.filter(f => f.face === "south" && f.T === 20 && !f.quoin && f.win)
  .sort((a, b) => b.z - a.z || Math.abs(a.x - 12) - Math.abs(b.x - 12))[0];
if (door) {
  const { x, z, gr } = door;
  const hinge = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(x, gr, z, "dark_oak_door", { ...hinge, half: "lower" });
  g.set(x, gr + 1, z, "dark_oak_door", { ...hinge, half: "upper" });
  for (const dx of [-1, 0, 1]) g.set(x + dx, gr + 2, z, BAND);
  for (let y = gr; y <= gr + 2; y++) g.set(x, y, z - 1, "air");
}

const info = g.save(`${DIR}/FR245184537.nbt`);
console.log(JSON.stringify(info));
