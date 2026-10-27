// Way 382846315, Mt Eden side of the CBD: a 1920s-30s brick commercial block on a volcanic-stone plinth, the stripped-classical
// kind Auckland built along its streets between the wars. Brick walls, polished andesite piers and coping (the city's own
// volcanic stone), cream concrete string courses, shopfront glass on the street floor, and a flat tar-and-gravel roof with
// plant boxes on the core. The lidar roof is median-smoothed into flat tiers; the ground under each cell is its own foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_382846315.cells.json", "utf8"));
const g = new Voxels([47, 23, 29]);

const cell = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gy, roof] of cells) cell.set(key(x, z), { x, z, gy, roof });
const at = (x, z) => cell.get(key(x, z));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// Massing: the lidar roof, median-smoothed over each cell's 3x3 neighbourhood, then snapped to three flat tiers (wing 7,
// main 9, core 10: the lidar's 8s join the main roof), and at least 4 rows above its own ground
const tier = (v) => (v >= 10 ? 10 : v >= 8 ? 9 : 7);
for (const c of cell.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.roof); }
  c.top = Math.max(tier(median(near)), c.gy + 4);
}

// A face is any side with no footprint cell beside it, or with a lower neighbour (a setback's side): those columns are walls, not air
const SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
for (const c of cell.values()) {
  c.faces = Object.keys(SIDES).filter((s) => { const [dx, dz] = SIDES[s]; const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; });
  c.perim = c.faces.length > 0;
}

// Rows of one column above its ground: a plinth at the ground, storey string courses 4 rows apart from the roof down (where they
// clear the ground), windows in the 2 rows above each string, a header above them, and a coping on top
function rowKinds(c) {
  const kinds = new Map();
  const lines = [c.top - 9, c.top - 5].filter((L) => L - c.gy >= 3 && L < c.top - 1);
  const starts = [c.gy, ...lines];
  starts.forEach((lo, i) => {
    const hi = i + 1 < starts.length ? starts[i + 1] - 1 : c.top - 2;
    kinds.set(lo, i === 0 ? "plinth" : "string");
    for (let y = lo + 1; y < hi; y++) kinds.set(y, i === 0 && y <= lo + 2 ? "shop" : "win");   // street floor: two rows of shopfront, windows above
    if (hi > lo) kinds.set(hi, "head");
  });
  kinds.set(c.top - 1, "coping");
  return kinds;
}

// Facade material by row kind and bay: stone piers every 4 blocks along the wall, glass in the middle two, brick between
function facadeBlock(c, kind, side) {
  const along = side === "north" || side === "south" ? c.x : c.z;
  const p = ((along % 4) + 4) % 4;
  if (kind === "plinth" || kind === "coping") return "polished_andesite";
  if (kind === "string") return "white_concrete";
  if (p === 0) return "polished_andesite";
  if (kind === "shop") return p === 3 ? "polished_andesite" : "glass";
  if (kind === "win") return p === 3 ? "bricks" : "glass_pane";
  return "bricks";
}

const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const panes = [];
const kindsOf = new Map();
for (const c of cell.values()) {
  for (let y = 0; y < c.gy; y++) put(c.x, y, c.z, "stone_bricks");        // foundation: solid from y 0 up to the ground
  const kinds = rowKinds(c);
  kindsOf.set(key(c.x, c.z), kinds);
  if (c.perim) {
    const side = c.faces[0];
    for (let y = c.gy; y < c.top; y++) {
      const kind = kinds.get(y), block = facadeBlock(c, kind, side);
      if (block === "glass_pane") { put(c.x, y, c.z, block, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }); panes.push({ x: c.x, y, z: c.z, side }); }
      else put(c.x, y, c.z, block);
    }
  } else {
    for (let y = c.gy; y < c.top; y++) {
      const kind = kinds.get(y);
      if (y === c.top - 1) put(c.x, y, c.z, "gray_concrete");              // flat roof surface
      else if (kind === "plinth" || kind === "string") put(c.x, y, c.z, "smooth_stone");   // floor slab per storey, air between
    }
  }
}

// Warm light: glowstone on the first window row inside some windows (on the floor slab, behind the glass)
for (const c of cell.values()) {
  if (!c.perim) continue;
  const kinds = kindsOf.get(key(c.x, c.z));
  const [dx, dz] = SIDES[c.faces[0]];
  const inward = at(c.x - dx, c.z - dz);
  if (!inward || inward.perim) continue;
  for (let y = c.gy; y < c.top; y++) {
    if (kinds.get(y) !== "win" && kinds.get(y) !== "shop") continue;
    if (kinds.get(y - 1) !== "string" && kinds.get(y - 1) !== "plinth") continue;   // only on a floor slab, so the light is supported
    const along = c.faces[0] === "north" || c.faces[0] === "south" ? c.x : c.z;
    if (((along % 4) + 4) % 4 === 1 && ((c.x * 31 + c.z * 17 + y) % 4 === 0)) put(inward.x, y, inward.z, "glowstone");
  }
}

// Street entrance: the side whose cells sit lowest, its middle shopfront bay, a dark oak door (lower and upper halves)
const sideGround = {};
for (const s of Object.keys(SIDES)) {
  const list = [...cell.values()].filter((c) => c.faces.includes(s));
  if (list.length) sideGround[s] = { list, avg: list.reduce((a, c) => a + c.gy, 0) / list.length };
}
const street = Object.keys(sideGround).sort((a, b) => sideGround[a].avg - sideGround[b].avg)[0];
{
  const along = (c) => (street === "north" || street === "south" ? c.x : c.z);
  const list = sideGround[street].list.sort((a, b) => along(a) - along(b));
  const mid = list.length >> 1;
  const order = [mid];
  for (let k = 1; k < list.length; k++) order.push(mid - k, mid + k);
  for (const i of order) {
    const c = list[i];
    if (!c || c.faces[0] !== street) continue;
    const kinds = kindsOf.get(key(c.x, c.z));
    const p = ((along(c) % 4) + 4) % 4;
    if (kinds.get(c.gy + 1) !== "shop" || kinds.get(c.gy + 2) !== "shop" || p === 0 || p === 3) continue;
    const facing = OPP[street];
    put(c.x, c.gy + 1, c.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(c.x, c.gy + 2, c.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    break;
  }
}

// Roof plant: two iron plant boxes on the highest, interior part of the roof (one block above the roof, on it)
{
  let boxes = 0;
  for (const c of cell.values()) {
    if (boxes >= 2 || c.perim || c.top < 10) continue;
    const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
    if (quad.some((n) => !n || n.perim || n.top !== c.top)) continue;
    for (const n of quad) put(n.x, n.top, n.z, "iron_block");
    boxes++;
  }
}

// Pane connections: each pane joins the wall's neighbours along the facade, so the grid reads as framed glass
for (const p of panes) {
  const conn = (dx, dz) => (g.get(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  const ns = p.side === "north" || p.side === "south";
  const state = ns
    ? { north: "false", south: "false", east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" }
    : { north: conn(0, -1), south: conn(0, 1), east: "false", west: "false", waterlogged: "false" };
  put(p.x, p.y, p.z, "glass_pane", state);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_382846315.nbt";
const { blocks, palette } = g.save(out);
console.log(`way_382846315: ${cells.length} cells, ${panes.length} panes, street side ${street}, ${blocks} blocks, ${palette} palette entries`);
