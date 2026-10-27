// 205 Queen Street, Auckland CBD (way 157332772): a 1990s glass office tower over a stone-and-concrete podium, about 31
// storeys and 126 blocks (105 m) to the roof on lidar. Lidar roofs are 3x3 median-smoothed, snapped to the 4-block storey
// grid and mode-flattened over 5x5 into clean tiers (podium 8-24, a setback band, the tower 88-124). The podium is light
// concrete on a basalt plinth with a shopfront ground floor; the tower a cyan glass curtain wall on grey mullions and
// spandrels, white floor lines and a cornice, a louvred plant room on the roof, a dark-oak entrance on the lowest street
// face, glowstone behind some panes. Interiors are air with a floor slab per storey; every column is solid to its tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_157332772.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 87, Z = 86, Y = 138;
const at = (x, z) => x * Z + z;
const G = new Int16Array(X * Z).fill(-1), R = new Int16Array(X * Z);   // G = -1 outside the footprint
for (const [x, z, g, r] of cells) { G[at(x, z)] = g; R[at(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[at(x, z)] >= 0;

// clean tiers: 3x3 median of the lidar roof, snapped to a 4-block storey line, then a 5x5 mode so each tier is flat
const around = (x, z, k, f) => { const v = []; for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (inside(x + dx, z + dz)) v.push(f(x + dx, z + dz)); return v; };
const median = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };
const mode = (v) => { const c = new Map(); for (const a of v) c.set(a, (c.get(a) || 0) + 1); let best = v[0], n = -1; for (const [a, k] of c) if (k > n || (k === n && a > best)) { best = a; n = k; } return best; };
const T0 = new Int16Array(X * Z), T = new Int16Array(X * Z);   // T = top of the solid column (exclusive), always a storey line
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inside(x, z))
  T0[at(x, z)] = Math.min(124, Math.max(8, 4 * Math.round(median(around(x, z, 1, (a, b) => R[at(a, b)])) / 4)));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inside(x, z))
  T[at(x, z)] = mode(around(x, z, 2, (a, b) => T0[at(a, b)]));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const solid = (x, z, y) => inside(x, z) && y < T[at(x, z)];
// faces of a cell at height y that look outside the building: off the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !solid(x + dx, z + dz, y)).map(([n]) => n);

// the street face: the lowest ground at the lower storey, on the side with the most such cells; entrance at its middle
const cand = { N: [], S: [], W: [], E: [] };
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inside(x, z) && G[at(x, z)] <= 2) for (const n of exposed(x, z, 5)) cand[n].push([x, z]);
const along = (n, [x, z]) => (n === "N" || n === "S" ? x : z);
const side = Object.keys(cand).sort((a, b) => cand[b].length - cand[a].length)[0];
const street = cand[side].sort((a, b) => along(side, a) - along(side, b));
const mid = street[street.length >> 1];
const entrance = new Set(street.filter((c) => Math.abs(along(side, c) - along(side, mid)) <= 1).map(([x, z]) => at(x, z)));

const P = new Map(), panes = [], wins = [];   // P: "x,y,z" -> { b, s }; panes and wins feed the connection and glow passes
const put = (x, y, z, b, s) => P.set(`${x},${y},${z}`, { b, s });
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const facing = { N: "north", S: "south", W: "west", E: "east" };

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inside(x, z)) continue;
  const g = G[at(x, z)], t = T[at(x, z)], tower = t >= 48;
  const WIN = tower ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
  const FRAME = tower ? "gray_concrete" : "white_concrete";
  const SPAN = tower ? "gray_concrete" : "light_gray_concrete";
  for (let y = 0; y < t; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                 // foundation: solid under every cell
    const ex = exposed(x, z, y);
    if (!ex.length) {                                                       // interior: a slab per storey, a roof deck, air between
      if (y === t - 1 || y % 4 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (t >= 12 && y >= t - 2) { put(x, y, z, "white_concrete"); continue; }   // cornice / parapet
    if (y < 4) { put(x, y, z, "stone_bricks"); continue; }                  // basalt-look plinth course
    const mullion = (ex.includes("N") || ex.includes("S") ? x : z) % 3 === 0;
    if (y < 8) {                                                            // shopfront ground storey
      if (entrance.has(at(x, z)) && ex.includes(side)) {
        const centre = x === mid[0] && z === mid[1];
        if (y === 5 && centre) put(x, y, z, "dark_oak_door", { facing: facing[side], half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === 6 && centre) put(x, y, z, "dark_oak_door", { facing: facing[side], half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (y === 7) put(x, y, z, "polished_andesite");                // canopy board over the door
        else if (y === 4) put(x, y, z, "polished_andesite");
        else { put(x, y, z, "light_blue_stained_glass"); wins.push([x, y, z, side]); }
        continue;
      }
      if (y === 4) put(x, y, z, "polished_andesite");
      else if (y === 7) put(x, y, z, "black_concrete");
      else if (mullion) put(x, y, z, "white_concrete");
      else { put(x, y, z, "light_blue_stained_glass"); wins.push([x, y, z, ex[0]]); }
      continue;
    }
    const ph = y % 4;                                                       // storey rhythm: floor line, glass, spandrel
    if (ph === 0) put(x, y, z, "white_concrete");
    else if (ph === 3) put(x, y, z, SPAN);
    else if (mullion) put(x, y, z, FRAME);
    else {
      put(x, y, z, WIN, null);
      panes.push([x, y, z, ex.includes("N") || ex.includes("S") ? "x" : "z"]);
      wins.push([x, y, z, ex[0]]);
    }
  }
}

// panes join their neighbours along the facade (other panes, mullions, the floor line), as vanilla draws them
for (const [x, y, z, axis] of panes) {
  const has = (dx, dz) => P.has(`${x + dx},${y},${z + dz}`);
  const s = axis === "x"
    ? { north: "false", south: "false", east: String(has(1, 0)), west: String(has(-1, 0)), waterlogged: "false" }
    : { north: String(has(0, -1)), south: String(has(0, 1)), east: "false", west: "false", waterlogged: "false" };
  P.get(`${x},${y},${z}`).s = s;
}

// warm lights: a glowstone in the room behind some windows (the air cell inside the glass, never a slab or wall)
const lit = (x, y, z) => ((x * 7919 + y * 104729 + z * 1299709) % 13) < 3;
for (const [x, y, z, n] of wins) {
  if (!lit(x, y, z)) continue;
  const [dx, dz] = DIR[n], ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || y < G[at(ix, iz)] || y >= T[at(ix, iz)] || exposed(ix, iz, y).length) continue;
  if (y % 4 === 0 || y % 4 === 3 || P.has(`${ix},${y},${iz}`)) continue;
  put(ix, y, iz, "glowstone");
}

// roof plant: a solid plant room on the tallest tier's roof deck, with a cornice cap and a louvred screen on its top row
for (let x = 36; x <= 50; x++) for (let z = 36; z <= 48; z++) {
  if (!inside(x, z) || T[at(x, z)] < 120) continue;
  const t = T[at(x, z)];
  for (let y = t; y < t + 2; y++) put(x, y, z, "light_gray_concrete");
  put(x, t + 2, z, (x + z) % 2 ? "white_concrete" : "gray_concrete");
}

const v = new Voxels([X, Y, Z]);
for (const [k, { b, s }] of P) { const [x, y, z] = k.split(",").map(Number); v.set(x, y, z, b, s); }
const { blocks, palette } = v.save(`${FILL}/way_157332772.nbt`);
console.log(`way_157332772: ${blocks} blocks, ${palette} palette entries; street face ${side}, entrance at ${mid}; tiers ${[...new Set(T)].filter(Boolean).sort((a, b) => a - b).join(",")}`);
