import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458224";
const W = 22, H = 23, D = 18;

// ---- footprint --------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const cells = list.map(c => Array.isArray(c)
  ? { x: c[0], z: c[1], g: c[2] }
  : { x: c.x, z: c.z, g: c.ground ?? c.g ?? c.y ?? 0 });

const fp = new Map();
for (const c of cells) fp.set(`${c.x},${c.z}`, c.g);
const has = (x, z) => fp.has(`${x},${z}`);
const maxG = cells.length ? Math.max(...cells.map(c => c.g)) : 0;

// Floor level of the body: all cells are carried up on a plinth to this height.
const B = maxG;
// Storeys: ground B..B+4 (shopfront), slab B+5, upper B+6..B+9, roof deck B+10, parapet B+11.

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward (missing-neighbour) directions for a footprint cell.
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const outw = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => outw(x, z).length > 0;
const isCorner = (x, z) => outw(x, z).length >= 2;

// Door: a non-corner north-facing edge cell nearest the middle, preferring a non-pier column.
let door = null;
{
  const cand = cells.filter(c => isEdge(c.x, c.z) && !isCorner(c.x, c.z)
    && outw(c.x, c.z)[0][2] === "north");
  const pool = cand.length ? cand : cells.filter(c => isEdge(c.x, c.z) && !isCorner(c.x, c.z));
  const score = c => {
    const p = outw(c.x, c.z)[0];
    const t = p[1] !== 0 ? c.x : c.z;
    return (t % 3 === 0 ? 100 : 0) + Math.abs(c.x - W / 2);
  };
  if (pool.length) {
    pool.sort((a, b) => score(a) - score(b));
    door = { x: pool[0].x, z: pool[0].z, p: outw(pool[0].x, pool[0].z)[0] };
  }
}

const lit = (x, y, z) => (x * 7 + z * 13 + y * 3) % 5 === 0;

// ---- body -------------------------------------------------------------------
for (const { x, z, g: gr } of cells) {
  const ob = outw(x, z);
  const edge = ob.length > 0;
  const corner = ob.length >= 2;

  // Foundation and plinth from y 0 up to B.
  for (let y = 0; y < B; y++) put(x, y, z, y < gr ? "stone" : "stone_bricks");
  if (B >= 1) put(x, B - 1, z, edge ? "polished_andesite" : "stone_bricks");

  // Floor slabs and roof deck for every footprint cell (interior left as air otherwise).
  const slab = edge ? "smooth_quartz" : "light_gray_concrete";
  put(x, B + 5, z, slab);
  put(x, B + 10, z, slab);

  if (!edge) continue;

  if (corner) {
    for (let y = B; y <= B + 11; y++) put(x, y, z, "smooth_quartz");
    continue;
  }

  const p = ob[0];
  const t = p[1] !== 0 ? x : z;               // coordinate running along this facade
  const pier = t % 3 === 0;
  const pane = p[1] !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Wall body.
  for (let y = B; y <= B + 9; y++) put(x, y, z, "white_concrete");
  put(x, B, z, "polished_andesite");          // shop sill
  put(x, B + 4, z, "dark_oak_planks");        // ground lintel
  put(x, B + 6, z, "smooth_quartz");          // upper sill
  put(x, B + 9, z, "smooth_quartz");          // upper lintel

  // Ground-floor shopfront glass B+1..B+3.
  for (let y = B + 1; y <= B + 3; y++) {
    if (pier) put(x, y, z, "dark_oak_planks");
    else put(x, y, z, "glass_pane", pane);
  }
  // Upper glass B+7..B+8.
  for (let y = B + 7; y <= B + 8; y++) {
    if (pier) put(x, y, z, "dark_oak_planks");
    else put(x, y, z, "glass_pane", pane);
  }

  // Warm light behind some glass (interior air cell just inside the facade).
  if (!pier) {
    for (const y of [B + 2, B + 8]) {
      if (!lit(x, y, z)) continue;
      const ix = x - p[0], iz = z - p[1];
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Parapet cap.
  put(x, B + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door (recessed in the wall, transom glass above).
if (door) {
  const f = door.p[2];
  put(door.x, B, door.z, "dark_oak_door",
    { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, B + 1, door.z, "dark_oak_door",
    { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// ---- roof equipment ---------------------------------------------------------
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (const { x, z } of cells) {
  if (isEdge(x, z)) continue;
  // Scattered AC units.
  if ((x * 5 + z * 3) % 13 === 0) put(x, B + 11, z, "iron_block");
  // Small water tank on a 2x2 pad near the centre.
  if ((x === cx - 1 || x === cx) && (z === cz - 1 || z === cz)) {
    put(x, B + 11, z, "oak_planks");
    put(x, B + 12, z, "oak_planks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
