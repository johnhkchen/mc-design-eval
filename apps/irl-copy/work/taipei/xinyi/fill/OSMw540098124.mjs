import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098124";
const W = 21, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z - 1) && has(x, z + 1));

const G0 = Math.min(...ground.values());   // lowest ground = y 0 reference
const L1 = G0 + 5;                         // second-floor slab / string course
const T = G0 + 11;                         // roof slab layer (about 11 above lowest ground)

const vox = new Voxels([W, H, D]);

function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
}

// Footprint centre, for the rooftop tank
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length), cz = Math.round(sz / cells.length);

// Pass 1: foundation, floor slabs, roof, walls, facade detail
for (const [x, z, gr] of cells) {
  const nE = has(x + 1, z), nW = has(x - 1, z), nN = has(x, z - 1), nS = has(x, z + 1);
  const perim = isPerim(x, z);
  const corner = (!nE || !nW) && (!nN || !nS);
  const xFace = !nE || !nW;          // wall runs along z
  const idx = xFace ? z : x;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs (interior storey lines) and roof slab
  if (L1 >= gr) put(x, L1, z, "smooth_stone");
  put(x, T, z, "light_gray_concrete");

  if (!perim) continue;

  // wall body
  for (let y = gr; y < T + 2; y++) {
    if (y === T + 2) put(x, y, z, "smooth_stone", { type: "bottom" });       // parapet cap slab
    else if (y === T + 1) put(x, y, z, "white_concrete");                   // parapet
    else if (y < T) put(x, y, z, "white_concrete");
  }
  if (gr < T) put(x, gr, z, "stone_bricks");                                 // base course
  if (L1 >= gr) put(x, L1, z, "smooth_stone");                               // string course
  put(x, T - 1, z, "smooth_stone");                                          // cornice band

  // window and pier grid
  const groundRows = [];
  for (let y = gr + 1; y <= L1 - 2; y++) groundRows.push(y);
  const upperRows = [L1 + 1, L1 + 2, L1 + 3, L1 + 4];
  const rows = [...groundRows, ...upperRows].filter(y => y < T - 1);

  for (const y of rows) {
    const ground_band = y <= L1 - 2;
    if (corner || idx % 3 === 0) {
      put(x, y, z, ground_band ? "black_concrete" : "white_concrete");
    } else {
      const p = xFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, "glass_pane", p);
    }
  }
  // lintel above shopfront glass
  if (L1 - 1 > gr) put(x, L1 - 1, z, "smooth_stone");

  // rooftop parapet already set; warm lights behind some windows
  if (!corner) {
    const dx = !nE ? -1 : (!nW ? 1 : 0);
    const dz = !nS ? -1 : (!nN ? 1 : 0);
    for (const y of rows) {
      if (idx % 3 === 0) continue;
      if (((x * 7 + z * 3 + y) % 5) !== 0) continue;
      const ix = x + 2 * dx, iz = z + 2 * dz;
      if (!has(ix, iz) || isPerim(ix, iz)) continue;
      if (y <= gOf(ix, iz)) continue;
      put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 2: entrance on the south (max-z) face, nearest the centre
{
  let best = null;
  for (const [x, z, gr] of cells) {
    if (!isPerim(x, z) || has(x, z + 1)) continue;
    if (!best || Math.abs(x - cx) < Math.abs(best.x - cx)) best = { x, z, gr };
  }
  if (best) {
    const { x, z, gr } = best;
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    // canopy band across the entrance bay
    for (const dx of [-1, 0, 1]) {
      if (has(x + dx, z) && gOf(x + dx, z) <= gr + 3) {
        put(x + dx, gr + 3, z, "stone_brick_slab", { type: "bottom" });
      }
    }
  }
}

// Pass 3: rooftop water tank (iron, capped) and antenna on the central cells
{
  const tank = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) tank.push([cx + dx, cz + dz]);
  if (tank.every(([x, z]) => has(x, z) && !isPerim(x, z))) {
    for (const [x, z] of tank) {
      put(x, T + 1, z, "iron_block");
      put(x, T + 2, z, "iron_block");
      put(x, T + 3, z, "smooth_stone", { type: "bottom" });
    }
    for (let y = T + 4; y <= T + 6; y++) put(cx, y, cz, "iron_bars");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
