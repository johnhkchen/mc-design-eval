// OSM way 270515794: an anonymous single-storey commercial block (mid-century render over a basalt base, flat parapeted
// roof with skylights and plant), built from the lidar's footprint heights. Roof 0 is an open yard; roof 3/4/5 are the
// lower wing, the middle wing and the main hall. Only the envelope is built: floor slabs, perimeter walls, roof slabs,
// columns and hanging lanterns; the rest of the volume is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270515794.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 56, D = 41, Y = 18;
const g = new Voxels([W, Y, D]);

const M = {
  base: "stone_bricks",            // basalt-like floor slab and foundation
  plinth: "deepslate_bricks",      // dark base course
  wall: "smooth_quartz",           // cream render
  pier: "quartz_pillar",           // window piers
  cap: "stone_bricks",             // parapet coping
  roof: "light_gray_concrete",     // membrane roof over the interior
  column: "polished_andesite",     // interior structure on an 8-block grid
  glass: "glass_pane",
  shop: "light_blue_stained_glass",
  door: "dark_oak_door",
  canopy: "stone_brick_slab",
  skylight: "glass",
  plant: "gray_concrete",
  lantern: "lantern",
};

// smooth the lidar roof: each built cell takes the most common roof height among its 3x3 built neighbours (ties keep its own)
const raw = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { gr, r }]));
const cell = new Map();
for (const [x, z, gr, r] of cells) {
  if (r <= 0) continue;
  const n = {};
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = raw.get(`${x + dx},${z + dz}`); if (c && c.r > 0) n[c.r] = (n[c.r] || 0) + 1;
  }
  let H = r, best = n[r] || 0;
  for (const k in n) if (n[k] > best) { best = n[k]; H = +k; }
  cell.set(`${x},${z}`, { x, z, G: gr, H });
}
// a neighbour is open (outside, or a lower tier) for a cell of height H
const open = (x, z, H) => { const c = cell.get(`${x},${z}`); return !c || c.H < H; };
for (const c of cell.values()) {
  c.oX = open(c.x - 1, c.z, c.H) || open(c.x + 1, c.z, c.H);   // face runs along z
  c.oZ = open(c.x, c.z - 1, c.H) || open(c.x, c.z + 1, c.H);   // face runs along x
  c.env = c.oX || c.oZ;
}

// the entrance: the north-facing run of the tallest tier nearest the middle of its own span
const north = [...cell.values()].filter(c => open(c.x, c.z - 1, c.H));
const topH = Math.max(...north.map(c => c.H));
const front = north.filter(c => c.H === topH).sort((a, b) => a.x - b.x);
const mid = front[front.length >> 1];
const ex = mid.x, entZ = mid.z;
const inEntrance = (c) => c.z === entZ && Math.abs(c.x - ex) <= 2 && open(c.x, c.z - 1, c.H);

for (const c of cell.values()) {
  const { x, z, G, H } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, M.base);     // foundation up to the cell's ground
  g.set(x, G, z, M.base);                                  // floor slab, also the base course
  if (!c.env) {
    g.set(x, H - 1, z, M.roof);
    continue;
  }
  const corner = c.oX && c.oZ;
  for (let y = G + 1; y <= H - 1; y++) {
    if (y === H - 1) { g.set(x, y, z, M.cap); continue; }
    if (y === G + 1) { g.set(x, y, z, M.plinth); continue; }
    const glazed = y >= G + 2 && y <= H - 2 && !corner;
    if (!glazed) { g.set(x, y, z, M.wall); continue; }
    const bay = c.oZ ? x : z;                              // position along the face
    if (bay % 6 === 0) { g.set(x, y, z, M.pier); continue; }
    const run = c.oZ ? { north: "false", south: "false", east: "true", west: "true" }
                     : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, M.glass, { ...run, waterlogged: "false" });
  }
}

// interior: columns on the 8-block grid, hanging lanterns under the roof, skylight strips over the main hall
for (const c of cell.values()) {
  const { x, z, G, H } = c;
  if (c.env) continue;
  if (x % 8 === 0 && z % 8 === 0) for (let y = G + 1; y <= H - 2; y++) g.set(x, y, z, M.column);
  else if (x % 8 === 4 && z % 8 === 4 && H >= 4) g.set(x, H - 2, z, M.lantern, { hanging: "true", waterlogged: "false" });
  if (H === 5 && [10, 11, 30, 31, 50, 51].includes(x)) g.set(x, H - 1, z, M.skylight);
}

// the entrance: a recessed door in the front wall, shopfront glass either side, a lintel canopy over it
for (const c of north) {
  if (!inEntrance(c)) continue;
  const { x, z, G } = c;
  if (x === ex) {
    g.set(x, G + 1, z, M.door, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, G + 2, z, M.door, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    g.set(x, G + 1, z, M.plinth);
    g.set(x, G + 2, z, M.shop);
  }
}
for (const c of north) {
  if (c.z !== entZ || Math.abs(c.x - ex) > 3) continue;
  const y = c.G + 3;
  if (y < c.H - 1) g.set(c.x, y, c.z, M.canopy, { type: "bottom", waterlogged: "false" });
}

// roof plant: solid gray boxes on the main hall's roof, clear of the skylight strips
const h5 = (x, z) => { const c = cell.get(`${x},${z}`); return !!c && c.H === 5 && !c.env; };
const boxes = [];
for (let z = 2; z < D - 4 && boxes.length < 3; z++) for (let x = 2; x < W - 6 && boxes.length < 3; x++) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 6 && ok; dx++) {
    const bx = x + dx;
    if ([10, 11, 30, 31, 50, 51].includes(bx) || !h5(bx, z + dz)) ok = false;
  }
  if (ok && boxes.every(b => Math.abs(b.x - x) >= 10 || Math.abs(b.z - z) >= 8)) boxes.push({ x, z });
}
for (const { x: bx, z: bz } of boxes)
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 6; dx++)
    for (let y = 5; y <= 6; y++) g.set(bx + dx, y, bz + dz, M.plant);

g.save(`${DIR}/way_270515794.nbt`);
