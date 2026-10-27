// Waipārūrū Hall (way 813557415): a 1970s concrete office tower on a stone plinth, with a three-tier setback
// (crown 84, setback 80, lower setback 76) and low podium wings (16, 24, 40). Tinted glass in a concrete frame,
// iron mullions, a lit interior behind some panes, one entrance on the lowest street face, a plant room on the crown.
// Every column stands from its own ground to its tier's top; floors are aligned to each tier's top so tiers line up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_813557415.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 41, Y = 95, Z = 55;
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// lidar roof heights snapped to a few flat tiers (multiples of 4, so floor lines line up across a tier)
function tierOf(R) {
  if (R <= 12) return 8;
  if (R <= 20) return 16;
  if (R <= 30) return 24;
  if (R <= 50) return 40;
  if (R <= 70) return 64;
  if (R <= 78) return 76;
  if (R <= 82) return 80;
  return 84;
}

// per footprint cell: its ground g and its top T (at least 4 blocks above g, on the storey grid)
const C = new Map();
for (const [x, z, g, R] of cells) {
  const minTop = 4 * Math.ceil((g + 4) / 4);
  C.set(`${x},${z}`, { g, T: Math.max(tierOf(R), minTop) });
}
const inF = (x, z) => C.has(`${x},${z}`);
const missing = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([n]) => n);
const perim = new Set([...C.keys()].filter((k) => { const [x, z] = k.split(",").map(Number); return missing(x, z).length > 0; }));

const B = new Map();                                    // "x,y,z" -> { b, s }
const put = (x, y, z, b, s) => B.set(`${x},${y},${z}`, { b, s });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const GLASS = "cyan_stained_glass_pane", MULLION = "iron_block";

// 1. columns: foundation, plate, base course, floor slabs on the top-down grid, sills and glazing, parapet / cap
for (const [k, { g, T }] of C) {
  const [x, z] = k.split(",").map(Number);
  const edge = perim.has(k);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  for (let y = g; y < T; y++) {
    const up = T - y;                                   // rows below the top; slabs at multiples of 4
    let b = null;
    if (y === g) b = edge ? "stone_bricks" : "light_gray_concrete";           // ground plate
    else if (y === T - 1) b = edge ? "white_concrete" : "light_gray_concrete"; // parapet / roof cap
    else if (y === g + 1 && edge) b = "stone_bricks";                          // base course
    else if (up % 4 === 0) b = "light_gray_concrete";                          // floor slab
    else if (edge) b = up % 4 === 3 ? "light_gray_concrete" : ((x + z) % 3 === 0 ? MULLION : GLASS); // sill / glazing
    if (b) put(x, y, z, b);
  }
}

// 2. entrance: the lowest perimeter cell on a tower face, facing out; a lintel above the doors
const outwardOf = (x, z) => missing(x, z)[0];
let entrance = null;
for (const k of perim) {
  const [x, z] = k.split(",").map(Number), { g, T } = C.get(k);
  if (T < 40) continue;
  const m = missing(x, z).length;
  if (!entrance || g < entrance.g || (g === entrance.g && m < entrance.m)) entrance = { x, z, g, m };
}
if (entrance) {
  const { x, z, g } = entrance, facing = outwardOf(x, z);
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  put(x, g + 1, z, "iron_door", { ...door, half: "lower" });
  put(x, g + 2, z, "iron_door", { ...door, half: "upper" });
  put(x, g + 3, z, "light_gray_concrete");
}

// 3. warm light: some glazed rows get a glowstone on the inside of the pane (only into air, never into a slab)
for (const k of perim) {
  const [x, z] = k.split(",").map(Number), { g, T } = C.get(k);
  for (let y = g + 2; y < T - 1; y++) {
    const e = at(x, y, z);
    if (!e || (e.b !== GLASS && e.b !== MULLION)) continue;
    if ((x * 31 + y * 17 + z * 13) % 9 !== 0) continue;
    const [ox, oz] = DIRS[outwardOf(x, z)] ?? [0, 0];
    const ix = x - ox, iz = z - oz;
    if (inF(ix, iz) && !at(ix, y, iz)) put(ix, y, iz, "glowstone");
  }
}

// 4. crown plant room (3x3 on the top tier, near its middle) and a short mast on it
const crown = [...C].filter(([, v]) => v.T === 84).map(([k]) => k.split(",").map(Number));
if (crown.length) {
  const cx = crown.reduce((s, [x]) => s + x, 0) / crown.length, cz = crown.reduce((s, [, z]) => s + z, 0) / crown.length;
  let best = null;
  for (const [x, z] of crown) {
    const ok = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inF(x + dx, z + dz) && C.get(`${x + dx},${z + dz}`).T === 84));
    if (!ok) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
      for (let y = 84; y <= 86; y++) put(best.x + dx, y, best.z + dz, "white_concrete");
    for (let y = 87; y <= 91; y++) put(best.x, y, best.z, "iron_bars");
  }
}

// 5. panes connect to their neighbours in the same facade (glass, mullions, spandrels, bars): vanilla pane states
const SOLID = new Set(["stone_bricks", "light_gray_concrete", "white_concrete", MULLION, GLASS, "iron_bars"]);
const PANE = new Set([GLASS, "iron_bars"]);
const linked = (x, y, z, dx, dz) => {
  const k = `${x + dx},${z + dz}`;
  const e = B.get(`${x + dx},${y},${z + dz}`);
  return e && SOLID.has(e.b) && (perim.has(k) || e.b === "iron_bars") ? "true" : "false";
};
const out = new Voxels([X, Y, Z]);
for (const [k, { b, s }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (PANE.has(b)) {
    out.set(x, y, z, b, { north: linked(x, y, z, 0, -1), south: linked(x, y, z, 0, 1), east: linked(x, y, z, 1, 0), west: linked(x, y, z, -1, 0), waterlogged: "false" });
  } else out.set(x, y, z, b, s);
}
out.save(`${FILL}/way_813557415.nbt`);
console.log(`way_813557415: ${B.size} blocks, ${C.size} cells, ${perim.size} facade cells, entrance ${entrance ? `${entrance.x},${entrance.z} facing ${outwardOf(entrance.x, entrance.z)}` : "none"}`);
