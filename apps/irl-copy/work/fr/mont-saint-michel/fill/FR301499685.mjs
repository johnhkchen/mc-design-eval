import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "FR301499685";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 32, D = 28;
const g = new Voxels([W, H, D]);

// Materials: lime render walls with granite-grey stone trim (Mont-Saint-Michel village).
const WALL = "smooth_sandstone";
const TRIM = "stone_bricks";
const PLINTH = "stone";
const DECK = "stone_bricks";
const PARAPET = "stone_brick_wall";
const GLASS = "glass_pane";
const SILL = "stone_brick_slab";

// ---- Index footprint and smooth the lidar -----------------------------
const raw = new Map();
for (const [x, z, ground, roof] of cells) {
  raw.set(`${x},${z}`, { x, z, ground: Number(ground), roof: Number(roof) });
}
const has = (x, z) => raw.has(`${x},${z}`);

// Averages over a 5x5 neighbourhood of footprint cells (lidar noise removal).
function smooth(field) {
  const out = new Map();
  for (const c of raw.values()) {
    let s = 0, n = 0;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const o = raw.get(`${c.x + dx},${c.z + dz}`);
      if (o) { s += o[field]; n++; }
    }
    out.set(`${c.x},${c.z}`, s / n);
  }
  return out;
}
const sGround = smooth("ground");
const sRoof = smooth("roof");

// One base level for the whole building (storey grid shared by all cells).
let B = Infinity;
for (const v of sGround.values()) B = Math.min(B, v);
B = Math.round(B);

// Flat roof, quantised to whole storeys (4 storeys x 5 blocks, roughly 20 above base).
let roofSum = 0, roofN = 0;
for (const v of sRoof.values()) { roofSum += v; roofN++; }
const roofAvg = roofSum / roofN;
const storeysRaw = Math.round((roofAvg - B) / 5);
const STOREYS = Math.max(2, Math.min(5, storeysRaw));
const ROOF = B + 5 * STOREYS; // top of the roof deck is ROOF-1; parapet at ROOF

const cellMap = new Map();
for (const c of raw.values()) {
  const gr = Math.max(0, Math.min(B + 6, Math.round(sGround.get(`${c.x},${c.z}`))));
  const rr = Math.max(gr + 5, Math.min(H - 3, ROOF));
  cellMap.set(`${c.x},${c.z}`, { x: c.x, z: c.z, g: gr, r: rr });
}

function outward(x, z) {
  const n = [];
  if (!has(x, z - 1)) n.push([0, -1]);
  if (!has(x, z + 1)) n.push([0, 1]);
  if (!has(x - 1, z)) n.push([-1, 0]);
  if (!has(x + 1, z)) n.push([1, 0]);
  return n;
}
const facingName = (nx, nz) =>
  nx === 0 && nz === -1 ? "north" :
  nx === 0 && nz === 1 ? "south" :
  nx === -1 ? "west" : "east";

// Entrance: a non-corner cell on the south (street) face, nearest the middle.
let doorCell = null;
{
  const cand = [...cellMap.values()]
    .filter(c => !has(c.x, c.z + 1) && outward(c.x, c.z).length === 1)
    .sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
  if (cand.length) doorCell = cand[0];
}

// ---- Pass 1: plinth, walls, floor lines, roof deck --------------------
for (const c of cellMap.values()) {
  const { x, z, g: gr, r: rr } = c;
  const perim = outward(x, z).length > 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);
  g.set(x, gr, z, TRIM); // base course

  for (let y = gr + 1; y <= rr - 2; y++) {
    const rel = y - B;
    if (rel > 0 && rel % 5 === 0) {
      g.set(x, y, z, TRIM); // floor slab / string course, continuous
    } else if (perim) {
      g.set(x, y, z, WALL);
    }
  }
  g.set(x, rr - 1, z, DECK);
}

// ---- Pass 2: shopfront, door, windows, sills, lights, parapet ---------
for (const c of cellMap.values()) {
  const { x, z, g: gr, r: rr } = c;
  const normals = outward(x, z);
  if (normals.length === 0) continue;

  g.set(x, rr, z, PARAPET);
  if (normals.length > 1) continue; // corner piers stay solid

  const [nx, nz] = normals[0];
  const axisProps = (nx !== 0)
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const idx = x + z;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // Ground-floor shopfront: B+1..B+3 (relative to the common grid).
  for (let y = B + 1; y <= B + 3; y++) {
    if (y <= gr || y >= rr - 1) continue;
    if (isDoor && y <= B + 2) continue; // door opening
    if (idx % 4 === 0) g.set(x, y, z, WALL);
    else g.set(x, y, z, GLASS, axisProps);
  }
  if (!isDoor && gr + 1 <= B + 1) g.set(x, B, z, SILL);

  if (isDoor) {
    const fac = facingName(nx, nz);
    const dp = { facing: fac, hinge: "left", open: "false", powered: "false" };
    g.set(x, B + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    g.set(x, B + 2, z, "dark_oak_door", { ...dp, half: "upper" });
    // Lintel over the door.
    g.set(x, B + 3, z, TRIM);
  }

  // Upper storeys: window bands at rel 1..3 within each 5-block storey.
  for (let k = 1; k < STOREYS; k++) {
    const b = B + 5 * k;
    for (let y = b + 1; y <= b + 3; y++) {
      if (y <= gr || y >= rr - 1) continue;
      if (idx % 3 === 0) g.set(x, y, z, WALL);
      else if (y === b + 1) g.set(x, y, z, SILL);
      else g.set(x, y, z, GLASS, axisProps);
    }
    // Warm light behind some windows (room cell inside the footprint).
    if (idx % 6 === 1) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && outward(ix, iz).length === 0) {
        const ic = cellMap.get(`${ix},${iz}`);
        if (ic && b + 2 < ic.r - 1) g.set(ix, b + 2, iz, "glowstone");
      }
    }
  }
}

// Lanterns flanking the entrance, so it reads from the street at dusk.
if (doorCell) {
  for (const dx of [-1, 1]) {
    const lx = doorCell.x + dx;
    if (has(lx, doorCell.z) && outward(lx, doorCell.z).length === 1) {
      g.set(lx, B + 1, doorCell.z, WALL);
      g.set(lx, B + 2, doorCell.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// ---- Pass 3: roof plant, placed deliberately on the flat deck ----------
{
  const interior = [...cellMap.values()].filter(c => outward(c.x, c.z).length === 0);
  const cx = W / 2, cz = D / 2;
  const picks = interior
    .map(c => ({ c, d: Math.hypot(c.x - cx, c.z - cz) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(p => p.c);
  for (const c of picks) {
    if (c.r + 1 < H) {
      g.set(c.x, c.r, c.z, "chiseled_stone_bricks");
      g.set(c.x, c.r + 1, c.z, "chiseled_stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
