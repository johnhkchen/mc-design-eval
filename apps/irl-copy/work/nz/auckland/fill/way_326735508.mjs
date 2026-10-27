// Way 326735508, Eden Terrace frontage below Maungawhau: a 1920s red-brick commercial block, two storeys with a
// third on the high (east) side. Solid massing from each cell's ground to its smoothed roof, so every block has
// something under it; a quartz plinth-band-cornice-parapet set, a timber shopfront with a central door and lantern on
// the north (z-) face, three-cell glazed bays with an air gap behind the glass (warm light in some), quoins at the
// corners, and two roof plant boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735508.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735508.nbt";

const g = new Voxels([20, 27, 15]);
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

// the footprint: ground (g), lidar roof (r) above y 0, and a top smoothed over the 3x3 neighbourhood into flat tiers
const F = new Map();
for (const [x, z, ground, roof] of JSON.parse(readFileSync(CELLS, "utf8"))) F.set(key(x, z), { x, z, g: ground, r: roof });
const inF = (x, z) => F.has(key(x, z));
for (const c of F.values()) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const o = F.get(key(c.x + dx, c.z + dz)); if (o) { s += o.r; n++; } }
  c.top = Math.max(c.g + 6, Math.round(s / n));
}
const top = (x, z) => F.get(key(x, z))?.top ?? 0;
const exposed = (c) => Object.keys(DIRS).filter((d) => !inF(c.x + DIRS[d][0], c.z + DIRS[d][1]));
const perimeter = (c) => exposed(c).length > 0;

// Glazed bays along each exterior face: runs of consecutive cells; the corners and every fourth cell are piers,
// the rest are glass (a bay is a run of glass between brick piers; short stepped runs stay glazed).
const role = new Map();   // "x,z|d" -> { pier }
for (const d of Object.keys(DIRS)) {
  const ns = d === "n" || d === "s";
  const along = (c) => (ns ? c.x : c.z), line = (c) => (ns ? c.z : c.x);
  const lines = new Map();
  for (const c of F.values()) if (exposed(c).includes(d)) { const k = line(c); if (!lines.has(k)) lines.set(k, []); lines.get(k).push(c); }
  for (const cs of lines.values()) {
    cs.sort((a, b) => along(a) - along(b));
    let seg = [];
    const flush = () => { seg.forEach((c, j) => role.set(`${key(c.x, c.z)}|${d}`, { pier: exposed(c).length > 1 || (j > 0 && j % 4 === 0) })); seg = []; };
    for (const c of cs) { if (seg.length && along(c) !== along(seg[seg.length - 1]) + 1) flush(); seg.push(c); }
    flush();
  }
}

// The front (north) door: the middle of the north face, by x.
const front = [...F.values()].filter((c) => exposed(c).includes("n")).sort((a, b) => a.x - b.x);
const door = front[Math.floor(front.length / 2)];

// Overrides by block: a block set, or null for air (the gap behind the glass). Walls first, then the openings.
const over = new Map();
const panes = new Set();
const sol = (x, z, y) => inF(x, z) && y < top(x, z);   // every cell is solid up to its top: a pocket's sides and back

for (const c of F.values()) {
  const ex = exposed(c);
  if (!ex.length) continue;
  for (const d of ex) {
    const [dx, dz] = DIRS[d];
    const rl = role.get(`${key(c.x, c.z)}|${d}`);
    if (!rl) continue;
    if (d === "n" && c.x === door.x && c.z === door.z) continue;   // the door cell
    if (d === "n") {                                                 // shopfront: timber frames on the glass piers
      if (rl.pier) for (const y of [c.g + 1, c.g + 2]) over.set(k3(c.x, y, c.z), ["dark_oak_planks", null]);
    }
    if (rl.pier) continue;
    const p = { x: c.x - dx, z: c.z - dz };                          // the cell behind the glass: the air gap
    const tan = d === "n" || d === "s" ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    for (let s = 0; s < 3; s++) {
      const base = c.g + 4 * s;                                       // storey s: belt at base, glass base+1..2, lintel base+3
      const yl = base + 3;
      if (yl > c.top - 3) break;
      const backed = inF(p.x, p.z) && !perimeter(p) && top(p.x, p.z) > yl && tan.every(([tx, tz]) => sol(p.x + tx, p.z + tz, yl)) && sol(p.x - dx, p.z - dz, yl);
      if (!backed) continue;
      const lit = (c.x * 7 + c.z * 11 + s * 3 + (d === "n" ? 1 : 0)) % 5 < 2;
      for (const y of [base + 1, base + 2]) {
        over.set(k3(c.x, y, c.z), ["glass_pane", null]);
        panes.add(k3(c.x, y, c.z));
        over.set(k3(p.x, y, p.z), null);                              // air behind the glass
      }
      if (lit) over.set(k3(p.x, base + 1, p.z), [((c.x + c.z + s) % 5 === 0) ? "shroomlight" : "glowstone", null]);
    }
  }
}
// Panes on the same wall connect to each other, so a bay reads as one run of glass.
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const pane = (xx, zz) => panes.has(k3(xx, y, zz));
  const st = (on) => ({ north: on(0, -1) ? "true" : "false", south: on(0, 1) ? "true" : "false", east: on(1, 0) ? "true" : "false", west: on(-1, 0) ? "true" : "false", waterlogged: "false" });
  over.set(k, ["glass_pane", st((dx, dz) => pane(x + dx, z + dz))]);
}

// The door on the north face: a two-high dark oak door, a lantern hanging under the belt above it.
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
over.set(k3(door.x, door.g + 1, door.z), ["dark_oak_door", doorState("lower")]);
over.set(k3(door.x, door.g + 2, door.z), ["dark_oak_door", doorState("upper")]);
over.set(k3(door.x, door.g + 3, door.z), ["lantern", { hanging: "true", waterlogged: "false" }]);

// Walls, by cell and height
const wall = (c, y) => {
  const ex = exposed(c), per = ex.length > 0, r = y - c.g;
  if (y < c.g) return ["stone_bricks", null];                       // foundation: solid from y 0 up to the ground
  if (y === c.top - 1) return per ? ["smooth_quartz", null] : ["deepslate_tiles", null];   // parapet / roof
  if (per && y === c.top - 2) return ["smooth_quartz", null];       // cornice
  if (!per) return ["bricks", null];
  if (ex.length >= 2) return ["smooth_quartz", null];               // quoins at the corners
  if (r === 0) return ["polished_andesite", null];                  // base course
  if (r % 4 === 0) return ["smooth_quartz", null];                  // storey belt course
  return ["bricks", null];
};

for (const c of F.values()) {
  for (let y = 0; y < c.top; y++) {
    const k = k3(c.x, y, c.z);
    const o = over.has(k) ? over.get(k) : wall(c, y);
    if (o === null) continue;                                         // air behind the glass
    const [b, st] = o;
    g.set(c.x, y, c.z, b, st ?? undefined);
  }
}

// Roof plant: two 2x2 boxes on the tallest interior roof, standing on the roof row
const boxes = [];
for (const c of F.values()) {
  const cells = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (!cells.every(([x, z]) => inF(x, z) && top(x, z) === c.top && !perimeter(F.get(key(x, z))))) continue;
  if (boxes.some((b) => Math.abs(b.x - c.x) < 3 && Math.abs(b.z - c.z) < 3)) continue;
  boxes.push({ x: c.x, z: c.z, t: c.top });
}
boxes.sort((a, b) => b.t - a.t);
for (const b of boxes.slice(0, 2)) for (const dz of [0, 1]) for (const dx of [0, 1]) for (let y = b.t; y < b.t + 2; y++) g.set(b.x + dx, y, b.z + dz, "smooth_stone");

const stats = g.save(OUT);
console.log(`way_326735508: ${stats.blocks} blocks, ${stats.palette} palette entries, ${boxes.slice(0, 2).length} roof boxes`);
