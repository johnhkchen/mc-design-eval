import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1082020";
const W = 8, H = 28, D = 6;

const g = new Voxels([W, H, D]);

function g_set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const key = (x, z) => `${x},${z}`;

const cells = new Map();
for (const [x, z, gr, roof] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(key(x, z), { x, z, g: clamp(Math.round(gr), 0, 10), r: Math.round(roof) });
}
const has = (x, z) => cells.has(key(x, z));
const all = [...cells.values()];

// Flat, clean massing: one roof tier for the whole 1900 commercial block.
const rs = all.map((c) => c.r).sort((a, b) => a - b);
const med = rs[Math.floor(rs.length / 2)] ?? 16;
const maxG = Math.max(0, ...all.map((c) => c.g));
const R = clamp(med, maxG + 12, 25); // roof deck top; parapet sits at R

// Upper storeys of 3 blocks stacked down from the cornice; ground floor below.
const nU = Math.max(1, Math.floor((R - 6 - maxG - 4) / 3) + 1);
const slab = (k) => R - 6 - 3 * k;      // floor band of upper storey k
const slabLow = slab(nU - 1);
const transom = slabLow - 1;            // top of shopfront zone

const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isFace = (x, z) => faces(x, z).length > 0;
const isNS = (f) => f === "N" || f === "S";
const cornerOf = (x, z, f) =>
  isNS(f) ? !has(x - 1, z) || !has(x + 1, z) : !has(x, z - 1) || !has(x, z + 1);
const uOf = (x, z, f) => (isNS(f) ? x : z);
const inwardOf = (x, z, f) => {
  if (f === "N") return [x, z + 1];
  if (f === "S") return [x, z - 1];
  if (f === "W") return [x + 1, z];
  return [x - 1, z];
};
const facingOf = { N: "north", S: "south", W: "west", E: "east" };

// Pass 1: foundation and solid massing; roof cap smooth stone.
for (const c of all) {
  for (let y = 0; y < c.g; y++) g_set(c.x, y, c.z, "stone_bricks");
  for (let y = c.g; y <= R - 1; y++) g_set(c.x, y, c.z, "bricks");
  g_set(c.x, R - 1, c.z, "smooth_stone");
}

// Choose the entrance: a windowable north/south face cell nearest mid-facade.
let door = null;
{
  let best = Infinity;
  for (const c of all) {
    const f = faces(c.x, c.z);
    if (!f.length) continue;
    const p = f[0];
    const corner = cornerOf(c.x, c.z, p);
    const u = uOf(c.x, c.z, p);
    if (corner || u % 2 !== 1) continue;
    const score = (isNS(p) ? 0 : 10) + Math.abs(u - W / 2);
    if (score < best) { best = score; door = { x: c.x, z: c.z, f: p, gnd: c.g }; }
  }
}

// Pass 2: facade articulation on exterior cells.
const windowCells = [];
for (const c of all) {
  const f = faces(c.x, c.z);
  if (!f.length) continue;
  const p = f[0];
  const corner = cornerOf(c.x, c.z, p);
  const u = uOf(c.x, c.z, p);
  const win = !corner && u % 2 === 1;
  const setc = (y, id, props) => g_set(c.x, y, c.z, id, props);

  // Base course
  setc(c.g, "polished_andesite");

  // Ground floor: shopfront glass between piers, stone transom.
  for (let y = c.g + 1; y < transom; y++) {
    setc(y, win ? "glass" : "stone_bricks");
  }
  setc(transom, "stone_bricks");

  // Upper storeys: stone floor bands, paired window rows, warm lights in some panes.
  for (let k = 0; k < nU; k++) {
    const s = slab(k);
    setc(s, "stone_bricks");
    if (corner) {
      setc(s + 1, "stone_bricks");
      setc(s + 2, "stone_bricks");
    } else if (win) {
      const lit = (u + k) % 3 === 0;
      setc(s + 1, lit ? "glowstone" : "glass");
      setc(s + 2, "glass");
    } else {
      setc(s + 1, "bricks");
      setc(s + 2, "bricks");
    }
  }

  // Cornice: corbel band, frieze, cap; crenellated parapet.
  setc(R - 3, "smooth_stone");
  setc(R - 2, "bricks");
  setc(R - 1, "smooth_stone");
  if (corner || u % 2 === 0) setc(R, "stone_bricks");

  if (win) windowCells.push({ x: c.x, z: c.z, f: p, gnd: c.g });
}

// Air gap behind every window: carve the interior cell just inside the glass.
for (const w of windowCells) {
  const [ix, iz] = inwardOf(w.x, w.z, w.f);
  if (!has(ix, iz) || isFace(ix, iz)) continue;
  for (let y = w.gnd + 1; y < transom; y++) g_set(ix, y, iz, "air");
  for (let k = 0; k < nU; k++) {
    g_set(ix, slab(k) + 1, iz, "air");
    g_set(ix, slab(k) + 2, iz, "air");
  }
}

// Entrance: dark oak door with a stone hood at the transom.
if (door) {
  const { x, z, f, gnd } = door;
  const props = (half) => ({
    facing: facingOf[f], half, hinge: "left", open: "false", powered: "false",
  });
  g_set(x, gnd + 1, z, "dark_oak_door", props("lower"));
  g_set(x, gnd + 2, z, "dark_oak_door", props("upper"));
  g_set(x, transom, z, "stone_brick_stairs", {
    facing: facingOf[f], half: "top", shape: "straight", waterlogged: "false",
  });
}

// Roof: a skylight over the lightwell and a wooden water tower on the roof.
{
  const interior = all.filter((c) => !isFace(c.x, c.z));
  if (interior.length) {
    const mx = (W - 1) / 2, mz = (D - 1) / 2;
    interior.sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz));
    const sky = interior[0];
    g_set(sky.x, R - 1, sky.z, "glass");
    const tank = interior[interior.length - 1];
    g_set(tank.x, R, tank.z, "oak_planks");
    g_set(tank.x, R + 1, tank.z, "oak_planks");
    g_set(tank.x, R + 2, tank.z, "oak_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
