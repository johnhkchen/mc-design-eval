import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0589-22F";
const W = 119, H = 119, D = 75;

// Design record: built 2007, roof ~107 blocks, ~21 storeys of 5 blocks.
// Glass-curtain office tower with white concrete piers, a granite base,
// a setback at y=80, a central street entrance and a rooftop plant room.
const ROOF = 107;
const SB = 80;
const SBD = 6;
const PENT_D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const inFP = (x, z) => G.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const XY = cells.map(c => [c[0], c[1]]);

// Distance from the outside edge (1 = perimeter cell), by BFS over 4-neighbours.
const dist = new Map();
const q = [];
for (const [x, z] of XY) {
  if (NB.some(([dx, dz]) => !inFP(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inFP(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      q.push([nx, nz]);
    }
  }
}
const D_ = (x, z) => dist.get(key(x, z)) ?? 0;

// Outward-facing neighbours at height y. Above the setback the lower tier
// no longer walls the upper tier, so its inner edge becomes exposed.
function outward(x, z, y) {
  const out = [];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz) || (y > SB && D_(nx, nz) < SBD)) out.push([dx, dz]);
  }
  return out;
}

// Centroid, used for the entrance and the spire.
let sx = 0, sz = 0;
for (const [x, z] of XY) { sx += x; sz += z; }
sx /= XY.length; sz /= XY.length;

// Plant-room / spire cell: nearest to the centroid among deep interior cells.
let spire = null, best = Infinity;
for (const [x, z] of XY) {
  if (D_(x, z) < PENT_D) continue;
  const d = (x - sx) ** 2 + (z - sz) ** 2;
  if (d < best) { best = d; spire = [x, z]; }
}

const g = new Voxels([W, H, D]);
const paneProps = { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" };

// Street-facing entrance: the north (min-z) perimeter, centred on the footprint.
const entranceCells = XY.filter(([x, z]) => D_(x, z) === 1 && !inFP(x, z - 1) && Math.abs(x - sx) <= 4);
const entranceX = Math.round(sx);

for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const d = D_(x, z);
  const top = d >= SBD ? ROOF : SB;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= top; y++) {
    const out = outward(x, z, y);

    if (y === top) {
      g.set(x, y, z, "white_concrete"); // roof slab / setback ledge
      if (out.length > 0) {
        g.set(x, y + 1, z, "white_concrete"); // parapet
        g.set(x, y + 2, z, "white_concrete");
      }
      continue;
    }

    if (out.length > 0) {
      const corner = out.length >= 2 && out.some(o => o[0] !== 0) && out.some(o => o[1] !== 0);
      const [dx] = out[0];
      const idx = dx !== 0 ? z : x;
      // Two-block piers every fourth bay give the facade depth and rhythm.
      const pier = corner || idx % 4 === 0 || idx % 4 === 1;
      const rel = y % 5;
      const upper = y > SB;
      const belt = y % 15 === 0 && !upper; // stone belt course every three storeys

      if (!upper && y - ground < 4) {
        // Ground-floor shopfront: granite base course, then glass with piers.
        if (y === ground) g.set(x, y, z, "polished_granite");
        else if (pier) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "light_blue_stained_glass");
      } else if (belt) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (pier || rel === 0) {
        g.set(x, y, z, "white_concrete");
      } else if (rel === 4) {
        g.set(x, y, z, "light_gray_concrete"); // sill band
      } else {
        g.set(x, y, z, upper ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", paneProps);
      }
    } else {
      // Interior: floor slab per storey, air gap behind the glass, sparse warm lights.
      if (y % 5 === 0 || y === ground) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (d === 2 && y % 5 === 2 && ((x * 31 + z * 17 + y * 7) % 11 === 0)) {
        g.set(x, y, z, "shroomlight");
      }
    }
  }

  // Rooftop plant room on the deep interior.
  if (d >= PENT_D) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, ROOF + 5, z, "white_concrete");
  }
}

// Central street entrance: glass foyer with a double door and a lantern above.
for (const [x, z] of entranceCells) {
  const gr = G.get(key(x, z));
  const ground = Math.round(gr);
  const centre = x === entranceX;
  for (let y = ground; y <= ground + 3; y++) {
    if (y === ground + 3) {
      g.set(x, y, z, centre ? "sea_lantern" : "white_concrete");
    } else if (centre && y === ground) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (centre && y === ground + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Light spire on the plant room, topped with a warm lantern.
if (spire) {
  const [x, z] = spire;
  for (let y = ROOF + 6; y <= 115; y++) g.set(x, y, z, "white_concrete");
  g.set(x, 116, z, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
