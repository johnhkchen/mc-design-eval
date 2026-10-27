// Way 1014529459: an 11 x 11 interwar brick commercial block on the Mt Eden / CBD fringe. Three storeys of red brick
// over a shopfront, cream terracotta string courses and cornice, a stone coping. Lidar roof 14 blocks over the bulk,
// 15 on the west band: that band is a raised setback tier (its own wall to 14, solid deck at 14).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529459.cells.json", "utf8"));
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// outward directions: north is -z, south +z, east +x, west -x
const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];
const exterior = (x, z) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz));

// a window bay: a single exposed face, and an odd index along it (corners and the piers between bays stay brick)
const bayIndex = (x, z, [dx]) => (dx !== 0 ? z : x);
const isWindow = (x, z) => {
  const ext = exterior(x, z);
  if (ext.length !== 1) return false;
  const u = bayIndex(x, z, ext[0]);
  return u % 2 === 1 && u >= 1 && u <= 9;
};

// the entrance: a window bay on the north face, nearest the median of the north bays
const northBays = [];
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const ext = exterior(x, z);
  if (ext.length === 1 && ext[0][1] === -1 && isWindow(x, z)) northBays.push(x);
}
northBays.sort((a, b) => a - b);
const doorX = northBays[Math.floor(northBays.length / 2)];
const doorCell = [...foot.keys()].find((k) => {
  const [x, z] = k.split(",").map(Number);
  const ext = exterior(x, z);
  return x === doorX && ext.length === 1 && ext[0][1] === -1;
});

const GLASS = (dx, dz) => ({ north: dz !== 0 ? "false" : "true", south: dz !== 0 ? "false" : "true",
  east: dz !== 0 ? "true" : "false", west: dz !== 0 ? "true" : "false", waterlogged: "false" });
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([11, 28, 11]);

for (const [key, { roof }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const top = roof - 1;                          // the roof deck: the top block of the mass
  const ext = exterior(x, z);
  const perimeter = ext.length > 0;

  g.set(x, 0, z, "stone_bricks");                // foundation and plinth under every cell
  for (const y of [4, 8, 12]) g.set(x, y, z, perimeter ? "white_terracotta" : "smooth_stone");   // floor slabs and string courses

  if (!perimeter) {
    if (roof === 15) g.set(x, 13, z, "smooth_stone");   // the raised tier is solid up to its deck
    g.set(x, top, z, "smooth_stone");
    continue;
  }

  const win = isWindow(x, z);
  const [dx, dz] = ext[0];                       // a single exposed face sets the glass orientation
  const corner = ext.length > 1;
  const isDoor = key === doorCell;

  g.set(x, top, z, "stone_bricks");              // coping
  for (let y = 1; y < top; y++) {
    if (y === 1) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y <= 3) {                                 // shopfront
      if (isDoor && y === 1) { g.set(x, 1, z, "dark_oak_door", DOOR("lower")); continue; }
      if (isDoor && y === 2) { g.set(x, 2, z, "dark_oak_door", DOOR("upper")); continue; }
      if (isDoor && y === 3) { g.set(x, 3, z, "white_terracotta"); continue; }
      g.set(x, y, z, win && !corner ? "glass_pane" : "polished_andesite", win && !corner ? GLASS(dx, dz) : undefined);
      continue;
    }
    if (y === 4 || y === 8 || y === 12) continue;   // done above
    const lit = win && !corner;
    const masonry = corner ? "white_terracotta" : "bricks";   // cream quoins on the corners
    if (y === 5 || y === 9) { g.set(x, y, z, lit ? "white_terracotta" : masonry); continue; }   // sills
    if (y === 6 || y === 7 || y === 10 || y === 11) {
      g.set(x, y, z, lit ? "glass_pane" : masonry, lit ? GLASS(dx, dz) : undefined);
      continue;
    }
    g.set(x, y, z, masonry);                     // the top band of the raised tier
  }
}

// warm light behind a share of the window bays: a glowstone in the room behind the glass (interior cells only)
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (!isWindow(x, z)) continue;
  const [dx, dz] = exterior(x, z)[0];
  const bx = x - dx, bz = z - dz;
  if (!inFoot(bx, bz) || exterior(bx, bz).length) continue;
  if ((x * 3 + z) % 4 === 0) g.set(bx, 6, bz, "glowstone");
  if ((x + z * 3) % 4 === 1) g.set(bx, 10, bz, "glowstone");
}

// roof plant: three units on the lower interior roof, standing on the deck
const plant = [...foot.entries()].filter(([k, v]) => {
  const [x, z] = k.split(",").map(Number);
  return v.roof === 14 && exterior(x, z).length === 0;
}).sort((a, b) => (b[0].split(",").map(Number).reduce((s, n) => s + n, 0)) - (a[0].split(",").map(Number).reduce((s, n) => s + n, 0)));
for (const [k] of plant.slice(0, 3)) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, 14, z, "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529459.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
