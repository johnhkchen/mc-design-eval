// United States Botanic Garden Conservatory, 100 Maryland Ave SW (1933): a Neoclassical stone base and wings with a
// glass-and-iron greenhouse hall and a stepped glass dome in the middle. Built from the footprint cells only: each
// cell is a column from y 0 (foundation up to its ground), the walls of the footprint and of every setback face
// (where a neighbour stands lower) are exposed skin, the rest is an air gap with a floor slab at ground level and
// a glass roof, and a tier's interior is solid up to the roof of the lower tier it stands on.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87507.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 37, D = 28, H = 23;

const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { g, r });
const cell = (x, z) => at.get(`${x},${z}`);

// The four faces of a cell: edge faces stand on the footprint's outline (exposed from the ground up); other faces
// are exposed from the neighbour's roof where that neighbour stands lower.
const NB = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
function faces(x, z, r) {
  const out = [];
  for (const [dx, dz, d] of NB) {
    const n = cell(x + dx, z + dz);
    if (!n) out.push({ d, t: 0, edge: true });
    else if (n.r < r) out.push({ d, t: n.r, edge: false });
  }
  return out;
}

// Greenhouse: the hall and the dome (roof 7+) and the low sheds (roof 3 or less) are glass; the wings are stone.
const kindOf = (r) => (r >= 7 || r <= 3 ? "glass" : "stone");

function wallBlock(kind, x, z, y, g, r, ex, tExp) {
  const h = r - g, k = y - g;
  const xFace = ex.some((f) => f.d === "W" || f.d === "E");
  const zFace = ex.some((f) => f.d === "N" || f.d === "S");
  const corner = xFace && zFace;
  const along = corner ? -1 : zFace ? x : z;   // position along the face the wall is on
  if (k === h - 1) {                             // cornice / parapet, or the hall's glass top
    if (kind === "glass") return r >= 7 ? "glass" : "stone_bricks";
    return along % 2 === 0 || corner ? "chiseled_sandstone" : "smooth_sandstone";
  }
  if (tExp > g && y === tExp) return kind === "stone" ? "chiseled_sandstone" : "stone_bricks";   // ledge on a setback
  if (kind === "stone") {
    if (k === 0) return "polished_andesite";      // plinth
    if (h >= 5 && k === h - 2) return "smooth_sandstone";   // string course
    if (corner || along % 3 === 0) return "smooth_sandstone";   // pier between bays
    return "glass_pane";                          // window
  }
  if (k === 0) return "stone_bricks";
  if (corner) return "stone_bricks";
  if (along % 3 === 0) return "iron_bars";        // iron glazing bar
  return "glass";
}

const V = new Voxels([W, H, D]);
const windows = [];   // stone-wing window cells on the first storey, for the lamps behind the glass
for (const [x, z, g, r] of cells) {
  const kind = kindOf(r);
  const fs = faces(x, z, r);
  const inner = fs.filter((f) => !f.edge);
  const edge = fs.some((f) => f.edge);
  const tExp = edge ? 0 : inner.length ? Math.min(...inner.map((f) => f.t)) : Infinity;
  const solidTo = inner.length ? Math.min(...inner.map((f) => f.t)) : 0;
  for (let y = 0; y < r; y++) {
    if (y < g) { V.set(x, y, z, "stone_bricks"); continue; }                 // foundation up to the ground
    const ex = fs.filter((f) => y >= f.t);
    if (ex.length) {                                                          // exposed skin
      const b = wallBlock(kind, x, z, y, g, r, ex, tExp);
      V.set(x, y, z, b);
      if (kind === "stone" && b === "glass_pane" && y === g + 1) windows.push({ x, z, y, ex });
      continue;
    }
    if (y < solidTo) { V.set(x, y, z, "stone"); continue; }                  // the tier it stands on
    if (y === r - 1) { V.set(x, y, z, (x % 4 === 0 || z % 4 === 0) ? "iron_bars" : "glass"); continue; }   // glass roof with ribs
    if (y === g) V.set(x, y, z, "smooth_stone");                              // ground-floor slab
  }
}

// Lamps behind some first-storey windows, in the air gap just inside the glass.
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const w of windows) {
  if (w.x % 6 !== 1) continue;
  const [dx, dz] = IN[w.ex[0].d];
  if (V.get(w.x + dx, w.y, w.z + dz)) continue;
  V.set(w.x + dx, w.y, w.z + dz, "glowstone");
}

// The Maryland Avenue front (z 0): a double door under a stone hood, the lintel course above.
const doorX = [17, 18];
for (const x of [15, 16, 17, 18, 19, 20]) V.set(x, 3, 0, "smooth_sandstone");
for (const [i, x] of doorX.entries()) {
  const hinge = i === 0 ? "left" : "right";
  for (const [y, half] of [[1, "lower"], [2, "upper"]])
    V.set(x, y, 0, "dark_oak_door", { facing: "south", half, hinge, open: "false", powered: "false" });
}

// Roof equipment: plant boxes on the hall roof, and a lantern finial on the dome's crown.
for (const [x, z, , r] of cells) {
  if (r === 7 && (x + z) % 11 === 0 && !faces(x, z, r).length && x > 4 && x < 32) V.set(x, r, z, "iron_block");
}
const top = Math.max(...cells.map((c) => c[3]));
const crown = cells.filter((c) => c[3] === top);
const cx = crown.reduce((s, c) => s + c[0], 0) / crown.length, cz = crown.reduce((s, c) => s + c[1], 0) / crown.length;
const [px, pz] = crown.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
V.set(px, top, pz, "lantern");

const out = V.save(`${DIR}/DC87507.nbt`);
console.log(`DC87507.nbt: ${out.blocks} blocks, palette ${out.palette}`);
