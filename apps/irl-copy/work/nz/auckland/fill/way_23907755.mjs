// O'Rorke Hall: a 1970s reinforced-concrete office block of thirteen storeys (roof about 52 blocks, 4 blocks a storey)
// on a dark andesite plinth, with a stepped massing: a tall north-west tower, a middle body and low wings to the east.
// Pale concrete frame and spandrels, tinted glass bands with pillars between bays, a stone base course and a shopfront
// on the lowest street face, where a recessed entrance has a canopy. Roofs are smoothed (a 15 x 15 mean) and snapped to
// 4-block tiers so each setback stands on the storey below. Each column is solid from its ground to its tier; windows
// are glass panes at the face with one air block behind, and a few are lit by glowstone. Nothing is built off the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907755.cells.json", "utf8"));
const W = 77, D = 74, H = 63;
const FOUND = "andesite", BASE = "polished_andesite", SLAB = "light_gray_concrete", SPAND = "white_concrete";
const DECK = "gray_concrete", GLASS = "cyan_stained_glass_pane", SHOP = "light_blue_stained_glass_pane";
const DOOR = "iron_door", LAMP = "glowstone";

const DIR = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const key = (x, z) => `${x},${z}`;

// The footprint, its ground (g) and its roof smoothed over a 15 x 15 mean, snapped to a 4-block storey line (T).
const foot = new Map();
for (const [x, z, g, R] of cells) foot.set(key(x, z), { x, z, g, R });
const inF = (x, z) => foot.has(key(x, z));
for (const c of foot.values()) {
  let s = 0, n = 0;
  for (let dz = -7; dz <= 7; dz++) for (let dx = -7; dx <= 7; dx++) {
    const o = foot.get(key(c.x + dx, c.z + dz)); if (o) { s += o.R; n++; }
  }
  c.T = Math.max(4, Math.round(s / n / 4) * 4);
}

// Exterior faces: a cell with a neighbour outside the footprint. The bay index runs along the face (x on N/S, z on E/W).
const outDirs = (c) => Object.keys(DIR).filter((d) => !inF(c.x + DIR[d][0], c.z + DIR[d][1]));
const bayOf = (c, d) => (d === "N" || d === "S" ? c.x : c.z);
const alongOf = (d) => (d === "N" || d === "S" ? [1, 0] : [0, 1]);

// Entrance: the lowest street-face bay of three exterior cells in a row with the same outward face.
let entry = null;
for (const c of [...foot.values()].sort((a, b) => a.g - b.g)) {
  for (const d of outDirs(c)) {
    const [ax, az] = alongOf(d);
    const bay = [-1, 0, 1].map((o) => foot.get(key(c.x + ax * o, c.z + az * o)));
    if (bay.some((b) => !b || !outDirs(b).includes(d))) continue;
    entry = { d, bay, ye: Math.max(...bay.map((b) => b.g)) };
    break;
  }
  if (entry) break;
}
const entryKeys = new Set(entry.bay.map((b) => key(b.x, b.z)));

// A plant room (a 9 x 7 box, 3 blocks high, capped) on the highest tier that has room for one: its interior centred on
// that tier's cells, every box cell at that tier and set in from the edge.
const plantSite = () => {
  for (const T of [...new Set([...foot.values()].map((c) => c.T))].sort((a, b) => b - a)) {
    const inner = [...foot.values()].filter((c) => c.T === T && outDirs(c).length === 0);
    if (inner.length < 63) continue;
    const cx = Math.round(inner.reduce((s, c) => s + c.x, 0) / inner.length), cz = Math.round(inner.reduce((s, c) => s + c.z, 0) / inner.length);
    let ok = true;
    for (let z = cz - 3; z <= cz + 3 && ok; z++) for (let x = cx - 4; x <= cx + 4 && ok; x++) {
      const c = foot.get(key(x, z)); ok = !!c && c.T === T && outDirs(c).length === 0;
    }
    if (ok) return { cx, cz, T };
  }
  return null;
};
const plant = plantSite();

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// 1. the body: a plinth of andesite to each cell's ground, then solid concrete up to the tier, the roof deck on top
for (const c of foot.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, FOUND);
  for (let y = c.g; y < c.T; y++) put(c.x, y, c.z, SPAND);
  put(c.x, c.T - 1, c.z, DECK);
}

// 2. the air behind each window (one block in from the face), and a glowstone lamp behind some of them
for (const c of foot.values()) {
  for (const d of outDirs(c)) {
    if (entryKeys.has(key(c.x, c.z))) continue;
    const bay = bayOf(c, d);
    if (bay % 3 === 0) continue;
    const ix = c.x - DIR[d][0], iz = c.z - DIR[d][1];
    if (!inF(ix, iz)) continue;
    for (let y = c.g; y < c.T - 1; y++) {
      const r = y % 4, k = Math.floor(y / 4);
      if (r === 1 || r === 2) put(ix, y, iz, "air");
      if (k >= 1 && r === 1 && (c.x * 7 + c.z + k * 3) % 6 === 0) put(ix, y, iz, LAMP);
    }
  }
}

// 3. the facade: base course, shopfront, storey slabs, glass bays between pillars, spandrels, cornice, parapet
for (const c of foot.values()) {
  const dirs = outDirs(c);
  if (dirs.length === 0) continue;
  const bay = bayOf(c, dirs[0]);
  const pillar = bay % 3 === 0;
  for (let y = c.g; y < c.T; y++) {
    const r = y % 4, k = Math.floor(y / 4);
    let b;
    if (k === 0) b = r === 0 ? BASE : r === 3 ? (pillar ? BASE : SLAB) : pillar ? BASE : SHOP;
    else b = r === 0 ? SLAB : r === 3 ? SPAND : pillar ? SLAB : GLASS;
    if (y === c.T - 1) b = BASE;    // cornice on the roofline
    put(c.x, y, c.z, b);
  }
  put(c.x, c.T, c.z, SLAB);    // parapet over the cornice
}

// 4. the recessed entrance: door bay (two blocks high), a dark porch behind it, a canopy over the porch
const dd = entry.d, ye = entry.ye;
const facing = FACING[dd];
for (const b of entry.bay) {
  const inner = [b.x - DIR[dd][0], b.z - DIR[dd][1]];
  const centre = b === entry.bay[1];
  if (centre) {
    put(b.x, ye, b.z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(b.x, ye + 1, b.z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(inner[0], ye, inner[1], "air");
    put(inner[0], ye + 1, inner[1], "air");
  } else {
    put(b.x, ye, b.z, SHOP); put(b.x, ye + 1, b.z, SHOP);
  }
  put(b.x, ye + 2, b.z, BASE);                // canopy, front block over the door
  put(inner[0], ye + 2, inner[1], BASE);      // canopy, inner block over the porch
}

// 5. the plant room on the tallest tier: a box with a capped roof
if (plant) {
  const { T } = plant;
  for (let z = plant.cz - 3; z <= plant.cz + 3; z++) for (let x = plant.cx - 4; x <= plant.cx + 4; x++) {
    const ring = Math.abs(x - plant.cx) === 4 || Math.abs(z - plant.cz) === 3;
    for (let y = T; y < T + 3; y++) put(x, y, z, ring ? SLAB : "air");
    put(x, T + 3, z, ring ? BASE : DECK);
  }
}

vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907755.nbt");
