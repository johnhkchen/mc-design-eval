// way 332241974: an inter-war brick-and-stone commercial block, three storeys over a stone plinth, with stepped
// lower wings to the north and east. Lidar roof heights are smoothed (3x3 median) and snapped to three flat tiers
// (decks at y 5, 9, 13 so the roofs sit at 6, 10, 14). Each storey is 4 blocks: a stone string course, a stone sill,
// two rows of glass in every window bay and a brick pier between bays. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241974.cells.json`, "utf8"));

const W = 49, D = 60, H = 26;
const SLABS = [1, 5, 9];                       // storey string-course rows (floor slabs), each 4 blocks apart
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

// --- footprint and roof tiers ---------------------------------------------------------------------------------------
const FOOT = new Map();
for (const [x, z, g, r] of cells) FOOT.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => FOOT.get(`${x},${z}`);

// lidar roof -> 3x3 median over footprint cells -> one of three flat tiers
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = at(x + dx, z + dz); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (s) => (s >= 11.5 ? 14 : s >= 8 ? 10 : 6);
for (const c of FOOT.values()) c.top = tier(median(c.x, c.z));

// exposed faces: a missing neighbour (street side, all rows) or a lower tier (setback, rows above its roof)
for (const c of FOOT.values()) {
  c.ex = DIRS.flatMap(([dx, dz, name]) => {
    const n = at(c.x + dx, c.z + dz);
    if (!n) return [{ dx, dz, name, from: c.g, missing: true }];
    if (n.top < c.top) return [{ dx, dz, name, from: Math.max(c.g, n.top), missing: false }];
    return [];
  });
  c.ring = c.ex.length > 0;
}

// window bays count along each facade from its first wall cell, so the rhythm starts square at the corner
const minCoord = {};
for (const c of FOOT.values()) for (const e of c.ex) {
  const k = `${e.name}`, v = e.dz !== 0 ? c.x : c.z;
  minCoord[k] = Math.min(minCoord[k] ?? Infinity, v);
}

// the entrance: the street face (most missing-neighbour wall cells), door in its middle
const streetCount = {};
for (const c of FOOT.values()) for (const e of c.ex) if (e.missing && c.ex.length === 1) streetCount[e.name] = (streetCount[e.name] ?? 0) + 1;
const doorDir = Object.entries(streetCount).sort((a, b) => b[1] - a[1])[0][0];
const doorCells = [...FOOT.values()].filter((c) => c.ex.length === 1 && c.ex[0].name === doorDir && c.ex[0].missing)
  .sort((a, b) => (a.ex[0].dz !== 0 ? a.x - b.x : a.z - b.z));
const doorC = doorCells[doorCells.length >> 1];
// canopy slab over the door and its two neighbours along the street face
const canopyCells = [];
for (const k of [-1, 0, 1]) {
  const c = doorC.ex[0].dz !== 0 ? at(doorC.x + k, doorC.z) : at(doorC.x, doorC.z + k);
  if (c && c.ring && c.ex.some((q) => q.name === doorDir)) canopyCells.push(c);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) g.set(x, y, z, block, state); };
// glass panes connect along the face they sit in
const paneState = (e) => (e.dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// --- the massing ---------------------------------------------------------------------------------------------------
for (const c of FOOT.values()) {
  const { x, z, g: G, top: R } = c;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  for (let y = G; y < R; y++) {
    if (!c.ring) {
      // interior: floor slab per storey, roof deck on top, air between
      if (y === R - 1 || (SLABS.includes(y) && y < R - 1)) put(x, y, z, "stone");
      continue;
    }
    // exterior wall column (one block thick)
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; }                   // cornice band
    if (SLABS.includes(y)) { put(x, y, z, "smooth_stone"); continue; }             // string course
    const S = SLABS.filter((s) => s < y).pop();                                    // storey slab below
    const rel = S === undefined ? 0 : y - S;                                       // 1 sill, 2-3 glass, 0 none
    const e = c.ex.length === 1 ? c.ex[0] : null;
    const pier = c.ex.length >= 2 || (e && ((e.dz !== 0 ? x : z) - minCoord[e.name]) % 3 === 0);
    if (e && y >= e.from && y < R - 1 && rel >= 1 && rel <= 3) {
      if (rel === 1) { put(x, y, z, S === 1 ? "stone_bricks" : "smooth_stone"); continue; }  // sill / ground bulkhead
      if (!pier) { put(x, y, z, "glass_pane", paneState(e)); continue; }
    }
    put(x, y, z, "bricks");
  }

  // parapet on the roof edge of every exposed wall
  if (c.ring) put(x, R, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// the entrance: a door on the street face, with a canopy slab over it and its neighbours
{
  const c = doorC;
  put(c.x, c.g, c.z, "dark_oak_door", { facing: doorDir, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 1, c.z, "dark_oak_door", { facing: doorDir, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const k of canopyCells) put(k.x, c.g + 2, k.z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// --- warm light: glowstone on the floor behind some shopfront and upper windows, lanterns under some ceilings -------
for (const c of FOOT.values()) {
  if (!c.ring) continue;
  for (const e of c.ex) {
    for (let y = c.g; y < c.top - 1; y++) {
      const S = SLABS.filter((s) => s < y).pop();
      if (S === undefined) continue;
      const rel = y - S;
      if (rel < 2 || rel > 3 || c.ex.length !== 1 || y < e.from) continue;
      const pier = (e.dz !== 0 ? c.x : c.z) - minCoord[e.name];
      if (pier % 3 === 0 || (doorC && c === doorC)) continue;
      const ix = c.x - e.dx, iz = c.z - e.dz, ic = at(ix, iz);
      if (!ic || ic.ring) continue;
      const h = (c.x * 13 + c.z * 7 + y * 3) % 7;
      if (rel === 2 && h === 0 && S + 1 < ic.top - 1 && S + 1 >= ic.g) put(ix, S + 1, iz, "glowstone");
      if (rel === 3 && h === 4 && S + 3 < ic.top - 1 && S + 3 >= ic.g) put(ix, S + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// --- roof: a stone lift overrun on the top tier, and AC plant on the lower roofs -------------------------------------
{
  const cx = W / 2, cz = D / 2;
  const top14 = [...FOOT.values()].filter((c) => c.top === 14 && !c.ring);
  const ok = (x, z) => { const c = at(x, z); return c && c.top === 14 && !c.ring; };
  let best = null;
  for (const c of top14) {
    if (!(ok(c.x + 1, c.z) && ok(c.x, c.z + 1) && ok(c.x + 1, c.z + 1))) continue;
    const d = Math.hypot(c.x + 0.5 - cx, c.z + 0.5 - cz);
    if (!best || d < best.d) best = { x: c.x, z: c.z, d };
  }
  if (best) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(best.x + dx, 14, best.z + dz, "stone_bricks");
    put(best.x + dx, 15, best.z + dz, "stone_bricks");
    put(best.x + dx, 16, best.z + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const c of FOOT.values()) {
    if (c.ring || (c.top !== 10 && c.top !== 6)) continue;
    if ((c.x * 5 + c.z * 3) % 41 === 0 && c.x % 4 === 0) put(c.x, c.top, c.z, "iron_block");
  }
}

const stats = g.save(`${DIR}/way_332241974.nbt`);
console.log(JSON.stringify({ cells: cells.length, door: doorDir, ...stats }));
