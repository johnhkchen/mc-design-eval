// SAP Tower, Auckland CBD: a late-20th-century glass office tower on a concrete podium, about 30 storeys of 4 blocks. The
// lidar gives a 6-storey podium (roof near y 24) across most of the 92 x 71 footprint, a 30s-block wing on the south and
// east, and a tower core stepping up to a roof near y 124. Each cell's roof is the lidar's height, median-smoothed over
// 5 x 5 and cut to whole storeys (multiples of 4 from y 0), then median-cleaned again so the tiers are flat, not speckled.
// Storey lines sit at absolute multiples of 4 above the first floor, so every floor stands on the one below. The plinth
// is stone from each cell's ground to the first floor, so the downhill side shows the extra storeys. Facades: white
// concrete piers on a 4-block bay, glazing in two rows, a grey spandrel; a stone shopfront at street level; a concrete
// entrance with a canopy. Interiors are air behind the glass with a slab per floor; some offices are lit.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_911391687.cells.json`, "utf8"));
const W = 92, D = 71, Y = 139, STOREY = 4, PARAPET = 2;

const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const ground = grid(-1), roofRaw = grid(-1);
for (const [x, z, g, r] of cells) { ground[x][z] = g; roofRaw[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// median over the footprint cells within r (a square), the lower middle value so the result is a real input value
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const smooth = (src, r) => {
  const out = grid(-1);
  for (const [x, z] of cells) {
    const v = [];
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (inside(x + dx, z + dz)) v.push(src[x + dx][z + dz]);
    out[x][z] = median(v);
  }
  return out;
};

// storey datum per cell: the first floor plate is the first multiple of 4 above its ground (a stone plinth of 1-4 blocks);
// all plates are multiples of 4, so floors line up across the footprint
const plate0 = grid(-1);
for (const [x, z] of cells) plate0[x][z] = 4 * Math.ceil((ground[x][z] + 1) / STOREY);

// roof: the lidar median-smoothed, cut down to a storey line, then cleaned again so the tiers are flat
const roofS = smooth(roofRaw, 2);
const topQ = grid(-1);
for (const [x, z] of cells) topQ[x][z] = Math.max(plate0[x][z] + STOREY, STOREY * Math.floor(roofS[x][z] / STOREY));
const top = smooth(topQ, 2);
for (const [x, z] of cells) top[x][z] = Math.max(plate0[x][z] + STOREY, top[x][z]);
const storeys = grid(0);
let maxTop = 0;
for (const [x, z] of cells) { storeys[x][z] = (top[x][z] - plate0[x][z]) / STOREY; maxTop = Math.max(maxTop, top[x][z]); }

// a cell has air at a floor's band (y b+1..b+3) if it is in the footprint, its storey reaches that band, and the band
// is above its plinth; a face is exterior when the neighbour has no air there
const hasAir = (x, z, b) => inside(x, z) && plate0[x][z] <= b && b + STOREY <= top[x][z];
const exteriorDirs = (x, z, b) => DIRS.filter(([dx, dz]) => !hasAir(x + dx, z + dz, b));
const isEdge = (x, z, y) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || top[x + dx][z + dz] < y);

// materials: podium (the first floors, to y 28) in light grey with cyan glass; the tower in white piers, blue glass
const PLINTH = "stone_bricks", BASE = "smooth_stone", FOUND = "stone";
const SLAB = "white_concrete", ROOF = "light_gray_concrete", CAP = "smooth_stone_slab";
const podium = (b) => b < 28;
const PIER = (b) => (podium(b) ? "light_gray_concrete" : "white_concrete");
const GLASS = (b) => (podium(b) ? "cyan_stained_glass" : "light_blue_stained_glass");
const SPAN = "gray_concrete";

const g = new Voxels([W, Y, D]);

// foundation (solid to the ground), plinth (stone from the ground to the first floor, base course on top)
for (const [x, z] of cells) {
  const p = plate0[x][z], gr = ground[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  for (let y = gr; y < p; y++) g.set(x, y, z, y === p - 1 ? BASE : PLINTH);
}

// floor slabs at every storey line (the first floor to the roof), with air between them inside the footprint
for (const [x, z] of cells) {
  for (let b = plate0[x][z]; b <= top[x][z]; b += STOREY) g.set(x, b, z, b === top[x][z] ? ROOF : SLAB);
}

// the entrance: a south-facing ground-floor face in the lowest, most central part of the street front
const southGround = cells.filter(([x, z]) => exteriorDirs(x, z, plate0[x][z]).some(([dx, dz]) => dx === 0 && dz === 1));
const lowest = Math.min(...southGround.map(([x, z]) => ground[x][z]));
const street = southGround.filter(([x, z]) => ground[x][z] <= lowest + 1);
const midX = street.map(([x]) => x).sort((a, b) => a - b)[street.length >> 1];
const [doorX, doorZ] = street.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best), street[0]);
const doorB = plate0[doorX][doorZ];

// facades: each floor's exterior faces, a pier on a 4-block bay, two rows of glass, a spandrel; a shopfront on the ground floor
const litCells = [];
for (let j = 0; ; j++) {
  let any = false;
  for (const [x, z] of cells) {
    const b = plate0[x][z] + STOREY * j;
    if (b >= top[x][z]) continue;
    any = true;
    const out = exteriorDirs(x, z, b);
    if (out.length === 0) continue;                                   // interior: air behind the glass
    if (out.length >= 2) { for (let y = b + 1; y <= b + 3; y++) g.set(x, y, z, PIER(b)); continue; }
    const [dx, dz] = out[0];
    const along = dz !== 0 ? x : z;
    const pier = along % 4 === 0;
    if (j === 0) {
      if (x === doorX && z === doorZ && dz === 1) {
        g.set(x, b + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, b + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        g.set(x, b + 3, z, "smooth_stone");
        continue;
      }
      for (let y = b + 1; y <= b + 2; y++) g.set(x, y, z, pier ? PIER(b) : GLASS(b));
      g.set(x, b + 3, z, pier ? PIER(b) : "smooth_stone");
      continue;
    }
    for (let y = b + 1; y <= b + 2; y++) g.set(x, y, z, pier ? PIER(b) : GLASS(b));
    g.set(x, b + 3, z, pier ? PIER(b) : SPAN);
    if (!pier) litCells.push([x, z, dx, dz, b]);
  }
  if (!any) break;
}
// the canopy over the entrance: a stone slab course over the door bay
for (const dxz of [-1, 0, 1]) {
  const x = doorX + dxz;
  if (inside(x, doorZ)) g.set(x, doorB + 3, doorZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light: a glowstone just inside some lit offices, on the floor slab, where the room behind the glass is air
litCells.forEach(([x, z, dx, dz, b], i) => {
  if (i % 9 !== 0) return;
  const ix = x - dx, iz = z - dz;
  if (hasAir(ix, iz, b) && exteriorDirs(ix, iz, b).length === 0) g.set(ix, b + 1, iz, "glowstone");
});

// roof: a parapet with a stone cap on the roof's edge (and on every setback edge), and plant boxes and roof lights on a grid
for (const [x, z] of cells) {
  const T = top[x][z];
  if (isEdge(x, z, T)) {
    g.set(x, T + 1, z, PIER(T));
    g.set(x, T + 2, z, CAP, { type: "bottom", waterlogged: "false" });
  } else if (x % 8 === 4 && z % 8 === 4 && T + 2 <= 126) {
    g.set(x, T + 1, z, "iron_block");
    g.set(x, T + 2, z, "light_gray_concrete");
  } else if (x % 8 === 0 && z % 8 === 0 && T + 1 <= 126) {
    g.set(x, T + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const stats = g.save(`${dir}/way_911391687.nbt`);
console.log(`way_911391687: ${maxTop} top, ${Math.max(...cells.map(([x, z]) => storeys[x][z]))} tower storeys, ${stats.blocks} blocks, ${stats.palette} palette, door at ${doorX},${doorZ}`);
