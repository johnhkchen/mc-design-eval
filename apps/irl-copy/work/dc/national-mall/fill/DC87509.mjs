// DC87509: 201 1st St NE, Washington DC 20002 (Commercial-Office-Large), as a 1.21.1 module.
// A 1970s-80s precast-and-glass office block on the Capitol Hill edge: a granite base, a 2-block storey
// rhythm of ribbon glazing with smooth-quartz piers and spandrels, and a light-coloured cornice and parapet.
// The lidar roof is followed in blocks: the 3x3 median of each footprint cell's roof, snapped to the even
// storey lines (an 18-block roof is nine storeys of 2 blocks, about 4.8 m each at 0.42 blocks per metre). The
// footprint's ground is 0 on the street (north) frontage and 1-2 behind it, so every column is solid from y 0
// up to its ground (a granite foundation on the skin), and the walls carry the extra storeys on the low side.
// Skin = outer cell of the footprint; gap = the cell behind it (air behind every window, solid behind piers and
// at each floor and head line); core = the rest, solid. Roof = gray concrete top; plant boxes stand on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87509.cells.json`, "utf8"));
const OUT = `${DIR}/DC87509.nbt`;

const X = 62, Z = 59, H = 20;             // footprint 62 x 59; 18-block roof, parapet, plant boxes to y 19
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const DOOR_X = 18;                        // the street (north, z 0) frontage is ground 0; its middle bay

const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const inF = (x, z) => F.has(`${x},${z}`);
const at = (x, z) => F.get(`${x},${z}`);

// Smoothed roof: 5x5 median of the footprint's lidar roof (clean tiers, no pits), then snapped to even storey lines (2-block storeys).
for (const c of F.values()) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  const med = vals[vals.length >> 1];
  c.T = Math.min(18, Math.max(c.g + 2, 2 * Math.round(med / 2)));   // roof top (the parapet sits on it)
  c.ext = DIRS.filter(([dx, dz]) => !inF(c.x + dx, c.z + dz));       // exterior faces
  c.corner = c.ext.length >= 2;
}

// Depth from the outside: 1 = skin, 2 = the gap behind it, 3+ = core.
const queue = [];
for (const c of F.values()) if (c.ext.length) { c.d = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && n.d === undefined) { n.d = c.d + 1; queue.push(n); } }
}

const entrance = [...F.values()].find((c) => c.d === 1 && c.z === 0 && c.x === DOOR_X);
const isPier = (c) => {
  if (c.corner) return true;
  const [dx] = c.ext[0];
  const s = dx !== 0 ? c.z : c.x;                   // along-face coordinate
  return s % 3 === 0;                               // 1 pier, 2 glass per 3-block bay
};
const isEntrance = (c) => c === entrance;
const isPane = (c, y) => c.d === 1 && y % 2 === 1 && y >= c.g && y < c.T && !isPier(c) && !isEntrance(c);
const gapAir = (c, y) => {
  if (c.d !== 2 || y % 2 === 0 || y <= c.g || y >= c.T - 1) return false;
  return DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.d === 1 && isPane(n, y); });
};

const g = new Voxels([X, H, Z]);
const panes = new Set();
const key = (x, y, z) => `${x},${y},${z}`;

for (const c of F.values()) {
  const { x, z, g: gr, T } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, c.d === 1 ? "polished_granite" : "stone");
  for (let y = gr; y < T; y++) {
    if (c.d === 1) {
      if (isEntrance(c) && (y === gr || y === gr + 1)) {
        g.set(x, y, z, "iron_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr && gr % 2 === 0) g.set(x, y, z, "polished_granite");           // base course on even grounds
      else if (y % 2 === 0 || c.corner || isPier(c)) g.set(x, y, z, "smooth_quartz");   // spandrel rows and piers
      else { g.set(x, y, z, "light_blue_stained_glass_pane"); panes.add(key(x, y, z)); }
    } else if (c.d === 2 && gapAir(c, y)) {
      continue;                                                                           // air behind the glass
    } else if (y === T - 1 && c.d >= 2) {
      g.set(x, y, z, "smooth_stone");                                                     // roof membrane
    } else {
      g.set(x, y, z, "stone");
    }
  }
  if (c.d === 1) g.set(x, T, z, "smooth_quartz");                                         // cornice and parapet
}

// Pane connections: a pane joins its along-face neighbours when they are skin (pane, pier or spandrel-free solid).
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const props = { north: "false", south: "false", east: "false", west: "false" };
  for (const [dx, dz, name] of DIRS) {
    const n = at(x + dx, z + dz);
    if (n && n.d === 1 && y >= n.g && y < n.T) props[name] = "true";
  }
  g.set(x, y, z, "light_blue_stained_glass_pane", props);
}

// Warm light: lanterns standing in some gap cells behind windows, glowstone behind the shopfront glass.
for (const c of F.values()) {
  if (c.d !== 2) continue;
  for (let y = c.g + 1; y < c.T - 1; y += 2) {
    if (!gapAir(c, y)) continue;
    const h = (c.x * 7 + y * 3 + c.z * 5) % 9;
    if (y < 4 && h < 3) g.set(c.x, y, c.z, "glowstone");
    else if (y >= 4 && h === 0) g.set(c.x, y, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Plant on the roof of the tallest tier: small mechanical boxes with a light-concrete top, standing on the roof membrane.
for (const c of F.values()) {
  if (c.T < 18 || c.d < 3) continue;
  if (c.x % 6 === 3 && c.z % 6 === 3) { g.set(c.x, 18, c.z, "light_gray_concrete"); g.set(c.x, 19, c.z, "smooth_quartz_slab"); }
}

const stats = g.save(OUT);
const T = [...F.values()].map((c) => c.T);
const hist = {};
for (const t of T) hist[t] = (hist[t] || 0) + 1;
console.log("cells", F.size, "roof tiers", JSON.stringify(hist), "panes", panes.size, "saved", stats);
