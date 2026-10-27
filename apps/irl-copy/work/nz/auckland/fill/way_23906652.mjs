// Legal Research Foundation (OSM way 23906652), Eden Terrace side of the CBD: a 1960s-70s reinforced-concrete office
// block, white spandrels and light-grey piers on a 4-bay grid, blue-tinted glazing, a glazed street floor, and a
// stepped core. The lidar roof, median-smoothed over 3x3 cells, gives three flat tiers: lower wings (top 14), the main
// body (top 18, four storeys of 4 blocks plus a 2-block parapet), and a core (top 21). Every ring wall is solid from its
// plinth to its roof, so nothing floats; interiors are air with a floor slab per storey, and a few glowstone lamps sit
// just inside the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_23906652.cells.json`, "utf8"));
const g = new Voxels([48, 33, 50]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const get = (x, z) => at.get(`${x},${z}`);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 1. Tiers: the lidar roof, median over the 3x3 footprint neighbourhood, snapped to three flat tops.
for (const c of at.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = get(c.x + dx, c.z + dz); if (n) near.push(n.roof); }
  near.sort((a, b) => a - b);
  const sm = near[Math.floor(near.length / 2)];
  c.top = sm >= 19.5 ? 21 : sm >= 16.5 ? 18 : 14;
}

// 2. Exposure: a ring cell has a face to the outside or to a lower tier (a setback wall). Outside faces win the normal.
for (const c of at.values()) {
  c.out = []; c.step = [];
  for (const [dx, dz] of DIRS) {
    const n = get(c.x + dx, c.z + dz);
    if (!n) c.out.push([dx, dz]); else if (n.top < c.top) c.step.push([dx, dz]);
  }
  const ex = [...c.out, ...c.step];
  c.ring = ex.length > 0;
  c.normal = c.out[0] ?? c.step[0] ?? null;
  c.corner = ex.some((d) => d[0] !== 0) && ex.some((d) => d[1] !== 0);
}

// Storey lines: the street floor, then every 4 blocks up to the parapet (top - 2).
const linesOf = (c) => {
  const L = [c.ground];
  for (let y = 4; y < c.top - 2; y += 4) if (y > c.ground) L.push(y);
  return L;
};

// 3. Entrance: a street-level outer face, nearest the middle of the frontage, facing +z where it can.
const entranceCandidates = [...at.values()].filter((c) => c.ring && c.out.length && !c.corner && c.ground <= 1);
const entrance = entranceCandidates
  .map((c) => ({ c, score: Math.abs(c.x - 24) + (c.out[0][1] === 1 ? 0 : 20) }))
  .sort((a, b) => a.score - b.score)[0]?.c ?? null;
const isEntrance = (c) => c === entrance;

// 4. Foundation, storeys, roof, parapet, facade.
const panes = new Map();        // "x,y,z" -> tangent axis, for the pane connections below
const windows = [];             // facade windows, for the lamps
for (const c of at.values()) {
  const { x, z, ground: G0, top: T } = c;
  for (let y = 0; y < G0; y++) put(x, y, z, "stone_bricks");
  const lines = linesOf(c);
  for (let y = G0; y < T; y++) {
    if (y === T - 1) { put(x, y, z, c.ring ? "smooth_stone" : "light_gray_concrete"); continue; }   // coping / roof membrane
    if (y === T - 2) { if (c.ring) put(x, y, z, "white_concrete"); continue; }               // parapet band
    const L = Math.max(...lines.filter((l) => l <= y)), off = y - L;
    if (!c.ring) { if (lines.includes(y)) put(x, y, z, "light_gray_concrete"); continue; }   // interior floor slab
    if (lines.includes(y)) { put(x, y, z, y === G0 ? "polished_andesite" : "smooth_stone"); continue; }   // plinth / string course
    if (off === 3) { put(x, y, z, "white_concrete"); continue; }                              // spandrel
    const tangentX = c.normal[0] === 0;                                                     // wall runs along x
    const t = tangentX ? c.x : c.z;
    if (c.corner || t % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; }         // piers: the frame
    if (L === G0) { put(x, y, z, "light_blue_stained_glass"); windows.push({ x, y, z, c, t, off }); }
    else {
      put(x, y, z, "light_blue_stained_glass_pane");
      panes.set(`${x},${y},${z}`, tangentX ? "x" : "z");
      windows.push({ x, y, z, c, t, off });
    }
  }
}

// 5. Pane connections run along the facade only (tangent neighbours that hold any block).
for (const [k, axis] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const side = axis === "x"
    ? { east: g.get(x + 1, y, z), west: g.get(x - 1, y, z) }
    : { north: g.get(x, y, z - 1), south: g.get(x, y, z + 1) };
  const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const d of Object.keys(side)) s[d] = side[d] ? "true" : "false";
  put(x, y, z, "light_blue_stained_glass_pane", s);
}

// 6. Entrance: iron doors in the street-floor window bay, polished pilasters and a stone lintel.
const doorCells = new Set();
if (entrance) {
  const { x, z, out, ground: G0 } = entrance;
  const [dx, dz] = out[0];
  const facing = dx === 1 ? "west" : dx === -1 ? "east" : dz === 1 ? "north" : "south";  // a door faces back at its outside
  const tx = dx !== 0 ? 0 : 1, tz = dx !== 0 ? 1 : 0;                                         // along the wall
  put(x, G0 + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, G0 + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, G0 + 3, z, "smooth_stone");
  doorCells.add(`${x},${z}`);
  for (const s of [-1, 1]) {
    for (let y = G0 + 1; y <= G0 + 2; y++) put(x + tx * s, y, z + tz * s, "polished_andesite");
    put(x + tx * s, G0 + 3, z + tz * s, "smooth_stone");
  }
}

// 7. Warm light: glowstone just inside every 8th window in the first window row of each storey, where the room is air.
for (const w of windows) {
  if (w.off !== 1 || w.t % 8 !== 2 || isEntrance(w.c)) continue;
  const ix = w.x - w.c.normal[0], iz = w.z - w.c.normal[1];
  const n = get(ix, iz);
  if (!n || (n.top <= w.y) || doorCells.has(`${ix},${iz}`)) continue;
  put(ix, w.y, iz, "glowstone");
}

// 8. Roof plant: a 6 x 4 white box on the main tier, nearest the middle of it, with a light-grey cap.
const mainCells = [...at.values()].filter((c) => !c.ring && c.top === 18);
const cx = mainCells.reduce((s, c) => s + c.x, 0) / mainCells.length, cz = mainCells.reduce((s, c) => s + c.z, 0) / mainCells.length;
let best = null;
for (const c of mainCells) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 6 && ok; dx++) {
    const n = get(c.x + dx, c.z + dz); ok = !!n && !n.ring && n.top === 18;
  }
  if (!ok) continue;
  const d = Math.hypot(c.x + 3 - cx, c.z + 2 - cz);
  if (!best || d < best.d) best = { x: c.x, z: c.z, d };
}
if (best) {
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 6; dx++) {
    const x = best.x + dx, z = best.z + dz;
    put(x, 18, z, dx === 0 || dx === 5 || dz === 0 || dz === 3 ? "stone_bricks" : "white_concrete");
    put(x, 19, z, "white_concrete");
    put(x, 20, z, "light_gray_concrete");
  }
}

const info = g.save(`${HERE}/way_23906652.nbt`);
console.log(JSON.stringify({ footprint: cells.length, tiers: [...at.values()].reduce((m, c) => ((m[c.top] = (m[c.top] || 0) + 1), m), {}), entrance: entrance && [entrance.x, entrance.z], roofPlant: best, ...info }));
