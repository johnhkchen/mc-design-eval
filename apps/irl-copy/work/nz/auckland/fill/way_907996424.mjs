import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Auckland City Apartments: a late-1990s reinforced-concrete apartment block on a podium, 13 storeys, cream render with
// concrete floor bands, aluminium-framed glass bays, a parapet, a lift overrun and a warm-lit ground floor. Its massing is
// the lidar roof, median-smoothed over 5x5 and quantised to 4-block storeys (tops at 10 + 4n), so the tower steps back in
// clean tiers. Walls are 1 cell thick; behind them is an air gap with a floor slab per storey; the core is solid.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907996424.cells.json", "utf8"));
const [SX, SY, SZ] = [50, 66, 51];
const g = new Voxels([SX, SY, SZ]);

const M = {
  foundation: "stone", base: "stone_bricks", lintel: "stone_bricks", wall: "white_concrete", band: "light_gray_concrete",
  pier: "smooth_quartz", glassA: "light_blue_stained_glass", glassB: "cyan_stained_glass", lamp: "glowstone",
  core: "white_concrete", parapet: "smooth_stone_slab", plant: "light_gray_concrete",
};

const at = new Map(cells.map((c) => [`${c[0]},${c[1]}`, { x: c[0], z: c[1], ground: c[2], roof: c[3] }]));
const get = (x, z) => at.get(`${x},${z}`);
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const NB4 = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };

// Shell depth: 0 = the envelope (walls and glass), 1 = the air gap behind it, 2+ = the solid core.
for (const c of at.values()) c.depth = NB8.some(([dx, dz]) => !get(c.x + dx, c.z + dz)) ? 0 : undefined;
for (const c of at.values()) if (c.depth === undefined) c.depth = NB8.some(([dx, dz]) => get(c.x + dx, c.z + dz)?.depth === 0) ? 1 : 2;

// Exposed sides of each envelope cell (the outward faces): W, E, N, S
for (const c of at.values()) {
  c.exposed = Object.keys(NB4).filter((k) => !get(c.x + NB4[k][0], c.z + NB4[k][1]));
  const exX = c.exposed.some((k) => k === "W" || k === "E"), exZ = c.exposed.some((k) => k === "N" || k === "S");
  c.face = exX && !exZ ? c.exposed.find((k) => k === "W" || k === "E") : exZ && !exX ? c.exposed.find((k) => k === "N" || k === "S") : "";
  c.corner = c.depth === 0 && (exX === exZ);   // corner or a sliver with no single outward face: a pier
  c.bay = c.face === "W" || c.face === "E" ? c.z : c.x;
}

// Storeys: 6-block podium-level plinth below, then floor bands at y = 6, 10, 14 ... (rel 0); glass in rel 1-2; spandrel rel 3
const rel = (y) => (((y - 6) % 4) + 4) % 4;
const median = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
for (const c of at.values()) {
  const rs = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = get(c.x + dx, c.z + dz); if (n) rs.push(n.roof); }
  const m = median(rs);
  c.top = 10 + 4 * Math.max(0, Math.round((m - 10) / 4));
}

// The entrance: the west face (the uphill side, ground 6) nearest the middle of its length
const envelope = [...at.values()].filter((c) => c.depth === 0);
const doorFace = envelope.filter((c) => c.face === "W" && c.ground === 6).sort((a, b) => Math.abs(a.z - 25) - Math.abs(b.z - 25))[0]
  ?? envelope.filter((c) => c.face).sort((a, b) => b.ground - a.ground)[0];
const doorFacing = { W: "west", E: "east", N: "north", S: "south" }[doorFace.face];
const doorBay = doorFace.bay;
const onDoorFace = (c) => c.face === doorFace.face && Math.abs(c.bay - doorBay) <= 1;

// Lamps: warm glowstone on the air-gap floor behind some glass (glass in the first row above each floor band)
const lit = new Set();
for (const c of envelope) {
  if (c.corner || !c.face || c.ground === undefined) continue;
  for (let y = c.ground; y < c.top; y++) {
    if (rel(y) !== 1) continue;
    if ((c.x * 7 + y * 5 + c.z * 11) % 7 !== 0) continue;
    const [dx, dz] = c.face === "W" ? [1, 0] : c.face === "E" ? [-1, 0] : c.face === "N" ? [0, 1] : [0, -1];
    lit.add(`${c.x + dx},${y},${c.z + dz}`);
  }
}

// What block a cell holds at height y (null = air)
function blockAt(c, y) {
  const { x, z, ground: G, top: T, depth } = c;
  if (y < G) return [M.foundation];
  if (depth >= 2) return [y === T - 1 ? M.band : M.core];
  if (depth === 1) {
    if (y === T - 1 || rel(y) === 0) return [M.band];
    return lit.has(`${x},${y},${z}`) ? [M.lamp] : null;
  }
  // the envelope
  if (y === T - 1) return [M.parapet, { type: "bottom", waterlogged: "false" }];
  if (c === doorFace && y === G) return ["dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" }];
  if (c === doorFace && y === G + 1) return ["dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" }];
  if (onDoorFace(c) && y === G + 2) return [M.lintel];
  if (y === G) return [M.base];
  const r = rel(y);
  if (r === 0) return [M.band];
  if (r === 3) return [M.wall];
  if (c.corner || c.bay % 4 === 0 || c.bay % 4 === 3) return [M.pier];
  return [(x * 31 + y * 17 + z * 13) % 5 === 0 ? M.glassB : M.glassA];
}

let counts = { envelope: 0, air: 0, core: 0 };
for (const c of at.values()) {
  for (let y = 0; y < c.top; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  counts[["envelope", "air", "core"][Math.min(c.depth, 2)]]++;
}

// Plant room and lift overrun on the highest tier, inside the core
const top = [...at.values()].filter((c) => c.depth >= 2 && c.top === 54);
const mx = top.reduce((s, c) => s + c.x, 0) / top.length, mz = top.reduce((s, c) => s + c.z, 0) / top.length;
for (const c of top) {
  if (Math.abs(c.x - mx) <= 2 && Math.abs(c.z - mz) <= 2) for (let y = c.top; y < c.top + 3; y++) g.set(c.x, y, c.z, M.plant);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907996424.nbt";
const info = g.save(out);
const tops = {};
for (const c of at.values()) tops[c.top] = (tops[c.top] || 0) + 1;
console.log(JSON.stringify({ cells: at.size, counts, door: [doorFace.x, doorFace.z, doorFacing], tops, lamps: lit.size, ...info }));
