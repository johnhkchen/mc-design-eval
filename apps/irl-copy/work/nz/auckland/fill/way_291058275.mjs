// way 291058275: a mid-century (1960s-70s) concrete-frame office block on the Eden Terrace / Newton edge, five storeys
// over a four-storey podium. White precast piers and grey spandrels frame tinted glazing; a shopfront runs along the
// street floor with doors under a lintel. Storeys are 4 blocks; tiers snap to storey lines (lidar roof 19 -> 20, 16-18 -> 16).
// Walls are one block thick with an air gap behind the glass, and every floor is a slab on the storey line below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_291058275.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [67, 32, 59];
const g = new Voxels(SIZE);
const B = new Map();                                           // "x,y,z" -> block id, for neighbour checks
const at = (x, y, z) => `${x},${y},${z}`;
const place = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= SIZE[0] || y >= SIZE[1] || z >= SIZE[2]) return;
  g.set(x, y, z, block, state); B.set(at(x, y, z), block);
};

const LINES = [4, 8, 12, 16];                                  // storey lines (slab rows), absolute
const isLine = (y) => LINES.includes(y);
// tier top: the lidar roof snapped to a storey line, never less than one storey above the cell's own ground
const tierOf = (gr, r) => Math.max(gr + 4, r >= 19 ? 20 : r >= 16 ? 16 : 4 * Math.round(r / 4));
const C = new Map();
for (const [x, z, gr, r] of cells) C.set(`${x},${z}`, { g: gr, T: tierOf(gr, r) });
const col = (x, z) => C.get(`${x},${z}`);
const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
// a wall is shell if any neighbour is outside, a different tier, or a different ground: those faces get the envelope
const isShell = (x, z) => {
  const c = col(x, z);
  return DIRS.some((d) => { const n = col(x + d.dx, z + d.dz); return !n || n.g !== c.g || n.T !== c.T; });
};
// a face is open to the air at row y when there is no neighbour there, or the neighbour's roof is below y
const openDirs = (x, z, y) => DIRS.filter((d) => { const n = col(x + d.dx, z + d.dz); return !n || y >= n.T; });

// the door candidates: shell cells on a single open face at the street floor, not on a mullion, with an air cell inside
const cand = {};
for (const [k, c] of C) {
  const [x, z] = k.split(",").map(Number);
  if (!isShell(x, z) || ![0, 1, 5].includes(c.g)) continue;
  if (c.g + 2 >= c.T - 1 || isLine(c.g + 1) || isLine(c.g + 2)) continue;
  const open = openDirs(x, z, c.g + 1);
  if (open.length !== 1) continue;
  const d = open[0], u = d.dz !== 0 ? x : z;
  if (u % 3 === 0) continue;
  const inner = col(x - d.dx, z - d.dz);
  if (!inner || isShell(x - d.dx, z - d.dz)) continue;
  (cand[d.name] ??= []).push({ x, z, d, u });
}
const doors = Object.values(cand).sort((a, b) => b.length - a.length).slice(0, 2)
  .map((list) => { list.sort((a, b) => a.u - b.u); return list[Math.floor(list.length / 2)]; });
const panes = [];                                              // glazed wall cells, for their connection states
for (const [k, c] of C) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) place(x, y, z, "stone_bricks");                       // foundation up to the ground
  if (!isShell(x, z)) {                                        // hollow room: floor, storey slabs, roof deck; air between
    place(x, c.g, z, "smooth_stone");
    for (const L of LINES) if (L > c.g && L < c.T - 1) place(x, L, z, "smooth_stone");
    place(x, c.T - 1, z, "light_gray_concrete");
    continue;
  }
  place(x, c.g, z, "polished_andesite");                       // base course
  for (let y = c.g + 1; y < c.T - 1; y++) {
    if (isLine(y)) { place(x, y, z, "smooth_stone"); continue; }    // string course on each storey line
    const s = Math.max(c.g, ...LINES.filter((L) => L < y));
    const ground = s === c.g;
    if (y - s === 3) { place(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    const open = openDirs(x, z, y);
    const d = open.length === 1 ? open[0] : null;
    const inner = d && col(x - d.dx, z - d.dz);
    const u = d ? (d.dz !== 0 ? x : z) : 0;
    if (!d || !inner || isShell(x - d.dx, z - d.dz) || u % 3 === 0) {          // corner, closed face or mullion: pier
      place(x, y, z, ground ? "gray_concrete" : "white_concrete");
      continue;
    }
    place(x, y, z, (x + y + z) % 7 === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane");
    panes.push({ x, y, z, d });
    if (y - s === 1 && (x + z + y) % 5 === 0)                  // warm lantern on the floor behind the glass
      place(x - d.dx, y, z - d.dz, "lantern", { hanging: "false" });
  }
  place(x, c.T - 1, z, "white_concrete");                       // parapet cap
  place(x, c.T, z, "smooth_stone_slab", { type: "bottom" });    // cornice
}

// entrances: the door pair on the street floor, a lintel slab over it, and a lantern just inside
for (const m of doors) {
  const { x, z, d } = m, c = col(x, z);
  place(x, c.g + 1, z, "dark_oak_door", { facing: d.dz !== 0 ? "north" : "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  place(x, c.g + 2, z, "dark_oak_door", { facing: d.dz !== 0 ? "north" : "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  const along = d.dz !== 0 ? [1, 0] : [0, 1];
  for (let t = -1; t <= 1; t++) {
    const ax = x + t * along[0], az = z + t * along[1];
    if (col(ax, az) && isShell(ax, az)) place(ax, c.g + 3, az, "smooth_stone_slab", { type: "top" });
  }
  place(x - d.dx, c.g + 1, z - d.dz, "lantern", { hanging: "false" });
}

// glass panes connect to their in-plane neighbours only (the air side and the street side stay open)
for (const p of panes) {
  const block = B.get(at(p.x, p.y, p.z));
  if (!block?.includes("glass_pane")) continue;                 // a door took this cell
  const st = p.d.dz !== 0
    ? { north: "false", south: "false", east: String(B.has(at(p.x + 1, p.y, p.z))), west: String(B.has(at(p.x - 1, p.y, p.z))) }
    : { north: String(B.has(at(p.x, p.y, p.z - 1))), south: String(B.has(at(p.x, p.y, p.z + 1))), east: "false", west: "false" };
  place(p.x, p.y, p.z, block, st);
}

// roof plant: a box on the top tier's roof, inset from the envelope
const top = [...C].filter(([k, c]) => c.T === 20 && !isShell(...k.split(",").map(Number))).map(([k]) => k.split(",").map(Number));
if (top.length) {
  const mx = top.reduce((a, [x]) => a + x, 0) / top.length, mz = top.reduce((a, [, z]) => a + z, 0) / top.length;
  const ok = new Set(top.map(([x, z]) => `${x},${z}`));
  const boxes = [[7, 5], [5, 5], [5, 3]];
  const origin = top.slice().sort((a, b) => Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz));
  let done = false;
  for (const [w, h] of boxes) {
    for (const [cx, cz] of origin) {
      const x0 = cx - Math.floor(w / 2), z0 = cz - Math.floor(h / 2);
      let fits = true;
      for (let x = x0; x < x0 + w && fits; x++) for (let z = z0; z < z0 + h && fits; z++) if (!ok.has(`${x},${z}`)) fits = false;
      if (!fits) continue;
      for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + h; z++) {
        place(x, 20, z, "light_gray_concrete"); place(x, 21, z, "light_gray_concrete");
        place(x, 22, z, "smooth_stone_slab", { type: "bottom" });
      }
      done = true; break;
    }
    if (done) break;
  }
}

const out = `${DIR}/way_291058275.nbt`;
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
