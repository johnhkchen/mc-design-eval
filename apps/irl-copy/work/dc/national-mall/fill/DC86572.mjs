import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 818 Connecticut Ave NW: Commercial-Office-Large, ~20 blocks tall, 14 x 18 footprint.
// Read as a late-20th-century office: pale stone piers, tinted glass window bands,
// darker stone spandrels, a stone-base plinth with a storefront ground floor,
// a parapet on the true outer edge, a canopied entrance and one rooftop penthouse.
// Storeys are 4 blocks tall.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86572";
const W = 14, H = 32, D = 18;
const STOREY = 4;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.cells;

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, ro] of rows) {
  cell.set(key(x, z), { x, z, ground: Math.round(gr), roof: Math.round(ro) });
}
const cells = [...cell.values()];
const mod = (a, m) => ((a % m) + m) % m;

// Datum (ground-floor level) = highest ground under the footprint, so lower
// cells get extra storeys showing on the downhill side.
const datum = Math.max(...cells.map(c => c.ground));
const maxN = Math.floor((H - 5 - datum) / STOREY);
const clampN = n => Math.min(maxN, Math.max(1, n));

// Smooth lidar noise into flat tiers: cells within 1 storey of the modal
// storey count take the mode; clear setbacks keep their own count.
const tally = new Map();
for (const c of cells) {
  const n = clampN(Math.round((c.roof - datum) / STOREY));
  c.nRaw = n;
  tally.set(n, (tally.get(n) || 0) + 1);
}
let mode = cells[0].nRaw, best = -1;
for (const [n, k] of tally) if (k > best) { best = k; mode = n; }
for (const c of cells) {
  c.n = Math.abs(c.nRaw - mode) >= 2 ? c.nRaw : mode;
  c.top = datum + STOREY * c.n;
}
const maxTop = Math.max(...cells.map(c => c.top));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const covered = (x, z, y) => {
  const n = cell.get(key(x, z));
  return !!n && y < n.top;
};
const exposed = (c, y) => DIRS.filter(([, dx, dz]) => !covered(c.x + dx, c.z + dz, y));
const hasMissingNeighbour = c => DIRS.some(([, dx, dz]) => !cell.has(key(c.x + dx, c.z + dz)));

// Block rule for one footprint cell at height y. Returns [name] / [name, props] / null (air).
const pick = (c, y) => {
  if (y < c.ground) return ["stone_bricks"];               // foundation to ground
  if (y === c.top) return ["smooth_stone"];                // roof slab
  if (y === c.top + 1) {                                   // parapet only on the true outer edge
    return hasMissingNeighbour(c) ? ["stone_brick_wall"] : null;
  }
  if (y > c.top) return null;

  const j = mod(y - datum, STOREY);
  if (j === 0) return ["smooth_stone"];                    // floor slab / storey line

  const ex = exposed(c, y);
  if (!ex.length) return null;                             // interior air behind glass

  const [dirName] = ex[0];
  const along = (dirName === "N" || dirName === "S") ? c.x : c.z;
  const isPier = ex.length >= 2 || mod(along, 3) === 0;    // corners and every third bay

  if (j === 3) return [isPier ? "calcite" : "stone_bricks"];   // lintel / spandrel band
  if (isPier) return ["polished_andesite"];                    // darker mullions
  return ["light_blue_stained_glass"];
};

const blocks = new Map();
for (const c of cells) {
  for (let y = 0; y <= Math.min(c.top + 1, H - 1); y++) {
    const b = pick(c, y);
    if (b) blocks.set(`${c.x},${y},${c.z}`, b);
  }
}

// Entrance: ground-level south-facing cell nearest the centre of the face.
let doorCell = null;
for (const c of cells) {
  if (c.ground !== datum) continue;
  if (!exposed(c, datum).some(([d]) => d === "S")) continue;
  if (!doorCell || Math.abs(c.x - 6.5) < Math.abs(doorCell.x - 6.5)) doorCell = c;
}
if (doorCell) {
  const { x, z } = doorCell;
  // Calcite surround flanking the door, and a dark canopy slab over the bay.
  for (const dx of [-1, 1]) {
    const nb = cell.get(key(x + dx, z));
    if (nb && nb.ground === datum) {
      for (let y = datum; y <= datum + 2; y++) {
        const ex = exposed(nb, y);
        if (ex.some(([d]) => d === "S")) blocks.set(`${nb.x},${y},${nb.z}`, ["calcite"]);
      }
    }
  }
  blocks.set(`${x},${datum},${z}`, ["dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  }]);
  blocks.set(`${x},${datum + 1},${z}`, ["dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  }]);
  for (const dx of [-1, 0, 1]) {
    const nb = cell.get(key(x + dx, z));
    if (!nb || nb.ground !== datum) continue;
    if (!exposed(nb, datum + 3).some(([d]) => d === "S")) continue;
    blocks.set(`${nb.x},${datum + 3},${nb.z}`, ["dark_oak_slab", { type: "bottom", waterlogged: "false" }]);
  }
  blocks.set(`${x},${datum + 2},${z}`, ["lantern", { hanging: "true", waterlogged: "false" }]);
}

// Warm light: glowstone on the floor slab just inside some upper-storey windows.
for (const c of cells) {
  for (let y = datum + STOREY; y < c.top; y++) {
    if (mod(y - datum, STOREY) !== 1) continue;
    const ex = exposed(c, y);
    if (!ex.length || ex.length >= 2) continue;
    if (((c.x * 7 + c.z * 13 + y * 3) % 5) !== 0) continue;
    const [, dx, dz] = ex[0];
    const ix = c.x - dx, iz = c.z - dz;
    const inner = cell.get(key(ix, iz));
    if (!inner || y >= inner.top) continue;
    if (pick(inner, y) !== null) continue;
    if (blocks.has(`${ix},${y},${iz}`)) continue;
    blocks.set(`${ix},${y},${iz}`, ["glowstone"]);
  }
}

// One rooftop penthouse: a solid stone box on the top tier, set back from the edge.
const penX0 = 3, penX1 = W - 4, penZ0 = 4, penZ1 = D - 5;
for (let x = penX0; x <= penX1; x++) {
  for (let z = penZ0; z <= penZ1; z++) {
    const c = cell.get(key(x, z));
    if (!c || c.top !== maxTop) continue;
    const edge = x === penX0 || x === penX1 || z === penZ0 || z === penZ1;
    blocks.set(`${x},${c.top + 1},${z}`, [edge ? "stone_bricks" : "smooth_stone"]);
    if (edge) blocks.set(`${x},${c.top + 2},${z}`, ["stone_brick_wall"]);
    else blocks.set(`${x},${c.top + 2},${z}`, ["smooth_stone"]);
  }
}

const g = new Voxels([W, H, D]);
for (const [k, [name, props]] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) continue;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

g.save(`${DIR}/${ID}.nbt`);
