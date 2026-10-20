import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise glass-and-concrete office tower, c. 1990s-2000s Taipei Xinyi style:
// white concrete frame, blue-tinted glass ribbon windows, a two-tier setback,
// penthouse with glass band, lightning-rod mast. ~16 storeys of 5 blocks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764242683";
const W = 33, D = 30, H = 90;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const GROUND = new Map();
for (const [x, z, g] of cells) GROUND.set(`${x},${z}`, Math.round(g));
const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => GROUND.has(key(x, z));
const groundAt = (x, z) => GROUND.get(key(x, z));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Depth from the footprint edge: edge cells = 1, next ring = 2, ...
const DEP = new Map();
{
  const q = [];
  for (const [x, z] of cells) {
    if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
      DEP.set(key(x, z), 1);
      q.push([x, z]);
    }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    const d = DEP.get(key(x, z));
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (inFp(nx, nz) && !DEP.has(key(nx, nz))) {
        DEP.set(key(nx, nz), d + 1);
        q.push([nx, nz]);
      }
    }
  }
  // Unreachable (enclosed) cells count as deep interior.
  for (const [x, z] of cells) if (!DEP.has(key(x, z))) DEP.set(key(x, z), 99);
}
const dep = (x, z) => DEP.get(key(x, z)) ?? 0;

// Main entrance: the south-facing edge cell (outward +z) nearest the mean x.
let ENT = null;
{
  const southEdge = cells.filter(([x, z]) => dep(x, z) === 1 && !inFp(x, z + 1));
  if (southEdge.length) {
    const cx = southEdge.reduce((s, c) => s + c[0], 0) / southEdge.length;
    const best = southEdge.reduce((b, c) => (Math.abs(c[0] - cx) < Math.abs(b[0] - cx) ? c : b));
    ENT = [best[0], best[1]];
  }
}

// Peak cell for the mast.
let SPIRE = null;
{
  let best = -1;
  for (const [x, z] of cells) {
    if (dep(x, z) > best) { best = dep(x, z); SPIRE = [x, z, best]; }
  }
}

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward neighbours not belonging to the set "depth >= m".
const outDirs = (x, z, m) => DIRS.filter(([dx, dz]) => dep(x + dx, z + dz) < m);

// Facade material for one exterior cell at height y.
function facadeSpec(x, z, y, gr, outs) {
  const [dx, dz] = outs[0];
  const corner = outs.length > 1;
  const alongX = !corner && dz !== 0 && dx === 0; // wall runs east-west
  const idx = alongX ? x : z;
  const r = y % 5;

  const pane = corner
    ? { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" }
    : alongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

  // Base course on top of the foundation.
  if (y === gr) return { id: "polished_granite" };

  // Ground band: shopfront with entrance.
  if (y < 5) {
    if (r === 4) return { id: "white_concrete" };
    if (ENT && z === ENT[1] && dz === 1 && dx === 0 && Math.abs(x - ENT[0]) <= 1) {
      if (x === ENT[0]) return null; // doorway opening
      return { id: "polished_granite" };
    }
    if (idx % 3 === 0) return { id: "white_concrete" };
    return { id: "light_blue_stained_glass" };
  }

  // Upper storeys.
  if (r === 0) return { id: "white_concrete" };          // spandrel / floor line
  if (r === 4) return { id: "light_gray_concrete" };     // sill / head band
  if (idx % 3 === 0) return { id: "white_concrete" };    // mullion
  const k = Math.floor(y / 5);
  const lit = !corner && r === 2 && k >= 1 && ((x * 31 + z * 17 + k * 7) % 9 === 0);
  return {
    id: "light_blue_stained_glass_pane",
    props: pane,
    lit: lit ? [x - dx, z - dz] : null, // interior cell behind the glass
  };
}

// Body block for a tier whose footprint is "depth >= m".
function bodyAt(x, z, y, gr, m) {
  if (dep(x, z) < m) return null;
  const outs = outDirs(x, z, m);
  if (!outs.length) return y % 5 === 0 ? { id: "light_gray_concrete" } : null; // floor slab
  return facadeSpec(x, z, y, gr, outs);
}

function cellBlock(x, z, y, gr) {
  const d = dep(x, z);
  if (y < 55) return bodyAt(x, z, y, gr, 1);                 // podium + lower tower
  if (y === 55) return d < 4 ? { id: "gray_concrete" } : bodyAt(x, z, y, gr, 4); // terrace on setback
  if (y < 75) return bodyAt(x, z, y, gr, 4);                 // upper tower
  if (y === 75) {                                            // roof cornice / roof
    if (d < 4) return null;
    return outDirs(x, z, 4).length ? { id: "smooth_quartz" } : { id: "gray_concrete" };
  }
  if (y === 76 || y === 77) {                                // parapet / penthouse
    if (d >= 7) return bodyAt(x, z, y, gr, 7);
    if (d >= 4 && outDirs(x, z, 4).length) return { id: "white_concrete" };
    return null;
  }
  if (y <= 79) return d >= 7 ? bodyAt(x, z, y, gr, 7) : null; // penthouse
  if (y === 80) return d >= 7 ? { id: "gray_concrete" } : null; // penthouse roof
  return null;
}

// Foundations and building body.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");
  for (let y = gr; y <= 80; y++) {
    const s = cellBlock(x, z, y, gr);
    if (!s) continue;
    if (s.props) put(x, y, z, s.id, s.props);
    else put(x, y, z, s.id);
    if (s.lit) {
      const [xi, zi] = s.lit;
      if (inFp(xi, zi) && dep(xi, zi) >= 2) put(xi, y, zi, "shroomlight");
    }
  }
}

// Lightning-rod mast on the deepest cell.
if (SPIRE) {
  const [sx, sz, sd] = SPIRE;
  const base = sd >= 7 ? 81 : 76;
  for (let y = base; y <= 86; y++) {
    put(sx, y, sz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
