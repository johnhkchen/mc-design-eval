// M Social Auckland: a 1990s-2000s glass hotel tower on a stone podium, from the lidar record. Footprint 78 x 43
// (1276 cells), flat site, roof tiers from the lidar's roof heights: a single-storey wing (5), a 12-storey tower
// (48) and a 13-storey crown (52) with roof plant. Solid massing (the core is the floor slabs and columns), a 1-deep
// air gap behind each glass pane, glowstone behind some windows, a stone podium, a lobby on the longest street run.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_355454170.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 78, D = 43, Y = 64;

// Blocks by role
const BASE = "polished_andesite", WALL = "white_concrete", TRIM = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const CORE = "stone", ROOF = "gray_concrete", PARAPET = "smooth_stone", GLOW = "glowstone", CANOPY = "smooth_stone";
const LANTERN = ["lantern", { hanging: "false", waterlogged: "false" }];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING_IN = { N: "south", S: "north", W: "east", E: "west" };    // a door faces into the building

// Footprint, and roof tiers: the lidar's roof height snapped to a few flat levels, then a 3x3 median to drop noise
const fp = Array.from({ length: D }, () => Array(W).fill(false));
const lid = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) { fp[z][x] = true; lid[z][x] = r; }
const tierOf = (r) => (r < 10 ? 5 : r < 30 ? 12 : r < 42 ? 36 : r < 48 ? 48 : 52);
const raw = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => (fp[z][x] ? tierOf(lid[z][x]) : 0)));
const H = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  if (!fp[z][x]) return 0;
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if (nx >= 0 && nz >= 0 && nx < W && nz < D && fp[nz][nx]) near.push(raw[nz][nx]);
  }
  near.sort((a, b) => a - b);
  return near[Math.floor(near.length / 2)];
}));
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp[z][x];
const hAt = (x, z) => (inFP(x, z) ? H[z][x] : 0);
// the faces of cell x,z that show at height y: the neighbour outside the footprint or shorter than y
const exposedFaces = (x, z, y) => Object.keys(DIRS).filter((f) => { const [dx, dz] = DIRS[f]; return hAt(x + dx, z + dz) <= y; });
const key = (x, y, z) => `${x},${y},${z}`;
const vox = new Map();                                    // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => vox.set(key(x, y, z), [block, state]);

// The facade of one cell at height y. Podium (below y 12): stone bands and piers; above: white piers, light-grey
// sill and head bands, blue glass between (two glass, one pier, on a 3 rhythm)
function facade(x, z, y, out) {
  if (y === 0) return [BASE];                              // base course
  const f = out[0], podium = y < 12;
  if (y % 4 === 0 || y % 4 === 3) return [podium ? BASE : TRIM];
  if (out.length > 1 || (f === "N" || f === "S" ? x : z) % 3 === 0) return [podium ? BASE : WALL];
  return [GLASS];
}

// Massing: every cell solid from y 0 up to its tier, the facade on its exposed faces, roof on the top
const glass = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp[z][x]) continue;
  const h = H[z][x];
  for (let y = 0; y < h; y++) {
    const out = exposedFaces(x, z, y);
    if (!out.length) { put(x, y, z, y === h - 1 ? ROOF : CORE); continue; }
    const [block] = facade(x, z, y, out);
    put(x, y, z, block);
    if (block === GLASS) glass.push({ x, y, z, f: out[0] });
  }
  if (exposedFaces(x, z, h - 1).length) put(x, h, z, PARAPET);      // a parapet on each exposed roof edge
}

// The air gap behind each pane (one block deep), with glowstone in some of them: the warm lights at dusk
for (const { x, y, z, f } of glass) {
  const [dx, dz] = DIRS[f], ix = x - dx, iz = z - dz;
  if (!inFP(ix, iz) || H[iz][ix] <= y || exposedFaces(ix, iz, y).length) continue;
  vox.delete(key(ix, y, iz));
  if (y % 4 === 1 && (x * 7 + z * 13 + y * 3) % 6 === 0) put(ix, y, iz, GLOW);
}

// The lobby: the longest run of street-level cells on any one face, its middle cell a double door in a recess
// (air behind it), a 3-wide lintel canopy over it, lanterns either side
let entry = null;
for (const f of Object.keys(DIRS)) {
  const ns = f === "N" || f === "S", lines = new Map();
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!fp[z][x] || !exposedFaces(x, z, 1).includes(f)) continue;
    const p = ns ? z : x, u = ns ? x : z;
    if (!lines.has(p)) lines.set(p, []);
    lines.get(p).push(u);
  }
  for (const [p, us] of lines) {
    us.sort((a, b) => a - b);
    let run = [us[0]];
    for (let i = 1; i <= us.length; i++) {
      if (i < us.length && us[i] === us[i - 1] + 1) { run.push(us[i]); continue; }
      if (run.length >= 3 && (!entry || run.length > entry.run.length)) entry = { f, p, run };
      run = i < us.length ? [us[i]] : [];
    }
  }
}
const cellOf = (f, p, u) => (f === "N" || f === "S" ? [u, p] : [p, u]);
{
  const { f, p, run } = entry, door = run[Math.floor(run.length / 2)], [dx, dz] = DIRS[f];
  const [dX, dZ] = cellOf(f, p, door);
  for (const y of [1, 2]) {
    const [ix, iz] = [dX - dx, dZ - dz];
    vox.delete(key(ix, y, iz));                                                  // recess: air behind the doors
    put(dX, y, dZ, "iron_door", { facing: FACING_IN[f], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }
  for (const u of [door - 1, door, door + 1]) { const [cx, cz] = cellOf(f, p, u); put(cx, 3, cz, CANOPY); }
  for (const u of [door - 1, door + 1]) if (run.includes(u)) { const [cx, cz] = cellOf(f, p, u); put(cx, 1, cz, ...LANTERN); }
}

// The crown's roof plant: a housing box on the roof, a smaller box on it, lanterns at the housing's corners
const crown = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (fp[z][x] && H[z][x] === 52) crown.push([x, z]);
const cx = Math.round(crown.reduce((s, [x]) => s + x, 0) / crown.length), cz = Math.round(crown.reduce((s, [, z]) => s + z, 0) / crown.length);
const onRoof = (x, z) => inFP(x, z) && H[z][x] === 52 && !exposedFaces(x, z, 51).length;
for (let z = cz - 3; z <= cz + 3; z++) for (let x = cx - 5; x <= cx + 5; x++) if (onRoof(x, z)) { put(x, 52, z, TRIM); put(x, 53, z, TRIM); }
for (let z = cz - 1; z <= cz + 1; z++) for (let x = cx - 2; x <= cx + 2; x++) if (vox.has(key(x, 53, z))) { put(x, 54, z, TRIM); put(x, 55, z, TRIM); }
for (const [x, z] of [[cx - 5, cz - 3], [cx + 5, cz - 3], [cx - 5, cz + 3], [cx + 5, cz + 3]]) if (vox.has(key(x, 53, z))) put(x, 54, z, ...LANTERN);

// Write it
const g = new Voxels([W, Y, D]);
for (const [k, [block, state]] of vox) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
const out = `${FILL}/way_355454170.nbt`;
const info = g.save(out);
console.log(`way_355454170: ${info.blocks} blocks, ${info.palette} palette entries, lobby ${entry.f} run ${entry.run[0]}..${entry.run[entry.run.length - 1]}, crown at ${cx},${cz}`);
