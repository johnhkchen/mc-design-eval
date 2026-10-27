// Auckland way 433838964: a three-storey brick commercial block of the interwar years (the Queen St / Karangahape Rd
// type), built round an open paved court. The lidar roof (3x3 median) snaps to flat tiers on the 4-block storey grid:
// court (none), one storey (4), two (8), three (12), so the block steps down to its west and north edges. Foundations
// run from y 0 to each cell's ground. Red brick piers and infill, cream quartz string courses and parapet, a dark-oak
// shopfront fascia and glass shopfronts on the ground storey, a dark-oak entrance with a canopy on the lowest-facing
// street side, glowstone behind some panes, and plant on the top roof. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${SRC}/way_433838964.cells.json`, "utf8"));
const SIZE = [41, 25, 27];

const key = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));

// roof: 3x3 median of the lidar heights (noise out), then flat tiers: 0 court, 4, 8, 12
const tier = (r) => (r < 3 ? 0 : r < 6 ? 4 : r < 10 ? 8 : 12);
const C = new Map();
for (const [k, { g, r }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = raw.get(key(x + dx, z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  C.set(k, { x, z, g, t: tier(v[v.length >> 1]) });
}
const cell = (x, z) => C.get(key(x, z));
// lone lidar spikes are not towers: a cell with no building neighbour becomes court, one with a single neighbour
// cannot stand above that neighbour's tier
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const c of C.values()) {
  if (!c.t) continue;
  const nb = DIRS.map(([dx, dz]) => cell(c.x + dx, c.z + dz)).filter(n => n && n.t > 0);
  if (!nb.length) c.t = 0;
  else if (nb.length === 1) c.t = Math.min(c.t, nb[0].t);
}
// the solid column at (x, z) runs y 0 .. top-1: a building to its tier, a court to its paving (ground top)
const top = (x, z) => { const c = cell(x, z); return c ? (c.t > 0 ? c.t : c.g) : 0; };
const solid = (x, y, z) => y < top(x, z);
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
// the sides of a building cell's layer y that open to air (beyond the footprint, a court, or a lower tier)
const openSides = (c, y) => (c.t > 0 && y >= c.g && y < c.t ? DIRS.filter(([dx, dz]) => !solid(c.x + dx, y, c.z + dz)) : []);

// the entrance: the outward side with the most ground-storey faces, at the middle of its run
const groundFaces = new Map();
for (const c of C.values()) for (const [dx, dz] of openSides(c, c.g)) groundFaces.set(`${dx},${dz}`, (groundFaces.get(`${dx},${dz}`) || 0) + 1);
const [doorSide] = [...groundFaces].sort((a, b) => b[1] - a[1])[0];
const [ddx, ddz] = doorSide.split(",").map(Number);
const alongU = (x, z) => (ddx !== 0 ? z : x);            // the coordinate that runs along a face
const doorRun = [...C.values()].filter(c => c.t > 0 && openSides(c, c.g).some(([dx, dz]) => dx === ddx && dz === ddz));
doorRun.sort((a, b) => alongU(a.x, a.z) - alongU(b.x, b.z));
const door = doorRun[doorRun.length >> 1];

const plan = new Map();
const put = (x, y, z, block, state, extra) => plan.set(key3(x, y, z), { x, y, z, block, state, ...extra });

for (const c of C.values()) {
  const { x, z, g, t } = c;
  if (!t) {                                                // court: fill to the ground and pave its top
    for (let y = 0; y < g; y++) put(x, y, z, y === g - 1 ? "smooth_sandstone" : "stone");
    continue;
  }
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");   // foundation to the lowest ground
  for (let y = g; y < t; y++) {
    const open = openSides(c, y);
    const floorLine = y === g || y % 4 === 0;               // ground line and each storey's floor
    const roofTop = y === t - 1;
    if (!open.length) {                                      // enclosed: floor slabs and the roof deck; the rest is air
      if (roofTop || floorLine) put(x, y, z, "smooth_stone");
      continue;
    }
    const [dx, dz] = open[0];
    const s = Math.floor(y / 4), k = y % 4;
    if (roofTop) put(x, y, z, "smooth_quartz");                      // parapet cap
    else if (y === g) put(x, y, z, "polished_andesite");             // base course
    else if (k === 0) put(x, y, z, "smooth_quartz");                  // storey string course
    else if (k === 3 && s === 0) put(x, y, z, "dark_oak_planks");     // shopfront fascia
    else if (k === 3) put(x, y, z, "bricks");                         // head course
    else {
      const u = dx !== 0 ? z : x;                                    // window zone: piers on a 3-block rhythm
      if (u % 3 === 0) put(x, y, z, s === 0 ? "stone_bricks" : "bricks");
      else {
        const along = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false" }
                               : { north: "false", south: "false", east: "true", west: "true" };
        put(x, y, z, "glass_pane", along, { glass: true, dx, dz });
      }
    }
  }
}

// the entrance: a dark-oak door in the middle bay of the ground storey, a slab canopy over it
if (door) {
  const [dx, dz] = [ddx, ddz];
  const facing = FACING[`${dx},${dz}`];
  const door2 = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g, door.z, "dark_oak_door", door2("lower"));
  put(door.x, door.g + 1, door.z, "dark_oak_door", door2("upper"));
  for (const du of [-1, 0, 1]) {
    const cx = dx !== 0 ? door.x : door.x + du, cz = dx !== 0 ? door.z + du : door.z;
    const c = cell(cx, cz);
    if (c && c.t > 0 && door.g + 2 < c.t && openSides(c, door.g + 2).some(([a, b]) => a === dx && b === dz))
      put(cx, door.g + 2, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm light: glowstone on the air side of some panes (only where the cell behind is enclosed air)
for (const p of [...plan.values()]) {
  if (!p.glass || (p.x * 7 + p.z * 3 + p.y) % 5 !== 0) continue;
  const c = cell(p.x - p.dx, p.z - p.dz);
  if (!c || c.t === 0 || p.y < c.g || p.y >= c.t || p.y % 4 === 0 || p.y === c.g || p.y === c.t - 1) continue;
  if (plan.has(key3(c.x, p.y, c.z))) continue;
  put(c.x, p.y, c.z, "glowstone");
}

// roof plant: light grey condenser units on the enclosed top roof, a few cells apart
for (const c of C.values()) {
  if (c.t !== 12 || openSides(c, 11).length) continue;
  if ((c.x * 5 + c.z * 3) % 13 === 0) put(c.x, 12, c.z, "light_gray_concrete");
}

const V = new Voxels(SIZE);
for (const p of plan.values()) V.set(p.x, p.y, p.z, p.block, p.state);
const out = V.save(`${SRC}/way_433838964.nbt`);
console.log(`way_433838964: ${out.blocks} blocks, ${out.palette} palette entries`);
