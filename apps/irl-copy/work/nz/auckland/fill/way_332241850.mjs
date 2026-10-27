// Auckland, Mt Eden side: a two-storey 1930s brick shop-top block (red brick, cream plaster string course and cornice,
// polished andesite base course on a stone-brick foundation), a one-storey wing on the uphill NE side, a plant box on the
// roof. Lidar roof heights are snapped to two flat tiers (8 = two storeys, 6 = the wing); a door with a canopy sits on the
// NW face, and a few upper windows are lit from behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_332241850.cells.json`, "utf8"));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces back toward the outside it opens onto
const key = (x, y, z) => `${x},${y},${z}`;

// the footprint: { x, z, g (ground), r (lidar roof), T (snapped tier) }
const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r, T: 0 }]));
const raw = (x, z) => F.get(`${x},${z}`);
for (const c of F.values()) {
  if (c.r !== 7) { c.T = c.r >= 8 ? 8 : 6; continue; }
  const nb = Object.values(DIRS).map(([dx, dz]) => raw(c.x + dx, c.z + dz)).filter(Boolean);
  c.T = nb.filter((n) => n.r >= 8).length > nb.filter((n) => n.r <= 6).length ? 8 : 6;
}
// a face is exposed where the neighbour is outside the footprint or sits in a lower tier (a setback's side wall)
for (const c of F.values()) {
  c.exp = Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = raw(c.x + dx, c.z + dz); return !n || n.T < c.T; }).map(([d]) => d);
  c.shell = c.exp.length > 0;
  c.face = c.exp[0];
}
const at = (x, z) => F.get(`${x},${z}`);
const along = (d, c) => (d === "N" || d === "S" ? c.x : c.z);    // the coordinate that runs along a face
const bay = (u) => ((u % 4) + 4) % 4;                              // four-column bays: pier, glass, glass (, glass) per bay

// a glass cell on the face d of shell cell c at row y: the ground storey is a shopfront (glass in every bay but the pier),
// the upper storey and the wing take the middle two columns of each bay
const isGlass = (c, d, y) => {
  const p = bay(along(d, c));
  if (c.T === 8) return y > c.g && y <= 3 ? p !== 0 : (y === 5 || y === 6) && (p === 1 || p === 2);
  return (y === 3 || y === 4) && (p === 1 || p === 2);
};
const glassRows = (c) => (c.T === 8 ? [...Array(3 - c.g).keys()].map((i) => c.g + 1 + i).concat([5, 6]) : [3, 4]);

// the door: the NW face cell nearest z = 5 that sits on a storey-one row (ground 0 or 1), with the canopy over it
const doorCell = [...F.values()]
  .filter((c) => c.shell && c.T === 8 && c.g <= 1 && c.exp.includes("W"))
  .sort((a, b) => Math.abs(a.z - 5) - Math.abs(b.z - 5))[0];
const doorRows = doorCell ? [doorCell.g + 1, doorCell.g + 2] : [];
const canopy = doorCell ? [...F.values()].filter((c) => c.shell && c.T === 8 && c.exp.includes("W") && Math.abs(c.z - doorCell.z) <= 1) : [];

// the air gap behind each glass cell: the interior cell inward of a window, same tier, not a shell cell. Door gaps too.
const gaps = new Map();   // key -> true (air) ; value true for lit cells
const gapOf = (c, d, y) => {
  const [dx, dz] = DIRS[d]; const n = at(c.x - dx, c.z - dz);
  return n && !n.shell && n.T === c.T && y < n.T - 1 ? key(n.x, y, n.z) : null;
};
for (const c of F.values()) {
  if (!c.shell || !c.face) continue;
  for (const y of glassRows(c)) if (isGlass(c, c.face, y)) { const k = gapOf(c, c.face, y); if (k) gaps.set(k, false); }
}
if (doorCell) for (const y of doorRows) { const k = gapOf(doorCell, doorCell.face ?? "W", y); if (k) gaps.set(k, false); }

// warm light: glowstone in the gap behind some upper windows (row 5) and some shopfronts (the lowest ground row)
for (const c of F.values()) {
  if (!c.shell || !c.face || c.T !== 8) continue;
  const row = (c.x + 2 * c.z) % 3 === 0 ? 5 : (c.x + c.z) % 4 === 0 ? c.g + 1 : null;
  if (row === null || !isGlass(c, c.face, row)) continue;
  const k = gapOf(c, c.face, row); if (k && gaps.has(k)) gaps.set(k, true);
}

// the plant box on the main roof: a 3x3 of interior cells, nearest the main tier's middle
const mains = [...F.values()].filter((c) => c.T === 8);
const mx = mains.reduce((s, c) => s + c.x, 0) / mains.length, mz = mains.reduce((s, c) => s + c.z, 0) / mains.length;
const interiorMain = (x, z) => { const c = at(x, z); return c && c.T === 8 && !c.shell; };
let plant = null;
for (const c of mains) {
  const ok = [...Array(9).keys()].every((i) => interiorMain(c.x + (i % 3), c.z + Math.floor(i / 3)));
  if (!ok) continue;
  const d = Math.hypot(c.x + 1 - mx, c.z + 1 - mz);
  if (!plant || d < plant.d) plant = { x0: c.x, z0: c.z, d };
}

// the plan: block per cell, so glass connections can read the neighbours
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const glass = new Set();

for (const c of F.values()) {
  for (let y = 0; y < c.T; y++) {
    const k = key(c.x, y, c.z);
    if (y < c.g) { put(c.x, y, c.z, "stone_bricks"); continue; }          // foundation up to the lidar ground
    if (!c.shell) {                                                       // interior: solid mass, air where a window looks in
      if (gaps.has(k)) { if (gaps.get(k)) put(c.x, y, c.z, "glowstone"); continue; }
      // the ground storey's back walls are pale, so the shopfront glass reads as a lit shop, not a dark panel
      put(c.x, y, c.z, y === c.T - 1 ? "smooth_stone" : c.T === 8 && y <= 3 ? "smooth_quartz" : "stone");
      continue;
    }
    if (y === c.g) put(c.x, y, c.z, "polished_andesite");                  // base course
    else if (y === c.T - 1) put(c.x, y, c.z, "smooth_quartz");              // cornice
    else if (c.T === 8 && y === 4) put(c.x, y, c.z, "smooth_quartz");       // storey string course
    else if (isGlass(c, c.face, y)) { put(c.x, y, c.z, "glass_pane"); glass.add(k); }
    else put(c.x, y, c.z, "bricks");
  }
}

// the entrance: door on the NW face, a dark oak canopy over the door and its neighbours
if (doorCell) {
  const { x, z, g } = doorCell;
  const st = { facing: FACING[doorCell.face], hinge: "left", open: "false", powered: "false" };
  put(x, doorRows[0], z, "dark_oak_door", { ...st, half: "lower" });
  put(x, doorRows[1], z, "dark_oak_door", { ...st, half: "upper" });
  glass.delete(key(x, doorRows[0], z)); glass.delete(key(x, doorRows[1], z));
  for (const c of canopy) put(c.x, 4, c.z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// the plant box: brick walls, a quartz cap, a stone roof, a lantern on top
if (plant) {
  for (let i = 0; i < 9; i++) {
    const x = plant.x0 + (i % 3), z = plant.z0 + Math.floor(i / 3), edge = i !== 4;
    put(x, 8, z, edge ? "bricks" : "stone");
    put(x, 9, z, edge ? "smooth_quartz" : "stone");
    put(x, 10, z, "smooth_stone");
  }
  put(plant.x0 + 1, 11, plant.z0 + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// glass panes connect to the solid neighbours they meet along the face (not through the wall, not to air or to slabs)
const solid = (x, y, z) => { const p = plan.get(key(x, y, z)); return p && p.block !== "glass_pane" && !/slab|door|lantern/.test(p.block); };
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const s = { north: String(solid(x, y, z - 1) || glass.has(key(x, y, z - 1))), south: String(solid(x, y, z + 1) || glass.has(key(x, y, z + 1))),
    east: String(solid(x + 1, y, z) || glass.has(key(x + 1, y, z))), west: String(solid(x - 1, y, z) || glass.has(key(x - 1, y, z))), waterlogged: "false" };
  plan.set(k, { block: "glass_pane", state: s });
}

const out = new Voxels([17, 21, 17]);
for (const [k, { block, state }] of plan) { const [x, y, z] = k.split(",").map(Number); out.set(x, y, z, block, state); }
const info = out.save(`${dir}/way_332241850.nbt`);
console.log(JSON.stringify({ ...info, footprint: F.size, tiers: { t8: mains.length, t6: F.size - mains.length }, door: doorCell ? [doorCell.x, doorCell.z] : null, plant: plant ? [plant.x0, plant.z0] : null, lit: [...gaps.values()].filter(Boolean).length }));
