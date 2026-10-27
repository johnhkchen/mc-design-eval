// Way 360119688: a 1920s-30s brick-and-plaster commercial block (Stripped Classical, Mt Eden / Newton Road type),
// stepped by the lidar roof into a 3-storey podium, a 4-storey tower and a 5-storey core. Basalt plinth, cream
// string courses and window heads, brick pilasters, glass bays, a dark shopfront on the street face, and warm light
// behind some glass. Solid shell with floor slabs and air inside; no rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_360119688.cells.json`, "utf8"));

// Roof tiers on storey lines: a 2-block plinth, then 4-block storeys. Caps at y 14 / 18 / 22 (3 / 4 / 5 storeys).
const capOf = (r) => (r >= 20 ? 22 : r >= 16 ? 18 : 14);

const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { x, z, g, cap: capOf(r) });
const get = (x, z) => at.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// outward: a face with no footprint neighbour; low: a neighbour's roof is lower, so this wall rises above it
for (const c of at.values()) {
  c.out = []; c.low = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = get(c.x + dx, c.z + dz);
    if (!n) c.out.push(d); else if (n.cap < c.cap) c.low.push(d);
  }
  c.env = c.out.length + c.low.length > 0;
}

// the street: the face with the most outward cells; its cells carry the shopfront
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const c of at.values()) for (const d of c.out) faceCount[d]++;
const street = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const alongX = (d) => d === "N" || d === "S";
const shop = [...at.values()].filter((c) => c.out.includes(street))
  .sort((a, b) => (alongX(street) ? a.x - b.x : a.z - b.z));
const isPilaster = (c) => (c.out.includes("N") || c.out.includes("S") ? c.x : c.z) % 3 === 0;
const doorCell = shop.find((c, i) => i >= Math.floor(shop.length / 2) && !isPilaster(c)) ?? shop[0];

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);
const blockAt = (x, y, z) => B.get(`${x},${y},${z}`)?.block;
const panes = [];
const windows = [];
const door = (c, y, half) => put(c.x, y, c.z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const c of at.values()) {
  const { x, z } = c;
  const C = c.cap, n = (C - 2) / 4;
  // foundation to y 2 (the lowest ground is y 0, so the downhill cells are plinth up to the first floor) and base course
  put(x, 0, z, "polished_andesite"); put(x, 1, z, "polished_andesite");
  put(x, 2, z, c.env ? "polished_andesite" : "smooth_stone");
  for (let k = 0; k < n; k++) {
    const b = 2 + 4 * k;
    if (k > 0) put(x, b, z, c.env ? "smooth_quartz" : "smooth_stone");   // floor slab / cream string course
    if (!c.env) continue;
    if (!c.out.length) { for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "bricks"); continue; }
    if (isPilaster(c)) { for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "bricks"); continue; }
    // a window bay: glass in two rows, cream head above; the ground storey is a shopfront on the street face
    const onStreet = c.out.includes(street);
    const isShop = k === 0 && onStreet;
    const plane = alongX(c.out[0]) ? "NS" : "EW";
    const isDoor = c === doorCell;
    for (let y = b + 1; y <= b + 2; y++) {
      if (isDoor && y <= b + 2) door(c, y, y === b + 1 ? "lower" : "upper");
      else { put(x, y, z, "glass_pane"); panes.push({ x, y, z, plane }); }
    }
    if (isShop) put(x, b + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });   // the dark shop hood
    else put(x, b + 3, z, "smooth_quartz");
    windows.push({ c, k, b, plane, isShop, isDoor });
  }
  // roof: membrane cap across the tier, parapet on the outer edge
  put(x, C, z, "smooth_stone");
  if (c.out.length) put(x, C + 1, z, "smooth_quartz");
}

// warm light: lanterns standing behind the shopfront glass, glowstone behind some upper windows (air behind glass)
for (const w of windows) {
  const { c, k, b, plane } = w;
  const inward = plane === "NS" ? (c.out.includes("N") ? "S" : "N") : (c.out.includes("W") ? "E" : "W");
  const [dx, dz] = DIRS[inward];
  const inner = get(c.x + dx, c.z + dz);
  if (!inner || inner.env) continue;
  if (w.isShop && !w.isDoor && (c.x + c.z) % 2 === 0) put(inner.x, b + 1, inner.z, "lantern", { hanging: "false", waterlogged: "false" });
  else if (!w.isShop && (c.x + c.z + k) % 5 === 0) put(inner.x, b + 1, inner.z, "glowstone");
  else if (!w.isShop && (c.x + c.z + k) % 5 === 2) put(inner.x, b + 1, inner.z, "shroomlight");
}

// roof plant on the top tier: iron boxes standing on the membrane, a few on the interior
for (const c of at.values()) {
  if (c.cap === 22 && !c.env && c.x % 5 === 2 && c.z % 4 === 1) put(c.x, 23, c.z, "iron_block");
}

// glass panes connect to their neighbours in the wall plane
const SOLID = new Set(["bricks", "smooth_quartz", "polished_andesite", "smooth_stone", "iron_block", "glass_pane"]);
for (const p of panes) {
  const [a, bb] = p.plane === "NS" ? [[p.x - 1, p.z], [p.x + 1, p.z]] : [[p.x, p.z - 1], [p.x, p.z + 1]];
  const link = ([x, z]) => SOLID.has(blockAt(x, p.y, z));
  const st = p.plane === "NS"
    ? { north: "false", south: "false", east: String(link(bb)), west: String(link(a)) }
    : { north: String(link(a)), south: String(link(bb)), east: "false", west: "false" };
  B.get(`${p.x},${p.y},${p.z}`).state = { ...st, waterlogged: "false" };
  B.get(`${p.x},${p.y},${p.z}`).block = "glass_pane";
}

// the volume: 35 x 34 x 18 as the template gives it
const g = new Voxels([35, 34, 18]);
let unsupported = 0;
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (y > 0 && !has(x, y - 1, z)) unsupported++;
  g.set(x, y, z, block, state);
}
const out = `${DIR}/way_360119688.nbt`;
const res = g.save(out);
console.log(`street ${street}, door at (${doorCell.x},${doorCell.z}), windows ${windows.length}, unsupported ${unsupported}, ${JSON.stringify(res)}`);
