// A 1930s brick commercial block on the Mt Eden side of the CBD ridge: a 3-storey brick body with cream plaster
// bands (string courses at y 4 and 8, a cornice at the roof line), a basalt base course on the basalt foundations, and
// a shopfront with a lintel canopy and a dark-oak door on the south street face. The lidar roof is smoothed into three
// flat tiers (5, 9, 13: one, two and three storeys) so the 13-block core rises over a 9-block podium and 5-block wings.
// The interior is air behind the glass with a floor slab on each storey line; a few windows have glowstone behind them.
// A plant room with an iron unit sits on the core roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_948317508";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 32, Y = 26, Z = 23;
const TIERS = [5, 9, 13];       // roof tops: one, two and three storeys of 4 blocks (parapet on the top row)
const BAND = [4, 8];            // storey lines: string courses on the facade, floor slabs inside

// ---- footprint and smoothed tiers ---------------------------------------------------------------
const cellAt = new Map();
for (const [x, z, gr, ro] of cells) cellAt.set(`${x},${z}`, { x, z, gr, ro });
const at = (x, z) => cellAt.get(`${x},${z}`);
const median = (a) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };

for (const c of cellAt.values()) {
  // the lidar's roof height, median over the cell and its footprint neighbours, then the nearest flat tier
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.ro); }
  const m = median(vals);
  c.T = TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best));
}
// a lone top-tier cell (lidar noise on the edge) drops to the podium
for (const c of cellAt.values()) {
  if (c.T !== TIERS[2]) continue;
  const alone = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < TIERS[2]; });
  if (alone) c.T = TIERS[1];
}

// ---- faces: which sides of a cell are exposed, and from what height -----------------------------
// outside the footprint a face runs down to the ground; against a lower tier it runs down to that tier's roof
const SIDES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = new Map();
for (const c of cellAt.values()) {
  const list = [];
  for (const [d, [dx, dz]] of Object.entries(SIDES)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) list.push({ d, lo: c.gr });
    else if (n.T < c.T) list.push({ d, lo: Math.max(n.T, c.gr) });
  }
  faces.set(`${c.x},${c.z}`, list);
}

// the face a wall block shows: north or south first (its windows run along x), else east or west (along z)
const faceAt = (c, y) => {
  const list = faces.get(`${c.x},${c.z}`).filter((f) => y >= f.lo);
  return list.find((f) => f.d === "S") || list.find((f) => f.d === "N") || list.find((f) => f.d === "E") || list.find((f) => f.d === "W") || null;
};
const isWall = (c, y) => faceAt(c, y) !== null;

// ---- the entrance: the south street face cell nearest x 15 --------------------------------------
const southOut = [...cellAt.values()].filter((c) => faces.get(`${c.x},${c.z}`).some((f) => f.d === "S" && f.lo === c.gr));
const door = southOut.reduce((best, c) => (Math.abs(c.x - 15) < Math.abs(best.x - 15) ? c : best));
const doorKey = `${door.x},${door.z}`;
const canopyKeys = new Set(southOut.filter((c) => Math.abs(c.x - door.x) <= 1 && c.z === door.z).map((c) => `${c.x},${c.z}`));

// ---- placement -----------------------------------------------------------------------------------
const panes = [];   // { x, y, z, along: "x" | "z" } for the glass panes, connected after everything is placed
const solid = (x, y, z) => g.get(x, y, z) !== null;
const g = new Voxels([X, Y, Z]);

for (const c of cellAt.values()) {
  // foundations: solid from y 0 up to the cell's ground
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "polished_basalt");

  for (let y = c.gr; y < c.T; y++) {
    const top = y === c.T - 1;
    const f = isWall(c, y) ? faceAt(c, y) : null;

    if (!f) {
      // inside: air, with a floor slab on each storey line and the roof deck on top
      if (BAND.includes(y) || top) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }

    const u = f.d === "N" || f.d === "S" ? c.x : c.z;     // position along the face
    const pier = u % 3 === 0;
    const inDoor = `${c.x},${c.z}` === doorKey && f.d === "S";

    if (y === c.gr) g.set(c.x, y, c.z, "polished_basalt");                         // base course
    else if (BAND.includes(y) || top) g.set(c.x, y, c.z, "smooth_quartz");          // string courses, cornice
    else if (y < BAND[0]) {                                                          // shopfront, ground floor
      if (inDoor && y <= c.gr + 2) {
        g.set(c.x, y, c.z, "dark_oak_door", { facing: "south", half: y === c.gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (canopyKeys.has(`${c.x},${c.z}`) && y === c.gr + 3 && c.gr + 3 < BAND[0]) {
        g.set(c.x, y, c.z, "polished_blackstone_slab", { type: "bottom", waterlogged: "false" });   // lintel canopy over the door
      } else if (pier) g.set(c.x, y, c.z, "stone_bricks");
      else { g.set(c.x, y, c.z, "glass_pane"); panes.push({ x: c.x, y, z: c.z, f: f.d }); }
    } else {                                                                         // upper storeys
      const row = (y - 1) % 4;                       // rows 0 and 1 of each storey are windows, row 2 the head
      if (row === 0 || row === 1) {
        if (pier) g.set(c.x, y, c.z, "stone_bricks");
        else { g.set(c.x, y, c.z, "glass_pane"); panes.push({ x: c.x, y, z: c.z, f: f.d }); }
      } else g.set(c.x, y, c.z, "bricks");
    }
  }

  // the roof deck on the cells the walls don't cover is set above; a cell's top row that is a wall is a cornice
}

// glowstone lamps: some upper-floor windows have a light in the air gap behind them
for (const p of panes) {
  if (p.y < BAND[0] + 1 || p.y > BAND[1] + 2) continue;
  if ((p.x * 7 + p.z * 13 + p.y * 5) % 9 !== 0) continue;
  const [dx, dz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[p.f];
  const inner = at(p.x + dx, p.z + dz);
  if (!inner || isWall(inner, p.y) || inner.T <= p.y) continue;
  if (g.get(p.x + dx, p.y, p.z + dz) === null) g.set(p.x + dx, p.y, p.z + dz, "glowstone");
}

// the plant room: a box on the roof, on the top tier if a clear 3 x 3 fits there, else a 2 x 2 on the podium
let box = null;
for (const [tier, size] of [[TIERS[2], 3], [TIERS[2], 2], [TIERS[1], 2]]) {
  const cs = [...cellAt.values()].filter((c) => c.T === tier);
  if (!cs.length) continue;
  const cx = cs.reduce((s, c) => s + c.x, 0) / cs.length, cz = cs.reduce((s, c) => s + c.z, 0) / cs.length;
  const lo = Math.floor((size - 1) / 2);
  for (const c of cs) {
    const x0 = c.x - lo, z0 = c.z - lo, sq = [];
    for (let dz = 0; dz < size; dz++) for (let dx = 0; dx < size; dx++) sq.push(at(x0 + dx, z0 + dz));
    if (!sq.every((n) => n && n.T === tier && !isWall(n, tier - 1))) continue;
    const d = Math.hypot(x0 + (size - 1) / 2 - cx, z0 + (size - 1) / 2 - cz);
    if (!box || d < box.d) box = { x0, z0, size, tier, d };
  }
  if (box) break;
}
if (box) {
  const { x0, z0, size, tier } = box, top = tier;
  for (let dz = 0; dz < size; dz++) for (let dx = 0; dx < size; dx++) {
    const x = x0 + dx, z = z0 + dz, edge = dx === 0 || dz === 0 || dx === size - 1 || dz === size - 1;
    if (edge) { g.set(x, top, z, "stone_bricks"); g.set(x, top + 1, z, "stone_bricks"); }
    else { g.set(x, top, z, "iron_block"); g.set(x, top + 1, z, "iron_block"); }   // a two-high unit, so the cap is held up
    g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// glass panes join their neighbours: along the face (x for north and south faces, z for east and west)
for (const p of panes) {
  const along = p.f === "N" || p.f === "S" ? ["east", "west", [1, 0], [-1, 0]] : ["south", "north", [0, 1], [0, -1]];
  const conn = (dx, dz) => (solid(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  const [a, b, da, db] = along;
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  state[a] = conn(...da);
  state[b] = conn(...db);
  g.set(p.x, p.y, p.z, "glass_pane", state);
}

const out = `${DIR}/${NAME}.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ out, ...stats, door: [door.x, door.z], plant: box ? [box.x0, box.z0, box.size, box.tier] : null }));
