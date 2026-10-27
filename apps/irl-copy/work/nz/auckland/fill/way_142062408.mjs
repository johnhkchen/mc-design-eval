import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Te Hiku Fire & Emergency Headquarters, Mt Eden, Auckland (way 142062408).
// A 1960s-80s civic concrete station: a one-storey apparatus bay (NE, red roller doors), a two-storey wing (NW),
// a four-storey main block with a glazed public face, and a tower core carrying a red hose-drying tower.
// Floors sit on a 4-block grid; where the ground is low (y 0) the lowest storey is a real storey, and where it is
// high the lowest storey is solid base. Roof heights are the lidar's 5x5 median snapped to clean tier tops.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const OUT = `${DIR}/way_142062408.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/way_142062408.cells.json`, "utf8"));

const SIZE = [37, 31, 45];
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inFoot = (x, z) => raw.has(key(x, z));

// ---- massing: snap the smoothed lidar roof to tier tops -------------------------------------------------------
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
function tierOf(x, z) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)).r);
  const m = median(v);
  if (m <= 7) return { T: 8, single: true };   // apparatus bay: one storey
  if (m <= 12) return { T: 10 };               // wing: one storey and an attic band
  if (m <= 16) return { T: 16 };               // main block: three storeys over the base
  return { T: 18 };                            // tower core
}

// T = roof top (surface) height; F0 = first floor line; g = lowest ground under the cell
const cell = new Map();
for (const { x, z, g } of raw.values()) {
  const t = tierOf(x, z);
  const F0 = t.single ? g : g === 0 ? 0 : 4;
  cell.set(key(x, z), { x, z, g, T: t.T, single: !!t.single, F0 });
}

const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const present = (x, z, y) => { const c = cell.get(key(x, z)); return !!c && y < c.T; };
const exposed = (c, y) => Object.keys(SIDE).filter((f) => !present(c.x + SIDE[f][0], c.z + SIDE[f][1], y));
const isLine = (c, y) => y >= c.F0 && (c.single ? y === c.F0 : (y - c.F0) % 4 === 0 && y <= c.T - 2);
const isWin = (c, y) => (c.single ? y > c.F0 + 2 && y <= c.F0 + 4 : (y - c.F0) % 4 === 1 || (y - c.F0) % 4 === 2);
const isLintel = (c, y) => (c.single ? y > c.F0 + 4 : (y - c.F0) % 4 === 3);
const isPier = (c, ex) => ex.length > 1 || ((ex[0] === "N" || ex[0] === "S" ? c.x : c.z) % 3 === 0);
const paneState = (f) => (f === "N" || f === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// ---- openings ------------------------------------------------------------------------------------------------
// apparatus doors: the middle three cells of the bay's north face; public entrance: the middle three of the
// low (ground 0) east face of the main block, so it opens onto the street
const bayFront = [...cell.values()].filter((c) => c.single && !present(c.x, c.z - 1, 2));
const frontZ = Math.min(...bayFront.map((c) => c.z));
const bayN = bayFront.filter((c) => c.z === frontZ).sort((a, b) => a.x - b.x);
const bm = bayN.length >> 1;
const DOOR_BAY = new Set(bayN.slice(Math.max(0, bm - 1), bm + 2).map((c) => key(c.x, c.z)));
const eastLow = [...cell.values()].filter((c) => !c.single && c.g === 0 && !inFoot(c.x + 1, c.z)).sort((a, b) => a.z - b.z);
const em = eastLow.length >> 1;
const DOOR_MAIN = new Set(eastLow.slice(Math.max(0, em - 1), em + 2).map((c) => key(c.x, c.z)));

// warm lights: some windows get a glowstone or shroomlight in the air gap behind the glass, standing on the floor
const lamps = new Map();
for (const c of cell.values()) {
  if (c.single) continue;
  for (let y = c.F0 + 1; y < c.T - 1; y++) {
    if (!isWin(c, y) || (y - c.F0) % 4 !== 1 || DOOR_MAIN.has(key(c.x, c.z))) continue;
    const ex = exposed(c, y);
    if (ex.length !== 1 || isPier(c, ex)) continue;
    if ((c.x + c.z + y) % 3 !== 0) continue;
    const ic = cell.get(key(c.x + INWARD[ex[0]][0], c.z + INWARD[ex[0]][1]));
    if (!ic || y >= ic.T || exposed(ic, y).length || isLine(ic, y)) continue;
    lamps.set(`${ic.x},${y},${ic.z}`, (c.x + c.z) % 2 ? "shroomlight" : "glowstone");
  }
}

// ---- one cell's column: [block name, state?] at height y, or null for air ---------------------------------------
function blockAt(c, y) {
  if (y >= c.T) return null;
  if (y < c.g) return ["stone"];                       // fill, from y 0 up to the ground
  if (y < c.F0) return ["stone_bricks"];               // solid base course up to the first floor
  const k = key(c.x, c.z), ex = exposed(c, y);
  if (y === c.T - 1) return ex.length ? ["white_concrete"] : ["smooth_stone"];   // cornice / roof slab
  if (ex.length && DOOR_BAY.has(k) && y <= c.F0 + 2) return ["red_concrete"];   // roller shutters
  if (ex.length && DOOR_MAIN.has(k)) {
    if (y <= c.F0 + 2) return ["glass"];                // glazed entrance
    if (y === c.F0 + 3) return ["red_concrete"];        // canopy band over the door
  }
  if (isLine(c, y)) return ["smooth_stone"];           // floor slab / string course
  if (!ex.length) return lamps.has(`${c.x},${y},${c.z}`) ? [lamps.get(`${c.x},${y},${c.z}`)] : null;
  if (isLintel(c, y)) return ["white_concrete"];
  const pier = isPier(c, ex);
  if (isWin(c, y) && !pier) return ["glass_pane", paneState(ex[0])];
  return [pier || isWin(c, y) ? "white_concrete" : "light_gray_concrete"];
}

const g = new Voxels(SIZE);
for (const c of cell.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// ---- roof: a red hose-drying tower on the tower core, and plant boxes on the main roof ----------------------------
const tower = [...cell.values()].filter((c) => c.T === 18);
const tx = Math.round(tower.reduce((s, c) => s + c.x, 0) / tower.length);
const tz = Math.round(tower.reduce((s, c) => s + c.z, 0) / tower.length);
let site = null;
for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
  const x0 = tx + dx, z0 = tz + dz;
  let ok = true;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const c = cell.get(key(x0 + i, z0 + j)); if (!c || c.T !== 18) ok = false; }
  const d = Math.abs(dx) + Math.abs(dz);
  if (ok && (!site || d < site.d)) site = { x: x0, z: z0, d };
}
for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
  if (i === 0 && j === 0) { g.set(site.x, 22, site.z, "white_concrete"); continue; }
  const x = site.x + i, z = site.z + j, mid = Math.abs(i) + Math.abs(j) === 1;
  for (let y = 18; y <= 21; y++) {
    if (mid && (y === 19 || y === 20)) g.set(x, y, z, "glass_pane", paneState(i === 0 ? "N" : "E"));
    else g.set(x, y, z, "red_concrete");
  }
  g.set(x, 22, z, "white_concrete");
}

// plant boxes: 3x2 iron units, one block high, on main-roof cells that have roof on every side
const roofIn = new Set([...cell.values()].filter((c) => c.T === 16 && Object.keys(SIDE).every((f) => present(c.x + SIDE[f][0], c.z + SIDE[f][1], 15))).map((c) => key(c.x, c.z)));
const boxes = [];
search: for (let z0 = 0; z0 < 45; z0++) for (let x0 = 0; x0 < 37; x0++) {
  const cs = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cs.push([x0 + i, z0 + j]);
  if (!cs.every(([x, z]) => roofIn.has(key(x, z)))) continue;
  if (boxes.some((b) => Math.abs(b.x - x0) < 6 && Math.abs(b.z - z0) < 5)) continue;
  boxes.push({ x: x0, z: z0 });
  if (boxes.length === 2) break search;
}
for (const b of boxes) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.set(b.x + i, 16, b.z + j, "iron_block");

const stats = {};
for (const c of cell.values()) stats[c.T] = (stats[c.T] || 0) + 1;
console.log("tiers (cells by roof top):", JSON.stringify(stats), "| bay doors", [...DOOR_BAY], "| entrance", [...DOOR_MAIN]);
console.log("hose tower at", site, "| plant boxes", boxes, "| lamps", lamps.size);
const { blocks, palette } = g.save(OUT);
console.log(`saved ${OUT}: ${blocks} blocks, ${palette} palette entries`);
