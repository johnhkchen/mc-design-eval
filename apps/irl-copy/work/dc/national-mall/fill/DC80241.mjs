// 400 North Capitol St NW, a 1960s-70s Commercial-Office-Large: a two-bar office tower on a stone-and-precast podium,
// clad in white piers, light-grey spandrels and light-blue glazing. Lidar heights are snapped to flat tiers; the core
// of each tower steps back from the podium, the street face is on the downhill west side, and the windows are hollow
// (an air gap behind the glass, a floor slab per storey, roof caps and parapets).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80241.cells.json`, "utf8"));

const F = 2;                                    // floor datum (the uphill ground); storeys are 2 blocks, even rows are spandrels/floors
const TIERS = [3, 5, 12, 14, 16];               // lidar roof heights snap to these flat tiers (ties go up)
const snap = (h) => TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) || (Math.abs(t - h) === Math.abs(best - h) && t > best) ? t : best));
const k = (x, z) => `${x},${z}`;
const col = new Map();
for (const [x, z, g, h] of cells) col.set(k(x, z), { x, z, g, tier: snap(h) });

// Distance in from the outside edge (1 = the outer ring); sets the setbacks of the towers.
const dist = new Map();
let frontier = [];
for (const c of col.values()) {
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !col.has(k(c.x + dx, c.z + dz)))) { dist.set(k(c.x, c.z), 1); frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = col.get(k(c.x + dx, c.z + dz));
    if (n && !dist.has(k(n.x, n.z))) { dist.set(k(n.x, n.z), d + 1); next.push(n); }
  }
  frontier = next;
}

// Each column's top: the 16-tier towers stand on a 14 podium and step back to their core (dist >= 3).
for (const c of col.values()) {
  c.top = c.tier === 16 ? (dist.get(k(c.x, c.z)) >= 3 ? 16 : 14) : c.tier;
}
const top = (x, z) => col.get(k(x, z))?.top ?? -1;
const g = (x, z) => col.get(k(x, z))?.g ?? 0;
const present = (x, z, y) => { const c = col.get(k(x, z)); return !!c && y >= c.g && y < c.top; };
const phase = (y) => (((y - F) % 2) + 2) % 2;   // 0 = spandrel / floor row, 1 = glazing row

const V = new Voxels([39, 28, 37]);
const DIRS = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
const lit = [];

for (const c of col.values()) {
  const { x, z } = c;
  // Foundation up to the local ground, then the building column.
  for (let y = 0; y < c.g; y++) V.set(x, y, z, "stone");
  for (let y = c.g; y < c.top; y++) {
    if (y === c.top - 1) { V.set(x, y, z, "gray_concrete"); continue; }       // roof cap, the visible top
    const exposed = DIRS.filter(([dx, dz]) => !present(x + dx, z + dz, y));
    if (exposed.length === 0) continue;                                       // interior: handled below
    const row0 = phase(y) === 0;
    if (row0) {
      V.set(x, y, z, y === 0 || y === F ? "polished_andesite" : "light_gray_concrete");   // base course, spandrels
      continue;
    }
    if (exposed.length >= 2) { V.set(x, y, z, "white_concrete"); continue; }   // corner pier
    const [dx, dz, face] = exposed[0];
    const u = dx !== 0 ? z : x;                                               // position along the face
    if (u % 3 === 0) { V.set(x, y, z, "white_concrete"); continue; }          // pier between bays
    const behind = [x - dx, z - dz];                                          // the cell inside the glass
    if (u % 12 === 4 && y % 4 === 3) { lit.push([behind[0], y, behind[1]]); V.set(x, y, z, "glass"); continue; }
    V.set(x, y, z, "light_blue_stained_glass");
  }
  // Interior: a floor slab on every even row, air behind the glass.
  for (let y = c.g; y < c.top - 1; y++) {
    const exposed = DIRS.some(([dx, dz]) => !present(x + dx, z + dz, y));
    if (!exposed && phase(y) === 0) V.set(x, y, z, "smooth_stone");
  }
  // Parapet on the roof edge of every column whose neighbour stops lower.
  if (DIRS.some(([dx, dz]) => !present(x + dx, z + dz, c.top))) V.set(x, c.top, z, "stone_brick_wall");
}

// Warm light behind some of the lit panes (sits on the floor slab below).
for (const [x, y, z] of lit) V.set(x, y, z, y % 4 === 1 ? "glowstone" : "shroomlight");

// Entrance on the west street face: door at street level, stone lintel, piers either side.
for (const z of [9, 10, 11, 12]) V.set(1, 2, z, "smooth_stone_slab", { type: "top" });
V.set(1, 0, 10, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
V.set(1, 1, 10, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
V.set(2, 0, 10, "air");
V.set(2, 1, 10, "air");

// Roof plant: penthouse boxes on the tower cores and on the podium terrace.
for (let x = 11; x <= 14; x++) for (let z = 6; z <= 7; z++) if (top(x, z) === 16) V.set(x, 16, z, "iron_block");
for (let x = 26; x <= 27; x++) for (let z = 25; z <= 26; z++) if (top(x, z) === 16) V.set(x, 16, z, "iron_block");
for (let x = 20; x <= 21; x++) for (let z = 16; z <= 17; z++) if (top(x, z) === 14) V.set(x, 14, z, "light_gray_concrete");

const out = `${DIR}/DC80241.nbt`;
const r = V.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
