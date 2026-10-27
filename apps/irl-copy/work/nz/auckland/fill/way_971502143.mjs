// Galaxy Tower (way 971502143): a late-1980s office tower on a two-storey shopfront podium, with a spire core on its east end.
// Each footprint cell is a column from y 0 to a storey-rounded tier of the lidar roof (at least a storey above its ground).
// The foundation is solid below each cell's ground; the facade is the exposed faces of the columns: a base course,
// white spandrels, mullions round light-blue glass panes, a dark-oak entrance bay, and glowstone behind some panes.
// Inside there is an air gap and one floor slab per storey; nothing is furnished.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_971502143";
const cells = JSON.parse(readFileSync(`${IN}.cells.json`, "utf8"));
const SX = 38, SY = 99, SZ = 39, STOREY = 4;
const M = {
  fill: "stone", found: "stone_bricks", base: "polished_andesite", spandrel: "white_concrete",
  mullion: "light_gray_concrete", glass: "light_blue_stained_glass_pane", glow: "glowstone",
  slab: "light_gray_concrete", coping: "smooth_stone", roof: "gray_concrete", plant: "light_gray_concrete",
};
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// the lidar roof rounded to whole storeys (a 4-block tier), with the spire's tall cells kept at the crown
const tierTop = (roof) => (roof >= 70 ? 86 : STOREY * Math.round(roof / STOREY));
const col = new Map();
for (const [x, z, g, roof] of cells) col.set(`${x},${z}`, { g, top: Math.max(tierTop(roof), g + STOREY) });
const at = (x, z) => col.get(`${x},${z}`);
// the horizontal faces of cell (x, z) at height y that look on to air: outside the footprint, or above a lower neighbour
const exposed = (x, z, y) => Object.keys(DIRS).filter((f) => { const n = at(x + DIRS[f][0], z + DIRS[f][1]); return !n || n.top <= y; });

// the entrance: the longest run of podium-height (two storey) cells on one outside face; its middle bay is the entrance
function entrance() {
  let best = null;
  for (const f of Object.keys(DIRS)) {
    const ns = f === "north" || f === "south";
    const lines = new Map();
    for (const [k, c] of col) {
      const [x, z] = k.split(",").map(Number);
      if (c.top > 8 || at(x + DIRS[f][0], z + DIRS[f][1])) continue;
      const fixed = ns ? z : x, along = ns ? x : z;
      if (!lines.has(fixed)) lines.set(fixed, []);
      lines.get(fixed).push({ x, z, along });
    }
    for (const list of lines.values()) {
      list.sort((a, b) => a.along - b.along);
      let run = [];
      for (const c of list) {
        if (run.length && c.along !== run[run.length - 1].along + 1) run = [];
        run.push(c);
        if (!best || run.length > best.run.length) best = { face: f, run: run.slice() };
      }
    }
  }
  if (!best) return null;
  const mid = best.run[Math.floor(best.run.length / 2)];
  const bay = new Set(best.run.filter((c) => Math.abs(c.along - mid.along) <= 1).map((c) => `${c.x},${c.z}`));
  return { face: best.face, door: { x: mid.x, z: mid.z }, bay };
}
const ent = entrance();

// the facade block of an exposed cell at height y: [block] or [block, state]
function facade(x, z, y, g, ex, panes) {
  const row = (y - g) % STOREY, lvl = Math.floor((y - g) / STOREY), k = `${x},${z}`;
  const isDoor = ent && ent.door.x === x && ent.door.z === z;
  const inBay = ent && ent.bay.has(k);
  if (isDoor && lvl === 0 && row < 2)
    return ["dark_oak_door", { facing: ent.face, half: row === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (row === 0 && lvl === 0) return [M.base];           // the plinth under the shopfronts
  if (row === 3 || (isDoor && row === 2)) return [M.spandrel];   // one storey line per floor, glazing above it
  if (ex.length > 1) return [M.mullion];                 // corner columns run the full height
  const along = ex[0] === "north" || ex[0] === "south" ? x : z;
  if (!inBay && along % 3 === 0) return [M.mullion];     // a mullion every third cell on the window bays
  panes.push([x, y, z]);
  return [M.glass];
}

const v = new Voxels([SX, SY, SZ]);
const panes = [];
for (const [k, { g, top }] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y < g) { v.set(x, y, z, ex.length ? M.found : M.fill); continue; }
    if (y === top - 1) { v.set(x, y, z, ex.length ? M.coping : M.roof); continue; }
    if (!ex.length) { if ((y - g) % STOREY === 0) v.set(x, y, z, M.slab); continue; }   // interior: slab per storey, air between
    const [b, s] = facade(x, z, y, g, ex, panes);
    v.set(x, y, z, b, s);
  }
}

// the entrance's lobby lamp, standing on the first floor slab just inside the door
if (ent) {
  const inx = -DIRS[ent.face][0], inz = -DIRS[ent.face][1];
  const ix = ent.door.x + inx, iz = ent.door.z + inz, c = at(ix, iz);
  if (c) v.set(ix, c.g + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// warm light: glowstone in the air gap behind some panes (one window in nine)
for (const [x, y, z] of panes) {
  const ex = exposed(x, z, y);
  if (ex.length !== 1 || (x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
  const ix = x - DIRS[ex[0]][0], iz = z - DIRS[ex[0]][1], c = at(ix, iz);
  if (!c || c.top <= y || (y - c.g) % STOREY === 0 || (y - c.g) < 0 || exposed(ix, iz, y).length) continue;
  v.set(ix, y, iz, M.glow);
}

// roof plant: a box on the core's roof around its centre, the top of the roof plant floor is a roof slab
const core = [];
for (const [k, c] of col) { const [x, z] = k.split(",").map(Number); if (c.top >= 56 && exposed(x, z, c.top - 2).length === 0) core.push([x, z, c.top]); }
if (core.length) {
  const cx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length), cz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
  for (const [x, z, top] of core) {
    if (Math.abs(x - cx) > 4 || Math.abs(z - cz) > 4) continue;
    for (let y = top; y < top + 4; y++) v.set(x, y, z, y === top + 3 ? M.roof : M.plant);
  }
}

// the spire's crown: a lightning rod on the first 86-block column
for (const [k, c] of col) if (c.top === 86) { const [x, z] = k.split(",").map(Number); v.set(x, 86, z, "lightning_rod"); break; }

// glass panes connect to the solid frame and to each other, not to air or the glowstone
const id = (b) => `minecraft:${b}`;
const frame = new Set([M.glass, M.spandrel, M.mullion, M.base, M.coping].map(id));
for (const [x, y, z] of panes) {
  const cell = v.get(x, y, z);
  if (!cell || cell.block !== id(M.glass)) continue;
  const on = (dx, dz) => { const n = v.get(x + dx, y, z + dz); return n && frame.has(n.block) ? "true" : "false"; };
  v.set(x, y, z, M.glass, { north: on(0, -1), south: on(0, 1), east: on(1, 0), west: on(-1, 0), waterlogged: "false" });
}

const counts = v.save(`${IN}.nbt`);
console.log(`way_971502143: ${counts.blocks} blocks, ${counts.palette} palette entries, ${panes.length} panes, entrance ${ent?.face}`);
