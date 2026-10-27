// Seaview Apartments: a 1970s-80s concrete apartment block on the slope under Mt Eden. Cream spandrels and
// piers, light-grey storey lines, glass panes in two-bay windows, a dark stone plinth that rises on the uphill
// (north-west) side, a 16-storey core set back on a 4-storey-high podium-like ring, lower wings to the east, and
// roof plant. Heights come from the lidar roof, smoothed into flat tiers on a 4-block storey lattice (floor lines
// at 1 + 4k, so every tier's roof lands on the same grid).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_401588390.cells.json`, "utf8"));
const g = new Voxels([31, 77, 43]);

const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { x, z, ground, roof });
const at = (x, z) => fp.get(key(x, z));
const put = (x, y, z, block, state) => { if (fp.has(key(x, z))) g.set(x, y, z, block, state); };

// lidar outliers (a roof below 50 is a stray low return): the median of the neighbouring roofs
for (const c of fp.values()) if (c.roof < 50) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n && n.roof >= 50) near.push(n.roof); }
  near.sort((a, b) => a - b); c.roof = near[near.length >> 1] ?? 57;
}

// tiers: the 64 m-ish tower zone (lidar >= 61) rises to 65 in its core and steps down to 61 in its outer two cells;
// the main block sits on 57; the eastern wings on 53. Every tier top is a floor line (1 + 4k).
const TOWER = 65, TOWER_RING = 61, MAIN = 57, WING = 53;
const zone = (c) => !!c && c.roof >= 61;
const dist = new Map(), queue = [];
for (const c of fp.values()) if (zone(c) && NB.some(([dx, dz]) => !zone(at(c.x + dx, c.z + dz)))) { dist.set(key(c.x, c.z), 0); queue.push(c); }
for (let q = 0; q < queue.length; q++) {
  const c = queue[q], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB) { const n = at(c.x + dx, c.z + dz); if (zone(n) && !dist.has(key(n.x, n.z))) { dist.set(key(n.x, n.z), d + 1); queue.push(n); } }
}
for (const c of fp.values()) {
  c.tower = zone(c);
  c.top = c.tower ? ((dist.get(key(c.x, c.z)) ?? 0) >= 2 ? TOWER : TOWER_RING) : c.roof >= 56 ? MAIN : WING;
  // the floor lattice: the first floor line at or above the cell's ground (1 + 4k)
  c.base = c.ground <= 1 ? 1 : 1 + 4 * Math.ceil((c.ground - 1) / 4);
}

// the materials: the tower is the grey one, the rest cream
const M = (c) => c.tower
  ? { slab: "gray_concrete", span: "light_gray_concrete", pier: "smooth_stone", cap: "smooth_stone" }
  : { slab: "light_gray_concrete", span: "white_concrete", pier: "smooth_quartz", cap: "smooth_quartz" };
const PLINTH = "stone_bricks";

// the faces a cell shows: "out" to nothing (the footprint's edge), "low" to a lower tier (a roof edge)
const exposure = (c) => {
  const out = [];
  for (const [dx, dz] of NB) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) out.push({ dx, dz, kind: "out" });
    else if (n.top < c.top) out.push({ dx, dz, kind: "low" });
  }
  return out;
};
const pane = (xNormal) => xNormal
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const facing = (dx, dz) => dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";

// 1. plinth: solid from y 0 up to the floor lattice under each cell (the uphill side is the podium)
for (const c of fp.values()) for (let y = 0; y < c.base; y++) put(c.x, y, c.z, PLINTH);

// 2. floor slabs on every line from the base to the roof (footprint-wide: no course hangs over air)
for (const c of fp.values()) for (let L = c.base; L <= c.top; L += 4) put(c.x, L, c.z, M(c).slab);

// 3. the walls: each storey's three rows above its slab, on every ring cell (an edge or a lower-tier face)
const ring = new Map();
for (const c of fp.values()) { const ex = exposure(c); if (ex.length) ring.set(key(c.x, c.z), ex); }
for (const c of fp.values()) {
  const ex = ring.get(key(c.x, c.z)); if (!ex) continue;
  const m = M(c);
  const f = ex.find((e) => e.kind === "out") ?? ex[0];
  const corner = ex.some((e) => e.dx !== 0) && ex.some((e) => e.dz !== 0);
  const along = f.dx !== 0 ? c.z : c.x;
  const pier = corner || along % 3 === 0;           // every third cell is a pier, the rest windows
  for (let L = c.base; L < c.top; L += 4) {
    if (pier) {
      for (let y = L + 1; y <= L + 3; y++) put(c.x, y, c.z, m.pier);
    } else {
      put(c.x, L + 1, c.z, L === c.base ? PLINTH : m.span);   // sill / base course
      for (let y = L + 2; y <= L + 3; y++) put(c.x, y, c.z, "light_blue_stained_glass_pane", pane(f.dx !== 0));
      // a warm light hangs in the room behind some panes (the cell inside, under the next storey's slab)
      const inx = c.x - f.dx, inz = c.z - f.dz, inn = at(inx, inz);
      if (inn && !ring.has(key(inx, inz)) && inn.top >= L + 4 && (c.x + c.z + L) % 5 === 0)
        put(inx, L + 3, inz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
  // the parapet or cap on the roof edge
  if (c.top + 1 < 77) put(c.x, c.top + 1, c.z, m.cap);
}

// 4. the entrance: the largest run of lowest-ground edge cells, its middle three bays: a door, glass sidelights,
// a lintel over them, and a warm light inside
const faces = {};
for (const c of fp.values()) if (c.base === 1) for (const e of ring.get(key(c.x, c.z)) ?? []) if (e.kind === "out") (faces[`${e.dx},${e.dz}`] ??= []).push({ c, e });
const [fk, run] = Object.entries(faces).sort((a, b) => b[1].length - a[1].length)[0];
const [fdx, fdz] = fk.split(",").map(Number);
const edge = run.sort((a, b) => (fdx !== 0 ? a.c.z - b.c.z : a.c.x - b.c.x));
const mid = Math.floor(edge.length / 2);
const bay = edge.slice(mid - 1, mid + 2);
const door = bay[1].c, B = door.base;
bay.forEach(({ c }, i) => {
  if (i === 1) {
    put(c.x, B + 1, c.z, "dark_oak_door", { facing: facing(fdx, fdz), half: "lower", hinge: "left", open: "false", powered: "false" });
    put(c.x, B + 2, c.z, "dark_oak_door", { facing: facing(fdx, fdz), half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(c.x, B + 1, c.z, PLINTH);
    put(c.x, B + 2, c.z, "light_blue_stained_glass_pane", pane(fdx !== 0));
  }
  put(c.x, B + 3, c.z, "smooth_quartz");                                 // the lintel / canopy line
});
const inside = at(door.x - fdx, door.z - fdz);
if (inside && !ring.has(key(inside.x, inside.z))) put(inside.x, B + 3, inside.z, "lantern", { hanging: "true", waterlogged: "false" });

// 5. roof: plant boxes on the main roof, a moss-carpet terrace on the wings, a lift overrun on the tower
for (const c of fp.values()) {
  if (ring.has(key(c.x, c.z))) continue;
  const roofTop = c.top;
  if (c.top === MAIN && c.x % 6 === 2 && c.z % 5 === 2 && NB.every(([dx, dz]) => at(c.x + dx, c.z + dz)?.top === MAIN))
    for (let y = roofTop + 1; y <= roofTop + 2; y++) put(c.x, y, c.z, "gray_concrete");
  if (c.top === WING && (c.x + c.z) % 3 === 0) put(c.x, roofTop + 1, c.z, "moss_carpet");
}
const core = [...fp.values()].filter((c) => c.top === TOWER && (dist.get(key(c.x, c.z)) ?? 0) >= 3);
if (core.length) {
  const cx = Math.round(core.reduce((s, c) => s + c.x, 0) / core.length), cz = Math.round(core.reduce((s, c) => s + c.z, 0) / core.length);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = TOWER + 1; y <= TOWER + 2; y++) put(cx + dx, y, cz + dz, "light_gray_concrete");
}

const out = g.save(`${DIR}/way_401588390.nbt`);
console.log(JSON.stringify({ footprint: fp.size, tiers: { tower: [...fp.values()].filter((c) => c.top === TOWER).length, ring: [...fp.values()].filter((c) => c.top === TOWER_RING).length, main: [...fp.values()].filter((c) => c.top === MAIN).length, wing: [...fp.values()].filter((c) => c.top === WING).length }, entrance: { face: fk, cell: [door.x, door.z] }, ...out }));
