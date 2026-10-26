import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86626";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 13 x 7, roof ~12 above lowest ground.
// Read as a 3-storey early-20th-century commercial block: red brick walls,
// pale stone bands, quartz corner piers, stone-brick plinth, stone-brick parapet.
const W = 13, D = 7, HT = 24;
const g = new Voxels([W, HT, D]);

const FOUND = "stone_bricks";
const WALL = "bricks";
const BAND = "smooth_stone";
const PIER = "quartz_block";
const PARAPET = "stone_brick_wall";
const GLASS = "glass_pane";
const LIGHT = "lantern";
const DOOR = "dark_oak_door";

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(key(x, z), { g: gr, r: roof });

// Massing: one clean roof tier from the median lidar roof, clamped to a sane storey count.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const gMax = Math.max(...cells.map(c => c[2]));
const H = Math.min(21, Math.max(gMax + 8, Math.round(med)));   // roof slab at H-1, parapet at H

function missingDirs(x, z) {
  const m = [];
  if (!cellMap.has(key(x, z - 1))) m.push("N");
  if (!cellMap.has(key(x, z + 1))) m.push("S");
  if (!cellMap.has(key(x - 1, z))) m.push("W");
  if (!cellMap.has(key(x + 1, z))) m.push("E");
  return m;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: on the south face, the cell nearest the middle of the frontage.
const southCells = cells.filter(([x, z]) => missingDirs(x, z).includes("S"));
let doorX = -1, doorZ = -1;
if (southCells.length) {
  const mx = southCells.reduce((a, c) => a + c[0], 0) / southCells.length;
  const best = southCells.reduce((a, c) => (Math.abs(c[0] - mx) < Math.abs(a[0] - mx) ? c : a));
  doorX = best[0];
  doorZ = best[1];
}
const doorKey = key(doorX, doorZ);

// Foundation, floors, walls, windows, entrance surround.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // floor slabs across the whole footprint at each storey line
  for (let y = gr; y < H - 1; y += 4) g.set(x, y, z, BAND);
  // roof slab
  g.set(x, H - 1, z, BAND);

  const m = missingDirs(x, z);
  if (m.length === 0) continue; // interior: air gap + slabs only

  const corner = m.length >= 2;
  const face = m.length === 1 ? m[0] : null;
  const t = (face === "N" || face === "S") ? x : z;
  const isDoorCell = key(x, z) === doorKey;
  // cells flanking the entrance get solid quartz jambs so the door reads as an opening
  const isJamb = face === "S" && z === doorZ && Math.abs(x - doorX) === 1;

  for (let y = gr + 1; y <= H - 2; y++) {
    const r = (y - gr) % 4;
    if (r === 0) { g.set(x, y, z, BAND); continue; }          // storey band
    if (corner || isJamb) { g.set(x, y, z, PIER); continue; }
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, DOOR, { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCell && y === gr + 3) { g.set(x, y, z, BAND); continue; } // lintel over door
    const bay = t % 2 === 1;
    if (bay && (r === 1 || r === 2)) {
      const props = (face === "N" || face === "S")
        ? { east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", waterlogged: "false" };
      g.set(x, y, z, GLASS, props);
      continue;
    }
    if (bay && r === 3) { g.set(x, y, z, BAND); continue; }   // lintel
    g.set(x, y, z, WALL);
  }

  g.set(x, H, z, PARAPET);
}

// Warm lights just inside some windows (interior cell must share the same ground).
for (const [x, z, gr] of cells) {
  const m = missingDirs(x, z);
  if (m.length !== 1) continue;
  const face = m[0];
  const t = (face === "N" || face === "S") ? x : z;
  if (t % 4 !== 1) continue;
  const [dx, dz] = inward[face];
  const ik = key(x + dx, z + dz);
  if (!cellMap.has(ik) || missingDirs(x + dx, z + dz).length !== 0) continue;
  if (cellMap.get(ik).g !== gr) continue;
  for (let s = 0; gr + 4 * s + 2 < H - 1; s++) {
    const wy = gr + 4 * s + 1;
    if ((s + t) % 2 === 0) g.set(x + dx, wy, z + dz, LIGHT, { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
