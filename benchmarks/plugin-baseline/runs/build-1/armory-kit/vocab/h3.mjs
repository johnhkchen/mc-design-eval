// Named helpers from plan.md VOCABULARY (this file's share): slotWindow, atriumRailing, copingParapet, pavilionBay,
// vaultBay, chihulyFlower, canopySlab, glassBlossom, lampPost. Each takes its position as arguments; plan.md's
// geometry is only the default. Every helper writes only into air: a cell an earlier part built (wall, ground,
// floor) is skipped, never overwritten. The one exception is vaultBay's `floor: true`, which replaces the y0 ground.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Glasshouse cross-section (plan.md): the glass surface's dx from the bay axis at each y (index = y); y 1 is the curb.
const VAULT_DX = [null, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2, 1, 0];
const PURLIN_YS = [7, 13, 20];
const DYE_GLASS = { red: "red_stained_glass", orange: "orange_stained_glass", yellow: "yellow_stained_glass", blue: "blue_stained_glass" };
const SIDES = ["north", "east", "south", "west"];

const key = (x, y, z) => `${x},${y},${z}`;

// Writes a plan of {x, y, z, block, state, replace, sides} entries. A cell that isn't air is skipped unless its entry
// says replace; the first entry for a cell wins. Returns the number of blocks placed.
function commit(g, plan) {
  let n = 0;
  for (const c of plan) {
    if (!g.inBounds(c.x, c.y, c.z)) continue;
    if (!c.replace && !g.isAir(c.x, c.y, c.z)) continue;
    g.set(c.x, c.y, c.z, c.block, c.state);
    n++;
  }
  return n;
}

// glass_pane and iron_bars join their four neighbours: a side joins when the neighbour is in this plan or already built.
function joinSides(g, plan) {
  const planned = new Set(plan.map((c) => key(c.x, c.y, c.z)));
  for (const c of plan) {
    if (!c.sides) continue;
    c.state = Object.fromEntries(SIDES.map((d) => {
      const [dx, dy, dz] = DIRS[d], x = c.x + dx, y = c.y + dy, z = c.z + dz;
      return [d, String(planned.has(key(x, y, z)) || (g.inBounds(x, y, z) && !g.isAir(x, y, z)))];
    }));
  }
  return plan;
}

// Seeded rng (mulberry32) so a chihulyFlower is the same on every run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 2-wide, full-height glass_pane slot in a wall, capped with brown_terracotta at y1 + 1. face: the wall's outward facing. */
export function slotWindow(g, { x, z, face = "north", y0, y1 }) {
  const [dx, dz] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  const plan = [];
  for (let i = 0; i < 2; i++) {
    for (let y = y0; y <= y1; y++) plan.push({ x: x + i * dx, y, z: z + i * dz, block: "glass_pane", sides: true });
    plan.push({ x: x + i * dx, y: y1 + 1, z: z + i * dz, block: "brown_terracotta" });
  }
  return commit(g, joinSides(g, plan));
}

/** iron_bars railing along z at column x, one high at y. gaps: the z of each stair top, left open. */
export function atriumRailing(g, { x, z0, z1, y, gaps = [] }) {
  const plan = [];
  for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) if (!gaps.includes(z)) plan.push({ x, y, z, block: "iron_bars", sides: true });
  return commit(g, joinSides(g, plan));
}

/** Parapet ring round the rectangle x0..x1, z0..z1: smooth_sandstone at y and y+1, a bottom slab coping at y+2. The deck inside is not touched. */
export function copingParapet(g, { x0, z0, x1, z1, y = 29 }) {
  const plan = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    plan.push({ x, y, z, block: "smooth_sandstone" }, { x, y: y + 1, z, block: "smooth_sandstone" });
    plan.push({ x, y: y + 2, z, block: "smooth_sandstone_slab", state: { type: "bottom" } });
  }
  return commit(g, plan);
}

/**
 * One 7-cell bay of a white-and-glass facade: a white_concrete pier at (x, z), glass_pane in the 6 cells after it,
 * floor bands of white_concrete at y 7, 14 ..., a light_gray_concrete base at y1 and coping at the top. The run goes
 * along x for a north or south face and along z for east or west. closing: also write the pier 7 cells on (the last bay).
 */
export function pavilionBay(g, { x, z, face = "north", storeys = 2, closing = false }) {
  const [ax, az] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  const top = 7 * storeys;
  const plan = [];
  for (let i = 0; i < 7 + (closing ? 1 : 0); i++) {
    const px = x + i * ax, pz = z + i * az;
    plan.push({ x: px, y: 1, z: pz, block: "light_gray_concrete" }, { x: px, y: top, z: pz, block: "light_gray_concrete" });
    for (let y = 2; y < top; y++) {
      const pier = i === 0 || i === 7;
      if (pier || y % 7 === 0) plan.push({ x: px, y, z: pz, block: "white_concrete" });
      else plan.push({ x: px, y, z: pz, block: "glass_pane", sides: true });
    }
  }
  return commit(g, joinSides(g, plan));
}

/**
 * One 4-deep bay of the Glasshouse vault, k = 0..9: the shell per VAULT_DX (glass, a polished_blackstone curb at y1,
 * smooth_quartz purlins at y 7, 13, 20), axis cx = x0 + k, z = z0 + 4k .. +3. floor: also lay the polished_blackstone
 * floor and the sea_lantern inlay over the y0 ground (the only write here that replaces a built cell).
 */
export function vaultBay(g, { k, x0 = 231, z0 = 4, floor = false }) {
  const cx = x0 + k, zA = z0 + 4 * k;
  const plan = [];
  for (let z = zA; z <= zA + 3; z++) {
    for (let y = 1; y <= 20; y++) {
      const dx = VAULT_DX[y];
      const block = y === 1 ? "polished_blackstone" : PURLIN_YS.includes(y) ? "smooth_quartz" : "glass";
      for (const s of dx === 0 ? [0] : [-1, 1]) plan.push({ x: cx + s * dx, y, z, block });
    }
    if (floor) for (let dx = -6; dx <= 6; dx++) plan.push({ x: cx + dx, y: 0, z, block: "polished_blackstone", replace: true });
  }
  if (floor) for (const s of [-5, 5]) plan.push({ x: cx + s, y: 0, z: zA + 1, block: "sea_lantern", replace: true });
  return commit(g, plan);
}

/**
 * The hanging CHIHULY cloud in the vault bays (default k = 1..8): lumps inside the glass, |dx| <= 4, y 10..17, kept
 * clear of the shell; ~55% orange, 25% red, 12% yellow, 8% plain glass; shroomlight 1 in 40; end_rod spikes (1..3
 * long, outward in x) on 1 in 12 outer cells; a chain hanger at y 18..19 from the ridge in each bay.
 */
export function chihulyFlower(g, { bays = [1, 2, 3, 4, 5, 6, 7, 8], seed = 1, x0 = 231, z0 = 4 }) {
  const rand = mulberry32(seed);
  const plan = [];
  for (const k of bays) {
    const cx = x0 + k, zA = z0 + 4 * k;
    const lumps = Array.from({ length: 5 }, () => ({
      rx: Math.round(rand() * 4 - 2), ry: 11 + Math.floor(rand() * 6), rz: zA + Math.floor(rand() * 4), r: 1.6 + rand(),
    }));
    const cloud = new Set();
    for (let dx = -4; dx <= 4; dx++) for (let y = 10; y <= 17; y++) for (let z = zA; z <= zA + 3; z++) {
      if (Math.abs(dx) >= VAULT_DX[y]) continue;
      if (lumps.some((l) => (dx - l.rx) ** 2 + (y - l.ry) ** 2 + ((z - l.rz) * 0.5) ** 2 <= l.r * l.r)) cloud.add(`${dx},${y},${z}`);
    }
    const spikes = [];
    for (const id of cloud) {
      const [dx, y, z] = id.split(",").map(Number), x = cx + dx;
      const r = rand();
      let block = r < 0.55 ? "orange_stained_glass" : r < 0.8 ? "red_stained_glass" : r < 0.92 ? "yellow_stained_glass" : "glass";
      if (rand() < 1 / 40) block = "shroomlight";
      plan.push({ x, y, z, block });
      const outer = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, c]) => !cloud.has(`${dx + a},${y + b},${z + c}`));
      if (outer && rand() < 1 / 12) {
        const facing = dx > 0 || (dx === 0 && rand() < 0.5) ? "east" : "west";
        const s = facing === "east" ? 1 : -1;
        for (let i = 1, len = 1 + Math.floor(rand() * 3); i <= len; i++) spikes.push({ x: x + s * i, y, z, block: "end_rod", state: { facing } });
      }
    }
    plan.push(...spikes);
    plan.push({ x: cx, y: 19, z: zA + 1, block: "chain", state: { axis: "y" } }, { x: cx, y: 18, z: zA + 1, block: "chain", state: { axis: "y" } });
  }
  return commit(g, plan);
}

/** Canopy over x0..x1, z0..z1: polished_deepslate_slab (top half) at y, sea_lantern downlights at y-1 along z0+2 every 4 x. */
export function canopySlab(g, { x0, z0, x1, z1, y = 7 }) {
  const plan = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) plan.push({ x, y, z, block: "polished_deepslate_slab", state: { type: "top" } });
  for (let x = x0 + 2; x <= x1; x += 4) plan.push({ x, y: y - 1, z: z0 + 2, block: "sea_lantern" });
  return commit(g, plan);
}

/** A stained-glass column of h (3..5) blocks above a polished_andesite base at y1, colours alternating, end_rod tip. */
export function glassBlossom(g, { x, z, h = 4, colors = ["red", "yellow"] }) {
  const n = Math.min(5, Math.max(3, h));
  const plan = [{ x, y: 1, z, block: "polished_andesite" }];
  for (let i = 0; i < n; i++) {
    const block = DYE_GLASS[colors[i % colors.length]];
    if (!block) throw new Error(`glassBlossom: no stained glass for colour "${colors[i % colors.length]}"`);
    plan.push({ x, y: 2 + i, z, block });
  }
  plan.push({ x, y: 2 + n, z, block: "end_rod", state: { facing: "up" } });
  return commit(g, plan);
}

/** Three oak_fence posts at y1..3 with a lantern standing on top (y4). */
export function lampPost(g, { x, z }) {
  const plan = [1, 2, 3].map((y) => ({ x, y, z, block: "oak_fence" }));
  plan.push({ x, y: 4, z, block: "lantern", state: { hanging: "false" } });
  return commit(g, plan);
}
