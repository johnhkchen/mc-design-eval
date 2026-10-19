// 59 West 46th Street (1906): a Renaissance Revival commercial and office loft in buff brick on a granite base, with calcite
// (limestone) belt courses at every storey line, a chiselled frieze and cornice under a parapet, and a shopfront with a
// recessed entrance. Storeys are 3 blocks (belts on y % 3 == 0). Roof tiers are the lidar roof medians over a 5x5 window
// of the footprint (roof 0-1 is no return and is filled from its neighbours), snapped to 3-block tiers so the massing
// steps back cleanly. The shell is one block thick: glass sits in the outer ring, air behind it, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1081126.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [17, 56, 52];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));

// Tier per cell: median of the valid lidar roofs (>= 5) in a 5x5 window, snapped to 3-block tiers within 9..45.
const S = new Map();
for (const [key, { g }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = raw.get(k2(x + dx, z + dz)); if (c && c.r >= 5) vals.push(c.r);
  }
  vals.sort((a, b) => a - b);
  const med = vals.length ? vals[Math.floor(vals.length / 2)] : 9;
  S.set(key, { g, H: Math.min(45, Math.max(g + 6, 9, Math.round(med / 3) * 3)) });
}
const cell = (x, z) => S.get(k2(x, z));
const occ = (x, z, y) => { const c = cell(x, z); return !!c && y >= c.g && y < c.H; };
const facing = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));   // unoccupied neighbours = outward faces
const wallAt = (x, z, y) => occ(x, z, y) && facing(x, z, y).length > 0;

// Panes connect to their run: a face on the z side runs along x (east/west), a face on the x side along z.
const pane = (dirs) => {
  const xRun = dirs.some(([, dz]) => dz !== 0), zRun = dirs.some(([dx]) => dx !== 0);
  return { north: String(zRun), south: String(zRun), east: String(xRun), west: String(xRun) };
};
const onZFace = (dirs) => dirs.some(([, dz]) => dz !== 0);
const onXFace = (dirs) => dirs.some(([dx]) => dx !== 0);
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 9 === 0;   // a warm glow in about one window in nine

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Entrance: the middle of the south (highest z) street front.
const maxZ = Math.max(...[...S.keys()].map((k) => Number(k.split(",")[1])));
const frontXs = [...S.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const xm = frontXs[Math.floor(frontXs.length / 2)];

for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) {
    if (y < gr) { put(x, y, z, "polished_granite"); continue; }   // foundation down to the lowest ground under the cell
    const dirs = facing(x, z, y);
    if (dirs.length === 0) {
      // Interior: a floor slab per storey, and the roof surface on top of the cell.
      if (y === H - 1) put(x, y, z, "smooth_stone");
      else if (y % 3 === 0 && y > 0) put(x, y, z, "smooth_stone");
      continue;
    }
    // Outer shell.
    if (y >= H - 3) {                                             // cornice: frieze, then calcite course and cap
      put(x, y, z, y === H - 3 ? "chiseled_stone_bricks" : "calcite");
      continue;
    }
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }   // base course
    if (y % 3 === 0) { put(x, y, z, y < 3 ? "polished_granite" : "calcite"); continue; }   // belt course at each storey line
    const pierHere = (onZFace(dirs) && x % 3 === 0) || (onXFace(dirs) && z % 3 === 0);
    if (pierHere) { put(x, y, z, y < 3 ? "polished_granite" : "bricks"); continue; }
    put(x, y, z, "glass_pane", pane(dirs));
    // Warm light in the room behind the glass (the interior cell inward), upper floors only.
    if (y >= 4 && lit(x, y, z)) {
      for (const [dx, dz] of dirs) {
        const ix = x - dx, iz = z - dz;
        if (occ(ix, iz, y) && !wallAt(ix, iz, y) && y < H - 1 && y % 3 !== 0) { put(ix, y, iz, "glowstone"); break; }
      }
    }
  }
  // Parapet on the outer edge, one block above the roof.
  if (facing(x, z, H - 1).length) put(x, H, z, "calcite");
}

// Entrance bay on the street front: granite posts, a dark wood door, and a dark canopy band over it.
for (let x = xm - 2; x <= xm + 2; x++) {
  if (!S.has(k2(x, maxZ))) continue;
  put(x, 3, maxZ, "dark_oak_planks");                                       // canopy
  if (x === xm) {
    put(x, 1, maxZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, maxZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else if (Math.abs(x - xm) === 1) {
    put(x, 1, maxZ, "polished_granite"); put(x, 2, maxZ, "polished_granite");
  }
}

// Water tank on the roof: the largest 3x3 block of flat roof at one tier, a spruce tank with a pyramidal cap.
let best = null;
for (const [key, { H }] of S) {
  const [x, z] = key.split(",").map(Number);
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
    const c = cell(x + dx, z + dz);
    ok = !!c && c.H === H && facing(x + dx, z + dz, H - 1).length === 0;
  }
  if (ok && (!best || H > best.H)) best = { x, z, H };
}
if (best) {
  const { x: bx, z: bz, H } = best;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = bx + 1 + dx, z = bz + 1 + dz;
    for (let y = H; y < H + 3; y++) put(x, y, z, dx === 0 && dz === 0 ? "spruce_log" : "spruce_planks");
    put(x, H + 3, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
  put(bx + 1, H + 4, bz + 1, "spruce_planks");
}

g.save(`${FILL}/NYC1081126.nbt`);
